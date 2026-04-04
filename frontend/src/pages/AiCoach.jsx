import { useState, useEffect, useRef, useCallback } from 'react'
import ReactMarkdown from 'react-markdown'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { getHealthHistory, getTodayWater, getStreaks } from '../api'
import BottomNav from '../components/BottomNav'

export default function AiCoach() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [userContext, setUserContext] = useState('')
  const [showChips, setShowChips] = useState(true)
  const [loadingHistory, setLoadingHistory] = useState(true)
  const messagesEndRef = useRef(null)
  const chatRef = useRef(null)
  const historyLoadedRef = useRef(false)

  const CHIPS = [
    "What's my health risk?",
    "How much water should I drink?",
    "Give me a meal plan",
    "How can I improve my score?"
  ]

  // ─── Load chat history + health context on mount ─────────────────
  useEffect(() => {
    if (!user) return
    loadChatHistory()
    buildContext()
  }, [user])

  const loadChatHistory = async () => {
    if (historyLoadedRef.current) return
    historyLoadedRef.current = true
    setLoadingHistory(true)

    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(100)

      if (!error && data && data.length > 0) {
        const loaded = data.map(m => ({
          role: m.role,
          text: m.content,
          timestamp: m.created_at,
        }))
        setMessages(loaded)
        setShowChips(false)
      }
    } catch (e) {
      console.warn('Failed to load chat history:', e)
    } finally {
      setLoadingHistory(false)
    }
  }

  const buildContext = async () => {
    try {
      const [healthRes, waterRes, streakRes] = await Promise.all([
        getHealthHistory(user.id).catch(() => ({ data: [] })),
        getTodayWater(user.id).catch(() => ({ data: { glasses: 0 } })),
        getStreaks().catch(() => ({ data: null })),
      ])
      const health = healthRes.data || []
      const latest = health[0]
      const water = waterRes.data
      const streak = streakRes.data

      let ctx = 'User profile:\n'
      if (latest) {
        ctx += `- Latest risk score: ${latest.risk_score}/100 (${latest.risk_level})\n`
        if (latest.age) ctx += `- Age: ${latest.age}\n`
        if (latest.bmi) ctx += `- BMI: ${latest.bmi}\n`
        if (latest.systolic_bp) ctx += `- Blood pressure: ${latest.systolic_bp}\n`
        if (latest.cholesterol) ctx += `- Cholesterol: ${latest.cholesterol}\n`
        if (latest.glucose) ctx += `- Glucose: ${latest.glucose}\n`
      } else {
        ctx += '- No health checks completed yet\n'
      }
      ctx += `- Water today: ${water.glasses || 0} glasses\n`
      if (streak) {
        ctx += `- Streak: ${streak.overall_streak || streak.login_streak || 0} days\n`
      }
      setUserContext(ctx)

      // Only add welcome message if no history was loaded
      setMessages(prev => {
        if (prev.length > 0) return prev
        return [{
          role: 'ai',
          text: latest
            ? `Hi! 👋 I can see your latest risk score is **${latest.risk_score}/100** (${latest.risk_level}). Ask me anything about your health — I'm here to help!`
            : "Hi! 👋 I'm your **AI Health Coach**. Run a health check first, or ask me anything about healthy living!"
        }]
      })
    } catch (e) {
      setMessages(prev => {
        if (prev.length > 0) return prev
        return [{ role: 'ai', text: "Hi! 👋 I'm your **AI Health Coach**. Ask me anything about health and wellness!" }]
      })
    }
  }

  // ─── Save message to Supabase ────────────────────────────────────
  const saveMessage = useCallback(async (role, content) => {
    if (!user) return
    try {
      await supabase.from('chat_messages').insert({
        user_id: user.id,
        role,
        content,
      })
    } catch (e) {
      console.warn('Failed to save message:', e)
    }
  }, [user])

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const SYSTEM_PROMPT = `You are a friendly, knowledgeable AI health coach. Format your responses using clean markdown:

- Use **bold** for key terms and important values
- Use bullet points (- ) for lists of tips, foods, or steps
- Use numbered lists (1. 2. 3.) for sequential steps or ranked items
- Use headings (## or ###) to organize longer answers into sections
- Keep paragraphs short (2-3 sentences max)
- Use > blockquotes for important warnings or key takeaways
- Use emojis sparingly for warmth (💧🏃‍♂️🥗❤️)

Be concise but well-structured. Every response should be easy to scan and read.`

  const sendMessage = async (text) => {
    if (!text.trim() || typing) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setShowChips(false)
    setTyping(true)

    // Save user message to Supabase
    saveMessage('user', text.trim())

    try {
      // Build recent conversation history (last 10)
      const recentMsgs = [...messages.slice(-10), userMsg].map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }))

      const { default: API } = await import('../api')
      const res = await API.post('/ai/chat', {
        messages: recentMsgs,
        system_prompt: SYSTEM_PROMPT,
        user_context: userContext,
      })

      const aiText = res.data?.reply || "I couldn't generate a response. Please try again."
      setMessages(prev => [...prev, { role: 'ai', text: aiText }])

      // Save AI response to Supabase
      saveMessage('ai', aiText)
    } catch (e) {
      console.error('AI Coach error:', e)
      const errorMsg = "Oops, something went wrong. Please check your internet connection and try again."
      setMessages(prev => [...prev, { role: 'ai', text: errorMsg }])
    } finally {
      setTyping(false)
    }
  }

  const clearChat = async () => {
    if (!user) return
    // Delete from Supabase
    try {
      await supabase.from('chat_messages').delete().eq('user_id', user.id)
    } catch (e) {
      console.warn('Failed to clear chat history:', e)
    }
    // Reset local state
    historyLoadedRef.current = false
    setMessages([])
    setShowChips(true)
    buildContext()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  // ─── Date separator helper ───────────────────────────────────────
  const getDateLabel = (timestamp) => {
    if (!timestamp) return null
    const date = new Date(timestamp)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) return 'Today'
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const shouldShowDate = (msg, i) => {
    if (!msg.timestamp) return false
    if (i === 0) return true
    const prev = messages[i - 1]
    if (!prev.timestamp) return true
    return new Date(msg.timestamp).toDateString() !== new Date(prev.timestamp).toDateString()
  }

  return (
    <div className="min-h-screen bg-[#0B0E1A] flex flex-col pb-20">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/[0.06] flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#00E5C3]/10 border border-[#00E5C3]/20 flex items-center justify-center">
          <span className="text-lg">🤖</span>
        </div>
        <div className="flex-1">
          <h1 className="font-syne font-bold text-base text-[#F0F2FF]">AI Health Coach</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-[#00E5C3] animate-pulse" />
            <span className="text-xs text-[#00E5C3] font-dm">Online</span>
          </div>
        </div>
        {/* Clear chat button */}
        {messages.length > 1 && (
          <button type="button" onClick={clearChat}
            className="px-3 py-1.5 rounded-lg border border-white/[0.06] text-xs text-[#4A5480] font-dm
              hover:border-[#FF3D5A]/30 hover:text-[#FF3D5A] transition-colors"
            title="Clear chat history">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Clear
          </button>
        )}
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-2 bg-[#1A2040]/50">
        <p className="text-[10px] text-[#4A5480] font-dm text-center">
          AI responses are for guidance only, not medical advice. Always consult a healthcare professional.
        </p>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Loading skeleton */}
        {loadingHistory && (
          <div className="space-y-3 animate-fadeIn">
            {[1, 2, 3].map(i => (
              <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                <div className={`skeleton-shimmer rounded-2xl ${i % 2 === 0
                  ? 'w-40 h-10'
                  : 'w-64 h-16'
                }`} />
              </div>
            ))}
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i}>
            {/* Date separator */}
            {shouldShowDate(msg, i) && (
              <div className="flex items-center justify-center my-4">
                <div className="h-px flex-1 bg-white/[0.04]" />
                <span className="px-3 text-[10px] text-[#4A5480] font-dm uppercase tracking-wider">
                  {getDateLabel(msg.timestamp)}
                </span>
                <div className="h-px flex-1 bg-white/[0.04]" />
              </div>
            )}

            <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
              {msg.role === 'ai' && (
                <div className="w-7 h-7 rounded-full bg-[#00E5C3]/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                  <span className="text-xs">🤖</span>
                </div>
              )}
              <div className={`max-w-[85%] rounded-2xl text-sm font-dm leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#00E5C3] text-[#0B0E1A] rounded-br-md px-4 py-3'
                  : 'bg-[#12172B] border border-white/[0.06] text-[#F0F2FF] rounded-bl-md px-5 py-4'
              }`}>
                {msg.role === 'ai' ? (
                  <div className="ai-markdown">
                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {typing && (
          <div className="flex items-center gap-2 animate-fadeIn">
            <div className="w-7 h-7 rounded-full bg-[#00E5C3]/10 flex items-center justify-center flex-shrink-0">
              <span className="text-xs">🤖</span>
            </div>
            <div className="bg-[#12172B] border border-white/[0.06] rounded-2xl px-4 py-3 flex gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#4A5480] animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#4A5480] animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 rounded-full bg-[#4A5480] animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick chips */}
      {showChips && (
        <div className="px-4 py-2 flex flex-wrap gap-2">
          {CHIPS.map(chip => (
            <button key={chip} type="button"
              onClick={() => sendMessage(chip)}
              className="px-3 py-1.5 rounded-full bg-[#1A2040] border border-white/[0.06]
                text-xs text-[#8892B0] font-dm hover:border-[#00E5C3]/30 hover:text-[#00E5C3]
                transition-colors">
              {chip}
            </button>
          ))}
        </div>
      )}

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-white/[0.06] bg-[#0B0E1A]">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask me anything..."
            className="flex-1 bg-[#12172B] border border-white/[0.06] rounded-xl px-4 py-3
              text-sm text-[#F0F2FF] font-dm placeholder:text-[#4A5480]
              focus:outline-none focus:border-[#00E5C3]/40 transition-colors"
          />
          <button
            type="button"
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || typing}
            className="w-11 h-11 rounded-xl bg-[#00E5C3] flex items-center justify-center
              hover:scale-105 active:scale-95 transition-transform
              disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0B0E1A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

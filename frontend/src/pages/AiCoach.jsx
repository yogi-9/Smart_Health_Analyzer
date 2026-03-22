import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { getHealthHistory, getTodayWater, getStreaks } from '../api'
import BottomNav from '../components/BottomNav'

export default function AiCoach() {
  const { user } = useAuth()
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const [userContext, setUserContext] = useState('')
  const [showChips, setShowChips] = useState(true)
  const messagesEndRef = useRef(null)
  const chatRef = useRef(null)

  const CHIPS = [
    "What's my health risk?",
    "How much water should I drink?",
    "Give me a meal plan",
    "How can I improve my score?"
  ]

  // Fetch user health context on mount
  useEffect(() => {
    if (!user) return
    buildContext()
  }, [user])

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
      ctx += '\nGive short, friendly, encouraging health advice. Use simple language. Max 3 sentences per response.'
      setUserContext(ctx)

      // Welcome message
      setMessages([{
        role: 'ai',
        text: latest
          ? `Hi! 👋 I can see your latest risk score is ${latest.risk_score}/100 (${latest.risk_level}). Ask me anything about your health — I'm here to help!`
          : "Hi! 👋 I'm your AI Health Coach. Run a health check first, or ask me anything about healthy living!"
      }])
    } catch (e) {
      setMessages([{ role: 'ai', text: "Hi! 👋 I'm your AI Health Coach. Ask me anything about health and wellness!" }])
    }
  }

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typing])

  const sendMessage = async (text) => {
    if (!text.trim() || typing) return
    const userMsg = { role: 'user', text: text.trim() }
    setMessages(prev => [...prev, userMsg])
    setInput('')
    setShowChips(false)
    setTyping(true)

    try {
      const apiKey = import.meta.env.VITE_CLAUDE_API_KEY
      if (!apiKey) {
        setMessages(prev => [...prev, {
          role: 'ai',
          text: "Sorry, the AI service isn't configured yet. Please add your VITE_CLAUDE_API_KEY to the environment variables."
        }])
        setTyping(false)
        return
      }

      // Build recent conversation history (last 10)
      const recentMsgs = [...messages.slice(-10), userMsg].map(m => ({
        role: m.role === 'ai' ? 'assistant' : 'user',
        content: m.text
      }))

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 300,
          system: userContext,
          messages: recentMsgs,
        }),
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`)
      }

      const data = await response.json()
      const aiText = data.content?.[0]?.text || "I couldn't generate a response. Please try again."
      setMessages(prev => [...prev, { role: 'ai', text: aiText }])
    } catch (e) {
      console.error('AI Coach error:', e)
      setMessages(prev => [...prev, {
        role: 'ai',
        text: "Oops, something went wrong. Please check your internet connection and try again."
      }])
    } finally {
      setTyping(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
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
      </div>

      {/* Disclaimer */}
      <div className="px-6 py-2 bg-[#1A2040]/50">
        <p className="text-[10px] text-[#4A5480] font-dm text-center">
          AI responses are for guidance only, not medical advice. Always consult a healthcare professional.
        </p>
      </div>

      {/* Chat area */}
      <div ref={chatRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}>
            {msg.role === 'ai' && (
              <div className="w-7 h-7 rounded-full bg-[#00E5C3]/10 flex items-center justify-center mr-2 flex-shrink-0 mt-1">
                <span className="text-xs">🤖</span>
              </div>
            )}
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm font-dm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-[#00E5C3] text-[#0B0E1A] rounded-br-md'
                : 'bg-[#12172B] border border-white/[0.06] text-[#F0F2FF] rounded-bl-md'
            }`}>
              {msg.text}
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

import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import AppRoutes from './router'

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', emoji: '🏠' },
  { to: '/analyze', label: 'Health Check', emoji: '❤️' },
  { to: '/water', label: 'Water Tracker', emoji: '💧' },
  { to: '/nutrition', label: 'Food Logger', emoji: '🍎' },
  { to: '/streaks', label: 'Streaks', emoji: '🔥' },
  { to: '/ai-coach', label: 'AI Coach', emoji: '🤖' },
  { to: '/ai-meals', label: 'AI Meals', emoji: '🍽️' },
  { to: '/calorie-calc', label: 'Calorie Calc', emoji: '⚡' },
]

const NAV_BOTTOM = [
  { to: '/profile', label: 'Profile', emoji: '👤' },
]

function Sidebar() {
  const { pathname } = useLocation()
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (to) => pathname === to || pathname.startsWith(to + '/')

  return (
    <aside className="hidden md:flex md:flex-col w-[240px] h-screen fixed left-0 top-0 z-40
      bg-[#12172B] border-r border-white/[0.06]">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#00E5C3]/10 border border-[#00E5C3]/20 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00E5C3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div>
            <p className="font-syne font-bold text-sm text-[#F0F2FF] leading-none">Smart Health</p>
            <p className="text-[10px] text-[#4A5480] font-dm mt-0.5">Analyzer</p>
          </div>
        </div>
      </div>

      {/* Main nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <Link key={item.to} to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-dm transition-all duration-200 ${
              isActive(item.to)
                ? 'bg-[#00E5C3]/10 text-[#00E5C3] border-l-2 border-[#00E5C3]'
                : 'text-[#8892B0] hover:text-[#F0F2FF] hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-base w-6 text-center">{item.emoji}</span>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Bottom nav */}
      <div className="px-3 py-4 border-t border-white/[0.06] space-y-1">
        {NAV_BOTTOM.map(item => (
          <Link key={item.to} to={item.to}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-dm transition-all duration-200 ${
              isActive(item.to)
                ? 'bg-[#00E5C3]/10 text-[#00E5C3]'
                : 'text-[#8892B0] hover:text-[#F0F2FF] hover:bg-white/[0.03]'
            }`}
          >
            <span className="text-base w-6 text-center">{item.emoji}</span>
            {item.label}
          </Link>
        ))}
        <button type="button" onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-dm
            text-[#FF3D5A] hover:bg-[#FF3D5A]/10 transition-colors">
          <span className="text-base w-6 text-center">🚪</span>
          Sign Out
        </button>
      </div>
    </aside>
  )
}

export default function App() {
  const { user, loading } = useAuth()

  // Show sidebar only when logged in and not on auth pages
  const showSidebar = user && !loading

  return (
    <div className="flex min-h-screen bg-[#0B0E1A]">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 ${showSidebar ? 'md:ml-[240px]' : ''}`}>
        <AppRoutes />
      </main>
    </div>
  )
}
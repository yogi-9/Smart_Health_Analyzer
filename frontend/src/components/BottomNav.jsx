import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function BottomNav() {
  const { pathname } = useLocation()

  const tabs = [
    {
      to: '/dashboard',
      label: 'Home',
      icon: (a) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? '#00E5C3' : '#4A5480'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      to: '/analyze',
      label: 'Check',
      icon: (a) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? '#00E5C3' : '#4A5480'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      )
    },
    {
      to: '/water',
      label: 'Water',
      icon: (a) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? '#00E5C3' : '#4A5480'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2C6 9 4 13.5 4 16a8 8 0 0016 0c0-2.5-2-7-8-14z"/>
        </svg>
      )
    },
    {
      to: '/nutrition',
      label: 'Food',
      icon: (a) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? '#00E5C3' : '#4A5480'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M18 8h1a4 4 0 010 8h-1"/>
          <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/>
          <line x1="6" y1="1" x2="6" y2="4"/>
          <line x1="10" y1="1" x2="10" y2="4"/>
          <line x1="14" y1="1" x2="14" y2="4"/>
        </svg>
      )
    },
    {
      to: '/ai-coach',
      label: 'Coach',
      icon: (a) => (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={a ? '#00E5C3' : '#4A5480'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
        </svg>
      )
    },
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#12172B]/95 border-t
      border-white/[0.06] px-2 py-2 z-50 backdrop-blur-xl md:hidden">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const active = pathname === tab.to || pathname.startsWith(tab.to + '/')
          return (
            <Link key={tab.to} to={tab.to}
              className="flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-colors relative">
              {tab.icon(active)}
              <span className={`text-[10px] font-medium font-dm ${
                active ? 'text-[#00E5C3]' : 'text-[#4A5480]'
              }`}>{tab.label}</span>
              {active && (
                <div className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-[#00E5C3]" />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
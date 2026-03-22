import { Link, useLocation } from 'react-router-dom'

export default function BottomNav() {
  const { pathname } = useLocation()

  const tabs = [
    {
      to: '/dashboard',
      label: 'Home',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#00E5C3' : '#4A5480'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
          <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>
      )
    },
    {
      to: '/analyze',
      label: 'Analyze',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#00E5C3' : '#4A5480'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
        </svg>
      )
    },
    {
      to: '/history',
      label: 'History',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#00E5C3' : '#4A5480'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <polyline points="12 6 12 12 16 14"/>
        </svg>
      )
    },

    {
      to: '/water',
      label: 'Water',
      icon: (active) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#00E5C3' : '#4A5480'} strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6 9 4 13.5 4 16a8 8 0 0016 0c0-2.5-2-7-8-14z"/>
      </svg>
      )
      },
    {
      to: '/profile',
      label: 'Profile',
      icon: (active) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
          stroke={active ? '#00E5C3' : '#4A5480'} strokeWidth="2"
          strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      )
    }
  ]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-[#12172B] border-t
      border-white/[0.06] px-2 py-2 z-50 backdrop-blur-xl">
      <div className="max-w-2xl mx-auto flex items-center justify-around">
        {tabs.map(tab => {
          const activeRoutes = {
          '/dashboard': ['/dashboard'],
          '/analyze': ['/analyze', '/analyze/mental', '/analyze/diabetes', '/analyze/heart'],
          '/history': ['/history'],
          '/water': ['/water'],
          '/profile': ['/profile']
        }

const active = activeRoutes[tab.to]?.includes(pathname) || pathname === tab.to
          return (
            <Link key={tab.to} to={tab.to}
              className="flex flex-col items-center gap-1 px-4 py-1 rounded-xl
                transition-colors">
              {tab.icon(active)}
              <span className={`text-xs font-medium font-dm ${
                active ? 'text-[#00E5C3]' : 'text-[#4A5480]'
              }`}>
                {tab.label}
              </span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
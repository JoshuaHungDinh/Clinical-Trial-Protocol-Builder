import { useState } from 'react'
import { Sidebar } from '../Sidebar/Sidebar'
import { AppHeader } from '../AppHeader/AppHeader'
import './AppShell.scss'

const STORAGE_KEY = 'sidebar-collapsed'

function getInitialCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

interface AppShellProps {
  children: React.ReactNode
}

export function AppShell({ children }: AppShellProps) {
  const [collapsed, setCollapsed] = useState(getInitialCollapsed)

  const handleToggle = () => {
    setCollapsed((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {}
      return next
    })
  }

  return (
    <div className={`app-shell ${collapsed ? 'app-shell--collapsed' : ''}`}>
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />
      <div className="app-shell__content">
        <AppHeader />
        <main className="app-shell__main">{children}</main>
      </div>
    </div>
  )
}

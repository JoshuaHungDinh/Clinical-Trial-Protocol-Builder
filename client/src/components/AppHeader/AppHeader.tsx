import { useLocation } from 'react-router-dom'
import './AppHeader.scss'

const pageTitles: Record<string, string> = {
  '/': 'Dashboard',
  '/protocols': 'Protocols',
  '/import': 'Import Study',
  '/team': 'Team',
  '/settings': 'Settings',
}

export function AppHeader() {
  const location = useLocation()

  const title =
    pageTitles[location.pathname] ||
    (location.pathname.startsWith('/protocols/') ? 'Protocol Detail' : 'Page')

  return (
    <header className="app-header">
      <h1 className="app-header__title">{title}</h1>
      <div className="app-header__actions" />
    </header>
  )
}

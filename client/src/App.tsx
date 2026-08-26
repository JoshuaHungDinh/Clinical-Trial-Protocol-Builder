import { Routes, Route } from 'react-router-dom'
import { AppShell } from './components/AppShell/AppShell'
import { ProtocolList } from './components/ProtocolList/ProtocolList'
import { ProtocolDetail } from './components/ProtocolDetail/ProtocolDetail'
import { PlaceholderPage } from './components/PlaceholderPage/PlaceholderPage'
import './App.scss'

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<ProtocolList />} />
        <Route path="/protocols" element={<ProtocolList />} />
        <Route path="/protocols/:id" element={<ProtocolDetail />} />
        <Route path="/import" element={<PlaceholderPage title="Import Study" />} />
        <Route path="/team" element={<PlaceholderPage title="Team" />} />
        <Route path="/settings" element={<PlaceholderPage title="Settings" />} />
      </Routes>
    </AppShell>
  )
}

export default App

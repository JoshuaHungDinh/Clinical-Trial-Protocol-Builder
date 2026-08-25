import { Routes, Route } from 'react-router-dom'
import { ProtocolList } from './components/ProtocolList/ProtocolList'
import { ProtocolDetail } from './components/ProtocolDetail/ProtocolDetail'
import './App.scss'

function App() {
  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Clinical Trial Protocol Builder</h1>
      </header>
      <main className="app__main">
        <Routes>
          <Route path="/" element={<ProtocolList />} />
          <Route path="/protocols/:id" element={<ProtocolDetail />} />
        </Routes>
      </main>
    </div>
  )
}

export default App

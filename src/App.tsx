import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'

import { CertificationProvider } from './certification'
import { LoginScreen } from './components/auth/LoginScreen'
import { AppShell } from './components/shell/AppShell'
import { useSession } from './hooks/useSession'
import { AttemptPage } from './pages/AttemptPage'
import { ExamPage } from './pages/ExamPage'
import { TopicsPage } from './pages/TopicsPage'

export default function App() {
  const authed = useSession()
  if (!authed) return <LoginScreen />

  return (
    <BrowserRouter>
      <CertificationProvider>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<TopicsPage />} />
            <Route path="exam" element={<ExamPage />} />
            <Route path="stats" element={<Navigate to="/" replace />} />
            <Route path="attempts/:attemptId" element={<AttemptPage />} />
          </Route>
        </Routes>
      </CertificationProvider>
    </BrowserRouter>
  )
}

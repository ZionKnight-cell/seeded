import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { ToastProvider } from './components/Toast'
import AppShell from './components/AppShell'
import Home from './pages/Home'
import Notes from './pages/Notes'
import NoteDetail from './pages/NoteDetail'
import NoteForm from './pages/NoteForm'
import AddNote from './pages/AddNote'
import Prayer from './pages/Prayer'
import Review from './pages/Review'
import Settings from './pages/Settings'
import Onboarding, { isOnboardingDone } from './pages/Onboarding'

function HomeOrOnboarding() {
  return isOnboardingDone() ? <Home /> : <Navigate to="/onboarding" replace />
}

export default function App() {
  return (
    <ToastProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<AppShell />}>
            <Route index element={<HomeOrOnboarding />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/notes/:id" element={<NoteDetail />} />
            <Route path="/notes/:id/edit" element={<NoteForm mode="edit" />} />
            <Route path="/add" element={<AddNote />} />
            <Route path="/prayer" element={<Prayer />} />
            <Route path="/review" element={<Review />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  )
}

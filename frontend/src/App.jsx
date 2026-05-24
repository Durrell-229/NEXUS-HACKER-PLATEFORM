import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import AppLayout from './components/layout/AppLayout'
import LoadingScreen from './components/ui/LoadingScreen'

const Landing = lazy(() => import('./pages/Landing'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Arena = lazy(() => import('./pages/Arena'))
const ChallengeDetail = lazy(() => import('./pages/ChallengeDetail'))
const Labyrinth = lazy(() => import('./pages/Labyrinth'))
const Codex = lazy(() => import('./pages/Codex'))
const Forge = lazy(() => import('./pages/Forge'))
const Signal = lazy(() => import('./pages/Signal'))
const Vault = lazy(() => import('./pages/Vault'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Teams = lazy(() => import('./pages/Teams'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))

function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  return children
}

function PublicRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  if (isAuthenticated) return <Navigate to="/dashboard" replace />
  return children
}

export default function App() {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

        <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/arena" element={<Arena />} />
          <Route path="/arena/:id" element={<ChallengeDetail />} />
          <Route path="/labyrinth" element={<Labyrinth />} />
          <Route path="/codex" element={<Codex />} />
          <Route path="/forge" element={<Forge />} />
          <Route path="/signal" element={<Signal />} />
          <Route path="/vault/:username" element={<Vault />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

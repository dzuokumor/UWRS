import { Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import DashboardPage from './pages/DashboardPage'
import VolunteerPage from './pages/VolunteerPage'
import Navbar from './components/shared/Navbar'
import ReportForm from './components/reports/ReportForm'
import ReportList from './components/reports/ReportList'
import ProfilePage from './pages/ProfilePage'
import VerificationResult from './components/auth/VerificationResult'

export default function App() {
  const hideNavbar = window.location.pathname.startsWith('/verification')

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
      {!hideNavbar && <Navbar />}

      <main className={`flex-1 ${!hideNavbar ? 'md:ml-64' : ''} transition-all duration-300`}>
        <div className={!hideNavbar ? 'p-6' : ''}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verification/:status" element={
              <div className="flex items-center justify-center min-h-screen p-4">
                <div className="w-full max-w-md">
                  <VerificationResult />
                </div>
              </div>
            } />

            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/report" element={<ReportForm />} />
            <Route path="/reports" element={<ReportList />} />
            <Route path="/volunteers" element={<VolunteerPage />} />

            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </main>
    </div>
  )
}
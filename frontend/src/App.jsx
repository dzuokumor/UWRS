import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import DashboardPage from './pages/DashboardPage';
import ReportsPage from './pages/ReportsPage';
import VolunteerPage from './pages/VolunteerPage';
import Navbar from './components/shared/Navbar';
import VerificationResult from './components/auth/VerificationResult';
import { useState } from 'react';

export default function App() {
  const [showNavbar, setShowNavbar] = useState(false);

  const noNavbarPaths = ['/', '/login', '/signup', '/verification'];

  return (
    <BrowserRouter>
      <div className="flex flex-col md:flex-row min-h-screen bg-gray-100">
        {!noNavbarPaths.includes(window.location.pathname.split('/')[1]) && (
          <Navbar />
        )}

        <main className="flex-1 overflow-y-auto md:ml-64 transition-all duration-300">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/verification/:status" element={<VerificationResult />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/volunteers" element={<VolunteerPage />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
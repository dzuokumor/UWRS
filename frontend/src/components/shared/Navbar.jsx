import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Squares2X2Icon,
  DocumentTextIcon,
  UsersIcon,
  UserCircleIcon,
  ArrowLeftOnRectangleIcon,
  Bars3Icon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import authService from '../../services/auth';
import uwrsLogo from '../../assets/uwrs-logo.svg';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('email');
    if (token) {
      setIsLoggedIn(true);
      setUserEmail(email || '');
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setIsLoggedIn(false);
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <>
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={toggleMobileMenu}
          className="text-gray-700 hover:text-primary focus:outline-none"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <XMarkIcon className="h-8 w-8" />
          ) : (
            <Bars3Icon className="h-8 w-8" />
          )}
        </button>
      </div>

      <div className="hidden md:flex md:flex-col md:w-72 md:fixed md:inset-y-0 bg-white border-r border-gray-200 shadow-sm overflow-y-auto">
        <div className="flex items-center justify-center h-24 px-4 border-b border-gray-200 mb-4">
          <Link to="/" className="flex items-center">
            <img
              src={uwrsLogo}
              alt="UWRS Logo"
              className="h-25 w-auto"
            />
          </Link>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-4">
          <NavItem to="/dashboard" icon={<Squares2X2Icon className="h-6 w-6" />}>
            Dashboard
          </NavItem>
          <NavItem to="/report" icon={<DocumentTextIcon className="h-6 w-6" />}>
            Report
          </NavItem>
          <NavItem to="/reports" icon={<DocumentTextIcon className="h-6 w-6" />}>
            Reports
          </NavItem>
          <NavItem to="/volunteers" icon={<UsersIcon className="h-6 w-6" />}>
            Volunteer Movements
          </NavItem>
        </nav>

        <div className="px-4 py-6 border-t border-gray-200 space-y-4">
          {isLoggedIn ? (
            <>
              <NavItem to="/profile" icon={<UserCircleIcon className="h-6 w-6" />}>
                <div className="flex flex-col">
                  <span className="font-medium">Profile</span>
                  {userEmail && (
                    <span className="text-xs text-gray-500 truncate">{userEmail}</span>
                  )}
                </div>
              </NavItem>
              <button
                onClick={handleLogout}
                className="w-full flex items-center space-x-3 text-gray-700 hover:text-primary hover:bg-red-50 p-3 rounded-md transition-colors"
              >
                <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                <span className="font-medium">Logout</span>
              </button>
            </>
          ) : (
            <NavItem to="/login" icon={<UserCircleIcon className="h-6 w-6" />}>
              <span className="font-medium">Login/Signup</span>
            </NavItem>
          )}
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-white overflow-y-auto">
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between h-24 px-4 border-b border-gray-200 mb-4">
              <Link to="/" className="flex items-center" onClick={() => setMobileMenuOpen(false)}>
                <img
                  src={uwrsLogo}
                  alt="UWRS Logo"
                  className="h-12 w-auto"
                />
              </Link>
              <button
                onClick={toggleMobileMenu}
                className="text-gray-700 hover:text-primary"
                aria-label="Close menu"
              >
                <XMarkIcon className="h-8 w-8" />
              </button>
            </div>

            <nav className="flex-1 px-4 py-6 space-y-4">
              <MobileNavItem to="/dashboard" icon={<Squares2X2Icon className="h-6 w-6" />} onClick={toggleMobileMenu}>
                Dashboard
              </MobileNavItem>
              <MobileNavItem to="/report" icon={<DocumentTextIcon className="h-6 w-6" />} onClick={toggleMobileMenu}>
                Report
              </MobileNavItem>
              <MobileNavItem to="/reports" icon={<DocumentTextIcon className="h-6 w-6" />} onClick={toggleMobileMenu}>
                Reports
              </MobileNavItem>
              <MobileNavItem to="/volunteers" icon={<UsersIcon className="h-6 w-6" />} onClick={toggleMobileMenu}>
                Volunteer Movements
              </MobileNavItem>
            </nav>

            <div className="px-4 py-6 border-t border-gray-200 space-y-4">
              {isLoggedIn ? (
                <>
                  <MobileNavItem to="/profile" icon={<UserCircleIcon className="h-6 w-6" />} onClick={toggleMobileMenu}>
                    <div className="flex flex-col">
                      <span className="font-medium">Profile</span>
                      {userEmail && (
                        <span className="text-xs text-gray-500 truncate">{userEmail}</span>
                      )}
                    </div>
                  </MobileNavItem>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center space-x-3 text-gray-700 hover:text-primary hover:bg-red-50 p-3 rounded-md transition-colors"
                  >
                    <ArrowLeftOnRectangleIcon className="h-6 w-6" />
                    <span className="font-medium">Logout</span>
                  </button>
                </>
              ) : (
                <MobileNavItem to="/login" icon={<UserCircleIcon className="h-6 w-6" />} onClick={toggleMobileMenu}>
                  <span className="font-medium">Login/Signup</span>
                </MobileNavItem>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NavItem({ to, icon, children }) {
  return (
    <Link
      to={to}
      className="flex items-center space-x-4 text-gray-700 hover:text-primary hover:bg-red-50 p-3 rounded-md transition-colors text-lg"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}

function MobileNavItem({ to, icon, children, onClick }) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex items-center space-x-4 text-gray-700 hover:text-primary hover:bg-red-50 p-3 rounded-md transition-colors text-lg"
    >
      {icon}
      <span>{children}</span>
    </Link>
  );
}
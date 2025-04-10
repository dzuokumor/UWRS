import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth';
import loginSvg from '../../assets/login.svg';

export default function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [roleCode, setRoleCode] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const navigate = useNavigate();

  const isSpecialUser = email.includes('@ngo.com') || email.includes('@gov.com');

  useEffect(() => {
    setIsMounted(true);
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    setIsSuccess(false);

    try {
      const data = await authService.login(
        email,
        isSpecialUser ? '' : password,
        isSpecialUser ? roleCode : ''
      );

      if (rememberMe) {
        localStorage.setItem('rememberedEmail', email);
      } else {
        localStorage.removeItem('rememberedEmail');
      }

      localStorage.setItem('token', data.access_token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.user_id);

      setIsSuccess(true);

      setTimeout(() => {
        setIsLoading(false);
        window.location.href = '/dashboard';
      }, 3000);

    } catch (err) {
      setError(err.message.includes('Network')
        ? 'Cannot connect to server. Check your internet connection.'
        : err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-100 flex items-center justify-center transition-all duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
      <div className={`bg-white p-8 rounded-lg shadow-xl w-full max-w-4xl flex border border-gray-200 transition-all duration-500 ${isMounted ? 'translate-y-0' : '-translate-y-10'}`}>
        <div className="w-1/2 pr-8">
          <h2 className="text-3xl font-bold text-center mb-8 text-red-600">UWRS Login</h2>

          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4 border border-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-800 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition"
                required
                autoFocus
              />
            </div>

            {!isSpecialUser && (
              <div>
                <label className="block text-gray-800 mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition"
                  required
                  minLength={8}
                />
              </div>
            )}

            {isSpecialUser && (
              <div>
                <label className="block text-gray-800 mb-2">Password</label>
                <input
                  type="text"
                  value={roleCode}
                  onChange={(e) => setRoleCode(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition"
                  required
                />
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
                />
                <label className="ml-2 text-gray-700">Remember me</label>
              </div>
              <Link to="/reset-password" className="text-red-600 hover:text-red-800 transition">
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading || isSuccess}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
                isLoading || isSuccess ? 'bg-gray-500' : 'bg-red-600 hover:bg-red-700'
              }`}
            >
              {(isLoading || isSuccess) ? (
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin-slow h-5 w-5 text-white mr-3"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {isSuccess ? 'Login Successful!' : 'Logging in...'}
                </div>
              ) : 'Log In'}
            </button>

            <div className="text-center text-gray-700 mt-4">
              Don't have an account?{' '}
              <Link to="/signup" className="text-red-600 hover:text-red-800 transition font-medium">
                Sign up
              </Link>
            </div>
          </form>
        </div>

        <div className="w-1/2 bg-white rounded-r-lg flex items-center justify-center p-8 border-l border-gray-200">
          <div className="text-center">
            <img
              src={loginSvg}
              alt="UWRS Login"
              className="w-64 h-64 mx-auto"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
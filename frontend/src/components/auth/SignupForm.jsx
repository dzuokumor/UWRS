import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import authService from '../../services/auth';
import uwrsLogo from '../../assets/login.svg';

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export default function SignupForm() {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    nickname: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [canResend, setCanResend] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    setIsMounted(true);
    return () => clearTimeout(resendCountdown);
  }, []);

  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => {
        setResendCountdown(resendCountdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendCountdown]);

  const checkEmailExists = async (email) => {
    try {
      const response = await authService.validateEmail(email);
      if (response.status === 'registered' || response.status === 'pending') {
        setError('This email is already registered or pending verification');
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error checking email:', err);
      return false;
    }
  };

  const handleEmailBlur = async () => {
    if (formData.email && validateEmail(formData.email)) {
      const exists = await checkEmailExists(formData.email);
      setEmailExists(exists);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateEmail(formData.email)) {
      setError('Invalid email format');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsLoading(true);

    try {
      const data = await authService.signup(
        formData.fullName,
        formData.email,
        formData.password,
        formData.nickname
      );

      if (formData.email.includes('@ngo.com') || formData.email.includes('@gov.com')) {
        setSuccessMessage('Your login code has been generated. Contact the system admin to retrieve.');
      } else {
        setSuccessMessage(data.message || 'Verification link has been sent to your email');
      }

      setCanResend(false);
      setResendCountdown(30);

    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!canResend) return;

    setError('');
    setIsLoading(true);

    try {
      const response = await authService.resendVerification(formData.email);
      setSuccessMessage(response.message || 'New verification email sent');
      setCanResend(false);
      setResendCountdown(30);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to resend verification email');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen bg-white-100 flex items-center justify-center p-4 transition-all duration-500 ${isMounted ? 'opacity-100' : 'opacity-0'}`}>
      <div
          className={`bg-white rounded-lg shadow-xl w-full max-w-6xl flex border border-gray-200 overflow-hidden transition-all duration-500 ${isMounted ? 'translate-y-0' : '-translate-y-10'}`}>
        <div
            className="hidden md:flex md:w-1/2 bg-white rounded-r-lg items-center justify-center p-8 border-l border-gray-200">
          <div className="text-center">
            <img
                src={uwrsLogo}
                alt="UWRS Logo"
                className="w-64 h-64 mx-auto transition-transform hover:scale-105 duration-300"
            />
            <h3 className="text-xl font-semibold text-gray-800 mt-6">Join the UWRS Today</h3>
            <p className="text-gray-600 mt-2">Create your account to get started</p>
          </div>
        </div>

        <div className="hidden md:block w-px bg-gradient-to-b from-gray-300 via-gray-300 to-transparent my-10"></div>

        <div className="w-full md:w-1/2 p-8">
          <h2 className="text-2xl font-bold text-center mb-6 text-red-600">Create Account</h2>

          {error && (
              <div className="p-3 bg-red-100 text-red-700 rounded-md mb-4 border border-red-300">
                {error}
              </div>
          )}

          {successMessage ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-100 text-green-700 rounded-md border border-green-300">
                <p className="font-medium">{successMessage}</p>
                {!(formData.email.includes('@ngo.com') || formData.email.includes('@gov.com')) && (
                  <p className="mt-2 text-sm">Please check your email inbox (and spam folder) to verify your account.</p>
                )}
              </div>

              {!(formData.email.includes('@ngo.com') || formData.email.includes('@gov.com')) && (
                <div className="text-center">
                  <p className="text-gray-600 mb-2">Didn't receive the email?</p>
                  <button
                    onClick={handleResendVerification}
                    disabled={!canResend || isLoading}
                    className={`text-red-600 hover:text-red-800 font-medium ${!canResend ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {canResend ? 'Resend Verification Email' : `Resend available in ${resendCountdown}s`}
                  </button>
                </div>
              )}
            </div>
          ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-gray-800 mb-2">Full Name*</label>
                  <input
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition"
                      required
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">Email*</label>
                  <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                      onBlur={handleEmailBlur}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition"
                      required
                  />
                  {emailExists && (
                      <p className="text-red-500 text-sm mt-1">This email is already registered</p>
                  )}
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">Password*</label>
                  <div className="relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition pr-10"
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                    />
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-600 hover:text-gray-800"
                    >
                      {showPassword ? (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l3.59 3.59"/>
                          </svg>
                      ) : (
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
                               stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">Confirm Password*</label>
                  <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition"
                      required
                      minLength={8}
                  />
                </div>

                <div>
                  <label className="block text-gray-800 mb-2">Nickname (Optional)</label>
                  <input
                      type="text"
                      value={formData.nickname}
                      onChange={(e) => setFormData({...formData, nickname: e.target.value})}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent hover:border-gray-400 transition"
                  />
                </div>

                <button
                    type="submit"
                    disabled={isLoading || emailExists}
                    className={`w-full py-3 px-4 rounded-lg font-medium text-white transition ${
                        isLoading || emailExists ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                >
                  {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg"
                             fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"
                                  strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                  ) : 'Create Account'}
                </button>

                <div className="text-center text-gray-700 mt-4">
                  Already have an account?{' '}
                  <Link to="/login" className="text-red-600 hover:text-red-800 transition font-medium">
                    Log in
                  </Link>
                </div>
              </form>
          )}
        </div>
      </div>
    </div>
  );
}
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CheckCircleIcon, XCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

export default function VerificationResult() {
  const { status } = useParams();
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    switch (status) {
      case 'success':
        setMessage('Email verified successfully!');
        setIsSuccess(true);
        break;
      case 'expired':
        setMessage('Verification link has expired');
        setIsSuccess(false);
        break;
      case 'invalid':
        setMessage('Invalid verification link');
        setIsSuccess(false);
        break;
      case 'already-verified':
        setMessage('Email is already verified');
        setIsSuccess(true);
        break;
      case 'error':
        setMessage('Verification failed - please try again');
        setIsSuccess(false);
        break;
      default:
        setMessage('Verification status unknown');
        setIsSuccess(false);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-white-50 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-lg shadow-md p-8 text-center">
        {isSuccess ? (
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
        ) : (
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
        )}

        <h2 className="text-2xl font-bold mb-4">
          {isSuccess ? 'Verification Complete!' : 'Verification Failed'}
        </h2>

        <p className="mb-6 text-gray-600">{message}</p>

        <button
          onClick={() => navigate(isSuccess ? '/login' : '/signup')}
          className={`w-full py-2 px-4 rounded-lg font-medium text-white ${
            isSuccess ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
          } transition`}
        >
          {isSuccess ? 'Go to Login' : 'Back to Signup'}
        </button>
      </div>
    </div>
  );
}
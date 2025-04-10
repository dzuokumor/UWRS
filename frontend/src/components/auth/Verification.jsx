import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { verifyEmail } from '../../services/auth';

export default function Verification() {
  const { token } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const verify = async () => {
      await verifyEmail(token);
      navigate('/login');
    };
    verify();
  }, [token, navigate]);

  return <div className="text-center p-10">Verifying email...</div>;
}
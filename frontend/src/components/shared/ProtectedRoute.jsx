import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { checkAuth } from '../../services/auth';

export default function ProtectedRoute({ children, requiredRoles = [] }) {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const { role } = await checkAuth();
        if (requiredRoles.length === 0 || requiredRoles.includes(role)) {
          setIsAuthorized(true);
        } else {
          navigate('/unauthorized');
        }
      } catch (error) {
        navigate('/login');
      } finally {
        setLoading(false);
      }
    };
    verifyAuth();
  }, [navigate, requiredRoles]);

  if (loading) return <div className="text-center p-10">Loading...</div>;
  return isAuthorized ? children : null;
}
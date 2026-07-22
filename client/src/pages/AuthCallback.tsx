import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { authApi } from '../api/client';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) { navigate('/login?error=auth_failed'); return; }

    localStorage.setItem('token', token);
    authApi.me().then(res => {
      setUser(res.user, token);
      toast.success(`Welcome, ${res.user.name}!`);
      navigate('/dashboard');
    }).catch(() => {
      navigate('/login?error=auth_failed');
    });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <LoadingSpinner size="lg" text="Completing sign-in..." />
    </div>
  );
}

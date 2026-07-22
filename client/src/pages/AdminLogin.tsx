import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { adminApi } from '../api/client';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

interface FormData { email: string; password: string; }

export default function AdminLogin() {
  const navigate = useNavigate();
  const { setAdmin, isAdminAuthenticated } = useAuthStore();
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>();

  useEffect(() => { if (isAdminAuthenticated) navigate('/admin'); }, [isAdminAuthenticated]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await adminApi.login(data);
      setAdmin(res.admin, res.token);
      toast.success(`Welcome, ${res.admin.name}!`);
      navigate('/admin');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid admin credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-[#1a1a1a] border border-[#2f2f2f] rounded-xl flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={24} className="text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-white">Admin Access</h1>
          <p className="text-gray-500 text-sm mt-1">Restricted — authorized personnel only</p>
        </div>

        <div className="card border-[#2a1a1a]">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="label">Admin Email</label>
              <input type="email" className={`input ${errors.email ? 'border-red-500' : ''}`}
                placeholder="admin@yourdashboard.io"
                {...register('email', { required: 'Required' })} />
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} className={`input pr-10 ${errors.password ? 'border-red-500' : ''}`}
                  placeholder="Admin password"
                  {...register('password', { required: 'Required' })} />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#1a1a1a] hover:bg-[#242424] border border-[#2f2f2f] text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
              {loading ? 'Verifying...' : 'Sign In as Admin'}
            </button>
          </form>
        </div>
        <p className="text-center text-xs text-gray-600 mt-4">
          <a href="/login" className="hover:text-gray-400">← Back to user login</a>
        </p>
      </div>
    </div>
  );
}

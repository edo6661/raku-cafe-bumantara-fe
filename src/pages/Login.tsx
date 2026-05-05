import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import api from '../lib/axios';
import Input from '../components/shared/Input';
import { handleApiError } from '../utils/errorHandler';
import { Package } from 'lucide-react';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ email: '', password: '' });

  const loginMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const response = await api.post('/auth/login', payload);
      return response.data.data;
    },
    onSuccess: (data) => {

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      navigate('/', { replace: true });
    },
    onError: (error) => {
      const result = handleApiError(error);
      alert(result.message);
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      return alert('Email dan password wajib diisi');
    }
    loginMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/10 blur-3xl rounded-full"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-emerald-500/10 blur-3xl rounded-full"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
            <Package size={32} />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-black text-slate-900 tracking-tight">
          Login ke Bumantara
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 font-medium">
          Sistem ERP Point of Sale & Inventory
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-white py-8 px-4 shadow-xl shadow-slate-200/50 sm:rounded-[24px] sm:px-10 border border-slate-100">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              name="email"
              type="email"
              placeholder="admin@gmail.com"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <Input
              label="Password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
            />

            <div>
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] cursor-pointer"
              >
                {loginMutation.isPending ? 'Memverifikasi...' : 'Masuk Sistem'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
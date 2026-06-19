import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, AlertCircle, ArrowRight, Info, Eye, EyeOff } from 'lucide-react';
import { trackPageView } from '../analytics/tracking';

const Login = () => {
  const { t, language } = useApp();
  const { loginUser, registerUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRecoveryInfo, setShowRecoveryInfo] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleQuickLogin = async () => {
    setError('');
    setShowRecoveryInfo(false);
    try {
      setLoading(true);
      // Try logging in with the default guest account 'invitado'
      try {
        await loginUser('Invitado', 'invitado123');
      } catch (err) {
        // If the account does not exist in the database, automatically register it first
        if (err.message.includes('existe') || err.message.includes('exist')) {
          await registerUser('Invitado', 'invitado123');
        } else {
          throw err;
        }
      }
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(language === 'es' ? 'Error al iniciar sesión rápida.' : 'Failed to log in quickly.');
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    trackPageView('Login Screen');
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setShowRecoveryInfo(false);

    if (!username.trim()) {
      setError(language === 'es' ? 'El nombre de usuario es obligatorio.' : 'Username is required.');
      return;
    }
    if (!password) {
      setError(language === 'es' ? 'La contraseña es obligatoria.' : 'Password is required.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(username, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || (language === 'es' ? 'Error al iniciar sesión.' : 'Failed to log in.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-10 px-4 select-none">
      <div className="w-full max-w-md glass border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pastel-sky to-pastel-lavender" />
        
        <h2 className="text-3xl font-extrabold font-poppins text-slate-800 dark:text-slate-100 text-center mb-1">
          {t('login')}
        </h2>
        <p className="text-sm font-nunito text-slate-500 dark:text-slate-400 text-center mb-6">
          {language === 'es' ? 'Inicia sesión con tu usuario y contraseña.' : 'Log in with your username and password.'}
        </p>

        {error && (
          <div className="flex items-center space-x-2 p-4 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-100/50 dark:border-rose-950/40">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-nunito font-semibold">{error}</span>
          </div>
        )}

        {showRecoveryInfo && (
          <div className="flex items-start space-x-2.5 p-4 mb-4 rounded-xl bg-blue-50 dark:bg-blue-950/25 text-blue-600 dark:text-blue-300 text-xs border border-blue-100/50 dark:border-blue-950/40">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div className="font-nunito leading-relaxed">
              {language === 'es' 
                ? 'Al no utilizar correo electrónico, no es posible restablecer tu contraseña automáticamente. Ponte en contacto con el administrador de CalmSpace.' 
                : 'As emails are not used, self-service resets are unavailable. Please contact the CalmSpace administrator.'}
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-poppins">
              {t('username')}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder={language === 'es' ? 'usuario_calma' : 'calm_user'}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-xl font-nunito focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/40 focus:border-indigo-300 dark:focus:border-indigo-900 text-slate-800 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-poppins">
              {t('password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-xl font-nunito focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/40 focus:border-indigo-300 dark:focus:border-indigo-900 text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-3.5 z-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-end text-sm">
            <button
              type="button"
              onClick={() => setShowRecoveryInfo(true)}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-nunito font-semibold"
            >
              {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
            >
              <span>{loading ? (language === 'es' ? 'Iniciando...' : 'Logging in...') : t('login')}</span>
              <ArrowRight className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={handleQuickLogin}
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-pastel-rose/85 to-pastel-sky/85 hover:from-pastel-rose hover:to-pastel-sky text-indigo-950 dark:text-indigo-900 font-bold rounded-xl shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-poppins border border-white/20"
            >
              <span>⚡ {language === 'es' ? 'Acceso Rápido (Demo)' : 'Quick Guest Login'}</span>
            </button>
          </div>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200/30 dark:border-white/5 text-center text-sm font-nunito">
          <span className="text-slate-500 dark:text-slate-400">{t('dont_have_account')} </span>
          <Link to="/register" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            {t('register')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Login;

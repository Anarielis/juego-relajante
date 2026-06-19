import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, AlertCircle, ArrowRight, CheckCircle } from 'lucide-react';
import { trackPageView } from '../analytics/tracking';

const Login = () => {
  const { t, language } = useApp();
  const { loginUser, recoverPassword } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    trackPageView('Login Screen');
  }, []);

  const handleValidateEmail = (val) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(val);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!email) {
      setError(language === 'es' ? 'El correo electrónico es obligatorio.' : 'Email is required.');
      return;
    }
    if (!handleValidateEmail(email)) {
      setError(language === 'es' ? 'Ingresa un correo electrónico válido.' : 'Please enter a valid email.');
      return;
    }
    if (!password) {
      setError(language === 'es' ? 'La contraseña es obligatoria.' : 'Password is required.');
      return;
    }

    try {
      setLoading(true);
      await loginUser(email, password);
      // Auth listener redirects automatically, but navigate as safeguard
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        setError(language === 'es' ? 'Credenciales incorrectas. Inténtalo de nuevo.' : 'Invalid credentials. Please try again.');
      } else {
        setError(err.message || (language === 'es' ? 'Error al iniciar sesión.' : 'Failed to log in.'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRecovery = async () => {
    setError('');
    setSuccessMsg('');
    if (!email) {
      setError(language === 'es' ? 'Introduce tu correo en el campo superior para recuperar la contraseña.' : 'Enter your email above to recover your password.');
      return;
    }
    if (!handleValidateEmail(email)) {
      setError(language === 'es' ? 'Introduce un correo válido.' : 'Please enter a valid email.');
      return;
    }

    try {
      setLoading(true);
      await recoverPassword(email);
      setSuccessMsg(language === 'es' 
        ? 'Se ha enviado un enlace de recuperación a tu correo electrónico.' 
        : 'A password recovery link has been sent to your email.');
    } catch (err) {
      setError(err.message || (language === 'es' ? 'Error al enviar enlace.' : 'Failed to send recovery link.'));
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
          {language === 'es' ? 'Bienvenido de vuelta a tu rincón de bienestar.' : 'Welcome back to your wellness corner.'}
        </p>

        {error && (
          <div className="flex items-center space-x-2 p-4 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-100/50 dark:border-rose-950/40">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-nunito font-semibold">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="flex items-center space-x-2 p-4 mb-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 text-sm border border-emerald-100/50 dark:border-emerald-950/40">
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-nunito font-semibold">{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-poppins">
              {t('email')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type="email"
                placeholder="nombre@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-xl font-nunito focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/40 focus:border-indigo-300 dark:focus:border-indigo-900"
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
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-xl font-nunito focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/40 focus:border-indigo-300 dark:focus:border-indigo-900"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center space-x-2 text-slate-500 dark:text-slate-400 font-nunito cursor-pointer">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-slate-200/50 text-indigo-600 focus:ring-indigo-500 bg-white/50"
              />
              <span>{language === 'es' ? 'Mantener sesión' : 'Remember me'}</span>
            </label>

            <button
              type="button"
              onClick={handleRecovery}
              className="text-indigo-600 dark:text-indigo-400 hover:underline font-nunito font-semibold"
            >
              {language === 'es' ? '¿Olvidaste tu contraseña?' : 'Forgot password?'}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>{loading ? (language === 'es' ? 'Iniciando...' : 'Logging in...') : t('login')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
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

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useAuth } from '../contexts/AuthContext';
import { User, Lock, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { trackPageView } from '../analytics/tracking';

const Register = () => {
  const { t, language } = useApp();
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    trackPageView('Register Screen');
  }, []);

  const isPasswordSecure = (val) => {
    // Requires at least 6 characters and at least one number or special character
    const hasNumOrSpec = /[0-9!@#$%^&*(),.?":{}|<>]/;
    return val.length >= 6 && hasNumOrSpec.test(val);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');

    const trimmedUser = username.trim();

    if (!trimmedUser) {
      setError(language === 'es' ? 'El nombre de usuario es obligatorio.' : 'Username is required.');
      return;
    }
    if (trimmedUser.length < 3) {
      setError(language === 'es' ? 'El nombre de usuario debe tener al menos 3 caracteres.' : 'Username must be at least 3 characters.');
      return;
    }
    if (!password) {
      setError(language === 'es' ? 'La contraseña es obligatoria.' : 'Password is required.');
      return;
    }
    if (!isPasswordSecure(password)) {
      setError(language === 'es' 
        ? 'La contraseña debe tener al menos 6 caracteres y contener al menos un número o carácter especial.' 
        : 'Password must be at least 6 characters and contain at least one number or special character.');
      return;
    }
    if (password !== confirmPassword) {
      setError(language === 'es' ? 'Las contraseñas no coinciden.' : 'Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      await registerUser(trimmedUser, password);
      navigate('/dashboard');
    } catch (err) {
      console.error(err);
      setError(err.message || (language === 'es' ? 'Error al crear la cuenta.' : 'Failed to create account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center py-10 px-4 select-none">
      <div className="w-full max-w-md glass border border-white/20 dark:border-white/5 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pastel-rose to-pastel-sky" />
        
        <h2 className="text-3xl font-extrabold font-poppins text-slate-800 dark:text-slate-100 text-center mb-1">
          {t('register')}
        </h2>
        <p className="text-sm font-nunito text-slate-500 dark:text-slate-400 text-center mb-6">
          {language === 'es' ? 'Crea una cuenta con un nombre de usuario.' : 'Create an account with a username.'}
        </p>

        {error && (
          <div className="flex items-center space-x-2 p-4 mb-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-sm border border-rose-100/50 dark:border-rose-950/40">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-nunito font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
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

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2 font-poppins">
              {t('confirm_password')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 w-5 h-5 text-slate-400" />
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-11 pr-12 py-3 bg-white/40 dark:bg-slate-900/40 border border-slate-200/50 dark:border-white/5 rounded-xl font-nunito focus:outline-none focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-900/40 focus:border-indigo-300 dark:focus:border-indigo-900 text-slate-800 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3.5 top-3.5 z-10 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                title={showConfirmPassword ? 'Ocultar contraseña' : 'Ver contraseña'}
              >
                {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-poppins"
          >
            <span>{loading ? (language === 'es' ? 'Creando cuenta...' : 'Creating account...') : t('register')}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-200/30 dark:border-white/5 text-center text-sm font-nunito">
          <span className="text-slate-500 dark:text-slate-400">{t('already_have_account')} </span>
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline">
            {t('login')}
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;

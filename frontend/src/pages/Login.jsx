import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Sprout, Phone, Lock, ArrowRight, AlertCircle, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { DEMO_USERS } from '../config/demoConfig';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect path from location state or default role dashboard
  const fromPath = location.state?.from?.pathname;

  const redirectByRole = (userRole) => {
    if (fromPath && fromPath !== '/login' && fromPath !== '/register') {
      navigate(fromPath, { replace: true });
      return;
    }
    if (userRole === 'buyer') {
      navigate('/buyer', { replace: true });
    } else if (userRole === 'fpo') {
      navigate('/fpo', { replace: true });
    } else {
      navigate('/farmer', { replace: true });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!phone.strip?.() && !phone) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setSubmitting(true);
    try {
      const loggedUser = await login(phone, password);
      redirectByRole(loggedUser.role);
    } catch (err) {
      setError(err.message || 'Phone number or password is incorrect.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (demoUser) => {
    setPhone(demoUser.phone);
    setPassword(demoUser.password);
    setError('');
    setSubmitting(true);
    try {
      const loggedUser = await login(demoUser.phone, demoUser.password);
      redirectByRole(loggedUser.role);
    } catch (err) {
      setError(err.message || 'Quick demo login failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-surface-bg">
      <div className="w-full max-w-md bg-surface-card rounded-3xl border border-border-subtle shadow-sm p-8 space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-agrigreen-700 text-white font-bold text-xl shadow-sm mb-1">
            <Sprout className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">AgriMitra</h1>
          <p className="text-sm font-medium text-text-secondary">
            {t('auth.login_to_account')}
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
              {t('auth.phone_number')}
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
              <input
                type="tel"
                placeholder={t('auth.phone_placeholder')}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
              {t('auth.password')}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder={t('auth.password_placeholder')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-agrigreen-700 hover:bg-agrigreen-900 text-white font-bold text-sm rounded-xl shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? t('auth.logging_in') : t('auth.login_button')}
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        {/* 1-Click Quick Demo Login Section */}
        <div className="pt-4 border-t border-border-subtle space-y-3">
          <div className="flex items-center justify-between text-xs text-text-secondary font-semibold">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              {t('auth.demo_credentials')}
            </span>
            <span className="text-[10px] text-text-secondary font-normal">1-Click</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {DEMO_USERS.map((demo) => (
              <button
                key={demo.id}
                type="button"
                onClick={() => handleQuickDemoLogin(demo)}
                className="py-2 px-2 rounded-xl bg-surface-subtle hover:bg-agrigreen-500/10 hover:text-agrigreen-700 hover:border-emerald-300 border border-border-subtle text-text-primary text-xs font-semibold transition-all flex flex-col items-center justify-center text-center gap-0.5"
              >
                <UserCheck className="w-3.5 h-3.5 text-agrigreen-700" />
                <span className="capitalize">{t(`auth.${demo.role}`) || demo.role}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Link to Register */}
        <div className="text-center pt-2 text-xs text-text-secondary">
          {t('auth.dont_have_account')}{' '}
          <Link to="/register" className="font-bold text-agrigreen-700 hover:underline">
            {t('auth.register_here')}
          </Link>
        </div>

      </div>
    </div>
  );
}

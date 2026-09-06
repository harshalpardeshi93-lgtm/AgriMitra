import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sprout, User, Phone, Lock, MapPin, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [location, setLocation] = useState('');
  const [role, setRole] = useState('farmer');

  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      setError('Please enter your phone number.');
      return;
    }
    if (!password || password.length < 3) {
      setError('Password must be at least 3 characters long.');
      return;
    }

    setSubmitting(true);
    try {
      const createdUser = await register({
        name: name.trim(),
        phone: phone.trim(),
        password,
        location: location.trim(),
        role
      });

      // Redirect by role
      if (createdUser.role === 'buyer') {
        navigate('/buyer', { replace: true });
      } else if (createdUser.role === 'fpo') {
        navigate('/fpo', { replace: true });
      } else {
        navigate('/farmer', { replace: true });
      }
    } catch (err) {
      setError(err.message || 'We couldn\'t create your account. Please try again.');
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
          <h1 className="text-2xl font-bold text-text-primary">Create Account</h1>
          <p className="text-sm font-medium text-text-secondary">
            Join AgriMitra's direct agricultural market network
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-2xl text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Role Selector */}
          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-2">
              Select Your Role
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'farmer', label: 'Farmer' },
                { id: 'buyer', label: 'Buyer' },
                { id: 'fpo', label: 'FPO' },
              ].map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setRole(r.id)}
                  className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1 ${
                    role === r.id
                      ? 'bg-agrigreen-500/10 text-agrigreen-900 border-agrigreen-500 ring-2 ring-emerald-700/20'
                      : 'bg-surface-bg text-text-secondary border-border-subtle hover:bg-surface-subtle'
                  }`}
                >
                  {role === r.id && <CheckCircle2 className="w-3.5 h-3.5 text-agrigreen-700" />}
                  <span>{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
              Full Name
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. Harshal Pardeshi"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
              Location / District
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. Nashik, Maharashtra"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full bg-surface-bg border border-border-subtle rounded-xl pl-10 pr-4 py-2.5 text-text-primary text-sm focus:ring-2 focus:ring-emerald-700 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase text-text-secondary tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-text-secondary absolute left-3.5 top-3" />
              <input
                type="password"
                placeholder="Create password"
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
            {submitting ? 'Creating Account...' : 'Create Account'}
            <ArrowRight className="w-4 h-4" />
          </button>

        </form>

        {/* Link to Login */}
        <div className="text-center pt-2 text-xs text-text-secondary">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-agrigreen-700 hover:underline">
            Login
          </Link>
        </div>

      </div>
    </div>
  );
}

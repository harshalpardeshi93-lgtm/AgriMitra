import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import { Sprout, Users, Building2, Store, Menu, X, Activity, LogOut, LogIn, UserPlus, Sparkles, LayoutDashboard } from 'lucide-react';
import { fetchHealthStatus } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function MainLayout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [apiHealth, setApiHealth] = useState({ status: 'checking', service: 'Connecting...' });
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    let isMounted = true;
    fetchHealthStatus().then((data) => {
      if (isMounted) setApiHealth(data);
    });
    return () => { isMounted = false; };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getDashboardPath = () => {
    if (!user) return '/farmer';
    if (user.role === 'buyer') return '/buyer';
    if (user.role === 'fpo') return '/fpo';
    return '/farmer';
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col bg-surface-bg text-text-primary selection:bg-agrigreen-500/20 selection:text-agrigreen-900">
      
      {/* Top Banner for API Status & Hackathon Demo Tag */}
      <div className="bg-stone-900 text-stone-300 text-xs py-2 px-4 border-b border-stone-800">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-agrigreen-500 animate-pulse"></span>
            <span className="font-semibold text-stone-200">AgriMitra</span>
            <span className="text-text-secondary">|</span>
            <span className="text-text-secondary">AI-Powered Market Intelligence</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-text-secondary" />
              <span className="text-text-secondary">Backend API:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-mono ${
                apiHealth.status === 'ok' 
                  ? 'bg-agrigreen-900 text-agrigreen-500 border border-agrigreen-700' 
                  : 'bg-amber-950 text-amber-500 border border-amber-600'
              }`}>
                {apiHealth.service} ({apiHealth.status})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header / Navigation */}
      <header className="sticky top-0 z-40 bg-surface-card/95 backdrop-blur-md border-b border-border-subtle/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo / Brand */}
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 rounded-xl bg-agrigreen-700 text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:bg-agrigreen-900 transition-colors">
                <Sprout className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-text-primary tracking-tight leading-none group-hover:text-agrigreen-700 transition-colors">
                  AgriMitra
                </span>
                <span className="text-[10px] text-text-secondary font-medium tracking-wide uppercase mt-0.5">
                  Market Intelligence
                </span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/') && location.pathname === '/'
                    ? 'bg-agrigreen-500/10 text-agrigreen-900 font-semibold border border-agrigreen-500/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                }`}
              >
                Home
              </Link>

              <Link
                to="/farmer"
                className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/farmer')
                    ? 'bg-agrigreen-500/10 text-agrigreen-900 font-semibold border border-agrigreen-500/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-surface-subtle'
                }`}
              >
                Markets
              </Link>

              <a
                href="#how-it-works"
                className="px-3.5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle transition-colors"
                onClick={(e) => {
                  if (location.pathname !== '/') {
                    // Navigate home first if not on home
                    navigate('/#how-it-works');
                  } else {
                    const el = document.getElementById('how-it-works');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
                How It Works
              </a>

              {/* Role-Specific Portal Links when logged in */}
              {user && (
                <>
                  <Link
                    to={getDashboardPath()}
                    className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5 ${
                      isActive('/farmer') || isActive('/buyer') || isActive('/fpo')
                        ? 'bg-agrigreen-500/10 text-agrigreen-900 border border-agrigreen-500/30'
                        : 'text-text-secondary hover:bg-surface-subtle'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-agrigreen-700" />
                    <span>Dashboard</span>
                  </Link>

                  {user.role === 'buyer' && (
                    <Link
                      to="/buyer"
                      className="px-3.5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
                    >
                      Buyer Portal
                    </Link>
                  )}

                  {user.role === 'fpo' && (
                    <Link
                      to="/fpo"
                      className="px-3.5 py-2 rounded-lg text-sm font-medium text-text-secondary hover:text-text-primary hover:bg-surface-subtle"
                    >
                      FPO Hub
                    </Link>
                  )}
                </>
              )}
            </nav>

            {/* User Account / Action Buttons */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3 bg-surface-subtle p-1.5 pl-3.5 rounded-xl border border-border-subtle">
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold text-text-primary leading-tight">
                      {user.name}
                    </span>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-agrigreen-700">
                      {user.role}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleLogout}
                    title="Logout"
                    className="p-2 rounded-lg bg-surface-card text-text-secondary hover:text-red-700 hover:bg-red-50 border border-border-subtle transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle text-sm font-semibold transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-text-secondary" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/login"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-agrigreen-700 hover:bg-agrigreen-900 text-white text-sm font-semibold transition-all shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Try Demo</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-text-secondary hover:text-text-primary hover:bg-surface-subtle focus:outline-none"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-border-subtle bg-surface-card px-4 pt-2 pb-4 space-y-2">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium text-text-primary hover:bg-surface-subtle"
            >
              Home
            </Link>
            <Link
              to="/farmer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium text-text-primary hover:bg-surface-subtle"
            >
              Markets
            </Link>
            <Link
              to="/buyer"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium text-text-primary hover:bg-surface-subtle"
            >
              Buyer Dashboard
            </Link>
            <Link
              to="/fpo"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2.5 rounded-xl text-base font-medium text-text-primary hover:bg-surface-subtle"
            >
              FPO Hub
            </Link>

            <div className="pt-3 border-t border-border-subtle mt-2 space-y-2">
              {user ? (
                <div className="space-y-2">
                  <div className="px-3 py-2 bg-surface-subtle rounded-xl border border-border-subtle flex justify-between items-center">
                    <div>
                      <div className="font-bold text-text-primary text-sm">{user.name}</div>
                      <div className="text-xs uppercase font-semibold text-agrigreen-700">{user.role}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-stone-900 text-white font-medium text-sm"
                  >
                    <LogOut className="w-4 h-4 text-red-400" />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    to="/login"
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-surface-subtle text-text-primary text-sm font-semibold"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl bg-agrigreen-700 text-white text-sm font-semibold"
                  >
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>Try Demo</span>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Content Body */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Reusable Footer */}
      <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-agrigreen-700 text-white flex items-center justify-center font-bold">
                  <Sprout className="w-4 h-4" />
                </div>
                <span className="font-bold text-white text-base">AgriMitra</span>
              </div>
              <p className="text-text-secondary text-xs leading-relaxed">
                Empowering Indian farmers & FPOs with transparent market price discovery, direct buyer connections, and actionable agricultural intelligence.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Portals</h4>
              <ul className="space-y-2 text-text-secondary text-xs">
                <li><Link to="/farmer" className="hover:text-agrigreen-500 transition-colors">Farmer Portal</Link></li>
                <li><Link to="/buyer" className="hover:text-agrigreen-500 transition-colors">Buyer Dashboard</Link></li>
                <li><Link to="/fpo" className="hover:text-agrigreen-500 transition-colors">FPO Hub</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Features</h4>
              <ul className="space-y-2 text-text-secondary text-xs">
                <li>APMC Modal Price Comparison</li>
                <li>AI Sell Advisor</li>
                <li>Direct Buyer Match & Offers</li>
                <li>Payment Status Tracking</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white text-xs uppercase tracking-wider mb-3">Platform Information</h4>
              <p className="text-text-secondary text-xs leading-relaxed">
                SIH Hackathon Prototype. Operates with local seed data and AI-assisted market estimation.
              </p>
              <div className="mt-4 text-[11px] text-text-secondary">
                © {new Date().getFullYear()} AgriMitra. All rights reserved.
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

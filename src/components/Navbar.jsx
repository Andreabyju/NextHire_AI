import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiMenu, FiX, FiUser, FiLogOut, FiLayout } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home',     href: '#home' },
    { name: 'Features', href: '#features' },
    { name: 'About',    href: '#why-choose' },
    { name: 'Contact',  href: '#footer' },
  ];

  const handleLogout = () => {
    logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  return (
    <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
      scrolled
        ? 'bg-[#050816]/80 backdrop-blur-md border-b border-white/5 py-4 shadow-lg shadow-black/20'
        : 'bg-transparent py-6'
    }`}>
      <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)] transition-transform duration-300 group-hover:scale-105">
            <HiSparkles className="text-white text-xl animate-pulse-glow" />
          </div>
          <span className="font-space text-xl font-bold tracking-tight text-white transition-all duration-300 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-blueAccent-light group-hover:to-violetAccent-light">
            NextHire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">AI</span>
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              className="font-sans text-sm font-medium text-textGray hover:text-white transition-colors duration-200"
            >
              {link.name}
            </a>
          ))}
        </div>

        {/* Desktop CTA — adapts based on auth state */}
        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated ? (
            /* ── Logged-in state ── */
            <div className="flex items-center gap-3">
              {/* Welcome greeting */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-blueAccent/50 to-violetAccent/50 flex items-center justify-center">
                  <FiUser className="text-white text-xs" />
                </div>
                <span className="text-sm font-medium text-white">
                  Hi, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light font-semibold">{user?.name}</span>
                </span>
              </div>

              {/* Dashboard link */}
              <button
                id="navbar-dashboard-btn"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-white transition-colors duration-200"
              >
                <FiLayout size={14} />
                Dashboard
              </button>

              {/* Sign Out */}
              <button
                id="navbar-signout-btn"
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-slate-400 hover:text-red-400 transition-colors duration-200"
              >
                <FiLogOut size={14} />
                Sign Out
              </button>
            </div>
          ) : (
            /* ── Guest state ── */
            <>
              <button
                id="navbar-signin-btn"
                onClick={() => navigate('/portal')}
                className="text-sm font-medium text-textGray hover:text-white transition-colors duration-200"
              >
                Sign In
              </button>
              <button
                id="navbar-signup-btn"
                onClick={() => navigate('/sign-up')}
                className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-medium text-white rounded-lg group bg-gradient-to-br from-blueAccent to-violetAccent shadow-[0_0_15px_rgba(124,58,237,0.25)] hover:shadow-[0_0_25px_rgba(124,58,237,0.45)] transition-all duration-300"
              >
                <span className="relative px-5 py-2.5 transition-all ease-in duration-75 bg-[#050816] rounded-md group-hover:bg-opacity-0">
                  Get Started
                </span>
              </button>
            </>
          )}
        </div>

        {/* Mobile Toggle */}
        <button
          id="navbar-mobile-toggle"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden text-white hover:text-blueAccent-light transition-colors"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-[#050816]/95 backdrop-blur-lg border-b border-white/5 py-6 px-6 flex flex-col gap-6 animate-fade-in">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-textGray hover:text-white transition-colors"
            >
              {link.name}
            </a>
          ))}
          <div className="h-px bg-white/5 my-2" />

          {isAuthenticated ? (
            <div className="flex flex-col gap-4">
              {/* Mobile welcome */}
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blueAccent/40 to-violetAccent/40 border border-white/10 flex items-center justify-center">
                  <FiUser className="text-white text-sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Hi, {user?.name}</p>
                  <p className="text-[11px] text-slate-500">{user?.email}</p>
                </div>
              </div>
              <button
                id="mobile-dashboard-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/dashboard'); }}
                className="text-center py-2.5 font-medium text-slate-400 hover:text-white transition-colors flex items-center gap-2"
              >
                <FiLayout size={14} /> Dashboard
              </button>
              <button
                id="mobile-signout-btn"
                onClick={handleLogout}
                className="text-center py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/10 font-medium transition-all"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                id="mobile-signin-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/portal'); }}
                className="text-center py-2.5 font-medium text-textGray hover:text-white transition-colors"
              >
                Sign In
              </button>
              <button
                id="mobile-signup-btn"
                onClick={() => { setMobileMenuOpen(false); navigate('/sign-up'); }}
                className="text-center py-3 rounded-xl bg-gradient-to-r from-blueAccent to-violetAccent text-white font-medium shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:opacity-90 transition-opacity"
              >
                Get Started Free
              </button>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}

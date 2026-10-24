import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiFileText, FiMic, FiCode, FiActivity,
  FiSettings, FiLogOut, FiUser, FiBell, FiSearch,
  FiChevronRight, FiAward, FiTrendingUp, FiClock,
  FiBarChart2, FiBookOpen, FiThumbsUp, FiChevronLeft,
  FiAlertCircle, FiCheckCircle,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import DashboardPreview from '../../components/DashboardPreview';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';


const SIDEBAR_LINKS = [
  { icon: FiHome,      label: 'Overview',       id: 'overview',        path: null },
  { icon: FiBell,      label: 'Recruiter Requests', id: 'recruiter-requests', path: null },
  { icon: FiFileText,  label: 'Resume',          id: 'resume',          path: '/resume-analyzer' },
  { icon: FiMic,       label: 'Mock Interview',  id: 'mock',            path: '/interview/setup' },
  { icon: FiCode,      label: 'Assessments',     id: 'assessments',     path: null },
  { icon: FiBarChart2, label: 'Progress',        id: 'progress',        path: null },
  { icon: FiAward,     label: 'Results',         id: 'results',         path: '/interview/history' },
  { icon: FiThumbsUp,  label: 'Recommendations', id: 'recommendations', path: null },
  { icon: FiBookOpen,  label: 'Resources',       id: 'resources',       path: null },
];

// Time-of-day greeting
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Relative time formatter
function timeAgo(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const ACTIVITY_ICONS = {
  USER_REGISTERED:    { icon: FiUser,       color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  USER_LOGIN:         { icon: FiCheckCircle, color: 'text-blueAccent-light', bg: 'bg-blueAccent/10' },
  USER_LOGOUT:        { icon: FiLogOut,     color: 'text-slate-400', bg: 'bg-slate-500/10' },
  INTERVIEW_STARTED:  { icon: FiMic,        color: 'text-violet-400', bg: 'bg-violet-500/10' },
  INTERVIEW_COMPLETED:{ icon: FiAward,      color: 'text-amber-400', bg: 'bg-amber-500/10' },
  ASSESSMENT_COMPLETED:{ icon: FiCode,      color: 'text-pink-400', bg: 'bg-pink-500/10' },
  RESUME_UPLOADED:    { icon: FiFileText,   color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
  PROFILE_UPDATED:    { icon: FiSettings,   color: 'text-slate-300', bg: 'bg-slate-500/10' },
  PASSWORD_CHANGED:   { icon: FiAlertCircle,color: 'text-orange-400', bg: 'bg-orange-500/10' },
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, loading, token, logout } = useAuth();

  const [activeLink, setActiveLink] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Real API data
  const [profile, setProfile] = useState(null);
  const [stats, setStats]   = useState(null);
  const [activity, setActivity] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Recruiter invitations state
  const [invitations, setInvitations] = useState([]);

  // Unauthorized redirect message
  const unauthorized = location.state?.unauthorized;

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/sign-in');
    }
  }, [loading, isAuthenticated, navigate]);

  // Fetch user data from backend
  const fetchData = useCallback(async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [profileRes, statsRes, activityRes, invitesRes] = await Promise.all([
        fetch(`${API_BASE}/api/user/profile`, { headers }),
        fetch(`${API_BASE}/api/user/stats`, { headers }),
        fetch(`${API_BASE}/api/user/activity?limit=10`, { headers }),
        fetch(`${API_BASE}/api/user/invitations`, { headers }).catch(() => null),
      ]);

      if (profileRes.ok) setProfile(await profileRes.json());
      if (statsRes.ok)   setStats(await statsRes.json());
      if (activityRes.ok) {
        const d = await activityRes.json();
        setActivity(d.activities || []);
      }
      if (invitesRes && invitesRes.ok) {
        const d = await invitesRes.json();
        if (d.success && d.invitations) {
          setInvitations(d.invitations);
        }
      }
    } catch (e) {
      console.error('Dashboard fetch error:', e);
    } finally {
      setDataLoading(false);
    }
  }, [token]);

  const handleAcceptInvitation = async (inviteId) => {
    if (inviteId.startsWith('inv_sim_')) {
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === inviteId ? { ...inv, status: 'accepted' } : inv
        )
      );
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const res = await fetch(`${API_BASE}/api/user/invitations/${inviteId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'accepted' }),
      });
      if (res.ok) {
        setInvitations(prev =>
          prev.map(inv =>
            inv.id === inviteId ? { ...inv, status: 'accepted' } : inv
          )
        );
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to accept invitation');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleDeclineInvitation = async (inviteId) => {
    if (inviteId.startsWith('inv_sim_')) {
      setInvitations(prev =>
        prev.map(inv =>
          inv.id === inviteId ? { ...inv, status: 'declined' } : inv
        )
      );
      return;
    }

    try {
      const headers = {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      };
      const res = await fetch(`${API_BASE}/api/user/invitations/${inviteId}/status`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'declined' }),
      });
      if (res.ok) {
        setInvitations(prev =>
          prev.map(inv =>
            inv.id === inviteId ? { ...inv, status: 'declined' } : inv
          )
        );
        fetchData();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to decline invitation');
      }
    } catch (err) {
      alert('Error connecting to server.');
    }
  };

  const handleSimulateInvitation = () => {
    const newInv = {
      id: `inv_sim_${Date.now()}`,
      companyName: 'Aether Tech Solutions',
      mentorName: 'Emily Stone (Head of Engineering)',
      jobTitle: 'Senior Frontend Developer (React/Vite)',
      message: 'Your resume and project achievements look excellent. We are seeking a senior frontend developer who has strong styling and SPA lifecycle control.',
      dateSent: new Date().toLocaleDateString(),
      status: 'pending'
    };
    setInvitations(prev => [newInv, ...prev]);
  };

  useEffect(() => {
    if (!loading && isAuthenticated) fetchData();
  }, [loading, isAuthenticated, fetchData]);

  const handleSignOut = () => { logout(); navigate('/sign-in'); };

  if (loading || !isAuthenticated) return null;

  const firstName = (profile?.name || user?.name || 'there').split(' ')[0];
  const progress  = stats?.overallProgress ?? 0;

  const statCards = [
    {
      label: 'Interviews Done',
      value: stats?.interviewCount ?? 0,
      delta: 'AI mock sessions',
      icon: FiMic,
      color: 'from-blueAccent to-blueAccent-light',
    },
    {
      label: 'Assessments',
      value: stats?.assessmentCount ?? 0,
      delta: 'Completed tests',
      icon: FiCode,
      color: 'from-violetAccent to-violetAccent-light',
    },
    {
      label: 'Resume Score',
      value: stats?.latestResumeScore != null ? `${stats.latestResumeScore}` : '—',
      delta: stats?.resumeCount ? `${stats.resumeCount} resume${stats.resumeCount !== 1 ? 's' : ''} analyzed` : 'No resumes yet',
      icon: FiFileText,
      color: 'from-cyan-600 to-cyan-400',
    },
    {
      label: 'Progress',
      value: `${progress}%`,
      delta: 'Overall preparation',
      icon: FiTrendingUp,
      color: 'from-emerald-600 to-emerald-400',
    },
  ];

  return (
    <div className="min-h-screen bg-[#050816] text-white flex overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside
        className={`relative z-20 flex flex-col bg-[#0a0f1e] border-r border-white/5 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.35)]">
            <HiSparkles className="text-white text-base" />
          </div>
          {sidebarOpen && (
            <span className="font-space font-bold text-base tracking-tight whitespace-nowrap overflow-hidden">
              NextHire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">AI</span>
            </span>
          )}
        </div>

        {/* User chip */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blueAccent/10 to-violetAccent/10 border border-white/8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blueAccent/50 to-violetAccent/50 flex items-center justify-center flex-shrink-0">
              <FiUser className="text-white text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{profile?.name || user?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{profile?.role || user?.role}</p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {SIDEBAR_LINKS.map(({ icon: Icon, label, id, path }) => (
            <button
              key={id}
              id={`sidebar-${id}`}
              onClick={() => path ? navigate(path) : setActiveLink(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeLink === id
                  ? 'bg-gradient-to-r from-blueAccent/20 to-violetAccent/10 text-white border border-white/8'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`text-lg min-w-[18px] flex-shrink-0 ${activeLink === id ? 'text-blueAccent-light' : ''}`} />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
              {sidebarOpen && activeLink === id && <FiChevronRight className="ml-auto text-xs opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Bottom: Settings & Sign Out */}
        <div className="py-4 px-2 border-t border-white/5 space-y-0.5">
          <button
            id="sidebar-settings"
            onClick={() => setActiveLink('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              activeLink === 'settings'
                ? 'bg-gradient-to-r from-blueAccent/20 to-violetAccent/10 text-white border border-white/8'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FiSettings className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            id="signout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <FiLogOut className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          id="sidebar-collapse"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0a0f1e] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
        >
          {sidebarOpen ? <FiChevronLeft size={12} /> : <FiChevronRight size={12} />}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Header Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#050816]/80 backdrop-blur-sm">
          <div className="flex items-center gap-4">
            {/* Search bar */}
            <div className="relative hidden md:flex items-center">
              <FiSearch className="absolute left-3 text-slate-500 text-sm" />
              <input
                id="dashboard-search"
                type="text"
                placeholder="Search resources..."
                className="bg-white/5 border border-white/8 rounded-xl pl-9 pr-4 py-2 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blueAccent/40 focus:ring-1 focus:ring-blueAccent/20 w-56 transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
             {/* Notification bell */}
            <button
              id="notifications-btn"
              onClick={() => setActiveLink('recruiter-requests')}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white transition-all duration-200"
            >
              <FiBell size={16} />
              {invitations.some(inv => inv.status === 'pending') && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violetAccent rounded-full ring-2 ring-[#050816]" />
              )}
            </button>

            {/* User avatar */}
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blueAccent/40 to-violetAccent/40 border border-white/10 flex items-center justify-center">
                <FiUser className="text-white text-base" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white leading-tight">{profile?.name || user?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{profile?.role || user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page Body — scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">

          {/* Unauthorized warning (when redirected from admin) */}
          <AnimatePresence>
            {unauthorized && (
              <motion.div
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
              >
                <FiAlertCircle className="flex-shrink-0" />
                <span>Access denied — Admin dashboard requires administrator privileges.</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Welcome Banner */}
          {activeLink === 'recruiter-requests' ? (
            <RecruiterRequestsView
              invitations={invitations}
              onAccept={handleAcceptInvitation}
              onDecline={handleDeclineInvitation}
              onSimulate={handleSimulateInvitation}
            />
          ) : (
            <>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
            <h1 className="text-2xl md:text-3xl font-bold font-space text-white">
              {getGreeting()},{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">
                {firstName}
              </span>{' '}
              👋
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {profile?.memberSince
                ? `Member since ${new Date(profile.memberSince).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} · Ready to level up your interviews?`
                : "Ready to level up your interview skills today?"}
            </p>
          </motion.div>

          {/* Stat Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4"
          >
            {statCards.map(({ label, value, delta, icon: Icon, color }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + i * 0.07 }}
                className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all duration-300 group"
              >
                <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center mb-3 shadow-lg opacity-90 group-hover:opacity-100 transition-opacity`}>
                  <Icon className="text-white text-base" />
                </div>
                {dataLoading ? (
                  <div className="h-8 w-16 bg-white/5 rounded-lg animate-pulse mb-1" />
                ) : (
                  <p className="text-2xl font-bold font-space text-white">{value}</p>
                )}
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">{delta}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-sm font-bold font-space text-white">Overall Preparation Progress</h2>
                <p className="text-xs text-slate-500 mt-0.5">Complete interviews and assessments to raise your score</p>
              </div>
              <span className="text-2xl font-bold font-space text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">
                {progress}%
              </span>
            </div>
            <div className="h-2.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 1.2, delay: 0.5, ease: 'easeOut' }}
                className="h-full rounded-full bg-gradient-to-r from-blueAccent to-violetAccent shadow-[0_0_10px_rgba(124,58,237,0.4)]"
              />
            </div>
            <div className="grid grid-cols-3 gap-4 mt-5">
              {[
                { label: 'Technical', value: stats?.technicalPerformance ?? 0 },
                { label: 'Communication', value: stats?.communicationPerformance ?? 0 },
                { label: 'Aptitude', value: stats?.aptitudePerformance ?? 0 },
              ].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span>{label}</span>
                    <span className="text-white font-medium">{value}%</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 1, delay: 0.8 }}
                      className="h-full rounded-full bg-gradient-to-r from-blueAccent/70 to-violetAccent/70"
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Dashboard Preview + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

            {/* Interview Prep Workspace */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="lg:col-span-2"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-space text-white">Interview Prep Workspace</h2>
                <span className="text-xs text-slate-500 bg-white/5 border border-white/8 px-3 py-1 rounded-full">Live Session</span>
              </div>
              <DashboardPreview />
            </motion.div>

            {/* Recent Activity */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-space text-white">Recent Activity</h2>
                <span className="text-xs text-slate-500">{activity.length} events</span>
              </div>
              <div className="space-y-2">
                {dataLoading && (
                  [...Array(4)].map((_, i) => (
                    <div key={i} className="h-12 rounded-xl bg-white/3 animate-pulse border border-white/5" />
                  ))
                )}
                {!dataLoading && activity.length === 0 && (
                  <div className="text-center py-8 text-slate-600 text-sm bg-[#0a0f1e] border border-white/5 rounded-xl">
                    <FiActivity className="mx-auto text-2xl mb-2 opacity-30" />
                    No activity yet
                  </div>
                )}
                {!dataLoading && activity.map((a, i) => {
                  const { icon: Icon, color, bg } = ACTIVITY_ICONS[a.activityType] || { icon: FiActivity, color: 'text-slate-400', bg: 'bg-slate-500/10' };
                  return (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#0a0f1e] border border-white/5 hover:border-white/10 transition-colors"
                    >
                      <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                        <Icon className={`text-sm ${color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-slate-300 leading-snug truncate">{a.description}</p>
                        <p className="text-[10px] text-slate-600 mt-0.5">{timeAgo(a.timestamp)}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>

          {/* Quick Action Cards */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.35 }}
          >
            <h2 className="text-base font-bold font-space text-white mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { icon: FiFileText, label: 'Analyze Resume', desc: 'Upload & get instant AI feedback', color: 'text-blueAccent-light', bg: 'from-blueAccent/15 to-blueAccent/5', border: 'hover:border-blueAccent/40', id: 'analyze-resume', onClick: () => navigate('/resume-analyzer') },
                { icon: FiMic,      label: 'Start Mock Interview', desc: 'Practice with AI voice coach', color: 'text-violetAccent-light', bg: 'from-violetAccent/15 to-violetAccent/5', border: 'hover:border-violetAccent/40', id: 'start-interview', onClick: () => navigate('/interview/setup') },
                { icon: FiCode,     label: 'Coding Challenge', desc: 'Solve problems with AI hints', color: 'text-pink-400', bg: 'from-pink-600/15 to-pink-600/5', border: 'hover:border-pink-500/40', id: 'coding-challenge', onClick: null },
              ].map(({ icon: Icon, label, desc, color, bg, border, id, onClick }) => (
                <button
                  key={id}
                  id={`quick-action-${id}`}
                  onClick={onClick || undefined}
                  className={`text-left p-5 rounded-2xl bg-gradient-to-br ${bg} border border-white/8 ${border} transition-all duration-300 group hover:scale-[1.01]`}
                >
                  <Icon className={`text-xl ${color} mb-3`} />
                  <p className="text-sm font-semibold text-white">{label}</p>
                  <p className="text-xs text-slate-500 mt-1">{desc}</p>
                  <div className={`flex items-center gap-1 text-xs ${color} mt-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200`}>
                    Get started <FiChevronRight />
                  </div>
                </button>
              ))}
            </div>
          </motion.div>

          {/* AI Recommendations */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-violetAccent/10 to-blueAccent/5 border border-violetAccent/20 rounded-2xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violetAccent/30 to-blueAccent/20 border border-violetAccent/20 flex items-center justify-center flex-shrink-0">
                <HiSparkles className="text-violetAccent-light text-lg" />
              </div>
              <div>
                <h2 className="text-sm font-bold font-space text-white mb-1">AI Recommendations</h2>
                <p className="text-xs text-slate-400 leading-relaxed mb-3">
                  Based on your activity, here's what we suggest to maximize your interview success:
                </p>
                <ul className="space-y-2">
                  {[
                    'Complete at least 3 mock interviews this week to build confidence',
                    'Upload your resume for AI-powered keyword optimization',
                    'Practice system design questions for senior roles',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <FiCheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </motion.div>
          </>
          )}

        </div>
      </main>
    </div>
  );
}

function RecruiterRequestsView({ invitations, onAccept, onDecline, onSimulate }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold font-space text-white">Recruiter Requests</h1>
          <p className="text-sm text-slate-400 mt-1">Review recruitment invitations and respond to recruiters.</p>
        </div>
        <button
          onClick={onSimulate}
          className="px-4 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-violet-600/15"
        >
          + Simulate Recruiter Request
        </button>
      </div>

      <div className="p-4 bg-violetAccent/10 border border-violetAccent/20 rounded-2xl text-xs leading-relaxed text-violetAccent-light">
        <strong className="font-bold">✓ Recruitment Invitations Live:</strong> Review and accept invitations sent from recruiters/mentors. Accepting an invitation allows the recruiter to view your profile and contact information in their shortlisted candidates dashboard.
      </div>

      {invitations.length === 0 ? (
        <div className="py-12 text-center text-slate-500 bg-[#0a0f1e] border border-white/5 rounded-2xl">
          No invitations received yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {invitations.map(inv => (
            <div
              key={inv.id}
              className={`p-6 rounded-2xl border transition-all ${
                inv.status === 'accepted'
                  ? 'border-emerald-500/20 bg-emerald-500/5'
                  : inv.status === 'declined'
                    ? 'border-red-500/10 bg-red-500/2'
                    : 'border-white/8 bg-[#0a0f1e] hover:border-white/12'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                <div>
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Recruiter Invitation</span>
                  <h3 className="text-lg font-bold text-white mt-1">{inv.companyName}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{inv.mentorName} • Sent {inv.dateSent}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 font-medium">Position:</span>
                  <span className="text-xs font-bold text-violetAccent-light bg-violetAccent/10 px-2.5 py-1 rounded-md border border-violetAccent/10">{inv.jobTitle}</span>
                </div>
              </div>

              <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-4">
                <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">Invitation Message</span>
                <p className="text-xs text-slate-300 leading-relaxed font-mono">
                  "{inv.message}"
                </p>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 pt-2">
                <div>
                  {inv.status === 'accepted' && (
                    <div className="text-xs text-emerald-400 font-medium flex items-center gap-1.5">
                      <FiCheckCircle /> Invitation accepted! The recruiter has been notified and can now access your profile.
                    </div>
                  )}
                  {inv.status === 'declined' && (
                    <div className="text-xs text-red-400 font-medium flex items-center gap-1.5">
                      <FiAlertCircle /> Invitation declined.
                    </div>
                  )}
                  {inv.status === 'pending' && (
                    <div className="text-xs text-slate-500">
                      Please accept or decline this recruitment request.
                    </div>
                  )}
                </div>

                {inv.status === 'pending' && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => onDecline(inv.id)}
                      className="px-4 py-2 bg-red-500/10 hover:bg-red-500/25 text-red-400 hover:text-red-300 rounded-xl border border-red-500/10 hover:border-red-500/25 transition-all text-xs font-bold"
                    >
                      DECLINE
                    </button>
                    <button
                      onClick={() => onAccept(inv.id)}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-all text-xs font-bold shadow-md hover:shadow-emerald-600/15"
                    >
                      ACCEPT
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  FiUsers, FiShield, FiActivity, FiLogOut, FiUser, FiSearch,
  FiRefreshCw, FiChevronRight, FiHome, FiBarChart2, FiSettings,
  FiAlertCircle, FiCheckCircle, FiXCircle, FiTrash2, FiEye,
  FiFilter, FiMail, FiCalendar, FiClock, FiX, FiToggleLeft, FiToggleRight,
  FiTrendingUp, FiZap, FiFileText,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';


// ── Helpers ──────────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}
function formatDateTime(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function timeAgo(iso) {
  if (!iso) return 'Never';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
function getInitials(name = '') {
  return name.split(' ').slice(0, 2).map(w => w[0]?.toUpperCase() ?? '').join('');
}
const AVATAR_COLORS = [
  'from-blue-500 to-blue-400',
  'from-violet-500 to-violet-400',
  'from-pink-500 to-pink-400',
  'from-emerald-500 to-emerald-400',
  'from-amber-500 to-amber-400',
  'from-cyan-500 to-cyan-400',
  'from-rose-500 to-rose-400',
];
function avatarColor(name = '') {
  return AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
}

const ACTIVITY_ICONS = {
  USER_REGISTERED:    { icon: FiUser,        color: 'text-emerald-400', bg: 'bg-emerald-500/15' },
  USER_LOGIN:         { icon: FiCheckCircle, color: 'text-blue-400',    bg: 'bg-blue-500/15' },
  USER_LOGOUT:        { icon: FiLogOut,      color: 'text-slate-400',   bg: 'bg-slate-500/15' },
  INTERVIEW_STARTED:  { icon: FiZap,         color: 'text-violet-400',  bg: 'bg-violet-500/15' },
  INTERVIEW_COMPLETED:{ icon: FiCheckCircle, color: 'text-amber-400',   bg: 'bg-amber-500/15' },
  ASSESSMENT_COMPLETED:{ icon: FiBarChart2,  color: 'text-pink-400',    bg: 'bg-pink-500/15' },
  RESUME_UPLOADED:    { icon: FiUser,        color: 'text-cyan-400',    bg: 'bg-cyan-500/15' },
  PROFILE_UPDATED:    { icon: FiSettings,    color: 'text-slate-300',   bg: 'bg-slate-500/15' },
  PASSWORD_CHANGED:   { icon: FiAlertCircle, color: 'text-orange-400',  bg: 'bg-orange-500/15' },
};

const SIDEBAR_LINKS = [
  { icon: FiHome,      label: 'Overview',    id: 'overview' },
  { icon: FiUsers,     label: 'Users',       id: 'users' },
  { icon: FiActivity,  label: 'Activity',    id: 'activity' },
  { icon: FiBarChart2, label: 'Statistics',  id: 'stats' },
  { icon: FiSettings,  label: 'Settings',    id: 'settings' },
];

// ── Custom Tooltip for Charts ─────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#0d1225] border border-white/10 rounded-xl px-3 py-2 text-xs shadow-xl">
      <p className="text-slate-400 mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.name} className="text-white font-semibold">{p.name}: {p.value}</p>
      ))}
    </div>
  );
}

// ── User Detail Modal ─────────────────────────────────────────────────────────
function UserDetailModal({ user, token, onClose, onStatusChange }) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/admin/users/${user.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) setDetail(await res.json());
      } finally { setLoading(false); }
    })();
  }, [user, token]);

  const handleStatusToggle = async () => {
    if (!detail) return;
    const newStatus = detail.accountStatus === 'active' ? 'suspended' : 'active';
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${detail.id}/status`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setDetail(prev => ({ ...prev, accountStatus: newStatus }));
        onStatusChange(detail.id, newStatus);
      }
    } finally { setUpdating(false); }
  };

  const handleDelete = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/users/${detail.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        onStatusChange(detail.id, 'deleted');
        onClose();
      }
    } finally { setUpdating(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.92, y: 20 }}
        className="bg-[#0a0f1e] border border-white/10 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
          <h3 className="text-base font-bold font-space text-white">User Details</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
            <FiX size={16} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="space-y-3">
              {[...Array(4)].map((_, i) => <div key={i} className="h-10 rounded-xl bg-white/5 animate-pulse" />)}
            </div>
          ) : detail ? (
            <>
              {/* Avatar + Name */}
              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${avatarColor(detail.name)} flex items-center justify-center text-white text-xl font-bold shadow-lg`}>
                  {getInitials(detail.name)}
                </div>
                <div>
                  <p className="text-lg font-bold text-white font-space">{detail.name}</p>
                  <p className="text-sm text-slate-400">{detail.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                      detail.accountStatus === 'active'
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full inline-block ${detail.accountStatus === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                      {detail.accountStatus}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/10 border border-violet-500/20 text-violet-400">
                      {detail.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Member Since', value: formatDate(detail.createdAt), icon: FiCalendar },
                  { label: 'Last Login', value: timeAgo(detail.lastLogin), icon: FiClock },
                  { label: 'Last Updated', value: formatDate(detail.updatedAt), icon: FiActivity },
                  { label: 'User ID', value: detail.id?.slice(-8) + '...', icon: FiShield },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="px-4 py-3 rounded-xl bg-white/3 border border-white/5">
                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mb-1">
                      <Icon size={10} /> {label}
                    </p>
                    <p className="text-xs text-white font-medium">{value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              {detail.recentActivity?.length > 0 && (
                <div className="mb-6">
                  <p className="text-xs font-semibold text-slate-400 mb-2">Recent Activity</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto">
                    {detail.recentActivity.slice(0, 5).map(a => {
                      const { icon: Icon, color, bg } = ACTIVITY_ICONS[a.activityType] || { icon: FiActivity, color: 'text-slate-400', bg: 'bg-slate-500/15' };
                      return (
                        <div key={a.id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-white/3 border border-white/5">
                          <div className={`w-6 h-6 rounded-md ${bg} flex items-center justify-center flex-shrink-0`}>
                            <Icon className={`text-xs ${color}`} />
                          </div>
                          <p className="text-[11px] text-slate-400 flex-1 truncate">{a.description}</p>
                          <p className="text-[10px] text-slate-600 flex-shrink-0">{timeAgo(a.timestamp)}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                {detail.role !== 'admin' && (
                  <>
                    <button
                      id={`toggle-status-${detail.id}`}
                      onClick={handleStatusToggle}
                      disabled={updating}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50 ${
                        detail.accountStatus === 'active'
                          ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400 hover:bg-amber-500/20'
                          : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {detail.accountStatus === 'active' ? <FiToggleLeft size={15} /> : <FiToggleRight size={15} />}
                      {detail.accountStatus === 'active' ? 'Suspend' : 'Activate'}
                    </button>

                    {!confirmDelete ? (
                      <button
                        id={`delete-user-${detail.id}`}
                        onClick={() => setConfirmDelete(true)}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all duration-200"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    ) : (
                      <button
                        id={`confirm-delete-${detail.id}`}
                        onClick={handleDelete}
                        disabled={updating}
                        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all duration-200 disabled:opacity-50"
                      >
                        <FiAlertCircle size={14} /> Confirm Delete
                      </button>
                    )}
                  </>
                )}
                {detail.role === 'admin' && (
                  <div className="flex-1 text-center text-xs text-slate-500 py-2">
                    Admin accounts cannot be modified
                  </div>
                )}
              </div>
            </>
          ) : (
            <p className="text-sm text-red-400">Failed to load user details.</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Admin Page ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading, token, logout } = useAuth();

  const [activeSection, setActiveSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Data
  const [stats, setStats]       = useState(null);
  const [users, setUsers]       = useState([]);
  const [activity, setActivity] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages]   = useState(1);

  // UI state
  const [fetching, setFetching]         = useState(false);
  const [fetchError, setFetchError]     = useState('');
  const [lastRefresh, setLastRefresh]   = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  // Filters
  const [search, setSearch]   = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  // Auth guard
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/sign-in');
  }, [loading, isAuthenticated, navigate]);

  const authHeaders = useCallback(() => ({
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  }), [token]);

  // Fetch all dashboard data
  const fetchAll = useCallback(async () => {
    if (!token) return;
    setFetching(true);
    setFetchError('');
    try {
      const [statsRes, activityRes] = await Promise.all([
        fetch(`${API_BASE}/api/admin/stats`, { headers: authHeaders() }),
        fetch(`${API_BASE}/api/admin/activity?limit=50`, { headers: authHeaders() }),
      ]);

      if (statsRes.ok) {
        const d = await statsRes.json();
        setStats(d);
      } else {
        const d = await statsRes.json();
        setFetchError(d.error || 'Failed to load statistics.');
        return;
      }
      if (activityRes.ok) {
        const d = await activityRes.json();
        setActivity(d.activities || []);
      }
      setLastRefresh(new Date());
    } catch {
      setFetchError('Cannot reach the backend server. Is it running?');
    } finally {
      setFetching(false);
    }
  }, [token, authHeaders]);

  // Fetch users with filters
  const fetchUsers = useCallback(async (page = 1) => {
    if (!token) return;
    setFetching(true);
    try {
      const params = new URLSearchParams({
        page,
        limit: 15,
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(roleFilter !== 'all' && { role: roleFilter }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      });
      const res = await fetch(`${API_BASE}/api/admin/users?${params}`, { headers: authHeaders() });
      if (res.ok) {
        const d = await res.json();
        setUsers(d.users || []);
        setTotalUsers(d.total || 0);
        setTotalPages(d.pages || 1);
        setCurrentPage(page);
      }
    } catch { /* silent */ }
    finally { setFetching(false); }
  }, [token, authHeaders, debouncedSearch, roleFilter, statusFilter]);

  useEffect(() => {
    if (!loading && isAuthenticated) {
      fetchAll();
      fetchUsers(1);
    }
  }, [loading, isAuthenticated, fetchAll, fetchUsers]);

  useEffect(() => {
    if (!loading && isAuthenticated) fetchUsers(1);
  }, [debouncedSearch, roleFilter, statusFilter]);

  const handleSignOut = () => { logout(); navigate('/sign-in'); };

  const handleStatusChange = (userId, newStatus) => {
    if (newStatus === 'deleted') {
      setUsers(prev => prev.filter(u => u.id !== userId));
    } else {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, accountStatus: newStatus } : u));
    }
    // Refresh stats after change
    fetchAll();
  };

  if (loading || !isAuthenticated) return null;

  // Build chart data
  const chartData = stats?.registrationChart?.map(d => ({
    date: d._id?.slice(5), // MM-DD
    Registrations: d.count,
  })) ?? [];

  const statSummaryCards = stats ? [
    { label: 'Total Users',       value: stats.users.total,           icon: FiUsers,      color: 'from-blue-600 to-blue-400',    delta: `+${stats.users.newThisWeek} this week` },
    { label: 'Active Users',      value: stats.users.active,          icon: FiCheckCircle,color: 'from-emerald-600 to-emerald-400',delta: `${stats.users.suspended} suspended` },
    { label: 'New Today',         value: stats.users.newToday,        icon: FiTrendingUp, color: 'from-violet-600 to-violet-400', delta: `${stats.users.newThisMonth} this month` },
    { label: 'Logins Today',      value: stats.activity.loginsToday,  icon: FiActivity,   color: 'from-amber-600 to-amber-400',   delta: `${stats.activity.loginsThisWeek} this week` },
  ] : [];

  const resumeStatCards = stats?.resumes ? [
    { label: 'Total Analyses',    value: stats.resumes.total,         icon: FiFileText,   color: 'from-cyan-600 to-cyan-400',     delta: `+${stats.resumes.thisWeek} this week` },
    { label: 'Analysed Today',    value: stats.resumes.today,         icon: FiZap,        color: 'from-pink-600 to-pink-400',     delta: 'Resume uploads today' },
    { label: 'Avg Resume Score',  value: stats.resumes.avgScore ?? 0, icon: FiBarChart2,  color: 'from-orange-600 to-orange-400', delta: 'Platform average' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#050816] text-white flex overflow-hidden">

      {/* ── ADMIN SIDEBAR ── */}
      <aside className={`relative z-20 flex flex-col bg-[#070d1a] border-r border-red-900/20 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-red-900/20">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.35)]">
            <FiShield className="text-white text-base" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-space font-bold text-sm tracking-tight whitespace-nowrap text-white block">NextHire AI</span>
              <span className="text-[10px] text-red-400 font-semibold tracking-widest uppercase">Admin Panel</span>
            </div>
          )}
        </div>

        {/* Admin chip */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-red-600/60 to-orange-500/60 flex items-center justify-center flex-shrink-0">
              <FiShield className="text-white text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wide">Administrator</p>
            </div>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {SIDEBAR_LINKS.map(({ icon: Icon, label, id }) => (
            <button
              key={id}
              id={`admin-nav-${id}`}
              onClick={() => setActiveSection(id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                activeSection === id
                  ? 'bg-gradient-to-r from-red-600/20 to-orange-500/10 text-white border border-red-500/20'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className={`text-lg min-w-[18px] flex-shrink-0 ${activeSection === id ? 'text-red-400' : ''}`} />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
              {sidebarOpen && activeSection === id && <FiChevronRight className="ml-auto text-xs opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="py-4 px-2 border-t border-red-900/20 space-y-0.5">
          <button
            id="admin-user-dashboard-btn"
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <FiUser className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>User Dashboard</span>}
          </button>
          <button
            id="admin-signout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <FiLogOut className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#070d1a] border border-red-900/20 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
        >
          {sidebarOpen ? <FiX size={10} /> : <FiChevronRight size={10} />}
        </button>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Top Bar */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#050816]/80 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-xs text-red-400 font-semibold uppercase tracking-widest">Admin Dashboard</span>
            </div>
            {lastRefresh && (
              <span className="text-[10px] text-slate-600">· Updated {lastRefresh.toLocaleTimeString()}</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              id="admin-refresh-btn"
              onClick={() => { fetchAll(); fetchUsers(1); }}
              disabled={fetching}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-medium text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-50"
            >
              <FiRefreshCw className={fetching ? 'animate-spin' : ''} size={13} />
              {fetching ? 'Loading...' : 'Refresh'}
            </button>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
              <FiShield className="text-red-400" size={13} />
              <span className="text-xs font-semibold text-red-400">{user?.name}</span>
            </div>
          </div>
        </header>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">

          {/* Error banner */}
          {fetchError && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 px-5 py-3.5 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
            >
              <FiAlertCircle className="flex-shrink-0" />
              <span>{fetchError}</span>
            </motion.div>
          )}

          {/* ── OVERVIEW SECTION ── */}
          <AnimatePresence mode="wait">
            {activeSection === 'overview' && (
              <motion.div key="overview" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-8">

                {/* Page title */}
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold font-space text-white">Platform Overview</h1>
                  <p className="text-sm text-slate-400 mt-1">Real-time statistics and platform monitoring</p>
                </div>

                {/* Stat cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {statSummaryCards.map(({ label, value, icon: Icon, color, delta }, i) => (
                    <motion.div
                      key={label}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.07 }}
                      className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all duration-300 group"
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center mb-3 shadow-lg`}>
                        <Icon className="text-white text-base" />
                      </div>
                      {fetching && !stats ? (
                        <div className="h-8 w-16 bg-white/5 rounded-lg animate-pulse mb-1" />
                      ) : (
                        <p className="text-2xl font-bold font-space text-white">{value ?? 0}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                      <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">{delta}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Registrations chart */}
                  <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-6">
                    <h3 className="text-sm font-bold font-space text-white mb-1">Registrations (Last 7 Days)</h3>
                    <p className="text-xs text-slate-500 mb-5">New user sign-ups per day</p>
                    {chartData.length === 0 ? (
                      <div className="h-40 flex items-center justify-center text-slate-600 text-xs">No data yet</div>
                    ) : (
                      <ResponsiveContainer width="100%" height={160}>
                        <BarChart data={chartData} barSize={18}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false} allowDecimals={false} />
                          <Tooltip content={<ChartTooltip />} />
                          <Bar dataKey="Registrations" fill="url(#blueGrad)" radius={[4, 4, 0, 0]} />
                          <defs>
                            <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#3b82f6" />
                              <stop offset="100%" stopColor="#6366f1" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>

                  {/* Activity breakdown */}
                  <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-6">
                    <h3 className="text-sm font-bold font-space text-white mb-1">Login Activity (Last 7 Days)</h3>
                    <p className="text-xs text-slate-500 mb-5">Platform engagement metrics</p>
                    <div className="space-y-3">
                      {stats ? [
                        { label: 'Total All-Time Logins', value: stats.activity.totalLogins, max: Math.max(stats.activity.totalLogins, 1), color: 'from-blue-600 to-blue-400' },
                        { label: 'Logins This Week', value: stats.activity.loginsThisWeek, max: Math.max(stats.activity.totalLogins, 1), color: 'from-violet-600 to-violet-400' },
                        { label: 'Logins Today', value: stats.activity.loginsToday, max: Math.max(stats.activity.totalLogins, 1), color: 'from-emerald-600 to-emerald-400' },
                      ].map(({ label, value, max, color }) => (
                        <div key={label}>
                          <div className="flex justify-between text-xs mb-1.5">
                            <span className="text-slate-400">{label}</span>
                            <span className="text-white font-bold">{value}</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (value / max) * 100)}%` }}
                              transition={{ duration: 1, delay: 0.3 }}
                              className={`h-full rounded-full bg-gradient-to-r ${color}`}
                            />
                          </div>
                        </div>
                      )) : <div className="h-24 bg-white/3 animate-pulse rounded-xl" />}
                    </div>
                  </div>
                </div>

                {/* Recent Registrations */}
                {stats?.recentRegistrations?.length > 0 && (
                  <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                      <h3 className="text-sm font-bold font-space text-white">Recent Registrations</h3>
                      <button
                        onClick={() => setActiveSection('users')}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors flex items-center gap-1"
                      >
                        View all <FiChevronRight size={12} />
                      </button>
                    </div>
                    <div className="divide-y divide-white/5">
                      {stats.recentRegistrations.map((u, i) => (
                        <motion.div
                          key={u.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.06 }}
                          className="flex items-center gap-4 px-6 py-3.5 hover:bg-white/3 transition-colors"
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${avatarColor(u.name)} flex items-center justify-center text-white text-xs font-bold shadow-md flex-shrink-0`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-white truncate">{u.name}</p>
                            <p className="text-xs text-slate-500 truncate">{u.email}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-slate-400">{formatDate(u.createdAt)}</p>
                            <span className={`text-[10px] font-medium ${u.accountStatus === 'active' ? 'text-emerald-400' : 'text-red-400'}`}>
                              {u.accountStatus}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Resume Stats */}
                {resumeStatCards.length > 0 && (
                  <>
                    <div>
                      <h3 className="text-base font-bold font-space text-white mb-1">Resume Analysis Statistics</h3>
                      <p className="text-xs text-slate-500">Platform-wide resume analysis metrics</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {resumeStatCards.map(({ label, value, icon: Icon, color, delta }, i) => (
                        <motion.div
                          key={label}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.07 }}
                          className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all duration-300"
                        >
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center mb-3 shadow-lg`}>
                            <Icon className="text-white text-base" />
                          </div>
                          <p className="text-2xl font-bold font-space text-white">{value}</p>
                          <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                          <p className="text-[10px] text-emerald-400 mt-1.5 font-medium">{delta}</p>
                        </motion.div>
                      ))}
                    </div>
                  </>
                )}

                {/* Recent Resume Uploads */}
                {stats?.recentResumeUploads?.length > 0 && (
                  <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-white/5">
                      <h3 className="text-sm font-bold font-space text-white">Recent Resume Uploads</h3>
                      <p className="text-xs text-slate-500 mt-0.5">Latest resume analyses across all users</p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                            <th className="text-left px-6 py-3">File</th>
                            <th className="text-left px-4 py-3 hidden md:table-cell">User</th>
                            <th className="text-center px-4 py-3">Score</th>
                            <th className="text-right px-6 py-3">Date</th>
                          </tr>
                        </thead>
                        <tbody>
                          {stats.recentResumeUploads.map((r, i) => (
                            <motion.tr
                              key={r.id}
                              initial={{ opacity: 0, x: -8 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className="border-b border-white/4 hover:bg-white/3 transition-colors"
                            >
                              <td className="px-6 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-7 h-7 rounded-lg bg-cyan-500/15 flex items-center justify-center flex-shrink-0">
                                    <FiFileText className="text-cyan-400 text-xs" />
                                  </div>
                                  <span className="text-slate-300 text-xs truncate max-w-[160px]">{r.originalFileName}</span>
                                </div>
                              </td>
                              <td className="px-4 py-3.5 hidden md:table-cell">
                                {r.user ? (
                                  <div>
                                    <p className="text-xs text-slate-300 font-medium">{r.user.name}</p>
                                    <p className="text-[10px] text-slate-600">{r.user.email}</p>
                                  </div>
                                ) : <span className="text-slate-600 text-xs">Unknown</span>}
                              </td>
                              <td className="px-4 py-3.5 text-center">
                                <span
                                  className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-space"
                                  style={{
                                    background: `${r.overallScore >= 70 ? '#34d39920' : r.overallScore >= 60 ? '#fbbf2420' : '#f8717120'}`,
                                    color: r.overallScore >= 70 ? '#34d399' : r.overallScore >= 60 ? '#fbbf24' : '#f87171',
                                  }}
                                >
                                  {r.overallScore}
                                </span>
                              </td>
                              <td className="px-6 py-3.5 text-right">
                                <span className="text-xs text-slate-500">{formatDate(r.createdAt)}</span>
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

              </motion.div>
            )}

            {/* ── USERS SECTION ── */}
            {activeSection === 'users' && (
              <motion.div key="users" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">

                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold font-space text-white">User Management</h1>
                    <p className="text-sm text-slate-400 mt-1">{totalUsers} registered users in the system</p>
                  </div>
                </div>

                {/* Search + Filters */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={14} />
                    <input
                      id="admin-user-search"
                      type="text"
                      placeholder="Search by name or email..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="w-full bg-[#0a0f1e] border border-white/8 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/40 focus:ring-1 focus:ring-blue-500/20 transition-all"
                    />
                  </div>
                  <div className="flex gap-3">
                    <div className="relative">
                      <FiFilter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                      <select
                        id="admin-role-filter"
                        value={roleFilter}
                        onChange={e => setRoleFilter(e.target.value)}
                        className="bg-[#0a0f1e] border border-white/8 rounded-xl pl-8 pr-8 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                      >
                        <option value="all">All Roles</option>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div className="relative">
                      <FiCheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={12} />
                      <select
                        id="admin-status-filter"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="bg-[#0a0f1e] border border-white/8 rounded-xl pl-8 pr-8 py-2.5 text-sm text-slate-300 focus:outline-none focus:border-blue-500/40 appearance-none cursor-pointer"
                      >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="suspended">Suspended</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
                  {/* Header */}
                  <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-white/2 border-b border-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-4">User</div>
                    <div className="col-span-3 hidden sm:block">Email</div>
                    <div className="col-span-2">Role</div>
                    <div className="col-span-2">Last Login</div>
                    <div className="col-span-1 text-right">Status</div>
                  </div>

                  {/* Rows */}
                  {fetching && users.length === 0 && (
                    <div className="divide-y divide-white/5">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-16 px-6 py-3 flex items-center gap-4">
                          <div className="w-9 h-9 rounded-xl bg-white/5 animate-pulse flex-shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-32 bg-white/5 animate-pulse rounded" />
                            <div className="h-2 w-24 bg-white/3 animate-pulse rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!fetching && users.length === 0 && (
                    <div className="text-center py-16 text-slate-600">
                      <FiUsers className="mx-auto text-3xl mb-3 opacity-30" />
                      <p className="text-sm">No users match your filters.</p>
                    </div>
                  )}

                  <div className="divide-y divide-white/5">
                    {users.map((u, i) => (
                      <motion.div
                        key={u.id}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="grid grid-cols-12 gap-3 px-6 py-4 hover:bg-white/2 transition-colors duration-150 cursor-pointer group"
                        onClick={() => setSelectedUser(u)}
                      >
                        {/* Avatar + Name */}
                        <div className="col-span-4 flex items-center gap-3 min-w-0">
                          <div className={`w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr ${avatarColor(u.name)} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
                            {getInitials(u.name)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white truncate group-hover:text-blue-300 transition-colors">{u.name}</p>
                            <p className="text-[10px] text-slate-600 truncate">ID: {u.id?.slice(-8)}...</p>
                          </div>
                        </div>

                        {/* Email */}
                        <div className="col-span-3 hidden sm:flex items-center gap-1.5 min-w-0">
                          <FiMail className="text-slate-600 flex-shrink-0" size={12} />
                          <span className="text-xs text-slate-400 truncate">{u.email}</span>
                        </div>

                        {/* Role */}
                        <div className="col-span-2 flex items-center">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                            u.role === 'admin'
                              ? 'bg-red-500/10 border-red-500/20 text-red-400'
                              : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
                          }`}>
                            {u.role}
                          </span>
                        </div>

                        {/* Last Login */}
                        <div className="col-span-2 flex items-center gap-1.5">
                          <FiClock className="text-slate-600 flex-shrink-0" size={11} />
                          <span className="text-xs text-slate-400">{timeAgo(u.lastLogin)}</span>
                        </div>

                        {/* Status */}
                        <div className="col-span-1 flex items-center justify-end">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                            u.accountStatus === 'active'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full inline-block ${u.accountStatus === 'active' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="px-6 py-3.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                      <span>Page {currentPage} of {totalPages} · {totalUsers} total</span>
                      <div className="flex gap-2">
                        <button
                          id="admin-prev-page"
                          onClick={() => fetchUsers(currentPage - 1)}
                          disabled={currentPage <= 1}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 disabled:opacity-40 transition-colors"
                        >
                          Prev
                        </button>
                        <button
                          id="admin-next-page"
                          onClick={() => fetchUsers(currentPage + 1)}
                          disabled={currentPage >= totalPages}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/8 hover:bg-white/10 disabled:opacity-40 transition-colors"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── ACTIVITY SECTION ── */}
            {activeSection === 'activity' && (
              <motion.div key="activity" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-space text-white">Platform Activity</h1>
                  <p className="text-sm text-slate-400 mt-1">All user events across the platform in real-time</p>
                </div>

                <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
                  <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-white/2 border-b border-white/5 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    <div className="col-span-1">Type</div>
                    <div className="col-span-5">Description</div>
                    <div className="col-span-3">User</div>
                    <div className="col-span-3 text-right">Time</div>
                  </div>
                  <div className="divide-y divide-white/5">
                    {activity.length === 0 && (
                      <div className="text-center py-16 text-slate-600">
                        <FiActivity className="mx-auto text-3xl mb-3 opacity-30" />
                        <p className="text-sm">No activity recorded yet.</p>
                      </div>
                    )}
                    {activity.map((a, i) => {
                      const { icon: Icon, color, bg } = ACTIVITY_ICONS[a.activityType] || { icon: FiActivity, color: 'text-slate-400', bg: 'bg-slate-500/15' };
                      return (
                        <motion.div
                          key={a.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: Math.min(i * 0.02, 0.5) }}
                          className="grid grid-cols-12 gap-3 px-6 py-3.5 hover:bg-white/2 transition-colors"
                        >
                          <div className="col-span-1 flex items-center">
                            <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                              <Icon className={`text-xs ${color}`} />
                            </div>
                          </div>
                          <div className="col-span-5 flex items-center min-w-0">
                            <p className="text-xs text-slate-300 truncate">{a.description}</p>
                          </div>
                          <div className="col-span-3 flex items-center min-w-0">
                            {a.user ? (
                              <div className="flex items-center gap-2 min-w-0">
                                <div className={`w-6 h-6 rounded-md bg-gradient-to-tr ${avatarColor(a.user.name)} flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0`}>
                                  {getInitials(a.user.name)}
                                </div>
                                <span className="text-xs text-slate-400 truncate">{a.user.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-600">—</span>
                            )}
                          </div>
                          <div className="col-span-3 flex items-center justify-end">
                            <span className="text-[10px] text-slate-500">{formatDateTime(a.timestamp)}</span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ── STATISTICS SECTION ── */}
            {activeSection === 'stats' && (
              <motion.div key="stats" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-space text-white">Platform Statistics</h1>
                  <p className="text-sm text-slate-400 mt-1">Detailed breakdown of platform metrics</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {stats && [
                    { label: 'Total Registered Users', value: stats.users.total, icon: FiUsers, color: 'from-blue-600 to-blue-400' },
                    { label: 'Active Accounts', value: stats.users.active, icon: FiCheckCircle, color: 'from-emerald-600 to-emerald-400' },
                    { label: 'Suspended Accounts', value: stats.users.suspended, icon: FiXCircle, color: 'from-red-600 to-red-400' },
                    { label: 'New Users Today', value: stats.users.newToday, icon: FiTrendingUp, color: 'from-violet-600 to-violet-400' },
                    { label: 'New Users This Week', value: stats.users.newThisWeek, icon: FiCalendar, color: 'from-amber-600 to-amber-400' },
                    { label: 'New Users This Month', value: stats.users.newThisMonth, icon: FiBarChart2, color: 'from-pink-600 to-pink-400' },
                    { label: 'Total Logins (All Time)', value: stats.activity.totalLogins, icon: FiActivity, color: 'from-cyan-600 to-cyan-400' },
                    { label: 'Logins This Week', value: stats.activity.loginsThisWeek, icon: FiClock, color: 'from-indigo-600 to-indigo-400' },
                    { label: 'Logins Today', value: stats.activity.loginsToday, icon: FiZap, color: 'from-orange-600 to-orange-400' },
                  ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-5 flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${color} flex items-center justify-center shadow-lg flex-shrink-0`}>
                        <Icon className="text-white text-base" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold font-space text-white">{value}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Registrations chart (full width) */}
                <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-6">
                  <h3 className="text-sm font-bold font-space text-white mb-1">User Registrations — Last 7 Days</h3>
                  <p className="text-xs text-slate-500 mb-6">Daily new user sign-up trend</p>
                  {chartData.length === 0 ? (
                    <div className="h-48 flex items-center justify-center text-slate-600 text-xs">No registration data for this period</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                        <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
                        <Tooltip content={<ChartTooltip />} />
                        <Line type="monotone" dataKey="Registrations" stroke="#8b5cf6" strokeWidth={2.5} dot={{ fill: '#8b5cf6', r: 4 }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </motion.div>
            )}

            {/* ── SETTINGS SECTION ── */}
            {activeSection === 'settings' && (
              <motion.div key="settings" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-6">
                <div>
                  <h1 className="text-2xl font-bold font-space text-white">Admin Settings</h1>
                  <p className="text-sm text-slate-400 mt-1">System configuration and administrator account</p>
                </div>

                <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white font-space">Administrator Account</h3>
                  <div className="flex items-center gap-4 p-4 bg-white/3 border border-white/5 rounded-xl">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-lg">
                      <FiShield className="text-white text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user?.name}</p>
                      <p className="text-xs text-slate-400">{user?.email}</p>
                      <p className="text-[10px] text-red-400 font-semibold uppercase tracking-wider mt-0.5">Administrator</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { label: 'Admin credentials', desc: 'Managed via ADMIN_EMAIL and ADMIN_PASSWORD environment variables on the server' },
                      { label: 'Password security', desc: 'Passwords are bcrypt-hashed (10 rounds) and never stored as plain text' },
                      { label: 'JWT authentication', desc: 'Tokens expire after 7 days. All admin APIs verify role=admin server-side' },
                      { label: 'Role protection', desc: 'Normal users cannot escalate to admin. Registration always sets role=user' },
                    ].map(({ label, desc }) => (
                      <div key={label} className="flex gap-3 p-4 bg-white/2 border border-white/5 rounded-xl">
                        <FiCheckCircle className="text-emerald-400 flex-shrink-0 mt-0.5" size={15} />
                        <div>
                          <p className="text-xs font-semibold text-white">{label}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* ── User Detail Modal ── */}
      <AnimatePresence>
        {selectedUser && (
          <UserDetailModal
            user={selectedUser}
            token={token}
            onClose={() => setSelectedUser(null)}
            onStatusChange={handleStatusChange}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

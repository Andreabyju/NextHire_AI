import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { FiUsers, FiShield, FiActivity, FiLogOut, FiUser, FiBarChart2, FiSettings, FiChevronRight, FiBriefcase } from 'react-icons/fi';
import { useAuth } from '../../context/AuthContext';

const SIDEBAR_LINKS = [
  { icon: FiBarChart2, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: FiUsers,     label: 'Users',     path: '/admin/users' },
  { icon: FiBriefcase, label: 'Mentors',   path: '/admin/mentors' },
  { icon: FiActivity,  label: 'Activity',  path: '/admin/activity' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleSignOut = () => {
    logout();
    navigate('/admin/login');
  };

  return (
    <div className="flex min-h-screen bg-[#050816] text-white overflow-hidden">
      <aside className={`relative z-20 flex flex-col bg-[#070d1a] border-r border-red-900/20 transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-16'}`}>
        <div className="flex items-center gap-3 px-5 py-5 border-b border-red-900/20">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr from-red-600 to-orange-500 flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.35)]">
            <FiShield className="text-white text-base" />
          </div>
          {sidebarOpen && (
            <div>
              <span className="font-space font-bold text-sm tracking-tight whitespace-nowrap block text-white">NextHire AI</span>
              <span className="text-[10px] text-red-400 font-semibold tracking-widest uppercase">Admin Panel</span>
            </div>
          )}
        </div>

        <nav className="flex-1 py-4 px-2 space-y-1">
          {SIDEBAR_LINKS.map(({ icon: Icon, label, path }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) => `w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${isActive ? 'bg-gradient-to-r from-red-600/20 to-orange-500/10 text-white border border-red-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
            >
              <Icon className="text-lg min-w-[18px] flex-shrink-0" />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="py-4 px-2 border-t border-red-900/20 space-y-1">
          <button onClick={() => navigate('/dashboard')} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5">
            <FiUser className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>User Dashboard</span>}
          </button>
          <button onClick={handleSignOut} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <FiLogOut className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col overflow-y-auto">
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#050816]/80 backdrop-blur-sm sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-red-400 font-semibold uppercase tracking-widest">Admin Dashboard</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20">
            <FiShield className="text-red-400" size={13} />
            <span className="text-xs font-semibold text-red-400">{user?.name}</span>
          </div>
        </header>

        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

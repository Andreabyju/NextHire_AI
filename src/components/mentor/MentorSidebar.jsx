import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { HiOutlineChartBar, HiOutlineUsers, HiOutlineCreditCard, HiOutlineOfficeBuilding, HiOutlineCog, HiOutlineLogout, HiOutlineBriefcase, HiOutlineStar } from 'react-icons/hi';
import { HiSparkles } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';

export default function MentorSidebar() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/mentor/login');
  };

  const navItems = [
    { label: 'Dashboard', path: '/mentor/dashboard', icon: HiOutlineChartBar },
    { label: 'Candidates', path: '/mentor/candidates', icon: HiOutlineUsers },
    { label: 'Shortlisted', path: '/mentor/shortlisted', icon: HiOutlineStar },
    { label: 'Jobs', path: '/mentor/jobs', icon: HiOutlineBriefcase },
    { label: 'Subscription', path: '/mentor/subscription', icon: HiOutlineCreditCard },
    { label: 'Company Profile', path: '/mentor/profile', icon: HiOutlineOfficeBuilding },
  ];

  return (
    <aside className="w-64 bg-[#0a0f25] border-r border-white/10 flex flex-col h-screen sticky top-0">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-violetAccent to-blueAccent flex items-center justify-center">
            <HiSparkles className="text-white text-sm" />
          </div>
          <span className="font-space text-lg font-bold text-white tracking-tight">NextHire <span className="text-violetAccent-light">AI</span></span>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              id={`mentor-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-violetAccent/20 text-violetAccent-light'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              <item.icon className="text-lg" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-2 border-t border-white/5">
        <button
          id="mentor-logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
        >
          <HiOutlineLogout className="text-lg" />
          Logout
        </button>
      </div>
    </aside>
  );
}

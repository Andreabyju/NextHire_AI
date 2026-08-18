import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { motion } from 'framer-motion';
import {
  FiUsers,
  FiCheckCircle,
  FiTrendingUp,
  FiActivity,
  FiBriefcase,
  FiAlertCircle,
  FiClock,
  FiFileText,
  FiCalendar,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err) {
        setError(err.message || 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-20 bg-white/5 rounded-2xl w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl"></div>
          ))}
        </div>
        <div className="h-64 bg-white/5 rounded-2xl"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-400 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3">
        <FiAlertCircle className="text-xl flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold font-space text-white">Platform Overview</h1>
        <p className="text-slate-400 mt-1">Real-time statistics and platform monitoring</p>
      </div>

      {/* Main Stats Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Users"
          value={stats?.users?.total || 0}
          delta={`${stats?.users?.newToday || 0} registered today`}
          icon={FiUsers}
          color="text-blue-400"
          bg="bg-blue-500/10"
        />
        <StatCard
          title="Active Users"
          value={stats?.users?.active || 0}
          delta={`${stats?.users?.suspended || 0} suspended`}
          icon={FiCheckCircle}
          color="text-emerald-400"
          bg="bg-emerald-500/10"
        />
        <StatCard
          title="Total Resumes"
          value={stats?.resumes?.total || 0}
          delta={`${stats?.resumes?.today || 0} uploaded today`}
          icon={FiTrendingUp}
          color="text-cyan-400"
          bg="bg-cyan-500/10"
        />
        <StatCard
          title="Logins Today"
          value={stats?.activity?.loginsToday || 0}
          delta={`${stats?.activity?.totalLogins || 0} total logins`}
          icon={FiActivity}
          color="text-amber-400"
          bg="bg-amber-500/10"
        />
      </div>

      {/* Secondary Stats (Mentors & Subscriptions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Mentors"
          value={stats?.mentors?.total || 0}
          delta={`${stats?.mentors?.approved || 0} approved`}
          icon={FiBriefcase}
          color="text-violet-400"
          bg="bg-violet-500/10"
        />
        <StatCard
          title="Pending Mentors"
          value={stats?.mentors?.pending || 0}
          delta="Awaiting verification"
          icon={FiClock}
          color="text-orange-400"
          bg="bg-orange-500/10"
        />
        <StatCard
          title="Active Subscriptions"
          value={stats?.subscriptions?.active || 0}
          delta="Paid company partners"
          icon={HiSparkles}
          color="text-pink-400"
          bg="bg-pink-500/10"
        />
        <StatCard
          title="Average Resume Score"
          value={stats?.resumes?.avgScore ? `${stats.resumes.avgScore}/100` : '0/100'}
          delta="AI grading evaluation"
          icon={FiFileText}
          color="text-indigo-400"
          bg="bg-indigo-500/10"
        />
      </div>

      {/* Lists / Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent Registrations */}
        <div className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2.5 mb-5 border-b border-white/5 pb-4">
            <FiUsers className="text-xl text-blueAccent-light" />
            <h2 className="text-lg font-bold text-white font-space">Recent Registrations</h2>
          </div>
          
          <div className="flex-1 overflow-x-auto">
            {stats?.recentRegistrations?.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">No recent registrations yet.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b border-white/10">
                    <th className="py-2.5">User</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.recentRegistrations?.map((u) => (
                    <tr key={u.id || u._id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3">
                        <div className="font-medium text-white">{u.name}</div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-semibold tracking-wider ${
                          u.accountStatus === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {u.accountStatus}
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400 text-xs">
                        {new Date(u.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Recent Resume Uploads */}
        <div className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-6 flex flex-col">
          <div className="flex items-center gap-2.5 mb-5 border-b border-white/5 pb-4">
            <FiFileText className="text-xl text-violetAccent-light" />
            <h2 className="text-lg font-bold text-white font-space">Recent Resume Analyses</h2>
          </div>

          <div className="flex-1 overflow-x-auto">
            {stats?.recentResumeUploads?.length === 0 ? (
              <div className="text-center text-slate-500 py-8 text-sm">No resumes analyzed yet.</div>
            ) : (
              <table className="w-full text-sm text-left">
                <thead>
                  <tr className="text-xs text-slate-500 uppercase border-b border-white/10">
                    <th className="py-2.5">File / User</th>
                    <th className="py-2.5">Score</th>
                    <th className="py-2.5 text-right">Uploaded</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {stats?.recentResumeUploads?.map((r) => (
                    <tr key={r.id || r._id} className="hover:bg-white/3 transition-colors">
                      <td className="py-3 max-w-[200px] truncate">
                        <div className="font-medium text-white truncate" title={r.originalFileName}>{r.originalFileName}</div>
                        <div className="text-xs text-slate-400 truncate">{r.user?.name || 'Unknown User'}</div>
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded font-mono font-semibold text-xs ${
                          r.overallScore >= 80 ? 'bg-green-500/10 text-green-400' :
                          r.overallScore >= 50 ? 'bg-amber-500/10 text-amber-400' : 'bg-red-500/10 text-red-400'
                        }`}>
                          {r.overallScore}/100
                        </span>
                      </td>
                      <td className="py-3 text-right text-slate-400 text-xs">
                        {new Date(r.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </motion.div>
  );
}

function StatCard({ title, value, delta, icon: Icon, color, bg }) {
  return (
    <div className="bg-[#0a0f1e] border border-white/5 rounded-2xl p-6 flex flex-col gap-4 hover:border-white/10 transition-colors group">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-3xl font-bold text-white font-space tracking-tight">{value}</h3>
          <p className="text-slate-400 text-sm mt-1">{title}</p>
        </div>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${bg} ${color} group-hover:scale-105 transition-transform shadow-md`}>
          <Icon className="text-xl" />
        </div>
      </div>
      {delta && (
        <div className="text-xs text-slate-500 font-medium flex items-center gap-1">
          <FiCalendar className="text-slate-600" />
          <span>{delta}</span>
        </div>
      )}
    </div>
  );
}

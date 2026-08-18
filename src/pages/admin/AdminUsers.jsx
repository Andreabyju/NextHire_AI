import React, { useEffect, useState } from 'react';
import { adminApi } from '../../services/adminApi';
import { motion } from 'framer-motion';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const data = await adminApi.getUsers();
      setUsers(data.users || []);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-white/5 rounded-2xl"></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-space text-white">User Management</h1>
        <p className="text-sm text-slate-400 mt-1">View candidates and users.</p>
      </div>

      {error && <div className="text-red-400 bg-red-500/10 p-4 rounded-xl">{error}</div>}

      <div className="bg-[#0a0f1e] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Email</th>
                <th className="px-6 py-4">Role</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Joined Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map(u => (
                  <tr key={u.id || u._id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 font-medium text-white">{u.name}</td>
                    <td className="px-6 py-4 text-slate-300">{u.email}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 rounded bg-white/10 text-xs">{u.role}</span></td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-xs ${u.accountStatus === 'active' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}

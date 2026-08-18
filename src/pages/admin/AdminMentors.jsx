import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../services/adminApi';
import { FiEye, FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';

export default function AdminMentors() {
  const [mentors, setMentors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMentors();
  }, []);

  const fetchMentors = async () => {
    try {
      const data = await adminApi.getMentors();
      setMentors(data.mentors || []);
    } catch (err) {
      setError(err.message || 'Failed to load mentors');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'approved': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"><FiCheckCircle className="inline mr-1"/>Approved</span>;
      case 'rejected': return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20"><FiXCircle className="inline mr-1"/>Rejected</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20"><FiClock className="inline mr-1"/>Pending</span>;
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-white/5 rounded-2xl"></div>;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-space text-white">Mentor Management</h1>
        <p className="text-sm text-slate-400 mt-1">Review and manage company/recruiter accounts</p>
      </div>

      {error && <div className="text-red-400 bg-red-500/10 p-4 rounded-xl">{error}</div>}

      <div className="bg-[#0a0f1e] rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
              <tr>
                <th className="px-6 py-4">Company / Mentor</th>
                <th className="px-6 py-4">Industry</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Subscription</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {mentors.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-500">No mentors found.</td>
                </tr>
              ) : (
                mentors.map(mentor => (
                  <tr key={mentor.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{mentor.companyName}</div>
                      <div className="text-xs text-slate-400">{mentor.mentorName} • {mentor.companyEmail}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-300">{mentor.industry || '-'}</td>
                    <td className="px-6 py-4">{getStatusBadge(mentor.verificationStatus)}</td>
                    <td className="px-6 py-4">
                      <span className="capitalize text-slate-300">{mentor.subscription?.plan || 'None'}</span>
                      {mentor.subscription?.status === 'active' && <span className="ml-2 w-2 h-2 rounded-full bg-green-500 inline-block"></span>}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link to={`/admin/mentors/${mentor.id}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 transition-colors">
                        <FiEye /> View
                      </Link>
                    </td>
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

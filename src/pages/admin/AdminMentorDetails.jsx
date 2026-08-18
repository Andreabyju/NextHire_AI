import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { adminApi } from '../../services/adminApi';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';

export default function AdminMentorDetails() {
  const { id } = useParams();
  const [mentor, setMentor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchMentor();
  }, [id]);

  const fetchMentor = async () => {
    try {
      const data = await adminApi.getMentorById(id);
      setMentor(data);
    } catch (err) {
      setError(err.message || 'Failed to load mentor details');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await adminApi.approveMentor(id);
      await fetchMentor();
    } catch (err) {
      alert(err.message || 'Failed to approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const notes = prompt("Enter rejection reason:");
    if (notes === null) return;
    setActionLoading(true);
    try {
      await adminApi.rejectMentor(id, notes);
      await fetchMentor();
    } catch (err) {
      alert(err.message || 'Failed to reject');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="animate-pulse h-96 bg-white/5 rounded-2xl"></div>;
  if (error) return <div className="text-red-400 bg-red-500/10 p-4 rounded-xl">{error}</div>;
  if (!mentor) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 max-w-4xl">
      <Link to="/admin/mentors" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <FiArrowLeft /> Back to Mentors
      </Link>

      <div className="bg-[#0a0f1e] rounded-2xl border border-white/5 p-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold font-space text-white">{mentor.companyName}</h1>
            <p className="text-slate-400 mt-1">{mentor.mentorName} • {mentor.companyEmail}</p>
          </div>
          
          <div className="flex flex-col items-end gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-white/10 text-white">
              Status: <span className={mentor.verificationStatus === 'approved' ? 'text-emerald-400' : mentor.verificationStatus === 'rejected' ? 'text-red-400' : 'text-amber-400'}>{mentor.verificationStatus}</span>
            </div>
            
            {mentor.verificationStatus === 'pending' && (
              <div className="flex gap-2">
                <button onClick={handleApprove} disabled={actionLoading} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-colors text-sm font-medium">
                  <FiCheck /> Approve
                </button>
                <button onClick={handleReject} disabled={actionLoading} className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors text-sm font-medium">
                  <FiX /> Reject
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Company Details</h3>
            <DetailRow label="Industry" value={mentor.industry} />
            <DetailRow label="Location" value={mentor.location} />
            <DetailRow label="Size" value={mentor.companySize} />
            <DetailRow label="Website" value={mentor.website} />
            <DetailRow label="Phone" value={mentor.phone} />
            <div>
              <span className="text-sm text-slate-400 block mb-1">Description</span>
              <p className="text-sm text-slate-300 bg-black/20 p-3 rounded-lg">{mentor.companyDescription || 'N/A'}</p>
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2">Subscription & Access</h3>
            <DetailRow label="Plan" value={<span className="capitalize">{mentor.subscription?.plan || 'None'}</span>} />
            <DetailRow label="Status" value={mentor.subscription?.status || 'inactive'} />
            <DetailRow label="Candidate Access" value={mentor.candidateAccess ? 'Yes' : 'No'} />
            
            {mentor.verificationNotes && (
              <div className="mt-6">
                <span className="text-sm text-slate-400 block mb-1">Verification Notes</span>
                <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-lg">{mentor.verificationNotes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-start py-1">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm text-white text-right max-w-[60%] break-words">{value || '-'}</span>
    </div>
  );
}

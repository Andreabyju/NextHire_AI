import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineTrash, HiOutlineMail, HiOutlineArrowRight, HiOutlineExclamationCircle } from 'react-icons/hi';
import { mentorApi } from '../../services/mentorApi';

export default function MentorShortlisted() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [removingId, setRemovingId] = useState(null);

  // Invitation Modal State
  const [activeInvitationCandidate, setActiveInvitationCandidate] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [messageText, setMessageText] = useState('We reviewed your profile and would like to discuss this opportunity with you.');
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState('');
  const [invitationSuccess, setInvitationSuccess] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [shortlistData, jobsData] = await Promise.all([
        mentorApi.getShortlistedCandidates(),
        mentorApi.getJobs().catch(() => ({ jobs: [] }))
      ]);

      if (shortlistData.success && shortlistData.candidates) {
        setCandidates(shortlistData.candidates);
      } else {
        setCandidates([]);
      }

      setJobs(jobsData.jobs || []);
    } catch (err) {
      setError(err.message || 'Failed to load shortlisted candidates.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (candidateId) => {
    if (!window.confirm('Are you sure you want to remove this candidate from your shortlist?')) {
      return;
    }

    setRemovingId(candidateId);
    try {
      const response = await mentorApi.removeFromShortlist(candidateId);
      if (response.success) {
        setCandidates(prev => prev.filter(c => c.candidateId !== candidateId));
      }
    } catch (err) {
      alert(err.message || 'Failed to remove candidate.');
    } finally {
      setRemovingId(null);
    }
  };

  const handleOpenInvitationModal = (candidate) => {
    setActiveInvitationCandidate(candidate);
    setSelectedJobId('');
    setMessageText('We reviewed your profile and would like to discuss this opportunity with you.');
    setInvitationError('');
    setInvitationSuccess('');
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!selectedJobId) {
      setInvitationError('Please select a job description.');
      return;
    }

    setInvitationLoading(true);
    setInvitationError('');
    setInvitationSuccess('');

    try {
      const response = await mentorApi.sendCandidateInvitation({
        candidateId: activeInvitationCandidate.candidateId,
        jobId: selectedJobId,
        message: messageText,
      });

      if (response.success) {
        setInvitationSuccess('Invitation sent successfully!');
        setTimeout(() => {
          setActiveInvitationCandidate(null);
          setInvitationSuccess('');
        }, 1500);
      }
    } catch (err) {
      console.error('Invitation send error:', err);
      setInvitationError(
        '❌ Recruitment Invitation Service Offline: The backend API endpoint for sending invitations could not be resolved. Please register the invitation routes on the server to enable this feature.'
      );
    } finally {
      setInvitationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 bg-white/10 rounded animate-pulse"></div>
        <div className="h-16 w-full bg-white/5 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[60vh] flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-red-500/10 text-red-400 flex items-center justify-center mb-6">
          <HiOutlineExclamationCircle className="text-4xl" />
        </div>
        <h2 className="text-2xl font-bold mb-4 font-space">Access Restricted</h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <Link to="/mentor/dashboard" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium text-sm">
          Return to Dashboard
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header>
        <h1 className="text-3xl font-space font-bold">Shortlisted Candidates</h1>
        <p className="text-slate-400 mt-2">Manage candidates you are interested in for your hiring needs.</p>
      </header>

      {candidates.length === 0 ? (
        <div className="py-20 flex flex-col items-center justify-center text-center bg-white/5 border border-white/10 rounded-2xl p-8 max-w-2xl mx-auto">
          <HiOutlineExclamationCircle className="text-slate-500 text-5xl mb-4" />
          <h3 className="text-lg font-bold font-space text-slate-300">No shortlisted candidates yet</h3>
          <p className="text-sm text-slate-500 mt-1 mb-8 max-w-sm">Start searching the candidate talent pool to shortlist matching applicants.</p>
          <button
            onClick={() => navigate('/mentor/candidates')}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-all shadow-md hover:shadow-violet-600/10"
          >
            Go to Candidates <HiOutlineArrowRight />
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {candidates.map(candidate => (
            <div key={candidate.candidateId} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold truncate max-w-[180px]">{candidate.name}</h3>
                  <p className="text-[10px] text-slate-500 mt-1 uppercase font-semibold">
                    Shortlisted: {new Date(candidate.shortlistedAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="text-xs px-2.5 py-1.5 rounded-lg bg-white/10 border border-white/5 font-semibold text-slate-300">
                  {candidate.email}
                </div>
              </div>

              {candidate.notes && (
                <div className="bg-black/15 rounded-xl p-3 border border-white/5 mb-4 flex-grow">
                  <span className="block text-[8px] text-slate-500 font-bold uppercase tracking-wider mb-1">Recruiter Notes</span>
                  <p className="text-xs text-slate-400 leading-relaxed italic">
                    "{candidate.notes}"
                  </p>
                </div>
              )}

              <div className="mt-auto space-y-2 pt-4 border-t border-white/5">
                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenInvitationModal(candidate)}
                    className="flex-1 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <HiOutlineMail className="text-sm" /> INVITE
                  </button>
                  <button
                    onClick={() => handleRemove(candidate.candidateId)}
                    disabled={removingId === candidate.candidateId}
                    className="px-3.5 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/10 hover:border-red-500/20 transition-colors"
                    title="Remove from Shortlist"
                  >
                    <HiOutlineTrash />
                  </button>
                </div>
                <Link
                  to={`/mentor/candidates/${candidate.candidateId}`}
                  className="block w-full py-2 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-white/10 text-center transition-colors"
                >
                  VIEW PROFILE
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recruitment Invitation Modal */}
      <AnimatePresence>
        {activeInvitationCandidate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setActiveInvitationCandidate(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0d122e] border border-white/10 rounded-3xl p-8 shadow-2xl text-left"
            >
              <h3 className="text-xl font-bold font-space text-white mb-2">Send Recruitment Invitation</h3>
              <p className="text-xs text-slate-400 mb-6">Invite candidate to apply for one of your job listings.</p>

              <form onSubmit={handleSendInvitation} className="space-y-4">
                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Candidate</label>
                  <input
                    type="text"
                    value={activeInvitationCandidate.name}
                    readOnly
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-400 focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Job Description / Position *</label>
                  <select
                    required
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violetAccent/50 cursor-pointer"
                  >
                    <option value="" className="bg-[#0c0f25] text-slate-500">-- Select Job position --</option>
                    {jobs.map(job => (
                      <option key={job._id} value={job._id} className="bg-[#0c0f25] text-white">
                        {job.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">Message *</label>
                  <textarea
                    required
                    rows={4}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    placeholder="Tell the candidate why you are interested in their profile and invite them to discuss the opportunity."
                    className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-violetAccent/50 placeholder:text-slate-600 resize-none"
                  />
                </div>

                {invitationError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 rounded-xl text-xs leading-relaxed">
                    {invitationError}
                  </div>
                )}

                {invitationSuccess && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-400 rounded-xl text-xs font-semibold">
                    {invitationSuccess}
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveInvitationCandidate(null)}
                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-white/20 transition-all text-white font-semibold rounded-xl text-sm"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={invitationLoading}
                    className="flex-1 py-3 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 transition-all text-white font-semibold rounded-xl text-sm flex items-center justify-center gap-2"
                  >
                    {invitationLoading ? (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    ) : (
                      'SEND INVITATION'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

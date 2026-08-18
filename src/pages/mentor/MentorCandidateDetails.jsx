import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiArrowLeft, HiOutlineDocumentText, HiOutlineLockClosed, HiOutlineStar } from 'react-icons/hi';
import { mentorApi } from '../../services/mentorApi';

export default function MentorCandidateDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [plan, setPlan] = useState('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Shortlisting State
  const [isShortlisted, setIsShortlisted] = useState(false);
  const [shortlisting, setShortlisting] = useState(false);

  // Invitation Modal State
  const [showInvitationModal, setShowInvitationModal] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [invitationLoading, setInvitationLoading] = useState(false);
  const [invitationError, setInvitationError] = useState('');
  const [invitationSuccess, setInvitationSuccess] = useState('');
  const [selectedJobId, setSelectedJobId] = useState('');
  const [messageText, setMessageText] = useState('We reviewed your profile and would like to discuss this opportunity with you.');

  useEffect(() => {
    const fetchCandidateAndPlan = async () => {
      try {
        const [candidateData, accessData, shortlistData, jobsData] = await Promise.all([
          mentorApi.getCandidateById(id),
          mentorApi.getAccessStatus(),
          mentorApi.getShortlistedCandidates().catch(() => ({ candidates: [] })),
          mentorApi.getJobs().catch(() => ({ jobs: [] }))
        ]);
        setCandidate(candidateData.candidate);
        setPlan(accessData.subscription?.plan || 'none');
        setJobs(jobsData.jobs || []);
        if (shortlistData.candidates) {
          const isShort = shortlistData.candidates.some(c => c.candidateId === candidateData.candidate.id || c.candidateId === id);
          setIsShortlisted(isShort);
        }
      } catch (err) {
        setError(err.message || 'Failed to load candidate details');
      } finally {
        setLoading(false);
      }
    };
    fetchCandidateAndPlan();
  }, [id]);

  const hasResume = candidate?.resumeCount > 0;
  const resume = hasResume ? candidate.resumes[0] : null;
  const isBasicPlan = plan === 'basic';

  const handleShortlistClick = async () => {
    if (isBasicPlan) {
      navigate('/mentor/subscription');
      return;
    }

    setShortlisting(true);
    try {
      if (isShortlisted) {
        const res = await mentorApi.removeFromShortlist(id);
        if (res.success) {
          setIsShortlisted(false);
        }
      } else {
        const res = await mentorApi.shortlistCandidate(id);
        if (res.success) {
          setIsShortlisted(true);
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to update shortlist status');
    } finally {
      setShortlisting(false);
    }
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
        candidateId: id,
        jobId: selectedJobId,
        message: messageText,
      });
      if (response.success) {
        setInvitationSuccess('Invitation sent successfully!');
        setTimeout(() => {
          setShowInvitationModal(false);
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

  const handleDownloadResume = async () => {
    if (!resume || !resume.fileName) {
      alert("No file associated with this resume analysis.");
      return;
    }
    
    try {
      const auth = JSON.parse(localStorage.getItem('nexthireai_auth'));
      const token = auth?.token;

      const response = await fetch(`http://localhost:5000/api/resume/download/${resume.fileName}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to download resume file');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = resume.originalFileName || 'resume.pdf';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'Could not download resume');
    }
  };

  if (loading) {
    return <div className="animate-pulse h-[60vh] bg-white/5 rounded-2xl"></div>;
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-400 bg-red-500/10 p-4 rounded-xl inline-block">{error}</p>
        <div className="mt-4">
          <Link to="/mentor/candidates" className="text-slate-400 hover:text-white">&larr; Back to Candidates</Link>
        </div>
      </div>
    );
  }

  if (!candidate) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <Link to="/mentor/candidates" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors">
        <HiArrowLeft /> Back to Candidates
      </Link>

      <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">{candidate.name}</h1>
            <div className="flex flex-wrap items-center gap-3 text-slate-400 text-sm">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500"></span>
                Active Candidate
              </span>
              <span>•</span>
              <span>Joined {new Date(candidate.joinedAt).toLocaleDateString()}</span>
              <span>•</span>
              {hasResume ? (
                <span className="text-blue-400 font-medium flex items-center gap-1">
                  <HiOutlineDocumentText className="text-base" /> Resume Available
                </span>
              ) : (
                <span className="text-slate-500">No Resume Uploaded</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            {hasResume && (
              isBasicPlan ? (
                <button
                  disabled
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-slate-500 rounded-lg text-sm font-medium cursor-not-allowed border border-dashed border-white/5"
                  title="Upgrade to Professional or Premium to download resume files"
                >
                  🔒 Resume Download Locked
                </button>
              ) : (
                <button
                  onClick={handleDownloadResume}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0a0f25] hover:bg-white/5 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-white/10"
                >
                  Download Resume File
                </button>
              )
            )}

            {isBasicPlan ? (
              <>
                <button
                  onClick={() => navigate('/mentor/subscription')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-850 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-sm font-medium border border-dashed border-white/10 transition-colors"
                >
                  🔒 SHORTLIST
                </button>
                <button
                  onClick={() => navigate('/mentor/subscription')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-850 hover:bg-white/5 text-slate-400 hover:text-white rounded-lg text-sm font-medium border border-dashed border-white/10 transition-colors"
                >
                  🔒 SEND INVITATION
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleShortlistClick}
                  disabled={shortlisting}
                  className={`flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    isShortlisted
                      ? 'bg-violetAccent/20 text-violetAccent-light border-violet-500/30'
                      : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                  }`}
                >
                  {shortlisting ? (
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  ) : isShortlisted ? (
                    <>✓ SHORTLISTED</>
                  ) : (
                    <>⭐ SHORTLIST</>
                  )}
                </button>
                <button
                  onClick={() => setShowInvitationModal(true)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-medium transition-colors shadow-md hover:shadow-violet-600/15"
                >
                  SEND INVITATION
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {hasResume && resume && (
        <div className="space-y-8">
          <h2 className="text-xl font-bold font-space">Resume Evaluation</h2>
          
          {/* Overall score always visible */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <ScoreBox title="Overall" score={resume.overallScore} color="text-green-400 border-green-500/30 bg-green-500/5" />
            <ScoreBox title="Content" score={isBasicPlan ? "🔒" : resume.contentScore} />
            <ScoreBox title="ATS" score={isBasicPlan ? "🔒" : resume.atsScore} />
            <ScoreBox title="Format" score={isBasicPlan ? "🔒" : resume.formatScore} />
            <ScoreBox title="Grammar" score={isBasicPlan ? "🔒" : resume.grammarScore} />
            <ScoreBox title="Complete" score={isBasicPlan ? "🔒" : resume.completenessScore} />
          </div>

          {isBasicPlan ? (
            /* Premium Plan Lock Promo Card */
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-violetAccent/10 to-blueAccent/5 border border-violetAccent/20 rounded-2xl p-8 text-center max-w-xl mx-auto space-y-4"
            >
              <div className="w-12 h-12 rounded-xl bg-violetAccent/20 text-violetAccent-light flex items-center justify-center mx-auto">
                <HiOutlineLockClosed className="text-2xl" />
              </div>
              <h3 className="text-lg font-bold text-white font-space">Detailed AI Report Locked</h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                You are currently on the <strong>Basic Plan</strong>. Upgrade to the <strong>Professional</strong> or <strong>Premium</strong> plan to unlock detailed sections scores, candidate strengths, improvement suggestions, and full AI resume critiques.
              </p>
              <div className="pt-2">
                <Link to="/mentor/subscription" className="px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-semibold text-sm transition-colors shadow-lg hover:shadow-violetAccent/20 inline-block">
                  Upgrade Plan
                </Link>
              </div>
            </motion.div>
          ) : (
            /* Full details visible for Professional & Premium */
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-green-400 mb-4 font-space">Strengths</h3>
                  <ul className="space-y-2.5 text-sm text-slate-300 list-disc pl-5 leading-relaxed">
                    {resume.strengths?.map((item, idx) => (
                      <li key={idx}>{item.replace(/^-\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
                <div className="bg-white/5 rounded-2xl border border-white/10 p-6">
                  <h3 className="text-lg font-bold text-orange-400 mb-4 font-space">Suggestions for Improvement</h3>
                  <ul className="space-y-2.5 text-sm text-slate-300 list-disc pl-5 leading-relaxed">
                    {resume.suggestions?.map((item, idx) => (
                      <li key={idx}>{item.replace(/^-\s*/, '')}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-bold font-space">Section Analysis</h3>
                {resume.sectionAnalysis && Object.entries(resume.sectionAnalysis).map(([key, value]) => (
                  <details key={key} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden group">
                    <summary className="p-4 cursor-pointer font-medium hover:bg-white/5 flex justify-between items-center capitalize text-sm">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                      {value?.score && <span className="text-xs bg-black/30 px-3 py-1 rounded-full text-blueAccent-light font-semibold">{value.score} / 100</span>}
                    </summary>
                    <div className="p-4 pt-0 text-sm text-slate-400 border-t border-white/5 leading-relaxed">
                      <p className="mt-4">{value?.feedback}</p>
                    </div>
                  </details>
                ))}
              </div>
            </>
          )}

        </div>
      )}

      {!hasResume && (
        <div className="py-12 text-center text-slate-500 bg-white/5 rounded-2xl border border-white/10">
          <p>This candidate has not uploaded a resume yet.</p>
        </div>
      )}

      {/* Recruitment Invitation Modal */}
      <AnimatePresence>
        {showInvitationModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setShowInvitationModal(false)}
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
                    value={candidate.name}
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
                    onClick={() => setShowInvitationModal(false)}
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

function ScoreBox({ title, score, color = 'text-blueAccent-light border-white/10 bg-white/5' }) {
  return (
    <div className={`border rounded-xl p-4 flex flex-col items-center justify-center text-center ${color}`}>
      <div className="text-[10px] text-slate-500 mb-1 uppercase tracking-wider font-bold">{title}</div>
      <div className="text-2xl font-black">{score || 0}</div>
    </div>
  );
}

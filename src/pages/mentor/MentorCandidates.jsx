import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineSearch, HiOutlineDocumentText, HiOutlineExclamationCircle, HiOutlineLockClosed, HiOutlineBriefcase, HiOutlineStar } from 'react-icons/hi';
import { HiOutlineSparkles, HiOutlineCheckCircle, HiOutlineXCircle } from 'react-icons/hi2';
import { mentorApi } from '../../services/mentorApi';

export default function MentorCandidates() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState([]);
  const [jobs, setJobs] = useState([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [plan, setPlan] = useState('none');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Shortlisted state tracking
  const [shortlistedMap, setShortlistedMap] = useState({});
  const [shortlistingLoading, setShortlistingLoading] = useState({});

  // Sourcing Matching Results State
  // Format: { [candidateId_jobId]: { matchPercentage, keyMatches, missingSkills, verdict } }
  const [matchResults, setMatchResults] = useState({});
  const [matchingLoading, setMatchingLoading] = useState({});

  // Modal State for Viewing detailed Match Report
  const [activeMatchReport, setActiveMatchReport] = useState(null);
  
  // Filtering state
  const [searchTerm, setSearchTerm] = useState('');
  const [minScore, setMinScore] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [candidatesData, accessData, jobsData, shortlistData] = await Promise.all([
        mentorApi.getCandidates(),
        mentorApi.getAccessStatus(),
        mentorApi.getJobs().catch(() => ({ jobs: [] })), // Fallback if no jobs table or access issue
        mentorApi.getShortlistedCandidates().catch(() => ({ candidates: [] }))
      ]);

      if (candidatesData.candidates) {
        setCandidates(candidatesData.candidates);
      }
      if (accessData.subscription) {
        setPlan(accessData.subscription.plan || 'none');
      }
      if (jobsData.jobs) {
        setJobs(jobsData.jobs);
      }
      if (shortlistData.candidates) {
        const map = {};
        shortlistData.candidates.forEach(item => {
          map[item.candidateId] = true;
        });
        setShortlistedMap(map);
      }
    } catch (err) {
      setError(err.message || 'Failed to load candidates');
    } finally {
      setLoading(false);
    }
  };

  const isBasicPlan = plan === 'basic';

  const filteredCandidates = candidates.filter(candidate => {
    const matchesSearch = candidate.name.toLowerCase().includes(searchTerm.toLowerCase());
    
    // If a job matching score filter is active, check the cached match percentage, else overall resume score
    let scoreToCheck = 0;
    if (selectedJobId) {
      const key = `${candidate.id}_${selectedJobId}`;
      scoreToCheck = matchResults[key]?.matchPercentage || 0;
    } else {
      scoreToCheck = candidate.resume?.overallScore || 0;
    }

    const matchesScore = minScore && !isBasicPlan ? scoreToCheck >= parseInt(minScore) : true;
    return matchesSearch && matchesScore;
  });

  const handleCalculateMatch = async (candidateId) => {
    if (!selectedJobId) return;
    const key = `${candidateId}_${selectedJobId}`;
    
    setMatchingLoading(prev => ({ ...prev, [key]: true }));
    try {
      const response = await mentorApi.matchCandidate(candidateId, { jobId: selectedJobId });
      if (response.success && response.match) {
        setMatchResults(prev => ({
          ...prev,
          [key]: response.match
        }));
      }
    } catch (err) {
      alert(err.message || 'Failed to analyze candidate fit.');
    } finally {
      setMatchingLoading(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleShortlist = async (candidateId) => {
    if (isBasicPlan) {
      navigate('/mentor/subscription');
      return;
    }

    const isCurrentlyShortlisted = shortlistedMap[candidateId];
    setShortlistingLoading(prev => ({ ...prev, [candidateId]: true }));
    try {
      if (isCurrentlyShortlisted) {
        const res = await mentorApi.removeFromShortlist(candidateId);
        if (res.success) {
          setShortlistedMap(prev => ({ ...prev, [candidateId]: false }));
        }
      } else {
        const res = await mentorApi.shortlistCandidate(candidateId);
        if (res.success) {
          setShortlistedMap(prev => ({ ...prev, [candidateId]: true }));
        }
      }
    } catch (err) {
      alert(err.message || 'Failed to update shortlist status');
    } finally {
      setShortlistingLoading(prev => ({ ...prev, [candidateId]: false }));
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-1/3 bg-white/10 rounded animate-pulse"></div>
        <div className="h-16 w-full bg-white/5 rounded-xl animate-pulse"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => <div key={i} className="h-48 bg-white/5 rounded-2xl animate-pulse"></div>)}
        </div>
      </div>
    );
  }

  // Access denied case (backend returned error message indicating access issue)
  if (error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="h-[60vh] flex flex-col items-center justify-center text-center max-w-lg mx-auto">
        <div className="w-20 h-20 rounded-2xl bg-orange-500/10 text-orange-400 flex items-center justify-center mb-6">
          <HiOutlineLockClosed className="text-4xl" />
        </div>
        <h2 className="text-2xl font-bold mb-4">Access Restricted</h2>
        <p className="text-slate-400 mb-8">{error}</p>
        <Link to="/mentor/dashboard" className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-colors font-medium text-sm">
          Return to Dashboard
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-space font-bold">Candidate Talent Pool</h1>
          <p className="text-slate-400 mt-2">Find the best candidates for your hiring needs.</p>
        </div>

        {/* AI Job Matcher Dropdown */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl p-3 w-full md:w-80">
          <div className="p-2 rounded-lg bg-violetAccent/20 text-violetAccent-light">
            <HiOutlineBriefcase className="text-lg" />
          </div>
          <div className="flex-1">
            <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Evaluate Against Role</label>
            <select
              value={selectedJobId}
              onChange={(e) => setSelectedJobId(e.target.value)}
              className="bg-transparent text-sm font-semibold text-white focus:outline-none w-full cursor-pointer"
            >
              <option value="" className="bg-[#0c0f25] text-slate-400">None (Show Resume Score)</option>
              {jobs.map(job => (
                <option key={job._id} value={job._id} className="bg-[#0c0f25] text-white">
                  {job.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Filters */}
      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <HiOutlineSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg" />
          <input 
            type="text" 
            placeholder="Search candidates..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/20 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-violetAccent/50 text-white"
          />
        </div>
        <div className="w-full md:w-48 relative">
          <input 
            type="number" 
            placeholder={isBasicPlan ? "🔒 Premium Filter" : (selectedJobId ? "Min Fit Score %" : "Min Resume Score")} 
            value={isBasicPlan ? "" : minScore}
            disabled={isBasicPlan}
            onChange={(e) => setMinScore(e.target.value)}
            className={`w-full bg-black/20 border rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-violetAccent/50 transition-all ${
              isBasicPlan ? 'opacity-50 cursor-not-allowed border-dashed border-white/10 text-slate-500' : 'border-white/10 text-white'
            }`}
            title={isBasicPlan ? "Upgrade to Professional or Premium to filter by Resume Score" : ""}
          />
        </div>
      </div>

      {filteredCandidates.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center text-center">
          <HiOutlineExclamationCircle className="text-slate-500 text-5xl mb-4" />
          <h3 className="text-lg font-medium text-slate-300">No candidates found</h3>
          <p className="text-sm text-slate-500 mt-1">Try changing your search or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCandidates.map(candidate => {
            const matchKey = `${candidate.id}_${selectedJobId}`;
            const matchData = matchResults[matchKey];
            const isMatching = matchingLoading[matchKey];

            return (
              <CandidateCard 
                key={candidate.id} 
                candidate={candidate} 
                selectedJobId={selectedJobId}
                matchData={matchData}
                isMatching={isMatching}
                onCalculateMatch={() => handleCalculateMatch(candidate.id)}
                onViewMatchDetails={() => setActiveMatchReport({ ...matchData, candidateName: candidate.name })}
                isBasicPlan={isBasicPlan}
                isShortlisted={Boolean(shortlistedMap[candidate.id])}
                isShortlisting={Boolean(shortlistingLoading[candidate.id])}
                onShortlist={() => handleShortlist(candidate.id)}
              />
            );
          })}
        </div>
      )}

      {/* AI Fit Analysis Report Modal */}
      <AnimatePresence>
        {activeMatchReport && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setActiveMatchReport(null)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, y: 15, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.95, y: 15, opacity: 0 }}
              className="relative w-full max-w-lg bg-[#0d122e] border border-white/10 rounded-3xl p-8 shadow-2xl text-left"
            >
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold font-space text-white">{activeMatchReport.candidateName}</h3>
                  <p className="text-xs text-slate-400 mt-1">AI Sourcing Alignment Report</p>
                </div>
                <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-violetAccent-light text-violetAccent-light font-black text-lg bg-violetAccent/10">
                  {activeMatchReport.matchPercentage}%
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <HiOutlineSparkles className="text-violetAccent-light" /> Match Verdict
                  </h4>
                  <p className="text-sm text-slate-300 leading-relaxed bg-white/5 p-4 rounded-xl border border-white/5">
                    {activeMatchReport.verdict}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HiOutlineCheckCircle /> Core Strengths
                    </h4>
                    <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                      {activeMatchReport.keyMatches.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-orange-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HiOutlineXCircle /> Skill Gaps
                    </h4>
                    {activeMatchReport.missingSkills.length === 0 ? (
                      <p className="text-xs text-slate-500 pl-1">No major skill gaps identified.</p>
                    ) : (
                      <ul className="space-y-1.5 text-xs text-slate-300 list-disc pl-4">
                        {activeMatchReport.missingSkills.map((item, idx) => (
                          <li key={idx}>{item}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => setActiveMatchReport(null)}
                  className="w-full py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl text-sm font-semibold transition-colors mt-4 text-center border border-white/5"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}

function CandidateCard({ 
  candidate, 
  selectedJobId, 
  matchData, 
  isMatching, 
  onCalculateMatch, 
  onViewMatchDetails, 
  isBasicPlan,
  isShortlisted,
  isShortlisting,
  onShortlist
}) {
  const { name, hasResume, resume } = candidate;
  const score = resume?.overallScore;

  return (
    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 transition-all flex flex-col h-full">
      <div className="flex justify-between items-start mb-4">
        <h3 className="text-lg font-bold truncate pr-2">{name}</h3>
        
        {selectedJobId ? (
          /* Render Sourcing Match Score if Job is selected */
          matchData ? (
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-violetAccent/30 text-violetAccent-light font-bold bg-violetAccent/10 flex-shrink-0 text-xs">
              {matchData.matchPercentage}%
            </div>
          ) : (
            <div className="text-[10px] px-2 py-1 rounded bg-slate-800 text-slate-500 font-bold uppercase tracking-wider">Unchecked</div>
          )
        ) : (
          /* Default: Render Overall Resume Evaluation Score */
          score ? (
            <div className="flex flex-col items-center justify-center w-12 h-12 rounded-full border-2 border-green-500/30 text-green-400 font-bold bg-green-500/10 flex-shrink-0">
              {score}
            </div>
          ) : (
            <div className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-400">N/A</div>
          )
        )}
      </div>

      <div className="flex-grow">
        {hasResume ? (
          <div className="flex items-center gap-2 text-sm text-slate-300 mb-4">
            <HiOutlineDocumentText className="text-blue-400" />
            Resume Available
          </div>
        ) : (
          <div className="flex items-center gap-2 text-sm text-slate-500 mb-4">
            <HiOutlineExclamationCircle />
            No Resume Uploaded
          </div>
        )}
        
        {selectedJobId && matchData ? (
          /* Render Job Verdict Summary on Card */
          <div className="bg-black/10 rounded-xl p-3 border border-white/5 mb-4">
            <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed italic">
              "{matchData.verdict}"
            </p>
          </div>
        ) : (
          /* Default strengths */
          resume?.strengths && resume.strengths.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {resume.strengths.slice(0, 3).map((strength, idx) => (
                <span key={idx} className="text-xs px-2 py-1 bg-white/10 rounded-md text-slate-300 truncate max-w-[150px]">
                  {strength.replace(/^-\s*/, '')}
                </span>
              ))}
            </div>
          )
        )}
      </div>

      <div className="mt-auto space-y-2 pt-4">
        {selectedJobId && hasResume && (
          isBasicPlan ? (
            <button
              disabled
              className="w-full py-2 bg-slate-800 text-slate-500 rounded-xl text-xs font-semibold cursor-not-allowed border border-dashed border-white/5"
              title="Upgrade to Professional or Premium to use AI Sourcing Alignment Matcher"
            >
              🔒 AI Fit Matching Locked
            </button>
          ) : (
            matchData ? (
              <button 
                onClick={onViewMatchDetails}
                className="w-full py-2 bg-violetAccent/20 hover:bg-violetAccent text-violetAccent-light hover:text-white transition-colors rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5"
              >
                <HiOutlineSparkles /> VIEW FIT DETAILS
              </button>
            ) : (
              <button
                onClick={onCalculateMatch}
                disabled={isMatching}
                className="w-full py-2 bg-violet-600 hover:bg-violet-700 text-white transition-colors rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                {isMatching ? (
                  <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>🔍 CHECK JOB FIT</>
                )}
              </button>
            )
          )
        )}

        {isBasicPlan ? (
          <button
            onClick={onShortlist}
            className="w-full py-2 bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-colors border border-dashed border-white/10 flex items-center justify-center gap-1.5"
          >
            🔒 SHORTLIST
          </button>
        ) : (
          <button
            onClick={onShortlist}
            disabled={isShortlisting}
            className={`w-full py-2 rounded-xl text-xs font-bold text-center flex items-center justify-center gap-1.5 transition-all border ${
              isShortlisted
                ? 'bg-violetAccent/20 text-violetAccent-light border-violet-500/30'
                : 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
            }`}
          >
            {isShortlisting ? (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : isShortlisted ? (
              <>✓ SHORTLISTED</>
            ) : (
              <>⭐ SHORTLIST</>
            )}
          </button>
        )}

        <Link 
          to={`/mentor/candidates/${candidate.id}`}
          className="block w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/10 hover:border-white/20 transition-all text-center text-xs font-semibold"
        >
          VIEW PROFILE
        </Link>
      </div>
    </div>
  );
}

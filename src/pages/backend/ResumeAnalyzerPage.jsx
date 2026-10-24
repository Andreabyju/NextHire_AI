import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiHome, FiFileText, FiMic, FiCode, FiActivity,
  FiSettings, FiLogOut, FiUser, FiBell, FiUpload,
  FiCheckCircle, FiAlertCircle, FiXCircle, FiX,
  FiChevronRight, FiChevronLeft, FiAward, FiTrendingUp,
  FiBarChart2, FiBookOpen, FiThumbsUp, FiClock,
  FiEye, FiRefreshCw, FiShield, FiAlignLeft,
} from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';
import { useAuth } from '../../context/AuthContext';
import { API_BASE } from '../../services/api';


// ── Sidebar links (mirrors DashboardPage) ─────────────────────────────────────
const SIDEBAR_LINKS = [
  { icon: FiHome, label: 'Overview', id: 'overview', path: '/dashboard' },
  { icon: FiFileText, label: 'Resume', id: 'resume', path: '/resume-analyzer' },
  { icon: FiMic, label: 'Mock Interview', id: 'mock', path: '/interview/setup' },
  { icon: FiCode, label: 'Assessments', id: 'assessments', path: '/dashboard' },
  { icon: FiBarChart2, label: 'Progress', id: 'progress', path: '/dashboard' },
  { icon: FiAward, label: 'Results', id: 'results', path: '/interview/history' },
  { icon: FiThumbsUp, label: 'Recommendations', id: 'recommendations', path: '/dashboard' },
  { icon: FiBookOpen, label: 'Resources', id: 'resources', path: '/dashboard' },
];

// ── Score interpretation ───────────────────────────────────────────────────────
function getScoreLabel(score) {
  if (score >= 90) return { label: 'Excellent', color: 'text-emerald-400' };
  if (score >= 80) return { label: 'Very Good', color: 'text-green-400' };
  if (score >= 70) return { label: 'Good', color: 'text-blue-400' };
  if (score >= 60) return { label: 'Needs Improvement', color: 'text-amber-400' };
  return { label: 'Needs Major Improvement', color: 'text-red-400' };
}

function getScoreColor(score) {
  if (score >= 80) return '#34d399';   // emerald
  if (score >= 70) return '#60a5fa';   // blue
  if (score >= 60) return '#fbbf24';   // amber
  return '#f87171';                    // red
}

// ── Circular SVG progress ─────────────────────────────────────────────────────
function CircularScore({ score, size = 160, stroke = 12 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color = getScoreColor(score);

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={stroke}
        />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold font-space text-white leading-none">{score}</span>
        <span className="text-xs text-slate-400 mt-1">/ 100</span>
      </div>
    </div>
  );
}

// ── Linear progress bar ───────────────────────────────────────────────────────
function ScoreBar({ label, score, maxScore, delay = 0 }) {
  const pct = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const color = getScoreColor(pct);
  return (
    <div>
      <div className="flex justify-between text-xs mb-1.5">
        <span className="text-slate-400">{label}</span>
        <span className="text-white font-semibold">{score}<span className="text-slate-500">/{maxScore}</span></span>
      </div>
      <div className="h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </div>
  );
}

// ── File size formatter ───────────────────────────────────────────────────────
function formatBytes(bytes) {
  if (!bytes) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function timeAgo(iso) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ── Loading step messages ─────────────────────────────────────────────────────
const LOADING_STEPS = [
  { id: 0, text: 'Uploading resume...' },
  { id: 1, text: 'Extracting text from document...' },
  { id: 2, text: 'Analyzing PDF format...' },
  { id: 3, text: 'Running AI analysis with Gemini...' },
  { id: 4, text: 'Generating your resume score...' },
];

// ── Issue / strength list item ────────────────────────────────────────────────
function ListItem({ text, variant = 'neutral' }) {
  const variants = {
    success: { icon: FiCheckCircle, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
    warning: { icon: FiAlertCircle, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    error: { icon: FiXCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
    neutral: { icon: FiChevronRight, color: 'text-slate-400', bg: 'bg-white/3 border-white/8' },
  };
  const { icon: Icon, color, bg } = variants[variant];
  return (
    <div className={`flex items-start gap-3 px-4 py-3 rounded-xl border ${bg}`}>
      <Icon className={`${color} flex-shrink-0 mt-0.5 text-sm`} />
      <span className="text-sm text-slate-300 leading-relaxed">{text}</span>
    </div>
  );
}

// ── Section analysis card ─────────────────────────────────────────────────────
function SectionCard({ title, score, feedback, delay }) {
  const pct = score;
  const color = getScoreColor(pct);
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-5 hover:border-white/15 transition-all duration-300"
    >
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-semibold text-white">{title}</h4>
        <span className="text-lg font-bold font-space" style={{ color }}>{score}</span>
      </div>
      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden mb-3">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1, delay: delay + 0.2, ease: 'easeOut' }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      {feedback ? (
        <p className="text-xs text-slate-400 leading-relaxed">{feedback}</p>
      ) : (
        <p className="text-xs text-slate-600 italic">No feedback available for this section.</p>
      )}
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ResumeAnalyzerPage() {
  const navigate = useNavigate();
  const { user, token, isAuthenticated, loading, logout } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);
  const [error, setError] = useState('');

  // Results state
  const [result, setResult] = useState(null);   // { analysis, formatAnalysis, file, analysisId }

  // History state
  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [viewingRecord, setViewingRecord] = useState(null);  // full record from /history/:id
  const [recordLoading, setRecordLoading] = useState(false);

  const fileInputRef = useRef(null);

  // ── Auth guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/sign-in');
  }, [loading, isAuthenticated, navigate]);

  // ── Load history ────────────────────────────────────────────────────────────
  const fetchHistory = useCallback(async () => {
    if (!token) return;
    setHistoryLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/resume/history?limit=10`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data.records || []);
      }
    } catch {
      // silently fail — history is non-critical
    } finally {
      setHistoryLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (!loading && isAuthenticated) fetchHistory();
  }, [loading, isAuthenticated, fetchHistory]);

  // ── File selection ──────────────────────────────────────────────────────────
  const handleFileChange = (file) => {
    setError('');
    setResult(null);
    setViewingRecord(null);

    if (!file) return;

    const allowedMimes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const allowedExtensions = ['pdf', 'docx', 'doc'];

    const isValidType = allowedMimes.includes(file.type) || allowedExtensions.includes(fileExtension);

    if (!isValidType) {
      setError('Invalid file format. Please upload a PDF or Word document (.pdf, .docx).');
      return;
    }
    if (file.size === 0) {
      setError('The selected file is empty. Please choose a valid resume document.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File is too large. Maximum allowed size is 5 MB.');
      return;
    }

    setSelectedFile(file);
  };

  const handleInputChange = (e) => {
    handleFileChange(e.target.files?.[0] || null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFileChange(e.dataTransfer.files?.[0] || null);
  };

  const removeFile = () => {
    setSelectedFile(null);
    setError('');
    setResult(null);
    setViewingRecord(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ── Step cycling during loading ─────────────────────────────────────────────
  useEffect(() => {
    if (!analyzing) { setLoadingStep(0); return; }
    const interval = setInterval(() => {
      setLoadingStep((s) => (s < LOADING_STEPS.length - 1 ? s + 1 : s));
    }, 2200);
    return () => clearInterval(interval);
  }, [analyzing]);

  // ── Upload & analyze ────────────────────────────────────────────────────────
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError('Please select or drag a resume file (PDF or DOCX) to analyze.');
      return;
    }
    if (analyzing) return;
    setError('');
    setResult(null);
    setViewingRecord(null);
    setAnalyzing(true);
    setLoadingStep(0);

    try {
      const formData = new FormData();
      formData.append('resume', selectedFile);

      const res = await fetch(`${API_BASE}/api/resume/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
        // NOTE: Do NOT set Content-Type header — browser sets it with boundary automatically
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || data.message || 'Unable to analyze the resume. Please try again.');
        setAnalyzing(false);
        return;
      }

      setResult(data);
      fetchHistory();   // refresh history after new analysis
    } catch (err) {
      setError(err?.message ? `Network/Server error: ${err.message}` : 'Network error. Please check your connection and try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  // ── View historical record ──────────────────────────────────────────────────
  const handleViewRecord = async (id) => {
    setRecordLoading(true);
    setViewingRecord(null);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE}/api/resume/history/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        // Map record shape to match live-analysis result shape
        setViewingRecord(data.record);
        // Scroll to top of main
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch {
      // silently fail
    } finally {
      setRecordLoading(false);
    }
  };

  const handleAnalyzeAnother = () => {
    setResult(null);
    setViewingRecord(null);
    setSelectedFile(null);
    setError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSignOut = () => { logout(); navigate('/sign-in'); };

  if (loading || !isAuthenticated) return null;

  // ── Decide what analysis to display ────────────────────────────────────────
  const displayAnalysis = viewingRecord
    ? viewingRecord
    : result
      ? { ...result.analysis, formatAnalysis: result.formatAnalysis, file: result.file }
      : null;

  const isViewingHistory = Boolean(viewingRecord);

  // ── Score interpretation ────────────────────────────────────────────────────
  const overallScore = displayAnalysis?.overallScore ?? 0;
  const { label: scoreLabel, color: scoreLabelColor } = getScoreLabel(overallScore);

  const firstName = (user?.name || 'there').split(' ')[0];

  // ── Section analysis normalized ─────────────────────────────────────────────
  const sectionAnalysis = displayAnalysis?.sectionAnalysis || {};
  const sections = [
    { key: 'professionalSummary', title: 'Professional Summary' },
    { key: 'skills', title: 'Skills' },
    { key: 'projects', title: 'Projects' },
    { key: 'experience', title: 'Experience' },
    { key: 'education', title: 'Education' },
  ];

  // ── Format analysis convenience refs ───────────────────────────────────────
  const fa = displayAnalysis?.formatAnalysis;
  const contact = fa?.contactAnalysis || {};
  const atsChecks = fa?.atsChecks || {};

  return (
    <div className="min-h-screen bg-[#050816] text-white flex overflow-hidden">

      {/* ── SIDEBAR ── */}
      <aside
        className={`relative z-20 flex flex-col bg-[#0a0f1e] border-r border-white/5 transition-all duration-300 flex-shrink-0 ${sidebarOpen ? 'w-64' : 'w-16'
          }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/5">
          <div className="w-9 h-9 min-w-[36px] rounded-xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.35)]">
            <HiSparkles className="text-white text-base" />
          </div>
          {sidebarOpen && (
            <span className="font-space font-bold text-base tracking-tight whitespace-nowrap overflow-hidden">
              NextHire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">AI</span>
            </span>
          )}
        </div>

        {/* User chip */}
        {sidebarOpen && (
          <div className="mx-3 mt-4 mb-2 px-3 py-2.5 rounded-xl bg-gradient-to-r from-blueAccent/10 to-violetAccent/10 border border-white/8 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blueAccent/50 to-violetAccent/50 flex items-center justify-center flex-shrink-0">
              <FiUser className="text-white text-sm" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.name}</p>
              <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
            </div>
          </div>
        )}

        {/* Nav Links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {SIDEBAR_LINKS.map(({ icon: Icon, label, id, path }) => (
            <button
              key={id}
              id={`sidebar-${id}`}
              onClick={() => navigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${id === 'resume'
                  ? 'bg-gradient-to-r from-blueAccent/20 to-violetAccent/10 text-white border border-white/8'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
            >
              <Icon className={`text-lg min-w-[18px] flex-shrink-0 ${id === 'resume' ? 'text-blueAccent-light' : ''}`} />
              {sidebarOpen && <span className="whitespace-nowrap">{label}</span>}
              {sidebarOpen && id === 'resume' && <FiChevronRight className="ml-auto text-xs opacity-60" />}
            </button>
          ))}
        </nav>

        {/* Bottom */}
        <div className="py-4 px-2 border-t border-white/5 space-y-0.5">
          <button
            id="sidebar-settings"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-200"
          >
            <FiSettings className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>Settings</span>}
          </button>
          <button
            id="signout-btn"
            onClick={handleSignOut}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-all duration-200"
          >
            <FiLogOut className="text-lg min-w-[18px]" />
            {sidebarOpen && <span>Sign Out</span>}
          </button>
        </div>

        {/* Collapse toggle */}
        <button
          id="sidebar-collapse"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[#0a0f1e] border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-colors shadow-lg"
        >
          {sidebarOpen ? <FiChevronLeft size={12} /> : <FiChevronRight size={12} />}
        </button>
      </aside>

      {/* ── MAIN ── */}
      <main className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#050816]/80 backdrop-blur-sm flex-shrink-0">
          <div>
            <h1 className="text-lg font-bold font-space text-white">AI Resume Analyzer</h1>
            <p className="text-xs text-slate-500 mt-0.5">Upload your resume and get instant AI-powered feedback</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              id="notifications-btn"
              className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-white/5 hover:bg-white/10 border border-white/8 text-slate-400 hover:text-white transition-all duration-200"
            >
              <FiBell size={16} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-violetAccent rounded-full ring-2 ring-[#050816]" />
            </button>
            <div className="flex items-center gap-2.5 pl-1">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blueAccent/40 to-violetAccent/40 border border-white/10 flex items-center justify-center">
                <FiUser className="text-white text-base" />
              </div>
              <div className="hidden md:block">
                <p className="text-xs font-semibold text-white leading-tight">{user?.name}</p>
                <p className="text-[10px] text-slate-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-8 space-y-8">

          {/* Page heading */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-2xl md:text-3xl font-bold font-space text-white">
              AI <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">Resume Analyzer</span>
            </h2>
            <p className="text-sm text-slate-400 mt-1">
              Upload your resume and let NextHire AI evaluate its content, ATS compatibility, formatting, and overall quality.
            </p>
          </motion.div>

          {/* ── UPLOAD CARD ── */}
          <AnimatePresence mode="wait">
            {!displayAnalysis && (
              <motion.div
                key="upload-card"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-6 md:p-8"
              >
                <h3 className="text-base font-bold font-space text-white mb-1">Upload Your Resume</h3>
                <p className="text-xs text-slate-500 mb-6">PDF or DOCX &bull; Maximum 5 MB</p>

                {/* Drop zone */}
                <div
                  id="resume-dropzone"
                  onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => !selectedFile && !analyzing && fileInputRef.current?.click()}
                  className={`relative border-2 border-dashed rounded-2xl flex flex-col items-center justify-center py-14 px-6 transition-all duration-300 cursor-pointer ${dragging
                      ? 'border-blueAccent bg-blueAccent/10 scale-[1.01]'
                      : selectedFile
                        ? 'border-violetAccent/50 bg-violetAccent/5 cursor-default'
                        : 'border-white/15 hover:border-blueAccent/40 hover:bg-blueAccent/5'
                    }`}
                >
                  {!selectedFile ? (
                    <>
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blueAccent/20 to-violetAccent/20 border border-white/10 flex items-center justify-center mb-4">
                        <FiUpload className="text-2xl text-blueAccent-light" />
                      </div>
                      <p className="text-sm font-semibold text-white mb-1">
                        Drag &amp; drop your resume here
                      </p>
                      <p className="text-xs text-slate-500">or click to browse files</p>
                    </>
                  ) : (
                    <div className="w-full flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blueAccent/30 to-violetAccent/20 border border-white/10 flex items-center justify-center flex-shrink-0">
                          <FiFileText className="text-xl text-blueAccent-light" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{selectedFile.name}</p>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatBytes(selectedFile.size)} &bull; {selectedFile.type === 'application/pdf' ? 'PDF' : 'DOCX'}
                          </p>
                        </div>
                      </div>
                      {!analyzing && (
                        <button
                          id="remove-file-btn"
                          onClick={(e) => { e.stopPropagation(); removeFile(); }}
                          className="flex-shrink-0 w-8 h-8 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center text-red-400 hover:text-red-300 transition-all duration-200"
                        >
                          <FiX size={14} />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  id="resume-file-input"
                  type="file"
                  accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleInputChange}
                />

                {/* Error message */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-sm text-red-400"
                    >
                      <FiAlertCircle className="flex-shrink-0 mt-0.5" />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Loading steps */}
                <AnimatePresence>
                  {analyzing && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="mt-6 space-y-2"
                    >
                      {LOADING_STEPS.map((step, i) => (
                        <div
                          key={step.id}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-300 ${i < loadingStep
                              ? 'bg-emerald-500/10 border-emerald-500/20 opacity-70'
                              : i === loadingStep
                                ? 'bg-blueAccent/10 border-blueAccent/30'
                                : 'bg-white/3 border-white/5 opacity-30'
                            }`}
                        >
                          {i < loadingStep ? (
                            <FiCheckCircle className="text-emerald-400 flex-shrink-0" />
                          ) : i === loadingStep ? (
                            <svg className="animate-spin h-4 w-4 text-blueAccent-light flex-shrink-0" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                              <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                            </svg>
                          ) : (
                            <div className="w-4 h-4 rounded-full border border-white/20 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${i === loadingStep ? 'text-white font-medium' : 'text-slate-500'}`}>
                            {step.text}
                          </span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 mt-6">
                  <button
                    id="choose-resume-btn"
                    type="button"
                    disabled={analyzing}
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm font-medium text-slate-300 hover:text-white transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FiUpload size={14} />
                    {selectedFile ? 'Change File' : 'Choose Resume'}
                  </button>
                  <button
                    id="analyze-resume-btn"
                    type="button"
                    disabled={!selectedFile || analyzing}
                    onClick={handleAnalyze}
                    className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white shadow-glow-mixed hover:shadow-glow-violet transition-all duration-300 hover:scale-[1.01] disabled:opacity-40 disabled:cursor-not-allowed disabled:scale-100"
                  >
                    {analyzing ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                        </svg>
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <HiSparkles className="text-base" />
                        Analyze Resume
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ANALYSIS RESULTS ── */}
          <AnimatePresence>
            {displayAnalysis && (
              <motion.div
                key="results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >

                {/* Results header */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div>
                    <h3 className="text-xl font-bold font-space text-white">
                      {isViewingHistory ? 'Historical Analysis' : 'Resume Analysis Results'}
                    </h3>
                    {(displayAnalysis.file || viewingRecord) && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        {displayAnalysis.file?.originalName || viewingRecord?.originalFileName}
                        {isViewingHistory && viewingRecord?.createdAt && (
                          <> &bull; Analyzed {formatDate(viewingRecord.createdAt)}</>
                        )}
                      </p>
                    )}
                  </div>
                  <button
                    id="analyze-another-btn"
                    onClick={handleAnalyzeAnother}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-sm text-slate-300 hover:text-white transition-all duration-200"
                  >
                    <FiRefreshCw size={13} />
                    Analyze Another Resume
                  </button>
                </motion.div>

                {/* ── SCORE OVERVIEW ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="grid grid-cols-1 lg:grid-cols-3 gap-6"
                >
                  {/* Big circular score */}
                  <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl p-6 flex flex-col items-center justify-center hover:border-white/15 transition-all duration-300">
                    <CircularScore score={overallScore} />
                    <p className="text-sm font-semibold text-slate-300 mt-3">Resume Score</p>
                    <p className={`text-sm font-bold mt-1 ${scoreLabelColor}`}>{scoreLabel}</p>
                  </div>

                  {/* Score bars */}
                  <div className="lg:col-span-2 bg-[#0a0f1e] border border-white/8 rounded-2xl p-6 hover:border-white/15 transition-all duration-300">
                    <h4 className="text-sm font-bold font-space text-white mb-5">Score Breakdown</h4>
                    <div className="space-y-4">
                      <ScoreBar label="Content" score={Math.round(displayAnalysis.contentScore ?? 0)} maxScore={30} delay={0.1} />
                      <ScoreBar label="ATS" score={Math.round(displayAnalysis.atsScore ?? 0)} maxScore={25} delay={0.2} />
                      <ScoreBar label="Format" score={Math.round(displayAnalysis.formatScore ?? 0)} maxScore={25} delay={0.3} />
                      <ScoreBar label="Grammar" score={Math.round(displayAnalysis.grammarScore ?? 0)} maxScore={10} delay={0.4} />
                      <ScoreBar label="Completeness" score={Math.round(displayAnalysis.completenessScore ?? 0)} maxScore={10} delay={0.5} />
                    </div>
                  </div>
                </motion.div>

                {/* ── SECTION ANALYSIS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                >
                  <h3 className="text-base font-bold font-space text-white mb-4 flex items-center gap-2">
                    <FiAlignLeft className="text-blueAccent-light" />
                    Section Analysis
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {sections.map(({ key, title }, i) => {
                      const sec = sectionAnalysis[key] || {};
                      return (
                        <SectionCard
                          key={key}
                          title={title}
                          score={sec.score ?? 0}
                          feedback={sec.feedback || ''}
                          delay={0.05 * i}
                        />
                      );
                    })}
                  </div>
                </motion.div>

                {/* ── STRENGTHS ── */}
                {(displayAnalysis.strengths?.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <h3 className="text-base font-bold font-space text-white mb-4 flex items-center gap-2">
                      <FiThumbsUp className="text-emerald-400" />
                      Resume Strengths
                    </h3>
                    <div className="space-y-2">
                      {displayAnalysis.strengths.map((s, i) => (
                        <ListItem key={i} text={s} variant="success" />
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* ── CONTENT ISSUES ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                >
                  <h3 className="text-base font-bold font-space text-white mb-4 flex items-center gap-2">
                    <FiAlertCircle className="text-amber-400" />
                    Content Issues
                  </h3>
                  {displayAnalysis.contentIssues?.length > 0 ? (
                    <div className="space-y-2">
                      {displayAnalysis.contentIssues.map((s, i) => (
                        <ListItem key={i} text={s} variant="warning" />
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                      <FiCheckCircle />
                      No major content issues detected.
                    </div>
                  )}
                </motion.div>

                {/* ── FORMAT ISSUES ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28 }}
                >
                  <h3 className="text-base font-bold font-space text-white mb-4 flex items-center gap-2">
                    <FiBarChart2 className="text-blueAccent-light" />
                    Formatting Issues
                  </h3>

                  {/* PDF format details */}
                  {fa && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                      {[
                        { label: 'Pages', value: fa.pageCount ?? '—' },
                        { label: 'Text Items', value: fa.totalTextItems ?? '—' },
                        { label: 'Email', value: contact.emailDetected ? '✓ Detected' : '✗ Missing', highlight: contact.emailDetected },
                        { label: 'LinkedIn', value: contact.linkedinDetected ? '✓ Detected' : '✗ Missing', highlight: contact.linkedinDetected },
                        { label: 'GitHub', value: contact.githubDetected ? '✓ Detected' : '✗ Missing', highlight: contact.githubDetected },
                        {
                          label: 'Font Consistency', value: (() => {
                            const sizes = fa.fontAnalysis?.uniqueFontSizes;
                            if (!sizes) return '—';
                            return Array.isArray(sizes) && sizes.length <= 4 ? 'Good' : 'Varied';
                          })()
                        },
                        {
                          label: 'Text Density', value: fa.pageAnalysis?.averageTextDensity != null
                            ? fa.pageAnalysis.averageTextDensity > 0.6 ? 'High' : fa.pageAnalysis.averageTextDensity > 0.3 ? 'Medium' : 'Low'
                            : '—'
                        },
                        { label: 'Special Chars', value: fa.atsChecks?.specialCharCount ?? '—' },
                      ].map(({ label, value, highlight }) => (
                        <div key={label} className="bg-[#0a0f1e] border border-white/8 rounded-xl p-3">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">{label}</p>
                          <p className={`text-sm font-semibold ${highlight === false ? 'text-red-400' : highlight ? 'text-emerald-400' : 'text-white'}`}>
                            {String(value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  {displayAnalysis.formatIssues?.length > 0 ? (
                    <div className="space-y-2">
                      {displayAnalysis.formatIssues.map((s, i) => (
                        <ListItem key={i} text={s} variant="warning" />
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                      <FiCheckCircle />
                      No major formatting issues detected.
                    </div>
                  )}
                </motion.div>

                {/* ── ATS ANALYSIS ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.31 }}
                  className="bg-gradient-to-br from-blueAccent/10 to-violetAccent/5 border border-blueAccent/20 rounded-2xl p-6"
                >
                  <h3 className="text-base font-bold font-space text-white mb-5 flex items-center gap-2">
                    <FiShield className="text-blueAccent-light" />
                    ATS Compatibility
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* ATS score */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">ATS Score</p>
                      <div className="flex items-end gap-2 mb-3">
                        <span className="text-4xl font-bold font-space" style={{ color: getScoreColor(Math.round((displayAnalysis.atsScore / 25) * 100)) }}>
                          {Math.round(displayAnalysis.atsScore ?? 0)}
                        </span>
                        <span className="text-slate-500 text-sm mb-1">/ 25</span>
                      </div>
                      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${((displayAnalysis.atsScore ?? 0) / 25) * 100}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: getScoreColor(Math.round((displayAnalysis.atsScore / 25) * 100)) }}
                        />
                      </div>
                    </div>

                    {/* Contact info */}
                    <div>
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Contact Detection</p>
                      <div className="space-y-2">
                        {[
                          { label: 'Email', detected: contact.emailDetected },
                          { label: 'LinkedIn', detected: contact.linkedinDetected },
                          { label: 'GitHub', detected: contact.githubDetected },
                        ].map(({ label, detected }) => (
                          <div key={label} className="flex items-center gap-2 text-sm">
                            {detected
                              ? <FiCheckCircle className="text-emerald-400 flex-shrink-0" />
                              : <FiXCircle className="text-red-400 flex-shrink-0" />
                            }
                            <span className={detected ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
                            <span className={`ml-auto text-xs font-medium ${detected ? 'text-emerald-400' : 'text-red-400'}`}>
                              {detected ? 'Detected' : 'Missing'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* ATS Issues */}
                  {displayAnalysis.atsIssues?.length > 0 && (
                    <div className="mt-5 space-y-2">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">ATS Issues</p>
                      {displayAnalysis.atsIssues.map((s, i) => (
                        <ListItem key={i} text={s} variant="error" />
                      ))}
                    </div>
                  )}
                </motion.div>

                {/* ── GRAMMAR ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.34 }}
                >
                  <h3 className="text-base font-bold font-space text-white mb-4 flex items-center gap-2">
                    <FiActivity className="text-violet-400" />
                    Grammar &amp; Wording
                  </h3>
                  {displayAnalysis.grammarIssues?.length > 0 ? (
                    <div className="space-y-2">
                      {displayAnalysis.grammarIssues.map((s, i) => (
                        <ListItem key={i} text={s} variant="warning" />
                      ))}
                    </div>
                  ) : (
                    <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-400 flex items-center gap-2">
                      <FiCheckCircle />
                      No major grammar issues detected.
                    </div>
                  )}
                </motion.div>

                {/* ── AI SUGGESTIONS ── */}
                {(displayAnalysis.suggestions?.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.37 }}
                    className="bg-gradient-to-br from-violetAccent/10 to-blueAccent/5 border border-violetAccent/25 rounded-2xl p-6"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violetAccent/30 to-blueAccent/20 border border-violetAccent/20 flex items-center justify-center flex-shrink-0">
                        <HiSparkles className="text-violetAccent-light text-lg" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-bold font-space text-white mb-1">AI Recommendations</h3>
                        <p className="text-xs text-slate-400 mb-4">
                          Actionable suggestions to improve your resume and increase your chances of success.
                        </p>
                        <div className="space-y-2">
                          {displayAnalysis.suggestions.map((s, i) => (
                            <div key={i} className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8">
                              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-violetAccent/30 text-violetAccent-light text-xs flex items-center justify-center font-bold mt-0.5">
                                {i + 1}
                              </span>
                              <p className="text-sm text-slate-300 leading-relaxed">{s}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* ── ANALYSIS COMPLETE ── */}
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0a0f1e] border border-white/8 rounded-2xl p-6"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center">
                      <FiCheckCircle className="text-emerald-400 text-lg" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">Analysis Complete</p>
                      <p className="text-xs text-slate-500">
                        {isViewingHistory ? 'Viewing historical record' : 'Analysis has been saved to your history'}
                      </p>
                    </div>
                  </div>
                  <button
                    id="analyze-another-footer-btn"
                    onClick={handleAnalyzeAnother}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-blueAccent to-violetAccent text-white hover:shadow-glow-mixed transition-all duration-300 hover:scale-[1.01]"
                  >
                    <FiRefreshCw size={14} />
                    Analyze Another Resume
                  </button>
                </motion.div>

              </motion.div>
            )}
          </AnimatePresence>

          {/* ── RESUME HISTORY ── */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold font-space text-white flex items-center gap-2">
                <FiClock className="text-slate-400" />
                Resume History
              </h3>
              <button
                id="refresh-history-btn"
                onClick={fetchHistory}
                className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                <FiRefreshCw size={12} className={historyLoading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="bg-[#0a0f1e] border border-white/8 rounded-2xl overflow-hidden">
              {historyLoading ? (
                <div className="py-12 flex items-center justify-center">
                  <svg className="animate-spin h-6 w-6 text-blueAccent-light" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeOpacity="0.3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                </div>
              ) : history.length === 0 ? (
                <div className="py-16 flex flex-col items-center justify-center text-slate-600">
                  <FiFileText className="text-3xl mb-3 opacity-30" />
                  <p className="text-sm">No resume analyses yet.</p>
                  <p className="text-xs mt-1 opacity-70">Upload a resume above to get started.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-white/5 text-xs text-slate-500 uppercase tracking-wider">
                        <th className="text-left px-5 py-3">Resume</th>
                        <th className="text-left px-4 py-3 hidden md:table-cell">Date</th>
                        <th className="text-center px-4 py-3">Score</th>
                        <th className="text-center px-4 py-3 hidden sm:table-cell">ATS</th>
                        <th className="text-right px-5 py-3">View</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.map((rec, i) => (
                        <motion.tr
                          key={rec.id}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.04 }}
                          className="border-b border-white/4 hover:bg-white/3 transition-colors group"
                        >
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-8 h-8 rounded-lg bg-blueAccent/15 flex items-center justify-center flex-shrink-0">
                                <FiFileText className="text-blueAccent-light text-sm" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-slate-200 font-medium truncate max-w-[140px] md:max-w-[220px]">
                                  {rec.originalFileName}
                                </p>
                                <p className="text-[10px] text-slate-600 mt-0.5">{formatBytes(rec.fileSize)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap hidden md:table-cell">
                            {formatDate(rec.createdAt)}
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span
                              className="inline-block px-2.5 py-1 rounded-lg text-xs font-bold font-space"
                              style={{
                                background: `${getScoreColor(rec.overallScore)}20`,
                                color: getScoreColor(rec.overallScore),
                              }}
                            >
                              {rec.overallScore}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center hidden sm:table-cell">
                            <span className="text-sm text-slate-400 font-medium">{Math.round(rec.atsScore ?? 0)}<span className="text-slate-600">/25</span></span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              id={`view-record-${rec.id}`}
                              onClick={() => handleViewRecord(rec.id)}
                              disabled={recordLoading}
                              className="flex items-center gap-1.5 text-xs text-blueAccent-light hover:text-white transition-colors ml-auto disabled:opacity-40"
                            >
                              <FiEye size={13} />
                              View
                            </button>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>

        </div>
      </main>
    </div>
  );
}

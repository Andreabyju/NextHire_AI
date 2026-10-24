import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiAward,
  FiClock,
  FiCheckCircle,
  FiAlertTriangle,
  FiActivity,
  FiRotateCcw,
  FiList,
  FiUserCheck,
  FiChevronDown,
  FiChevronUp,
  FiShield,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { fetchWithAuth } from "../../services/api";

export default function InterviewResultsPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedQ, setExpandedQ] = useState({});

  useEffect(() => {
    async function loadInterview() {
      try {
        setLoading(true);
        const data = await fetchWithAuth(`/interview/${id}`);
        if (data.success && data.interview) {
          setInterview(data.interview);
          // Expand first question by default
          setExpandedQ({ 0: true });
        } else {
          throw new Error("Unable to locate interview record.");
        }
      } catch (err) {
        console.error("Failed to fetch interview report:", err);
        setError(err.message || "Failed to load interview report.");
      } finally {
        setLoading(false);
      }
    }

    if (id) loadInterview();
  }, [id]);

  const toggleExpand = (idx) => {
    setExpandedQ((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const formatDuration = (secs) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 rounded-xl bg-violetAccent/20 border border-violetAccent/40 flex items-center justify-center animate-pulse mb-4">
          <HiSparkles className="text-violetAccent-light text-2xl" />
        </div>
        <p className="text-sm font-medium text-slate-300">
          Generating Comprehensive Performance Report...
        </p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex flex-col items-center justify-center p-6 text-center">
        <FiAlertTriangle className="text-4xl text-amber-400 mb-3" />
        <h2 className="text-lg font-bold text-white">Interview Report Unavailable</h2>
        <p className="text-xs text-slate-400 mt-1 max-w-md">{error}</p>
        <button
          onClick={() => navigate("/dashboard")}
          className="mt-6 px-5 py-2.5 rounded-xl bg-blueAccent text-white text-xs font-semibold hover:bg-blueAccent-light transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const score = interview.overallScore || 0;
  let verdict = "Needs Practice";
  let verdictColor = "text-amber-400";
  if (score >= 80) {
    verdict = "Outstanding / Industry Ready";
    verdictColor = "text-emerald-400";
  } else if (score >= 65) {
    verdict = "Competent / Solid Foundations";
    verdictColor = "text-blueAccent-light";
  }

  return (
    <div className="min-h-screen bg-darkBg text-white py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="text-sm" /> Dashboard
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/interview/history")}
              className="px-3.5 py-1.5 rounded-xl bg-secBg border border-white/10 text-xs font-medium text-slate-300 hover:text-white transition-colors flex items-center gap-1.5"
            >
              <FiList /> All Past Interviews
            </button>
            <button
              onClick={() => navigate("/interview/setup")}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-blueAccent to-violetAccent text-white text-xs font-semibold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-1.5"
            >
              <FiRotateCcw /> Retake / Practice Again
            </button>
          </div>
        </div>

        {/* Header Summary Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-cardBg border border-white/8 rounded-2xl p-6 sm:p-8"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-white/5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-violetAccent/10 text-violetAccent-light border border-violetAccent/20 mb-2">
                <HiSparkles /> Final Interview Evaluation Report
              </span>
              <h1 className="text-2xl sm:text-3xl font-bold font-space text-white">
                {interview.jobRole} Mock Interview
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                Completed on {new Date(interview.createdAt).toLocaleDateString()} at{" "}
                {new Date(interview.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Duration: {formatDuration(interview.durationSeconds)}
              </p>
            </div>

            {/* Overall Score Badge */}
            <div className="flex items-center gap-4 bg-secBg/60 border border-white/5 rounded-2xl p-4 self-start md:self-auto">
              <div className="text-center">
                <span className="text-[11px] text-slate-400 uppercase tracking-wider block">
                  Overall Score
                </span>
                <span className="text-3xl sm:text-4xl font-bold font-space text-white">
                  {score}
                  <span className="text-base text-slate-500 font-normal">/100</span>
                </span>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div>
                <span className={`text-xs font-bold block ${verdictColor}`}>{verdict}</span>
                <span className="text-[11px] text-slate-500">
                  {interview.questions?.length || 0} Questions Evaluated
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <div className="bg-secBg/40 border border-white/5 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block">Category</span>
              <span className="text-xs font-semibold text-white mt-1 block">
                {interview.category}
              </span>
            </div>
            <div className="bg-secBg/40 border border-white/5 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block">Difficulty</span>
              <span className="text-xs font-semibold text-white mt-1 block">
                {interview.difficulty}
              </span>
            </div>
            <div className="bg-secBg/40 border border-white/5 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block">Posture Stability</span>
              <span className="text-xs font-semibold text-emerald-400 mt-1 block">
                {interview.postureSummary?.stabilityRating || "Good"}
              </span>
            </div>
            <div className="bg-secBg/40 border border-white/5 rounded-xl p-3.5">
              <span className="text-[11px] text-slate-400 block">Average Posture Score</span>
              <span className="text-xs font-semibold text-white mt-1 block">
                {interview.averagePostureScore ? `${interview.averagePostureScore}%` : "N/A"}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Real-time Posture Evaluation Summary Card */}
        <div className="bg-cardBg border border-white/8 rounded-2xl p-6 sm:p-7">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <FiUserCheck className="text-blueAccent-light text-lg" />
              <h2 className="text-base font-bold font-space text-white">
                Webcam Posture Coach Summary
              </h2>
            </div>
            {interview.averagePostureScore && (
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
                {interview.averagePostureScore}% Alignment Rating
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-secBg/60 border border-white/5 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block">Upright Posture Time</span>
              <span className="text-xl font-bold font-space text-white mt-1 block">
                {interview.postureSummary?.goodPosturePercentage ?? 100}%
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Maintained upright posture in camera view
              </span>
            </div>

            <div className="bg-secBg/60 border border-white/5 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block">Lateral Leaning Cues</span>
              <span className="text-xl font-bold font-space text-white mt-1 block">
                {interview.postureSummary?.leaningIssuesCount || 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Times shoulders tilted off balance
              </span>
            </div>

            <div className="bg-secBg/60 border border-white/5 rounded-xl p-4">
              <span className="text-[11px] text-slate-400 block">Head Position Cues</span>
              <span className="text-xl font-bold font-space text-white mt-1 block">
                {interview.postureSummary?.headTiltIssuesCount || 0}
              </span>
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Moments of head tilt or slouching
              </span>
            </div>
          </div>

          {/* Observations and Feedback */}
          <div className="bg-secBg/40 border border-white/5 rounded-xl p-4">
            <h4 className="text-xs font-semibold text-slate-300 mb-2">Posture Coach Notes:</h4>
            <ul className="space-y-1.5 text-xs text-slate-400 list-disc list-inside">
              {(interview.postureSummary?.feedback || []).map((tip, i) => (
                <li key={i}>{tip}</li>
              ))}
            </ul>
          </div>

          <p className="text-[11px] text-slate-500 mt-3 flex items-center gap-1.5">
            <FiShield className="text-emerald-400" />
            <span>
              Posture analysis was executed locally in the browser via MediaPipe Pose Landmarker. No camera video was stored or transferred.
            </span>
          </p>
        </div>

        {/* Detailed Question & Answer Breakdown */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold font-space text-white flex items-center gap-2">
              <FiAward className="text-violetAccent-light" /> Question-by-Question Evaluation
            </h2>
            <span className="text-xs text-slate-400">
              Click any question to view submitted answer & model response
            </span>
          </div>

          <div className="space-y-3">
            {(interview.questions || []).map((q, idx) => {
              const isOpen = expandedQ[idx];
              const qScore = q.evaluation?.score ?? 0;

              return (
                <div
                  key={idx}
                  className="bg-cardBg border border-white/8 rounded-2xl overflow-hidden transition-all"
                >
                  {/* Collapsible Header */}
                  <button
                    onClick={() => toggleExpand(idx)}
                    className="w-full p-5 text-left flex items-start justify-between gap-4 hover:bg-secBg/40 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-violetAccent/20 text-violetAccent-light">
                          Q{idx + 1} • {q.category || "Technical"}
                        </span>
                        {q.audioUsed && (
                          <span className="text-[10px] text-slate-500">
                            (Answered with voice assistance)
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-semibold text-white leading-relaxed">
                        {q.questionText}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold ${
                          qScore >= 80
                            ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/25"
                            : qScore >= 60
                            ? "bg-amber-500/15 text-amber-400 border border-amber-500/25"
                            : "bg-red-500/15 text-red-400 border border-red-500/25"
                        }`}
                      >
                        {qScore}/100
                      </span>
                      {isOpen ? (
                        <FiChevronUp className="text-slate-400 text-lg" />
                      ) : (
                        <FiChevronDown className="text-slate-400 text-lg" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Body */}
                  {isOpen && (
                    <div className="px-5 pb-5 pt-2 border-t border-white/5 space-y-4">
                      {/* Candidate Answer */}
                      <div>
                        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                          Your Submitted Answer:
                        </h4>
                        <div className="p-3.5 rounded-xl bg-secBg/80 border border-white/5 text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
                          {q.candidateAnswer || (
                            <span className="text-slate-500 italic">No answer submitted.</span>
                          )}
                        </div>
                      </div>

                      {/* AI Evaluation Strengths & Improvements */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/15">
                          <p className="text-xs font-bold text-emerald-400 mb-1.5 flex items-center gap-1.5">
                            <FiCheckCircle /> What Went Well
                          </p>
                          <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                            {(q.evaluation?.strengths || []).map((s, i) => (
                              <li key={i}>{s}</li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/15">
                          <p className="text-xs font-bold text-amber-400 mb-1.5 flex items-center gap-1.5">
                            <FiAlertTriangle /> Recommended Refinements
                          </p>
                          <ul className="space-y-1 text-xs text-slate-300 list-disc list-inside">
                            {(q.evaluation?.weaknesses || []).map((w, i) => (
                              <li key={i}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Model Strong Answer */}
                      {q.evaluation?.modelAnswer && (
                        <div className="p-3.5 rounded-xl bg-violetAccent/5 border border-violetAccent/15">
                          <p className="text-xs font-bold text-violetAccent-light mb-1">
                            Benchmark Strong Answer:
                          </p>
                          <p className="text-xs text-slate-300 leading-relaxed italic">
                            "{q.evaluation.modelAnswer}"
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom CTA Actions */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/5">
          <button
            onClick={() => navigate("/dashboard")}
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-secBg border border-white/10 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Back to Dashboard
          </button>

          <button
            onClick={() => navigate("/interview/setup")}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-gradient-to-r from-blueAccent to-violetAccent text-white font-semibold text-xs shadow-glow-mixed hover:opacity-95 transition-all flex items-center justify-center gap-2"
          >
            <FiRotateCcw /> Start Another Mock Interview
          </button>
        </div>
      </div>
    </div>
  );
}

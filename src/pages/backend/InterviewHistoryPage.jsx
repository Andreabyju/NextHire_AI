import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiAward,
  FiClock,
  FiCalendar,
  FiChevronRight,
  FiRotateCcw,
  FiFileText,
  FiUserCheck,
  FiTrendingUp,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { fetchWithAuth } from "../../services/api";

export default function InterviewHistoryPage() {
  const navigate = useNavigate();
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchHistory() {
      try {
        setLoading(true);
        const data = await fetchWithAuth("/interview/history");
        if (data.success) {
          setInterviews(data.interviews || []);
        } else {
          throw new Error("Failed to load interview history");
        }
      } catch (err) {
        console.error("History fetch error:", err);
        setError(err.message || "Could not retrieve your past interviews.");
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  const formatDuration = (secs) => {
    if (!secs) return "—";
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="min-h-screen bg-darkBg text-white py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="text-sm" /> Dashboard
          </button>

          <button
            onClick={() => navigate("/interview/setup")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blueAccent to-violetAccent text-white text-xs font-semibold shadow-glow-blue hover:opacity-95 transition-all flex items-center gap-1.5"
          >
            <HiSparkles /> Start New Mock Interview
          </button>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold font-space text-white">
            Mock Interview History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review past scores, question evaluations, and posture feedback to monitor your progress.
          </p>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">
            <div className="w-8 h-8 rounded-full border-2 border-violetAccent border-t-transparent animate-spin mx-auto mb-3" />
            Loading your interview records...
          </div>
        ) : error ? (
          <div className="p-8 rounded-2xl bg-cardBg border border-red-500/20 text-center text-xs text-red-400">
            {error}
          </div>
        ) : interviews.length === 0 ? (
          <div className="p-12 rounded-2xl bg-cardBg border border-white/8 text-center">
            <FiFileText className="text-4xl text-slate-500 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-white">No Mock Interviews Completed Yet</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Step into the AI Virtual Interview Room to practice with role-specific questions and real-time posture coaching.
            </p>
            <button
              onClick={() => navigate("/interview/setup")}
              className="mt-5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-blueAccent to-violetAccent text-white text-xs font-semibold shadow-glow-blue"
            >
              Start Your First Mock Interview
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {interviews.map((item) => (
              <motion.div
                key={item._id}
                whileHover={{ scale: 1.005 }}
                className="bg-cardBg border border-white/8 hover:border-violetAccent/30 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                {/* Left Info */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-white font-space">
                      {item.jobRole}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-violetAccent/15 text-violetAccent-light border border-violetAccent/20">
                      {item.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-secBg text-slate-300 border border-white/5">
                      {item.difficulty}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <FiCalendar /> {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <FiClock /> {formatDuration(item.durationSeconds)}
                    </span>
                    <span>{item.questionsCount} questions</span>
                  </div>
                </div>

                {/* Right Scores & CTA */}
                <div className="flex items-center gap-4 self-end sm:self-auto">
                  {/* Posture Score */}
                  {item.averagePostureScore && (
                    <div className="text-right hidden sm:block">
                      <span className="text-[10px] text-slate-500 block">Posture</span>
                      <span className="text-xs font-semibold text-emerald-400">
                        {item.averagePostureScore}%
                      </span>
                    </div>
                  )}

                  {/* Interview Score */}
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 block">Score</span>
                    <span
                      className={`text-base font-bold font-space ${
                        item.overallScore >= 80
                          ? "text-emerald-400"
                          : item.overallScore >= 60
                          ? "text-blueAccent-light"
                          : "text-amber-400"
                      }`}
                    >
                      {item.overallScore}%
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/interview/results/${item._id}`)}
                    className="px-4 py-2 rounded-xl bg-secBg hover:bg-secBg/80 border border-white/10 hover:border-white/25 text-white text-xs font-semibold transition-all flex items-center gap-1 group"
                  >
                    View Report
                    <FiChevronRight className="transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

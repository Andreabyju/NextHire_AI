import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiArrowLeft,
  FiVideo,
  FiMic,
  FiAward,
  FiLayers,
  FiSliders,
  FiCheckCircle,
  FiAlertCircle,
  FiShield,
  FiPlay,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { useAuth } from "../../context/AuthContext";

import { fetchWithAuth } from "../../services/api";

const PRESET_ROLES = [
  "Software Developer",
  "Python Developer",
  "Web Developer",
  "Full Stack Developer",
  "Frontend Developer",
  "Backend Developer",
  "Data Analyst",
];

const CATEGORIES = [
  { id: "Mixed", label: "Mixed (Technical + HR)", desc: "Balanced real-world interview simulation" },
  { id: "Technical", label: "Technical Only", desc: "Core concepts, architecture, and coding reasoning" },
  { id: "HR", label: "HR & Behavioral Only", desc: "STAR method, situational, and culture fit questions" },
];

const DIFFICULTIES = [
  { id: "Beginner", label: "Beginner", desc: "Core fundamentals & basic problem solving" },
  { id: "Intermediate", label: "Intermediate", desc: "Practical scenarios, architecture, & trade-offs" },
  { id: "Advanced", label: "Advanced", desc: "High scalability, complex system design, & leadership" },
];

export default function InterviewSetupPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [jobRole, setJobRole] = useState("Software Developer");
  const [customRole, setCustomRole] = useState("");
  const [category, setCategory] = useState("Mixed");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [questionsCount, setQuestionsCount] = useState(5);

  // Resume Context
  const [resumeData, setResumeData] = useState(null);
  const [useResumeContext, setUseResumeContext] = useState(false);

  // Device permissions preview status
  const [cameraPermission, setCameraPermission] = useState("prompt"); // "prompt" | "granted" | "denied"
  const [micPermission, setMicPermission] = useState("prompt");
  const [checkingDevices, setCheckingDevices] = useState(false);

  // Test media permissions
  const checkPermissions = async () => {
    setCheckingDevices(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      setCameraPermission("granted");
      setMicPermission("granted");
      stream.getTracks().forEach((t) => t.stop());
    } catch (err) {
      console.warn("Device check warning:", err.message);
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setCameraPermission("denied");
        setMicPermission("denied");
      } else {
        setCameraPermission("granted");
        setMicPermission("prompt");
      }
    } finally {
      setCheckingDevices(false);
    }
  };

  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      checkPermissions();
    }

    // Check if user has an uploaded resume
    async function loadResumeStatus() {
      try {
        const res = await fetchWithAuth("/interview/resume-status");
        if (res.success && res.hasResume) {
          setResumeData(res.resume);
          setUseResumeContext(true); // Default to on if resume exists
        }
      } catch (err) {
        console.warn("Could not check resume status:", err);
      }
    }
    loadResumeStatus();
  }, []);

  const handleStart = () => {
    const finalRole = customRole.trim() || jobRole;
    navigate("/interview/room", {
      state: {
        jobRole: finalRole,
        category,
        difficulty,
        questionsCount,
        useResumeContext: Boolean(useResumeContext && resumeData),
      },
    });
  };

  return (
    <div className="min-h-screen bg-darkBg text-white py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={() => navigate("/dashboard")}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <FiArrowLeft className="text-base" /> Back to Dashboard
          </button>

          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violetAccent/10 text-violetAccent-light border border-violetAccent/20">
            <HiSparkles className="text-sm" /> AI Virtual Interview Cockpit
          </span>
        </div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl sm:text-3xl font-bold font-space text-white tracking-tight">
            Configure Your Mock Interview
          </h1>
          <p className="text-sm text-slate-400 mt-2">
            Customize role requirements, evaluation criteria, and posture assistance before stepping into the virtual interview room.
          </p>
        </motion.div>

        {/* Configuration Grid */}
        <div className="space-y-6">
          {/* Optional Resume-Aware Context Card */}
          {resumeData && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-5 rounded-2xl border transition-all ${
                useResumeContext
                  ? "bg-violetAccent/10 border-violetAccent/40"
                  : "bg-cardBg border-white/8 opacity-75"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-violetAccent/20 border border-violetAccent/30 flex items-center justify-center">
                    <HiSparkles className="text-violetAccent-light text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xs sm:text-sm font-semibold text-white">
                      Resume-Aware Interview
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Tailor questions to your uploaded resume: <span className="text-slate-300 font-medium">{resumeData.fileName}</span>
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setUseResumeContext(!useResumeContext)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    useResumeContext
                      ? "bg-violetAccent text-white border-violetAccent"
                      : "bg-secBg text-slate-400 border-white/10"
                  }`}
                >
                  {useResumeContext ? "Enabled" : "Disabled"}
                </button>
              </div>
            </motion.div>
          )}

          {/* 1. Job Role */}
          <div className="bg-cardBg border border-white/8 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <FiAward className="text-blueAccent-light text-lg" />
              <h2 className="text-base font-semibold text-white">Target Job Role</h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
              {PRESET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => {
                    setJobRole(role);
                    setCustomRole("");
                  }}
                  className={`p-3 rounded-xl text-xs font-medium text-left transition-all border ${
                    jobRole === role && !customRole
                      ? "bg-blueAccent/15 border-blueAccent text-white"
                      : "bg-secBg/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>

            <div className="mt-2">
              <input
                type="text"
                placeholder="Or specify another custom role (e.g. Cloud Engineer, DevOps Specialist)..."
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                className="w-full bg-secBg border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blueAccent"
              />
            </div>
          </div>

          {/* 2. Category & Difficulty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div className="bg-cardBg border border-white/8 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiLayers className="text-violetAccent-light text-lg" />
                <h2 className="text-base font-semibold text-white">Interview Category</h2>
              </div>

              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`w-full p-3.5 rounded-xl text-left transition-all border ${
                      category === cat.id
                        ? "bg-violetAccent/15 border-violetAccent text-white"
                        : "bg-secBg/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <p className="text-xs font-semibold text-white">{cat.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{cat.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="bg-cardBg border border-white/8 rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <FiSliders className="text-pink-400 text-lg" />
                <h2 className="text-base font-semibold text-white">Difficulty Level</h2>
              </div>

              <div className="space-y-2.5">
                {DIFFICULTIES.map((diff) => (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => setDifficulty(diff.id)}
                    className={`w-full p-3.5 rounded-xl text-left transition-all border ${
                      difficulty === diff.id
                        ? "bg-pink-500/15 border-pink-500 text-white"
                        : "bg-secBg/60 border-white/5 text-slate-400 hover:border-white/20 hover:text-white"
                    }`}
                  >
                    <p className="text-xs font-semibold text-white">{diff.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{diff.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Number of Questions & Hardware Permissions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Question Count */}
            <div className="bg-cardBg border border-white/8 rounded-2xl p-6">
              <h2 className="text-base font-semibold text-white mb-2">Number of Questions</h2>
              <p className="text-xs text-slate-400 mb-4">
                Recommended: 5 questions for a comprehensive 10-15 minute mock interview.
              </p>

              <div className="flex gap-3">
                {[3, 5, 8].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => setQuestionsCount(count)}
                    className={`flex-1 py-3 rounded-xl text-center text-xs font-semibold transition-all border ${
                      questionsCount === count
                        ? "bg-blueAccent text-white border-blueAccent"
                        : "bg-secBg/80 border-white/5 text-slate-400 hover:text-white"
                    }`}
                  >
                    {count} Questions
                  </button>
                ))}
              </div>
            </div>

            {/* Hardware & Privacy Readiness */}
            <div className="bg-cardBg border border-white/8 rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h2 className="text-base font-semibold text-white mb-2">Equipment & Privacy</h2>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <FiVideo className="text-blueAccent-light" /> Webcam & Posture Coach:
                    </span>
                    <span
                      className={`font-medium ${
                        cameraPermission === "granted" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {cameraPermission === "granted" ? "Ready" : "Will request in room"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-slate-300">
                    <span className="flex items-center gap-2">
                      <FiMic className="text-violetAccent-light" /> Microphone (Speech-to-Text):
                    </span>
                    <span
                      className={`font-medium ${
                        micPermission === "granted" ? "text-emerald-400" : "text-amber-400"
                      }`}
                    >
                      {micPermission === "granted" ? "Ready" : "Will request in room"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-[11px] text-slate-400">
                <FiShield className="text-emerald-400 text-sm flex-shrink-0" />
                <span>Video is analyzed locally in your browser. No video is recorded or stored.</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4 flex items-center justify-end gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="px-6 py-3 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>

            <button
              onClick={handleStart}
              className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-blueAccent to-violetAccent text-white font-semibold text-sm shadow-glow-mixed hover:opacity-95 transition-all flex items-center gap-2 group"
            >
              <FiPlay className="text-base transition-transform group-hover:scale-110" />
              Enter AI Virtual Interview Room
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

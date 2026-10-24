import React, { useState, useEffect, useRef, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiVideo,
  FiVideoOff,
  FiMic,
  FiMicOff,
  FiVolume2,
  FiVolumeX,
  FiSend,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiArrowRight,
  FiXCircle,
  FiShield,
  FiHelpCircle,
  FiUserCheck,
  FiRefreshCw,
  FiPause,
  FiPlay,
  FiRotateCcw,
  FiMessageSquare,
} from "react-icons/fi";
import { HiSparkles } from "react-icons/hi2";
import { fetchWithAuth } from "../../services/api";
import {
  initPoseLandmarker,
  analyzePostureFrame,
  createPostureSession,
} from "../../utils/postureAnalyzer";

export default function InterviewRoomPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // Interview config passed from setup page
  const config = location.state || {
    jobRole: "Software Developer",
    category: "Mixed",
    difficulty: "Intermediate",
    questionsCount: 5,
    useResumeContext: false,
  };

  // State: Questions & Workflow
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loadingQuestions, setLoadingQuestions] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Conversational Voice State:
  // "IDLE" | "AI_SPEAKING" | "LISTENING" | "PROCESSING" | "PAUSED"
  const [voiceState, setVoiceState] = useState("IDLE");
  const [autoVoiceEnabled, setAutoVoiceEnabled] = useState(true);

  // Conversational History Transcript Log
  const [chatLog, setChatLog] = useState([]);

  // State: Answering
  const [candidateAnswer, setCandidateAnswer] = useState("");
  const [evaluating, setEvaluating] = useState(false);
  const [currentEvaluation, setCurrentEvaluation] = useState(null);
  const [completedAnswers, setCompletedAnswers] = useState([]);
  const [isFinishing, setIsFinishing] = useState(false);

  // State: Timers
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // State: Webcam & Hardware
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraDenied, setCameraDenied] = useState(false);

  // State: Speech Recognition
  const recognitionRef = useRef(null);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);

  // State: Posture Detection
  const landmarkerRef = useRef(null);
  const postureIntervalRef = useRef(null);
  const postureSessionRef = useRef(createPostureSession());
  const [postureFeedback, setPostureFeedback] = useState({
    ready: false,
    score: 85,
    status: "idle",
    feedback: "Camera initializing...",
  });

  // ── 1. Fetch Questions on Mount ──────────────────────────────────────────
  useEffect(() => {
    let isMounted = true;
    async function loadQuestions() {
      setLoadingQuestions(true);
      setLoadError("");
      try {
        const data = await fetchWithAuth("/interview/generate-questions", {
          method: "POST",
          body: JSON.stringify({
            category: config.category,
            jobRole: config.jobRole,
            difficulty: config.difficulty,
            count: config.questionsCount,
            useResumeContext: Boolean(config.useResumeContext),
          }),
        });

        if (isMounted) {
          if (data.questions && data.questions.length > 0) {
            setQuestions(data.questions);
            // Append initial welcome log
            setChatLog([
              {
                sender: "interviewer",
                text: `Welcome to your ${config.difficulty} ${config.jobRole} mock interview! I am your AI interviewer today. Let's begin.`,
                time: "Just now",
              },
            ]);
          } else {
            throw new Error("No interview questions returned.");
          }
        }
      } catch (err) {
        console.error("Question generation failed:", err);
        if (isMounted) {
          setLoadError(
            err.message.includes("401") || err.message.includes("authorized")
              ? "Your session has expired. Please log in again to practice."
              : err.message || "Failed to load questions."
          );
        }
      } finally {
        if (isMounted) setLoadingQuestions(false);
      }
    }

    loadQuestions();
    return () => {
      isMounted = false;
    };
  }, [config]);

  // ── 2. Timer Loop ────────────────────────────────────────────────────────
  useEffect(() => {
    if (voiceState === "PAUSED") return;
    const timer = setInterval(() => {
      setElapsedSeconds((s) => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [voiceState]);

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // ── 3. Initialize Webcam Stream ──────────────────────────────────────────
  const startCamera = async () => {
    try {
      setCameraDenied(false);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (err) {
      console.warn("Camera start error:", err.message);
      setCameraDenied(true);
      setCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  };

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, []);

  // ── 4. Initialize MediaPipe Posture Detection ────────────────────────────
  useEffect(() => {
    let active = true;
    async function setupLandmarker() {
      try {
        const landmarker = await initPoseLandmarker();
        if (active && landmarker) {
          landmarkerRef.current = landmarker;
        }
      } catch (e) {
        console.warn("Landmarker initialization notice:", e);
      }
    }
    setupLandmarker();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!cameraActive) {
      if (postureIntervalRef.current) clearInterval(postureIntervalRef.current);
      return;
    }

    postureIntervalRef.current = setInterval(() => {
      if (videoRef.current && landmarkerRef.current) {
        const analysis = analyzePostureFrame(
          landmarkerRef.current,
          videoRef.current
        );
        setPostureFeedback(analysis);
        if (analysis && analysis.detected) {
          postureSessionRef.current.recordFrame(analysis);
        }
      }
    }, 350);

    return () => {
      if (postureIntervalRef.current) clearInterval(postureIntervalRef.current);
    };
  }, [cameraActive]);

  // ── 5. Speech Recognition Setup (Microphone Capture) ─────────────────────
  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setVoiceState("LISTENING");
    } catch (err) {
      console.warn("Mic start notice:", err.message);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.stop();
    } catch (_) {}
    setIsListening(false);
    if (voiceState === "LISTENING") {
      setVoiceState("IDLE");
    }
  }, [voiceState]);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event) => {
      let transcript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setCandidateAnswer((prev) => {
        const separator = prev.trim() && !prev.endsWith(" ") ? " " : "";
        return prev + separator + transcript;
      });
    };

    recognition.onerror = (event) => {
      console.warn("Speech recognition notice:", event.error);
      setIsListening(false);
      setVoiceState("IDLE");
    };

    recognition.onend = () => {
      setIsListening(false);
      if (voiceState === "LISTENING") {
        setVoiceState("IDLE");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (_) {}
      }
    };
  }, [voiceState]);

  // ── 6. Text-to-Speech Engine (AI Speaks Aloud) ───────────────────────────
  const speakText = useCallback(
    (text, onFinished) => {
      if (!("speechSynthesis" in window)) {
        if (onFinished) onFinished();
        return;
      }

      // Stop speech & stop mic capture to avoid hearing own voice
      window.speechSynthesis.cancel();
      stopListening();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.0;

      // Select natural sounding voice if available
      const voices = window.speechSynthesis.getVoices();
      const naturalVoice = voices.find(
        (v) =>
          (v.name.includes("Google") ||
            v.name.includes("Natural") ||
            v.name.includes("Samantha") ||
            v.name.includes("Daniel")) &&
          v.lang.startsWith("en")
      );
      if (naturalVoice) utterance.voice = naturalVoice;

      setVoiceState("AI_SPEAKING");

      utterance.onend = () => {
        setVoiceState("IDLE");
        if (onFinished) {
          onFinished();
        } else if (autoVoiceEnabled) {
          setTimeout(() => {
            startListening();
          }, 350);
        }
      };

      utterance.onerror = () => {
        setVoiceState("IDLE");
        if (onFinished) onFinished();
      };

      window.speechSynthesis.speak(utterance);
    },
    [autoVoiceEnabled, startListening, stopListening]
  );

  // Auto-speak question when loaded or when index advances
  useEffect(() => {
    if (questions.length > 0 && autoVoiceEnabled && !currentEvaluation && voiceState !== "PAUSED") {
      const q = questions[currentIdx]?.question;
      if (q) {
        const timer = setTimeout(() => {
          speakText(q);
        }, 600);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIdx, questions, autoVoiceEnabled, currentEvaluation, voiceState, speakText]);

  // ── 7. Submit Candidate Answer for Evaluation ────────────────────────────
  const handleSubmitAnswer = async () => {
    const currentQ = questions[currentIdx];
    if (!currentQ) return;

    // Stop mic and speech
    stopListening();
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();

    setEvaluating(true);
    setVoiceState("PROCESSING");

    const answerToEvaluate = candidateAnswer.trim();

    // Append candidate speech to chat log
    if (answerToEvaluate) {
      setChatLog((prev) => [
        ...prev,
        {
          sender: "candidate",
          text: answerToEvaluate,
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }

    try {
      const result = await fetchWithAuth("/interview/evaluate-answer", {
        method: "POST",
        body: JSON.stringify({
          questionId: currentQ.id,
          questionText: currentQ.question,
          candidateAnswer: answerToEvaluate,
          jobRole: config.jobRole,
          difficulty: config.difficulty,
          category: currentQ.category || config.category,
        }),
      });

      const evaluation = result.evaluation || {
        score: 70,
        spokenFeedback: "Thank you for that response. Let's move to our next question.",
        strengths: ["Answer addressed the question"],
        weaknesses: ["Elaborate further on practical examples"],
        suggestions: ["Structure answers using the STAR method"],
        modelAnswer: "Provide a structured explanation with concrete examples.",
      };

      setCurrentEvaluation(evaluation);

      // Save question record
      const updatedRecord = {
        questionId: currentQ.id || currentIdx + 1,
        questionText: currentQ.question,
        category: currentQ.category || "Technical",
        candidateAnswer: answerToEvaluate,
        audioUsed: Boolean(answerToEvaluate),
        evaluation,
      };

      setCompletedAnswers((prev) => {
        const filtered = prev.filter((item) => item.questionId !== currentQ.id);
        return [...filtered, updatedRecord];
      });

      // AI speaks conversational reaction
      if (autoVoiceEnabled && evaluation.spokenFeedback) {
        speakText(evaluation.spokenFeedback);
      }
    } catch (err) {
      console.error("Evaluation error:", err);
      alert("Evaluation request failed. Please try submitting again.");
      setVoiceState("IDLE");
    } finally {
      setEvaluating(false);
    }
  };

  // ── 8. Advance to Next Question or Finalize ───────────────────────────────
  const handleNextQuestion = () => {
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    setCurrentEvaluation(null);
    setCandidateAnswer("");

    if (currentIdx + 1 < questions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      finalizeInterview();
    }
  };

  // ── 9. Finalize and Save to MongoDB ──────────────────────────────────────
  const finalizeInterview = async () => {
    setIsFinishing(true);
    stopCamera();
    stopListening();

    // Closing statement from AI
    if (autoVoiceEnabled && "speechSynthesis" in window) {
      const closing = new SpeechSynthesisUtterance(
        "Thank you for completing this mock interview. You did a great job today. I have compiled your full performance report."
      );
      window.speechSynthesis.speak(closing);
    }

    try {
      const postureSummaryData = postureSessionRef.current.getSummary();
      const totalScore = completedAnswers.reduce(
        (sum, item) => sum + (item.evaluation?.score || 0),
        0
      );
      const overallScore =
        completedAnswers.length > 0
          ? Math.round(totalScore / completedAnswers.length)
          : 0;

      const payload = {
        category: config.category,
        jobRole: config.jobRole,
        difficulty: config.difficulty,
        questionsCount: questions.length,
        questions: completedAnswers,
        overallScore,
        averagePostureScore: postureSummaryData.averagePostureScore,
        postureSummary: postureSummaryData.postureSummary,
        durationSeconds: elapsedSeconds,
      };

      const response = await fetchWithAuth("/interview/save", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (response.success && response.interviewId) {
        navigate(`/interview/results/${response.interviewId}`);
      } else {
        throw new Error("Failed to save interview record.");
      }
    } catch (err) {
      console.error("Finalize error:", err);
      alert("Could not save interview session automatically. Returning to dashboard.");
      navigate("/dashboard");
    } finally {
      setIsFinishing(false);
    }
  };

  // ── Error State ──────────────────────────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex flex-col items-center justify-center p-6 text-center">
        <FiAlertTriangle className="text-4xl text-amber-400 mb-3" />
        <h2 className="text-lg font-bold font-space text-white">Interview Session Error</h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md">{loadError}</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate("/sign-in")}
            className="px-5 py-2.5 rounded-xl bg-blueAccent text-white text-xs font-semibold hover:bg-blueAccent-light"
          >
            Log In Again
          </button>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 rounded-xl bg-secBg border border-white/10 text-slate-300 text-xs font-semibold"
          >
            Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ── Loading Questions State ──────────────────────────────────────────────
  if (loadingQuestions) {
    return (
      <div className="min-h-screen bg-darkBg text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center animate-pulse mb-6 shadow-glow-mixed">
          <HiSparkles className="text-white text-3xl" />
        </div>
        <h2 className="text-xl font-bold font-space text-white">
          Sophia is Preparing Your Virtual Interview...
        </h2>
        <p className="text-xs text-slate-400 mt-2 max-w-md text-center">
          Synthesizing role-specific questions for {config.difficulty} {config.jobRole} and loading local posture detection.
        </p>
      </div>
    );
  }

  const currentQ = questions[currentIdx] || {
    question: "Tell me about yourself and your background.",
    category: config.category,
  };
  const isLastQuestion = currentIdx + 1 === questions.length;

  return (
    <div className="min-h-screen bg-darkBg text-white font-sans flex flex-col">
      {/* ── Top Cockpit Bar ── */}
      <header className="bg-cardBg/90 backdrop-blur-md border-b border-white/8 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <div>
            <h1 className="text-sm font-bold font-space text-white leading-tight">
              {config.jobRole} AI Mock Interview
            </h1>
            <p className="text-[11px] text-slate-400">
              {config.difficulty} • {config.category}
              {config.useResumeContext && " • Resume-Aware"}
            </p>
          </div>
        </div>

        {/* Center: Live Conversational Audio Wave Status */}
        <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-secBg border border-white/10 text-xs shadow-inner">
          {voiceState === "AI_SPEAKING" ? (
            <span className="flex items-center gap-2 text-violetAccent-light font-semibold animate-pulse">
              <span className="flex gap-1 items-end h-3">
                <span className="w-1 bg-violetAccent-light animate-bounce h-2" />
                <span className="w-1 bg-violetAccent-light animate-bounce h-3" />
                <span className="w-1 bg-violetAccent-light animate-bounce h-1.5" />
              </span>
              Sophia (AI) is Speaking...
            </span>
          ) : voiceState === "LISTENING" ? (
            <span className="flex items-center gap-2 text-emerald-400 font-semibold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              Listening to you... Speak naturally
            </span>
          ) : voiceState === "PROCESSING" ? (
            <span className="flex items-center gap-2 text-blueAccent-light font-semibold">
              <FiRefreshCw className="animate-spin" /> Evaluating Answer...
            </span>
          ) : (
            <span className="text-slate-400 flex items-center gap-1.5">
              <FiMic /> Ready for your response
            </span>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3">
          {/* Auto Voice Switch */}
          <button
            onClick={() => {
              if (autoVoiceEnabled) {
                if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                stopListening();
              }
              setAutoVoiceEnabled(!autoVoiceEnabled);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              autoVoiceEnabled
                ? "bg-violetAccent/20 text-violetAccent-light border-violetAccent/30"
                : "bg-secBg text-slate-400 border-white/10"
            }`}
            title="Toggle automatic AI voice & speech"
          >
            {autoVoiceEnabled ? <FiVolume2 /> : <FiVolumeX />}
            <span className="hidden sm:inline">Voice: {autoVoiceEnabled ? "ON" : "OFF"}</span>
          </button>

          {/* Session Timer */}
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-mono bg-secBg px-3 py-1.5 rounded-lg border border-white/5">
            <FiClock className="text-blueAccent-light" />
            <span>{formatTime(elapsedSeconds)}</span>
          </div>

          {/* End Button */}
          <button
            onClick={() => {
              if (
                window.confirm(
                  "Are you sure you want to end this interview? Completed answers will be saved."
                )
              ) {
                finalizeInterview();
              }
            }}
            disabled={isFinishing}
            className="px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-semibold transition-colors flex items-center gap-1"
          >
            <FiXCircle /> End
          </button>
        </div>
      </header>

      {/* ── Main Interview Cockpit ── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* LEFT / CENTER: AI Interviewer Question & Speech (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* AI Interviewer Avatar Card */}
          <div className="bg-cardBg border border-white/8 rounded-2xl p-6 relative overflow-hidden shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3">
                {/* Sophia Avatar */}
                <div className="relative">
                  <div
                    className={`w-12 h-12 rounded-2xl bg-gradient-to-tr from-violetAccent to-blueAccent flex items-center justify-center font-space text-lg font-bold text-white shadow-glow-violet ${
                      voiceState === "AI_SPEAKING" ? "scale-105 transition-transform" : ""
                    }`}
                  >
                    S
                  </div>
                  {voiceState === "AI_SPEAKING" && (
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-violetAccent rounded-full border-2 border-darkBg animate-pulse flex items-center justify-center">
                      <FiVolume2 className="text-[9px] text-white" />
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-bold text-white font-space flex items-center gap-1.5">
                    Sophia <span className="text-[10px] text-slate-500 font-normal">• AI Interviewer</span>
                  </h3>
                  <span className="text-[11px] text-violetAccent-light font-medium">
                    Question {currentIdx + 1} of {questions.length} ({currentQ.category || "General"})
                  </span>
                </div>
              </div>

              {/* Hear Question Again */}
              <button
                onClick={() => speakText(currentQ.question)}
                className="flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg bg-secBg border border-white/10 hover:border-white/25 transition-colors"
                title="Hear question read aloud again"
              >
                <FiRotateCcw className="text-xs" /> Repeat Question
              </button>
            </div>

            {/* Question Text */}
            <h2 className="text-base sm:text-lg font-semibold text-white leading-relaxed">
              "{currentQ.question}"
            </h2>

            {/* Speaking Frequency Wave Bar */}
            {voiceState === "AI_SPEAKING" && (
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-violetAccent-light">
                <span className="flex gap-1 items-end h-4">
                  <span className="w-1 bg-violetAccent-light animate-pulse h-2" />
                  <span className="w-1 bg-violetAccent-light animate-pulse h-4" />
                  <span className="w-1 bg-violetAccent-light animate-pulse h-3" />
                  <span className="w-1 bg-violetAccent-light animate-pulse h-2.5" />
                </span>
                <span>Interviewer is speaking aloud... (Mic muted to prevent echo)</span>
              </div>
            )}
          </div>

          {/* Candidate Voice Input & Text Answer Box */}
          <div className="bg-cardBg border border-white/8 rounded-2xl p-5 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                <span>Your Spoken Response</span>
                {voiceState === "LISTENING" && (
                  <span className="text-[10px] text-emerald-400 font-bold animate-pulse flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                    Microphone Active
                  </span>
                )}
              </label>

              {/* Mic Manual Toggle */}
              {speechSupported ? (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isListening
                      ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse"
                      : "bg-secBg text-slate-300 border-white/10 hover:text-white"
                  }`}
                >
                  {isListening ? (
                    <>
                      <FiMicOff /> Pause Mic
                    </>
                  ) : (
                    <>
                      <FiMic className="text-blueAccent-light" /> Speak Answer
                    </>
                  )}
                </button>
              ) : (
                <span className="text-[11px] text-slate-500">
                  Type response (browser speech recognition unsupported)
                </span>
              )}
            </div>

            <textarea
              rows={6}
              placeholder="Your answer will appear here automatically as you speak into your microphone. You can also edit or type directly..."
              value={candidateAnswer}
              onChange={(e) => setCandidateAnswer(e.target.value)}
              disabled={evaluating || currentEvaluation !== null}
              className="w-full flex-1 bg-secBg border border-white/10 rounded-xl p-4 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-violetAccent transition-colors resize-none leading-relaxed"
            />

            {/* Action Bar */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <span className="text-[11px] text-slate-500">
                Word count: {candidateAnswer.trim() ? candidateAnswer.trim().split(/\s+/).length : 0}
              </span>

              {!currentEvaluation ? (
                <button
                  onClick={handleSubmitAnswer}
                  disabled={evaluating || !candidateAnswer.trim()}
                  className={`px-6 py-2.5 rounded-xl font-semibold text-xs flex items-center gap-2 transition-all ${
                    evaluating || !candidateAnswer.trim()
                      ? "bg-secBg border border-white/5 text-slate-500 cursor-not-allowed"
                      : "bg-gradient-to-r from-blueAccent to-violetAccent text-white shadow-glow-blue hover:opacity-95"
                  }`}
                >
                  {evaluating ? (
                    <>
                      <FiRefreshCw className="animate-spin" /> Evaluating Answer...
                    </>
                  ) : (
                    <>
                      <FiSend /> Finish & Submit Answer
                    </>
                  )}
                </button>
              ) : (
                <button
                  onClick={handleNextQuestion}
                  className="px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-2 shadow-lg transition-all"
                >
                  {isLastQuestion ? "Complete Interview & View Report" : "Proceed to Next Question"}
                  <FiArrowRight />
                </button>
              )}
            </div>
          </div>

          {/* Instant AI Evaluation Feedback Panel */}
          <AnimatePresence>
            {currentEvaluation && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-cardBg border border-violetAccent/30 rounded-2xl p-5 shadow-glow-violet/20"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <HiSparkles className="text-violetAccent-light text-base" />
                    <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                      Sophia's Evaluation & Feedback
                    </h3>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      currentEvaluation.score >= 80
                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                        : currentEvaluation.score >= 60
                        ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                        : "bg-red-500/20 text-red-400 border border-red-500/30"
                    }`}
                  >
                    Score: {currentEvaluation.score}/100
                  </span>
                </div>

                {/* Spoken feedback acknowledgement */}
                {currentEvaluation.spokenFeedback && (
                  <div className="mb-3 p-3 rounded-xl bg-violetAccent/10 border border-violetAccent/20 text-xs text-violetAccent-light italic">
                    "{currentEvaluation.spokenFeedback}"
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs mb-3">
                  <div className="bg-secBg/60 border border-white/5 rounded-xl p-3">
                    <p className="font-semibold text-emerald-400 mb-1.5 flex items-center gap-1">
                      <FiCheckCircle /> Key Strengths
                    </p>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside">
                      {currentEvaluation.strengths?.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-secBg/60 border border-white/5 rounded-xl p-3">
                    <p className="font-semibold text-amber-400 mb-1.5 flex items-center gap-1">
                      <FiAlertTriangle /> Opportunities to Improve
                    </p>
                    <ul className="space-y-1 text-slate-300 list-disc list-inside">
                      {currentEvaluation.weaknesses?.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {currentEvaluation.modelAnswer && (
                  <div className="bg-secBg/80 border border-white/5 rounded-xl p-3 text-xs text-slate-300">
                    <p className="font-semibold text-violetAccent-light mb-1">
                      Benchmark Response Example:
                    </p>
                    <p className="text-slate-400 italic">
                      "{currentEvaluation.modelAnswer}"
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT: Webcam & Real-Time Posture Coach (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          {/* Posture Coach Video Box */}
          <div className="bg-cardBg border border-white/8 rounded-2xl p-4 flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FiVideo className="text-blueAccent-light text-sm" />
                <h3 className="text-xs font-bold text-white font-space uppercase tracking-wider">
                  Real-Time Posture Coach
                </h3>
              </div>

              {/* Status Pill */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                  postureFeedback.status === "good"
                    ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20"
                    : postureFeedback.status === "fair"
                    ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                    : "bg-red-500/15 text-red-400 border-red-500/20"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    postureFeedback.status === "good"
                      ? "bg-emerald-400"
                      : postureFeedback.status === "fair"
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                />
                {cameraActive
                  ? `Posture Score: ${postureFeedback.score}%`
                  : "Camera Offline"}
              </div>
            </div>

            {/* Video Preview */}
            <div className="relative w-full aspect-video bg-secBg rounded-xl overflow-hidden border border-white/10 flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${
                  cameraActive ? "opacity-100" : "opacity-0"
                }`}
              />

              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4">
                  <FiVideoOff className="text-3xl text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400">
                    {cameraDenied
                      ? "Camera permission denied. The interview continues via voice and text."
                      : "Camera is inactive."}
                  </p>
                  <button
                    onClick={startCamera}
                    className="mt-3 px-3 py-1.5 rounded-lg bg-blueAccent text-white text-xs font-semibold"
                  >
                    Enable Camera
                  </button>
                </div>
              )}

              {/* Live Guidance HUD Banner */}
              {cameraActive && (
                <div className="absolute bottom-2 left-2 right-2 bg-darkBg/85 backdrop-blur-md border border-white/10 rounded-lg py-1.5 px-3 flex items-center gap-2 text-[11px] text-white">
                  <FiUserCheck
                    className={`text-sm flex-shrink-0 ${
                      postureFeedback.status === "good"
                        ? "text-emerald-400"
                        : "text-amber-400"
                    }`}
                  />
                  <span className="truncate">{postureFeedback.feedback}</span>
                </div>
              )}
            </div>

            {/* Camera Controls */}
            <div className="flex items-center justify-between mt-3 text-xs">
              <button
                type="button"
                onClick={cameraActive ? stopCamera : startCamera}
                className="px-3 py-1.5 rounded-lg bg-secBg border border-white/10 text-slate-300 hover:text-white transition-all flex items-center gap-1.5 text-xs font-medium"
              >
                {cameraActive ? (
                  <>
                    <FiVideoOff /> Turn Off Camera
                  </>
                ) : (
                  <>
                    <FiVideo /> Turn On Camera
                  </>
                )}
              </button>

              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <FiShield className="text-emerald-400" /> MediaPipe Vision (Local)
              </div>
            </div>
          </div>

          {/* Conversation Transcript Log Drawer */}
          <div className="bg-cardBg border border-white/8 rounded-2xl p-4 flex-1 flex flex-col text-xs">
            <h4 className="font-semibold text-white flex items-center gap-1.5 mb-2.5">
              <FiMessageSquare className="text-violetAccent-light" /> Live Conversation Transcript
            </h4>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {chatLog.map((msg, i) => (
                <div
                  key={i}
                  className={`p-2.5 rounded-xl border text-[11px] leading-relaxed ${
                    msg.sender === "interviewer"
                      ? "bg-violetAccent/10 border-violetAccent/20 text-slate-200"
                      : "bg-secBg border-white/5 text-slate-300 ml-3"
                  }`}
                >
                  <span className="font-bold block text-white mb-0.5">
                    {msg.sender === "interviewer" ? "Sophia (Interviewer)" : "You (Candidate)"}:
                  </span>
                  {msg.text}
                </div>
              ))}
            </div>
          </div>

          {/* Academic & Privacy Notice */}
          <div className="p-3 rounded-xl bg-secBg/60 border border-white/5 text-[11px] text-slate-500 leading-relaxed">
            <strong>Privacy & Ethics Notice:</strong> Posture metrics monitor physical camera presence and ergonomics using in-browser computer vision. No video frames are recorded or transferred.
          </div>
        </div>
      </main>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { FiFileText, FiVideo, FiCode, FiMic, FiUser, FiActivity, FiAward, FiAlertCircle, FiChevronRight } from 'react-icons/fi';
import { HiOutlineLightBulb } from 'react-icons/hi2';

export default function DashboardPreview() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pulseCount, setPulseCount] = useState(0);

  // Simple interval to simulate "real-time" data shifts or highlights
  useEffect(() => {
    const timer = setInterval(() => {
      setPulseCount(prev => (prev + 1) % 100);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-panel-glow rounded-3xl p-6 relative overflow-hidden w-full max-w-4xl mx-auto shadow-2xl border-white/10 group transition-all duration-500 hover:border-violetAccent/30">
      
      {/* Top Ambient Glows */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-blueAccent/25 rounded-full blur-[60px]" />
      <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-violetAccent/25 rounded-full blur-[60px]" />

      {/* Dashboard Header Mockup */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-white/5 pb-5 mb-6 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs uppercase tracking-widest text-textGray font-semibold font-space">Live Session Coach</span>
          </div>
          <h3 className="text-lg font-bold font-space mt-1">Interview Prep Workspace</h3>
        </div>
        
        {/* Mock Tabs */}
        <div className="flex bg-[#050816] p-1 rounded-xl border border-white/5">
          {['overview', 'analytics', 'feed'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider transition-all duration-200 ${
                activeTab === tab 
                  ? 'bg-gradient-to-r from-blueAccent to-violetAccent text-white shadow-md' 
                  : 'text-textGray hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Left Column: Core Scores */}
          <div className="md:col-span-2 space-y-5">
            {/* Grid of Score Cards */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Resume Score Card */}
              <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-blueAccent/30 transition-colors duration-300">
                <div className="flex justify-between items-start mb-2">
                  <span className="p-2 rounded-xl bg-blueAccent/10 text-blueAccent-light">
                    <FiFileText size={18} />
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">+4% vs last week</span>
                </div>
                <div>
                  <span className="text-xs text-textGray font-medium">Resume Match</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-space">88</span>
                    <span className="text-xs text-textGray">/100</span>
                  </div>
                </div>
              </div>

              {/* Interview Score Card */}
              <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-violetAccent/30 transition-colors duration-300">
                <div className="flex justify-between items-start mb-2">
                  <span className="p-2 rounded-xl bg-violetAccent/10 text-violetAccent-light">
                    <FiVideo size={18} />
                  </span>
                  <span className="text-xs font-semibold text-violetAccent-light bg-violetAccent/10 px-2 py-0.5 rounded-full">Top 15%</span>
                </div>
                <div>
                  <span className="text-xs text-textGray font-medium">Mock Interview</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-space">84</span>
                    <span className="text-xs text-textGray">/100</span>
                  </div>
                </div>
              </div>

              {/* Coding Score */}
              <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-cyan-500/30 transition-colors duration-300">
                <div className="flex justify-between items-start mb-2">
                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400">
                    <FiCode size={18} />
                  </span>
                  <span className="text-xs font-semibold text-cyan-400 bg-cyan-400/10 px-2 py-0.5 rounded-full">92% Pass</span>
                </div>
                <div>
                  <span className="text-xs text-textGray font-medium">Coding Score</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-space">795</span>
                    <span className="text-xs text-textGray">pts</span>
                  </div>
                </div>
              </div>

              {/* Communication Score */}
              <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl flex flex-col justify-between hover:border-pink-500/30 transition-colors duration-300">
                <div className="flex justify-between items-start mb-2">
                  <span className="p-2 rounded-xl bg-pink-500/10 text-pink-400">
                    <FiMic size={18} />
                  </span>
                  <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">Optimal Pace</span>
                </div>
                <div>
                  <span className="text-xs text-textGray font-medium">Communication</span>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold font-space">82%</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Weekly Progress Graph */}
            <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <FiActivity className="text-blueAccent-light" />
                  <span className="text-xs font-bold uppercase tracking-wider text-textGray font-space">Performance Trend</span>
                </div>
                <span className="text-xs text-textGray">Week 1 - Week 6</span>
              </div>
              
              {/* SVG Line Graph */}
              <div className="relative h-32 w-full mt-2">
                <svg className="w-full h-full" viewBox="0 0 500 120" preserveAspectRatio="none">
                  {/* Grid Lines */}
                  <line x1="0" y1="20" x2="500" y2="20" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="60" x2="500" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  <line x1="0" y1="100" x2="500" y2="100" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                  
                  {/* Gradient definition under the curve */}
                  <defs>
                    <linearGradient id="chart-glow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Gradient Area */}
                  <path
                    d="M 0 100 Q 80 40 160 70 T 320 20 T 500 15 L 500 120 L 0 120 Z"
                    fill="url(#chart-glow)"
                  />

                  {/* Glowing Line */}
                  <path
                    d="M 0 100 Q 80 40 160 70 T 320 20 T 500 15"
                    fill="none"
                    stroke="url(#line-grad)"
                    strokeWidth="3.5"
                    className="drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                  />

                  {/* Gradient for the line */}
                  <linearGradient id="line-grad" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="50%" stopColor="#8b5cf6" />
                    <stop offset="100%" stopColor="#d946ef" />
                  </linearGradient>

                  {/* Glowing Dots */}
                  <circle cx="160" cy="70" r="5" fill="#8b5cf6" className="animate-pulse" />
                  <circle cx="320" cy="20" r="5" fill="#d946ef" className="animate-pulse" />
                  <circle cx="500" cy="15" r="5" fill="#3b82f6" />
                </svg>
              </div>
            </div>

          </div>

          {/* Right Column: AI Recommendations, Posture, and Live Feed */}
          <div className="space-y-5">
            {/* Posture Score (Camera simulated indicator) */}
            <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl relative overflow-hidden">
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <FiUser className="text-violetAccent-light" />
                  <span className="text-xs font-bold uppercase tracking-wider text-textGray font-space">Posture AI</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-medium">Active</span>
              </div>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-full bg-violetAccent/10 border border-violetAccent/20 flex items-center justify-center">
                  <div className="absolute inset-1 rounded-full border border-dashed border-violetAccent-light/40 animate-[spin_10s_linear_infinite]" />
                  <span className="text-sm font-bold text-violetAccent-light font-space">94%</span>
                </div>
                <div>
                  <h4 className="text-xs font-bold font-space">Excellent Posture</h4>
                  <p className="text-[10px] text-textGray mt-0.5">Head & shoulders correctly aligned. Frame stability: 98%.</p>
                </div>
              </div>
            </div>

            {/* AI Live Evaluation Feed */}
            <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl h-44 flex flex-col justify-between">
              <div className="flex items-center gap-2 mb-2">
                <FiAlertCircle className="text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-textGray font-space">AI Coaching Logs</span>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 text-[11px] font-sans scrollbar-thin scrollbar-thumb-white/10">
                <div className="border-l-2 border-emerald-500 pl-2 py-0.5">
                  <span className="text-textGray">14:02:11</span> - <strong className="text-white">Structured Answer</strong>: Excellent implementation of the STAR method on conflict handling.
                </div>
                <div className="border-l-2 border-violetAccent pl-2 py-0.5">
                  <span className="text-textGray">14:02:40</span> - <strong className="text-white">Pacing Alert</strong>: Speaking speed slightly elevated. Take a deep breath.
                </div>
                <div className="border-l-2 border-blueAccent pl-2 py-0.5">
                  <span className="text-textGray">14:03:05</span> - <strong className="text-white">Eye Contact</strong>: Re-established alignment with camera lenses. Confidence rating up.
                </div>
              </div>

              <div className="border-t border-white/5 pt-2 mt-2 flex items-center justify-between text-[10px] text-textGray">
                <span>Confidence Index: 87.5%</span>
                <span className="text-violetAccent-light font-medium">Processing...</span>
              </div>
            </div>

            {/* Learning Recommendation Card */}
            <div className="bg-[#050816]/60 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 mb-3">
                <HiOutlineLightBulb className="text-amber-300 text-lg" />
                <span className="text-xs font-bold uppercase tracking-wider text-textGray font-space">Next Focus Areas</span>
              </div>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:border-violetAccent/20 cursor-pointer transition-colors">
                  <span className="font-medium">Binary Search Optimizations</span>
                  <FiChevronRight className="text-textGray" />
                </li>
                <li className="flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:border-blueAccent/20 cursor-pointer transition-colors">
                  <span className="font-medium">Mock Pitch: &quot;Tell me about yourself&quot;</span>
                  <FiChevronRight className="text-textGray" />
                </li>
              </ul>
            </div>

          </div>

        </div>
      )}

      {activeTab === 'analytics' && (
        <div className="bg-[#050816]/60 border border-white/5 p-6 rounded-2xl text-center space-y-4">
          <FiAward className="text-4xl text-violetAccent-light mx-auto animate-bounce" />
          <h4 className="font-space font-bold text-base">Advanced Diagnostics Panel</h4>
          <p className="text-xs text-textGray max-w-md mx-auto">
            Comprehensive skill coverage mapping technical proficiency, cognitive workload, vocabulary diversity, and speech volume statistics.
          </p>
          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto pt-2">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-textGray block uppercase tracking-wider font-semibold">Vocabulary Range</span>
              <span className="text-xl font-bold font-space mt-1 block">94%</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-textGray block uppercase tracking-wider font-semibold">Volume Stability</span>
              <span className="text-xl font-bold font-space mt-1 block">89%</span>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
              <span className="text-[10px] text-textGray block uppercase tracking-wider font-semibold">Eye Focus</span>
              <span className="text-xl font-bold font-space mt-1 block">91%</span>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="bg-[#050816]/60 border border-white/5 p-5 rounded-2xl">
          <h4 className="font-space font-bold text-xs uppercase tracking-widest text-textGray mb-4">Recent Session History</h4>
          <div className="space-y-3">
            {[
              { role: 'Senior Software Engineer', type: 'Technical Interview', score: 88, date: 'July 12, 2026', status: 'Passed' },
              { role: 'Google Mock Prep (STAR)', type: 'Behavioral & Leadership', score: 82, date: 'July 09, 2026', status: 'Passed' },
              { role: 'Stripe Assessment Match', type: 'Coding Challenge', score: 94, date: 'July 04, 2026', status: 'Excelled' },
            ].map((session, i) => (
              <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                <div>
                  <h5 className="text-xs font-bold">{session.role}</h5>
                  <p className="text-[10px] text-textGray mt-0.5">{session.type} &bull; {session.date}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold font-space block">{session.score}%</span>
                  <span className="text-[9px] text-emerald-400 font-semibold">{session.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}

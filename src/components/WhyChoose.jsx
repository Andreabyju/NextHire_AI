import React from 'react';
import { motion } from 'framer-motion';
import { FiCheck, FiCpu, FiFileText, FiVolume2, FiCode, FiAward, FiEye, FiTrendingUp } from 'react-icons/fi';

export default function WhyChoose() {
  const points = [
    {
      title: 'AI-Generated Interview Questions',
      desc: 'Dynamic questions compiled instantly based on target company, role seniority, and domain specificities.',
      icon: <FiCpu className="text-violetAccent-light" />
    },
    {
      title: 'Resume-Specific Prep',
      desc: 'No generic questionnaires. The platform cross-checks your direct history, project definitions, and gaps.',
      icon: <FiFileText className="text-blueAccent-light" />
    },
    {
      title: 'Realistic Voice Interviews',
      desc: 'Engage in natural vocal communication using conversational speech flows and speech cadence evaluation.',
      icon: <FiVolume2 className="text-pink-500" />
    },
    {
      title: 'Coding & Aptitude Practice',
      desc: 'Integrates real-time programming compilation and timed quantitative examinations to cover all bases.',
      icon: <FiCode className="text-cyan-400" />
    },
    {
      title: 'Intelligent Diagnostic Feedback',
      desc: 'Receive immediate analytical ratings covering tone, keyword density, STAR structure efficiency, and vocabulary.',
      icon: <FiAward className="text-amber-400" />
    },
    {
      title: 'Computer Vision Posture Control',
      desc: 'Webcam-based algorithms mapping body tilt, shoulder alignment, and gaze contact levels.',
      icon: <FiEye className="text-rose-400" />
    },
    {
      title: 'Comprehensive Analytics',
      desc: 'Access deep dashboard records listing every mock attempt, historical shifts, and progress index.',
      icon: <FiTrendingUp className="text-emerald-400" />
    }
  ];

  return (
    <section id="why-choose" className="py-24 bg-[#111827]/40 relative overflow-hidden">
      {/* Decorative Background lights */}
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] bg-radial-gradient from-violetAccent/5 via-transparent to-transparent rounded-full blur-[80px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-radial-gradient from-blueAccent/5 via-transparent to-transparent rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* Content Left */}
          <div className="lg:col-span-5 space-y-6 text-left">
            <span className="text-xs uppercase tracking-widest font-bold text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light font-space">
              Why NextHire AI
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-space tracking-tight text-white leading-tight">
              An AI Coach in Your Corner 24/7
            </h2>
            <p className="text-sm md:text-base text-textGray leading-relaxed">
              Standard interview preparation relies on static question banks and self-recording. NextHire AI redefines this experience by simulating a live, responsive interviewer that reads your CV, hears your voice, monitors your posture, and evaluates your code line-by-line.
            </p>
            
            {/* Quick check list */}
            <div className="space-y-3.5 pt-4">
              {[
                'Tailored feedback powered by neural networks',
                'Advanced posture tracking via local Computer Vision',
                'Comprehensive HR & Technical coverage',
                'Continuous scoring history and track record'
              ].map((bullet, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-violetAccent/20 flex items-center justify-center border border-violetAccent/40">
                    <FiCheck className="text-violetAccent-light text-xs" />
                  </div>
                  <span className="text-xs font-semibold text-white/90 font-sans">{bullet}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Grid Right */}
          <div className="lg:col-span-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {points.map((point, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.95 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: index * 0.08 }}
                  className="bg-[#0F172A]/50 border border-white/5 p-5 rounded-2xl flex gap-4 hover:border-violetAccent/20 transition-all duration-300 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-lg shrink-0 group-hover:bg-[#050816] group-hover:scale-105 transition-all">
                    {point.icon}
                  </div>
                  <div className="text-left">
                    <h4 className="font-space font-bold text-sm text-white mb-1.5 leading-snug">
                      {point.title}
                    </h4>
                    <p className="text-[11px] text-textGray leading-relaxed">
                      {point.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}

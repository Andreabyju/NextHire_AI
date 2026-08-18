import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight, FiPlay } from 'react-icons/fi';
import DashboardPreview from './DashboardPreview';

export default function Hero() {
  const navigate = useNavigate();
  return (
    <section id="home" className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden bg-[#050816]">
      {/* Background Decorative Ambient Gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial-gradient from-violetAccent/10 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] bg-radial-gradient from-blueAccent/10 via-transparent to-transparent rounded-full blur-[80px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Hero Content Left */}
          <div className="lg:col-span-6 text-left space-y-6">
            
            {/* Glowing Accent Tag */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 shadow-[0_0_15px_rgba(255,255,255,0.02)]"
            >
              <span className="flex h-2 w-2 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violetAccent-light opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-violetAccent"></span>
              </span>
              <span className="text-xs font-semibold uppercase tracking-widest text-[#94a3b8]">
                Next-Gen AI Interview Coach
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-extrabold tracking-tight font-space leading-[1.1] text-white"
            >
              Prepare Smarter.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light via-violetAccent-light to-pink-500 drop-shadow-[0_0_30px_rgba(139,92,246,0.2)]">
                Get Hired Faster.
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm md:text-base text-textGray leading-relaxed max-w-xl"
            >
              NextHire AI is an intelligent AI-powered interview coaching platform that provides an all-in-one interview preparation experience. The platform allows users to upload their resumes, receive AI-powered resume analysis, generate personalized HR and technical interview questions, participate in voice-based mock interviews, solve coding challenges, take aptitude assessments, receive intelligent performance evaluation, monitor interview progress through an interactive dashboard, and improve professional posture using real-time computer vision-based posture correction.
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-wrap gap-4 pt-4"
            >
              {/* Primary button */}
              <button
                id="hero-get-started-btn"
                onClick={() => navigate('/sign-up')}
                className="group relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold text-white rounded-xl bg-gradient-to-br from-blueAccent to-violetAccent hover:text-white focus:ring-4 focus:outline-none focus:ring-blue-800 shadow-[0_0_20px_rgba(124,58,237,0.3)] hover:shadow-[0_0_30px_rgba(124,58,237,0.5)] transition-all duration-300"
              >
                <span className="relative px-6 py-3.5 transition-all ease-in duration-75 bg-[#050816] rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-2">
                  Get Started Free
                  <FiArrowRight className="group-hover:translate-x-1 transition-transform" />
                </span>
              </button>

              {/* Watch Demo button */}
              <button
                onClick={() => {
                  const element = document.getElementById('how-it-works');
                  if (element) element.scrollIntoView({ behavior: 'smooth' });
                }}
                className="flex items-center gap-2 px-6 py-3.5 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-semibold text-sm transition-all duration-300 text-white"
              >
                <FiPlay className="text-violetAccent-light fill-violetAccent-light/20" />
                Watch Demo
              </button>
            </motion.div>

          </div>

          {/* Hero Graphic Right (Dashboard Preview) */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="lg:col-span-6 relative w-full mt-8 lg:mt-0"
          >
            {/* Ambient Background Behind Dashboard */}
            <div className="absolute inset-0 bg-gradient-to-tr from-blueAccent/10 to-violetAccent/15 rounded-3xl filter blur-xl opacity-70 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Dashboard Floating Wrapper */}
            <div className="relative animate-float-slow">
              <DashboardPreview />
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}

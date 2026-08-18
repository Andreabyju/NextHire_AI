import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HiSparkles, HiAcademicCap, HiBriefcase, HiShieldCheck } from 'react-icons/hi2';

export default function PortalSelectionPage() {
  return (
    <div className="min-h-screen bg-[#050816] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background ambient glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blueAccent/8 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-violetAccent/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-violetAccent/5 rounded-full blur-[150px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-3xl"
      >
        <div className="flex flex-col items-center mb-10">
          <Link to="/" className="flex items-center gap-2.5 group mb-5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_20px_rgba(124,58,237,0.4)] transition-transform duration-300 group-hover:scale-105">
              <HiSparkles className="text-white text-2xl" />
            </div>
            <span className="font-space text-2xl font-bold tracking-tight text-white">
              NextHire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">AI</span>
            </span>
          </Link>
          <h1 className="text-3xl font-bold font-space text-white">Choose your portal</h1>
          <p className="text-sm text-slate-400 mt-2">Select the type of account you want to sign in with.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          
          {/* Candidate / Student */}
          <Link to="/sign-in" className="group block">
            <div className="h-full relative rounded-2xl border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-blueAccent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-xl bg-blue-500/20 text-blue-400 flex items-center justify-center mb-6">
                <HiAcademicCap className="text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Candidate / Student</h2>
              <p className="text-sm text-slate-400 mb-8 flex-grow">Prepare for interviews and careers with AI-driven insights.</p>
              <div className="mt-auto inline-flex items-center justify-center w-full py-3 rounded-xl bg-blueAccent/20 text-blueAccent-light font-medium group-hover:bg-blueAccent group-hover:text-white transition-colors">
                Candidate Login
              </div>
            </div>
          </Link>
 
          {/* Mentor / Recruiter */}
          <Link to="/mentor/login" className="group block">
            <div className="h-full relative rounded-2xl border border-white/10 overflow-hidden bg-white/5 hover:bg-white/10 transition-all duration-300 flex flex-col p-6">
              <div className="absolute inset-0 bg-gradient-to-br from-violetAccent/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="w-14 h-14 rounded-xl bg-violet-500/20 text-violet-400 flex items-center justify-center mb-6">
                <HiBriefcase className="text-3xl" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">🏢 Mentor / Recruiter</h2>
              <p className="text-sm text-slate-400 mb-8 flex-grow">Discover and hire talented people for your company.</p>
              <div className="mt-auto inline-flex items-center justify-center w-full py-3 rounded-xl bg-violetAccent/20 text-violetAccent-light font-medium group-hover:bg-violetAccent group-hover:text-white transition-colors">
                Mentor Login
              </div>
            </div>
          </Link>
 
        </div>
        
        <div className="mt-12 text-center">
          <Link to="/" className="text-slate-400 hover:text-white transition-colors text-sm">
            &larr; Back to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

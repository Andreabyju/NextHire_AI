import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiArrowRight } from 'react-icons/fi';

export default function CTA() {
  const navigate = useNavigate();

  return (
    <section id="cta" className="py-24 bg-[#050816] relative overflow-hidden">
      {/* Absolute glow elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(124,58,237,0.15),transparent_60%)] pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10">

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative bg-gradient-to-r from-[#0F172A]/80 to-[#1E1B4B]/80 border border-white/10 rounded-3xl p-8 md:p-16 text-center space-y-6 overflow-hidden shadow-[0_0_50px_rgba(139,92,246,0.15)] group hover:border-violetAccent/30 transition-all duration-500"
        >
          {/* Inner glows */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-blueAccent/20 rounded-full blur-[70px] pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-violetAccent/20 rounded-full blur-[70px] pointer-events-none" />

          <h2 className="text-3xl md:text-5xl font-extrabold font-space tracking-tight text-white leading-tight">
            Ready to Ace Your Next Interview?
          </h2>

          <p className="text-sm md:text-base text-textGray max-w-2xl mx-auto leading-relaxed">
            Join thousands of students and professionals preparing for successful careers with NextHire AI. Sign up today and get your resume evaluated instantly for free.
          </p>

          <div className="flex flex-wrap justify-center gap-4 pt-4">
            {/* Primary — Sign Up */}
            <button
              id="cta-signup-btn"
              onClick={() => navigate('/sign-up')}
              className="relative inline-flex items-center justify-center p-0.5 overflow-hidden text-sm font-semibold text-white rounded-xl bg-gradient-to-br from-blueAccent to-violetAccent group hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] transition-all duration-300"
            >
              <span className="relative px-8 py-4 transition-all ease-in duration-75 bg-[#050816] rounded-[10px] group-hover:bg-opacity-0 flex items-center gap-2">
                Start Free Trial
                <FiArrowRight />
              </span>
            </button>

            {/* Secondary — Sign In */}
            <button
              id="cta-signin-btn"
              onClick={() => navigate('/sign-in')}
              className="px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 font-semibold text-sm transition-all duration-300 text-white"
            >
              Sign In to Account
            </button>
          </div>

        </motion.div>
      </div>
    </section>
  );
}

import React from 'react';
import { HiSparkles } from 'react-icons/hi2';
import { FaGithub, FaLinkedin, FaTwitter } from 'react-icons/fa';

export default function Footer() {
  return (
    <footer id="footer" className="bg-[#050816] border-t border-white/5 pt-20 pb-10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-16 border-b border-white/5 text-left">
          
          {/* Column 1: Brand */}
          <div className="space-y-4 col-span-1 md:col-span-1">
            <a href="#home" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blueAccent to-violetAccent flex items-center justify-center shadow-[0_0_15px_rgba(124,58,237,0.3)]">
                <HiSparkles className="text-white text-xl animate-pulse-glow" />
              </div>
              <span className="font-space text-xl font-bold tracking-tight text-white">
                NextHire <span className="text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light">AI</span>
              </span>
            </a>
            <p className="text-xs text-textGray leading-relaxed">
              Next-generation AI interview preparation and computer vision-based coaching platform. Empowers job seekers to practice smarter and get hired faster.
            </p>
          </div>

          {/* Column 2: Platform Links */}
          <div className="space-y-4">
            <h4 className="font-space text-xs font-bold uppercase tracking-widest text-white">Platform</h4>
            <ul className="space-y-2 text-xs text-textGray">
              <li><a href="#home" className="hover:text-violetAccent-light transition-colors">Home</a></li>
              <li><a href="#features" className="hover:text-violetAccent-light transition-colors">Features</a></li>
              <li><a href="#why-choose" className="hover:text-violetAccent-light transition-colors">About Coach</a></li>
              <li><a href="#testimonials" className="hover:text-violetAccent-light transition-colors">Success Stories</a></li>
            </ul>
          </div>

          {/* Column 3: Legal & Support */}
          <div className="space-y-4">
            <h4 className="font-space text-xs font-bold uppercase tracking-widest text-white">Resources</h4>
            <ul className="space-y-2 text-xs text-textGray">
              <li><a href="#faq" className="hover:text-violetAccent-light transition-colors">FAQ Support</a></li>
              <li><a href="#home" className="hover:text-violetAccent-light transition-colors">Privacy Policy</a></li>
              <li><a href="#home" className="hover:text-violetAccent-light transition-colors">Terms of Service</a></li>
              <li><a href="#home" className="hover:text-violetAccent-light transition-colors">Security Standards</a></li>
            </ul>
          </div>

          {/* Column 4: Newsletter / Connect */}
          <div className="space-y-4">
            <h4 className="font-space text-xs font-bold uppercase tracking-widest text-white">Connect</h4>
            <p className="text-xs text-textGray">
              Subscribe to receive the latest updates on prompt engineering and platform capabilities.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Enter email"
                className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-violetAccent w-full transition-colors"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-blueAccent to-violetAccent text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Join
              </button>
            </form>
          </div>

        </div>

        {/* Bottom Details */}
        <div className="flex flex-col sm:flex-row justify-between items-center pt-8 gap-4">
          <p className="text-[11px] text-textGray font-sans">
            Copyright &copy; 2026 NextHire AI. All rights reserved.
          </p>

          {/* Social icons */}
          <div className="flex items-center gap-4">
            <a
              href="https://github.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-textGray hover:text-white hover:border-white/20 transition-all hover:scale-105"
              aria-label="GitHub"
            >
              <FaGithub />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-textGray hover:text-white hover:border-white/20 transition-all hover:scale-105"
              aria-label="LinkedIn"
            >
              <FaLinkedin />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noreferrer"
              className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-textGray hover:text-white hover:border-white/20 transition-all hover:scale-105"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}

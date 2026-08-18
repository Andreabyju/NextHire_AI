import React from 'react';
import { FaReact, FaNodeJs } from 'react-icons/fa';
import { SiMongodb, SiJsonwebtokens } from 'react-icons/si';
import { FiEye, FiMic, FiCpu } from 'react-icons/fi';
import { TbLayersIntersect } from 'react-icons/tb';

const OpenAiIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 text-white group-hover:drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]">
    <path d="M21.3,10.6c0.1-0.5,0.1-1.1-0.1-1.6c-0.3-1-1.1-1.8-2.1-2.1c-0.6-0.2-1.3-0.2-1.9,0C16.8,6.2,16.1,5,15,4.3c-1-0.7-2.3-0.8-3.3-0.3c-0.5,0.2-0.9,0.6-1.3,1C9.6,4.6,8.7,4.3,7.7,4.4C6.6,4.6,5.6,5.3,5,6.3c-0.3,0.5-0.5,1-0.5,1.6C3.7,8.2,3,9.1,2.8,10.2c-0.2,1.1,0.1,2.2,0.8,3.1c-0.1,0.5-0.1,1.1,0.1,1.6c0.3,1,1.1,1.8,2.1,2.1c0.6,0.2,1.3,0.2,1.9,0c0.4,0.7,1.1,1.9,2.2,2.6c1,0.7,2.3,0.8,3.3,0.3c0.5-0.2,0.9-0.6,1.3-1c0.8,0.4,1.7,0.7,2.7,0.6c1.1-0.2,2.1-0.9,2.7-1.9c0.3-0.5,0.5-1,0.5-1.6C20.3,15.8,21,14.9,21.2,13.8C21.4,12.7,21.1,11.6,21.3,10.6z M12.8,19.2c-0.4,0.2-0.9,0.3-1.3,0.2c-0.4-0.1-0.8-0.3-1.1-0.6c0.1,0,0.1,0,0.2-0.1l4.4-2.5c0.2-0.1,0.4-0.4,0.4-0.6v-6.3l1.9,1.1c0.4,0.2,0.6,0.6,0.7,1.1C18.1,12,18,12.5,17.8,12.9L12.8,19.2z M17,8.2c-0.2-0.3-0.4-0.6-0.8-0.8c-0.4-0.2-0.8-0.3-1.3-0.3c-0.1,0-0.2,0-0.2,0.1l-4.4,2.5C10.1,9.8,9.9,10,9.9,10.3v6.3L8,15.5c-0.4-0.2-0.6-0.6-0.7-1.1C7.2,14,7.3,13.5,7.5,13.1L12.5,8.2C13.8,7.3,15.6,7.3,17,8.2z M12,6.5c-0.4,0-0.8,0.1-1.1,0.3L6.5,9.3C6.3,9.4,6.1,9.7,6.1,10v5.1L4.2,14c-0.4-0.2-0.6-0.6-0.7-1.1c-0.1-0.5,0-1,0.2-1.4l5-8.7C10,1.9,11.8,1.3,13.2,2.1c0.4,0.2,0.7,0.5,0.9,0.8L12,6.5z M6.2,15.8C6,15.5,5.9,15.1,6,14.7c0.1-0.4,0.3-0.8,0.6-1.1l0,0l4.4-2.5c0.2-0.1,0.3-0.1,0.4-0.1c0.1,0,0.2,0.1,0.3,0.1c0.1,0.1,0.1,0.2,0.1,0.3c0,0.1,0,0.2-0.1,0.3l-3.2,5.5L6.2,15.8z M13,13.6L13,13.6l-2,1.2l-2-1.2v-2.3l2-1.2l2,1.2V13.6z M11.2,4.8C11.4,5,11.5,5.4,11.5,5.8c-0.1,0.4-0.3,0.8-0.6,1.1l0,0l-4.4,2.5c-0.2,0.1-0.3,0.1-0.4,0.1c-0.1,0-0.2-0.1-0.3-0.1C5.7,9.3,5.7,9.2,5.7,9.1c0-0.1,0-0.2,0.1-0.3l3.2-5.5L11.2,4.8z M17.8,8.2L17.8,8.2l-3.2,5.5L12.8,10.6c0.2-0.1,0.4-0.3,0.5-0.6c0.1-0.4,0.1-0.8-0.1-1.1l0,0L17.8,8.2z M17.8,15.8l-5,2.9c-0.4,0.2-0.9,0.3-1.3,0.2l1.9-1.1c0.2-0.1,0.4-0.3,0.5-0.6c0.1-0.4,0.1-0.8-0.1-1.1l-1.9-1.1L17.8,15.8z M19.8,10c0,0.4-0.1,0.8-0.3,1.1l-5,8.7c-0.8,1.4-2.6,1.9-4,1.1c-0.4-0.2-0.7-0.5-0.9-0.8l5.2-3L19.8,10z" />
  </svg>
);

export default function PoweredBy() {
  const technologies = [
    { name: 'React', icon: <FaReact className="text-sky-400 group-hover:drop-shadow-[0_0_8px_rgba(56,189,248,0.6)]" /> },
    { name: 'Node.js', icon: <FaNodeJs className="text-emerald-500 group-hover:drop-shadow-[0_0_8px_rgba(16,185,129,0.6)]" /> },
    { name: 'MongoDB', icon: <SiMongodb className="text-emerald-600 group-hover:drop-shadow-[0_0_8px_rgba(5,150,105,0.6)]" /> },
    { name: 'OpenAI', icon: <OpenAiIcon /> },
    { name: 'MediaPipe', icon: <TbLayersIntersect className="text-rose-400 group-hover:drop-shadow-[0_0_8px_rgba(251,113,133,0.6)]" /> },
    { name: 'JWT Auth', icon: <SiJsonwebtokens className="text-pink-500 group-hover:drop-shadow-[0_0_8px_rgba(236,72,153,0.6)]" /> },
    { name: 'Speech Recognition', icon: <FiMic className="text-blue-400 group-hover:drop-shadow-[0_0_8px_rgba(96,165,250,0.6)]" /> },
    { name: 'Computer Vision', icon: <FiEye className="text-amber-400 group-hover:drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" /> },
    { name: 'Artificial Intelligence', icon: <FiCpu className="text-violet-400 group-hover:drop-shadow-[0_0_8px_rgba(167,139,250,0.6)]" /> },
  ];

  return (
    <section className="py-12 bg-[#111827]/40 border-y border-white/5 relative overflow-hidden">
      {/* Edge Fades for Seamless Marquee appearance */}
      <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-[#050816] to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-[#050816] to-transparent z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-textGray/60 font-space mb-8">
          Integrations & Technology Stack
        </p>

        {/* Marquee Flow */}
        <div className="flex overflow-hidden relative w-full">
          <div className="flex gap-12 items-center animate-marquee whitespace-nowrap min-w-full">
            {/* First Set */}
            {technologies.map((tech, index) => (
              <div 
                key={index} 
                className="flex items-center gap-3 bg-white/5 border border-white/5 hover:border-violetAccent/20 px-5 py-3 rounded-2xl group transition-all duration-300 hover:bg-white/10 hover:scale-105 cursor-default select-none"
              >
                <span className="text-xl transition-all duration-300">
                  {tech.icon}
                </span>
                <span className="text-sm font-semibold tracking-wide text-textGray group-hover:text-white transition-colors font-sans">
                  {tech.name}
                </span>
              </div>
            ))}
            {/* Duplicate Set for Infinite Scroll */}
            {technologies.map((tech, index) => (
              <div 
                key={`dup-${index}`} 
                className="flex items-center gap-3 bg-white/5 border border-white/5 hover:border-violetAccent/20 px-5 py-3 rounded-2xl group transition-all duration-300 hover:bg-white/10 hover:scale-105 cursor-default select-none"
              >
                <span className="text-xl transition-all duration-300">
                  {tech.icon}
                </span>
                <span className="text-sm font-semibold tracking-wide text-textGray group-hover:text-white transition-colors font-sans">
                  {tech.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

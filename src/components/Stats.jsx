import React, { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';

function Counter({ value, suffix = "", duration = 1.5 }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!isInView) return;

    let start = 0;
    const end = parseInt(value, 10);
    if (start === end) return;

    const totalMiliseconds = duration * 1000;
    const incrementTime = Math.max(Math.floor(totalMiliseconds / end), 15);
    
    const timer = setInterval(() => {
      start += Math.ceil(end / (totalMiliseconds / incrementTime));
      if (start >= end) {
        setCount(end);
        clearInterval(timer);
      } else {
        setCount(start);
      }
    }, incrementTime);

    return () => clearInterval(timer);
  }, [isInView, value, duration]);

  return (
    <span ref={ref} className="font-space font-extrabold text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-white to-textGray">
      {count.toLocaleString()}{suffix}
    </span>
  );
}

export default function Stats() {
  const stats = [
    { target: '1000', suffix: '+', label: 'AI Interview Questions', desc: 'Covering HR, behavioral, and deep technical concepts.' },
    { target: '500', suffix: '+', label: 'Coding Challenges', desc: 'Algorithmic, data structures, and database matching.' },
    { target: '300', suffix: '+', label: 'Aptitude Questions', desc: 'Quantitative aptitude, logical reasoning, and verbal tests.' },
    { target: '95', suffix: '%', label: 'Evaluation Accuracy', desc: 'Validated assessments matching human recruiting decisions.' },
    { target: '24', suffix: '/7', label: 'AI Interview Coach', desc: 'Your private coach is available anytime, anywhere.' },
    { target: '100', suffix: '%', label: 'Real-Time Analytics', desc: 'Webcam-based posture and speech analytics updates.' },
  ];

  return (
    <section className="py-20 bg-[#050816] relative overflow-hidden border-t border-white/5">
      {/* Background visual light */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-radial-gradient from-violetAccent/5 via-transparent to-transparent rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-6 md:gap-8">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="bg-[#0F172A]/30 border border-white/5 hover:border-violetAccent/20 p-5 rounded-2xl text-center space-y-2 group transition-all duration-300 hover:-translate-y-1"
            >
              {/* Ticker */}
              <div>
                <Counter value={stat.target} suffix={stat.suffix} />
              </div>

              {/* Title label */}
              <h4 className="font-space text-xs font-bold text-white group-hover:text-blueAccent-light transition-colors uppercase tracking-widest leading-snug">
                {stat.label}
              </h4>

              {/* Desc */}
              <p className="text-[10px] text-textGray leading-relaxed">
                {stat.desc}
              </p>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

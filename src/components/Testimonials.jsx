import React from 'react';
import { motion } from 'framer-motion';
import { FaStar } from 'react-icons/fa';

export default function Testimonials() {
  const testimonials = [
    {
      quote: "NextHire AI was a complete game-changer for my SWE prep. The coding sandbox combined with live verbal coaching helped me structure complex thoughts under pressure. Landed an offer at Stripe!",
      name: "Sarah Chen",
      role: "Software Engineer @ Stripe",
      institution: "Stanford University Class of '25",
      initials: "SC",
      gradient: "from-blue-500 to-indigo-600",
      rating: 5
    },
    {
      quote: "I used to struggle with communication pacing and structuring my behavioral answers. Practicing with the AI coach helped me master the STAR method. I felt incredibly confident during my Google interviews.",
      name: "Marcus Johnson",
      role: "Associate Product Manager @ Google",
      institution: "MIT Graduate '25",
      initials: "MJ",
      gradient: "from-violet-500 to-purple-600",
      rating: 5
    },
    {
      quote: "The real-time posture correction felt like magic. It made me aware of my slouching and eye-contact drift. By the time my real interview came, my physical confidence was at an all-time high.",
      name: "Elena Rostova",
      role: "Business Analyst @ McKinsey",
      institution: "NYU Stern School of Business",
      initials: "ER",
      gradient: "from-pink-500 to-rose-600",
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-24 bg-[#111827]/30 relative overflow-hidden border-t border-white/5">
      {/* Background glow overlay */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial-gradient from-violetAccent/5 via-transparent to-transparent rounded-full blur-[110px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs uppercase tracking-widest font-bold text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light font-space">
            User Success
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-space tracking-tight text-white leading-tight">
            Loved by Students & Job Seekers
          </h2>
          <p className="text-sm md:text-base text-textGray leading-relaxed">
            Read how NextHire AI has helped college students and fresh graduates secure job offers at some of the world’s most competitive tech and consulting firms.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((t, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.6, delay: index * 0.15 }}
              className="glass-panel p-8 rounded-3xl flex flex-col justify-between hover:border-violetAccent/20 hover:bg-[#0f172a]/70 transition-all duration-300 relative group"
            >
              {/* Star Rating */}
              <div className="flex gap-1.5 mb-6">
                {[...Array(t.rating)].map((_, i) => (
                  <FaStar key={i} className="text-amber-400 text-sm" />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-xs md:text-sm text-textGray leading-relaxed italic mb-8 flex-1 group-hover:text-white transition-colors duration-300">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* User Block */}
              <div className="flex items-center gap-4 border-t border-white/5 pt-6">
                {/* Initial Avatar */}
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${t.gradient} flex items-center justify-center font-space font-bold text-white text-sm shadow-md shadow-black/40 shrink-0 group-hover:scale-105 transition-transform`}>
                  {t.initials}
                </div>
                {/* Identity Info */}
                <div className="text-left">
                  <h4 className="font-space font-bold text-sm text-white">{t.name}</h4>
                  <p className="text-[11px] text-violetAccent-light font-semibold mt-0.5">{t.role}</p>
                  <p className="text-[10px] text-textGray/70 font-sans mt-0.5">{t.institution}</p>
                </div>
              </div>

            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}

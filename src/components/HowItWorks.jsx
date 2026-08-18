import React from 'react';
import { motion } from 'framer-motion';
import { FiUserPlus, FiUploadCloud, FiTrendingUp, FiCheckCircle } from 'react-icons/fi';

export default function HowItWorks() {
  const steps = [
    {
      num: '01',
      title: 'Create Account',
      description: 'Sign up and build your tailored professional interview profile, specifying targets, job roles, and experience levels.',
      icon: <FiUserPlus className="text-xl text-blueAccent-light" />,
      glow: 'shadow-[0_0_15px_rgba(59,130,246,0.2)] border-blueAccent/30'
    },
    {
      num: '02',
      title: 'Upload Resume',
      description: 'Upload your resume for comprehensive AI analysis. Identify missing keywords, ATS compatibility score, and structural improvements.',
      icon: <FiUploadCloud className="text-xl text-violetAccent-light" />,
      glow: 'shadow-[0_0_15px_rgba(124,58,237,0.2)] border-violetAccent/30'
    },
    {
      num: '03',
      title: 'Practice with AI',
      description: 'Engage in highly realistic HR, technical, coding, and aptitude mock sessions. Speak naturally and write code inside our sandbox.',
      icon: <FiTrendingUp className="text-xl text-cyan-400" />,
      glow: 'shadow-[0_0_15px_rgba(34,211,238,0.2)] border-cyan-500/30'
    },
    {
      num: '04',
      title: 'Review Performance',
      description: 'Receive multi-dimensional feedback: resume scores, technical evaluations, speaking pace, posture metrics, and tailored lessons.',
      icon: <FiCheckCircle className="text-xl text-emerald-400" />,
      glow: 'shadow-[0_0_15px_rgba(52,211,153,0.2)] border-emerald-500/30'
    }
  ];

  return (
    <section id="how-it-works" className="py-24 bg-[#050816] relative overflow-hidden">
      {/* Background lights */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-radial-gradient from-violetAccent/5 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-radial-gradient from-blueAccent/5 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs uppercase tracking-widest font-bold text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light font-space">
            Execution Path
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-space tracking-tight text-white leading-tight">
            How It Works
          </h2>
          <p className="text-sm md:text-base text-textGray leading-relaxed">
            Four simple phases designed to guide you from basic preparation to mock interview simulation and analytical feedback reports.
          </p>
        </div>

        {/* Steps Content */}
        <div className="relative">
          
          {/* Horizontal Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-[68px] left-[12%] right-[12%] h-[2px] bg-gradient-to-r from-blueAccent via-violetAccent to-emerald-400 opacity-20 pointer-events-none z-0" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.6, delay: index * 0.15 }}
                className="flex flex-col items-center text-center space-y-4"
              >
                
                {/* Step Circle with Icon */}
                <div className={`relative w-[60px] h-[60px] rounded-full bg-[#0F172A] border flex items-center justify-center group-hover:scale-110 transition-transform duration-300 z-10 ${step.glow}`}>
                  {step.icon}
                  {/* Step counter label above circle */}
                  <span className="absolute -top-6 text-[10px] font-bold font-space tracking-widest text-textGray bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                    STEP {step.num}
                  </span>
                </div>

                {/* Info Card */}
                <div className="bg-[#0F172A]/40 border border-white/5 p-6 rounded-2xl flex-1 flex flex-col justify-between hover:border-white/10 transition-colors duration-300 w-full min-h-[160px]">
                  <div>
                    <h3 className="font-space text-lg font-bold text-white mb-2">{step.title}</h3>
                    <p className="text-xs text-textGray leading-relaxed">{step.description}</p>
                  </div>
                  
                  {/* Step Progress Arrow or Line for mobile/tablet */}
                  {index < 3 && (
                    <div className="lg:hidden mt-4 text-violetAccent-light font-bold flex justify-center text-lg">
                      &darr;
                    </div>
                  )}
                </div>

              </motion.div>
            ))}
          </div>

        </div>

      </div>
    </section>
  );
}

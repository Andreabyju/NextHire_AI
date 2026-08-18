import React from 'react';
import { motion } from 'framer-motion';
import { 
  FiFileText, 
  FiMessageSquare, 
  FiMic, 
  FiCode, 
  FiClock, 
  FiUserCheck, 
  FiBarChart2, 
  FiBookOpen 
} from 'react-icons/fi';

export default function Features() {
  const features = [
    {
      title: 'AI Resume Analysis',
      description: 'Upload resumes and receive AI-powered resume evaluation, ATS score, skill extraction, missing skill identification, resume improvement suggestions, and optimization recommendations.',
      icon: <FiFileText className="text-blueAccent-light text-2xl" />,
      color: 'from-blue-500/20 to-blue-600/5',
      glowColor: 'group-hover:border-blueAccent/40'
    },
    {
      title: 'AI Mock Interviews',
      description: 'Generate personalized HR and technical interview questions based on the uploaded resume and selected job role, creating a realistic interview experience.',
      icon: <FiMessageSquare className="text-violetAccent-light text-2xl" />,
      color: 'from-purple-500/20 to-purple-600/5',
      glowColor: 'group-hover:border-violetAccent/40'
    },
    {
      title: 'Voice-Based Practice',
      description: 'Conduct mock interviews using Speech-to-Text and Text-to-Speech technologies, allowing users to answer questions naturally while the AI evaluates communication skills.',
      icon: <FiMic className="text-pink-500 text-2xl" />,
      color: 'from-pink-500/20 to-pink-600/5',
      glowColor: 'group-hover:border-pink-500/40'
    },
    {
      title: 'Coding Challenges',
      description: 'Practice programming problems through an integrated coding assessment module featuring multiple difficulty levels and performance evaluation.',
      icon: <FiCode className="text-cyan-400 text-2xl" />,
      color: 'from-cyan-500/20 to-cyan-600/5',
      glowColor: 'group-hover:border-cyan-500/40'
    },
    {
      title: 'Aptitude Assessment',
      description: 'Practice quantitative aptitude, logical reasoning, and verbal ability tests with timers, automatic scoring, and detailed analytics.',
      icon: <FiClock className="text-amber-400 text-2xl" />,
      color: 'from-amber-500/20 to-amber-600/5',
      glowColor: 'group-hover:border-amber-500/40'
    },
    {
      title: 'Real-Time Posture Detection',
      description: 'Use the webcam to monitor body posture during interviews using OpenCV and MediaPipe. Detect incorrect posture and provide instant posture correction feedback to improve professionalism and confidence.',
      icon: <FiUserCheck className="text-emerald-400 text-2xl" />,
      color: 'from-emerald-500/20 to-emerald-600/5',
      glowColor: 'group-hover:border-emerald-500/40'
    },
    {
      title: 'Performance Analytics Dashboard',
      description: 'Track interview performance through detailed analytics including interview scores, communication score, coding performance, aptitude results, posture analysis, strengths, weaknesses, and overall improvement trends.',
      icon: <FiBarChart2 className="text-violetAccent-light text-2xl" />,
      color: 'from-indigo-500/20 to-indigo-600/5',
      glowColor: 'group-hover:border-violetAccent/40'
    },
    {
      title: 'Personalized AI Learning Recommendations',
      description: 'Based on user performance, recommend interview topics, coding concepts, aptitude areas, communication improvements, and personalized learning paths.',
      icon: <FiBookOpen className="text-rose-400 text-2xl" />,
      color: 'from-rose-500/20 to-rose-600/5',
      glowColor: 'group-hover:border-rose-500/40'
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 15
      }
    }
  };

  return (
    <section id="features" className="py-24 bg-[#111827]/30 relative overflow-hidden">
      {/* Decorative Glow background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-radial-gradient from-blueAccent/5 via-transparent to-transparent rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-20 space-y-4">
          <span className="text-xs uppercase tracking-widest font-bold text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light font-space">
            Platform Capabilities
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-space tracking-tight text-white leading-tight">
            Everything You Need to Ace Your Next Interview
          </h2>
          <p className="text-sm md:text-base text-textGray leading-relaxed">
            Accelerate your professional growth with tools engineered to analyze every dimension of your readiness—from resume ATS score to technical coding skills and non-verbal posture communication.
          </p>
        </div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={cardVariants}
              className={`group relative glass-panel rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:bg-[#0f172a]/80 ${feature.glowColor}`}
            >
              {/* Inner subtle gradient background */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-b ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-0`} />

              <div className="relative z-10 space-y-4">
                {/* Icon Wrapper */}
                <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 group-hover:bg-[#050816] group-hover:scale-110 transition-all duration-300">
                  {feature.icon}
                </div>

                {/* Content */}
                <h3 className="font-space text-lg font-bold text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-textGray transition-colors">
                  {feature.title}
                </h3>
                <p className="text-xs text-textGray leading-relaxed group-hover:text-white/90 transition-colors">
                  {feature.description}
                </p>
              </div>

              {/* Decorative Subtle Dot */}
              <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-white/10 group-hover:bg-violetAccent-light transition-colors" />
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}

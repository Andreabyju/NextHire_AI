import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';

const faqItems = [
  {
    question: "How does the AI evaluate my mock interviews?",
    answer: "NextHire AI utilizes advanced Large Language Models (LLMs) and speech-processing models to evaluate your answers. It checks for relevant keywords, structural organization (such as the STAR method), coherence, speech pace (cadence), filler word frequency, and grammatical correctness to generate an analytical rubric."
  },
  {
    question: "How does the AI resume analysis work?",
    answer: "When you upload your resume (PDF or DOCX), our parser extracts your skills, work history, and project details. It runs them against our proprietary Applicant Tracking System (ATS) simulator and job descriptions to give you an ATS match rating, identify core skill gaps, and provide specific content recommendations."
  },
  {
    question: "Are coding interviews supported?",
    answer: "Yes, our technical module includes a fully functional web-based coding sandbox. You can select coding challenges across Easy, Medium, and Hard difficulties. The platform evaluates your code against pre-configured test cases and analyzes your implementation speed and time/space complexity."
  },
  {
    question: "How does the posture detection system function?",
    answer: "Using your computer's webcam, the system runs local, secure Computer Vision models powered by MediaPipe. It maps key facial and shoulder reference points to measure posture alignment, tilt, and eye-gaze tracking. This process runs entirely in your browser—no video feeds or images are ever uploaded or stored on our servers."
  },
  {
    question: "Can users practice unlimited mock interviews?",
    answer: "Free tier users receive a set number of trial mock interviews, resume parses, and coding runs. Premium subscribers receive unlimited access to the AI coach, customized job-role generation, advanced vocal speech coaching, and continuous posture evaluation modules."
  }
];

export default function FAQ() {
  const [openIndex, setOpenIndex] = useState(null);

  const toggleAccordion = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-24 bg-[#050816] relative overflow-hidden border-t border-white/5">
      {/* Background lights */}
      <div className="absolute top-1/2 left-0 w-[450px] h-[450px] bg-radial-gradient from-blueAccent/5 via-transparent to-transparent rounded-full blur-[90px] pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 md:px-12 relative z-10">
        
        {/* Header */}
        <div className="text-center mb-16 space-y-4">
          <span className="text-xs uppercase tracking-widest font-bold text-transparent bg-clip-text bg-gradient-to-r from-blueAccent-light to-violetAccent-light font-space">
            Support Center
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-space tracking-tight text-white leading-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-textGray">
            Find answers to commonly asked questions about our AI models, technical compatibility, and privacy standards.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqItems.map((item, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={index}
                className="bg-[#0F172A]/40 border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors"
              >
                {/* Header/Question */}
                <button
                  onClick={() => toggleAccordion(index)}
                  className="w-full flex justify-between items-center p-6 text-left font-space font-semibold text-sm md:text-base text-white group"
                >
                  <span className="group-hover:text-violetAccent-light transition-colors pr-4">
                    {item.question}
                  </span>
                  <span className={`p-2 rounded-xl bg-white/5 border border-white/5 transition-transform duration-300 ${isOpen ? 'rotate-180 text-violetAccent-light' : 'text-textGray'}`}>
                    <FiChevronDown />
                  </span>
                </button>

                {/* Answer Box */}
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                      <div className="px-6 pb-6 text-xs md:text-sm text-textGray leading-relaxed border-t border-white/5 pt-4">
                        {item.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

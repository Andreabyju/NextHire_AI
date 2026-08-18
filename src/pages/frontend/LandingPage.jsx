import React from 'react';
import Navbar from '../../components/Navbar';
import Hero from '../../components/Hero';
import PoweredBy from '../../components/PoweredBy';
import Features from '../../components/Features';
import HowItWorks from '../../components/HowItWorks';
import WhyChoose from '../../components/WhyChoose';
import Stats from '../../components/Stats';
import Testimonials from '../../components/Testimonials';
import FAQ from '../../components/FAQ';
import CTA from '../../components/CTA';
import Footer from '../../components/Footer';

export default function LandingPage() {
  return (
    <div className="bg-[#050816] min-h-screen text-white font-sans selection:bg-violetAccent/30 selection:text-white relative">

      {/* Universal Accent Glows in Background */}
      <div className="absolute top-[10%] left-0 w-[500px] h-[500px] bg-radial-gradient from-blueAccent/10 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none z-0" />
      <div className="absolute top-[40%] right-0 w-[600px] h-[600px] bg-radial-gradient from-violetAccent/8 via-transparent to-transparent rounded-full blur-[120px] pointer-events-none z-0" />
      <div className="absolute bottom-[20%] left-10 w-[500px] h-[500px] bg-radial-gradient from-blueAccent/8 via-transparent to-transparent rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Structured Content */}
      <div className="relative z-10">
        <Navbar />
        <Hero />
        <PoweredBy />
        <Features />
        <HowItWorks />
        <WhyChoose />
        <Stats />
        <Testimonials />
        <FAQ />
        <CTA />
        <Footer />
      </div>

    </div>
  );
}

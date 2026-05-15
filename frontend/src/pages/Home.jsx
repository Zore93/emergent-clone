import React from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import Stats from '../components/Stats';
import Showcase from '../components/Showcase';
import VideoSection from '../components/VideoSection';
import Features from '../components/Features';
import Pricing from '../components/Pricing';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import { useAuth } from '../lib/auth';

export default function Home() {
  const nav = useNavigate();
  const { user } = useAuth();
  const open = () => nav(user ? '/dashboard' : '/signup');

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      <Navbar onGetStarted={open} />
      <Hero onContinue={open} />
      <Stats />
      <Showcase />
      <VideoSection />
      <Features />
      <Pricing />
      <FAQ />
      <Footer onGetStarted={open} />
    </div>
  );
}

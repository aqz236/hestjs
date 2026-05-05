import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Button } from '../../ui/Button';
import Link from '@docusaurus/Link';
import { Play, Star, Zap, Shield, Copy, Check } from 'lucide-react';
import Translate, { translate } from '@docusaurus/Translate';

const HeroSection = () => {
  const { siteConfig } = useDocusaurusContext();
  const [copied, setCopied] = useState(false);
  
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText("npx create-hest-app@latest my-app");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  return (
    <section className="relative flex items-center justify-center overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* ElysiaJS 风格的动态光线效果 */}
      <div className="absolute flex flex-col z-[40] w-full !max-w-full items-center justify-center bg-transparent transition-bg overflow-hidden h-[60vh] -top-16 pointer-events-none opacity-[.35] dark:opacity-50">
        <div className="ray absolute opacity-60"></div>
      </div>
      
      <div className="relative container mx-auto px-6 text-center" style={{ zIndex: 1 }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          {/* 类似 ElysiaJS 的可爱 Logo 风格 */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <div className="inline-block relative">
              <h1 className="text-7xl md:text-8xl font-black mb-4">
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                  Hest
                </span>
                <span className="bg-gradient-to-r from-orange-500 via-red-500 to-purple-600 bg-clip-text text-transparent">
                  
                  JS</span>
              </h1>
              {/* 装饰性元素 */}
              <div className="absolute -top-4 -right-4 text-2xl animate-bounce">✨</div>
              <div className="absolute -bottom-2 -left-6 text-xl animate-pulse">🚀</div>
            </div>
          </motion.div>
          
          <motion.h2 
            className="text-2xl md:text-3xl font-bold mb-4"
            style={{ color: 'var(--homepage-text-primary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Translate id="homepage.hero.subtitle">
              Flexible JavaScript Packages, Not Framework Constraints
            </Translate>
          </motion.h2>
          
          <motion.p 
            className="text-lg md:text-xl mb-8 leading-relaxed max-w-3xl mx-auto"
            style={{ color: 'var(--homepage-text-secondary)' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Translate id="homepage.hero.description">
              Build with complete freedom. Mix and match HestJS packages as you need them. No vendor lock-in, no forced architecture. Just powerful tools that work together seamlessly.
            </Translate>
          </motion.p>
          
          <motion.div 
            className="flex flex-col gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div 
              onClick={copyCommand}
              className="flex items-center px-4 py-3 rounded-xl border transition-all duration-200 group cursor-pointer"
              style={{ 
                background: 'var(--homepage-card-bg)',
                borderColor: 'var(--homepage-border)',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}
              title={copied ? "Copied!" : "Click to copy"}
            >
              <span 
                className="font-mono text-sm select-all"
                style={{ color: 'var(--homepage-text-primary)' }}
              >
                <Translate id="homepage.hero.copyCommand">
                  npx create-hest-app@latest my-app
                </Translate>
                {copied ? (
                  <span className="ml-2 text-green-600">✓</span>
                ) : null}
              </span>
            </div>

            <Button asChild size="xl">
              <Link to="/docs/intro">
                <Play className="w-5 h-5 mr-2" />
                <Translate id="homepage.hero.getStarted">
                  Get Started
                </Translate>
              </Link>
            </Button>
          </motion.div>
          
          <motion.div
            className="flex justify-center items-center space-x-8 text-sm"
            style={{ color: 'var(--homepage-text-muted)' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              <Translate id="homepage.hero.features.typescript">
                TypeScript
              </Translate>
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1 text-blue-500" />
              <Translate id="homepage.hero.features.fast">
                Fast
              </Translate>
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1 text-green-500" />
              <Translate id="homepage.hero.features.productionReady">
                Production Ready
              </Translate>
            </div>
          </motion.div>
          
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <p 
              className="text-sm mb-4"
              style={{ color: 'var(--homepage-text-muted)' }}
            >
              <Translate id="homepage.hero.seeWhy">
                See why developers love HestJS
              </Translate>
            </p>
            <div className="animate-bounce">
              <svg className="w-6 h-6 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import { Button } from '../../ui/Button';
import Link from '@docusaurus/Link';
import { Play, Star, Zap, Shield, Copy, Check } from 'lucide-react';

const HeroSection = () => {
  const { siteConfig } = useDocusaurusContext();
  const [copied, setCopied] = useState(false);
  
  const copyCommand = async () => {
    try {
      await navigator.clipboard.writeText('npx create-hest-app@latest my-app');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };
  
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* 简化的背景效果，类似 ElysiaJS */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-50 via-white to-blue-50">
        {/* 柔和的彩色光线效果 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-r from-indigo-400/10 to-purple-400/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative z-10 container mx-auto px-6 text-center">
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
                <span className="text-gray-800">JS</span>
              </h1>
              {/* 装饰性元素 */}
              <div className="absolute -top-4 -right-4 text-2xl animate-bounce">✨</div>
              <div className="absolute -bottom-2 -left-6 text-xl animate-pulse">🚀</div>
            </div>
          </motion.div>
          
          <motion.h2 
            className="text-2xl md:text-3xl font-bold mb-4 text-gray-800"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            Flexible Node.js Packages, Not Framework Constraints
          </motion.h2>
          
          <motion.p 
            className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed max-w-3xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            Build with <span className="font-semibold text-purple-600">complete freedom</span>. 
            Mix and match HestJS packages as you need them. No vendor lock-in, no forced architecture. 
            Just powerful tools that work together seamlessly.
          </motion.p>
          
          <motion.div 
            className="flex flex-col gap-4 justify-center items-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div 
              onClick={copyCommand}
              className="flex items-center px-4 py-3 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl border border-gray-200/50 hover:border-blue-300/50 transition-all duration-200 group cursor-pointer"
              title={copied ? "Copied!" : "Click to copy"}
            >
              <span className="text-gray-700 font-mono text-sm select-all">
                npx create-hest-app@latest my-app
                {copied ? (
                  <span className="ml-2 text-green-600">✓</span>
                ) : null}
              </span>
            </div>

            <Button asChild size="xl">
              <Link to="/docs/intro">
                <Play className="w-5 h-5 mr-2" />
                Get Started
              </Link>
            </Button>
          </motion.div>
          
          <motion.div
            className="flex justify-center items-center space-x-8 text-sm text-gray-500"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            <div className="flex items-center">
              <Star className="w-4 h-4 mr-1 text-yellow-500" />
              TypeScript
            </div>
            <div className="flex items-center">
              <Zap className="w-4 h-4 mr-1 text-blue-500" />
              Fast
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-1 text-green-500" />
              Production Ready
            </div>
          </motion.div>
          
          <motion.div
            className="mt-16 text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 1 }}
          >
            <p className="text-gray-400 text-sm mb-4">See why developers love HestJS</p>
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

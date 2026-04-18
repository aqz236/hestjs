import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/Button';
import Link from '@docusaurus/Link';
import { Terminal, Download, ArrowRight } from 'lucide-react';

const GetStartedSection = () => {
  return (
    <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-700 relative overflow-hidden">
      {/* 背景装饰 */}
      <div className="absolute inset-0">
        <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute bottom-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-16 h-16 bg-purple-300/20 rounded-full blur-lg"></div>
      </div>
      
      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-6 text-white">Ready to Build Your Way?</h2>
          <p className="text-xl text-blue-100 mb-8 leading-relaxed">
            Start with the packages you need, expand when you want to. 
            No framework constraints, no vendor lock-in - just powerful tools that respect your choices.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild variant="secondary" size="xl">
              <Link to="/docs/intro">
                <Terminal className="w-5 h-5 mr-2" />
                Read Documentation
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            
            <Button asChild variant="ghost" size="xl" className="text-white border-white hover:bg-white hover:text-blue-600">
              <Link to="https://github.com/aqz236/hestjs-demo" target="_blank">
                <Download className="w-5 h-5 mr-2" />
                Download Examples
              </Link>
            </Button>
          </div>
          
          <motion.div
            className="p-6 bg-black/20 rounded-lg backdrop-blur-sm border border-white/10"
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <div className="text-left">
              <div className="text-blue-200 mb-3 text-sm font-mono"># Create a new HestJS project</div>
              <div className="space-y-2 font-mono text-sm">
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">$</span>
                  <span className="text-white">npx create-hest-app@latest my-app</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">$</span>
                  <span className="text-white">cd my-app</span>
                </div>
                <div className="flex items-center">
                  <span className="text-green-400 mr-2">$</span>
                  <span className="text-white">bun run dev</span>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default GetStartedSection;

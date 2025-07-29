import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '../../ui/Button';
import Link from '@docusaurus/Link';
import { Terminal, Download, ArrowRight } from 'lucide-react';
import Translate from '@docusaurus/Translate';

const GetStartedSection = () => {
  return (
    <section className="py-20 relative overflow-hidden" style={{ zIndex: 1 }}>
      {/* 微妙的背景装饰 */}

      
      <div className="container mx-auto px-6 text-center relative">
        <motion.div
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 
            className="text-4xl font-bold mb-6"
            style={{ color: 'var(--homepage-cta-text)' }}
          >
            <Translate id="homepage.getStarted.title">
              Ready to Build Your Way?
            </Translate>
          </h2>
          <p 
            className="text-xl mb-8 leading-relaxed"
            style={{ color: 'var(--homepage-cta-text)', opacity: 0.9 }}
          >
            <Translate id="homepage.getStarted.subtitle">
              Start with the packages you need, expand when you want to. 
              No framework constraints, no vendor lock-in - just powerful tools that respect your choices.
            </Translate>
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button asChild variant="secondary" size="xl">
              <Link to="/docs/intro">
                <Terminal className="w-5 h-5 mr-2" />
                <Translate id="homepage.getStarted.documentation">
                  Read Documentation
                </Translate>
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            
            <Button asChild variant="ghost" size="xl" className="text-white border-white hover:bg-white hover:text-blue-600">
              <Link to="https://github.com/aqz236/hestjs-demo" target="_blank">
                <Download className="w-5 h-5 mr-2" />
                <Translate id="homepage.getStarted.examples">
                  Download Examples
                </Translate>
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

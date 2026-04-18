import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle } from 'lucide-react';

const CodeExample = () => {
  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Simple. Flexible. Your Choice.</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Use familiar patterns without framework limitations. Each HestJS package integrates seamlessly, 
            whether you use one or combine them all.
          </p>
        </motion.div>
        
        <motion.div
          className="grid lg:grid-cols-2 gap-12 items-center"
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="space-y-6">
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Familiar Patterns, Zero Lock-in</h3>
                <p className="text-gray-600 leading-relaxed">Use decorators and dependency injection without framework constraints</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">Pick What You Need</h3>
                <p className="text-gray-600 leading-relaxed">Install only the packages you want - from validation to CQRS to logging</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-lg mb-2 text-gray-900">TypeScript First</h3>
                <p className="text-gray-600 leading-relaxed">Full type safety across all packages with excellent developer experience</p>
              </div>
            </div>
          </div>
          
          {/* 修复代码显示 */}
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg blur opacity-25"></div>
            <div className="relative bg-gray-900 rounded-lg p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-4">
                <span className="text-gray-400 text-sm font-mono">app.controller.ts</span>
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
              </div>
              
              <div className="font-mono text-sm leading-relaxed">
                <div className="text-gray-500 mb-1">// app.controller.ts</div>
                <div className="mb-3">
                  <span className="text-purple-400">import</span>
                  <span className="text-gray-300"> &#123; </span>
                  <span className="text-blue-400">Controller</span>
                  <span className="text-gray-300">, </span>
                  <span className="text-blue-400">Get</span>
                  <span className="text-gray-300">, </span>
                  <span className="text-blue-400">Inject</span>
                  <span className="text-gray-300"> &#125; </span>
                  <span className="text-purple-400">from</span>
                  <span className="text-green-400"> '@hestjs/core'</span>
                  <span className="text-gray-300">;</span>
                </div>
                
                <div className="mb-3">
                  <span className="text-purple-400">import</span>
                  <span className="text-gray-300"> &#123; </span>
                  <span className="text-blue-400">AppService</span>
                  <span className="text-gray-300"> &#125; </span>
                  <span className="text-purple-400">from</span>
                  <span className="text-green-400"> './app.service'</span>
                  <span className="text-gray-300">;</span>
                </div>
                
                <div className="mb-3">
                  <span className="text-pink-400">@Controller</span>
                  <span className="text-gray-300">()</span>
                </div>
                
                <div className="mb-2">
                  <span className="text-purple-400">export class</span>
                  <span className="text-yellow-400"> AppController</span>
                  <span className="text-gray-300"> &#123;</span>
                </div>
                
                <div className="ml-4 mb-2">
                  <span className="text-blue-400">constructor</span>
                  <span className="text-gray-300">(</span>
                </div>
                
                <div className="ml-8 mb-2">
                  <span className="text-pink-400">@Inject</span>
                  <span className="text-gray-300">() </span>
                  <span className="text-purple-400">private</span>
                  <span className="text-gray-300"> appService: </span>
                  <span className="text-yellow-400">AppService</span>
                </div>
                
                <div className="ml-4 mb-3">
                  <span className="text-gray-300">) &#123;&#125;</span>
                </div>
                
                <div className="ml-4 mb-2">
                  <span className="text-pink-400">@Get</span>
                  <span className="text-gray-300">(</span>
                  <span className="text-green-400">'/'</span>
                  <span className="text-gray-300">)</span>
                </div>
                
                <div className="ml-4 mb-2">
                  <span className="text-purple-400">async</span>
                  <span className="text-yellow-400"> getHello</span>
                  <span className="text-gray-300">() &#123;</span>
                </div>
                
                <div className="ml-8 mb-2">
                  <span className="text-purple-400">return</span>
                  <span className="text-gray-300"> </span>
                  <span className="text-blue-400">this</span>
                  <span className="text-gray-300">.appService.</span>
                  <span className="text-yellow-400">getHello</span>
                  <span className="text-gray-300">();</span>
                </div>
                
                <div className="ml-4 mb-1">
                  <span className="text-gray-300">&#125;</span>
                </div>
                
                <div>
                  <span className="text-gray-300">&#125;</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default CodeExample;

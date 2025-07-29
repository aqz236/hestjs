import React from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/Card';
import { 
  Zap, 
  Shield, 
  Code, 
  Layers, 
  Database, 
  GitBranch 
} from 'lucide-react';
import Translate, { translate } from '@docusaurus/Translate';

const FeaturesSection = () => {
  const features = [
    {
      icon: <Layers className="w-8 h-8" />,
      title: (
        <Translate id="homepage.features.items.modular.title">
          Modular by Design
        </Translate>
      ),
      description: (
        <Translate id="homepage.features.items.modular.description">
          Pick only the packages you need. Each HestJS package works independently or together, giving you complete control over your stack.
        </Translate>
      ),
      gradient: "from-purple-400 to-indigo-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: (
        <Translate id="homepage.features.items.fast.title">
          Blazing Fast
        </Translate>
      ),
      description: (
        <Translate id="homepage.features.items.fast.description">
          Built on Hono's performance foundation. No unnecessary overhead, just the features you choose to include.
        </Translate>
      ),
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: (
        <Translate id="homepage.features.items.typeSafe.title">
          Type Safe
        </Translate>
      ),
      description: (
        <Translate id="homepage.features.items.typeSafe.description">
          Full TypeScript support with intelligent autocompletion and compile-time error detection.
        </Translate>
      ),
      gradient: "from-green-400 to-emerald-500"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: (
        <Translate id="homepage.features.items.zeroLockIn.title">
          Zero Lock-in
        </Translate>
      ),
      description: (
        <Translate id="homepage.features.items.zeroLockIn.description">
          Use any database, any hosting, any additional libraries. HestJS doesn't limit your choices.
        </Translate>
      ),
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: (
        <Translate id="homepage.features.items.ecosystem.title">
          Rich Ecosystem
        </Translate>
      ),
      description: (
        <Translate id="homepage.features.items.ecosystem.description">
          Access to the entire Node.js ecosystem. Use any npm package alongside HestJS tools.
        </Translate>
      ),
      gradient: "from-pink-400 to-rose-500"
    },
    {
      icon: <GitBranch className="w-8 h-8" />,
      title: (
        <Translate id="homepage.features.items.freedom.title">
          Architectural Freedom
        </Translate>
      ),
      description: (
        <Translate id="homepage.features.items.freedom.description">
          Build microservices, monoliths, or anything in between. The architecture choice is yours.
        </Translate>
      ),
      gradient: "from-teal-400 to-cyan-500"
    }
  ];

  return (
    <section className="py-20 relative" style={{ zIndex: 1 }}>
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 
            className="text-4xl font-bold mb-4"
            style={{ color: 'var(--homepage-text-primary)' }}
          >
            <Translate id="homepage.features.title">
              Why Choose HestJS Packages?
            </Translate>
          </h2>
          <p 
            className="text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--homepage-text-secondary)' }}
          >
            <Translate id="homepage.features.subtitle">
              Unlike monolithic frameworks, HestJS gives you the power to choose. Use one package or combine them all - the architecture is entirely up to you.
            </Translate>
          </p>
        </motion.div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-md group hover:-translate-y-1">
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-br ${feature.gradient} rounded-lg flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl text-gray-900">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;

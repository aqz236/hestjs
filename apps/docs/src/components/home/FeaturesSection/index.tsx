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

const FeaturesSection = () => {
  const features = [
    {
      icon: <Layers className="w-8 h-8" />,
      title: "Modular by Design",
      description: "Pick only the packages you need. Each HestJS package works independently or together, giving you complete control over your stack.",
      gradient: "from-purple-400 to-indigo-500"
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Blazing Fast",
      description: "Built on Hono's performance foundation. No unnecessary overhead, just the features you choose to include.",
      gradient: "from-yellow-400 to-orange-500"
    },
    {
      icon: <Shield className="w-8 h-8" />,
      title: "Type Safe",
      description: "Full TypeScript support with strict typing across all packages. Catch errors early, code with confidence.",
      gradient: "from-green-400 to-emerald-500"
    },
    {
      icon: <Code className="w-8 h-8" />,
      title: "Zero Lock-in",
      description: "No vendor constraints. Use HestJS packages with any setup, migrate gradually, or mix with other libraries freely.",
      gradient: "from-blue-400 to-cyan-500"
    },
    {
      icon: <Database className="w-8 h-8" />,
      title: "Package Ecosystem",
      description: "From CQRS to logging, validation to documentation - choose from a growing collection of focused packages.",
      gradient: "from-pink-400 to-rose-500"
    },
    {
      icon: <GitBranch className="w-8 h-8" />,
      title: "Developer Freedom",
      description: "Familiar patterns without the framework overhead. Build your way, not ours.",
      gradient: "from-teal-400 to-cyan-500"
    }
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="container mx-auto px-6">
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl font-bold mb-4 text-gray-900">Why Choose HestJS Packages?</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Unlike monolithic frameworks, HestJS gives you the power to choose. 
            Use one package or combine them all - the architecture is entirely up to you.
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

import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HeroSection from '../components/home/HeroSection';
import CodeExample from '../components/home/CodeExample';
import FeaturesSection from '../components/home/FeaturesSection';
import GetStartedSection from '../components/home/GetStartedSection';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  
  return (
    <Layout
      title={`${siteConfig.title} - Modern Node.js Framework`}
      description="HestJS is a modern, type-safe Node.js framework inspired by NestJS, built with Hono and TSyringe for dependency injection."
    >
      <main 
        className="overflow-hidden"
        style={{ 
          minHeight: '100vh'
        }}
      >
        <HeroSection />
        <CodeExample />
        <FeaturesSection />
        <GetStartedSection />
      </main>
    </Layout>
  );
}

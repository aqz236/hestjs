import React from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import HeroSection from '../../../src/components/home/HeroSection';
import CodeExample from '../../../src/components/home/CodeExample';
import FeaturesSection from '../../../src/components/home/FeaturesSection';
import GetStartedSection from '../../../src/components/home/GetStartedSection';

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  
  return (
    <Layout
      title={`${siteConfig.title} - 现代 Node.js 框架`}
      description="HestJS 是一个现代的、类型安全的 Node.js 框架，灵感来自 NestJS，使用 Hono 构建并集成 TSyringe 进行依赖注入。"
    >
      <main className="overflow-hidden">
        <HeroSection />
        <CodeExample />
        <FeaturesSection />
        <GetStartedSection />
      </main>
    </Layout>
  );
}

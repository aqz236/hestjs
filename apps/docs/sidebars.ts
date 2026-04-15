import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // HestJS Documentation Sidebar
  tutorialSidebar: [
    'intro',
    {
      type: 'category',
      label: '🚀 快速开始',
      items: [
        'getting-started/introduction',
        'getting-started/quickstart',
        'getting-started/installation',
        'getting-started/first-application',
        'getting-started/project-structure',
        'getting-started/cli-usage',
      ],
    },
    {
      type: 'category',
      label: '🏗️ 基础概念',
      items: [
        'fundamentals/controllers',
        'fundamentals/modules',
        'fundamentals/dependency-injection',
        // 'fundamentals/services',
        // 'fundamentals/middleware',
        // 'fundamentals/interceptors',
        // 'fundamentals/pipes',
        // 'fundamentals/guards',
        // 'fundamentals/exception-filters',
        // 'fundamentals/lifecycle-events',
      ],
    },
    // {
    //   type: 'category',
    //   label: '🔧 高级技术',
    //   items: [
    //     'techniques/validation',
    //     'techniques/serialization',
    //     'techniques/configuration',
    //     'techniques/database',
    //     'techniques/file-upload',
    //     'techniques/async-local-storage',
    //     'techniques/performance',
    //     'techniques/security',
    //     'techniques/testing',
    //     'techniques/deployment',
    //   ],
    // },
    // {
    //   type: 'category',
    //   label: '📊 CQRS 架构',
    //   items: [
    //     'cqrs/introduction',
    //     'cqrs/commands',
    //     'cqrs/queries',
    //     'cqrs/events',
    //     'cqrs/sagas',
    //     'cqrs/event-sourcing',
    //     'cqrs/examples',
    //   ],
    // },
    // {
    //   type: 'category',
    //   label: '📄 OpenAPI 文档',
    //   items: [
    //     'openapi/introduction',
    //     'openapi/scalar-setup',
    //     'openapi/decorators',
    //     'openapi/schemas',
    //     'openapi/authentication',
    //     'openapi/custom-themes',
    //     'openapi/best-practices',
    //   ],
    // },
    // {
    //   type: 'category',
    //   label: '📝 日志系统',
    //   items: [
    //     'logging/introduction',
    //     'logging/basic-usage',
    //     'logging/configuration',
    //     'logging/context-logging',
    //     'logging/transports',
    //     'logging/structured-logging',
    //     'logging/performance',
    //   ],
    // },
    // {
    //   type: 'category',
    //   label: '🎨 示例教程',
    //   items: [
    //     'recipes/crud-application',
    //     'recipes/authentication',
    //     'recipes/authorization',
    //     'recipes/microservices',
    //     'recipes/websockets',
    //     'recipes/graphql',
    //     'recipes/prisma-integration',
    //     'recipes/real-time-chat',
    //   ],
    // },
    // {
    //   type: 'category',
    //   label: '🔌 生态系统',
    //   items: [
    //     'ecosystem/packages',
    //     'ecosystem/third-party',
    //     'ecosystem/migration-guide',
    //     'ecosystem/comparison',
    //     'ecosystem/community',
    //   ],
    // },
    // {
    //   type: 'category',
    //   label: '🛠️ CLI 工具',
    //   items: [
    //     'cli/overview',
    //     'cli/create-app',
    //     'cli/generate',
    //     'cli/build',
    //     'cli/scripts',
    //   ],
    // },
    // {
    //   type: 'category',
    //   label: '📚 API 参考',
    //   items: [
    //     'api-reference/core',
    //     'api-reference/validation',
    //     'api-reference/cqrs',
    //     'api-reference/logger',
    //     'api-reference/scalar',
    //     'api-reference/testing',
    //   ],
    // },
  ],
};

export default sidebars;

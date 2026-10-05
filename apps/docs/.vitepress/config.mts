import { defineConfig } from 'vitepress';

const REPO = 'https://github.com/aqz236/hestjs';

export default defineConfig({
  lang: 'zh-CN',
  title: 'HestJS',
  description: '把 Hono 组织起来，而不是替掉它',
  base: '/hestjs/',
  cleanUrls: true,
  head: [
    ['link', { rel: 'icon', href: '/hestjs/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#1e293b' }],
  ],

  themeConfig: {
    logo: '/img/logo.svg',

    nav: [
      { text: '开始', link: '/getting-started' },
      { text: '核心', link: '/core/modules' },
      { text: '插件', link: '/plugins/validation' },
      { text: '排障', link: '/troubleshooting' },
    ],

    sidebar: [
      {
        text: '开始',
        items: [
          { text: '这是什么', link: '/intro' },
          { text: '快速开始', link: '/getting-started' },
        ],
      },
      {
        text: '开发',
        items: [
          { text: '生成一个应用', link: '/create-app' },
          { text: '写测试', link: '/testing' },
        ],
      },
      {
        text: '核心',
        items: [
          { text: '模块', link: '/core/modules' },
          { text: '依赖注入', link: '/core/dependency-injection' },
          { text: '路由', link: '/core/routing' },
          { text: '生命周期', link: '/core/lifecycle' },
        ],
      },
      {
        text: '可选插件',
        items: [
          { text: '校验', link: '/plugins/validation' },
          { text: 'OpenAPI 文档', link: '/plugins/openapi' },
          { text: 'CQRS', link: '/plugins/cqrs' },
        ],
      },
      {
        text: '排障',
        items: [{ text: '常见问题', link: '/troubleshooting' }],
      },
    ],

    socialLinks: [{ icon: 'github', link: REPO }],
    editLink: {
      pattern: `${REPO}/edit/main/apps/docs/:path`,
      text: '在 GitHub 上编辑此页',
    },
    outline: { level: [2, 3], label: '本页目录' },
    docFooter: { prev: '上一页', next: '下一页' },
    sidebarMenuLabel: '目录',
    returnToTopLabel: '回到顶部',
    darkModeSwitchLabel: '主题',
    lastUpdated: { text: '最后更新于' },

    search: { provider: 'local' },
  },
});

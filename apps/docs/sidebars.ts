import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  tutorialSidebar: [
    'intro',
    'getting-started',
    {
      type: 'category',
      label: '核心',
      collapsed: false,
      items: [
        'core/modules',
        'core/dependency-injection',
        'core/controllers',
        'core/lifecycle',
      ],
    },
    {
      type: 'category',
      label: '可选插件',
      collapsed: false,
      items: ['plugins/validation', 'plugins/openapi', 'plugins/cqrs'],
    },
    'troubleshooting',
  ],
};

export default sidebars;

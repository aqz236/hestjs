# @hestjs/scalar

HestJS Scalar API Reference Integration - Beautiful API documentation for HestJS applications

## Installation

```bash
npm install @hestjs/scalar
```

## Quick Start

```typescript
import { HestFactory } from '@hestjs/core';
import { ScalarModule } from '@hestjs/scalar';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await HestFactory.create(AppModule);
  
  // Configure Scalar API Reference
  app.useScalar({
    path: '/docs',           // Documentation path
    spec: '/openapi.json',   // OpenAPI spec endpoint
    theme: 'hest',          // Custom HestJS theme
    title: 'My API Documentation'
  });

  // Start server
  Bun.serve({
    port: 3000,
    fetch: app.hono().fetch,
  });
}

bootstrap();
```

## Features

- 🎨 Beautiful API documentation with multiple themes
- 📱 Responsive design for mobile and desktop
- 🔍 Interactive API explorer
- 📋 Copy-paste code examples
- 🌙 Dark/light mode support
- 📄 Markdown export for LLMs
- 🎯 HestJS-specific theme and branding

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `path` | `string` | `'/docs'` | Path where documentation will be served |
| `spec` | `string \| object` | - | OpenAPI specification (URL or object) |
| `theme` | `string` | `'hest'` | UI theme (`hest`, `default`, `purple`, `moon`, etc.) |
| `title` | `string` | `'API Documentation'` | Page title |
| `cdn` | `string` | - | Custom CDN URL for Scalar assets |
| `proxyUrl` | `string` | - | Proxy URL for CORS issues in development |

## Usage with OpenAPI Generation

```typescript
// Coming soon: Integration with OpenAPI generation from decorators
import { ApiProperty, ApiResponse } from '@hestjs/scalar';

@Controller('/users')
export class UserController {
  @Get('/')
  @ApiResponse({ status: 200, description: 'List of users' })
  async getUsers() {
    // ...
  }
}
```

## Themes

HestJS Scalar comes with a custom HestJS theme by default. You can also use:

- `hest` - Custom HestJS theme (default)
- `default` - Scalar default theme
- `purple` - Purple theme
- `moon` - Dark theme
- `solarized` - Solarized theme
- `none` - No theme (custom styling)

## Advanced Configuration

```typescript
app.useScalar({
  path: '/docs',
  spec: {
    openapi: '3.0.0',
    info: {
      title: 'My API',
      version: '1.0.0',
    },
    // ... your OpenAPI spec
  },
  theme: 'hest',
  customCss: `
    .scalar-app {
      --scalar-color-1: #your-brand-color;
    }
  `,
  servers: [
    { url: 'https://api.example.com', description: 'Production' },
    { url: 'http://localhost:3000', description: 'Development' }
  ]
});
```

## License

MIT

# @hest/logger

A powerful, fast, and flexible logging solution for Node.js applications, built on top of [Pino](https://github.com/pinojs/pino).

## Features

- 🚀 **High Performance** - Built on Pino, one of the fastest JSON loggers
- 🎨 **Beautiful Output** - Clean, colorized console output in development
- 🔧 **Highly Configurable** - Flexible configuration for different environments
- 📝 **TypeScript Support** - Full TypeScript support with type definitions
- 🏷️ **Structured Logging** - JSON-structured logs with custom serializers
- 🎯 **Context Support** - Add context to logs (request ID, user ID, etc.)
- 🌍 **Multiple Transports** - Console, file, and custom transport support

## Installation

```bash
npm install @hest/logger
```

## Quick Start

```typescript
import { createLogger, logger } from '@hest/logger';

// Use the global logger
logger.info('Hello world!');

// Create a named logger
const myLogger = createLogger('MyApp');
myLogger.info('Application started');

// Add context to logs
myLogger.setContext({ requestId: '123', userId: 'user456' });
myLogger.info('Processing request');
```

## API Reference

### createLogger(name?, config?)

Creates a new logger instance.

```typescript
import { createLogger } from '@hest/logger';

const logger = createLogger('MyService', {
  level: 'debug',
  // additional config options
});
```

### Global Logger

```typescript
import { logger } from '@hest/logger';

logger.info('Using global logger');
logger.error('Something went wrong', error);
```

### Log Levels

- `fatal` - Application crash
- `error` - Error conditions  
- `warn` - Warning conditions
- `info` - General information (default)
- `debug` - Debug information
- `trace` - Very detailed debug information

### Configuration

```typescript
import { createLogger, LogLevel } from '@hest/logger';

const logger = createLogger('MyApp', {
  level: LogLevel.DEBUG,
  // Custom serializers
  serializers: {
    user: (user) => ({ id: user.id, name: user.name })
  },
  // Environment-specific config is automatic
});
```

### Context Support

```typescript
// Add context that will be included in all subsequent logs
logger.setContext({ 
  requestId: '123',
  userId: 'user456' 
});

logger.info('This log will include the context');

// Create child logger with permanent context
const childLogger = logger.child({ service: 'auth' });
```

## Environment Configuration

The logger automatically configures itself based on `NODE_ENV`:

### Development
- Colorized console output
- Pretty-printed logs
- Debug level enabled

### Production  
- JSON structured logs
- File output support
- Info level (configurable)

### Test
- Minimal output
- Warn level only

## Advanced Usage

### Custom Transports

```typescript
import { createLogger, createFileTransport } from '@hest/logger';

const logger = createLogger('MyApp', {
  transport: createFileTransport({
    destination: './logs/app.log'
  })
});
```

### Multiple Transports

```typescript
import { createMultiTransport, createConsoleTransport, createFileTransport } from '@hest/logger';

const logger = createLogger('MyApp', {
  transport: createMultiTransport([
    createConsoleTransport({ colorize: true }),
    createFileTransport({ destination: './logs/app.log' })
  ])
});
```

### Custom Serializers

```typescript
const logger = createLogger('MyApp', {
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: req.headers
    }),
    error: (err) => ({
      name: err.name,
      message: err.message,
      stack: err.stack
    })
  }
});
```

## Integration with HestJS

This logger is part of the HestJS framework but can be used independently:

```typescript
import { HestFactory, logger } from '@hest/core';

// Logger is automatically available in HestJS applications
logger.info('HestJS application starting');
```

## License

MIT

## Contributing

Contributions are welcome! Please read our contributing guide for details.

## Links

- [GitHub Repository](https://github.com/aqz236/hest)
- [HestJS Framework](https://github.com/aqz236/hest)
- [Issues](https://github.com/aqz236/hest/issues)

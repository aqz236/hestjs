# 📋 日志系统

HestJS 内置高性能日志系统，支持多级别、格式化与扩展。

## 基本用法

```typescript
import { Logger } from '@hestjs/logger';

const logger = new Logger('App');
logger.info('服务启动');
logger.error('发生错误', { error });
```

## 日志级别

- info
- warn
- error
- debug

## 格式化与扩展

支持自定义格式化器与序列化器：

```typescript
import { Logger, setGlobalFormatter } from '@hestjs/logger';

setGlobalFormatter((level, message, meta) => {
  return `[${level}] ${message} ${JSON.stringify(meta)}`;
});
```

## 最佳实践

- 统一日志格式，便于排查问题
- 生产环境建议接入日志收集平台

> 📋 日志系统让你的服务可观测、可追踪。

---

下一步：CQRS 架构介绍。

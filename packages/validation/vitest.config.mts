import { createVitestConfig } from '../../vitest.shared.mts';

// 与 @hestjs/core 共用同一份 SWC 编译配置（构造函数注入需要 decoratorMetadata）
export default createVitestConfig();

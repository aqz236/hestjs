import type { JsonSchema } from '@hestjs/validation';

export interface ResponseDocumentation {
  readonly description: string;
  readonly jsonSchema?: JsonSchema;
}

export interface RouteDocumentation {
  readonly summary?: string;
  readonly description?: string;
  readonly tags?: readonly string[];
  readonly operationId?: string;
  readonly deprecated?: boolean;
  readonly responses?: Readonly<Record<string, ResponseDocumentation>>;
}

export const DOCS_META = Symbol.for('hestjs:openapi:docs');

interface DocsCarrier {
  [DOCS_META]?: Map<string | symbol, RouteDocumentation>;
}

/**
 * 给一条路由补上人看的说明。只写元数据，不参与运行。
 *
 * ```ts
 * @Get('/:id')
 * @Describe({ summary: '查单个用户', tags: ['users'] })
 * detail(c: RouteContext<'/users/:id'>) { ... }
 * ```
 */
export function Describe(documentation: RouteDocumentation): MethodDecorator {
  return (target, propertyKey) => {
    const carrier = target as DocsCarrier;
    if (!Object.hasOwn(target, DOCS_META)) {
      Object.defineProperty(target, DOCS_META, {
        value: new Map<string | symbol, RouteDocumentation>(),
        enumerable: false,
        writable: true,
        configurable: true,
      });
    }
    carrier[DOCS_META]!.set(propertyKey, documentation);
  };
}

export function readDocumentation(
  prototype: object,
  propertyKey: string | symbol,
): RouteDocumentation | undefined {
  return (prototype as DocsCarrier)[DOCS_META]?.get(propertyKey);
}

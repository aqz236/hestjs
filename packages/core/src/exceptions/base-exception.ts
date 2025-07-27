import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * 基础异常类
 */
export abstract class BaseException extends Error {
  public readonly timestamp: Date;
  public readonly path?: string;

  constructor(
    message: string,
    public readonly status: ContentfulStatusCode = 500,
    public readonly error: string = 'Internal Server Error'
  ) {
    super(message);
    this.name = this.constructor.name;
    this.timestamp = new Date();
    
    // 确保异常堆栈正确
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * 获取异常响应对象
   */
  getResponse(): Record<string, any> {
    return {
      statusCode: this.status,
      message: this.message,
      error: this.error,
      timestamp: this.timestamp.toISOString(),
      path: this.path,
    };
  }

  /**
   * 设置请求路径
   */
  setPath(path: string): this {
    (this as any).path = path;
    return this;
  }
}

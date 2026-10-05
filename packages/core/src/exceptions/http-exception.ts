import { BaseException } from './base-exception';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * HTTP 异常类
 */
export class HttpException extends BaseException {
  constructor(
    response: string | Record<string, any>,
    status: ContentfulStatusCode,
    options?: { cause?: Error; description?: string }
  ) {
    const isObject = typeof response !== 'string';

    const message = isObject
      ? response.message || 'Http Exception'
      : response;
    const error = isObject
      ? response.error || HttpException.getDefaultMessage(status)
      : HttpException.getDefaultMessage(status);

    // 结构化对象中除 message / error 之外的字段全部保留为 details，
    // 否则调用方传入的字段级错误信息（如 { field, reason }）会被静默丢弃。
    const details = isObject
      ? Object.fromEntries(
          Object.entries(response).filter(
            ([key]) => key !== 'message' && key !== 'error'
          )
        )
      : undefined;

    super(
      message,
      status,
      error,
      details && Object.keys(details).length > 0 ? details : undefined,
      options?.description
    );

    if (options?.cause) {
      this.cause = options.cause;
    }
  }

  /**
   * 获取状态码对应的默认错误消息
   */
  private static getDefaultMessage(status: ContentfulStatusCode): string {
    switch (status) {
      case 400: return 'Bad Request';
      case 401: return 'Unauthorized';
      case 403: return 'Forbidden';
      case 404: return 'Not Found';
      case 405: return 'Method Not Allowed';
      case 406: return 'Not Acceptable';
      case 408: return 'Request Timeout';
      case 409: return 'Conflict';
      case 410: return 'Gone';
      case 422: return 'Unprocessable Entity';
      case 429: return 'Too Many Requests';
      case 500: return 'Internal Server Error';
      case 501: return 'Not Implemented';
      case 502: return 'Bad Gateway';
      case 503: return 'Service Unavailable';
      case 504: return 'Gateway Timeout';
      default: return 'Error';
    }
  }
}

/**
 * 常用 HTTP 异常类
 */
export class BadRequestException extends HttpException {
  constructor(message?: string | Record<string, any>, description?: string) {
    super(message || 'Bad Request', 400, { description });
  }
}

export class UnauthorizedException extends HttpException {
  constructor(message?: string | Record<string, any>, description?: string) {
    super(message || 'Unauthorized', 401, { description });
  }
}

export class ForbiddenException extends HttpException {
  constructor(message?: string | Record<string, any>, description?: string) {
    super(message || 'Forbidden', 403, { description });
  }
}

export class NotFoundException extends HttpException {
  constructor(message?: string | Record<string, any>, description?: string) {
    super(message || 'Not Found', 404, { description });
  }
}

export class ConflictException extends HttpException {
  constructor(message?: string | Record<string, any>, description?: string) {
    super(message || 'Conflict', 409, { description });
  }
}

export class UnprocessableEntityException extends HttpException {
  constructor(message?: string | Record<string, any>, description?: string) {
    super(message || 'Unprocessable Entity', 422, { description });
  }
}

export class InternalServerErrorException extends HttpException {
  constructor(message?: string | Record<string, any>, description?: string) {
    super(message || 'Internal Server Error', 500, { description });
  }
}

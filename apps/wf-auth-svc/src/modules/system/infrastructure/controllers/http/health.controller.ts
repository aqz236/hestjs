import { ResponseHelper } from '@develop-x/nest-response';
import { Controller, Get } from '@hestjs/core';
import { StatusCodes, getReasonPhrase } from 'http-status-codes';

// 路由前缀
@Controller('system')
export class HealthController {
  constructor(private readonly R: ResponseHelper) {}

  @Get('health')
  heartbeat() {
    console.log('Health check endpoint hit');

    return this.R.success(
      {
        message: 'Healthy11',
      },
      getReasonPhrase(StatusCodes.OK),
      StatusCodes.OK,
    );
  }
}

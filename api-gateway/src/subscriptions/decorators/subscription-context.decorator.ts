import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface SubscriptionContext {
  userId: string;
  planName: string;
  subscriptionId: string | null;
  remaining: number;
  answerTimeLimitSeconds: number | null;
  facialAnalysisEnabled: boolean;
}

export const SubscribeCtx = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): SubscriptionContext => {
    const request = ctx.switchToHttp().getRequest();
    return request.subscriptionContext;
  },
);

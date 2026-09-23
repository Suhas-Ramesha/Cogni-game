import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthPrincipal } from './auth.service';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthPrincipal => {
  return ctx.switchToHttp().getRequest().user;
});

import {
	Injectable,
	CanActivate,
	ExecutionContext,
	UnauthorizedException,
	ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from 'src/decorators/roles.decorator';
import { Role } from 'src/enums/roles.enum';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class RolesGuard implements CanActivate {
	constructor(
		private reflector: Reflector,
		private i18n: I18nService,
	) {}

	canActivate(context: ExecutionContext): boolean {
		const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
			context.getHandler(),
			context.getClass(),
		]);
		if (!requiredRoles) {
			return true;
		}
		const req = context.switchToHttp().getRequest();
		const user = context.switchToHttp().getRequest().user;
		if (!user) {
			throw new UnauthorizedException(
				this.i18n.translate('exceptions.auth.AUTHENTICATION_REQUIRED', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
		const hasRole = requiredRoles.some((role) => user.role === role);
		if (!hasRole) {
			throw new ForbiddenException(
				this.i18n.translate('exceptions.auth.ACCESS_DENIED', {
					lang: I18nContext.current()?.lang,
					args: { roles: requiredRoles.join(', ') },
				}),
			);
		}
		return true;
	}
}

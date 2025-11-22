import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/JwtPayload';
import { Role } from 'src/enums/roles.enum';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AppCacheService } from 'src/cache/cache.service';
import { CacheKeys } from 'src/cache/cache-keys.util';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private config: ConfigService,
		private jwtService: JwtService,
		private i18n: I18nService,
		private cache: AppCacheService,
	) {}

	async getAccessToken(payload: JwtPayload) {
		return this.jwtService.signAsync(payload, {
			secret: this.config.get<string>('JWT_ACCESS_SECRET'),
			expiresIn: this.config.get('JWT_ACCESS_EXPIRATION') || '1m',
		});
	}

	async getRefreshToken(payload: JwtPayload) {
		return this.jwtService.signAsync(payload, {
			secret: this.config.get<string>('JWT_REFRESH_SECRET'),
			expiresIn: this.config.get('JWT_REFRESH_EXPIRATION') || '7d',
		});
	}

	async register(dto: RegisterDto) {
		const userEmail = dto.email;
		const exit = await this.prisma.user.findUnique({
			where: { email: userEmail },
		});

		if (exit) {
			throw new ConflictException(
				await this.i18n.translate('exceptions.user.USER_ALREADY_EXISTS', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// getting the hashing salt
		const salt = parseInt(this.config.get('BCRYPT_SALT_ROUNDS') || '10', 10);

		// getting the user password (plain text)
		const password = dto.password;
		// hash the password using bcrypt
		const hashedPassword = await bcrypt.hash(password, salt);

		// creating the user object to the database,
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				password: hashedPassword,
				name: dto.name,
				phone: dto.phone,
				role: dto.role ?? Role.USER,
			},
			select: {
				// don't return the user password
				password: false,
				id: true,
				email: true,
				name: true,
				phone: true,
				role: true,
				createdAt: true,
			},
		});

		// issue tokens
		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};

		const accessToken = await this.getAccessToken(payload);

		const refreshPayload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};
		const refreshToken = await this.getRefreshToken(refreshPayload);

		// store hashed refresh token
		const hashedRefresh = await bcrypt.hash(refreshToken, salt);
		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: hashedRefresh },
		});

		return {
			message: await this.i18n.translate('messages.auth.REGISTRATION_SUCCESS', {
				lang: I18nContext.current()?.lang,
			}),
			user,
			accessToken,
			refreshToken,
		};
	}

	async login(email: string, password: string) {
		const user = await this.prisma.user.findUnique({ where: { email: email } });

		if (!user) {
			throw new UnauthorizedException(
				await this.i18n.translate('exceptions.auth.INVALID_CREDENTIALS', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match)
			throw new UnauthorizedException(
				await this.i18n.translate('exceptions.auth.INVALID_CREDENTIALS', {
					lang: I18nContext.current()?.lang,
				}),
			);

		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};
		const accessToken = await this.getAccessToken(payload);

		const refreshPayload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};
		const refreshToken = await this.getRefreshToken(refreshPayload);

		const saltRounds = parseInt(
			this.config.get('BCRYPT_SALT_ROUNDS') || '10',
			10,
		);
		const hashedRefresh = await bcrypt.hash(refreshToken, saltRounds);

		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: hashedRefresh },
		});

		return {
			message: await this.i18n.translate('messages.auth.LOGIN_SUCCESS', {
				lang: I18nContext.current()?.lang,
			}),
			accessToken: accessToken,
			refreshToken: refreshToken,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				phone: user.phone,
				role: user.role,
			},
		};
	}

	async logout(userId: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { refreshToken: null },
		});

		// Invalidate user cache
		await this.cache.del(CacheKeys.userProfile(userId));
		await this.cache.del(CacheKeys.userTokens(userId));

		return {
			message: await this.i18n.translate('messages.auth.LOGOUT_SUCCESS', {
				lang: I18nContext.current()?.lang,
			}),
		};
	}

	async refreshTokens(userId: string, refreshToken: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user || !user.refreshToken)
			throw new UnauthorizedException(
				await this.i18n.translate('exceptions.auth.UNAUTHORIZED', {
					lang: I18nContext.current()?.lang,
				}),
			);

		const matches = await bcrypt.compare(refreshToken, user.refreshToken);
		if (!matches)
			throw new UnauthorizedException(
				await this.i18n.translate('exceptions.auth.UNAUTHORIZED', {
					lang: I18nContext.current()?.lang,
				}),
			);

		const payload = { sub: user.id, email: user.email, role: user.role };
		const accessToken = await this.getAccessToken(payload);
		const newRefreshToken = await this.getRefreshToken(payload);
		const saltRounds = parseInt(
			this.config.get('BCRYPT_SALT_ROUNDS') || '10',
			10,
		);
		const hashedRefresh = await bcrypt.hash(newRefreshToken, saltRounds);

		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: hashedRefresh },
		});

		return {
			message: await this.i18n.translate('messages.auth.TOKEN_REFRESHED', {
				lang: I18nContext.current()?.lang,
			}),
			accessToken,
			refreshToken: newRefreshToken,
		};
	}

	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
	) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException(
				await this.i18n.translate('exceptions.user.USER_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		const passwordMatches = await bcrypt.compare(currentPassword, user.password);

		if (!passwordMatches) {
			throw new UnauthorizedException(
				await this.i18n.translate('exceptions.auth.CURRENT_PASSWORD_INCORRECT', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		const saltRounds = parseInt(
			this.config.get('BCRYPT_SALT_ROUNDS') || '10',
			10,
		);
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		await this.prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword, refreshToken: null },
		});

		// Invalidate user cache
		await this.cache.del(CacheKeys.userProfile(userId));
		await this.cache.del(CacheKeys.userTokens(userId));
		await this.cache.del(CacheKeys.userByEmail(user.email));

		return {
			message: await this.i18n.translate('messages.auth.PASSWORD_CHANGED', {
				lang: I18nContext.current()?.lang,
			}),
		};
	}
}

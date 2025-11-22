import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { UpdateProfileDto } from './dto';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { AppCacheService } from 'src/cache/cache.service';
import { CacheKeys } from 'src/cache/cache-keys.util';

@Injectable()
export class UserService {
	constructor(
		private prisma: PrismaService,
		private i18n: I18nService,
		private cache: AppCacheService,
	) {}

	async updateProfile(userId: string, dto: UpdateProfileDto) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.user.USER_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		const updatedUser = await this.prisma.user.update({
			where: { id: userId },
			data: {
				...(dto.name && { name: dto.name }),
				...(dto.phone && { phone: dto.phone }),
			},
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		// Invalidate user cache
		await this.cache.del(CacheKeys.userProfile(userId));
		await this.cache.del(CacheKeys.userByEmail(user.email));

		return {
			message: await this.i18n.translate('messages.user.PROFILE_UPDATED', {
				lang: I18nContext.current()?.lang,
			}),
			user: updatedUser,
		};
	}

	async getProfile(userId: string) {
		// Check cache first
		const cacheKey = CacheKeys.userProfile(userId);
		const cached = await this.cache.get(cacheKey);
		if (cached) {
			return {
				message: await this.i18n.translate('messages.user.PROFILE_RETRIEVED', {
					lang: I18nContext.current()?.lang,
				}),
				user: cached,
			};
		}

		const user = await this.prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				email: true,
				name: true,
				phone: true,
				role: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		if (!user) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.user.USER_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// Cache for 10 minutes
		await this.cache.set(cacheKey, user, 600000);

		return {
			message: await this.i18n.translate('messages.user.PROFILE_RETRIEVED', {
				lang: I18nContext.current()?.lang,
			}),
			user,
		};
	}
}

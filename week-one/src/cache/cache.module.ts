import { Global, Module, NotFoundException } from '@nestjs/common';
import { AppCacheService } from './cache.service';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis, { Keyv } from '@keyv/redis';
import { CacheableMemory } from 'cacheable';
import * as redisStore from 'cache-manager-redis-store';

@Global()
@Module({
	imports: [
		CacheModule.registerAsync({
			useFactory: async () => {
				return {
					stores: [
						new KeyvRedis('redis://localhost:6379'),
					],
				};
			},
		}),
	],
	providers: [AppCacheService],
	exports: [AppCacheService, CacheModule],
})
export class AppCacheModule {}

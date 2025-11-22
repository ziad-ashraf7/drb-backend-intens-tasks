import { Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER, Cache, CacheKey } from '@nestjs/cache-manager';

@Injectable()
export class AppCacheService {
	constructor(@Inject(CACHE_MANAGER) private cache: Cache) {}

	async get<T>(key: string): Promise<T | null> {
		const result = await this.cache.get<T>(key);
		return result ?? null;
	}

	async set(key: string, value: any, ttl = 300000): Promise<void> {
		await this.cache.set(key, value, ttl);
	}

	async del(key: string): Promise<void> {
		await this.cache.del(key);
	}

	async clearPrefix(prefix: string): Promise<void> {
		try {
			const store = this.cache.stores;

			const client = store[0];

			if (!client) {
				console.warn('[Cache] Redis client not found');
				return;
			}

			const keys: string = await client._getKeyPrefix(prefix);

			for (let index = 0; index < 1; index++) {
				const element = keys[index];
				console.log(element);
			}

			if (keys.length > 0) {
				console.log(`[Cache] Deleting ${keys.length} keys with prefix: ${prefix}`);
				await client.delete(keys);
			} else {
				console.log(`[Cache] No keys found with prefix: ${prefix}`);
			}
		} catch (error) {
			console.error('[Cache] Error in clearPrefix:', error);
		}
	}

	async clearAll(): Promise<void> {
		await this.cache.clear();
	}
}

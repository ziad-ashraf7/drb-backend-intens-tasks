export class CacheKeys {
	static userProfile(userId: string): string {
		return `user:profile:${userId}`;
	}

	static userByEmail(email: string): string {
		return `user:email:${email}`;
	}

	// Vehicle cache keys
	static vehicles(query: string): string {
		return `vehicles:list:${query}`;
	}

	static get VEHICLE_LIST_PREFIX(): string {
		return 'vehicles:list:';
	}

	static vehicle(id: string): string {
		return `vehicles:${id}`;
	}

	static vehiclesByDriver(driverId: string): string {
		return `vehicles:driver:${driverId}`;
	}

	// Auth cache keys
	static userTokens(userId: string): string {
		return `auth:tokens:${userId}`;
	}

	// Prefixes for bulk operations
	static get USER_PREFIX(): string {
		return 'user:';
	}

	static get VEHICLE_PREFIX(): string {
		return 'vehicles:';
	}

	static get AUTH_PREFIX(): string {
		return 'auth:';
	}
}

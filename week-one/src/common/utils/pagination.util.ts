import {
	PaginatedResult,
	PaginationMeta,
} from '../interfaces/pagination.interface';

export class PaginationUtil {
	static paginate<T>(
		data: T[],
		total: number,
		page: number,
		limit: number,
	): PaginatedResult<T> {
		const totalPages = Math.ceil(total / limit);

		const meta: PaginationMeta = {
			totalItems: total,
			currentPage: page,
			itemsPerPage: limit,
			totalPages,
			hasNextPage: page < totalPages,
			hasPreviousPage: page > 1,
		};

		return {
			data,
			meta,
		};
	}

	static getSkip(page: number, limit: number): number {
		return (page - 1) * limit;
	}
}

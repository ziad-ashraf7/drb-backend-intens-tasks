export interface PaginationMeta {
	totalItems: number;
	currentPage: number;
	itemsPerPage: number;
	totalPages: number;
	hasNextPage: boolean;
	hasPreviousPage: boolean;
}

export interface PaginatedResult<T> {
	data: T[];
	meta: PaginationMeta;
}

export interface PaginationParams {
	page?: number;
	limit?: number;
	sortBy?: string;
	sortOrder?: 'asc' | 'desc';
}

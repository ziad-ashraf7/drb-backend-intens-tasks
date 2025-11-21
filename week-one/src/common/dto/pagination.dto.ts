import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, Max, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class PaginationDto {
	@ApiPropertyOptional({ default: 1, minimum: 1 })
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: i18nValidationMessage('validation.common.IS_INT') })
	@Min(1, { message: i18nValidationMessage('validation.vehicle.PAGE_MIN') })
	page?: number = 1;

	@ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
	@IsOptional()
	@Type(() => Number)
	@IsInt({ message: i18nValidationMessage('validation.common.IS_INT') })
	@Min(1, { message: i18nValidationMessage('validation.vehicle.LIMIT_MIN') })
	@Max(100, {
		message: i18nValidationMessage('validation.vehicle.LIMIT_MAX', {
			args: { max: 100 },
		}),
	})
	limit?: number = 10;

	@ApiPropertyOptional({ default: 'createdAt' })
	@IsOptional()
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	sortBy?: string = 'createdAt';

	@ApiPropertyOptional({ enum: ['asc', 'desc'], default: 'desc' })
	@IsOptional()
	@IsIn(['asc', 'desc'], {
		message: i18nValidationMessage('validation.vehicle.SORT_ORDER_INVALID'),
	})
	sortOrder?: 'asc' | 'desc' = 'desc';
}

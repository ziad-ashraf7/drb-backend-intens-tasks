import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class VehicleQueryDto extends PaginationDto {
	@ApiPropertyOptional({ description: 'Filter by vehicle type' })
	@IsOptional()
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	type?: string;

	@ApiPropertyOptional({ description: 'Filter by manufacturer' })
	@IsOptional()
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	manufacturer?: string;

	@ApiPropertyOptional({
		enum: ['true', 'false'],
		description: 'Filter by assignment status',
	})
	@IsOptional()
	@IsIn(['true', 'false'], {
		message: i18nValidationMessage('validation.vehicle.ASSIGNED_INVALID'),
	})
	assigned?: 'true' | 'false';
}

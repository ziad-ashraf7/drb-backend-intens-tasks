import { IsOptional, IsString, IsIn } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class VehicleQueryDto extends PaginationDto {
	@ApiPropertyOptional({ description: 'Filter by vehicle type' })
	@IsOptional()
	@IsString()
	type?: string;

	@ApiPropertyOptional({ description: 'Filter by manufacturer' })
	@IsOptional()
	@IsString()
	manufacturer?: string;

	@ApiPropertyOptional({
		enum: ['true', 'false'],
		description: 'Filter by assignment status',
	})
	@IsOptional()
	@IsIn(['true', 'false'])
	assigned?: 'true' | 'false';
}

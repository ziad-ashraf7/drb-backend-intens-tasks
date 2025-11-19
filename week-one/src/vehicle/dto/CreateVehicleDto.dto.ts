import {
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';

export class CreateVehicleDto {
	@IsString()
	@IsNotEmpty()
	plateNumber: string;

	@IsString()
	@IsNotEmpty()
	model: string;

	@IsString()
	@IsNotEmpty()
	manufacturer: string;

	@Min(1980)
	@Max(new Date().getFullYear() + 1)
	@IsNumber()
	@IsNotEmpty()
	year: number;

	@IsString()
	@IsNotEmpty()
	type: string;

	// ---- Optional Data ----
	@IsString()
	@IsOptional()
	simNumber?: string;

	@IsString()
	@IsOptional()
	deviceId?: string;

	@IsMongoId()
	@IsOptional()
	driverId?: string;
}

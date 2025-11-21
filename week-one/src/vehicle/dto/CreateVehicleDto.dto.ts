import { ApiPropertyOptional } from '@nestjs/swagger';
import {
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsOptional,
	IsString,
	Max,
	Min,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

const NEXT_YEAR = new Date().getFullYear() + 1;

export class CreateVehicleDto {
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@IsNotEmpty({
		message: i18nValidationMessage('validation.vehicle.PLATE_NUMBER_REQUIRED'),
	})
	plateNumber: string;

	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@IsNotEmpty({
		message: i18nValidationMessage('validation.vehicle.MODEL_REQUIRED'),
	})
	model: string;

	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@IsNotEmpty({
		message: i18nValidationMessage('validation.vehicle.MANUFACTURER_REQUIRED'),
	})
	manufacturer: string;

	@Min(1980, {
		message: i18nValidationMessage('validation.vehicle.YEAR_MIN', {
			args: { min: 1980 },
		}),
	})
	@Max(NEXT_YEAR, {
		message: i18nValidationMessage('validation.vehicle.YEAR_MAX', {
			args: { currentYear: NEXT_YEAR },
		}),
	})
	@IsNumber(
		{},
		{ message: i18nValidationMessage('validation.vehicle.YEAR_NUMBER') },
	)
	@IsNotEmpty({
		message: i18nValidationMessage('validation.vehicle.YEAR_REQUIRED'),
	})
	year: number;

	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@IsNotEmpty({
		message: i18nValidationMessage('validation.vehicle.TYPE_REQUIRED'),
	})
	type: string;

	// ---- Optional Data ----
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@IsOptional()
	simNumber?: string;

	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@IsOptional()
	deviceId?: string;

	@IsMongoId({
		message: i18nValidationMessage('validation.common.IS_MONGO_ID'),
	})
	@IsOptional()
	driverId?: string;
}

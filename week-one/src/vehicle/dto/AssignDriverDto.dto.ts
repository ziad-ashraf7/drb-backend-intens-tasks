import { IsMongoId, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { i18nValidationMessage } from 'nestjs-i18n';

export class AssignDriverDto {
	@ApiProperty({ description: 'Driver ID to assign to the vehicle' })
	@IsNotEmpty({
		message: i18nValidationMessage('validation.vehicle.DRIVER_ID_REQUIRED'),
	})
	@IsMongoId({
		message: i18nValidationMessage('validation.common.IS_MONGO_ID'),
	})
	driverId: string;
}

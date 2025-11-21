import { IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class UpdateProfileDto {
	@IsOptional()
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	name?: string;

	@IsOptional()
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	phone?: string;
}

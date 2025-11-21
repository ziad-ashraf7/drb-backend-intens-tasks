import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class ChangePasswordDto {
	@IsNotEmpty({
		message: i18nValidationMessage('validation.auth.CURRENT_PASSWORD_REQUIRED'),
	})
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	currentPassword: string;

	@IsNotEmpty({
		message: i18nValidationMessage('validation.auth.NEW_PASSWORD_REQUIRED'),
	})
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@MinLength(8, {
		message: i18nValidationMessage('validation.auth.NEW_PASSWORD_MIN_LENGTH', {
			args: { min: 8 },
		}),
	})
	newPassword: string;
}

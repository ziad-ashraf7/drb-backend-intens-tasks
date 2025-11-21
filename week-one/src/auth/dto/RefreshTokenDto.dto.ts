import { IsNotEmpty, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';

export class RefreshTokenDto {
	@IsNotEmpty({
		message: i18nValidationMessage('validation.auth.REFRESH_TOKEN_REQUIRED'),
	})
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	refreshToken: string;

	@IsNotEmpty({
		message: i18nValidationMessage('validation.auth.USER_ID_REQUIRED'),
	})
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	userId: string;
}

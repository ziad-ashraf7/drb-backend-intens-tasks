import { ApiProperty } from '@nestjs/swagger';
import {
	IsEmail,
	IsEnum,
	IsNotEmpty,
	IsOptional,
	IsString,
	MinLength,
} from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from 'src/enums/roles.enum';

const ROLE_VALUES = Object.values(Role).join(', ');

export class RegisterDto {
	@ApiProperty()
	@IsEmail({}, { message: i18nValidationMessage('validation.common.IS_EMAIL') })
	@IsNotEmpty({
		message: i18nValidationMessage('validation.auth.EMAIL_REQUIRED'),
	})
	email: string;

	@IsNotEmpty({
		message: i18nValidationMessage('validation.auth.PASSWORD_REQUIRED'),
	})
	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	@MinLength(8, {
		message: i18nValidationMessage('validation.auth.PASSWORD_MIN_LENGTH', {
			args: { min: 8 },
		}),
	})
	password: string;

	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	name: string;

	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	phone?: string;

	@IsOptional()
	@IsEnum(Role, {
		message: i18nValidationMessage('validation.auth.ROLE_INVALID', {
			args: { roles: ROLE_VALUES },
		}),
	})
	role: Role;
}

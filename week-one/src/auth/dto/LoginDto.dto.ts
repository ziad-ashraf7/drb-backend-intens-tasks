import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { i18nValidationMessage } from 'nestjs-i18n';
import { Role } from 'src/enums/roles.enum';

const ROLE_VALUES = Object.values(Role).join(', ');

export class LoginDto {
	@IsEmail({}, { message: i18nValidationMessage('validation.common.IS_EMAIL') })
	email: string;

	@IsString({
		message: i18nValidationMessage('validation.common.IS_STRING'),
	})
	password: string;

	@IsOptional()
	@IsEnum(Role, {
		message: i18nValidationMessage('validation.auth.ROLE_INVALID', {
			args: { roles: ROLE_VALUES },
		}),
	})
	role: Role;
}

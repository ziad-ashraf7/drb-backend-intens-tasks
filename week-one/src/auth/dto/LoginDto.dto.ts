import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString } from 'class-validator';
import { Role } from 'src/enums/roles.enum';
export class LoginDto {
	@IsEmail()
	email: string;

	@IsString()
	password: string;

	@ApiProperty({ enum: Role })
	@IsOptional()
	@IsEnum(Role)
	role: Role;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";
import { Role } from "src/enums/roles.enum";

export class RegisterDto {
	@ApiProperty()
	@IsEmail()
	@IsNotEmpty()
	email: string;

	@ApiProperty()
	@IsNotEmpty()
	@IsString()
	@MinLength(8)
	password: string;

	@ApiProperty()
	@IsString()
	name: string;

	@ApiProperty()
	@IsString()
	phone?: string;

	@ApiProperty({ enum: Role })
	@IsOptional()
	@IsEnum(Role)
	role: Role;
}

import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

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
}

import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class RegisterDto {
    @IsEmail()
    @IsNotEmpty()
	email: string;

    @IsNotEmpty()
    @IsString()
    @MinLength(8)
	password: string;

    @IsString()
    
	name: string;
	phone?: string;
}

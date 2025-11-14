import {
	Controller,
	Post,
	Body,
	UseGuards,
	Request,
	Get,
	Patch,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('register')
	async register(@Body() dto: RegisterDto) {
        console.log(dto);
		return this.authService.register(dto);
	}

	@Post('login')
	async login(@Body() dto: LoginDto) {
        console.log(dto);
		return this.authService.login(dto.email, dto.password);

	}


}

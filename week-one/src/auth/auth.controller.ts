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
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RtAuthGuard } from './guards/rt-auth.guard';
import { ChangePasswordDto, RefreshTokenDto } from './dto';

@Controller('auth')
export class AuthController {
	constructor(private authService: AuthService) {}

	@Post('register')
	async register(@Body() dto: RegisterDto) {
		return this.authService.register(dto);
	}

	@Post('login')
	async login(@Body() dto: LoginDto) {
		return this.authService.login(dto.email, dto.password);
	}

	@UseGuards(JwtAuthGuard)
	@Patch('change-password')
	async changePassword(@Request() req, @Body() dto: ChangePasswordDto) {
		return this.authService.changePassword(
			req.user.sub,
			dto.currentPassword,
			dto.newPassword,
		);
	}

	
	@UseGuards(RtAuthGuard)
	@Post('refresh')
	async refresh(@Request() req, @Body() dto: RefreshTokenDto) {
		return this.authService.refreshTokens(req.user.sub, req.user.refreshToken);
	}

	@UseGuards(JwtAuthGuard)
	@Post('logout')
	async logout(@Request() req) {
		return this.authService.logout(req.user.sub);
	}
}

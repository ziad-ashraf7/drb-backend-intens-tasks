import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interfaces/JwtPayload';
import { Role } from 'src/enums/roles.enum';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private config: ConfigService,
		private jwtService: JwtService,
	) {}

	async getAccessToken(payload: JwtPayload) {
		return this.jwtService.signAsync(payload, {
			secret: this.config.get<string>('JWT_ACCESS_SECRET'),
			expiresIn: this.config.get('JWT_ACCESS_EXPIRATION') || '1m',
		});
	}

	async getRefreshToken(payload: JwtPayload) {
		return this.jwtService.signAsync(payload, {
			secret: this.config.get<string>('JWT_REFRESH_SECRET'),
			expiresIn: this.config.get('JWT_REFRESH_EXPIRATION') || '7d',
		});
	}

	async register(dto: RegisterDto) {
		// check if the user allready exit (email)
		const userEmail = dto.email;
		const exit = await this.prisma.user.findUnique({
			where: { email: userEmail },
		});

		if (exit) {
			throw new ConflictException('User already exit');
		}
		// if not exite, then go throgh the creating user process ...

		// getting the hashing salt
		const salt = parseInt(this.config.get('BCRYPT_SALT_ROUNDS') || '10', 10);


		// getting the user password (plain text)
		const password = dto.password;
		// hash the password using bcrypt
		const hashedPassword = await bcrypt.hash(password, salt);

		// creating the user object to the database,
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				password: hashedPassword,
				name: dto.name,
				phone: dto.phone,
				role: dto.role ?? Role.USER,
			},
			select: {
				// don't return the user password
				password: false,
				id: true,
				email: true,
				name: true,
				phone: true,
				role: true,
				createdAt: true,
			},
		});

		// issue tokens
		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};

		const accessToken = await this.getAccessToken(payload);

		const refreshPayload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};
		const refreshToken = await this.getRefreshToken(refreshPayload);

		// store hashed refresh token
		const hashedRefresh = await bcrypt.hash(refreshToken, salt);
		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: hashedRefresh },
		});

		return { user, accessToken, refreshToken };
	}

	async validateUser(email: string, pass: string) {}

	async login(email: string, password: string) {
		// search if the user exit
		const user = await this.prisma.user.findUnique({ where: { email: email } });
		// if not , throw a unathorized exception
		if (!user) {
			throw new UnauthorizedException('Invalid credentials');
		}

		const match = await bcrypt.compare(password, user.password);
		if (!match) throw new UnauthorizedException('Invalid credentials');

		const payload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};
		const accessToken = await this.getAccessToken(payload);

		const refreshPayload: JwtPayload = {
			sub: user.id,
			email: user.email,
			role: user.role,
		};
		const refreshToken = await this.getRefreshToken(refreshPayload);

		const saltRounds = parseInt(
			this.config.get('BCRYPT_SALT_ROUNDS') || '10',
			10,
		);
		const hashedRefresh = await bcrypt.hash(refreshToken, saltRounds);

		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: hashedRefresh },
		});

		// else return the user
		return {
			accessToken: accessToken,
			refreshToken: refreshToken,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				phone: user.phone,
				role: user.role,
			},
		};
	}

	async logout(userId: string) {
		await this.prisma.user.update({
			where: { id: userId },
			data: { refreshToken: null },
		});
		return { message: 'Logged out' };
	}

	async refreshTokens(userId: string, refreshToken: string) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user || !user.refreshToken) throw new UnauthorizedException();

		const matches = await bcrypt.compare(refreshToken, user.refreshToken);
		if (!matches) throw new UnauthorizedException();

		const payload = { sub: user.id, email: user.email, role: user.role };
		const accessToken = await this.getAccessToken(payload);
		const newRefreshToken = await this.getRefreshToken(payload);
		const saltRounds = parseInt(
			this.config.get('BCRYPT_SALT_ROUNDS') || '10',
			10,
		);
		const hashedRefresh = await bcrypt.hash(newRefreshToken, saltRounds);

		await this.prisma.user.update({
			where: { id: user.id },
			data: { refreshToken: hashedRefresh },
		});

		return { accessToken, refreshToken: newRefreshToken };
	}

	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
	) {
		const user = await this.prisma.user.findUnique({
			where: { id: userId },
		});

		if (!user) {
			throw new UnauthorizedException('User not found');
		}

		const passwordMatches = await bcrypt.compare(currentPassword, user.password);

		if (!passwordMatches) {
			throw new UnauthorizedException('Current password is incorrect');
		}

		const saltRounds = parseInt(
			this.config.get('BCRYPT_SALT_ROUNDS') || '10',
			10,
		);
		const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

		await this.prisma.user.update({
			where: { id: userId },
			data: { password: hashedPassword, refreshToken: null },
		});

		return { message: 'Password changed successfully' };
	}
}

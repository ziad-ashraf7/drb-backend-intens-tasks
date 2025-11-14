import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/prisma/prisma.service';
import { RegisterDto } from './dto';

@Injectable()
export class AuthService {
	constructor(
		private prisma: PrismaService,
		private config: ConfigService,
	) {}

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

		console.log(typeof salt);

		// getting the user password (plain text)
		const password = dto.password;
		// hash the password using bcrypt
		const hashedPassword = await bcrypt.hash(password, salt);
		console.log(hashedPassword);

		// creating the user object to the database,
		const user = await this.prisma.user.create({
			data: {
				email: dto.email,
				password: hashedPassword,
				name: dto.name,
				phone: dto.phone,
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

		// returning the user
		return user;
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
		// else return the user
		return {
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				phone: user.phone,
				role: user.role,
			},
		};
	}

	async logout(userId: string) {}

	async changePassword(
		userId: string,
		currentPassword: string,
		newPassword: string,
	) {}
}

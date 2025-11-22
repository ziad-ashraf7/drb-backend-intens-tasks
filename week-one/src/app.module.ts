import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from './user/user.module';
import { VehicleModule } from './vehicle/vehicle.module';
import { AcceptLanguageResolver, HeaderResolver, I18nModule, QueryResolver } from 'nestjs-i18n';
import { AppCacheModule } from './cache/cache.module';
import * as path from 'path';
@Module({
	imports: [
		I18nModule.forRootAsync({
			useFactory: (configService: ConfigService) => ({
				fallbackLanguage: 'en',
				loaderOptions: {
					path: path.join(__dirname, '/i18n/'),
					watch: true,
				},
			}),
			resolvers: [
				{ use: QueryResolver, options: ['lang'] },
				AcceptLanguageResolver,
				new HeaderResolver(['x-lang']),
			],
			inject: [ConfigService],
		}),
		PrismaModule,
		AuthModule,
		ConfigModule.forRoot({ isGlobal: true }),
		UserModule,
		VehicleModule,
		AppCacheModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}

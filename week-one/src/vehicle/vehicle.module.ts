import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { AppCacheService } from 'src/cache/cache.service';

@Module({
	providers: [VehicleService, AppCacheService],
	controllers: [VehicleController],
})
export class VehicleModule {}

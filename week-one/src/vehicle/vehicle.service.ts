import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateVehicleDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { NotFoundError } from 'rxjs';

@Injectable()
export class VehicleService {
	constructor(private prisma: PrismaService) {}

	GetVehicleById(id: string) {
		throw new Error('Method not implemented.');
	}
	GetAllVehicles() {
		throw new Error('Method not implemented.');
	}
	async CreateVehicle(dto: CreateVehicleDto) {
		// check if exite before
		const exite = await this.prisma.vehicle.findFirst({where: {plateNumber: dto.plateNumber}});
		
		// if yes, throw conflict error
		if(exite){
			throw new ConflictException({message: "this vehicle is already exit"});
		}

		// if not , then check about the driver if his id is correct or no
		const driverId = dto.driverId;
		if(driverId && !(await this.prisma.user.findFirst({where: {id: driverId}}))){
			// if not , throw not found error
			throw new NotFoundException({ message: "Can't find this driver" });
		}
		// if yes, then create a new vehicle
		const vehicle = await this.prisma.vehicle.create({
			data: {
				plateNumber: dto.plateNumber,
				model: dto.model,
				manufacturer: dto.manufacturer,
				year: dto.year,
				type: dto.type,
				simNumber: dto.simNumber || '',
				deviceId: dto.deviceId || '',
				driver: dto.driverId ? { connect: { id: dto.driverId } } : undefined,
			},
		});
		return vehicle;
	}
}

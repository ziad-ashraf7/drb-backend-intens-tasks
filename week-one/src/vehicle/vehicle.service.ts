import {
	BadRequestException,
	ConflictException,
	Injectable,
	NotFoundException,
} from '@nestjs/common';
import { CreateVehicleDto, VehicleQueryDto } from './dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { PaginationUtil } from 'src/common/utils/pagination.util';
import { PaginatedResult } from 'src/common/interfaces/pagination.interface';
import { Vehicle } from '@prisma/client';
import { UpdateVehicleDto } from './dto/UpdateVehicleDto.dto';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class VehicleService {
	constructor(
		private prisma: PrismaService,
		private i18n: I18nService,
	) {}

	async updateVehicle(id: string, dto: UpdateVehicleDto) {
		// Check if the vehicle exists
		const vehicle = await this.prisma.vehicle.findUnique({ where: { id } });

		if (!vehicle) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.vehicle.VEHICLE_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
					args: { id },
				}),
			);
		}

		// If driverId is explicitly provided in the DTO, validate the driver
		if (dto.driverId) {
			// Check if driver exists
			const driver = await this.prisma.user.findUnique({
				where: { id: dto.driverId },
			});

			if (!driver) {
				throw new NotFoundException(
					await this.i18n.translate('exceptions.driver.DRIVER_NOT_FOUND', {
						lang: I18nContext.current()?.lang,
						args: { id: dto.driverId },
					}),
				);
			}

			// Check if driver is already assigned to another vehicle
			const assignedVehicle = await this.prisma.vehicle.findFirst({
				where: {
					driverId: dto.driverId,
					NOT: { id }, // Exclude current vehicle
				},
			});

			if (assignedVehicle) {
				throw new ConflictException(
					await this.i18n.translate('exceptions.driver.DRIVER_ALREADY_ASSIGNED', {
						lang: I18nContext.current()?.lang,
						args: { plateNumber: assignedVehicle.plateNumber },
					}),
				);
			}
		}

		// Update the vehicle (only with provided fields)
		const updatedVehicle = await this.prisma.vehicle.update({
			where: { id },
			data: dto,
			include: {
				driver: {
					select: { id: true, name: true, email: true, phone: true },
				},
			},
		});

		return {
			message: await this.i18n.translate('messages.vehicle.VEHICLE_UPDATED', {
				lang: I18nContext.current()?.lang,
			}),
			vehicle: updatedVehicle,
		};
	}

	async GetVehicleById(id: string): Promise<Vehicle> {
		const vehicle = await this.prisma.vehicle.findUnique({
			where: { id },
			include: {
				driver: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},
			},
		});

		if (!vehicle) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.vehicle.VEHICLE_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
					args: { id },
				}),
			);
		}

		return vehicle;
	}

	async GetAllVehicles(
		query: VehicleQueryDto,
	): Promise<PaginatedResult<Vehicle>> {
		const {
			page = 1,
			limit = 10,
			sortBy = 'createdAt',
			sortOrder = 'desc',
			type,
			manufacturer,
			assigned,
		} = query;

		// Build where clause for filtering
		const where: any = {};

		if (type) {
			where.type = { contains: type, mode: 'insensitive' };
		}

		if (manufacturer) {
			where.manufacturer = { contains: manufacturer, mode: 'insensitive' };
		}

		if (assigned !== undefined) {
			where.driverId = assigned === 'true' ? { not: null } : null;
		}

		// Calculate skip
		const skip = PaginationUtil.getSkip(page, limit);

		// Build orderBy clause
		const orderBy: any = {};
		orderBy[sortBy] = sortOrder;

		try {
			// Execute queries in parallel
			const [vehicles, total] = await Promise.all([
				this.prisma.vehicle.findMany({
					where,
					skip,
					take: limit,
					orderBy,
					include: {
						driver: {
							select: {
								id: true,
								name: true,
								email: true,
								phone: true,
							},
						},
					},
				}),
				this.prisma.vehicle.count({ where }),
			]);

			return PaginationUtil.paginate(vehicles, total, page, limit);
		} catch (error) {
			throw new BadRequestException(
				await this.i18n.translate('exceptions.vehicle.FAILED_TO_FETCH_VEHICLES', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}
	}

	async CreateVehicle(dto: CreateVehicleDto) {
		// check if exite before
		const exite = await this.prisma.vehicle.findFirst({
			where: { plateNumber: dto.plateNumber },
		});

		// if yes, throw conflict error
		if (exite) {
			throw new ConflictException(
				await this.i18n.translate('exceptions.vehicle.VEHICLE_ALREADY_EXISTS', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// if not , then check about the driver if his id is correct or no
		const driverId = dto.driverId;
		if (driverId) {
			const driver = await this.prisma.user.findFirst({
				where: { id: driverId },
			});
			if (!driver) {
				throw new NotFoundException(
					await this.i18n.translate('exceptions.driver.CANT_FIND_DRIVER', {
						lang: I18nContext.current()?.lang,
					}),
				);
			}
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
			include: {
				driver: {
					select: {
						id: true,
						name: true,
						email: true,
						phone: true,
					},
				},
			},
		});

		return {
			message: await this.i18n.translate('messages.vehicle.VEHICLE_CREATED', {
				lang: I18nContext.current()?.lang,
			}),
			vehicle,
		};
	}

	async deleteVehicle(id: string) {
		// Check if the vehicle exists
		const vehicle = await this.prisma.vehicle.findUnique({
			where: { id },
		});

		if (!vehicle) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.vehicle.VEHICLE_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
					args: { id },
				}),
			);
		}

		// Delete the vehicle
		await this.prisma.vehicle.delete({
			where: { id },
		});

		return {
			message: await this.i18n.translate('messages.vehicle.VEHICLE_DELETED', {
				lang: I18nContext.current()?.lang,
			}),
			deletedVehicle: {
				id: vehicle.id,
				plateNumber: vehicle.plateNumber,
				model: vehicle.model,
				manufacturer: vehicle.manufacturer,
			},
		};
	}

	async assignDriver(vehicleId: string, driverId: string) {
		// Check if vehicle exists
		const vehicle = await this.prisma.vehicle.findUnique({
			where: { id: vehicleId },
		});

		if (!vehicle) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.vehicle.VEHICLE_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
					args: { id: vehicleId },
				}),
			);
		}

		// Check if vehicle already has a driver
		if (vehicle.driverId) {
			throw new ConflictException(
				await this.i18n.translate('exceptions.driver.VEHICLE_HAS_DRIVER', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// Check if driver exists
		const driver = await this.prisma.user.findUnique({
			where: { id: driverId },
		});

		if (!driver) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.driver.DRIVER_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
					args: { id: driverId },
				}),
			);
		}

		// Check if driver is already assigned to another vehicle
		const assignedVehicle = await this.prisma.vehicle.findFirst({
			where: { driverId },
		});

		if (assignedVehicle) {
			throw new ConflictException(
				await this.i18n.translate('exceptions.driver.DRIVER_ALREADY_ASSIGNED', {
					lang: I18nContext.current()?.lang,
					args: { plateNumber: assignedVehicle.plateNumber },
				}),
			);
		}

		// Assign driver to vehicle
		const updatedVehicle = await this.prisma.vehicle.update({
			where: { id: vehicleId },
			data: { driverId },
			include: {
				driver: {
					select: { id: true, name: true, email: true, phone: true },
				},
			},
		});

		return {
			message: await this.i18n.translate('messages.driver.DRIVER_ASSIGNED', {
				lang: I18nContext.current()?.lang,
			}),
			vehicle: updatedVehicle,
		};
	}

	async unassignDriver(vehicleId: string) {
		// Check if vehicle exists
		const vehicle = await this.prisma.vehicle.findUnique({
			where: { id: vehicleId },
		});

		if (!vehicle) {
			throw new NotFoundException(
				await this.i18n.translate('exceptions.vehicle.VEHICLE_NOT_FOUND', {
					lang: I18nContext.current()?.lang,
					args: { id: vehicleId },
				}),
			);
		}

		// Check if vehicle has an assigned driver
		if (!vehicle.driverId) {
			throw new BadRequestException(
				await this.i18n.translate('exceptions.driver.NO_DRIVER_ASSIGNED', {
					lang: I18nContext.current()?.lang,
				}),
			);
		}

		// Unassign driver from vehicle
		const updatedVehicle = await this.prisma.vehicle.update({
			where: { id: vehicleId },
			data: { driverId: null },
			select: {
				id: true,
				plateNumber: true,
				model: true,
				manufacturer: true,
				year: true,
				type: true,
				simNumber: true,
				deviceId: true,
				createdAt: true,
				updatedAt: true,
			},
		});

		return {
			message: await this.i18n.translate('messages.driver.DRIVER_UNASSIGNED', {
				lang: I18nContext.current()?.lang,
			}),
			vehicle: updatedVehicle,
		};
	}
}

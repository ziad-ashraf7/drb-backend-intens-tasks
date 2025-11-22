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
import { AppCacheService } from 'src/cache/cache.service';
import { CacheKeys } from 'src/cache/cache-keys.util';

@Injectable()
export class VehicleService {
	constructor(
		private prisma: PrismaService,
		private i18n: I18nService,
		private cache: AppCacheService,
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
					NOT: { id },
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

		// Update the vehicle
		const updatedVehicle = await this.prisma.vehicle.update({
			where: { id },
			data: dto,
			include: {
				driver: {
					select: { id: true, name: true, email: true, phone: true },
				},
			},
		});

		// Invalidate cache
		await this.cache.clearAll();

		// TODO: Fix the clear prefix function bug
		// await this.cache.del(CacheKeys.vehicle(id));
		// await this.cache.clearPrefix(CacheKeys.VEHICLE_PREFIX);
		// if (vehicle.driverId) {
		// 	await this.cache.del(CacheKeys.vehiclesByDriver(vehicle.driverId));
		// }
		// if (dto.driverId) {
		// 	await this.cache.del(CacheKeys.vehiclesByDriver(dto.driverId));
		// }

		return {
			message: await this.i18n.translate('messages.vehicle.VEHICLE_UPDATED', {
				lang: I18nContext.current()?.lang,
			}),
			vehicle: updatedVehicle,
		};
	}

	async GetVehicleById(id: string): Promise<Vehicle> {
		// Check cache first
		const cacheKey = CacheKeys.vehicle(id);
		const cached = await this.cache.get<Vehicle>(cacheKey);
		if (cached) {
			return cached;
		}

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

		// Cache for 5 minutes
		await this.cache.set(cacheKey, vehicle, 300000);

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

		const cacheKey = CacheKeys.vehicles(JSON.stringify(query));

		// Check cache first
		const cached = await this.cache.get<PaginatedResult<Vehicle>>(cacheKey);
		if (cached) {
			console.log(cached);
			return cached;
		}
		console.log('Helloooooooooooo');

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

			const result = PaginationUtil.paginate(vehicles, total, page, limit);

			// Cache for 5 minutes
			await this.cache.set(cacheKey, result, 300000);

			return result;
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

		await this.cache.clearAll();

		// TODO: Fix the clear prefix function bug
		// await this.cache.clearPrefix(CacheKeys.VEHICLE_LIST_PREFIX);

		// await this.cache.del(CacheKeys.vehicle(vehicle.id));

		// if (dto.driverId) {
		// 	await this.cache.del(CacheKeys.vehiclesByDriver(dto.driverId));
		// }

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

		// Invalidate cache
		await this.cache.clearAll();

		// TODO: Fix the clear prefix function bug
		// await this.cache.del(CacheKeys.vehicle(id));
		// await this.cache.clearPrefix(CacheKeys.VEHICLE_PREFIX);
		// if (vehicle.driverId) {
		// 	await this.cache.del(CacheKeys.vehiclesByDriver(vehicle.driverId));
		// }

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

		// Invalidate cache
		await this.cache.clearAll();

		// TODO: Fix the clear prefix function bug
		// await this.cache.del(CacheKeys.vehicle(vehicleId));
		// await this.cache.clearPrefix(CacheKeys.VEHICLE_PREFIX);
		// await this.cache.del(CacheKeys.vehiclesByDriver(driverId));

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

		const oldDriverId = vehicle.driverId;

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

		// Invalidate cache
		await this.cache.clearAll();

		// TODO: Fix the clear prefix function bug
		// await this.cache.del(CacheKeys.vehicle(vehicleId));
		// await this.cache.clearPrefix(CacheKeys.VEHICLE_PREFIX);
		// await this.cache.del(CacheKeys.vehiclesByDriver(oldDriverId));

		return {
			message: await this.i18n.translate('messages.driver.DRIVER_UNASSIGNED', {
				lang: I18nContext.current()?.lang,
			}),
			vehicle: updatedVehicle,
		};
	}
}

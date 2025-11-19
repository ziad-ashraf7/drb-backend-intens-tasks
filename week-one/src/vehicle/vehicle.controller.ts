import {
	Body,
	Controller,
	Get,
	Param,
	Patch,
	Post,
	UseGuards,
} from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { CreateVehicleDto } from './dto/CreateVehicleDto.dto';
import { ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('vehicles')
export class VehicleController {
	constructor(private vehicleService: VehicleService) {}

	// Create Vehicle -> POST /vehicles

	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({
		description:
			'Create a new Vehicle, Onle Admin and Fleet manager can use this endpoint',
	})
	@Post('/')
	async CreateVehicle(@Body() dto: CreateVehicleDto) {
		return this.vehicleService.CreateVehicle(dto);
	}

	// Get all Vehicle -> GET /vehicles
	@Get()
	async GetAllVehicle() {
		return this.vehicleService.GetAllVehicles();
	}

	// Get Vehicle by id -> GET /vehicles/:id
	@Get(':id')
	async GetVehicleById(@Param('id') id: string) {
		return this.vehicleService.GetVehicleById(id);
	}

	// Update Vehicle -> PATCH /vehicles/:id
	@Patch(':id')
	async UpdateVehicle(@Param('id') id: string) {}

	// Delete Vehicle -> DELETE /vehicles/:id
	async DeleteVehicle(@Param('id') id: string) {}

	// Assign Driver to Vehicle -> PATCH /vehicles/:id/assign-driver
	@Patch(':id/assign-driver')
	async AssignDriver(@Param('id') id: string) {}

	// Unassign Driver to Vehicle -> PATCH /vehicles/:id/unassign-driver
	@Patch(':id/unassign-driver')
	async UnassignDriver(@Param('id') id: string) {}
}

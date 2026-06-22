import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Customers')
@Controller('customers')
@ApiBearerAuth('JWT')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Obtener todos los clientes con búsqueda opcional (Admin, Cashier)' })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('search') search?: string) {
    return this.customersService.findAll(search);
  }

  @Get(':id')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Obtener un cliente por ID con su historial de pedidos y direcciones (Admin, Cashier)' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.customersService.findOne(id);
  }

  @Post(':id/addresses')
  @ApiOperation({ summary: 'Crear dirección para un cliente' })
  createAddress(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateAddressDto) {
    return this.customersService.createAddress(id, dto);
  }
}

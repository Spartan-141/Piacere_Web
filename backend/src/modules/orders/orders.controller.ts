import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { ChangeTableDto } from './dto/change-table.dto';
import { ChangeTypeDto } from './dto/change-type.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Orders')
@Controller('orders')
@ApiBearerAuth('JWT')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener pedidos activos (excluye entregados y cancelados)' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'paid', required: false })
  @ApiQuery({ name: 'tableId', required: false })
  @ApiQuery({ name: 'date', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  findAll(
    @Query('status') status?: string,
    @Query('paid') paid?: string,
    @Query('tableId') tableId?: string,
    @Query('date') date?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const lim = limit ? parseInt(limit, 10) : 50;
    const off = offset ? parseInt(offset, 10) : 0;
    return this.ordersService.findAll(status, paid, tableId, date, lim, off);
  }

  @Get('history')
  @ApiOperation({ summary: 'Obtener historial de pedidos (entregados o cancelados)' })
  @ApiQuery({ name: 'date', required: false })
  findHistory(@Query('date') date?: string) {
    return this.ordersService.findHistory(date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un pedido detallado por ID' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.ordersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear un nuevo pedido' })
  create(@Body() dto: CreateOrderDto, @Req() req: any) {
    return this.ordersService.create(dto, req.user.userId);
  }

  @Patch(':id/add-items')
  @ApiOperation({ summary: 'Agregar ítems a un pedido activo' })
  addItems(@Param('id', ParseIntPipe) id: number, @Body() dto: AddItemsDto) {
    return this.ordersService.addItems(id, dto);
  }

  @Patch(':id/table')
  @ApiOperation({ summary: 'Cambiar o desasignar la mesa de un pedido' })
  changeTable(@Param('id', ParseIntPipe) id: number, @Body() dto: ChangeTableDto) {
    return this.ordersService.changeTable(id, dto);
  }

  @Patch(':id/type')
  @ApiOperation({ summary: 'Cambiar el tipo de pedido (ej. Comer Aquí / Para Llevar)' })
  changeType(@Param('id', ParseIntPipe) id: number, @Body() dto: ChangeTypeDto) {
    return this.ordersService.changeType(id, dto);
  }

  @Patch(':id/status')
  @Roles('admin', 'cashier', 'waiter')
  @ApiOperation({ summary: 'Cambiar el estado del pedido (Admin, Cashier, Waiter)' })
  changeStatus(@Param('id', ParseIntPipe) id: number, @Body() dto: ChangeStatusDto) {
    return this.ordersService.changeStatus(id, dto);
  }

  @Post(':id/payments')
  @Roles('admin', 'cashier')
  @ApiOperation({ summary: 'Registrar un pago para el pedido (Admin, Cashier)' })
  registerPayment(@Param('id', ParseIntPipe) id: number, @Body() dto: RegisterPaymentDto) {
    return this.ordersService.registerPayment(id, dto);
  }
}

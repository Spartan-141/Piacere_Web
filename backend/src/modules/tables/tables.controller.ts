import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { CreateTableDto } from './dto/create-table.dto';
import { CreateSectionDto } from './dto/create-section.dto';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Tables')
@Controller('tables')
@ApiBearerAuth('JWT')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  // =============================
  // SECTIONS (ZONES)
  // =============================
  @Get('sections')
  @ApiOperation({ summary: 'Obtener todas las secciones/zonas de mesas' })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  getSections(@Query('all') all?: string) {
    const showAll = all === 'true';
    return this.tablesService.findSections(showAll);
  }

  @Post('sections')
  @Roles('admin')
  @ApiOperation({ summary: 'Crear nueva sección (Admin)' })
  createSection(@Body() dto: CreateSectionDto) {
    return this.tablesService.createSection(dto);
  }

  @Put('sections/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Actualizar sección (Admin)' })
  updateSection(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateSectionDto) {
    return this.tablesService.updateSection(id, dto);
  }

  @Patch('sections/:id/toggle-active')
  @Roles('admin')
  @ApiOperation({ summary: 'Activar/desactivar sección (Admin)' })
  toggleSectionActive(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.toggleSectionActive(id);
  }

  @Delete('sections/:id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar sección (Admin)' })
  @ApiQuery({ name: 'force', required: false, type: Boolean })
  deleteSection(@Param('id', ParseIntPipe) id: number, @Query('force') force?: string) {
    const forceDelete = force === 'true';
    return this.tablesService.deleteSection(id, forceDelete);
  }

  // =============================
  // TABLES
  // =============================
  @Get()
  @ApiOperation({ summary: 'Obtener todas las mesas de secciones activas con sus órdenes actuales' })
  getTables() {
    return this.tablesService.findTables();
  }

  @Get(':id/active-order')
  @ApiOperation({ summary: 'Obtener la orden activa de una mesa por ID' })
  getActiveOrder(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.findActiveOrder(id);
  }

  @Patch(':id/status')
  @Roles('admin', 'cashier', 'waiter')
  @ApiOperation({ summary: 'Actualizar estado de mesa (Admin, Cashier, Waiter)' })
  updateTableStatus(@Param('id', ParseIntPipe) id: number, @Body('status') status: string) {
    return this.tablesService.updateTableStatus(id, status);
  }

  @Post()
  @Roles('admin')
  @ApiOperation({ summary: 'Crear una nueva mesa autogenerada (Admin)' })
  createTable(@Body() dto: CreateTableDto) {
    return this.tablesService.createTable(dto);
  }

  @Delete(':id')
  @Roles('admin')
  @ApiOperation({ summary: 'Eliminar una mesa por ID (Admin)' })
  deleteTable(@Param('id', ParseIntPipe) id: number) {
    return this.tablesService.deleteTable(id);
  }
}

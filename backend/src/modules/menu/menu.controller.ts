import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags, ApiQuery } from '@nestjs/swagger';
import { MenuService } from './menu.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateComboDto } from './dto/create-combo.dto';
import { CreateExtraDto } from './dto/create-extra.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('Menu')
@Controller('menu')
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ── Categorías ──────────────────────────────────────────────
  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Obtener todas las categorías' })
  getCategories() {
    return this.menuService.findAllCategories();
  }

  @Post('categories')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Crear categoría (Admin)' })
  createCategory(@Body() dto: CreateCategoryDto) {
    return this.menuService.createCategory(dto);
  }

  @Delete('categories/:id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Eliminar categoría (Admin)' })
  deleteCategory(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.deleteCategory(id);
  }

  // ── Productos ────────────────────────────────────────────────
  @Get('products')
  @Public()
  @ApiOperation({ summary: 'Obtener productos con filtros opcionales' })
  @ApiQuery({ name: 'web', required: false, type: Boolean })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  @ApiQuery({ name: 'categoryId', required: false, type: Number })
  getProducts(
    @Query('web') web?: string,
    @Query('all') all?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const webOnly = web === 'true';
    const showAll = all === 'true';
    const catId = categoryId ? parseInt(categoryId, 10) : undefined;
    return this.menuService.findAllProducts(webOnly, showAll, catId);
  }

  @Get('products/:id')
  @Public()
  @ApiOperation({ summary: 'Obtener producto por ID' })
  getProductById(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.findProductById(id);
  }

  @Post('products')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Crear producto (Admin)' })
  createProduct(@Body() dto: CreateProductDto) {
    return this.menuService.createProduct(dto);
  }

  @Put('products/:id')
  @Roles('admin', 'cashier')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Actualizar producto (Admin, Cashier)' })
  updateProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateProductDto) {
    return this.menuService.updateProduct(id, dto);
  }

  @Patch('products/:id/toggle-active')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Activar/desactivar producto (Admin)' })
  toggleProductActive(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.toggleProductActive(id);
  }

  @Delete('products/:id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Eliminar producto (Admin)' })
  deleteProduct(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.deleteProduct(id);
  }

  // ── Combos ───────────────────────────────────────────────────
  @Get('combos')
  @Public()
  @ApiOperation({ summary: 'Obtener combos con filtros opcionales' })
  @ApiQuery({ name: 'web', required: false, type: Boolean })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  getCombos(@Query('web') web?: string, @Query('all') all?: string) {
    const webOnly = web === 'true';
    const showAll = all === 'true';
    return this.menuService.findAllCombos(webOnly, showAll);
  }

  @Post('combos')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Crear combo (Admin)' })
  createCombo(@Body() dto: CreateComboDto) {
    return this.menuService.createCombo(dto);
  }

  @Put('combos/:id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Actualizar combo (Admin)' })
  updateCombo(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateComboDto) {
    return this.menuService.updateCombo(id, dto);
  }

  @Patch('combos/:id/toggle-active')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Activar/desactivar combo (Admin)' })
  toggleComboActive(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.toggleComboActive(id);
  }

  @Delete('combos/:id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Eliminar combo (Admin)' })
  deleteCombo(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.deleteCombo(id);
  }

  // ── Extras ───────────────────────────────────────────────────
  @Get('extras')
  @Public()
  @ApiOperation({ summary: 'Obtener todos los extras' })
  @ApiQuery({ name: 'all', required: false, type: Boolean })
  getExtras(@Query('all') all?: string) {
    const showAll = all === 'true';
    return this.menuService.findAllExtras(showAll);
  }

  @Post('extras')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Crear extra (Admin)' })
  createExtra(@Body() dto: CreateExtraDto) {
    return this.menuService.createExtra(dto);
  }

  @Put('extras/:id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Actualizar extra (Admin)' })
  updateExtra(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateExtraDto & { isActive?: boolean },
  ) {
    return this.menuService.updateExtra(id, dto);
  }

  @Delete('extras/:id')
  @Roles('admin')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Eliminar extra (Admin)' })
  deleteExtra(@Param('id', ParseIntPipe) id: number) {
    return this.menuService.deleteExtra(id);
  }
}

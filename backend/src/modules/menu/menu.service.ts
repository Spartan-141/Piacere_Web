import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateComboDto } from './dto/create-combo.dto';
import { CreateExtraDto } from './dto/create-extra.dto';

@Injectable()
export class MenuService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Categorías ──────────────────────────────────────────────
  async findAllCategories() {
    return this.prisma.category.findMany({
      orderBy: { sortOrder: 'asc' },
    });
  }

  async createCategory(dto: CreateCategoryDto) {
    try {
      return await this.prisma.category.create({
        data: {
          name: dto.name,
          slug: dto.slug,
          isVisibleOnWeb: dto.isVisibleOnWeb ?? true,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
    } catch (err: any) {
      if (err.code === 'P2002') {
        throw new ConflictException('El slug ya existe');
      }
      throw err;
    }
  }

  async deleteCategory(id: number) {
    const products = await this.prisma.product.findMany({
      where: { categoryId: id },
      select: { id: true },
    });
    if (products.length > 0) {
      throw new BadRequestException('No se puede eliminar la categoría porque tiene productos asignados.');
    }
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Categoría eliminada' };
  }

  // ── Productos ────────────────────────────────────────────────
  async findAllProducts(webOnly?: boolean, showAll?: boolean, categoryId?: number) {
    const where: any = {};
    if (!showAll) {
      where.isActive = true;
    }
    if (webOnly) {
      where.isOnWebMenu = true;
    }
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const products = await this.prisma.product.findMany({
      where,
      include: {
        category: {
          select: { name: true, sortOrder: true },
        },
      },
      orderBy: [
        { category: { sortOrder: 'asc' } },
        { name: 'asc' },
      ],
    });

    return products.map(p => ({
      id: p.id,
      categoryId: p.categoryId,
      categoryName: p.category?.name || null,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      isActive: p.isActive,
      isOnWebMenu: p.isOnWebMenu,
      imageUrl: p.imageUrl,
    }));
  }

  async findProductById(id: number) {
    const p = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: {
          select: { name: true },
        },
      },
    });

    if (!p) {
      throw new NotFoundException('Producto no encontrado');
    }

    return {
      id: p.id,
      categoryId: p.categoryId,
      categoryName: p.category?.name || null,
      name: p.name,
      description: p.description,
      basePrice: p.basePrice,
      isActive: p.isActive,
      isOnWebMenu: p.isOnWebMenu,
      imageUrl: p.imageUrl,
      createdAt: p.createdAt,
    };
  }

  async createProduct(dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        categoryId: dto.categoryId,
        name: dto.name,
        description: dto.description || null,
        basePrice: dto.basePrice,
        isOnWebMenu: dto.isOnWebMenu ?? true,
        imageUrl: dto.imageUrl || null,
      },
    });
  }

  async updateProduct(id: number, dto: UpdateProductDto) {
    return this.prisma.product.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description !== undefined ? dto.description : undefined,
        basePrice: dto.basePrice,
        isActive: dto.isActive,
        isOnWebMenu: dto.isOnWebMenu,
        categoryId: dto.categoryId,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : undefined,
      },
    });
  }

  async toggleProductActive(id: number) {
    const product = await this.prisma.product.findUnique({ where: { id }, select: { isActive: true } });
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }
    const nextStatus = !product.isActive;
    await this.prisma.product.update({
      where: { id },
      data: { isActive: nextStatus },
    });
    return {
      message: nextStatus ? 'Producto activado' : 'Producto ocultado',
      is_active: nextStatus, // keep name snake_case as in express
    };
  }

  async deleteProduct(id: number) {
    await this.prisma.$transaction([
      this.prisma.comboItem.deleteMany({ where: { productId: id } }),
      this.prisma.product.delete({ where: { id } }),
    ]);
    return { message: 'Producto eliminado físicamente' };
  }

  // ── Combos ───────────────────────────────────────────────────
  async findAllCombos(webOnly?: boolean, showAll?: boolean) {
    const where: any = {};
    if (!showAll) {
      where.isActive = true;
    }
    if (webOnly) {
      where.isOnWebMenu = true;
    }

    const combos = await this.prisma.combo.findMany({
      where,
      include: {
        items: {
          include: {
            product: {
              select: { name: true },
            },
          },
        },
      },
    });

    return combos.map(c => ({
      id: c.id,
      name: c.name,
      description: c.description,
      price: c.price,
      isActive: c.isActive,
      isOnWebMenu: c.isOnWebMenu,
      validFrom: c.validFrom,
      validUntil: c.validUntil,
      items: c.items.map(ci => ({
        id: ci.id,
        comboId: ci.comboId,
        productId: ci.productId,
        productName: ci.product.name,
        quantity: ci.quantity,
      })),
    }));
  }

  async createCombo(dto: CreateComboDto) {
    return this.prisma.$transaction(async (tx) => {
      const combo = await tx.combo.create({
        data: {
          name: dto.name,
          description: dto.description || null,
          price: dto.price,
          isOnWebMenu: dto.isOnWebMenu ?? true,
        },
      });

      if (dto.items && dto.items.length > 0) {
        await tx.comboItem.createMany({
          data: dto.items.map(item => ({
            comboId: combo.id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }
      return { message: 'Combo creado' };
    });
  }

  async updateCombo(id: number, dto: CreateComboDto) {
    return this.prisma.$transaction(async (tx) => {
      await tx.combo.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description || null,
          price: dto.price,
          isOnWebMenu: dto.isOnWebMenu ?? true,
        },
      });

      await tx.comboItem.deleteMany({ where: { comboId: id } });

      if (dto.items && dto.items.length > 0) {
        await tx.comboItem.createMany({
          data: dto.items.map(item => ({
            comboId: id,
            productId: item.productId,
            quantity: item.quantity,
          })),
        });
      }
      return { message: 'Combo actualizado' };
    });
  }

  async toggleComboActive(id: number) {
    const combo = await this.prisma.combo.findUnique({ where: { id }, select: { isActive: true } });
    if (!combo) {
      throw new NotFoundException('Combo no encontrado');
    }
    const nextStatus = !combo.isActive;
    await this.prisma.combo.update({
      where: { id },
      data: { isActive: nextStatus },
    });
    return {
      message: nextStatus ? 'Activo' : 'Oculto',
      is_active: nextStatus, // keep name snake_case as in express
    };
  }

  async deleteCombo(id: number) {
    await this.prisma.$transaction([
      this.prisma.comboItem.deleteMany({ where: { comboId: id } }),
      this.prisma.combo.delete({ where: { id } }),
    ]);
    return { message: 'Combo eliminado' };
  }

  // ── Extras ───────────────────────────────────────────────────
  async findAllExtras(showAll?: boolean) {
    const where: any = {};
    if (!showAll) {
      where.isActive = true;
    }
    return this.prisma.productExtra.findMany({
      where,
    });
  }

  async createExtra(dto: CreateExtraDto) {
    const extra = await this.prisma.productExtra.create({
      data: {
        name: dto.name,
        price: dto.price,
      },
    });
    return {
      id: extra.id,
      name: extra.name,
      price: extra.price,
      isActive: extra.isActive,
    };
  }

  async updateExtra(id: number, dto: CreateExtraDto & { isActive?: boolean }) {
    await this.prisma.productExtra.update({
      where: { id },
      data: {
        name: dto.name,
        price: dto.price,
        isActive: dto.isActive,
      },
    });
    return { message: 'Extra actualizado' };
  }

  async deleteExtra(id: number) {
    await this.prisma.productExtra.delete({ where: { id } });
    return { message: 'Extra eliminado' };
  }
}

import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTableDto } from './dto/create-table.dto';
import { CreateSectionDto } from './dto/create-section.dto';

@Injectable()
export class TablesService {
  constructor(private readonly prisma: PrismaService) {}

  // =============================
  // SECTIONS (ZONES)
  // =============================
  async findSections(showAll: boolean) {
    const where: any = {};
    if (!showAll) {
      where.isActive = true;
    }

    const sections = await this.prisma.tableSection.findMany({
      where,
      include: {
        _count: {
          select: { tables: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    return sections.map(s => ({
      id: s.id,
      name: s.name,
      prefix: s.prefix,
      isActive: s.isActive,
      tableCount: s._count.tables,
    }));
  }

  async createSection(dto: CreateSectionDto) {
    const section = await this.prisma.tableSection.create({
      data: {
        name: dto.name,
        prefix: dto.prefix,
      },
    });
    return { id: section.id };
  }

  async updateSection(id: number, dto: CreateSectionDto) {
    await this.prisma.tableSection.update({
      where: { id },
      data: {
        name: dto.name,
        prefix: dto.prefix,
      },
    });
    return { message: 'Sección actualizada' };
  }

  async toggleSectionActive(id: number) {
    const section = await this.prisma.tableSection.findUnique({
      where: { id },
      select: { isActive: true },
    });
    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    const willDeactivate = section.isActive;

    if (willDeactivate) {
      const activeTables = await this.prisma.table.findMany({
        where: {
          sectionId: id,
          status: { not: 'free' },
        },
        select: { id: true },
      });
      if (activeTables.length > 0) {
        throw new BadRequestException('No se puede ocultar la zona porque tiene mesas ocupadas o reservadas.');
      }
    }

    const nextStatus = !section.isActive;
    await this.prisma.tableSection.update({
      where: { id },
      data: { isActive: nextStatus },
    });

    return {
      message: nextStatus ? 'Sección activada' : 'Sección ocultada',
      is_active: nextStatus ? 1 : 0, // match Express router integer representation
    };
  }

  async deleteSection(id: number, force: boolean) {
    const tables = await this.prisma.table.findMany({
      where: { sectionId: id },
      select: { id: true, status: true },
    });

    if (tables.length > 0) {
      const occupiedTables = tables.filter(t => t.status !== 'free');
      if (occupiedTables.length > 0) {
        throw new BadRequestException('No se puede eliminar la zona porque tiene mesas ocupadas, servidas o reservadas.');
      }

      if (!force) {
        throw new BadRequestException({
          error: 'CONFIRM_TABLE_DELETE',
          message: 'Esta zona contiene mesas libres. ¿Estás seguro de que deseas eliminar la zona y TODAS las mesas que contiene?',
        });
      }

      await this.prisma.table.deleteMany({ where: { sectionId: id } });
    }

    await this.prisma.tableSection.delete({ where: { id } });
    return { message: 'Sección eliminada físicamente' };
  }

  // =============================
  // TABLES
  // =============================
  async findTables() {
    const tables = await this.prisma.table.findMany({
      where: {
        section: { isActive: true },
      },
      include: {
        section: { select: { name: true } },
        orders: {
          where: {
            status: { notIn: ['delivered', 'cancelled'] },
          },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, total: true },
        },
      },
      orderBy: [
        { section: { name: 'asc' } },
        { id: 'asc' },
      ],
    });

    return tables.map(t => ({
      id: t.id,
      name: t.name,
      capacity: t.capacity,
      sectionId: t.sectionId,
      status: t.status,
      sectionName: t.section.name,
      current_order_id: t.orders[0]?.id || null,
      current_order_total: t.orders[0]?.total || null,
    }));
  }

  async findActiveOrder(id: number) {
    const order = await this.prisma.order.findFirst({
      where: {
        tableId: id,
        status: { notIn: ['delivered', 'cancelled'] },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            product: { select: { name: true } },
            combo: { select: { name: true } },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('No hay orden activa para esta mesa');
    }

    const mappedItems = order.items.map(oi => ({
      id: oi.id,
      orderId: oi.orderId,
      productId: oi.productId,
      productName: oi.product?.name || null,
      comboId: oi.comboId,
      comboName: oi.combo?.name || null,
      quantity: oi.quantity,
      unitPrice: oi.unitPrice,
      notes: oi.notes,
    }));

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      type: order.type,
      status: order.status,
      source: order.source,
      tableId: order.tableId,
      customerId: order.customerId,
      deliveryAddressId: order.deliveryAddressId,
      deliveryNotes: order.deliveryNotes,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      paid: order.paid,
      createdById: order.createdById,
      tip: order.tip,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: mappedItems,
    };
  }

  async updateTableStatus(id: number, status: string) {
    if (!['free', 'waiting_order', 'served', 'reserved'].includes(status)) {
      throw new BadRequestException('Estado inválido');
    }

    await this.prisma.table.update({
      where: { id },
      data: { status },
    });

    return { message: 'Estado de mesa actualizado' };
  }

  async createTable(dto: CreateTableDto) {
    const section = await this.prisma.tableSection.findUnique({
      where: { id: dto.sectionId },
      select: { prefix: true },
    });
    if (!section) {
      throw new NotFoundException('Sección no encontrada');
    }

    const tables = await this.prisma.table.findMany({
      where: { sectionId: dto.sectionId },
      select: { name: true },
    });

    let maxNum = 0;
    const prefixLength = section.prefix.length;
    for (const t of tables) {
      if (t.name.startsWith(section.prefix)) {
        const numPart = t.name.slice(prefixLength);
        const num = parseInt(numPart, 10);
        if (!isNaN(num) && num > maxNum) {
          maxNum = num;
        }
      }
    }

    const nextNum = maxNum + 1;
    const autoName = `${section.prefix}${nextNum}`;

    const result = await this.prisma.table.create({
      data: {
        name: autoName,
        capacity: dto.capacity || null,
        sectionId: dto.sectionId,
        status: 'free',
      },
    });

    return { id: result.id, name: autoName };
  }

  async deleteTable(id: number) {
    await this.prisma.table.delete({ where: { id } });
    return { message: 'Mesa eliminada' };
  }
}

import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { AddItemsDto } from './dto/add-items.dto';
import { ChangeTableDto } from './dto/change-table.dto';
import { ChangeTypeDto } from './dto/change-type.dto';
import { ChangeStatusDto } from './dto/change-status.dto';
import { RegisterPaymentDto } from './dto/register-payment.dto';

function generateOrderNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const rand = Math.floor(Math.random() * 90000) + 10000;
  return `ORD-${year}-${rand}`;
}

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(status?: string, paid?: string, tableId?: string, date?: string, limit: number = 50, offset: number = 0) {
    const where: any = {};
    if (status) {
      where.status = status;
    } else if (paid === 'true') {
      // Paid tab: include delivered orders that still have a table (for "Liberar Mesa" button)
      where.OR = [
        { status: { notIn: ['delivered', 'cancelled'] } },
        { status: 'delivered', tableId: { not: null } },
      ];
    } else {
      where.status = { notIn: ['delivered', 'cancelled'] };
    }

    if (paid !== undefined) {
      where.paid = paid === 'true';
    }

    if (tableId) {
      where.tableId = parseInt(tableId, 10);
    }

    if (date) {
      const dayStart = new Date(date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setUTCHours(23, 59, 59, 999);
      where.createdAt = {
        gte: dayStart,
        lte: dayEnd,
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        table: { select: { name: true } },
        customer: { select: { name: true } },
        createdBy: { select: { name: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    return orders.map(o => {
      const totalPaid = o.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        id: o.id,
        order_number: o.orderNumber,
        type: o.type,
        status: o.status,
        source: o.source,
        table_id: o.tableId,
        table_name: o.table?.name || null,
        customer_id: o.customerId,
        customer_name: o.customer?.name || null,
        delivery_address_id: o.deliveryAddressId,
        delivery_notes: o.deliveryNotes,
        subtotal: o.subtotal,
        discount: o.discount,
        tax: o.tax,
        total: o.total,
        paid: o.paid,
        created_by: o.createdById,
        created_by_name: o.createdBy?.name || null,
        tip: o.tip,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
        total_paid: totalPaid,
        payment_count: o.payments.length,
      };
    });
  }

  async findHistory(date?: string) {
    const where: any = {
      status: { in: ['delivered', 'cancelled'] },
    };

    if (date) {
      const dayStart = new Date(date);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEnd = new Date(date);
      dayEnd.setUTCHours(23, 59, 59, 999);
      where.createdAt = {
        gte: dayStart,
        lte: dayEnd,
      };
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        table: { select: { name: true } },
        customer: { select: { name: true } },
        createdBy: { select: { name: true } },
        payments: { select: { amount: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return orders.map(o => {
      const totalPaid = o.payments.reduce((sum, p) => sum + p.amount, 0);
      return {
        id: o.id,
        order_number: o.orderNumber,
        type: o.type,
        status: o.status,
        source: o.source,
        table_id: o.tableId,
        table_name: o.table?.name || null,
        customer_id: o.customerId,
        customer_name: o.customer?.name || null,
        delivery_address_id: o.deliveryAddressId,
        delivery_notes: o.deliveryNotes,
        subtotal: o.subtotal,
        discount: o.discount,
        tax: o.tax,
        total: o.total,
        paid: o.paid,
        created_by: o.createdById,
        created_by_name: o.createdBy?.name || null,
        tip: o.tip,
        created_at: o.createdAt,
        updated_at: o.updatedAt,
        total_paid: totalPaid,
        payment_count: o.payments.length,
      };
    });
  }

  async findOne(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        table: { select: { name: true } },
        customer: { select: { name: true } },
        items: {
          include: {
            product: { select: { name: true } },
            combo: { select: { name: true } },
            extras: {
              include: {
                productExtra: { select: { name: true } },
              },
            },
          },
        },
        payments: {
          orderBy: { paidAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const totalPaid = order.payments.reduce((sum, p) => sum + p.amount, 0);

    const mappedItems = order.items.map(oi => ({
      id: oi.id,
      order_id: oi.orderId,
      product_id: oi.productId,
      product_name: oi.product?.name || null,
      combo_id: oi.comboId,
      combo_name: oi.combo?.name || null,
      quantity: oi.quantity,
      unit_price: oi.unitPrice,
      notes: oi.notes,
      extras: oi.extras.map(e => ({
        id: e.productExtraId,
        name: e.productExtra.name,
        price: e.price,
      })),
    }));

    return {
      id: order.id,
      order_number: order.orderNumber,
      type: order.type,
      status: order.status,
      source: order.source,
      table_id: order.tableId,
      table_name: order.table?.name || null,
      customer_id: order.customerId,
      customer_name: order.customer?.name || null,
      delivery_address_id: order.deliveryAddressId,
      delivery_notes: order.deliveryNotes,
      subtotal: order.subtotal,
      discount: order.discount,
      tax: order.tax,
      total: order.total,
      paid: order.paid,
      created_by: order.createdById,
      tip: order.tip,
      created_at: order.createdAt,
      updated_at: order.updatedAt,
      total_paid: totalPaid,
      payment_count: order.payments.length,
      items: mappedItems,
      payments: order.payments.map(p => ({
        id: p.id,
        order_id: p.orderId,
        method: p.method,
        amount: p.amount,
        reference: p.reference,
        paid_at: p.paidAt,
      })),
    };
  }

  async create(dto: CreateOrderDto, userId: number) {
    if (dto.tableId && dto.type === 'dine_in') {
      const table = await this.prisma.table.findUnique({
        where: { id: dto.tableId },
        select: { status: true },
      });
      if (!table) {
        throw new BadRequestException('Mesa no encontrada');
      }
      if (table.status !== 'free') {
        throw new ConflictException('La mesa no está disponible');
      }
    }

    const allExtraIds: number[] = [];
    for (const item of dto.items) {
      if (item.extraIds && item.extraIds.length > 0) {
        allExtraIds.push(...item.extraIds);
      }
    }

    if (allExtraIds.length > 0) {
      const existingExtras = await this.prisma.productExtra.findMany({
        where: { id: { in: allExtraIds } },
        select: { id: true },
      });
      const existingIds = new Set(existingExtras.map(e => e.id));
      const missingIds = allExtraIds.filter(id => !existingIds.has(id));
      if (missingIds.length > 0) {
        throw new BadRequestException(`Extras no encontrados: ${missingIds.join(', ')}`);
      }
    }

    if (dto.customerId) {
      const customer = await this.prisma.user.findUnique({
        where: { id: dto.customerId },
      });
      if (!customer) {
        throw new BadRequestException('Cliente no encontrado');
      }
    }

    if (dto.deliveryAddressId) {
      const address = await this.prisma.customerAddress.findUnique({
        where: { id: dto.deliveryAddressId },
      });
      if (!address) {
        throw new BadRequestException('Dirección de entrega no encontrada');
      }
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('Usuario creador no encontrado');
    }

    const subtotal = dto.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const discount = dto.discount || 0;
    const total = subtotal - discount;
    const tax = total * 0.16;

    for (const item of dto.items) {
      if (item.productId) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
        });
        if (!product) {
          throw new BadRequestException(`Producto no encontrado: ${item.productId}`);
        }
      }
      if (item.comboId) {
        const combo = await this.prisma.combo.findUnique({
          where: { id: item.comboId },
        });
        if (!combo) {
          throw new BadRequestException(`Combo no encontrado: ${item.comboId}`);
        }
      }
    }

    let attempts = 0;
    const maxAttempts = 3;
    let orderId: number | null = null;
    let finalOrderNumber = '';

    while (attempts < maxAttempts) {
      attempts++;
      try {
        finalOrderNumber = generateOrderNumber();
        orderId = await this.prisma.$transaction(async (tx) => {
          const order = await tx.order.create({
            data: {
              orderNumber: finalOrderNumber,
              type: dto.type,
              source: dto.source || 'pos',
              tableId: (dto.type === 'dine_in' ? dto.tableId : null) || null,
              customerId: dto.customerId || null,
              deliveryAddressId: dto.deliveryAddressId || null,
              deliveryNotes: dto.deliveryNotes || null,
              subtotal,
              discount,
              total,
              tax,
              paid: dto.paid || false,
              createdById: userId,
              tip: dto.tip || 0,
            },
          });

          for (const item of dto.items) {
            const orderItem = await tx.orderItem.create({
              data: {
                orderId: order.id,
                productId: item.productId || null,
                comboId: item.comboId || null,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                notes: item.notes || null,
              },
            });

            if (item.extraIds && item.extraIds.length > 0) {
              const extras = await tx.productExtra.findMany({
                where: { id: { in: item.extraIds } },
                select: { id: true, price: true },
              });
              const extrasData = extras.map(extra => ({
                orderItemId: orderItem.id,
                productExtraId: extra.id,
                price: extra.price,
              }));
              await tx.orderItemExtra.createMany({ data: extrasData });
            }
          }

          if (dto.tableId && dto.type === 'dine_in') {
            await tx.table.update({
              where: { id: dto.tableId },
              data: { status: 'waiting_order' },
            });
          }

          return order.id;
        });
        break;
      } catch (err: any) {
        if (err.code === 'P2002' && attempts < maxAttempts) {
          continue;
        }
        throw err;
      }
    }

    if (!orderId) {
      throw new BadRequestException('Error al crear el pedido');
    }

    return {
      id: orderId,
      orderNumber: finalOrderNumber,
      total,
      paid: dto.paid || false,
      message: 'Pedido creado exitosamente',
    };
  }

  async addItems(id: number, dto: AddItemsDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, subtotal: true, discount: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      let addedSubtotal = 0;
      for (const item of dto.items) {
        const orderItem = await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: item.productId || null,
            comboId: item.comboId || null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            notes: item.notes || null,
          },
        });

        addedSubtotal += item.unitPrice * item.quantity;

        if (item.extraIds && item.extraIds.length > 0) {
          const extras = await tx.productExtra.findMany({
            where: { id: { in: item.extraIds } },
            select: { id: true, price: true },
          });
          const extrasData = extras.map(extra => ({
            orderItemId: orderItem.id,
            productExtraId: extra.id,
            price: extra.price,
          }));
          await tx.orderItemExtra.createMany({ data: extrasData });
        }
      }

      const newSubtotal = order.subtotal + addedSubtotal;
      const newTotal = newSubtotal - order.discount;

      await tx.order.update({
        where: { id },
        data: {
          subtotal: newSubtotal,
          total: newTotal,
        },
      });

      return { addedSubtotal, newTotal };
    });

    return { message: 'Ítems agregados', ...result };
  }

  async changeTable(id: number, dto: ChangeTableDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, tableId: true, type: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      if (order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'free' },
        });
      }

      if (dto.tableId) {
        await tx.table.update({
          where: { id: dto.tableId },
          data: { status: 'waiting_order' },
        });
        await tx.order.update({
          where: { id },
          data: {
            tableId: dto.tableId,
            type: 'dine_in',
          },
        });
      } else {
        const newType = order.type === 'dine_in' ? 'takeaway' : order.type;
        await tx.order.update({
          where: { id },
          data: {
            tableId: null,
            type: newType,
          },
        });
      }
    });

    return { message: 'Mesa actualizada' };
  }

  async changeType(id: number, dto: ChangeTypeDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, tableId: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      if (dto.type !== 'dine_in' && order.tableId) {
        await tx.table.update({
          where: { id: order.tableId },
          data: { status: 'free' },
        });
        await tx.order.update({
          where: { id },
          data: {
            type: dto.type,
            tableId: null,
          },
        });
      } else {
        await tx.order.update({
          where: { id },
          data: {
            type: dto.type,
          },
        });
      }
    });

    return { message: 'Tipo de pedido actualizado' };
  }

  async changeStatus(id: number, dto: ChangeStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, tableId: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id },
        data: { status: dto.status },
      });

      if (order.tableId) {
        if (dto.status === 'served' || dto.status === 'delivered') {
          // Food delivered to table — mark as "served" (awaiting explicit release or cleanup)
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: 'served' },
          });
        } else if (dto.status === 'cancelled') {
          // Cancelled orders free the table immediately
          await tx.table.update({
            where: { id: order.tableId },
            data: { status: 'free' },
          });
        }
      }
    });

    return { message: 'Estado actualizado' };
  }

  async releaseTable(id: number) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true, tableId: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    if (!order.tableId) {
      return { message: 'Esta orden no tiene mesa asignada' };
    }

    await this.prisma.$transaction(async (tx) => {
      // Free the table
      await tx.table.update({
        where: { id: order.tableId! },
        data: { status: 'free' },
      });
      // Detach table from order so it no longer shows in the "Pagadas" tab filter
      await tx.order.update({
        where: { id },
        data: { tableId: null },
      });
    });

    return { message: 'Mesa liberada exitosamente' };
  }

  async registerPayment(id: number, dto: RegisterPaymentDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!order) {
      throw new NotFoundException('Pedido no encontrado');
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.payment.create({
        data: {
          orderId: id,
          method: dto.method,
          amount: dto.amount,
          reference: dto.reference || null,
        },
      });

      const updateData: any = { paid: true };
      if (dto.tip !== undefined) {
        updateData.tip = dto.tip;
      }

      await tx.order.update({
        where: { id },
        data: updateData,
      });
    });

    return { message: 'Pago registrado' };
  }
}

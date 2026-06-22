import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class CustomersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(search?: string) {
    let where: any = { role: 'customer' };
    if (search) {
      where = {
        role: 'customer',
        OR: [
          { name: { contains: search } },
          { email: { contains: search } },
          { phone: { contains: search } },
        ],
      };
    }

    const customers = await this.prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdAt: true,
        orders: {
          where: { status: 'delivered' },
          select: { total: true },
        },
      },
    });

    const mapped = customers.map(u => {
      const totalSpent = u.orders.reduce((sum, o) => sum + o.total, 0);
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        created_at: u.createdAt, // keep camelCase/snakeCase consistency with express
        total_orders: u.orders.length,
        total_spent: totalSpent,
      };
    });

    mapped.sort((a, b) => b.total_spent - a.total_spent);
    return mapped;
  }

  async findOne(id: number) {
    const customer = await this.prisma.user.findFirst({
      where: { id, role: 'customer' },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const orders = await this.prisma.order.findMany({
      where: { customerId: id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: { id: true, orderNumber: true, type: true, status: true, total: true, createdAt: true },
    });

    const addresses = await this.prisma.customerAddress.findMany({
      where: { userId: id },
    });

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      created_at: customer.createdAt,
      orders: orders.map(o => ({
        id: o.id,
        order_number: o.orderNumber, // keep snakeCase
        type: o.type,
        status: o.status,
        total: o.total,
        created_at: o.createdAt,
      })),
      addresses: addresses.map(a => ({
        id: a.id,
        userId: a.userId,
        label: a.label,
        address: a.address,
        city: a.city,
        isDefault: a.isDefault,
      })),
    };
  }

  async createAddress(id: number, dto: CreateAddressDto) {
    const customer = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });
    if (!customer) {
      throw new NotFoundException('Cliente no encontrado');
    }

    const newAddress = await this.prisma.$transaction(async (tx) => {
      if (dto.isDefault) {
        await tx.customerAddress.updateMany({
          where: { userId: id },
          data: { isDefault: false },
        });
      }

      return tx.customerAddress.create({
        data: {
          userId: id,
          label: dto.label || null,
          address: dto.address,
          city: dto.city || null,
          isDefault: dto.isDefault ?? false,
        },
      });
    });

    return { id: newAddress.id };
  }
}

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hasForce = process.argv.includes('--force');
  if (!hasForce) {
    console.error('⚠️  ADVERTENCIA: El seed es destructivo y requiere el flag --force');
    console.error('   Ejecuta: pnpm db:seed -- --force');
    process.exit(1);
  }

  console.log('🌱 Iniciando seed de datos Piacere...');

  // --- Limpiar tablas ---
  await prisma.orderItemExtra.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.order.deleteMany();
  await prisma.comboItem.deleteMany();
  await prisma.combo.deleteMany();
  await prisma.productExtra.deleteMany();
  await prisma.product.deleteMany();
  await prisma.customerAddress.deleteMany();
  await prisma.user.deleteMany();
  await prisma.table.deleteMany();
  await prisma.tableSection.deleteMany();
  await prisma.category.deleteMany();

  // --- Categorías ---
  const catPizzas = await prisma.category.create({
    data: { name: 'Pizzas', slug: 'pizzas', isVisibleOnWeb: true, sortOrder: 1 },
  });
  const catBebidas = await prisma.category.create({
    data: { name: 'Bebidas', slug: 'bebidas', isVisibleOnWeb: true, sortOrder: 2 },
  });

  // --- Productos (Pizzas) ---
  const pizzas = [
    { name: 'Margarita', description: 'Salsa napolitana | mozzarella | albahaca.', basePrice: 7.0 },
    { name: 'Vegetariana', description: 'Salsa napolitana | mozzarella | aceitunas negras | maíz | champiñones | pimenton | cebolla.', basePrice: 10.0 },
    { name: 'Pepperoni', description: 'Salsa napolitana | mozzarella | pepperoni | hot honey.', basePrice: 10.0 },
    { name: 'Primavera', description: 'Salsa napolitana | mozzarella | maíz | jamón.', basePrice: 10.0 },
    { name: 'Maiale', description: 'Salsa napolitana | mozzarella | tocineta | jamón.', basePrice: 10.0 },
    { name: 'Al Pesto', description: 'Salsa napolitana | mozzarella | tomates deshidratados | pesto.', basePrice: 10.0 },
    { name: 'Hawaiana', description: 'Salsa napolitana | mozzarella | chutney de piña | tocineta | jamón.', basePrice: 12.0 },
    { name: 'Carlotta', description: 'Salsa napolitana | mozzarella | salchichón | maíz | pimenton | cebolla.', basePrice: 12.0 },
    { name: 'Quattro Stagioni', description: 'Salsa napolitana | mozzarella | 4 presentaciones: pepperoni + hot honey | jamón + tocineta | tomate deshidratado + pesto | champiñones + aceitunas negras.', basePrice: 12.0 },
    { name: 'Miami Style', description: 'Salsa napolitana | mozzarella | pepperoni | hot honey | albahaca | pimienta | queso crema.', basePrice: 14.0 },
    { name: 'Ragazza', description: 'Salsa napolitina | mozzarella | tocineta | queso crema | champiñones | oregano | pepperoccini.', basePrice: 14.0 },
    { name: 'Piacere', description: 'Salsa napolitana | mozzarella | tocineta | jamón | pepperoni | champiñones | maíz | aceitunas negras | tomates deshidratados | pesto.', basePrice: 15.0 },
    { name: 'La Cúspide', description: 'Salsa napolitana | mozzarella | mortadela de pistachos | pistacho triturado | rugula | AOEV.', basePrice: 16.0 },
    { name: 'Prosciutto', description: 'Salsa napolitina | mozzarella | prosciutto | parmigiano reggiano | rúgula | AOEV.', basePrice: 16.0 },
  ];

  const createdProducts: Record<string, any> = {};

  for (const pizza of pizzas) {
    const p = await prisma.product.create({
      data: { ...pizza, categoryId: catPizzas.id, isActive: true, isOnWebMenu: true },
    });
    createdProducts[p.name] = p;
  }

  // --- Productos (Bebidas) ---
  const bebidas = [
    { name: 'Nestea Peq', basePrice: 1.5 },
    { name: 'Nestea Gr', basePrice: 2.5 },
    { name: 'Refresco 1lt', basePrice: 2.5 },
    { name: 'Refresco 2lt', basePrice: 4.0 },
    { name: 'Agua 600ml', basePrice: 1.5 },
    { name: 'Refresco Lata', basePrice: 2.0 },
  ];

  for (const bebida of bebidas) {
    const p = await prisma.product.create({
      data: { ...bebida, categoryId: catBebidas.id, isActive: true, isOnWebMenu: true },
    });
    createdProducts[p.name] = p;
  }

  // --- Combos ---
  const combosData = [
    {
      name: 'Combo Dúo Clásico',
      description: '2 Pizzas Margaritas + 1 Refresco 1Lt',
      price: 15.0,
      items: [
        { productName: 'Margarita', quantity: 2 },
        { productName: 'Refresco 1lt', quantity: 1 }
      ]
    },
    {
      name: 'Combo Familiar',
      description: '1 Pizza Primavera + 1 Pizza Pepperoni + 1 Refresco 2Lt',
      price: 22.0,
      items: [
        { productName: 'Primavera', quantity: 1 },
        { productName: 'Pepperoni', quantity: 1 },
        { productName: 'Refresco 2lt', quantity: 1 }
      ]
    },
    {
      name: 'Combo Piacere Fiesta',
      description: '2 Pizzas Piacere + 2 Refrescos 2Lt',
      price: 34.0,
      items: [
        { productName: 'Piacere', quantity: 2 },
        { productName: 'Refresco 2lt', quantity: 2 }
      ]
    },
    {
      name: 'Combo Individual',
      description: '1 Pizza Margarita + 1 Refresco Lata',
      price: 8.5,
      items: [
        { productName: 'Margarita', quantity: 1 },
        { productName: 'Refresco Lata', quantity: 1 }
      ]
    },
    {
      name: 'Combo Miami Premium',
      description: '1 Pizza Miami Style + 1 Pizza La Cúspide + 1 Refresco 2Lt',
      price: 30.0,
      items: [
        { productName: 'Miami Style', quantity: 1 },
        { productName: 'La Cúspide', quantity: 1 },
        { productName: 'Refresco 2lt', quantity: 1 }
      ]
    },
    {
      name: 'Combo Hawaiano Dúo',
      description: '2 Pizzas Hawaianas + 1 Refresco 2Lt',
      price: 25.0,
      items: [
        { productName: 'Hawaiana', quantity: 2 },
        { productName: 'Refresco 2lt', quantity: 1 }
      ]
    }
  ];

  for (const comboData of combosData) {
    const combo = await prisma.combo.create({
      data: {
        name: comboData.name,
        description: comboData.description,
        price: comboData.price,
        isActive: true,
        isOnWebMenu: true
      }
    });

    for (const item of comboData.items) {
      const product = createdProducts[item.productName];
      if (product) {
        await prisma.comboItem.create({
          data: {
            comboId: combo.id,
            productId: product.id,
            quantity: item.quantity
          }
        });
      }
    }
  }

  // --- Extras ---
  const extras = [
    { name: 'Hot honey', price: 1.5 },
    { name: 'Cebolla y pimentón', price: 1.5 },
    { name: 'Maíz', price: 1.5 },
    { name: 'Aceitunas negras', price: 2.0 },
    { name: 'Tomates deshidratados', price: 2.0 },
    { name: 'Champiñones', price: 2.0 },
    { name: 'Jamón', price: 2.0 },
    { name: 'Pepperoni', price: 2.0 },
    { name: 'Queso crema', price: 3.0 },
    { name: 'Pesto', price: 2.0 },
    { name: 'Rúgula', price: 2.0 },
    { name: 'Pistachos', price: 2.0 },
    { name: 'Pecorino', price: 3.0 },
    { name: 'Parmesano', price: 3.0 },
    { name: 'Tocineta', price: 2.5 },
    { name: 'Borde de queso', price: 4.0 },
    { name: 'Extra queso', price: 4.0 },
    { name: 'Mortadela', price: 6.0 },
    { name: 'Salchichón', price: 6.0 },
    { name: 'Anchoas', price: 6.0 },
    { name: 'Prosciutto', price: 6.0 },
  ];

  for (const extra of extras) {
    await prisma.productExtra.create({ data: { ...extra, isActive: true } });
  }

  // --- Secciones y Mesas ---
  const secPrincipal = await prisma.tableSection.create({
    data: { name: 'Principal', prefix: 'P', isActive: true },
  });
  const secTerraza = await prisma.tableSection.create({
    data: { name: 'Terraza', prefix: 'T', isActive: true },
  });

  await prisma.table.createMany({
    data: [
      { name: 'P1', capacity: 4, sectionId: secPrincipal.id, status: 'free' },
      { name: 'P2', capacity: 4, sectionId: secPrincipal.id, status: 'free' },
      { name: 'P3', capacity: 6, sectionId: secPrincipal.id, status: 'free' },
      { name: 'T1', capacity: 4, sectionId: secTerraza.id, status: 'free' },
      { name: 'T2', capacity: 6, sectionId: secTerraza.id, status: 'free' },
    ],
  });

  // --- Usuarios ---
  const adminHash = await bcrypt.hash('admin123', 10);
  const cashierHash = await bcrypt.hash('cajero123', 10);

  await prisma.user.createMany({
    data: [
      { name: 'Administrador Piacere', email: 'admin@piacere.com', phone: '+1234567890', passwordHash: adminHash, role: 'admin' },
      { name: 'Cajero Piacere', email: 'cajero@piacere.com', phone: '+0987654321', passwordHash: cashierHash, role: 'cashier' },
    ],
  });

  console.log('✅ Seed completado exitosamente.');
  console.log('');
  console.log('📋 Credenciales de acceso:');
  console.log('   Admin:   admin@piacere.com   / admin123');
  console.log('   Cajero:  cajero@piacere.com  / cajero123');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

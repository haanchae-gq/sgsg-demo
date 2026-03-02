import { PrismaClient } from "../sgsg-api/src/generated/prisma/client";
import { PrismaPg } from "../sgsg-api/node_modules/@prisma/adapter-pg";
import pg from "../sgsg-api/node_modules/pg";
import bcrypt from "../sgsg-api/node_modules/bcrypt";
import "dotenv/config";

// Initialize Prisma Client with adapter 
const connectionString = process.env.DB_URL;
if (!connectionString) {
  throw new Error('DB_URL environment variable is not set');
}
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({
  adapter,
  log: ['query', 'error', 'warn'],
});

async function main() {
  console.log("🌱 Starting seed...");

  // Clean up existing user-related data (keep service categories and items)
  console.log("🧹 Cleaning up existing user data...");
  await prisma.$transaction([
    prisma.orderNote.deleteMany(),
    prisma.orderAttachment.deleteMany(),
    prisma.serviceSchedule.deleteMany(),
    prisma.payment.deleteMany(),
    prisma.review.deleteMany(),
    prisma.order.deleteMany(),
    prisma.assignmentHistory.deleteMany(),
    prisma.penaltyHistory.deleteMany(),
    prisma.masterAssignmentPolicy.deleteMany(),
    prisma.masterMembership.deleteMany(),
    prisma.subAccount.deleteMany(),
    prisma.expertServiceMapping.deleteMany(),
    prisma.expert.deleteMany(),
    prisma.customer.deleteMany(),
    prisma.admin.deleteMany(),
    prisma.address.deleteMany(),
    prisma.user.deleteMany(),
  ]);
  console.log("✅ User data cleaned up");

  // Create sample service categories (대분류) with explicit IDs for tests
  const cleaningCategory = await prisma.serviceCategory.upsert({
    where: { id: 'cl1' },
    update: {},
    create: {
      id: 'cl1',
      slug: 'cleaning',
      name: '청소 서비스',
      description: '가정 및 사무실 청소 서비스',
      displayOrder: 1,
      isActive: true,
    },
  });

  const homeRepairCategory = await prisma.serviceCategory.upsert({
    where: { id: 'cl2' },
    update: {},
    create: {
      id: 'cl2',
      slug: 'home-repair',
      name: '집수리 서비스',
      description: '가정 내 각종 수리 및 설치 서비스',
      displayOrder: 2,
      isActive: true,
    },
  });

  const movingCategory = await prisma.serviceCategory.upsert({
    where: { id: 'cl3' },
    update: {},
    create: {
      id: 'cl3',
      slug: 'moving',
      name: '이사 서비스',
      description: '포장, 운반, 정리 등 이사 관련 서비스',
      displayOrder: 3,
      isActive: true,
    },
  });

  // Create sample service items (소분류) with explicit IDs for tests
  // 청소 서비스 항목
  await prisma.serviceItem.upsert({
    where: { id: 'it1' },
    update: {},
    create: {
      id: 'it1',
      categoryId: cleaningCategory.id,
      name: '정기 청소',
      description: '주 1-2회 정기적인 가정 청소',
      basePrice: 150000,
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.serviceItem.upsert({
    where: { id: 'it2' },
    update: {},
    create: {
      id: 'it2',
      categoryId: cleaningCategory.id,
      name: '대청소',
      description: '이사 전후, 연말 등 집중적인 청소',
      basePrice: 300000,
      displayOrder: 2,
      isActive: true,
    },
  });

  await prisma.serviceItem.upsert({
    where: { id: 'it3' },
    update: {},
    create: {
      id: 'it3',
      categoryId: cleaningCategory.id,
      name: '사무실 일일 청소',
      description: '사무실 일일 청소 서비스',
      basePrice: 200000,
      displayOrder: 3,
      isActive: true,
    },
  });

  // 집수리 서비스 항목
  await prisma.serviceItem.upsert({
    where: { id: 'it4' },
    update: {},
    create: {
      id: 'it4',
      categoryId: homeRepairCategory.id,
      name: '싱크대 수리',
      description: '싱크대 및 수전 관련 수리',
      basePrice: 120000,
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.serviceItem.upsert({
    where: { id: 'it5' },
    update: {},
    create: {
      id: 'it5',
      categoryId: homeRepairCategory.id,
      name: '콘센트 설치',
      description: '전기 콘센트 신규 설치',
      basePrice: 80000,
      displayOrder: 2,
      isActive: true,
    },
  });

  // 이사 서비스 항목
  await prisma.serviceItem.upsert({
    where: { id: 'it6' },
    update: {},
    create: {
      id: 'it6',
      categoryId: movingCategory.id,
      name: '소형 이사',
      description: '원룸 또는 소형 가구 이사',
      basePrice: 500000,
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.serviceItem.upsert({
    where: { id: 'it7' },
    update: {},
    create: {
      id: 'it7',
      categoryId: movingCategory.id,
      name: '중형 이사',
      description: '아파트 중형 가구 이사',
      basePrice: 800000,
      displayOrder: 2,
      isActive: true,
    },
  });

  console.log("👤 Creating test users...");

  // Create expert user
  const expertUser = await prisma.user.upsert({
    where: { email: 'expert@sgsg.com' },
    update: {},
    create: {
      email: 'expert@sgsg.com',
      phone: '01012345678',
      passwordHash: await bcrypt.hash('Expert@123456', 10),
      name: '김전문가',
      role: 'expert',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  // Create customer user  
  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@test.com' },
    update: {},
    create: {
      email: 'customer@test.com',
      phone: '01087654321',
      passwordHash: await bcrypt.hash('Customer@123456', 10),
      name: '홍고객',
      role: 'customer',
      status: 'active',
      emailVerified: true,
      phoneVerified: true,
    },
  });

  console.log("✅ Test users created");

  // Create addresses for users
  const expertAddress = await prisma.address.upsert({
    where: { id: 'addr_expert' },
    update: {},
    create: {
      id: 'addr_expert',
      userId: expertUser.id,
      label: '사업장',
      addressLine1: '서울시 마포구 월드컵로 100',
      city: '서울시',
      state: '마포구',
      postalCode: '04000',
      country: 'South Korea',
      isDefault: true,
    },
  });

  const customerAddress = await prisma.address.upsert({
    where: { id: 'addr_customer' },
    update: {},
    create: {
      id: 'addr_customer',
      userId: customerUser.id,
      label: '집',
      addressLine1: '서울시 강남구 테헤란로 123',
      addressLine2: '456호',
      city: '서울시',
      state: '강남구',
      postalCode: '06200',
      country: 'South Korea',
      isDefault: true,
    },
  });

  console.log("📍 Addresses created");

  // Create expert profile
  const expertProfile = await prisma.expert.upsert({
    where: { userId: expertUser.id },
    update: {},
    create: {
      userId: expertUser.id,
      businessName: '김전문가 청소서비스',
      businessNumber: '123-45-67891',
      businessType: 'individual',
      businessAddressId: expertAddress.id,
      serviceRegions: ['서울시 전체', '경기도 일부'],
      totalCompletedOrders: 50,
      totalEarnings: 5000000,
      operationalStatus: 'active',
      bankName: '국민은행',
      accountNumber: '123456-78-901235',
      accountHolder: '김전문가',
      introduction: '전문 청소 서비스입니다.',
      approvalStatus: 'APPROVED',
      activeStatus: 'ACTIVE',
      membershipEnabled: true,
      membershipSlotCount: 3,
      serviceCategoryMidAvailableList: ['CLEANING', 'REPAIR'],
      regionGroups: ['SEOUL', 'GYEONGGI'],
    },
  });

  // Create customer profile
  const customerProfile = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    update: {},
    create: {
      userId: customerUser.id,
      defaultAddressId: customerAddress.id,
      totalSpent: 1000000,
      totalOrders: 5,
      favoriteCategories: ['청소 서비스'],
      preferences: {
        language: 'ko',
        marketing: true,
        notifications: true,
      },
    },
  });

  console.log("👥 Expert and customer profiles created");

  // Create expert service mapping (for service item it1)
  await prisma.expertServiceMapping.upsert({
    where: { id: 'esm1' },
    update: {},
    create: {
      id: 'esm1',
      expertId: expertProfile.id,
      serviceItemId: 'it1', // 정기 청소
      customPrice: 140000,
      isAvailable: true,
    },
  });

  console.log("🔧 Expert service mapping created");

  console.log("✅ Seed completed!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
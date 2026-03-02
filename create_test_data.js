const { PrismaClient } = require('./sgsg-api/dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');
const bcrypt = require('bcrypt');

async function createTestData() {
  // Initialize Prisma with adapter
  const connectionString = process.env.DB_URL || 'postgresql://postgres:postgres@localhost:5432/sgsg_db';
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('🌱 Creating comprehensive test data...');

    // Clean up existing test data first
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
      prisma.serviceItem.deleteMany(),
      prisma.serviceCategory.deleteMany(),
    ]);

    console.log('  📝 Cleaned existing data');

    // Create Service Categories and Items
    const cleaningCategory = await prisma.serviceCategory.create({
      data: {
        name: '청소 서비스',
        slug: 'cleaning',
        description: '가정 및 사무실 청소 서비스',
        displayOrder: 1,
        isActive: true
      }
    });

    const repairCategory = await prisma.serviceCategory.create({
      data: {
        name: '집수리 서비스',
        slug: 'repair',
        description: '가정 내 각종 수리 및 설치 서비스',
        displayOrder: 2,
        isActive: true
      }
    });

    const regularCleaning = await prisma.serviceItem.create({
      data: {
        categoryId: cleaningCategory.id,
        name: '정기 청소',
        description: '주 1-2회 정기적인 가정 청소',
        basePrice: 150000,
        estimatedTime: 120,
        requirements: ['기본 청소도구', '세제'],
        displayOrder: 1,
        isActive: true
      }
    });

    const deepCleaning = await prisma.serviceItem.create({
      data: {
        categoryId: cleaningCategory.id,
        name: '대청소',
        description: '이사 전후, 연말 등 집중적인 청소',
        basePrice: 280000,
        estimatedTime: 240,
        requirements: ['전문 청소도구', '특수 세제'],
        displayOrder: 2,
        isActive: true
      }
    });

    const sinkRepair = await prisma.serviceItem.create({
      data: {
        categoryId: repairCategory.id,
        name: '싱크대 수리',
        description: '싱크대 및 수전 관련 수리',
        basePrice: 120000,
        estimatedTime: 90,
        requirements: ['수리 도구', '부품'],
        displayOrder: 1,
        isActive: true
      }
    });

    console.log('  🏷️ Created service categories and items');

    // Create Test Users
    const masterExpertUser = await prisma.user.create({
      data: {
        email: 'master.expert@sgsg.com',
        phone: '01011111111',
        passwordHash: await bcrypt.hash('MasterExpert@123', 10),
        name: '김마스터',
        role: 'expert',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      }
    });

    const subExpertUser1 = await prisma.user.create({
      data: {
        email: 'sub1.expert@sgsg.com',
        phone: '01022222222',
        passwordHash: await bcrypt.hash('SubExpert@123', 10),
        name: '이서브',
        role: 'expert',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      }
    });

    const subExpertUser2 = await prisma.user.create({
      data: {
        email: 'sub2.expert@sgsg.com',
        phone: '01033333333',
        passwordHash: await bcrypt.hash('SubExpert@123', 10),
        name: '박서브',
        role: 'expert',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      }
    });

    const customerUser1 = await prisma.user.create({
      data: {
        email: 'customer1@test.com',
        phone: '01044444444',
        passwordHash: await bcrypt.hash('Customer@123', 10),
        name: '고객1',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      }
    });

    const customerUser2 = await prisma.user.create({
      data: {
        email: 'customer2@test.com',
        phone: '01055555555',
        passwordHash: await bcrypt.hash('Customer@123', 10),
        name: '고객2',
        role: 'customer',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      }
    });

    const adminUser = await prisma.user.create({
      data: {
        email: 'admin@sgsg.com',
        phone: '01066666666',
        passwordHash: await bcrypt.hash('Admin@123', 10),
        name: '관리자',
        role: 'admin',
        status: 'active',
        emailVerified: true,
        phoneVerified: true
      }
    });

    console.log('  👤 Created test users');

    // Create Addresses
    const address1 = await prisma.address.create({
      data: {
        userId: customerUser1.id,
        label: '집',
        addressLine1: '서울시 강남구 테헤란로 123',
        addressLine2: '456호',
        city: '서울시',
        state: '강남구',
        postalCode: '06200',
        country: 'South Korea',
        isDefault: true,
        latitude: 37.5012,
        longitude: 127.0396
      }
    });

    const address2 = await prisma.address.create({
      data: {
        userId: customerUser2.id,
        label: '사무실',
        addressLine1: '서울시 서초구 서초대로 789',
        city: '서울시',
        state: '서초구',
        postalCode: '06600',
        country: 'South Korea',
        isDefault: true,
        latitude: 37.4947,
        longitude: 127.0277
      }
    });

    const expertAddress = await prisma.address.create({
      data: {
        userId: masterExpertUser.id,
        label: '사업장',
        addressLine1: '서울시 마포구 월드컵로 100',
        city: '서울시',
        state: '마포구',
        postalCode: '04000',
        country: 'South Korea',
        isDefault: true,
        latitude: 37.5562,
        longitude: 126.9245
      }
    });

    console.log('  📍 Created addresses');

    // Create Expert Profiles
    const masterExpert = await prisma.expert.create({
      data: {
        userId: masterExpertUser.id,
        businessName: '김마스터 청소서비스',
        businessNumber: '123-45-67890',
        businessType: 'individual',
        businessAddressId: expertAddress.id,
        serviceRegions: ['서울시 전체', '경기도 일부'],
        rating: 4.8,
        totalCompletedOrders: 156,
        totalEarnings: 15600000,
        operationalStatus: 'active',
        bankName: '국민은행',
        accountNumber: '123456-78-901234',
        accountHolder: '김마스터',
        introduction: '10년 경력의 전문 청소 서비스입니다. 정성껏 깨끗하게 청소해드립니다.',
        certificateUrls: ['https://example.com/cert1.jpg'],
        portfolioImages: ['https://example.com/portfolio1.jpg', 'https://example.com/portfolio2.jpg'],
        approvalStatus: 'APPROVED',
        activeStatus: 'ACTIVE',
        membershipEnabled: true,
        membershipSlotCount: 3,
        serviceCategoryMidAvailableList: ['CLEANING', 'REPAIR'],
        regionGroups: ['SEOUL', 'GYEONGGI']
      }
    });

    console.log('  🔧 Created master expert profile');

    // Create Customer Profiles
    await prisma.customer.create({
      data: {
        userId: customerUser1.id,
        defaultAddressId: address1.id,
        totalSpent: 450000,
        totalOrders: 3,
        favoriteCategories: ['청소 서비스'],
        lastServiceDate: new Date('2026-02-15'),
        preferences: {
          language: 'ko',
          marketing: true,
          notifications: true,
          preferredTime: 'morning'
        }
      }
    });

    await prisma.customer.create({
      data: {
        userId: customerUser2.id,
        defaultAddressId: address2.id,
        totalSpent: 280000,
        totalOrders: 1,
        favoriteCategories: ['청소 서비스'],
        lastServiceDate: new Date('2026-02-20'),
        preferences: {
          language: 'ko',
          marketing: false,
          notifications: true,
          preferredTime: 'afternoon'
        }
      }
    });

    // Create Admin Profile
    await prisma.admin.create({
      data: {
        userId: adminUser.id,
        department: 'Operations',
        position: 'Manager',
        permissions: ['expert_management', 'order_management', 'penalty_management']
      }
    });

    console.log('  👥 Created customer and admin profiles');

    // Create Sub Accounts
    const subAccount1 = await prisma.subAccount.create({
      data: {
        masterAccountId: masterExpert.id,
        userId: subExpertUser1.id,
        accountType: 'SUB',
        approvalStatus: 'APPROVED',
        activeStatus: 'ACTIVE',
        permissions: ['schedule_management', 'order_view'],
        assignedWorkerId: 'WORKER_001'
      }
    });

    const subAccount2 = await prisma.subAccount.create({
      data: {
        masterAccountId: masterExpert.id,
        userId: subExpertUser2.id,
        accountType: 'SUB',
        approvalStatus: 'APPROVED',
        activeStatus: 'ACTIVE',
        permissions: ['schedule_management', 'order_management'],
        assignedWorkerId: 'WORKER_002'
      }
    });

    console.log('  🤝 Created sub accounts');

    // Create Master Membership
    await prisma.masterMembership.create({
      data: {
        masterAccountId: masterExpert.id,
        membershipEnabled: true,
        membershipStatus: 'ACTIVE',
        membershipSlotCount: 3,
        membershipMidList: ['CLEANING', 'REPAIR'],
        membershipRegionGroups: ['SEOUL', 'GYEONGGI'],
        startDate: new Date('2026-01-01'),
        endDate: new Date('2026-12-31')
      }
    });

    console.log('  💳 Created master membership');

    // Create Assignment Policy
    await prisma.masterAssignmentPolicy.create({
      data: {
        masterAccountId: masterExpert.id,
        dailyAssignmentLimit: 15,
        isActive: true,
        effectiveFrom: new Date('2026-01-01'),
        effectiveTo: new Date('2026-12-31')
      }
    });

    console.log('  📋 Created assignment policy');

    // Create Expert Service Mappings
    await prisma.expertServiceMapping.create({
      data: {
        expertId: masterExpert.id,
        serviceItemId: regularCleaning.id,
        customPrice: 140000,
        isAvailable: true
      }
    });

    await prisma.expertServiceMapping.create({
      data: {
        expertId: masterExpert.id,
        serviceItemId: deepCleaning.id,
        customPrice: 270000,
        isAvailable: true
      }
    });

    console.log('  🔗 Created service mappings');

    // Create Orders
    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-20260301-001',
        customerId: customerUser1.id,
        expertId: masterExpert.id,
        serviceItemId: regularCleaning.id,
        addressId: address1.id,
        status: 'schedule_confirmed',
        paymentStatus: 'deposit_paid',
        requestedDate: new Date('2026-03-05T10:00:00Z'),
        confirmedDate: new Date('2026-03-02T15:30:00Z'),
        basePrice: 150000,
        depositAmount: 30000,
        totalAmount: 150000,
        paidAmount: 30000,
        customerNotes: '정기 청소 부탁드립니다. 반려동물 있습니다.'
      }
    });

    const order2 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-20260301-002',
        customerId: customerUser2.id,
        expertId: masterExpert.id,
        serviceItemId: deepCleaning.id,
        addressId: address2.id,
        status: 'in_progress',
        paymentStatus: 'balance_pending',
        requestedDate: new Date('2026-03-03T14:00:00Z'),
        confirmedDate: new Date('2026-03-01T10:00:00Z'),
        startedAt: new Date('2026-03-03T14:00:00Z'),
        basePrice: 280000,
        depositAmount: 56000,
        totalAmount: 280000,
        paidAmount: 56000,
        customerNotes: '이사 전 대청소 부탁드립니다.'
      }
    });

    const order3 = await prisma.order.create({
      data: {
        orderNumber: 'ORD-20260301-003',
        customerId: customerUser1.id,
        expertId: masterExpert.id,
        serviceItemId: sinkRepair.id,
        addressId: address1.id,
        status: 'schedule_pending',
        paymentStatus: 'pending',
        requestedDate: new Date('2026-03-08T16:00:00Z'),
        basePrice: 120000,
        depositAmount: 24000,
        totalAmount: 120000,
        paidAmount: 0,
        customerNotes: '싱크대 수전이 고장났습니다.'
      }
    });

    console.log('  📦 Created orders');

    // Create Service Schedules
    await prisma.serviceSchedule.create({
      data: {
        orderId: order1.id,
        expertId: masterExpert.id,
        scheduledDate: new Date('2026-03-05'),
        startTime: '10:00',
        endTime: '12:00',
        status: 'scheduled',
        notes: '정기 청소 - 반려동물 주의'
      }
    });

    await prisma.serviceSchedule.create({
      data: {
        orderId: order2.id,
        expertId: masterExpert.id,
        scheduledDate: new Date('2026-03-03'),
        startTime: '14:00',
        endTime: '18:00',
        status: 'in_progress',
        notes: '대청소 - 이사 전 완벽 청소'
      }
    });

    console.log('  📅 Created service schedules');

    // Create Assignment History
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date(today);
    dayBefore.setDate(today.getDate() - 2);

    await prisma.assignmentHistory.create({
      data: {
        orderId: order1.id,
        assignedMasterId: masterExpert.id,
        assignedWorkerId: subAccount1.id,
        assignmentType: 'AUTO_ASSIGN',
        assignmentResultStatus: 'ACCEPTED',
        isMembershipAssignment: true,
        membershipSlotCountAtTime: 3,
        weightAtTime: 0.8,
        serviceMidAtTime: 'CLEANING',
        regionGroupAtTime: 'SEOUL',
        assignedAt: yesterday,
        respondedAt: yesterday
      }
    });

    await prisma.assignmentHistory.create({
      data: {
        orderId: order2.id,
        assignedMasterId: masterExpert.id,
        assignedWorkerId: subAccount2.id,
        assignmentType: 'MANUAL_ASSIGN',
        assignmentResultStatus: 'ACCEPTED',
        isMembershipAssignment: false,
        membershipSlotCountAtTime: 3,
        weightAtTime: 0.9,
        serviceMidAtTime: 'CLEANING',
        regionGroupAtTime: 'SEOUL',
        assignedAt: dayBefore,
        respondedAt: dayBefore
      }
    });

    console.log('  📊 Created assignment history');

    // Create Penalty History (past penalty, now expired)
    const pastDate = new Date('2026-01-15');
    const expiredDate = new Date('2026-02-15');

    await prisma.penaltyHistory.create({
      data: {
        masterAccountId: masterExpert.id,
        penaltyType: 'SOFT_LIMIT',
        penaltyStatus: 'EXPIRED',
        reasonCode: 'HIGH_TIMEOUT',
        reasonDetail: '배정 응답 지연이 반복되어 소프트 제한 적용',
        appliedByAdminId: adminUser.id,
        targetMidList: ['CLEANING'],
        targetRegionGroups: ['SEOUL'],
        startDate: pastDate,
        endDate: expiredDate
      }
    });

    console.log('  ⚠️ Created penalty history');

    // Create Payments
    await prisma.payment.create({
      data: {
        orderId: order1.id,
        paymentNumber: 'PAY-20260301-001',
        paymentType: 'deposit',
        method: 'credit_card',
        amount: 30000,
        status: 'completed',
        pgProvider: 'KCP',
        pgTransactionId: 'TXN-20260301-001',
        pgResponse: { status: 'approved', approvalNo: '12345678' },
        paidAt: new Date('2026-03-01T16:00:00Z')
      }
    });

    await prisma.payment.create({
      data: {
        orderId: order2.id,
        paymentNumber: 'PAY-20260301-002',
        paymentType: 'deposit',
        method: 'virtual_account',
        amount: 56000,
        status: 'completed',
        pgProvider: 'INICIS',
        pgTransactionId: 'TXN-20260301-002',
        pgResponse: { status: 'approved', virtualAccount: '9876543210' },
        paidAt: new Date('2026-03-01T11:30:00Z')
      }
    });

    console.log('  💳 Created payments');

    // Update Expert stats based on created data
    await prisma.expert.update({
      where: { id: masterExpert.id },
      data: {
        totalCompletedOrders: 2, // Simulating previous completed orders
        totalEarnings: 86000 // Previous earnings + current deposits
      }
    });

    console.log('  📈 Updated expert statistics');

    console.log('\n✅ Test data creation completed!');
    console.log('\n📋 Created Data Summary:');
    console.log('  - 👤 Users: 6 (1 master expert, 2 sub experts, 2 customers, 1 admin)');
    console.log('  - 🏷️ Service Categories: 2');
    console.log('  - 📦 Service Items: 3');
    console.log('  - 📍 Addresses: 3');
    console.log('  - 🔧 Expert Profiles: 1 master + 2 subs');
    console.log('  - 👥 Sub Accounts: 2');
    console.log('  - 💳 Master Membership: 1');
    console.log('  - 📋 Assignment Policy: 1');
    console.log('  - 📦 Orders: 3 (various statuses)');
    console.log('  - 📅 Schedules: 2');
    console.log('  - 📊 Assignment History: 2');
    console.log('  - ⚠️ Penalty History: 1 (expired)');
    console.log('  - 💳 Payments: 2');
    console.log('\n🔐 Test Login Credentials:');
    console.log('  - Master Expert: master.expert@sgsg.com / MasterExpert@123');
    console.log('  - Sub Expert 1: sub1.expert@sgsg.com / SubExpert@123');
    console.log('  - Sub Expert 2: sub2.expert@sgsg.com / SubExpert@123');
    console.log('  - Customer 1: customer1@test.com / Customer@123');
    console.log('  - Customer 2: customer2@test.com / Customer@123');
    console.log('  - Admin: admin@sgsg.com / Admin@123');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
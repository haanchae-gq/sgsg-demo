const { PrismaClient } = require('./sgsg-api/dist/generated/prisma/client');
const { PrismaPg } = require('@prisma/adapter-pg');
const pg = require('pg');

async function setupExpert() {
  // Initialize Prisma with adapter
  const connectionString = process.env.DB_URL || 'postgresql://postgres:postgres@localhost:5432/sgsg_db';
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  try {
    console.log('Setting up expert profile...');
    
    // Find the test expert user
    const user = await prisma.user.findUnique({
      where: { email: 'expert.test@sgsg.com' }
    });
    
    if (!user) {
      console.log('User not found!');
      return;
    }

    // Update user status to active
    await prisma.user.update({
      where: { id: user.id },
      data: { status: 'active' }
    });

    // Check if expert profile exists
    let expert = await prisma.expert.findUnique({
      where: { userId: user.id }
    });

    if (!expert) {
      // Create expert profile
      expert = await prisma.expert.create({
        data: {
          userId: user.id,
          businessName: '테스트 전문가 사업자',
          businessNumber: '123-45-67890',
          businessType: 'individual',
          serviceRegions: ['서울시', '경기도'],
          operationalStatus: 'active',
          approvalStatus: 'APPROVED',
          activeStatus: 'ACTIVE',
          membershipEnabled: true,
          membershipSlotCount: 3,
          serviceCategoryMidAvailableList: ['CLEANING', 'HOME_REPAIR'],
          regionGroups: ['SEOUL', 'GYEONGGI']
        }
      });
    } else {
      // Update existing expert
      expert = await prisma.expert.update({
        where: { id: expert.id },
        data: {
          approvalStatus: 'APPROVED',
          activeStatus: 'ACTIVE',
          membershipEnabled: true,
          membershipSlotCount: 3,
          serviceCategoryMidAvailableList: ['CLEANING', 'HOME_REPAIR'],
          regionGroups: ['SEOUL', 'GYEONGGI']
        }
      });
    }

    // Create master membership if it doesn't exist
    const membership = await prisma.masterMembership.upsert({
      where: { masterAccountId: expert.id },
      update: {
        membershipEnabled: true,
        membershipStatus: 'ACTIVE',
        membershipSlotCount: 3,
        membershipMidList: ['CLEANING', 'HOME_REPAIR'],
        membershipRegionGroups: ['SEOUL', 'GYEONGGI']
      },
      create: {
        masterAccountId: expert.id,
        membershipEnabled: true,
        membershipStatus: 'ACTIVE',
        membershipSlotCount: 3,
        membershipMidList: ['CLEANING', 'HOME_REPAIR'],  
        membershipRegionGroups: ['SEOUL', 'GYEONGGI'],
        startDate: new Date(),
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year from now
      }
    });

    // Create assignment policy
    await prisma.masterAssignmentPolicy.upsert({
      where: { masterAccountId: expert.id },
      update: {
        dailyAssignmentLimit: 10,
        isActive: true,
        effectiveFrom: new Date()
      },
      create: {
        masterAccountId: expert.id,
        dailyAssignmentLimit: 10,
        isActive: true,
        effectiveFrom: new Date()
      }
    });

    console.log('✅ Expert setup completed successfully!');
    console.log('User ID:', user.id);
    console.log('Expert ID:', expert.id);

  } catch (error) {
    console.error('Error setting up expert:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setupExpert();
const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4001';

async function createTestData() {
  console.log('🌱 Creating comprehensive test data via API...');

  try {
    // Step 1: Create test users
    console.log('\n1. Creating test users...');
    
    // Create master expert
    const masterExpertResponse = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'master.expert@sgsg.com',
        phone: '01011111111',
        password: 'MasterExpert@123',
        name: '김마스터',
        role: 'expert'
      })
    });
    const masterExpertData = await masterExpertResponse.json();
    console.log('  ✅ Master expert created:', masterExpertData.data?.user?.email);
    const masterToken = masterExpertData.data?.accessToken;

    // Create sub expert 1
    const subExpert1Response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sub1.expert@sgsg.com',
        phone: '01022222222',
        password: 'SubExpert@123',
        name: '이서브',
        role: 'expert'
      })
    });
    const subExpert1Data = await subExpert1Response.json();
    console.log('  ✅ Sub expert 1 created:', subExpert1Data.data?.user?.email);

    // Create sub expert 2
    const subExpert2Response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sub2.expert@sgsg.com',
        phone: '01033333333',
        password: 'SubExpert@123',
        name: '박서브',
        role: 'expert'
      })
    });
    const subExpert2Data = await subExpert2Response.json();
    console.log('  ✅ Sub expert 2 created:', subExpert2Data.data?.user?.email);

    // Create customers
    const customer1Response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer1@test.com',
        phone: '01044444444',
        password: 'Customer@123',
        name: '고객1',
        role: 'customer'
      })
    });
    const customer1Data = await customer1Response.json();
    console.log('  ✅ Customer 1 created:', customer1Data.data?.user?.email);

    const customer2Response = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'customer2@test.com',
        phone: '01055555555',
        password: 'Customer@123',
        name: '고객2',
        role: 'customer'
      })
    });
    const customer2Data = await customer2Response.json();
    console.log('  ✅ Customer 2 created:', customer2Data.data?.user?.email);

    // Create admin
    const adminResponse = await fetch(`${BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@sgsg.com',
        phone: '01066666666',
        password: 'Admin@123',
        name: '관리자',
        role: 'admin'
      })
    });
    const adminData = await adminResponse.json();
    console.log('  ✅ Admin created:', adminData.data?.user?.email);

    if (!masterToken) {
      console.log('❌ Failed to get master expert token');
      return;
    }

    const authHeaders = {
      'Authorization': `Bearer ${masterToken}`,
      'Content-Type': 'application/json'
    };

    // Step 2: Create sub accounts for master expert
    console.log('\n2. Creating sub accounts...');

    const subAccount1Response = await fetch(`${BASE_URL}/api/v1/experts/me/sub-accounts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: '이서브',
        email: 'sub1.expert.sub@sgsg.com',
        phone: '01077777777',
        password: 'SubAccount@123',
        permissions: ['schedule_management', 'order_view'],
        assignedWorkerId: 'WORKER_001'
      })
    });
    const subAccount1Data = await subAccount1Response.json();
    console.log('  ✅ Sub account 1 created:', subAccount1Data.success ? 'Success' : 'Failed');

    const subAccount2Response = await fetch(`${BASE_URL}/api/v1/experts/me/sub-accounts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: '박서브',
        email: 'sub2.expert.sub@sgsg.com',
        phone: '01088888888',
        password: 'SubAccount@123',
        permissions: ['schedule_management', 'order_management'],
        assignedWorkerId: 'WORKER_002'
      })
    });
    const subAccount2Data = await subAccount2Response.json();
    console.log('  ✅ Sub account 2 created:', subAccount2Data.success ? 'Success' : 'Failed');

    // Step 3: Test all APIs with the created data
    console.log('\n3. Testing APIs with created data...');

    // Test expert profile
    const profileResponse = await fetch(`${BASE_URL}/api/v1/experts/me`, {
      headers: authHeaders
    });
    const profileData = await profileResponse.json();
    console.log('  📋 Profile:', profileData.success ? '✅ Working' : '❌ Failed');

    // Test sub accounts listing
    const subAccountsResponse = await fetch(`${BASE_URL}/api/v1/experts/me/sub-accounts`, {
      headers: authHeaders
    });
    const subAccountsData = await subAccountsResponse.json();
    console.log('  👥 Sub accounts:', subAccountsData.success ? `✅ ${subAccountsData.data?.data?.length || 0} accounts` : '❌ Failed');

    // Test membership info
    const membershipResponse = await fetch(`${BASE_URL}/api/v1/experts/me/membership`, {
      headers: authHeaders
    });
    const membershipData = await membershipResponse.json();
    console.log('  💳 Membership:', membershipData.success ? '✅ Working' : '❌ Failed');

    // Test schedules
    const scheduleResponse = await fetch(`${BASE_URL}/api/v1/experts/me/schedule`, {
      headers: authHeaders
    });
    const scheduleData = await scheduleResponse.json();
    console.log('  📅 Schedules:', scheduleData.success ? `✅ ${scheduleData.data?.data?.length || 0} schedules` : '❌ Failed');

    // Test assignment history
    const assignmentResponse = await fetch(`${BASE_URL}/api/v1/experts/me/assignment-history`, {
      headers: authHeaders
    });
    const assignmentData = await assignmentResponse.json();
    console.log('  📊 Assignment history:', assignmentData.success ? `✅ ${assignmentData.data?.histories?.length || 0} assignments` : '❌ Failed');

    // Test penalty history
    const penaltyResponse = await fetch(`${BASE_URL}/api/v1/experts/me/penalties`, {
      headers: authHeaders
    });
    const penaltyData = await penaltyResponse.json();
    console.log('  ⚠️ Penalties:', penaltyData.success ? `✅ ${penaltyData.data?.penalties?.length || 0} penalties` : '❌ Failed');

    // Test statistics
    const statsResponse = await fetch(`${BASE_URL}/api/v1/experts/me/statistics`, {
      headers: authHeaders
    });
    const statsData = await statsResponse.json();
    console.log('  📈 Statistics:', statsData.success ? '✅ Working' : '❌ Failed');

    // Test daily assignment limit
    const dailyLimitResponse = await fetch(`${BASE_URL}/api/v1/experts/me/daily-assignment-limit`, {
      headers: authHeaders
    });
    const dailyLimitData = await dailyLimitResponse.json();
    console.log('  🎯 Daily limit:', dailyLimitData.success ? '✅ Working' : '❌ Failed');

    console.log('\n✅ Test data creation and verification completed!');
    console.log('\n🔐 Test Login Credentials:');
    console.log('  - Master Expert: master.expert@sgsg.com / MasterExpert@123');
    console.log('  - Sub Expert 1: sub1.expert@sgsg.com / SubExpert@123');
    console.log('  - Sub Expert 2: sub2.expert@sgsg.com / SubExpert@123');
    console.log('  - Customer 1: customer1@test.com / Customer@123');
    console.log('  - Customer 2: customer2@test.com / Customer@123');
    console.log('  - Admin: admin@sgsg.com / Admin@123');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  }
}

createTestData();
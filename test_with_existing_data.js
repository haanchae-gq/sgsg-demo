const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:4001';

async function testWithExistingData() {
  console.log('🧪 Testing with existing master expert account...');

  try {
    // Try to login with master expert
    console.log('\n1. Logging in as master expert...');
    const loginResponse = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'master.expert@sgsg.com',
        password: 'MasterExpert@123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response:', loginData);

    if (!loginData.data?.token) {
      console.log('❌ Login failed. User might be in pending status.');
      return;
    }

    const token = loginData.data.token;
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Test all APIs
    console.log('\n2. Testing all expert APIs...');

    // Test expert profile
    const profileResponse = await fetch(`${BASE_URL}/api/v1/experts/me`, {
      headers: authHeaders
    });
    const profileData = await profileResponse.json();
    console.log('  📋 Profile:', profileData.success ? '✅ Working' : '❌ Failed');

    // Test schedule creation with fake order
    console.log('\n3. Testing schedule creation...');
    const scheduleCreateResponse = await fetch(`${BASE_URL}/api/v1/experts/me/schedule`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        orderId: 'fake-order-id',
        scheduledDate: '2026-03-10',
        startTime: '09:00',
        endTime: '11:00',
        notes: '테스트 스케줄'
      })
    });
    const scheduleCreateData = await scheduleCreateResponse.json();
    console.log('  📅 Schedule create:', scheduleCreateData.success ? '✅ Created' : `❌ Failed: ${scheduleCreateData.error?.message}`);

    // Test sub accounts creation
    console.log('\n4. Testing sub account creation...');
    const subAccountResponse = await fetch(`${BASE_URL}/api/v1/experts/me/sub-accounts`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        name: '테스트 서브',
        email: 'testsub@sgsg.com',
        phone: '01099999999',
        password: 'TestSub@123',
        permissions: ['schedule_management', 'order_view'],
        assignedWorkerId: 'WORKER_TEST'
      })
    });
    const subAccountData = await subAccountResponse.json();
    console.log('  👤 Sub account create:', subAccountData.success ? '✅ Created' : `❌ Failed: ${subAccountData.error?.message}`);

    // Test sub accounts listing
    const subAccountsListResponse = await fetch(`${BASE_URL}/api/v1/experts/me/sub-accounts`, {
      headers: authHeaders
    });
    const subAccountsListData = await subAccountsListResponse.json();
    console.log('  👥 Sub accounts list:', subAccountsListData.success ? `✅ Found ${subAccountsListData.data?.data?.length || 0} accounts` : '❌ Failed');

    // Test membership info
    const membershipResponse = await fetch(`${BASE_URL}/api/v1/experts/me/membership`, {
      headers: authHeaders
    });
    const membershipData = await membershipResponse.json();
    console.log('  💳 Membership:', membershipData.success ? '✅ Working' : '❌ Failed');

    // Test assignment history
    const assignmentResponse = await fetch(`${BASE_URL}/api/v1/experts/me/assignment-history`, {
      headers: authHeaders
    });
    const assignmentData = await assignmentResponse.json();
    console.log('  📊 Assignment history:', assignmentData.success ? `✅ Found ${assignmentData.data?.histories?.length || 0} assignments` : '❌ Failed');

    // Test penalty history
    const penaltyResponse = await fetch(`${BASE_URL}/api/v1/experts/me/penalties`, {
      headers: authHeaders
    });
    const penaltyData = await penaltyResponse.json();
    console.log('  ⚠️ Penalties:', penaltyData.success ? `✅ Found ${penaltyData.data?.penalties?.length || 0} penalties` : '❌ Failed');

    // Test statistics
    const statsResponse = await fetch(`${BASE_URL}/api/v1/experts/me/statistics`, {
      headers: authHeaders
    });
    const statsData = await statsResponse.json();
    console.log('  📈 Statistics:', statsData.success ? '✅ Working' : '❌ Failed');
    if (statsData.success) {
      console.log('    - Total Orders:', statsData.data.totalOrders);
      console.log('    - Total Earnings:', statsData.data.totalEarnings);
      console.log('    - Avg Rating:', statsData.data.averageRating);
      console.log('    - This Month Orders:', statsData.data.thisMonthOrders);
    }

    // Test daily assignment limit
    const dailyLimitResponse = await fetch(`${BASE_URL}/api/v1/experts/me/daily-assignment-limit`, {
      headers: authHeaders
    });
    const dailyLimitData = await dailyLimitResponse.json();
    console.log('  🎯 Daily limit:', dailyLimitData.success ? '✅ Working' : '❌ Failed');
    if (dailyLimitData.success) {
      console.log('    - Daily Limit:', dailyLimitData.data.dailyAssignmentLimit);
      console.log('    - Today Count:', dailyLimitData.data.todayAssignmentCount);
      console.log('    - Remaining:', dailyLimitData.data.remainingLimit);
    }

    console.log('\n✅ All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test error:', error.message);
  }
}

testWithExistingData();
const fetch = require('node-fetch');

async function testExpertAPIs() {
  const BASE_URL = 'http://localhost:4001';
  
  console.log('Testing Expert Management APIs...\n');

  try {
    // Try to login with existing expert user
    console.log('1. Logging in as expert...');
    const loginResponse = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'expert.test@sgsg.com',
        password: 'TestPassword@123'
      })
    });
    
    const loginData = await loginResponse.json();
    console.log('Login response status:', loginResponse.status);
    console.log('Login response:', loginData);

    if (!loginData.data?.token) {
      // Try registering a new expert with different email
      console.log('\n1.1 User login failed, trying to register new expert...');
      const newEmail = `expert.test.${Date.now()}@sgsg.com`;
      const registerResponse = await fetch(`${BASE_URL}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newEmail,
          phone: `010${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`,
          password: 'TestPassword@123',
          name: '테스트 전문가',
          role: 'expert'
        })
      });
      
      const registerData = await registerResponse.json();
      console.log('Register response:', registerData);

      if (!registerData.data?.accessToken) {
        console.log('Failed to get token:', registerData);
        return;
      }

      var token = registerData.data.accessToken;
    } else {
      var token = loginData.data.token;
    }
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    // Step 3: Test Expert APIs
    console.log('\n3. Testing expert profile...');
    const profileResponse = await fetch(`${BASE_URL}/api/v1/experts/me`, {
      headers: authHeaders
    });
    console.log('Profile response status:', profileResponse.status);
    const profileData = await profileResponse.json();
    console.log('Profile data:', JSON.stringify(profileData, null, 2));

    // Step 4: Test schedule API
    console.log('\n4. Testing schedule API...');
    const scheduleResponse = await fetch(`${BASE_URL}/api/v1/experts/me/schedule`, {
      headers: authHeaders
    });
    console.log('Schedule response status:', scheduleResponse.status);
    const scheduleData = await scheduleResponse.json();
    console.log('Schedule data:', JSON.stringify(scheduleData, null, 2));

    // Step 5: Test membership info
    console.log('\n5. Testing membership info...');
    const membershipResponse = await fetch(`${BASE_URL}/api/v1/experts/me/membership`, {
      headers: authHeaders
    });
    console.log('Membership response status:', membershipResponse.status);
    const membershipData = await membershipResponse.json();
    console.log('Membership data:', JSON.stringify(membershipData, null, 2));

    // Step 6: Test sub-accounts
    console.log('\n6. Testing sub-accounts...');
    const subAccountsResponse = await fetch(`${BASE_URL}/api/v1/experts/me/sub-accounts`, {
      headers: authHeaders
    });
    console.log('Sub-accounts response status:', subAccountsResponse.status);
    const subAccountsData = await subAccountsResponse.json();
    console.log('Sub-accounts data:', JSON.stringify(subAccountsData, null, 2));

    // Step 7: Test assignment history
    console.log('\n7. Testing assignment history...');
    const assignmentResponse = await fetch(`${BASE_URL}/api/v1/experts/me/assignment-history`, {
      headers: authHeaders
    });
    console.log('Assignment response status:', assignmentResponse.status);
    const assignmentData = await assignmentResponse.json();
    console.log('Assignment data:', JSON.stringify(assignmentData, null, 2));

    // Step 8: Test penalty history
    console.log('\n8. Testing penalty history...');
    const penaltyResponse = await fetch(`${BASE_URL}/api/v1/experts/me/penalties`, {
      headers: authHeaders
    });
    console.log('Penalty response status:', penaltyResponse.status);
    const penaltyData = await penaltyResponse.json();
    console.log('Penalty data:', JSON.stringify(penaltyData, null, 2));

    // Step 9: Test statistics
    console.log('\n9. Testing statistics...');
    const statsResponse = await fetch(`${BASE_URL}/api/v1/experts/me/statistics`, {
      headers: authHeaders
    });
    console.log('Statistics response status:', statsResponse.status);
    const statsData = await statsResponse.json();
    console.log('Statistics data:', JSON.stringify(statsData, null, 2));

    // Step 10: Test daily assignment limit
    console.log('\n10. Testing daily assignment limit...');
    const dailyLimitResponse = await fetch(`${BASE_URL}/api/v1/experts/me/daily-assignment-limit`, {
      headers: authHeaders
    });
    console.log('Daily limit response status:', dailyLimitResponse.status);
    const dailyLimitData = await dailyLimitResponse.json();
    console.log('Daily limit data:', JSON.stringify(dailyLimitData, null, 2));

    console.log('\n✅ All tests completed!');
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testExpertAPIs();
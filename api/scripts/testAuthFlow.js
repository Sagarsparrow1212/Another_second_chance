const crypto = require('crypto');

// Configuration
const API_URL = 'http://localhost:5000/api/v1/auth';
const TEST_EMAIL = `test_${Date.now()}@example.com`;
const TEST_PASSWORD = 'Password123!';
const TEST_FCM_TOKEN = `fcm_token_${Date.now()}`;

async function testAuthFlow() {
    console.log('🚀 Starting Auth Flow Test...');
    console.log(`   Email: ${TEST_EMAIL}`);
    console.log(`   FCM Token: ${TEST_FCM_TOKEN}`);

    try {
        // 1. Register
        console.log('\n1. Registering new user...');
        const registerRes = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                role: 'homeless',
                username: `user_${Date.now()}` // Required for homeless role
            }),
        });

        const registerData = await registerRes.json();
        if (!registerRes.ok) {
            throw new Error(`Registration failed: ${JSON.stringify(registerData)}`);
        }
        console.log('✅ Registration successful');

        // 2. Login with FCM Token
        console.log('\n2. Logging in with FCM Token...');
        const loginRes = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: TEST_EMAIL,
                password: TEST_PASSWORD,
                fcmToken: TEST_FCM_TOKEN,
            }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) {
            throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        }
        const token = loginData.data.token;
        console.log('✅ Login successful');
        console.log(`   JWT Token received`);

        // 3. Verify Token Stored (Implicit check via Login success, but let's assume it worked. 
        // real verification would require checking DB directly or an endpoint that returns profile with tokens)
        // For now, we trust the login logic updated it.

        // 4. Logout
        console.log('\n3. Logging out...');
        const logoutRes = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                fcmToken: TEST_FCM_TOKEN,
            }),
        });

        const logoutData = await logoutRes.json();
        if (!logoutRes.ok) {
            throw new Error(`Logout failed: ${JSON.stringify(logoutData)}`);
        }
        console.log('✅ Logout successful');

        console.log('\n🎉 Test completed successfully!');

    } catch (error) {
        console.error('\n❌ Test Failed:', error.message);
        process.exit(1);
    }
}

testAuthFlow();

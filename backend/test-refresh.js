const http = require('http');

// Test 1: Login avec refresh token
function testLogin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'pizzalif@gmail.com',
      password: 'motdepasse123'
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const cookies = res.headers['set-cookie'];
        const refreshToken = cookies ? cookies.find(c => c.startsWith('refreshToken=')) : null;
        
        console.log('✅ Login Response Status:', res.statusCode);
        console.log('✅ Response Body:', data);
        console.log('✅ Refresh Token Cookie:', refreshToken ? 'Present' : 'Missing');
        
        if (refreshToken) {
          resolve(refreshToken);
        } else {
          reject('No refresh token in response');
        }
      });
    });

    req.on('error', (e) => {
      reject(`Login error: ${e.message}`);
    });

    req.write(postData);
    req.end();
  });
}

// Test 2: Utiliser refresh token
function testRefresh(refreshTokenCookie) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/auth/refresh',
      method: 'POST',
      headers: {
        'Cookie': refreshTokenCookie
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n🔄 Refresh Response Status:', res.statusCode);
        console.log('🔄 Response Body:', data);
        
        if (res.statusCode === 200) {
          const parsed = JSON.parse(data);
          if (parsed.access_token) {
            console.log('✅ New access token received');
            resolve(parsed.access_token);
          } else {
            reject('No access token in refresh response');
          }
        } else {
          reject(`Refresh failed with status ${res.statusCode}`);
        }
      });
    });

    req.on('error', (e) => {
      reject(`Refresh error: ${e.message}`);
    });

    req.end();
  });
}

// Test 3: Utiliser nouveau access token
function testProtectedRoute(accessToken) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log('\n🔒 Protected Route Status:', res.statusCode);
        if (res.statusCode === 200) {
          console.log('✅ Access with new token successful');
          resolve();
        } else {
          console.log('❌ Access denied:', data);
          reject(`Protected route failed with status ${res.statusCode}`);
        }
      });
    });

    req.on('error', (e) => {
      reject(`Protected route error: ${e.message}`);
    });

    req.end();
  });
}

// Exécuter les tests
async function runTests() {
  try {
    console.log('🧪 Testing Refresh Token System\n');
    
    const refreshTokenCookie = await testLogin();
    const newAccessToken = await testRefresh(refreshTokenCookie);
    await testProtectedRoute(newAccessToken);
    
    console.log('\n🎉 All tests passed! Refresh token system working correctly.');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error);
  }
}

runTests();
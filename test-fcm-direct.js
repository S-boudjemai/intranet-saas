// Test direct Firebase Admin SDK
const admin = require('firebase-admin');

// Configuration Firebase (même que dans notifications.service.ts)
if (!admin.apps.length) {
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID || 'intranet-saas',
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'firebase-adminsdk-fbsvc@intranet-saas.iam.gserviceaccount.com',
  };

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('🔥 Firebase Admin initialisé');
}

async function testFCMDirect() {
  try {
    // Token de test (remplacez par un vrai token de votre frontend)
    const testToken = 'f14xSMcDndiaxXA4d6Bb_YOUR_FULL_TOKEN_HERE';
    
    console.log('📱 Test envoi FCM direct...');
    console.log('🔑 Token:', testToken.substring(0, 20) + '...');

    const message = {
      notification: {
        title: 'Test Direct FCM',
        body: 'Test depuis Node.js direct',
      },
      data: {
        type: 'test',
        url: '/dashboard',
      },
      token: testToken,
    };

    const response = await admin.messaging().send(message);
    console.log('✅ FCM Direct success:', response);

  } catch (error) {
    console.error('❌ FCM Direct error:');
    console.error('   Message:', error.message);
    console.error('   Code:', error.code);
    console.error('   Full:', JSON.stringify(error, null, 2));
  }
}

console.log('INSTRUCTIONS:');
console.log('1. Récupérez votre token FCM complet depuis la console:');
console.log('   localStorage.getItem("fcm-token")');
console.log('2. Remplacez testToken ci-dessus');
console.log('3. Lancez: node test-fcm-direct.js');
console.log('');

// Décommentez pour lancer le test
// testFCMDirect();
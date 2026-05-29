import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

// Prevent initializeApp from throwing if called multiple times in Serverless
try {
  if (!getApps().length) {
    // Requires FIREBASE_SERVICE_ACCOUNT environment variable in Vercel!
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      initializeApp();
    }
  }
} catch (error) {
  // Ignore
}

const db = getFirestore();

function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

export default async function handler(req: any, res: any) {
  // Setup CORS for Vercel
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST method
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method Not Allowed. Mohon gunakan method POST.' });
  }

  try {
    const randomChars = generateRandomString(5);
    const now = Date.now();
    
    const newPaid = {
      tid: `TID-${randomChars}`,
      password: Math.floor(100000 + Math.random() * 900000).toString(),
      status: "Berbayar",
      session: "Life Time",
      createdAt: now,
    };

    const newTrial = {
      tid: `Trial-${randomChars}`,
      password: "trial",
      status: "Trial",
      session: "8 Jam",
      createdAt: now,
    };

    // Note: This requires proper Firestore credentials in Vercel Environment Variables
    await db.collection('passwords').add(newPaid);
    await db.collection('passwords').add(newTrial);

    // Update global Stats safely
    const statsRef = db.collection('stats').doc('general');
    const statsDoc = await statsRef.get();
    
    if (statsDoc.exists) {
      await statsRef.update({
        userActive: FieldValue.increment(1),
        deviceInstall: FieldValue.increment(1),
        userTrial: FieldValue.increment(1),
      });
    } else {
      await statsRef.set({
        userActive: 1,
        deviceInstall: 1,
        userTrial: 1
      });
    }

    res.status(200).json({ 
      success: true, 
      message: "Device successfully registered",
      credentials: {
        paid: newPaid,
        trial: newTrial
      }
    });
  } catch (error: any) {
    console.error("API Error:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message || "Internal Server Error",
      hint: "Pastikan Anda sudah mengonfigurasi variable FIREBASE_SERVICE_ACCOUNT di Dashboard Vercel."
    });
  }
}

import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getDbId() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.firestoreDatabaseId || "(default)";
    }
  } catch (e) {
    console.error("Error reading firebase-applet-config.json", e);
  }
  // Try relative to __dirname as fallback if Vercel bundles it differently
  try {
    const configPath2 = path.join(process.cwd(), '..', '..', 'firebase-applet-config.json');
    if (fs.existsSync(configPath2)) {
      const config = JSON.parse(fs.readFileSync(configPath2, 'utf8'));
      return config.firestoreDatabaseId || "(default)";
    }
  } catch(e) {}
  
  return "ai-studio-61d456ba-f055-400a-9fe8-b8db038e866a"; // fallback to known ID
}

function getDb() {
  if (!getApps().length) {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      try {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({
          credential: cert(serviceAccount)
        });
      } catch (err: any) {
        throw new Error("Gagal membaca konfigurasi FIREBASE_SERVICE_ACCOUNT: " + err.message);
      }
    } else {
      initializeApp();
    }
  }
  return getFirestore(getApp(), getDbId());
}

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
    const db = getDb();
    
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }
    const deviceId = body.deviceId;
    
    if (deviceId) {
      const existingSnapshot = await db.collection('passwords').where('deviceId', '==', deviceId).get();
      if (!existingSnapshot.empty) {
        let theData = existingSnapshot.docs[0].data();
        
        let paidData = null;
        let trialData = null;
        
        if (theData.status === 'Berbayar' || (theData.status === 'Expired' && theData.tid.startsWith('TID-'))) {
          paidData = theData;
        } else {
          trialData = theData;
        }
        
        return res.status(200).json({
          success: true,
          message: "Device already registered",
          credentials: {
            paid: paidData,
            trial: trialData
          }
        });
      }
    }

    const randomChars = generateRandomString(5);
    const now = Date.now();

    const newTrial: any = {
      tid: `Trial-${randomChars}`,
      password: "trial",
      status: "Trial",
      session: "8 Jam",
      createdAt: now,
    };
    if (deviceId) newTrial.deviceId = deviceId;

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
      message: "Device successfully registered as Trial",
      credentials: {
        paid: null,
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

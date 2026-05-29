import { initializeApp, cert, getApps, getApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import path from "path";

function getDbId() {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      return config.firestoreDatabaseId || "(default)";
    }
  } catch (e) {}
  
  try {
    const configPath2 = path.join(process.cwd(), '..', '..', 'firebase-applet-config.json');
    if (fs.existsSync(configPath2)) {
      const config = JSON.parse(fs.readFileSync(configPath2, 'utf8'));
      return config.firestoreDatabaseId || "(default)";
    }
  } catch(e) {}
  
  return "ai-studio-61d456ba-f055-400a-9fe8-b8db038e866a"; 
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

export default async function handler(req: any, res: any) {
  // CORS setup untuk Vercel
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  // Preflight request
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Gunakan method POST.' });
  }

  try {
    let body = req.body || {};
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) {}
    }
    const { password, deviceId } = body;
    
    if (!password) {
      return res.status(400).json({ success: false, message: "Field 'password' wajib diisi untuk verifikasi." });
    }

    const db = getDb();
    
    // Cari password di tabel firestore 'passwords'
    let queryRef = db.collection('passwords').where('password', '==', String(password));
    if (deviceId) {
       queryRef = queryRef.where('deviceId', '==', deviceId);
    }
    
    const snapshot = await queryRef.limit(1).get();

    if (snapshot.empty) {
      return res.status(401).json({ success: false, message: "Password salah atau tidak ditemukan di server." });
    }

    const docWrapper = snapshot.docs[0];
    const data = docWrapper.data();

    // 1. Cek Admin Status
    if (data.status === 'Expired') {
      return res.status(401).json({ success: false, message: "Sesi password sudah di-nonaktifkan oleh Admin." });
    }

    // 2. Cek Durasi Validitas (Session Options)
    const now = Date.now();
    const createdAt = data.createdAt || now;

    const sessionOptions: Record<string, number> = {
      "8 Jam": 8 * 60 * 60 * 1000,
      "1 Hari": 24 * 60 * 60 * 1000,
      "7 Hari": 7 * 24 * 60 * 60 * 1000,
      "30 Hari": 30 * 24 * 60 * 60 * 1000,
      "Life Time": Infinity
    };

    const limitInMs = sessionOptions[data.session] || Infinity;

    if (now - createdAt > limitInMs) {
      // Jika sudah melampaui waktu, set status menjadi Expired di Database secara otomatis
      await docWrapper.ref.update({ status: 'Expired' });
      return res.status(401).json({ success: false, message: "Masa berlaku password sudah habis (kadaluarsa)." });
    }

    // Jika semua lolos, izinkan akses
    return res.status(200).json({ 
      success: true, 
      message: "Sukses, akses diizinkan.",
      data: {
        tid: data.tid,
        status: data.status,
        session: data.session
      }
    });

  } catch (error: any) {
    console.error("API Error Verifikasi:", error);
    res.status(500).json({ success: false, error: "Terdapat masalah pada server Firebase." });
  }
}

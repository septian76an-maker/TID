import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { initializeApp, cert, getApp } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import cors from "cors";
import firebaseConfig from "./firebase-applet-config.json";

// Prevent initializeApp from throwing if called multiple times
try {
  // If FIREBASE_SERVICE_ACCOUNT is provided in environment, use it to authenticate admin SDK
  // Example for Vercel: Add an Environment Variable FIREBASE_SERVICE_ACCOUNT with the stringified JSON file content from Firebase console
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    initializeApp({
      credential: cert(serviceAccount)
    });
  } else {
    // If not provided, it falls back to application default credentials (useful for GCP/Firebase Cloud Functions)
    initializeApp();
  }
} catch (error) {
  // Ignore already initialized error
}

const db = getFirestore(getApp(), firebaseConfig.firestoreDatabaseId);

function generateRandomString(length: number) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow cross-origin requests from the device
  app.use(cors());
  app.use(express.json());

  // API Endpoint for devices to call when they install the app
  app.post("/api/device/install", async (req, res) => {
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

      // Create passwords in Firestore
      await db.collection('passwords').add(newPaid);
      await db.collection('passwords').add(newTrial);

      // Increment stats in Firestore safely
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

      // Return credentials back to the device
      res.json({ 
        success: true, 
        message: "Device successfully registered",
        credentials: {
          paid: newPaid,
          trial: newTrial
        }
      });
    } catch (error: any) {
      console.error("API Error:", error);
      res.status(500).json({ success: false, error: error.message || "Internal Server Error" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

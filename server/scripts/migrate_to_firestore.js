import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

import dotenv from 'dotenv';

dotenv.config();

const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY,
    authDomain: process.env.FIREBASE_AUTH_DOMAIN,
    projectId: process.env.FIREBASE_PROJECT_ID,
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const migrate = async () => {
    const debtsPath = path.join(process.cwd(), 'data', 'debts.json');
    if (!fs.existsSync(debtsPath)) {
        console.error('No debts.json found at', debtsPath);
        process.exit(1);
    }

    const debts = JSON.parse(fs.readFileSync(debtsPath, 'utf8'));
    console.log(`Migrating ${debts.length} debts...`);

    const batchSize = 400;
    for (let i = 0; i < debts.length; i += batchSize) {
        const batch = writeBatch(db);
        const chunk = debts.slice(i, i + batchSize);

        chunk.forEach(debt => {
            const newDocRef = doc(collection(db, 'debts'));
            // Remove local ID to let Firestore generate its own, or keep it as a field
            const { id, ...data } = debt;
            batch.set(newDocRef, {
                ...data,
                legacyId: id,
                migratedAt: serverTimestamp()
            });
        });

        await batch.commit();
        console.log(`Uploaded chunk ${i / batchSize + 1}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
};

migrate().catch(err => {
    console.error('Migration failed:', err);
    process.exit(1);
});

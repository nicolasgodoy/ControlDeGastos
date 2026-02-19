import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";

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

const userId = "gLjbcyJOGBfnfhGP5pzb5HRyH2o2";

const reclaim = async () => {
    console.log(`Reclaiming debts for user: ${userId}...`);

    const q = collection(db, 'debts');

    const snapshot = await getDocs(q);

    let count = 0;
    const batchSize = 400;
    let batch = writeBatch(db);

    for (const docSnapshot of snapshot.docs) {
        batch.update(doc(db, 'debts', docSnapshot.id), { userId: userId });
        count++;

        if (count % batchSize === 0) {
            await batch.commit();
            batch = writeBatch(db);
            console.log(`Updated ${count} debts...`);
        }
    }

    if (count % batchSize !== 0) {
        await batch.commit();
    }

    console.log(`Reclaim completed! Assigned ${count} debts to ${userId}.`);
    process.exit(0);
};

reclaim().catch(err => {
    console.error('Reclaim failed:', err);
    process.exit(1);
});

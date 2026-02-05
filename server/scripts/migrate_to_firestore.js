import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, serverTimestamp, writeBatch, doc } from "firebase/firestore";
import fs from 'fs';
import path from 'path';

const firebaseConfig = {
    apiKey: "AIzaSyBiT-tF-yAfBJaTT95W5ks1lwt0qvuFNkA",
    authDomain: "controldegastosmoneyflow.firebaseapp.com",
    projectId: "controldegastosmoneyflow",
    storageBucket: "controldegastosmoneyflow.firebasestorage.app",
    messagingSenderId: "446360723310",
    appId: "1:446360723310:web:de9a6953af45aec9536b7f"
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

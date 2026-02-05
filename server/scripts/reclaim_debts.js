import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, updateDoc, doc, writeBatch } from "firebase/firestore";

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

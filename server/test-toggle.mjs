import axios from 'axios';

// Example ID from previous logs: ICBC-193 (Prestamo 4, 78760, pending)
const targetId = 'ICBC-193';

async function testToggle() {
    try {
        console.log(`Checking initial status for ${targetId}...`);
        let res = await axios.get('http://localhost:5000/api/debts');
        let debt = res.data.find(d => d.id === targetId);
        console.log('Initial Status:', debt ? debt.status : 'Not found');

        const newStatus = debt.status === 'paid' ? 'pending' : 'paid';
        console.log(`Toggling to ${newStatus}...`);

        await axios.post(`http://localhost:5000/api/debts/${targetId}/status`, { status: newStatus });
        console.log('Toggle request sent.');

        console.log('Verifying persistence...');
        res = await axios.get('http://localhost:5000/api/debts');
        debt = res.data.find(d => d.id === targetId);
        console.log('Final Status:', debt ? debt.status : 'Not found');

        if (debt && debt.status === newStatus) {
            console.log('SUCCESS: Status persisted!');
        } else {
            console.log('FAILURE: Status did not persist.');
        }

    } catch (e) {
        console.error('Error:', e.message);
    }
}

testToggle();

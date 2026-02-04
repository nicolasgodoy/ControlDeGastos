// Example ID from previous logs: ICBC-193 (Prestamo 4, 78760, pending)
const targetId = 'ICBC-193';

async function testToggle() {
    try {
        console.log(`Checking initial status for ${targetId}...`);
        let res = await fetch('http://localhost:5000/api/debts');
        let data = await res.json();
        let debt = data.find(d => d.id === targetId);
        console.log('Initial Status:', debt ? debt.status : 'Not found');

        const newStatus = debt.status === 'paid' ? 'pending' : 'paid';
        console.log(`Toggling to ${newStatus}...`);

        await fetch(`http://localhost:5000/api/debts/${targetId}/status`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });
        console.log('Toggle request sent.');

        console.log('Verifying persistence...');
        res = await fetch('http://localhost:5000/api/debts');
        data = await res.json();
        debt = data.find(d => d.id === targetId);
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

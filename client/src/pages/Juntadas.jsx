import React, { useState, useEffect } from 'react';
import { PlusCircle, Trash2, User, UserPlus, DollarSign, ArrowRight, RefreshCw, Users, AlertCircle, Check } from 'lucide-react';

function Juntadas() {
    // --- State ---
    const [participants, setParticipants] = useState(() => {
        const saved = localStorage.getItem('juntadas_participants');
        return saved ? JSON.parse(saved) : [];
    });
    const [expenses, setExpenses] = useState(() => {
        const saved = localStorage.getItem('juntadas_expenses');
        return saved ? JSON.parse(saved) : [];
    });

    const [newParticipant, setNewParticipant] = useState('');
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [payer, setPayer] = useState('');

    // --- Persistence ---
    useEffect(() => {
        localStorage.setItem('juntadas_participants', JSON.stringify(participants));
    }, [participants]);

    useEffect(() => {
        localStorage.setItem('juntadas_expenses', JSON.stringify(expenses));
    }, [expenses]);

    // --- Actions ---
    const addParticipant = (e) => {
        e.preventDefault();
        if (!newParticipant.trim()) return;
        if (participants.includes(newParticipant.trim())) return alert('El participante ya existe');
        setParticipants([...participants, newParticipant.trim()]);
        setNewParticipant('');
    };

    const removeParticipant = (name) => {
        setParticipants(participants.filter(p => p !== name));
        // Also remove expenses by this user to avoid errors? Or minimize? 
        // Better to keep expenses but warn? For simplicity, we keep expenses but logic might break if payer missing.
        // Let's filter expenses too for safety in this simple version
        setExpenses(expenses.filter(e => e.payer !== name));
    };

    const addExpense = (e) => {
        e.preventDefault();
        if (!amount || !description || !payer) return;

        const newExpense = {
            id: Date.now(),
            payer,
            description,
            amount: parseFloat(amount)
        };

        setExpenses([newExpense, ...expenses]);
        setAmount('');
        setDescription('');
    };

    const removeExpense = (id) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const resetAll = () => {
        if (window.confirm('¿Borrar todo y empezar de cero?')) {
            setParticipants([]);
            setExpenses([]);
        }
    };

    // --- Calculation Logic ---
    const calculateBalances = () => {
        if (participants.length === 0) return { balances: [], transactions: [], total: 0, average: 0 };

        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);
        const average = total / participants.length;

        // Calculate balance per person
        // Balance = Paid - Average
        // Positive: Paid more than average (Others owe him)
        // Negative: Paid less (Owes info)

        const paidMap = {};
        participants.forEach(p => paidMap[p] = 0);
        expenses.forEach(e => {
            if (paidMap[e.payer] !== undefined) {
                paidMap[e.payer] += e.amount;
            }
        });

        const balances = participants.map(p => ({
            name: p,
            paid: paidMap[p],
            balance: paidMap[p] - average
        })).sort((a, b) => b.balance - a.balance); // Sort by highest positive balance first

        // Calculate Transactions to settle
        const transactions = [];
        let debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance); // Ascending (most negative first)
        let creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance); // Descending (most positive first)

        let i = 0; // creditor index
        let j = 0; // debtor index

        while (i < creditors.length && j < debtors.length) {
            let creditor = creditors[i];
            let debtor = debtors[j];

            // The amount to settle is min( |debtor.balance|, creditor.balance )
            let amount = Math.min(Math.abs(debtor.balance), creditor.balance);

            if (amount > 0) {
                transactions.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: amount
                });
            }

            // Adjust
            creditor.balance -= amount;
            debtor.balance += amount;

            // Move indices if settled (approx 0)
            if (creditor.balance < 0.01) i++;
            if (Math.abs(debtor.balance) < 0.01) j++;
        }

        return { balances, transactions, total, average };
    };

    const { balances, transactions, total, average } = calculateBalances();

    return (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Juntadas con los pibes/as</h2>
                    <p style={{ color: 'var(--text-dim)' }}>Divisor de gastos equitativo</p>
                </div>
                <button onClick={resetAll} className="action-btn" title="Reiniciar todo">
                    <RefreshCw size={20} />
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>

                {/* 1. Configuration Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Add Participants */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Users size={20} color="var(--primary)" /> Participantes
                        </h3>
                        <form onSubmit={addParticipant} style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                placeholder="Nombre..."
                                value={newParticipant}
                                onChange={e => setNewParticipant(e.target.value)}
                                style={{ flex: 1, padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                            />
                            <button type="submit" className="add-btn" style={{ marginTop: 0, padding: '0.75rem' }}>
                                <UserPlus size={20} />
                            </button>
                        </form>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {participants.map(p => (
                                <div key={p} style={{ background: 'rgba(255,255,255,0.1)', padding: '0.25rem 0.75rem', borderRadius: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                                    <User size={14} /> {p}
                                    <button onClick={() => removeParticipant(p)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)', display: 'flex' }}>
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))}
                            {participants.length === 0 && <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>Agregá amigos para empezar.</p>}
                        </div>
                    </div>

                    {/* Add Expense */}
                    <div className="glass-card" style={{ padding: '1.5rem' }}>
                        <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <DollarSign size={20} color="#10b981" /> Cargar Gasto
                        </h3>
                        {participants.length < 2 ? (
                            <div style={{ padding: '1rem', background: 'rgba(245, 158, 11, 0.1)', color: 'var(--warning)', borderRadius: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                                <AlertCircle size={20} /> Mínimo 2 participantes.
                            </div>
                        ) : (
                            <form onSubmit={addExpense} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem', display: 'block' }}>Quién pagó</label>
                                        <select
                                            value={payer}
                                            onChange={e => setPayer(e.target.value)}
                                            style={{
                                                width: '100%',
                                                padding: '0.75rem',
                                                borderRadius: '0.5rem',
                                                background: 'rgba(255,255,255,0.05)',
                                                border: '1px solid var(--glass-border)',
                                                color: 'var(--text-main)',
                                                appearance: 'none'
                                            }}
                                            required
                                        >
                                            <option value="" style={{ background: '#18181b', color: 'var(--text-main)' }}>Seleccionar...</option>
                                            {participants.map(p => (
                                                <option key={p} value={p} style={{ background: '#18181b', color: 'var(--text-main)' }}>
                                                    {p}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem', display: 'block' }}>Monto</label>
                                        <input
                                            type="number"
                                            placeholder="$0"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                            required
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '0.25rem', display: 'block' }}>Concepto</label>
                                    <input
                                        type="text"
                                        placeholder="Ej: Asado, Bebidas..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                        required
                                    />
                                </div>
                                <button type="submit" className="add-btn" style={{ width: '100%', justifyContent: 'center' }}>Agregar Gasto</button>
                            </form>
                        )}
                    </div>

                </div>

                {/* 2. List & Results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Total Gastado</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--text-main)' }}>${total.toLocaleString('es-AR')}</p>
                        </div>
                        <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>C/u debe poner</p>
                            <p style={{ fontSize: '1.5rem', fontWeight: '700', color: '#6366f1' }}>${average.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                        </div>
                    </div>

                    {/* Settlement Plan */}
                    {(transactions.length > 0) && (
                        <div className="glass-card" style={{ padding: '1.5rem', border: '1px solid rgba(16, 185, 129, 0.3)', background: 'rgba(16, 185, 129, 0.05)' }}>
                            <h3 style={{ marginBottom: '1rem', color: 'var(--success)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Check size={20} /> Plan de Pagos
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {transactions.map((t, idx) => (
                                    <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--card-bg)', borderRadius: '0.75rem' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <span style={{ fontWeight: '600', color: 'var(--danger)' }}>{t.from}</span>
                                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>paga a</span>
                                            <span style={{ fontWeight: '600', color: 'var(--success)' }}>{t.to}</span>
                                        </div>
                                        <div style={{ fontWeight: '700', color: 'var(--text-main)' }}>
                                            ${t.amount.toLocaleString('es-AR')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expense Log */}
                    <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
                        <h3 style={{ marginBottom: '1rem' }}>Detalle de Gastos</h3>
                        <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {expenses.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>Aún no hay gastos cargados.</p>
                            ) : (
                                expenses.map(exp => (
                                    <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                                        <div>
                                            <p style={{ fontWeight: '500', margin: 0 }}>{exp.description}</p>
                                            <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', margin: 0 }}>Pagó <strong style={{ color: 'var(--primary)' }}>{exp.payer}</strong></p>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                            <span style={{ fontWeight: '600' }}>${exp.amount.toLocaleString('es-AR')}</span>
                                            <button onClick={() => removeExpense(exp.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Juntadas;

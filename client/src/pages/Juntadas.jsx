import React, { useState, useEffect } from 'react';
import { Trash2, User, UserPlus, DollarSign, RefreshCw, Users, AlertCircle, Check, CheckSquare, Square } from 'lucide-react';

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

    // Expense Form State
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [payer, setPayer] = useState('');
    const [selectedConsumers, setSelectedConsumers] = useState([]); // Array of names

    // Init selectedConsumers when participants change (default to all)
    useEffect(() => {
        // Only if we haven't manually deselected everyone? 
        // Simple logic: When participants change, auto-select new ones? 
        // Or just reset to all when opening form? 
        // Let's keep it simple: sync default to all for now or handle in addParticipant
    }, [participants]);

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
        const nameNode = newParticipant.trim();
        if (participants.includes(nameNode)) return alert('El participante ya existe');

        const newParticipants = [...participants, nameNode];
        setParticipants(newParticipants);
        // Add to current selection if most are selected? Let's just default to selecting the new guy too
        setSelectedConsumers(prev => [...prev, nameNode]);

        setNewParticipant('');
    };

    const removeParticipant = (name) => {
        setParticipants(participants.filter(p => p !== name));
        // Also remove from expenses? 
        // Doing strictly what was there before but safer
        setExpenses(expenses.filter(e => e.payer !== name));
        setSelectedConsumers(selectedConsumers.filter(p => p !== name));
    };

    const toggleConsumer = (name) => {
        if (selectedConsumers.includes(name)) {
            setSelectedConsumers(selectedConsumers.filter(p => p !== name));
        } else {
            setSelectedConsumers([...selectedConsumers, name]);
        }
    };

    const toggleAllConsumers = () => {
        if (selectedConsumers.length === participants.length) {
            setSelectedConsumers([]);
        } else {
            setSelectedConsumers([...participants]);
        }
    };

    const addExpense = (e) => {
        e.preventDefault();
        if (!amount || !description || !payer) return;
        if (selectedConsumers.length === 0) return alert('Debe haber al menos un consumidor.');

        const newExpense = {
            id: Date.now(),
            payer,
            description,
            amount: parseFloat(amount),
            consumers: selectedConsumers // Save who consumed this
        };

        setExpenses([newExpense, ...expenses]);

        // Reset form but keep payer? Or reset?
        setAmount('');
        setDescription('');
        // Keep payer and consumers for convenience? Or reset consumers to all?
        // Resetting consumers to all is usually safer
        setSelectedConsumers([...participants]);
    };

    const removeExpense = (id) => {
        setExpenses(expenses.filter(e => e.id !== id));
    };

    const resetAll = () => {
        if (window.confirm('¿Borrar todo y empezar de cero?')) {
            setParticipants([]);
            setExpenses([]);
            setSelectedConsumers([]);
        }
    };

    // Initialize Selection when participants load/change initially if empty
    useEffect(() => {
        // If we have participants but no selection (e.g. fresh load), select all
        // But we need to distinguish fresh load vs user deselected all.
        // For now, let's just ensure if we add a participant, they are selected (handled in addParticipant).
        // On first load, if we have participants, default to all.
        if (participants.length > 0 && selectedConsumers.length === 0) {
            // Check if it's really the first run? 
            // Simplest: just default check all locally in the Form render if special state not needed?
            // No, consistent state is better.
            setSelectedConsumers(participants);
        }
    }, []); // Run once? No, participants dependency? 
    // Careful with infinite loops or overwriting user intent.
    // Let's just use a dedicated effect for when participants array grows.

    useEffect(() => {
        // Sync: remove consumers that no longer exist
        setSelectedConsumers(prev => prev.filter(p => participants.includes(p)));
    }, [participants]);


    // --- Calculation Logic ---
    const calculateBalances = () => {
        if (participants.length === 0) return { balances: [], transactions: [], total: 0 };

        const total = expenses.reduce((acc, curr) => acc + curr.amount, 0);

        // 1. Initialize maps
        const paidMap = {};      // Total paid by user
        const consumedMap = {};  // Total consumed (owed) by user

        participants.forEach(p => {
            paidMap[p] = 0;
            consumedMap[p] = 0;
        });

        // 2. Process expenses
        expenses.forEach(e => {
            // Payer credit
            if (paidMap[e.payer] !== undefined) {
                paidMap[e.payer] += e.amount;
            }

            // Consumption debit
            // Compatibility: if e.consumers is missing, assume all participants
            const expenseConsumers = (e.consumers && e.consumers.length > 0)
                ? e.consumers
                : participants;

            // Filter valid ones (in case a user was deleted)
            const validConsumers = expenseConsumers.filter(c => participants.includes(c));

            if (validConsumers.length > 0) {
                const amountPerPerson = e.amount / validConsumers.length;
                validConsumers.forEach(c => {
                    consumedMap[c] += amountPerPerson;
                });
            }
        });

        // 3. Balance
        const balances = participants.map(p => ({
            name: p,
            paid: paidMap[p],
            consumed: consumedMap[p],
            balance: paidMap[p] - consumedMap[p]
        })).sort((a, b) => b.balance - a.balance);

        // 4. Settle
        const transactions = [];
        let debtors = balances.filter(b => b.balance < -0.01).sort((a, b) => a.balance - b.balance);
        let creditors = balances.filter(b => b.balance > 0.01).sort((a, b) => b.balance - a.balance);

        let i = 0;
        let j = 0;

        while (i < creditors.length && j < debtors.length) {
            let creditor = creditors[i];
            let debtor = debtors[j];

            let amount = Math.min(Math.abs(debtor.balance), creditor.balance);

            if (amount > 0) {
                transactions.push({
                    from: debtor.name,
                    to: creditor.name,
                    amount: amount
                });
            }

            creditor.balance -= amount;
            debtor.balance += amount;

            if (creditor.balance < 0.01) i++;
            if (Math.abs(debtor.balance) < 0.01) j++;
        }

        return { balances, transactions, total };
    };

    const { balances, transactions, total } = calculateBalances();

    return (
        <div className="page-content" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2>Juntadas con los pibes/as</h2>
                    <p style={{ color: 'var(--text-dim)' }}>Divisor de gastos (ahora con detalle de consumos)</p>
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
                                        placeholder="Ej: Asado, Bebidas, Taxi..."
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                        style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                                        required
                                    />
                                </div>

                                {/* Consumers Selection */}
                                <div style={{ background: 'rgba(99, 102, 241, 0.1)', padding: '1rem', borderRadius: '0.5rem', border: '1px dashed var(--primary)' }}>
                                    <label style={{ fontSize: '0.9rem', color: 'var(--primary)', marginBottom: '0.75rem', fontWeight: '600', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Users size={16} />
                                            <span>¿Quiénes consumieron?</span>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={toggleAllConsumers}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-main)', cursor: 'pointer', fontSize: '0.75rem', textDecoration: 'underline' }}
                                        >
                                            {selectedConsumers.length === participants.length ? 'Deseleccionar todos' : 'Todos'}
                                        </button>
                                    </label>
                                    <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginBottom: '0.75rem' }}>
                                        Desmarca a quienes no participaron de este gasto.
                                    </p>
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', gap: '0.5rem' }}>
                                        {participants.map(p => {
                                            const isSelected = selectedConsumers.includes(p);
                                            return (
                                                <div
                                                    key={p}
                                                    onClick={() => toggleConsumer(p)}
                                                    style={{
                                                        cursor: 'pointer',
                                                        padding: '0.5rem',
                                                        borderRadius: '0.5rem',
                                                        background: isSelected ? 'var(--primary)' : 'rgba(255,255,255,0.05)',
                                                        boxShadow: isSelected ? '0 2px 8px rgba(99, 102, 241, 0.4)' : 'none',
                                                        border: '1px solid transparent',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.5rem',
                                                        fontSize: '0.85rem',
                                                        transition: 'all 0.2s',
                                                        color: isSelected ? 'white' : 'var(--text-dim)'
                                                    }}
                                                >
                                                    {isSelected ? <Check size={14} /> : <div style={{ width: 14, height: 14 }} />}
                                                    <span style={{ fontWeight: isSelected ? '600' : '400' }}>{p}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <button type="submit" className="add-btn" style={{ width: '100%', justifyContent: 'center' }}>Agregar Gasto</button>
                            </form>
                        )}
                    </div>

                </div>

                {/* 2. List & Results */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                    {/* Summary Stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1rem' }}>
                        {/* Balances List */}
                        <div className="glass-card" style={{ padding: '1rem' }}>
                            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Balances Individuales</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                {balances.map(b => (
                                    <div key={b.name} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                                        <span>{b.name}</span>
                                        <span style={{
                                            fontWeight: '600',
                                            color: b.balance > 0 ? 'var(--success)' : (b.balance < 0 ? 'var(--danger)' : 'var(--text-dim)')
                                        }}>
                                            {b.balance > 0 ? '+' : ''}{Math.round(b.balance).toLocaleString('es-AR')}
                                        </span>
                                    </div>
                                ))}
                            </div>
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
                                            ${Math.round(t.amount).toLocaleString('es-AR')}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Expense Log */}
                    <div className="glass-card" style={{ padding: '1.5rem', flex: 1 }}>
                        <h3 style={{ marginBottom: '1rem' }}>Detalle de Gastos</h3>
                        <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {expenses.length === 0 ? (
                                <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dim)' }}>Aún no hay gastos cargados.</p>
                            ) : (
                                expenses.map(exp => {
                                    const consumerCount = exp.consumers ? exp.consumers.length : participants.length;
                                    const isEveryone = consumerCount === participants.length && participants.length > 0;

                                    return (
                                        <div key={exp.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'rgba(255,255,255,0.03)', borderRadius: '0.75rem' }}>
                                            <div>
                                                <p style={{ fontWeight: '500', margin: 0 }}>{exp.description}</p>
                                                <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.2rem' }}>
                                                    Pagó <strong style={{ color: 'var(--primary)' }}>{exp.payer}</strong>
                                                    <span style={{ margin: '0 0.5rem' }}>|</span>
                                                    <span>
                                                        {isEveryone ? 'Para todos' :
                                                            (exp.consumers ? `Div: ${exp.consumers.join(', ')}` : 'Para todos')
                                                        }
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                                <span style={{ fontWeight: '600' }}>${exp.amount.toLocaleString('es-AR')}</span>
                                                <button onClick={() => removeExpense(exp.id)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--danger)' }}>
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default Juntadas;

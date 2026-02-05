import React, { useState, useEffect } from 'react';
import { Check, Filter, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import DebtModal from '../components/DebtModal';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';

function Deudas({ debts, loading, onToggleStatus, onAddDebt, onUpdateDebt, onDeleteDebt }) {
    const [filter, setFilter] = useState('all'); // all, pending, paid
    const [modalOpen, setModalOpen] = useState(false);
    const [editingDebt, setEditingDebt] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null });
    const [importModal, setImportModal] = useState({ isOpen: false, file: null });
    const [toast, setToast] = useState({ show: false, message: '' });

    const [statusModal, setStatusModal] = useState({
        isOpen: false,
        type: 'success', // 'success' | 'error'
        title: '',
        message: ''
    });

    const showStatus = (type, title, message) => {
        setStatusModal({ isOpen: true, type, title, message });
    };

    // Close modal after 3 seconds if success
    useEffect(() => {
        if (statusModal.isOpen && statusModal.type === 'success') {
            const timer = setTimeout(() => {
                setStatusModal(prev => ({ ...prev, isOpen: false }));
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [statusModal]);

    if (loading) return <p>Cargando deudas...</p>;

    const filteredDebts = debts.filter(d => {
        if (filter === 'all') return true;
        return d.status === filter;
    });

    const handleSaveDebt = async (data) => {
        let result = { success: true };

        // Handle Single or Schema (Bulk is now handled by the API directly)
        if (editingDebt && !Array.isArray(data)) {
            result = await onUpdateDebt(editingDebt.id, data);
        } else {
            // Even if it's an array (split installments), we send it directly now
            result = await onAddDebt(data);
        }

        if (result.success) {
            showStatus('success', '¡Éxito!', editingDebt ? 'Deuda actualizada correctamente.' : 'Deuda(s) registrada(s) correctamente.');
            setModalOpen(false);
            setEditingDebt(null);
        } else {
            console.error(result.error);
            showStatus('error', 'Error', `Error al guardar: ${result.error}`);
        }
    };

    const confirmDelete = async () => {
        if (deleteModal.id) {
            const result = await onDeleteDebt(deleteModal.id);
            if (result.success) {
                showStatus('success', 'Eliminado', 'La deuda ha sido eliminada.');
            } else {
                showStatus('error', 'Error', 'No se pudo eliminar la deuda.');
            }
            setDeleteModal({ isOpen: false, id: null });
        }
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImportModal({ isOpen: true, file });
        }
        e.target.value = null; // Reset input
    };

    const confirmImport = async (mode) => {
        const result = await props.importDebts(importModal.file, mode);
        if (result.success) {
            showStatus('success', '¡Éxito!', `Se importaron ${result.count} deudas correctamente.`);
        } else {
            showStatus('error', 'Error', result.error);
        }
        setImportModal({ isOpen: false, file: null });
    };

    return (
        <div className="fade-in">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontWeight: '700', margin: 0 }}>Mis Deudas</h2>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <input
                        type="file"
                        id="excel-upload"
                        style={{ display: 'none' }}
                        accept=".xlsx, .xls"
                        onChange={handleFileSelect}
                    />
                    <button
                        className="action-btn"
                        onClick={() => document.getElementById('excel-upload').click()}
                        style={{ padding: '0.65rem 1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                        Importar Excel
                    </button>
                    <button
                        className="add-btn"
                        onClick={() => { setEditingDebt(null); setModalOpen(true); }}
                        style={{ padding: '0.65rem 1.25rem', fontSize: '1rem', boxShadow: 'none' }}
                    >
                        <PlusCircle size={18} /> Nueva Deuda
                    </button>
                </div>
            </div>

            {/* Filter Tabs */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        Todas ({debts.length})
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pendientes ({debts.filter(d => d.status === 'pending').length})
                    </button>
                    <button
                        className={filter === 'paid' ? 'active' : ''}
                        onClick={() => setFilter('paid')}
                    >
                        Pagadas ({debts.filter(d => d.status === 'paid').length})
                    </button>
                </div>
            </div>

            <div className="glass-card">
                <div className="debts-table">
                    <div className="table-header deudas-grid" style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 100px' }}>
                        <span>Entidad</span>
                        <span>Préstamo</span>
                        <span>Vencimiento</span>
                        <span>Monto</span>
                        <span>Estado</span>
                        <span>Acciones</span>
                    </div>
                    <div className="table-body">
                        {filteredDebts.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                No hay deudas encontradas.
                            </div>
                        ) : (
                            filteredDebts.map(debt => (
                                <div key={debt.id} className={`table-row deudas-grid ${debt.status === 'paid' ? 'paid-row' : ''}`} style={{ gridTemplateColumns: '1.5fr 1.5fr 1fr 1fr 1fr 100px' }}>
                                    <span style={{ fontWeight: '500', color: 'var(--text-main)' }}>{debt.entity}</span>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{debt.loanName}</span>
                                    <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                        {new Date(debt.date).toLocaleDateString()}
                                    </span>
                                    <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text-main)' }}>
                                        ${debt.amount.toLocaleString('es-AR')}
                                    </span>
                                    <span>
                                        <span className={`status ${debt.status}`}>
                                            {debt.status === 'pending' ? 'Pendiente' : 'Pagado'}
                                        </span>
                                    </span>
                                    <span style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button
                                            className={`action-btn check ${debt.status}`}
                                            onClick={() => {
                                                if (debt.status !== 'paid') {
                                                    onToggleStatus(debt.id, debt.status);
                                                }
                                            }}
                                            title={debt.status === 'paid' ? 'Pagado (Bloqueado)' : 'Marcar como pagado'}
                                            disabled={debt.status === 'paid'}
                                            style={debt.status === 'paid' ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                                        >
                                            <Check size={16} strokeWidth={2} />
                                        </button>

                                        {/* Only show Edit if NOT paid */}
                                        {debt.status !== 'paid' && (
                                            <button
                                                className="action-btn edit"
                                                onClick={() => { setEditingDebt(debt); setModalOpen(true); }}
                                                title="Editar"
                                            >
                                                <Pencil size={16} strokeWidth={1.5} />
                                            </button>
                                        )}
                                        <button
                                            className="action-btn delete"
                                            onClick={() => setDeleteModal({ isOpen: true, id: debt.id })}
                                            title="Eliminar"
                                        >
                                            <Trash2 size={16} strokeWidth={1.5} />
                                        </button>
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modals */}
            <DebtModal
                isOpen={modalOpen}
                onClose={() => setModalOpen(false)}
                onSave={handleSaveDebt}
                initialData={editingDebt}
            />

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Eliminar Deuda"
                message="¿Estás seguro de que deseas eliminar esta deuda? Esta acción no se puede deshacer."
            />

            <Toast
                show={toast.show}
                message={toast.message}
                onClose={() => setToast({ ...toast, show: false })}
            />

            {/* Import Confirmation Modal */}
            {importModal.isOpen && (
                <div className="modal-overlay" onClick={() => setImportModal({ isOpen: false, file: null })}>
                    <div className="modal glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem' }}>
                        <h3 style={{ marginBottom: '1rem' }}>Importar Deudas</h3>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                            Has seleccionado: <strong>{importModal.file?.name}</strong>.
                            <br /><br />
                            ¿Cómo deseas procesar los datos?
                        </p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="add-btn"
                                onClick={() => confirmImport('append')}
                                style={{ width: '100%', background: 'var(--primary)' }}
                            >
                                Sumar a las actuales
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => confirmImport('replace')}
                                style={{ width: '100%', color: '#ef4444', borderColor: 'rgba(239, 68, 68, 0.3)' }}
                            >
                                Reemplazar todas
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => setImportModal({ isOpen: false, file: null })}
                                style={{ width: '100%', marginTop: '0.5rem' }}
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Status Modal (Custom Alert) */}
            {statusModal.isOpen && (
                <div
                    className="modal-overlay"
                    style={{ zIndex: 1000 }}
                    onClick={() => statusModal.type === 'error' && setStatusModal({ ...statusModal, isOpen: false })}
                >
                    <div
                        className="glass-card"
                        onClick={e => e.stopPropagation()}
                        style={{
                            padding: '2rem',
                            maxWidth: '400px',
                            width: '90%',
                            textAlign: 'center',
                            border: statusModal.type === 'error' ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(16, 185, 129, 0.3)',
                            background: 'rgba(20, 20, 25, 0.95)'
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: statusModal.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: statusModal.type === 'error' ? '#ef4444' : '#10b981',
                            fontSize: '1.75rem'
                        }}>
                            {statusModal.type === 'error' ? '!' : '✓'}
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>{statusModal.title}</h3>
                        <p style={{ color: 'var(--text-dim)', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
                            {statusModal.message}
                        </p>

                        <button
                            onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                            style={{
                                background: statusModal.type === 'error' ? '#ef4444' : 'var(--primary)',
                                color: 'white', border: 'none', padding: '0.75rem 2rem', borderRadius: '8px',
                                fontSize: '1rem', fontWeight: '500', cursor: 'pointer',
                                width: '100%'
                            }}
                        >
                            {statusModal.type === 'error' ? 'Entendido' : 'Aceptar'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Deudas;

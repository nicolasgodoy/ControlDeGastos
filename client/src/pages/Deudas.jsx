import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Filter, PlusCircle, Pencil, Trash2 } from 'lucide-react';
import Toast from '../components/Toast';
import ConfirmationModal from '../components/ConfirmationModal';
import { ENTITY_COLORS } from '../constants/colors';

// ENTITY_COLORS imported from ../constants/colors

function Deudas({ debts, loading, onToggleStatus, onDeleteDebt, importDebts }) {
    const navigate = useNavigate();
    const [filter, setFilter] = useState('all'); // all, pending, paid
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

    // --- Pagination & Filtering State ---
    const [entityFilter, setEntityFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [filter, entityFilter]);

    if (loading) return <p>Cargando deudas...</p>;

    // 1. Get Unique Entities in order of appearance (to match Dashboard colors)
    const uniqueEntities = debts.reduce((acc, debt) => {
        if (!acc.find(e => e === debt.entity)) {
            acc.push(debt.entity);
        }
        return acc;
    }, []);

    // 2. Apply Filters
    const filteredDebts = debts.filter(d => {
        // Status Filter
        if (filter !== 'all' && d.status !== filter) return false;
        // Entity Filter
        if (entityFilter !== 'all' && d.entity !== entityFilter) return false;
        return true;
    });

    // 3. Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentDebts = filteredDebts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredDebts.length / itemsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

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
        if (!importDebts) {
            showStatus('error', 'Error', 'Función de importar no disponible.');
            return;
        }

        const result = await importDebts(importModal.file, mode);
        if (result.success) {
            showStatus('success', '¡Éxito!', `Se importaron ${result.count || ''} deudas correctamente.`);
        } else {
            showStatus('error', 'Error', result.error || 'Error desconocido al importar.');
        }
        setImportModal({ isOpen: false, file: null });
    };

    return (
        <div className="fade-in">
            <div className="top-actions">
                <div>
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
                        style={{ background: 'var(--bg-subtle)', border: '1px solid var(--glass-border)', color: 'var(--text-main)' }}
                        title="Importar desde Excel"
                    >
                        Importar Excel
                    </button>
                    <button
                        className="add-btn"
                        onClick={() => navigate('/deudas/nueva')}
                        style={{ boxShadow: 'var(--shadow-sm)' }}
                    >
                        <PlusCircle size={18} /> Nueva Deuda
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', background: 'var(--card-bg)', padding: '1rem', borderRadius: '1rem', border: '1px solid var(--glass-border)', boxShadow: 'var(--shadow-sm)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                    <Filter size={18} />
                    <span>Filtros:</span>
                </div>

                {/* Status Filter */}
                <div className="filter-tabs">
                    <button
                        className={filter === 'all' ? 'active' : ''}
                        onClick={() => setFilter('all')}
                    >
                        Todas
                    </button>
                    <button
                        className={filter === 'pending' ? 'active' : ''}
                        onClick={() => setFilter('pending')}
                    >
                        Pendientes
                    </button>
                    <button
                        className={filter === 'paid' ? 'active' : ''}
                        onClick={() => setFilter('paid')}
                    >
                        Pagadas
                    </button>
                </div>

                <div style={{ width: '1px', height: '24px', background: 'var(--glass-border)', margin: '0 0.5rem' }}></div>

                {/* Entity Filter */}
                <select
                    value={entityFilter}
                    onChange={e => setEntityFilter(e.target.value)}
                    style={{
                        padding: '0.5rem 1rem',
                        borderRadius: '0.75rem',
                        background: 'var(--bg-subtle)',
                        border: '1px solid var(--glass-border)',
                        color: 'var(--text-main)',
                        fontSize: '0.9rem',
                        outline: 'none',
                        cursor: 'pointer',
                        maxWidth: '200px'
                    }}
                >
                    <option value="all" style={{ background: 'var(--card-bg)' }}>Todas las Entidades</option>
                    {uniqueEntities.map(entity => (
                        <option key={entity} value={entity} style={{ background: 'var(--card-bg)' }}>{entity}</option>
                    ))}
                </select>
            </div>

            <div className="glass-card" style={{ boxShadow: 'var(--shadow-md)' }}>
                <div className="debts-table">
                    <div className="table-header deudas-grid">
                        <span>Entidad</span>
                        <span>Préstamo</span>
                        <span>Vencimiento</span>
                        <span>Monto</span>
                        <span>Estado</span>
                        <span>Acciones</span>
                    </div>
                    <div className="table-body">
                        {currentDebts.length === 0 ? (
                            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-dim)' }}>
                                No hay deudas encontradas.
                            </div>
                        ) : (
                            currentDebts.map(debt => {
                                // Match the Dashboard's index logic
                                const entityIndex = uniqueEntities.indexOf(debt.entity);
                                const entityColor = ENTITY_COLORS[entityIndex % ENTITY_COLORS.length];
                                return (
                                    <div key={debt.id} className={`table-row deudas-grid ${debt.status === 'paid' ? 'paid-row' : ''}`}>
                                        <div className="entity-info" style={{ fontWeight: '500', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                            <div className="entity-dot" style={{ backgroundColor: entityColor }}></div>
                                            {debt.entity}
                                        </div>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>{debt.loanName}</span>
                                        <span style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
                                            {debt.date
                                                ? (() => {
                                                    const [y, m, d] = debt.date.split('-');
                                                    return new Date(+y, +m - 1, +d).toLocaleDateString('es-AR');
                                                })()
                                                : '-'}
                                        </span>
                                        <span style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--text-main)' }}>
                                            ${debt.amount.toLocaleString('es-AR')}
                                        </span>
                                        <span style={{ display: 'flex', justifyContent: 'center' }}>
                                            <span className={`status ${debt.status}`} style={{
                                                width: '100%',
                                                textAlign: 'center'
                                            }}>
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
                                                    onClick={() => navigate(`/deudas/editar/${debt.id}`)}
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
                                );
                            })
                        )}
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1.5rem', gap: '1rem', borderTop: '1px solid var(--glass-border)' }}>
                        <button
                            onClick={() => paginate(currentPage - 1)}
                            disabled={currentPage === 1}
                            style={{
                                background: 'var(--bg-subtle)',
                                border: `1px solid var(--glass-border)`,
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                color: currentPage === 1 ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Anterior
                        </button>
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                            Página <strong style={{ color: 'var(--text-main)' }}>{currentPage}</strong> de {totalPages}
                        </span>
                        <button
                            onClick={() => paginate(currentPage + 1)}
                            disabled={currentPage === totalPages}
                            style={{
                                background: 'var(--bg-subtle)',
                                border: `1px solid var(--glass-border)`,
                                padding: '0.5rem 1rem',
                                borderRadius: '0.5rem',
                                color: currentPage === totalPages ? 'var(--text-dim)' : 'var(--text-main)',
                                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                                fontSize: '0.9rem'
                            }}
                        >
                            Siguiente
                        </button>
                    </div>
                )}
            </div>

            {/* Import Confirmation Modal */}
            {importModal.isOpen && (
                <div className="modal-overlay" style={{ background: 'var(--overlay-bg)' }} onClick={() => setImportModal({ isOpen: false, file: null })}>
                    <div className="modal glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center', padding: '2rem', boxShadow: 'var(--shadow-md)' }}>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>Importar Deudas</h2>
                        <p style={{ color: 'var(--text-dim)', marginBottom: '1.5rem' }}>
                            Seleccioná cómo querés importar el archivo Excel:
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <button
                                className="add-btn"
                                onClick={() => confirmImport('append')}
                                style={{ width: '100%', background: 'var(--primary-solid)', color: 'white' }}
                            >
                                Sumar a las actuales
                            </button>
                            <button
                                className="action-btn"
                                onClick={() => confirmImport('replace')}
                                style={{ width: '100%', color: 'var(--danger)', border: '1px solid var(--danger)', background: 'transparent' }}
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
                    style={{ zIndex: 1000, background: 'var(--overlay-bg)' }}
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
                            border: statusModal.type === 'error' ? '1px solid var(--danger)' : '1px solid var(--success)',
                            background: 'var(--card-bg)',
                            boxShadow: 'var(--shadow-md)',
                            backdropFilter: 'blur(10px)'
                        }}
                    >
                        <div style={{
                            width: '60px', height: '60px', borderRadius: '50%', margin: '0 auto 1rem',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: statusModal.type === 'error' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                            color: statusModal.type === 'error' ? 'var(--danger)' : 'var(--success)',
                            fontSize: '1.75rem'
                        }}>
                            {statusModal.type === 'error' ? '!' : '✓'}
                        </div>

                        <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem', color: 'var(--text-main)' }}>{statusModal.title}</h3>
                        <p style={{ color: 'var(--text-dim)', margin: '0 0 1.5rem', lineHeight: '1.5' }}>
                            {statusModal.message}
                        </p>

                        <button
                            onClick={() => setStatusModal({ ...statusModal, isOpen: false })}
                            style={{
                                background: statusModal.type === 'error' ? 'var(--danger)' : 'var(--primary-solid)',
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

            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, id: null })}
                onConfirm={confirmDelete}
                title="Eliminar Deuda"
                message="¿Estás seguro de que deseas eliminar esta deuda? Esta acción no se puede deshacer."
            />
        </div>
    );
}

export default Deudas;

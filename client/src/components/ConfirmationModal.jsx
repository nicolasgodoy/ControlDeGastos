import React from 'react';
import { AlertCircle, Check, X } from 'lucide-react';
import '../App.css';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal glass-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px', textAlign: 'center' }}>
                <div className="modal-header" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
                    <div style={{
                        background: 'rgba(245, 158, 11, 0.2)',
                        padding: '1rem',
                        borderRadius: '50%',
                        color: 'var(--warning)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <AlertCircle size={32} />
                    </div>
                </div>

                <h3 style={{ marginBottom: '0.5rem', fontSize: '1.25rem' }}>{title}</h3>
                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>{message}</p>

                <div className="modal-actions" style={{ display: 'flex', gap: '1rem' }}>
                    <button
                        onClick={onClose}
                        className="btn-secondary"
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: '1px solid rgba(255,255,255,0.1)',
                            background: 'transparent',
                            color: 'var(--text-dim)',
                            cursor: 'pointer'
                        }}
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        className="btn-primary"
                        style={{
                            flex: 1,
                            padding: '0.75rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            background: 'var(--success)', // Using success color for payment
                            color: '#fff',
                            fontWeight: '600',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem'
                        }}
                    >
                        <Check size={18} /> Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, Calendar, DollarSign, Tag, Repeat } from 'lucide-react';

const IncomeModal = ({ isOpen, onClose, onSave, initialData = null }) => {
    const [formData, setFormData] = useState({
        source: '',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        category: 'Sueldo',
        recurring: false
    });

    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (initialData) {
            setFormData({
                ...initialData,
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else {
            setFormData({
                source: '',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                category: 'Sueldo',
                recurring: false
            });
        }
        setErrors({});
    }, [initialData, isOpen]);

    const categories = ['Sueldo', 'Freelance', 'Inversión', 'Alquiler', 'Venta', 'Bono', 'Otro'];

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.source.trim()) newErrors.source = 'La fuente de ingreso es requerida';
        if (!formData.amount || parseFloat(formData.amount) <= 0) newErrors.amount = 'El monto debe ser mayor a 0';
        if (!formData.date) newErrors.date = 'La fecha es requerida';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (validate()) {
            onSave(formData);
            handleClose();
        }
    };

    const handleClose = () => {
        setFormData({
            source: '',
            amount: '',
            date: new Date().toISOString().split('T')[0],
            category: 'Sueldo',
            recurring: false
        });
        setErrors({});
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal glass-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
                <div className="modal-header">
                    <h3>{initialData ? 'Editar Ingreso' : 'Nuevo Ingreso'}</h3>
                    <button onClick={handleClose} className="close-btn">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={16} /> Fuente de Ingreso
                        </label>
                        <input
                            type="text"
                            name="source"
                            value={formData.source}
                            onChange={handleChange}
                            placeholder="Ej: Sueldo, Freelance..."
                            required
                            autoComplete="off"
                            style={{
                                borderColor: errors.source ? 'var(--danger)' : undefined
                            }}
                        />
                        {errors.source && (
                            <span style={{
                                fontSize: '0.75rem',
                                color: 'var(--danger)',
                                marginTop: '0.25rem',
                                display: 'block'
                            }}>
                                {errors.source}
                            </span>
                        )}
                    </div>

                    <div className="form-group" style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '1rem' }}>
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <DollarSign size={16} /> Monto ($)
                            </label>
                            <div className="input-with-icon">
                                <span>$</span>
                                <input
                                    type="number"
                                    name="amount"
                                    value={formData.amount}
                                    onChange={handleChange}
                                    placeholder="0"
                                    step="0.01"
                                    min="0"
                                    required
                                    style={{
                                        fontWeight: '600',
                                        fontSize: '1.1rem',
                                        borderColor: errors.amount ? 'var(--danger)' : undefined
                                    }}
                                />
                            </div>
                            {errors.amount && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--danger)',
                                    marginTop: '0.25rem',
                                    display: 'block'
                                }}>
                                    {errors.amount}
                                </span>
                            )}
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Calendar size={16} /> Fecha
                            </label>
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                style={{
                                    borderColor: errors.date ? 'var(--danger)' : undefined
                                }}
                            />
                            {errors.date && (
                                <span style={{
                                    fontSize: '0.75rem',
                                    color: 'var(--danger)',
                                    marginTop: '0.25rem',
                                    display: 'block'
                                }}>
                                    {errors.date}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="form-group">
                        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Tag size={16} /> Categoría
                        </label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                        >
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div style={{
                        marginBottom: '1.5rem',
                        padding: '1rem',
                        background: formData.recurring ? 'rgba(99, 102, 241, 0.1)' : 'rgba(128, 128, 128, 0.05)',
                        borderRadius: '12px',
                        border: formData.recurring ? '1px solid var(--primary)' : '1px solid var(--glass-border)',
                        transition: 'all 0.3s ease'
                    }}>
                        <label style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '1rem',
                            cursor: 'pointer',
                            margin: 0
                        }}>
                            <input
                                type="checkbox"
                                name="recurring"
                                checked={formData.recurring}
                                onChange={handleChange}
                                style={{
                                    width: '20px',
                                    height: '20px',
                                    cursor: 'pointer',
                                    accentColor: 'var(--primary)'
                                }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.1rem' }}>
                                    <Repeat size={16} style={{ color: formData.recurring ? 'var(--primary)' : 'var(--text-dim)' }} />
                                    <span style={{ fontWeight: '600', color: formData.recurring ? 'var(--text-main)' : 'var(--text-dim)' }}>
                                        Ingreso recurrente
                                    </span>
                                </div>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                                    Se registrará automáticamente cada mes
                                </span>
                            </div>
                        </label>
                    </div>

                    <button type="submit" className="submit-btn">
                        {initialData ? 'Actualizar Ingreso' : 'Guardar Ingreso'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default IncomeModal;

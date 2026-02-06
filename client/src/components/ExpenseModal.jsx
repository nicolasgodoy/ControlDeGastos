import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

function ExpenseModal({ isOpen, onClose, onSave, initialData }) {
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'comida',
        date: new Date().toISOString().split('T')[0]
    });

    // Populate form if editing
    useEffect(() => {
        if (initialData) {
            setFormData({
                description: initialData.description,
                amount: initialData.amount,
                category: initialData.category,
                date: initialData.date ? initialData.date.split('T')[0] : new Date().toISOString().split('T')[0]
            });
        } else {
            // Reset if creating new
            setFormData({
                description: '',
                amount: '',
                category: 'comida',
                date: new Date().toISOString().split('T')[0]
            });
        }
    }, [initialData, isOpen]);

    const categories = [
        { value: 'comida', label: 'Comida' },
        { value: 'juntadas', label: 'Juntadas' },
        { value: 'kiosko', label: 'Kiosko' },
        { value: 'supermercado', label: 'Supermercado' },
        { value: 'gym', label: 'Gimnasio' },
        { value: 'suplementos', label: 'Suplementos' },
        { value: 'otros', label: 'Otros' }
    ];

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.amount || isNaN(formData.amount)) return;
        await onSave({
            ...formData,
            amount: parseFloat(formData.amount)
        });
        // Form reset is handled by the effect or Parent closing logic, 
        // but nice to clear if staying open (though we usually close)
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal glass-card" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{initialData ? 'Editar Gasto' : 'Nuevo Gasto'}</h3>
                    <button className="close-btn" onClick={onClose}><X size={20} /></button>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Descripción</label>
                        <input
                            type="text"
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                            placeholder="Ej: Almuerzo en el trabajo"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Monto ($)</label>
                        <input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                            placeholder="0"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label>Categoría</label>
                        <select
                            value={formData.category}
                            onChange={e => setFormData({ ...formData, category: e.target.value })}
                            style={{ appearance: 'none' }}
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value} style={{ background: '#18181b', color: 'var(--text-main)' }}>
                                    {cat.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-group">
                        <label>Fecha</label>
                        <input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                    <button type="submit" className="submit-btn">
                        {initialData ? 'Guardar Cambios' : 'Guardar Gasto'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default ExpenseModal;

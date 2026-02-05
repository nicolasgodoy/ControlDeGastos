import React, { useEffect } from 'react';
import { Check } from 'lucide-react';

const Toast = ({ show, message, onClose }) => {
    if (!show) return null;

    // Auto close after 3s
    useEffect(() => {
        const timer = setTimeout(onClose, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className="toast-container">
            <div className="toast">
                <div className="toast-icon">
                    <Check size={20} />
                </div>
                <div className="toast-content">
                    <span className="toast-title">¡Pago Registrado!</span>
                    <span className="toast-message">{message}</span>
                </div>
            </div>
        </div>
    );
};

export default Toast;

import React, { useEffect, useState, useRef } from 'react';

/**
 * Reusable animated counter component for numbers using pure React (no framer-motion dependency).
 */
const AnimatedNumber = ({ value = 0, prefix = "", suffix = "", decimals = 0, duration = 1000 }) => {
    const [displayValue, setDisplayValue] = useState(value);
    const prevValueRef = useRef(value);
    const startTimeRef = useRef(null);

    useEffect(() => {
        const startValue = prevValueRef.current;
        const endValue = value;
        
        if (startValue === endValue) return;

        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const progress = Math.min((timestamp - startTimeRef.current) / duration, 1);
            
            // Easing function: easeOutExpo
            const easedProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
            
            const current = startValue + (endValue - startValue) * easedProgress;
            setDisplayValue(current);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                startTimeRef.current = null;
                prevValueRef.current = endValue;
            }
        };

        requestAnimationFrame(animate);
    }, [value, duration]);

    const formattedValue = new Intl.NumberFormat('es-AR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    }).format(displayValue);

    return <span>{prefix}{formattedValue}{suffix}</span>;
};

export default AnimatedNumber;
export { AnimatedNumber }; // Also export named for flexibility

import React, { useRef, useState, useEffect } from 'react';
import { useCountUp } from '../hooks/useCountUp';

/**
 * Animated numeric display with IntersectionObserver — only animates when visible.
 *
 * Props:
 *  value    {number}  - The number to display
 *  prefix   {string}  - e.g. "$"
 *  suffix   {string}  - e.g. "%"
 *  decimals {number}  - decimal places (default 0)
 *  locale   {string}  - locale for formatting (default 'es-AR')
 *  duration {number}  - animation ms (default 900)
 *  className {string} - optional CSS class on the wrapping span
 *  style    {object}  - optional inline styles on the wrapping span
 */
const AnimatedNumber = ({
    value = 0,
    prefix = '',
    suffix = '',
    decimals = 0,
    locale = 'es-AR',
    duration = 900,
    className,
    style
}) => {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    // Start animation only when element enters the viewport
    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    // Once visible, no need to keep observing
                    observer.unobserve(el);
                }
            },
            { threshold: 0.1 }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    // Re-trigger animation on value change even after first visibility
    const count = useCountUp(value, duration, visible);

    const formatted = decimals > 0
        ? count.toLocaleString(locale, {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        })
        : Math.round(count).toLocaleString(locale);

    return (
        <span ref={ref} className={className} style={style}>
            {prefix}{formatted}{suffix}
        </span>
    );
};

export default AnimatedNumber;

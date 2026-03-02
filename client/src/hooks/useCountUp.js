import { useState, useEffect, useRef } from 'react';

// Easing: fast start, smooth deceleration — feels premium
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animates a numeric value from its previous value to `target`.
 * Uses requestAnimationFrame for zero-overhead animation.
 * @param {number} target  - The final value to count up to
 * @param {number} duration - Animation duration in ms (default 900)
 * @param {boolean} enabled - Whether to animate (default true)
 */
export const useCountUp = (target, duration = 900, enabled = true) => {
    const [display, setDisplay] = useState(target);
    const rafRef = useRef(null);
    const startTimeRef = useRef(null);
    const prevValueRef = useRef(target); // track previous value for delta animation

    useEffect(() => {
        // If animations disabled, just snap to value
        if (!enabled) {
            setDisplay(target);
            return;
        }

        const startValue = prevValueRef.current;
        startTimeRef.current = null;

        // Cancel any in-progress animation
        if (rafRef.current) cancelAnimationFrame(rafRef.current);

        const animate = (timestamp) => {
            if (!startTimeRef.current) startTimeRef.current = timestamp;
            const elapsed = timestamp - startTimeRef.current;
            const progress = Math.min(elapsed / duration, 1);
            const eased = easeOutExpo(progress);
            const current = startValue + (target - startValue) * eased;

            setDisplay(current);

            if (progress < 1) {
                rafRef.current = requestAnimationFrame(animate);
            } else {
                prevValueRef.current = target; // update baseline for next animation
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration, enabled]);

    return display;
};

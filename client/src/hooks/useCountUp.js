import { useState, useEffect, useRef } from 'react';

// Easing: fast start, smooth deceleration — feels premium
const easeOutExpo = (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

/**
 * Animates a numeric value from 0 (or previous value) to `target`.
 * Uses requestAnimationFrame for zero-overhead animation.
 * @param {number} target  - The final value to count up to
 * @param {number} duration - Animation duration in ms (default 900)
 * @param {boolean} enabled - Whether to animate (triggers when IntersectionObserver fires)
 */
export const useCountUp = (target, duration = 900, enabled = true) => {
    // Start at 0, not target — so animation always plays when enabled fires
    const [display, setDisplay] = useState(0);
    const rafRef = useRef(null);
    const startTimeRef = useRef(null);
    // Start from 0 always on mount — fixes Dashboard (pre-loaded props) not animating
    const prevValueRef = useRef(0);

    useEffect(() => {
        // If not visible yet, do nothing — keep showing 0 until IntersectionObserver fires
        if (!enabled) return;

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
                prevValueRef.current = target; // update baseline for next re-animation
            }
        };

        rafRef.current = requestAnimationFrame(animate);

        return () => {
            if (rafRef.current) cancelAnimationFrame(rafRef.current);
        };
    }, [target, duration, enabled]);

    return display;
};

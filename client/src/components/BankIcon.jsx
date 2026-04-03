import React from 'react';

// ── Bank SVG Icons ────────────────────────────────────────────────────────────
// Inline SVGs that match each entity's real brand identity

const icons = {
    GALICIA: ({ size = 24, ...props }) => (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect width="40" height="40" rx="8" fill="#C8102E" />
            <text x="20" y="27" textAnchor="middle" fill="white" fontSize="13" fontWeight="800" fontFamily="Arial,sans-serif">G</text>
            <rect x="8" y="30" width="24" height="2.5" rx="1.25" fill="white" opacity="0.7" />
        </svg>
    ),

    ICBC: ({ size = 24, ...props }) => (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect width="40" height="40" rx="8" fill="#C8102E" />
            <rect x="8" y="14" width="4" height="12" rx="2" fill="white" />
            <rect x="15" y="14" width="4" height="12" rx="2" fill="white" />
            <path d="M22 20 C22 16.5 25 14 28 14 L28 17.5 C26.5 17.5 25.5 18.5 25.5 20 C25.5 21.5 26.5 22.5 28 22.5 L28 26 C25 26 22 23.5 22 20Z" fill="white" />
        </svg>
    ),

    'MERCADO PAGO': ({ size = 24, ...props }) => (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect width="40" height="40" rx="8" fill="#009EE3" />
            <circle cx="20" cy="20" r="9" fill="white" />
            <path d="M14 20.5 L18 17 L20 21 L22.5 15 L26 20.5" stroke="#009EE3" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
    ),

    NARANJA: ({ size = 24, ...props }) => (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect width="40" height="40" rx="8" fill="#FF6B1A" />
            <circle cx="20" cy="20" r="10" fill="white" />
            <circle cx="20" cy="20" r="7" fill="#FF6B1A" />
            <circle cx="20" cy="20" r="3.5" fill="white" />
        </svg>
    ),

    UALA: ({ size = 24, ...props }) => (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect width="40" height="40" rx="8" fill="#7B2FBE" />
            <path d="M11 13 L11 22 C11 26.5 14.5 28.5 20 28.5 C25.5 28.5 29 26.5 29 22 L29 13" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
            <line x1="20" y1="21" x2="20" y2="28" stroke="white" strokeWidth="3" strokeLinecap="round" />
        </svg>
    ),

    DEFAULT: ({ size = 24, ...props }) => (
        <svg width={size} height={size} viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
            <rect width="40" height="40" rx="8" fill="#6366f1" />
            <rect x="8" y="18" width="24" height="3" rx="1.5" fill="white" />
            <rect x="8" y="10" width="24" height="3" rx="1.5" fill="white" />
            <rect x="12" y="22" width="2.5" height="9" rx="1.25" fill="white" />
            <rect x="18.75" y="22" width="2.5" height="9" rx="1.25" fill="white" />
            <rect x="25.5" y="22" width="2.5" height="9" rx="1.25" fill="white" />
        </svg>
    ),
};

/**
 * BankIcon – renders the matching SVG for a given bank entity name.
 * Falls back to a generic bank icon.
 *
 * Usage:
 *   <BankIcon entity="ICBC" size={32} />
 *   <BankIcon entity="MERCADO PAGO" size={24} style={{ borderRadius: '6px' }} />
 */
export function BankIcon({ entity = '', size = 24, style = {}, className = '' }) {
    const key = (entity || '').toUpperCase().trim();
    const Icon = icons[key] || icons.DEFAULT;
    return <Icon size={size} style={style} className={className} />;
}

/**
 * Returns a brand colour for a given entity (used for dot/highlight accents).
 */
export const BANK_COLORS = {
    GALICIA: '#C8102E',
    ICBC: '#C8102E',
    'MERCADO PAGO': '#009EE3',
    NARANJA: '#FF6B1A',
    UALA: '#7B2FBE',
    DEFAULT: '#6366f1',
};

export function getBankColor(entity) {
    const key = (entity || '').toUpperCase().trim();
    return BANK_COLORS[key] || BANK_COLORS.DEFAULT;
}

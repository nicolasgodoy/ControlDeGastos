/**
 * Centralized color management system for "Control de Costos".
 * This ensures consistency across Dashboard, Gastos, and Deudas views.
 */

export const CATEGORY_COLORS = {
    // Cold to Warm Gradient (Sky -> Blue -> Green -> Amber -> Red -> Pink)
    'colectivo': "#38bdf8",    // Sky 400 (Coldest)
    'uber': "#2563eb",         // Blue 600
    'suplementos': "#06b6d4",  // Cyan 500
    'comida': "#14b8a6",       // Teal 500
    'verduleria': "#10b981",   // Emerald 500
    'gym': "#22c55e",          // Green 500
    'servicios': "#f59e0b",    // Amber 500 (Mid-Warm)
    'juntadas': "#ea580c",     // Orange 600
    'farmacia': "#dc2626",     // Red 600
    'kiosko': "#be123c",       // Rose 700
    'otros': "#db2777",        // Pink 600 (Warmest)

    // Additional Categories
    'transporte': "#0ea5e9",
    'hogar': "#84cc16",
    'entretenimiento': "#8b5cf6",
    'salud': "#ef4444",
    'default': "#71717a"
};

export const ENTITY_COLORS = [
    "#dc2626", // Galicia (Red)
    "#e11d48", // ICBC (Red-Pink)
    "#a855f7", // Mercado Pago (Purple)
    "#7c3aed", // Ualá (Deep Purple)
    "#8b5cf6", // Fallback (Violet)
    "#6366f1", // Indigo
    "#06b6d4", // Cyan
    "#10b981", // Emerald
    "#f59e0b", // Amber
];

/**
 * Returns the color for a given category name.
 * Normalizes input and provides a fallback.
 */
export const getCategoryColor = (category) => {
    if (!category) return CATEGORY_COLORS.default;
    const normalized = category.toLowerCase().trim();
    return CATEGORY_COLORS[normalized] || CATEGORY_COLORS.default;
};

/**
 * Returns a color from the entity palette based on index.
 * Useful for consistent assignment when looping through dynamic entities.
 */
export const getEntityColor = (index) => {
    return ENTITY_COLORS[index % ENTITY_COLORS.length];
};

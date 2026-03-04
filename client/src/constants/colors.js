/**
 * Centralized color management system for "Control de Costos".
 * This ensures consistency across Dashboard, Gastos, and Deudas views.
 */

export const CATEGORY_COLORS = {
    // Brand Gradient: Cold to Warm
    'otros': "#0369a1",       // Dark Blue
    'suplementos': "#38bdf8", // Cyan/Teal
    'comida': "#0d9488",      // Teal/Emerald
    'gym': "#22c55e",         // Green
    'verduleria': "#188b43ff",
    'juntadas': "#f59e0b",    // Amber/Gold
    'farmacia': "#ea580c",    // Orange
    'kiosko': "#e61f1fc4",      // Red

    // Additional Categories (Keeping consistency for common names)
    'supermercado': "#ec4899", // Pink
    'transporte': "#0ea5e9",   // Sky Blue
    'hogar': "#22c55e",        // Green
    'servicios': "#10b981",    // Emerald
    'entretenimiento': "#a855f7", // Purple
    'salud': "#ef4444",        // Red
    'compras': "#db2777",      // Pink-700
    'ropa': "#d946ef",         // Fuchsia
    'educacion': "#6366f1",    // Indigo
    'cursos': "#4f46e5",       // Indigo-600
    'varios': "#94a3b8",       // Slate-400
    'deporte': "#f87171",      // Light Red
    'regalos': "#f472b6",      // Pink-400
    'taxis': "#0284c7",        // Sky-600
    'default': "#71717a"       // Zinc fallback
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

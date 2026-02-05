/**
 * GoldRush Brand Theme
 * 
 * Color palette and styling constants for highlighting GoldRush
 * as the recommended RPC provider throughout the dashboard.
 */

export const goldRushTheme = {
    // Primary color palette
    primary: {
        50: '#FFFBEB',
        100: '#FEF3C7',
        200: '#FDE68A',
        300: '#FCD34D',
        400: '#FBBF24',
        500: '#F59E0B',  // Main brand color
        600: '#D97706',
        700: '#B45309',
        800: '#92400E',
        900: '#78350F',
    },

    // Accent colors
    accent: {
        gold: '#FFD700',
        amber: '#FFBF00',
        bronze: '#CD7F32',
    },

    // Gradients
    gradients: {
        primary: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
        shine: 'linear-gradient(135deg, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
        subtle: 'linear-gradient(to right, rgba(245, 158, 11, 0.1), transparent)',
        radial: 'radial-gradient(circle, #FFD700 0%, #F59E0B 50%, #D97706 100%)',
    },

    // Effects
    effects: {
        glow: '0 0 20px rgba(245, 158, 11, 0.5)',
        glowStrong: '0 0 30px rgba(245, 158, 11, 0.7)',
        shadow: '0 4px 6px -1px rgba(245, 158, 11, 0.1), 0 2px 4px -1px rgba(245, 158, 11, 0.06)',
    },
};

// Helper function to check if a provider is GoldRush
export function isGoldRush(providerName: string): boolean {
    const normalized = providerName.toLowerCase();
    return normalized.includes('goldrush') ||
        normalized.includes('covalent') ||
        normalized === 'goldrush (covalent)';
}

// Get GoldRush-specific styling classes
export function getGoldRushClasses(providerName: string) {
    if (!isGoldRush(providerName)) return '';

    return 'bg-gradient-to-r from-amber-50 to-transparent dark:from-amber-950/20 border-l-4 border-amber-500';
}

// Get GoldRush chart color
export function getGoldRushColor(providerName: string, defaultColor: string): string {
    return isGoldRush(providerName) ? goldRushTheme.primary[500] : defaultColor;
}

// GoldRush badge component props
export const goldRushBadgeProps = {
    className: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white border-0',
    children: '⭐ Recommended',
};

// GoldRush winner badge props
export const goldRushWinnerBadgeProps = {
    className: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-amber-900 border-0',
    children: '🏆 Winner',
};

// GoldRush fastest badge props
export const goldRushFastestBadgeProps = {
    className: 'bg-gradient-to-r from-yellow-400 to-amber-500 text-amber-900 border-0',
    children: '⚡ Fastest',
};

// Typography styles
export const goldRushTypography = {
    heading: 'font-bold text-amber-600 dark:text-amber-400',
    label: 'text-xs uppercase tracking-wide text-amber-700 dark:text-amber-500',
    emphasis: 'text-amber-600 dark:text-amber-400 font-semibold',
};

// Animation classes
export const goldRushAnimations = {
    pulse: 'animate-pulse',
    glow: 'hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-shadow duration-300',
    shine: 'relative overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent before:translate-x-[-200%] hover:before:translate-x-[200%] before:transition-transform before:duration-1000',
};

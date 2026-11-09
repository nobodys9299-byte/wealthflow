export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'SGD', symbol: 'SG$', name: 'Singapore Dollar' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc' },
];

export const THEMES = {
  dark: {
    id: 'dark',
    name: 'Midnight Slate',
    isDark: true,
    bg: '#0F172A',         // Slate 900
    card: '#1E293B',       // Slate 800
    cardAlt: '#334155',    // Slate 700
    cardHover: '#283548',
    text: '#F8FAFC',       // Slate 50
    textMuted: '#94A3B8',  // Slate 400
    border: '#334155',     // Slate 700
    inputBg: '#0B1120',    // Slate 950
    primary: '#6366F1',    // Indigo 500
    primaryLight: '#818CF8',
    primaryBg: '#312E81',
    success: '#10B981',    // Emerald 500
    successBg: 'rgba(16, 185, 129, 0.15)',
    danger: '#F43F5E',     // Rose 500
    dangerBg: 'rgba(244, 63, 94, 0.15)',
    warning: '#F59E0B',    // Amber 500
    warningBg: 'rgba(245, 158, 11, 0.15)',
    info: '#0EA5E9',       // Sky 500
    modalOverlay: 'rgba(0, 0, 0, 0.75)',
  },
  light: {
    id: 'light',
    name: 'Pure Daylight',
    isDark: false,
    bg: '#F8FAFC',         // Slate 50
    card: '#FFFFFF',       // White
    cardAlt: '#F1F5F9',    // Slate 100
    cardHover: '#E2E8F0',
    text: '#0F172A',       // Slate 900
    textMuted: '#64748B',  // Slate 500
    border: '#E2E8F0',     // Slate 200
    inputBg: '#F1F5F9',    // Slate 100
    primary: '#4F46E5',    // Indigo 600
    primaryLight: '#6366F1',
    primaryBg: '#EEF2FF',
    success: '#059669',    // Emerald 600
    successBg: '#D1FAE5',
    danger: '#E11D48',     // Rose 600
    dangerBg: '#FFE4E6',
    warning: '#D97706',    // Amber 600
    warningBg: '#FEF3C7',
    info: '#0284C7',       // Sky 600
    modalOverlay: 'rgba(15, 23, 42, 0.5)',
  },
  emerald: {
    id: 'emerald',
    name: 'Forest Wealth',
    isDark: true,
    bg: '#061E16',         // Deep Emerald
    card: '#0D3327',       // Dark Teal Card
    cardAlt: '#144636',
    cardHover: '#1B5A46',
    text: '#ECFDF5',       // Mint text
    textMuted: '#6EE7B7',  // Light emerald
    border: '#144636',
    inputBg: '#04140E',
    primary: '#10B981',    // Emerald green
    primaryLight: '#34D399',
    primaryBg: 'rgba(16, 185, 129, 0.25)',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.2)',
    danger: '#FB7185',
    dangerBg: 'rgba(251, 113, 133, 0.2)',
    warning: '#FBBF24',
    warningBg: 'rgba(251, 191, 36, 0.2)',
    info: '#2DD4BF',
    modalOverlay: 'rgba(2, 18, 12, 0.85)',
  },
  cyberpunk: {
    id: 'cyberpunk',
    name: 'OLED Cyberpunk',
    isDark: true,
    bg: '#000000',         // Pitch Black
    card: '#121216',       // Obsidian Card
    cardAlt: '#22222B',
    cardHover: '#2A2A38',
    text: '#FFFFFF',
    textMuted: '#9CA3AF',
    border: '#272738',
    inputBg: '#09090C',
    primary: '#00F0FF',    // Neon Cyan
    primaryLight: '#67F8FF',
    primaryBg: 'rgba(0, 240, 255, 0.2)',
    success: '#10F07A',    // Neon Green
    successBg: 'rgba(16, 240, 122, 0.2)',
    danger: '#FF0055',     // Neon Crimson
    dangerBg: 'rgba(255, 0, 85, 0.2)',
    warning: '#FFE600',    // Neon Yellow
    warningBg: 'rgba(255, 230, 0, 0.2)',
    info: '#8B5CF6',
    modalOverlay: 'rgba(0, 0, 0, 0.9)',
  },
  sunset: {
    id: 'sunset',
    name: 'Warm Sunset',
    isDark: true,
    bg: '#1C1917',         // Warm Stone 900
    card: '#292524',       // Stone 800
    cardAlt: '#44403C',    // Stone 700
    cardHover: '#57534E',
    text: '#FAFAF9',       // Stone 50
    textMuted: '#A8A29E',  // Stone 400
    border: '#44403C',
    inputBg: '#141210',
    primary: '#F97316',    // Sunset Orange
    primaryLight: '#FB923C',
    primaryBg: 'rgba(249, 115, 22, 0.2)',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.15)',
    danger: '#F43F5E',
    dangerBg: 'rgba(244, 63, 94, 0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    info: '#38BDF8',
    modalOverlay: 'rgba(28, 25, 23, 0.85)',
  },
  ocean: {
    id: 'ocean',
    name: 'Deep Oceanic',
    isDark: true,
    bg: '#0A192F',         // Deep Navy Blue
    card: '#112240',       // Navy Blue Card
    cardAlt: '#1E3A5F',
    cardHover: '#233554',
    text: '#CCD6F6',       // Light Slate
    textMuted: '#8892B0',  // Muted Slate
    border: '#1E3A5F',
    inputBg: '#060D17',
    primary: '#38BDF8',    // Sky Blue
    primaryLight: '#7DD3FC',
    primaryBg: 'rgba(56, 189, 248, 0.2)',
    success: '#4ADE80',
    successBg: 'rgba(74, 222, 128, 0.15)',
    danger: '#FB7185',
    dangerBg: 'rgba(251, 113, 133, 0.2)',
    warning: '#FBBF24',
    warningBg: 'rgba(251, 191, 36, 0.2)',
    info: '#60A5FA',
    modalOverlay: 'rgba(10, 25, 47, 0.85)',
  },
};

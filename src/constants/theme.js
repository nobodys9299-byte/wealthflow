export const CURRENCIES = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
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
    heroBg: '#1E1B4B',     // Deep Midnight Indigo
    heroBorder: '#6366F1',
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
    heroBg: '#4338CA',     // Indigo 700
    heroBorder: '#4F46E5',
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
    heroBg: '#093A2A',     // Rich Forest Emerald
    heroBorder: '#10B981',
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
    heroBg: '#16132C',     // Neon Obsidian
    heroBorder: '#00F0FF',
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
    heroBg: '#3A1C12',     // Sunset Amber Bronze
    heroBorder: '#F97316',
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
    heroBg: '#0E2E4E',     // Deep Oceanic Navy
    heroBorder: '#38BDF8',
    modalOverlay: 'rgba(10, 25, 47, 0.85)',
  },
  amberGold: {
    id: 'amberGold',
    name: 'Warm Amber Gold',
    isDark: true,
    bg: '#18130C',         // Rich Amber Charcoal
    card: '#241C12',       // Warm Honey Card
    cardAlt: '#362B1D',    // Muted Gold Wood
    cardHover: '#423524',
    text: '#FEF3C7',       // Warm Amber Light
    textMuted: '#D97706',  // Amber Gold
    border: '#453520',
    inputBg: '#120E08',
    primary: '#F59E0B',    // Amber 500
    primaryLight: '#FBBF24',
    primaryBg: 'rgba(245, 158, 11, 0.25)',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.2)',
    danger: '#F43F5E',
    dangerBg: 'rgba(244, 63, 94, 0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    info: '#06B6D4',
    heroBg: '#36240E',     // Deep Warm Amber Honey
    heroBorder: '#F59E0B',
    modalOverlay: 'rgba(24, 19, 12, 0.88)',
  },
  terracotta: {
    id: 'terracotta',
    name: 'Tuscan Terracotta',
    isDark: true,
    bg: '#1C130E',         // Deep Tuscan Earth
    card: '#291C15',       // Baked Clay Card
    cardAlt: '#3D2A20',    // Terracotta Shadow
    cardHover: '#4D3629',
    text: '#FFEDD5',       // Warm Peach White
    textMuted: '#FB923C',  // Warm Clay Muted
    border: '#4A3226',
    inputBg: '#140D0A',
    primary: '#EA580C',    // Terracotta 600
    primaryLight: '#FB923C',
    primaryBg: 'rgba(234, 88, 12, 0.25)',
    success: '#34D399',
    successBg: 'rgba(52, 211, 153, 0.2)',
    danger: '#EF4444',
    dangerBg: 'rgba(239, 68, 68, 0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    info: '#38BDF8',
    heroBg: '#3B1A10',     // Tuscan Earth Terracotta
    heroBorder: '#EA580C',
    modalOverlay: 'rgba(28, 19, 14, 0.88)',
  },
  warmMocha: {
    id: 'warmMocha',
    name: 'Cozy Mocha',
    isDark: true,
    bg: '#171311',         // Espresso Roast
    card: '#241D1A',       // Dark Roast Card
    cardAlt: '#382E29',    // Roasted Cocoa
    cardHover: '#483C35',
    text: '#F5EBE6',       // Cream Foam
    textMuted: '#C4A482',  // Coffee Crema
    border: '#423731',
    inputBg: '#100D0B',
    primary: '#B45309',    // Warm Cinnamon
    primaryLight: '#D97706',
    primaryBg: 'rgba(180, 83, 9, 0.25)',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.2)',
    danger: '#F43F5E',
    dangerBg: 'rgba(244, 63, 94, 0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    info: '#0EA5E9',
    heroBg: '#2E1F18',     // Deep Roasted Mocha
    heroBorder: '#B45309',
    modalOverlay: 'rgba(23, 19, 17, 0.88)',
  },
  roseGold: {
    id: 'roseGold',
    name: 'Warm Rose Gold',
    isDark: true,
    bg: '#1A1115',         // Deep Burgundy Velvet
    card: '#271921',       // Rose Mahogany Card
    cardAlt: '#3C2633',    // Rose Copper Shadow
    cardHover: '#4D3141',
    text: '#FFE4E6',       // Rose Cream
    textMuted: '#FDA4AF',  // Soft Blush
    border: '#452B3A',
    inputBg: '#130C10',
    primary: '#E11D48',    // Rose Gold Crimson
    primaryLight: '#FB7185',
    primaryBg: 'rgba(225, 29, 72, 0.25)',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.2)',
    danger: '#F43F5E',
    dangerBg: 'rgba(244, 63, 94, 0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    info: '#A855F7',
    heroBg: '#351424',     // Deep Velvet Rose Gold
    heroBorder: '#E11D48',
    modalOverlay: 'rgba(26, 17, 21, 0.88)',
  },
  autumnGlow: {
    id: 'autumnGlow',
    name: 'Autumn Harvest',
    isDark: true,
    bg: '#191209',         // Deep Maple Night
    card: '#271C0F',       // Spiced Pumpkin Card
    cardAlt: '#3D2D1A',    // Toasted Amber
    cardHover: '#4D3922',
    text: '#FEF3C7',       // Warm Candle Glow
    textMuted: '#F59E0B',  // Autumn Orange
    border: '#483520',
    inputBg: '#110C05',
    primary: '#D97706',    // Warm Amber Orange
    primaryLight: '#FBBF24',
    primaryBg: 'rgba(217, 119, 6, 0.25)',
    success: '#10B981',
    successBg: 'rgba(16, 185, 129, 0.2)',
    danger: '#E11D48',
    dangerBg: 'rgba(225, 29, 72, 0.2)',
    warning: '#F59E0B',
    warningBg: 'rgba(245, 158, 11, 0.2)',
    info: '#06B6D4',
    heroBg: '#361E0A',     // Deep Spiced Autumn Glow
    heroBorder: '#D97706',
  },
};

// Coco design tokens — dark glassmorphism, premium Nigerian streaming-app feel.

export const colors = {
  bgTop: '#0D0D0D',
  bgBottom: '#1a1a2e',
  bgMid: '#141428',

  glass: 'rgba(255,255,255,0.07)',
  glassStrong: 'rgba(255,255,255,0.12)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassBorderStrong: 'rgba(255,255,255,0.24)',

  text: '#FFFFFF',
  textDim: 'rgba(255,255,255,0.64)',
  textFaint: 'rgba(255,255,255,0.38)',

  // Coco flame brand gradient
  flameStart: '#FF7A18',
  flameEnd: '#FF2E63',

  accent: '#FF7A18',
  accentSoft: 'rgba(255,122,24,0.16)',

  // Quality score bands
  exceptional: '#22C55E',
  exceptionalSoft: 'rgba(34,197,94,0.16)',
  good: '#3B82F6',
  goodSoft: 'rgba(59,130,246,0.16)',
  average: '#F5C518',
  averageSoft: 'rgba(245,197,24,0.16)',
  weak: '#EF4444',
  weakSoft: 'rgba(239,68,68,0.16)',

  success: '#22C55E',
  danger: '#EF4444',
  warning: '#F5C518',
  proGold: '#F5C518',
};

export const CATEGORIES = [
  { key: 'all', label: 'All', icon: 'apps' },
  { key: 'telecoms', label: 'Telecoms', icon: 'cellphone-wireless' },
  { key: 'food', label: 'Food', icon: 'food' },
  { key: 'supermarkets', label: 'Supermarkets', icon: 'cart' },
  { key: 'electronics', label: 'Electronics', icon: 'television' },
  { key: 'fashion', label: 'Fashion', icon: 'hanger' },
  { key: 'banks', label: 'Banks', icon: 'bank' },
  { key: 'transport', label: 'Transport', icon: 'car' },
  { key: 'entertainment', label: 'Entertainment', icon: 'movie-open' },
  { key: 'more', label: 'More', icon: 'dots-horizontal' },
];

export function scoreMeta(score) {
  if (score >= 80) return { label: 'Exceptional Deal', color: colors.exceptional, soft: colors.exceptionalSoft };
  if (score >= 60) return { label: 'Good Deal', color: colors.good, soft: colors.goodSoft };
  if (score >= 40) return { label: 'Average Deal', color: colors.average, soft: colors.averageSoft };
  return { label: 'Weak Deal', color: colors.weak, soft: colors.weakSoft };
}

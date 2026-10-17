export const colors = {
  bg: '#F4EFE3',
  surface: '#FFFDF8',
  surfaceAlt: '#EAE3D2',
  border: '#DDD4C0',
  text: '#1F2A1F',
  textMuted: '#5E6A5C',
  textFaint: '#8C9688',
  primary: '#2F5D3A',
  primaryDark: '#1F4128',
  primarySoft: '#DCE8D8',
  onPrimary: '#FFFFFF',
  terracotta: '#B85C38',
  terracottaSoft: '#F3DED3',
  sun: '#D99A1E',
  sunSoft: '#F8EBCB',
  water: '#2E6F95',
  waterSoft: '#D9E9F2',
  danger: '#B3261E',
  overlay: 'rgba(20, 28, 20, 0.55)',
};

export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const type = {
  display: { fontSize: 30, fontWeight: '800' as const, letterSpacing: -0.5, color: colors.text },
  title: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3, color: colors.text },
  heading: { fontSize: 17, fontWeight: '700' as const, color: colors.text },
  body: { fontSize: 15, lineHeight: 21, color: colors.text },
  small: { fontSize: 13, lineHeight: 18, color: colors.textMuted },
  label: { fontSize: 12, fontWeight: '700' as const, letterSpacing: 0.6, textTransform: 'uppercase' as const, color: colors.textMuted },
};

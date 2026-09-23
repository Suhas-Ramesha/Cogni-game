/** NER-inspired tokens shared by the patient app (NativeWind) and dashboard (Tailwind). */

export const colors = {
  forest: '#0F3D2E',
  canopy: '#1F6F4A',
  turmeric: '#E0A100',
  cream: '#F6EFE4',
  ink: '#14110F',
  bark: '#4A3728',
  mist: '#E7F0EA',
  alert: '#9B1D20',
  ok: '#1F6F4A',
  white: '#FFFBFA',
} as const;

export const tapTarget = {
  min: 64,
  comfortable: 72,
} as const;

export const type = {
  patientBody: 22,
  patientTitle: 32,
  patientDisplay: 40,
  dashboardBody: 16,
  dashboardTitle: 24,
} as const;

export const contrast = {
  /** cream on forest — WCAG AAA for large text */
  primaryOnBg: { fg: colors.cream, bg: colors.forest },
  inkOnCream: { fg: colors.ink, bg: colors.cream },
  inkOnTurmeric: { fg: colors.ink, bg: colors.turmeric },
} as const;

export const tailwindExtend = {
  colors: {
    forest: colors.forest,
    canopy: colors.canopy,
    turmeric: colors.turmeric,
    cream: colors.cream,
    ink: colors.ink,
    bark: colors.bark,
    mist: colors.mist,
    alert: colors.alert,
  },
  minHeight: { tap: `${tapTarget.min}px` },
  minWidth: { tap: `${tapTarget.min}px` },
  fontSize: {
    'patient-body': [`${type.patientBody}px`, { lineHeight: '1.35' }],
    'patient-title': [`${type.patientTitle}px`, { lineHeight: '1.2' }],
  },
};

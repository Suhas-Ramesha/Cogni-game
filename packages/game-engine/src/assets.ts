import type { LanguageCode } from '@cognigame/shared-types';

export interface ThemedAsset {
  id: string;
  kind: 'food' | 'festival' | 'landmark' | 'routine' | 'shape' | 'sound';
  /** Bundled placeholder; swap files later without changing ids. */
  asset: string;
  labels: Record<LanguageCode, string>;
}

export const REGIONAL_ASSETS: ThemedAsset[] = [
  {
    id: 'pitha',
    kind: 'food',
    asset: 'pitha',
    labels: { en: 'Pitha', as: 'পিঠা', kha: 'Pitha' },
  },
  {
    id: 'tenga',
    kind: 'food',
    asset: 'tenga',
    labels: { en: 'Masor tenga', as: 'মাছৰ টেঙা', kha: 'Doh doh khleh' },
  },
  {
    id: 'momo',
    kind: 'food',
    asset: 'momo',
    labels: { en: 'Momo', as: 'মমো', kha: 'Momo' },
  },
  {
    id: 'bamboo-shoot',
    kind: 'food',
    asset: 'bamboo',
    labels: { en: 'Bamboo shoot', as: 'বাঁহ গাজ', kha: 'Sohpdung' },
  },
  {
    id: 'bihu',
    kind: 'festival',
    asset: 'bihu',
    labels: { en: 'Bihu', as: 'বিহু', kha: 'Bihu' },
  },
  {
    id: 'hornbill',
    kind: 'festival',
    asset: 'hornbill',
    labels: { en: 'Hornbill festival', as: 'হৰ্ণবিল উৎসৱ', kha: 'Hornbill' },
  },
  {
    id: 'shad-suk-mynsiem',
    kind: 'festival',
    asset: 'dance',
    labels: { en: 'Shad Suk Mynsiem', as: 'শাদ ছুক মিনচিয়েম', kha: 'Shad Suk Mynsiem' },
  },
  {
    id: 'kaziranga',
    kind: 'landmark',
    asset: 'rhino',
    labels: { en: 'Kaziranga', as: 'কাজিৰঙা', kha: 'Kaziranga' },
  },
  {
    id: 'living-root',
    kind: 'landmark',
    asset: 'bridge',
    labels: { en: 'Living root bridge', as: 'জীৱন্ত শিপাৰ দলং', kha: 'Jingkieng jri' },
  },
  {
    id: 'kamakhya',
    kind: 'landmark',
    asset: 'temple',
    labels: { en: 'Kamakhya', as: 'কামাখ্যা', kha: 'Kamakhya' },
  },
];

export const ROUTINE_STEPS = [
  { id: 'wake', order: 1, labels: { en: 'Wake up', as: 'উঠক', kha: 'Kie' }, asset: 'sun' },
  { id: 'brush', order: 2, labels: { en: 'Brush teeth', as: 'দাঁত ঘঁহক', kha: 'Pynkhuid bniat' }, asset: 'brush' },
  { id: 'eat', order: 3, labels: { en: 'Eat breakfast', as: 'পুৱাৰ আহাৰ', kha: 'Bam step' }, asset: 'bowl' },
  { id: 'medicine', order: 4, labels: { en: 'Take medicine', as: 'ঔষধ লওক', kha: 'Di dawai' }, asset: 'pills' },
  { id: 'walk', order: 5, labels: { en: 'Short walk', as: 'খোজ কঢ়া', kha: 'Iaid' }, asset: 'path' },
  { id: 'tea', order: 6, labels: { en: 'Evening tea', as: 'গধূলি চাহ', kha: 'Sha janmiet' }, asset: 'cup' },
  { id: 'sleep', order: 7, labels: { en: 'Sleep', as: 'শুওক', kha: 'Thiah' }, asset: 'moon' },
] as const;

export const SHAPES = [
  { id: 'circle', color: '#1F6F4A' },
  { id: 'square', color: '#E0A100' },
  { id: 'triangle', color: '#9B1D20' },
  { id: 'diamond', color: '#0F3D2E' },
  { id: 'star', color: '#4A3728' },
] as const;

export const MOOD_CHOICES = [
  { id: 'joyful', emoji: '😊', labels: { en: 'Happy', as: 'খুছি', kha: 'Kmen' } },
  { id: 'calm', emoji: '😌', labels: { en: 'Calm', as: 'শান্ত', kha: 'Jah' } },
  { id: 'okay', emoji: '😐', labels: { en: 'Okay', as: 'ঠিক আছে', kha: 'Khuid' } },
  { id: 'sad', emoji: '😢', labels: { en: 'Sad', as: 'দুখীয়া', kha: 'Sniew' } },
  { id: 'anxious', emoji: '😟', labels: { en: 'Worried', as: 'চিন্তিত', kha: 'Sngewbiej' } },
] as const;

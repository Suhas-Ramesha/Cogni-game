import type { Metadata, Viewport } from 'next';
import { Atkinson_Hyperlegible, Fraunces } from 'next/font/google';
import './globals.css';

const ui = Atkinson_Hyperlegible({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-ui',
  display: 'swap',
});

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'CogniGame NER — Caregiver',
  description: 'Cognitive trends, reminders, and alerts for dementia caregivers in North East India',
};

export const viewport: Viewport = {
  themeColor: '#F4EDE1',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${ui.variable} ${display.variable}`}>
      <body className="min-h-screen font-sans">
        <a className="skip-link" href="#main">
          Skip to main content
        </a>
        {children}
      </body>
    </html>
  );
}

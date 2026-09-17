import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'ARIA — IT Support Agent | Veridian Corp',
  description:
    'ARIA — Automated Resolution & IT Assistant for Veridian Corp. AI-powered IT support agent handling employee requests, tickets, and policy-compliant resolutions.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

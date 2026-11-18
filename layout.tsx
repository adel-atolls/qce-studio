import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'QCE Studio V2',
  description: 'Quality Control Admin Dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="dark">
      <body>{children}</body>
    </html>
  );
}
import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

// This is the Inter font, which you are already using for the body
const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Zenvoice',
  description: 'Manage your autonomous voice assistants',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Fonts Preconnect Links - Recommended for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        {/* The Barlow font link with the weights you need (e.g., 500 and 600) */}
        <link
          href="https://fonts.googleapis.com/css2?family=Barlow:wght@500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
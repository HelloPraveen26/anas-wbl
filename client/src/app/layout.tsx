import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zenvoice',
  description: 'Manage your autonomous voice assistants',
  icons: {
    icon: '/assets/logo1.png',
  },
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
        {/* Temporarily removed font links to test loading */}
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}

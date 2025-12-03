import './globals.css';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Zenvoice',
  description: 'Manage your autonomous voice assistants',
  icons: {
    icon: [
      { url: '/assets/cristcrop.png', sizes: '32x32', type: 'image/png' },
      { url: '/assets/cristcrop.png', sizes: '64x64', type: 'image/png' },
      { url: '/assets/cristcrop.png', sizes: '128x128', type: 'image/png' },
      { url: '/assets/cristcrop.png', sizes: '256x256', type: 'image/png' },
    ],
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

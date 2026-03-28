// import "./globals.css";

// import type { Metadata } from "next";
// import { Toaster } from "@/components/ui/toaster";

// export const metadata: Metadata = {
//   title: "ZenVoice AI | Autonomous AI Voice Agents for Business",
//   description: "ZenVoice provides human-like, autonomous AI voice agents for businesses. Automate customer support, telecalling, and more with our multilingual AI solutions.",
//   icons: {
//     icon: "/assets/logo1.png",
//   },
// };

// export default function RootLayout({
//   children,
// }: {
//   children: React.ReactNode;
// }) {
//   return (
//     <html lang="en">
//       <head>
//         {/* Google Fonts Preconnect Links - Recommended for performance */}
//         <link rel="preconnect" href="https://fonts.googleapis.com" />
//         <link
//           rel="preconnect"
//           href="https://fonts.gstatic.com"
//           crossOrigin="anonymous"
//         />
//         {/* Temporarily removed font links to test loading */}
//       </head>
//       <body className="font-sans antialiased">
//         {children}
//         <Toaster />
//       </body>
//     </html>
//   );
// }




import "./globals.css";

import type { Metadata } from "next";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: "Hspsms| Autonomous AI Voice Agents for Business",
  description:
    "Hspsmsprovides human-like, autonomous AI voice agents for businesses. Automate customer support, telecalling, and more with our multilingual AI solutions.",

  // 👇 ADD THIS
  openGraph: {
    siteName: "ZenVoice",
    title: "Hspsms | Autonomous AI Voice Agents for Business",
    description:
      "ZenVoice provides human-like, autonomous AI voice agents for businesses. Automate customer support, telecalling, and more with our multilingual AI solutions.",
    url: "https://voice.zenxai.io",
    type: "website",
  },

  icons: {
    icon: "/assets/logo1.png",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
      </head>
      <body className="font-sans antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}


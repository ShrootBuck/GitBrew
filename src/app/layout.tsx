import "~/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";

export const metadata: Metadata = {
  title: "GitBrew",
  description: "Commit. Grind. Caffeinate.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <head>
        <meta property="twitter:image" content="/twitter-image.png" />
        <meta property="og:image" content="/twitter-image.png" />
      </head>
      <body>{children}</body>
    </html>
  );
}

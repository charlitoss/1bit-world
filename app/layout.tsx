import type { Metadata } from "next";
import { Pixelify_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const pixel = Pixelify_Sans({
  variable: "--font-pixel",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const mono = DM_Mono({
  variable: "--font-mono-ui",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "1bit.world — dither anything",
  description:
    "Convert images into a 1-bit, dithered aesthetic right in your browser. Private, free, nothing uploaded.",
  openGraph: {
    title: "1bit.world",
    description: "Convert images into a 1-bit, dithered aesthetic.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${pixel.variable} ${mono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

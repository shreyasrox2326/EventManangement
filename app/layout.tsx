import type { Metadata } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import "@/styles/globals.css";
import { AppProviders } from "@/app/providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans"
});

const robotoMono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata: Metadata = {
  title: "EMTS",
  description: "Event Management and Ticketing System",
  icons: {
    icon: "/favicon.jpg",
    apple: "/favicon.jpg",
    shortcut: "/favicon.jpg"
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${inter.variable} ${robotoMono.variable}`}>
        <AppProviders>
          <div className="app-shell">{children}</div>
        </AppProviders>
      </body>
    </html>
  );
}

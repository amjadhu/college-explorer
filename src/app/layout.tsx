import type { Metadata } from "next";
import { DM_Sans, Space_Grotesk } from "next/font/google";
import Link from "next/link";
import "./globals.css";
import NavWorkspaceLink from "@/app/nav-workspace-link";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body"
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-heading"
});

export const metadata: Metadata = {
  title: "College Compass",
  description: "AI-powered college intelligence for families."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${spaceGrotesk.variable}`}>
      <body>
        <nav className="site-nav">
          <Link href="/" className="site-nav-brand">College Compass</Link>
          <NavWorkspaceLink />
        </nav>
        {children}
      </body>
    </html>
  );
}

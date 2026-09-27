import { Geist, Geist_Mono, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/convex-provider";
import { StationProvider } from "@/components/station-context";
import { LanguageProvider } from "@/components/language-context";
import { ThemeProvider, THEME_BOOT } from "@/components/theme-context";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
// Geist has no Devanagari glyphs; Hindi text falls through to this.
const devanagari = Noto_Sans_Devanagari({ variable: "--font-devanagari", subsets: ["devanagari"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "HIMSETU",
  description: "Edge-first logistics that plans around satellites and ice.",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" data-theme="ice" data-mode="dark" suppressHydrationWarning>
      <head>
        {/* Applies the saved palette before first paint, so there is no flash of the default theme. */}
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} ${devanagari.variable} antialiased`}>
        <ThemeProvider>
          <ConvexClientProvider>
            <LanguageProvider>
              <StationProvider>{children}</StationProvider>
            </LanguageProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

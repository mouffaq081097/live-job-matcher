import type { Metadata } from "next";
import { Suspense } from "react";
import { Inter, Merriweather, Open_Sans, Playfair_Display, Lato } from "next/font/google";
import { Toaster } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { ThemeProvider } from "@/components/theme/theme-provider";
import "./globals.css";
import { AuthSessionProvider } from "@/components/auth/session-provider";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const merriweather = Merriweather({
  variable: "--font-merriweather",
  subsets: ["latin"],
  weight: ["400", "700"],
});
const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });
const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Live Job Match — Executive Tech",
  description:
    "Mission control for your UAE job search: CV builder, ATS optimization, and interview prep.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${merriweather.variable} ${openSans.variable} ${playfair.variable} ${lato.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="h-full overflow-hidden bg-background">
        <ThemeProvider>
          <AuthSessionProvider>
            <Suspense fallback={null}>
              <AppShell>{children}</AppShell>
            </Suspense>
          </AuthSessionProvider>
        </ThemeProvider>
        <Toaster
          richColors
          position="bottom-right"
          toastOptions={{
            classNames: {
              toast: "border border-slate-200 bg-white text-slate-800 shadow-md dark:border-white/10 dark:bg-[#121826] dark:text-zinc-100 dark:shadow-xl",
            },
          }}
        />
      </body>
    </html>
  );
}

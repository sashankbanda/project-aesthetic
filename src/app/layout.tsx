import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/shell";
import AuthProvider from "@/components/auth-provider";
import { authEnabled } from "@/auth";
import { THEME_INIT_SCRIPT } from "@/lib/theme";

export const metadata: Metadata = {
  title: "Aesthetic",
  description: "Your personal fitness coach — training, nutrition, progress.",
  applicationName: "Aesthetic",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Aesthetic",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0a0a09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full">
        {/* applies the saved theme before first paint — no flash */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <AuthProvider enabled={authEnabled}>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}

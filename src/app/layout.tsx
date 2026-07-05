import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/shell";
import AuthProvider from "@/components/auth-provider";
import { authEnabled } from "@/auth";

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
  themeColor: "#08080c",
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
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full">
        <AuthProvider enabled={authEnabled}>
          <Shell>{children}</Shell>
        </AuthProvider>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { LanguageProvider } from "@/context/LanguageContext";
import { AuthProvider } from "@/context/AuthContext";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import MobileHeader from "@/components/MobileHeader";
import MobileNav from "@/components/MobileNav";
import Footer from "@/components/Footer";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "https://zemix.app");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "zemix — 유저를 만나고, 함께 만드는 사이드 프로젝트",
    template: "%s | zemix",
  },
  description:
    "zemix는 사이드 프로젝트를 런칭하고 초기 유저를 만나며, 피드백과 동료를 구해 함께 성장하는 메이커 커뮤니티 플랫폼입니다.",
  keywords: [
    "사이드프로젝트",
    "메이커",
    "zemix",
    "프로덕트런칭",
    "스타트업",
    "토이프로젝트",
    "피드백",
    "팀원모집",
  ],
  authors: [{ name: "zemix" }],
  creator: "zemix",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: "zemix — 유저를 만나고, 함께 만드는 사이드 프로젝트",
    description:
      "사이드 프로젝트 런칭, 초기 유저 확보, 피드백 및 팀원 구인을 한곳에서. zemix 메이커 플랫폼.",
    siteName: "zemix",
    images: [
      {
        url: "/icon.svg",
        width: 512,
        height: 512,
        alt: "zemix logo",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "zemix — 유저를 만나고, 함께 만드는 사이드 프로젝트",
    description:
      "사이드 프로젝트 런칭, 초기 유저 확보, 피드백 및 팀원 구인을 한곳에서. zemix 메이커 플랫폼.",
    images: ["/icon.svg"],
  },
  verification: {
    google: "X7GuELZ3QuhLEU_nkwkIedtsOA_0u22iClaGBMg2cKc",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <head>
        <meta name="google-site-verification" content="X7GuELZ3QuhLEU_nkwkIedtsOA_0u22iClaGBMg2cKc" />
        <link
          rel="stylesheet"
          as="style"
          crossOrigin="anonymous"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css"
        />
        <link rel="preconnect" href="https://rsms.me/" />
        <link rel="stylesheet" href="https://rsms.me/inter/inter.css" />
      </head>
      <body className="antialiased overflow-x-hidden min-h-screen flex flex-col bg-background text-foreground">
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <div className="flex min-h-screen flex-col">
                <Suspense fallback={<div className="h-16 border-b border-border bg-background" />}>
                  <Navbar />
                  <MobileHeader />
                </Suspense>
                <main className="flex-1 pb-16 md:pb-0">{children}</main>
                <Footer />
                <Suspense fallback={null}>
                  <MobileNav />
                </Suspense>
              </div>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

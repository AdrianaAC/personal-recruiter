import type { Metadata } from "next";
import { Shadows_Into_Light_Two } from "next/font/google";
import "./globals.css";
import { AuthSessionProvider } from "@/components/providers/session-provider";

const shadowsIntoLightTwo = Shadows_Into_Light_Two({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-shadows-into-light-two",
});

export const metadata: Metadata = {
  title: "Personal Recruiter",
  description: "Track your job search in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={shadowsIntoLightTwo.variable}>
      <body className={shadowsIntoLightTwo.className}>
        <AuthSessionProvider>{children}</AuthSessionProvider>
      </body>
    </html>
  );
}

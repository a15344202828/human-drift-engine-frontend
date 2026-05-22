import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";
import { CrispChat } from "@/components/CrispChat";
import { PostHogProvider } from "@/components/PostHogProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "Human Drift Engine",
  description:
    "Turn AI scripts into TikTok-native creator speech. V5 rewrites ads with hesitations, drift, low-energy delivery, and real human rhythm.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body>
        <PostHogProvider>
          <AuthProvider>
            {children}
            <CrispChat />
          </AuthProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}

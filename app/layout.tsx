import Header from "@/components/header";
import "./globals.css";
import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from "@/components/NextAuthProvider";

const exo2 = Exo_2({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "Flixe",
    description: "Flixe - Revolutionizing the Creator Economy",
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={exo2.className}>
                <NextAuthProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        <Header />
                        <div className='mt-[4.5rem]'>{children}</div>
                        <Toaster />
                    </ThemeProvider>
                </NextAuthProvider>
            </body>
        </html>
    );
}

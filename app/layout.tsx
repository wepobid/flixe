import Header from "@/components/header";
import "@/styles/globals.css";
import type { Metadata } from "next";
import { Exo_2 } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import NextAuthProvider from "@/components/NextAuthProvider";
import Providers from '@/components/Providers';

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
            <Providers>
                <NextAuthProvider>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                    >
                        <Header />
                        <div className='mt-[4.5rem] sm:max-w-[90%] min-[2300px]:max-w-[80%] m-auto'>{children}</div>
                        <div className="absolute inset-0 bg-dot-neutral-800 pointer-events-none select-none z-[-1]"></div>
                        <Toaster />
                    </ThemeProvider>
                </NextAuthProvider>
                </Providers>
            </body>
        </html>
    );
}

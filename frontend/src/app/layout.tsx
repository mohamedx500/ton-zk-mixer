import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: 'TON ZK-Mixer | Zero-Knowledge Privacy Protocol',
    description: 'Non-custodial, zero-knowledge privacy mixer on the TON Blockchain powered by Groth16 zk-SNARKs over BLS12-381.',
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${geistSans.variable} ${geistMono.variable} dark`}>
            <body className="antialiased min-h-screen bg-[#07090e] text-gray-100">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}

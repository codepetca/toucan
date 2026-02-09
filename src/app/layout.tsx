import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
	subsets: ["latin"],
	variable: "--font-dm-sans",
});

export const metadata: Metadata = {
	title: "Toucan — Flight Price Tracker",
	description: "Personal flight price tracking and alerts",
};

export default function RootLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<html lang="en" className={dmSans.variable}>
			<body className="min-h-screen bg-stone-50 font-[family-name:var(--font-dm-sans)] text-gray-900 antialiased">
				<main className="mx-auto max-w-3xl px-5 py-8">{children}</main>
			</body>
		</html>
	);
}

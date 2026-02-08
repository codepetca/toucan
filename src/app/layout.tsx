import type { Metadata } from "next";
import "./globals.css";

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
		<html lang="en">
			<body className="bg-gray-50 text-gray-900 antialiased">
				<main className="mx-auto max-w-4xl px-4 py-8">{children}</main>
			</body>
		</html>
	);
}

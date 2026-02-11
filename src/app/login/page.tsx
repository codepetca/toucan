"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
	const router = useRouter();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);

		try {
			const res = await fetch("/api/auth/login", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password }),
			});

			if (!res.ok) {
				const data = await res.json();
				setError(data.error || "Login failed");
				return;
			}

			router.push("/");
			router.refresh();
		} catch {
			setError("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div className="flex min-h-[80vh] items-center justify-center">
			<div className="absolute right-5 top-5">
				<ThemeToggle />
			</div>
			<div className="w-full max-w-sm">
				<div className="mb-8 text-center">
					<div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-toucan-600 text-2xl text-white shadow-md shadow-toucan-600/20 dark:bg-toucan-500">
						T
					</div>
					<h1 className="text-xl font-semibold tracking-tight">
						Sign in to Toucan
					</h1>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Track flight prices, get alerts
					</p>
				</div>
				<form onSubmit={handleSubmit} className="space-y-4">
					<div>
						<label
							htmlFor="email"
							className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Email
						</label>
						<input
							id="email"
							type="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							required
							className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500"
						/>
					</div>
					<div>
						<label
							htmlFor="password"
							className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
						>
							Password
						</label>
						<input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-500"
						/>
					</div>
					{error && (
						<div className="rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
							{error}
						</div>
					)}
					<button
						type="submit"
						disabled={loading}
						className="w-full rounded-lg bg-toucan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-toucan-700 hover:shadow-md disabled:opacity-50 dark:bg-toucan-500 dark:hover:bg-toucan-600"
					>
						{loading ? "Signing in..." : "Sign in"}
					</button>
				</form>
			</div>
		</div>
	);
}

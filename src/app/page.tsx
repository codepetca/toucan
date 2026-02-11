"use client";

import ThemeToggle from "@/components/ThemeToggle";
import { formatAirportValue } from "@/lib/airports";
import type { RecentSearch } from "@/lib/local-storage";
import { loadRecentSearches } from "@/lib/local-storage";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface PriceCheck {
	bestPrice: string;
	currency: string;
	airline: string;
	checkedAt: string;
	offerCount: number;
}

interface Route {
	id: string;
	origin: string;
	destination: string;
	outboundDate: string;
	returnDate: string | null;
	cabinClass: string;
	priceTarget: string | null;
	priceDropDelta: string | null;
	isActive: boolean;
	latestPriceCheck: PriceCheck | null;
}

function formatAirport(iata: string): string {
	return formatAirportValue(iata);
}

function formatCabin(cabin: string): string {
	return cabin
		.split("_")
		.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
		.join(" ");
}

function formatDate(dateStr: string): string {
	const d = new Date(`${dateStr}T00:00:00`);
	return d.toLocaleDateString("en-CA", {
		month: "short",
		day: "numeric",
		year: "numeric",
	});
}

export default function Dashboard() {
	const router = useRouter();
	const [routes, setRoutes] = useState<Route[]>([]);
	const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		async function fetchRoutes() {
			const res = await fetch("/api/routes");
			if (!res.ok) {
				router.push("/login");
				return;
			}
			const data = await res.json();
			setRoutes(data);
			setLoading(false);
		}
		fetchRoutes();
		setRecentSearches(loadRecentSearches());
	}, [router]);

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
		router.refresh();
	}

	if (loading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-toucan-600 border-t-transparent" />
			</div>
		);
	}

	return (
		<div>
			{/* Header */}
			<div className="mb-8 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-toucan-600 text-sm font-bold text-white shadow-sm dark:bg-toucan-500">
						T
					</div>
					<h1 className="text-lg font-semibold tracking-tight">Toucan</h1>
				</div>
				<div className="flex items-center gap-2">
					<Link
						href="/search"
						className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100"
					>
						Search
					</Link>
					<Link
						href="/routes/new"
						className="rounded-lg bg-toucan-600 px-3.5 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-toucan-700 hover:shadow-md dark:bg-toucan-500 dark:hover:bg-toucan-600"
					>
						+ Add route
					</Link>
					<ThemeToggle />
					<button
						type="button"
						onClick={handleLogout}
						className="rounded-lg px-3 py-2 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300"
					>
						Logout
					</button>
				</div>
			</div>

			{/* Routes */}
			{routes.length === 0 ? (
				<div className="rounded-2xl border border-dashed border-gray-200 px-8 py-16 text-center dark:border-gray-700">
					<div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-toucan-50 text-toucan-600 dark:bg-toucan-950 dark:text-toucan-400">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="24"
							height="24"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
						>
							<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
						</svg>
					</div>
					<p className="font-medium text-gray-900 dark:text-gray-100">
						No tracked routes yet
					</p>
					<p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
						Start tracking a route to monitor prices
					</p>
					<Link
						href="/routes/new"
						className="mt-4 inline-flex items-center rounded-lg bg-toucan-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-all hover:bg-toucan-700 hover:shadow-md dark:bg-toucan-500 dark:hover:bg-toucan-600"
					>
						Add your first route
					</Link>
				</div>
			) : (
				<div className="space-y-3">
					{routes.map((route) => (
						<RouteCard key={route.id} route={route} />
					))}
				</div>
			)}

			{/* Recent searches */}
			{recentSearches.length > 0 && (
				<div className="mt-8">
					<h2 className="mb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
						Recent searches
					</h2>
					<div className="space-y-2">
						{recentSearches.map((search) => {
							const params = new URLSearchParams({
								origin: search.origin,
								destination: search.destination,
								outboundDate: search.outboundDate,
								cabinClass: search.cabinClass,
							});
							if (search.returnDate)
								params.set("returnDate", search.returnDate);
							return (
								<Link
									key={`${search.origin}-${search.destination}-${search.outboundDate}-${search.returnDate ?? ""}`}
									href={`/search?${params.toString()}`}
									className="flex items-center justify-between rounded-lg border border-gray-100 bg-white px-4 py-3 text-sm transition-colors hover:border-gray-200 hover:bg-gray-50 dark:border-gray-800 dark:bg-gray-900 dark:hover:border-gray-700 dark:hover:bg-gray-800"
								>
									<div className="flex items-center gap-2">
										<span className="font-medium text-gray-900 dark:text-gray-100">
											{formatAirportValue(search.origin)}
										</span>
										<svg
											xmlns="http://www.w3.org/2000/svg"
											width="14"
											height="14"
											viewBox="0 0 24 24"
											fill="none"
											stroke="currentColor"
											strokeWidth="2"
											strokeLinecap="round"
											strokeLinejoin="round"
											className="text-gray-300 dark:text-gray-600"
										>
											<path d="M5 12h14" />
											<path d="m12 5 7 7-7 7" />
										</svg>
										<span className="font-medium text-gray-900 dark:text-gray-100">
											{formatAirportValue(search.destination)}
										</span>
										<span className="text-gray-400 dark:text-gray-500">
											{formatDate(search.outboundDate)}
											{search.returnDate &&
												` — ${formatDate(search.returnDate)}`}
										</span>
									</div>
									<div className="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
										{search.bestPrice != null && (
											<span className="font-medium text-gray-600 dark:text-gray-300">
												from ${search.bestPrice.toFixed(0)} {search.currency}
											</span>
										)}
										<span>
											{search.resultCount} offer
											{search.resultCount !== 1 ? "s" : ""}
										</span>
									</div>
								</Link>
							);
						})}
					</div>
				</div>
			)}
		</div>
	);
}

function RouteCard({ route }: { route: Route }) {
	const check = route.latestPriceCheck;

	return (
		<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-900">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					{/* Route */}
					<div className="flex items-center gap-2">
						<span className="font-semibold text-gray-900 dark:text-gray-100">
							{formatAirport(route.origin)}
						</span>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
							strokeLinecap="round"
							strokeLinejoin="round"
							className="shrink-0 text-gray-400 dark:text-gray-500"
						>
							<path d="M5 12h14" />
							<path d="m12 5 7 7-7 7" />
						</svg>
						<span className="font-semibold text-gray-900 dark:text-gray-100">
							{formatAirport(route.destination)}
						</span>
					</div>

					{/* Details */}
					<div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
						<span>{formatDate(route.outboundDate)}</span>
						{route.returnDate && (
							<>
								<span className="text-gray-300 dark:text-gray-600">—</span>
								<span>{formatDate(route.returnDate)}</span>
							</>
						)}
						{!route.returnDate && (
							<span className="text-gray-400 dark:text-gray-500">
								(one-way)
							</span>
						)}
						<span className="text-gray-200 dark:text-gray-700">|</span>
						<span>{formatCabin(route.cabinClass)}</span>
					</div>

					{/* Alert config */}
					<div className="mt-2 flex flex-wrap gap-2">
						{route.priceTarget && (
							<span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">
								Target: ${route.priceTarget}
							</span>
						)}
						{route.priceDropDelta && (
							<span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
								Drop alert: ${route.priceDropDelta}
							</span>
						)}
					</div>
				</div>

				{/* Price */}
				<div className="shrink-0 text-right">
					{check ? (
						<>
							<p className="text-2xl font-bold tabular-nums text-gray-900 dark:text-gray-100">
								${check.bestPrice}
								<span className="ml-1 text-xs font-normal text-gray-400 dark:text-gray-500">
									{check.currency}
								</span>
							</p>
							<p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
								{check.airline} · {check.offerCount} offer
								{check.offerCount !== 1 ? "s" : ""}
							</p>
							<p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
								{new Date(check.checkedAt).toLocaleString()}
							</p>
						</>
					) : (
						<p className="text-sm text-gray-400 dark:text-gray-500">
							No checks yet
						</p>
					)}
				</div>
			</div>
		</div>
	);
}

"use client";

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

export default function Dashboard() {
	const router = useRouter();
	const [routes, setRoutes] = useState<Route[]>([]);
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
	}, [router]);

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
		router.refresh();
	}

	if (loading) {
		return <p className="text-gray-500">Loading...</p>;
	}

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Toucan</h1>
				<div className="flex gap-3">
					<Link
						href="/search"
						className="rounded bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
					>
						Search flights
					</Link>
					<Link
						href="/routes/new"
						className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700"
					>
						Add route
					</Link>
					<button
						type="button"
						onClick={handleLogout}
						className="rounded bg-gray-200 px-3 py-1.5 text-sm hover:bg-gray-300"
					>
						Logout
					</button>
				</div>
			</div>

			{routes.length === 0 ? (
				<div className="rounded border border-dashed p-8 text-center text-gray-500">
					<p>No tracked routes yet.</p>
					<Link
						href="/routes/new"
						className="mt-2 inline-block text-blue-600 hover:underline"
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
		</div>
	);
}

function RouteCard({ route }: { route: Route }) {
	const check = route.latestPriceCheck;

	return (
		<div className="rounded border bg-white p-4 shadow-sm">
			<div className="flex items-start justify-between">
				<div>
					<p className="font-semibold">
						{route.origin} → {route.destination}
					</p>
					<p className="text-sm text-gray-500">
						{route.outboundDate}
						{route.returnDate ? ` – ${route.returnDate}` : " (one-way)"}
						{" · "}
						{route.cabinClass}
					</p>
					<p className="mt-1 text-xs text-gray-400">
						{route.priceTarget && `Target: $${route.priceTarget}`}
						{route.priceTarget && route.priceDropDelta && " · "}
						{route.priceDropDelta && `Drop alert: $${route.priceDropDelta}`}
					</p>
				</div>
				<div className="text-right">
					{check ? (
						<>
							<p className="text-lg font-bold">
								${check.bestPrice} {check.currency}
							</p>
							<p className="text-xs text-gray-500">
								{check.airline} · {check.offerCount} offers
							</p>
							<p className="text-xs text-gray-400">
								{new Date(check.checkedAt).toLocaleString()}
							</p>
						</>
					) : (
						<p className="text-sm text-gray-400">No checks yet</p>
					)}
				</div>
			</div>
		</div>
	);
}

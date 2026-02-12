"use client";

import AirportInput from "@/components/AirportInput";
import { formatAirportValue } from "@/lib/airports";
import { fetchRoutes } from "@/lib/core/fetch-routes";
import type { RecentSearch } from "@/lib/local-storage";
import { loadRecentSearches, saveRecentSearches } from "@/lib/local-storage";
import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

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

interface Segment {
	airline: string;
	flightNumber: string;
	departingAt: string;
	arrivingAt: string;
	origin: string;
	destination: string;
}

interface Offer {
	id: string;
	totalAmount: number;
	currency: string;
	airline: string;
	segments: Segment[];
	maxStops: number;
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

function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], {
		hour: "2-digit",
		minute: "2-digit",
	});
}

export default function Dashboard() {
	const router = useRouter();
	const [routes, setRoutes] = useState<Route[]>([]);
	const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	const [origin, setOrigin] = useState("");
	const [destination, setDestination] = useState("");
	const [outboundDate, setOutboundDate] = useState("");
	const [returnDate, setReturnDate] = useState("");
	const [cabinClass, setCabinClass] = useState("economy");

	const [offers, setOffers] = useState<Offer[]>([]);
	const [searchLoading, setSearchLoading] = useState(false);
	const [searchError, setSearchError] = useState("");
	const [searched, setSearched] = useState(false);
	const [showTrackForm, setShowTrackForm] = useState(false);
	const [priceTarget, setPriceTarget] = useState("");
	const [priceDropDelta, setPriceDropDelta] = useState("");
	const [tracking, setTracking] = useState(false);
	const [trackError, setTrackError] = useState("");

	useEffect(() => {
		async function loadRoutes() {
			const result = await fetchRoutes();
			if (result.error === "auth") {
				router.push("/login");
				return;
			}
			if (result.error === "network") {
				setError("Failed to load routes. Check your connection and refresh.");
				setLoading(false);
				return;
			}
			setRoutes(result.routes as Route[]);
			setLoading(false);
		}
		loadRoutes();
		setRecentSearches(loadRecentSearches());
	}, [router]);

	async function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		setSearchError("");
		setSearchLoading(true);
		setSearched(false);
		setShowTrackForm(false);
		setTrackError("");

		try {
			const res = await fetch("/api/search", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					origin: origin.toUpperCase(),
					destination: destination.toUpperCase(),
					outboundDate,
					returnDate: returnDate || undefined,
					cabinClass,
				}),
			});

			if (!res.ok) {
				const data = await res.json();
				setSearchError(data.error || "Search failed");
				return;
			}

			const data = await res.json();
			setOffers(data.offers);
			setSearched(true);

			const search: RecentSearch = {
				origin: origin.toUpperCase(),
				destination: destination.toUpperCase(),
				outboundDate,
				returnDate: returnDate || undefined,
				cabinClass,
				resultCount: data.offers.length,
				bestPrice:
					data.offers.length > 0
						? Math.min(...data.offers.map((o: Offer) => o.totalAmount))
						: undefined,
				currency: data.offers[0]?.currency,
				searchedAt: new Date().toISOString(),
			};
			const recent = loadRecentSearches();
			const deduped = recent.filter(
				(r) =>
					!(
						r.origin === search.origin &&
						r.destination === search.destination &&
						r.outboundDate === search.outboundDate &&
						r.returnDate === search.returnDate
					),
			);
			const updated = [search, ...deduped].slice(0, 5);
			saveRecentSearches(updated);
			setRecentSearches(updated);
		} catch {
			setSearchError("Something went wrong");
		} finally {
			setSearchLoading(false);
		}
	}

	async function handleTrack() {
		setTrackError("");
		setTracking(true);
		try {
			const res = await fetch("/api/routes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					origin: origin.toUpperCase(),
					destination: destination.toUpperCase(),
					outboundDate,
					returnDate: returnDate || undefined,
					cabinClass,
					priceTarget: priceTarget ? Number(priceTarget) : undefined,
					priceDropDelta: priceDropDelta ? Number(priceDropDelta) : undefined,
				}),
			});
			if (!res.ok) {
				const data = await res.json();
				setTrackError(data.error || "Failed to create route");
				return;
			}

			const result = await fetchRoutes();
			if (!result.error) {
				setRoutes(result.routes as Route[]);
			}

			setShowTrackForm(false);
			setPriceTarget("");
			setPriceDropDelta("");
			setTrackError("");
		} catch {
			setTrackError("Something went wrong");
		} finally {
			setTracking(false);
		}
	}

	function fillFromRecentSearch(search: RecentSearch) {
		setOrigin(search.origin);
		setDestination(search.destination);
		setOutboundDate(search.outboundDate);
		setReturnDate(search.returnDate ?? "");
		setCabinClass(search.cabinClass);
		setSearched(false);
		setOffers([]);
		setShowTrackForm(false);
	}

	async function handleLogout() {
		await fetch("/api/auth/logout", { method: "POST" });
		router.push("/login");
		router.refresh();
	}

	const sorted = [...offers].sort((a, b) => a.totalAmount - b.totalAmount);

	if (loading) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="h-6 w-6 animate-spin rounded-full border-2 border-toucan-600 border-t-transparent" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex min-h-[60vh] items-center justify-center">
				<div className="text-center">
					<p className="font-medium text-fg">{error}</p>
					<button
						type="button"
						onClick={() => window.location.reload()}
						className="mt-3 rounded-lg bg-toucan-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-toucan-700"
					>
						Retry
					</button>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<div className="flex h-9 w-9 items-center justify-center rounded-xl bg-toucan-600 text-sm font-bold text-white shadow-sm">
						T
					</div>
					<h1 className="text-lg font-semibold tracking-tight">Toucan</h1>
				</div>
				<button
					type="button"
					onClick={handleLogout}
					className="rounded-lg px-3 py-2 text-sm font-medium text-fg-subtle transition-colors hover:bg-surface-muted hover:text-fg-muted"
				>
					Logout
				</button>
			</div>

			<form
				onSubmit={handleSearch}
				className="mb-8 rounded-xl border border-border bg-surface p-5 shadow-sm"
			>
				<div className="grid grid-cols-2 gap-4">
					<AirportInput
						id="origin"
						label="From"
						value={origin}
						onChange={setOrigin}
						placeholder="City or airport code"
						required
					/>
					<AirportInput
						id="destination"
						label="To"
						value={destination}
						onChange={setDestination}
						placeholder="City or airport code"
						required
					/>
				</div>
				<div className="mt-4 grid grid-cols-3 gap-4">
					<div>
						<label
							htmlFor="outbound"
							className="mb-1.5 block text-sm font-medium text-fg-muted"
						>
							Depart
						</label>
						<input
							id="outbound"
							type="date"
							value={outboundDate}
							onChange={(e) => setOutboundDate(e.target.value)}
							required
							className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
						/>
					</div>
					<div>
						<label
							htmlFor="return"
							className="mb-1.5 block text-sm font-medium text-fg-muted"
						>
							Return <span className="text-fg-subtle">(optional)</span>
						</label>
						<input
							id="return"
							type="date"
							value={returnDate}
							onChange={(e) => setReturnDate(e.target.value)}
							className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
						/>
					</div>
					<div>
						<label
							htmlFor="cabin"
							className="mb-1.5 block text-sm font-medium text-fg-muted"
						>
							Cabin
						</label>
						<select
							id="cabin"
							value={cabinClass}
							onChange={(e) => setCabinClass(e.target.value)}
							className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
						>
							<option value="economy">Economy</option>
							<option value="premium_economy">Premium Economy</option>
							<option value="business">Business</option>
							<option value="first">First</option>
						</select>
					</div>
				</div>

				{searchError && (
					<div className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
						{searchError}
					</div>
				)}

				<button
					type="submit"
					disabled={searchLoading}
					className="mt-5 w-full rounded-lg bg-toucan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-toucan-700 hover:shadow-md disabled:opacity-50"
				>
					{searchLoading ? "Searching..." : "Search flights"}
				</button>
			</form>

			{searched && offers.length === 0 && (
				<div className="mb-8 rounded-xl border border-dashed border-border px-8 py-12 text-center">
					<p className="font-medium text-fg">No flights found</p>
					<p className="mt-1 text-sm text-fg-subtle">
						Try different dates or airports
					</p>
				</div>
			)}

			{searched && offers.length > 0 && (
				<div className="mb-8">
					{!showTrackForm ? (
						<button
							type="button"
							onClick={() => setShowTrackForm(true)}
							className="w-full rounded-xl border-2 border-dashed border-toucan-200 bg-toucan-50/50 px-4 py-3.5 text-sm font-medium text-toucan-700 transition-colors hover:border-toucan-300 hover:bg-toucan-50"
						>
							Track this route - get alerts when prices change
						</button>
					) : (
						<div className="rounded-xl border border-toucan-200 bg-surface p-5 shadow-sm">
							<div className="mb-4 flex items-center justify-between">
								<h3 className="font-semibold text-fg">Track this route</h3>
								<button
									type="button"
									onClick={() => {
										setShowTrackForm(false);
										setTrackError("");
									}}
									className="text-sm text-fg-subtle hover:text-fg-muted"
								>
									Cancel
								</button>
							</div>
							<div className="mb-4 rounded-lg bg-surface-muted px-3.5 py-2.5 text-sm text-fg-muted">
								<span className="font-medium text-fg">
									{formatAirportValue(origin.toUpperCase())}
								</span>
								{" -> "}
								<span className="font-medium text-fg">
									{formatAirportValue(destination.toUpperCase())}
								</span>
								<span className="mx-2 text-fg-subtle">|</span>
								{outboundDate}
								{returnDate && ` - ${returnDate}`}
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div>
									<label
										htmlFor="priceTarget"
										className="mb-1.5 block text-sm font-medium text-fg-muted"
									>
										Price target{" "}
										<span className="text-fg-subtle">(optional)</span>
									</label>
									<input
										id="priceTarget"
										type="number"
										min="1"
										step="1"
										value={priceTarget}
										onChange={(e) => setPriceTarget(e.target.value)}
										placeholder="e.g. 350"
										className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
									/>
								</div>
								<div>
									<label
										htmlFor="priceDropDelta"
										className="mb-1.5 block text-sm font-medium text-fg-muted"
									>
										Drop alert{" "}
										<span className="text-fg-subtle">(optional)</span>
									</label>
									<input
										id="priceDropDelta"
										type="number"
										min="1"
										step="1"
										value={priceDropDelta}
										onChange={(e) => setPriceDropDelta(e.target.value)}
										placeholder="e.g. 20"
										className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
									/>
								</div>
							</div>
							{trackError && (
								<div className="mt-3 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
									{trackError}
								</div>
							)}
							<button
								type="button"
								onClick={handleTrack}
								disabled={tracking}
								className="mt-4 w-full rounded-lg bg-toucan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-toucan-700 hover:shadow-md disabled:opacity-50"
							>
								{tracking ? "Saving..." : "Start tracking"}
							</button>
						</div>
					)}
				</div>
			)}

			{sorted.length > 0 && (
				<div className="mb-8">
					<p className="mb-3 text-sm font-medium text-fg-subtle">
						Found {sorted.length} offer{sorted.length !== 1 ? "s" : ""}
					</p>
					<div className="space-y-2">
						{sorted.slice(0, 5).map((offer, i) => (
							<div
								key={offer.id}
								className={`rounded-xl border bg-surface p-4 shadow-sm ${
									i === 0
										? "border-toucan-200 ring-1 ring-toucan-100"
										: "border-border"
								}`}
							>
								<div className="flex items-center justify-between gap-4">
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-2">
											<span className="font-semibold text-fg">
												{offer.airline}
											</span>
											{offer.maxStops === 0 ? (
												<span className="rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">
													Nonstop
												</span>
											) : (
												<span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-fg-subtle">
													{offer.maxStops} stop{offer.maxStops > 1 ? "s" : ""}
												</span>
											)}
										</div>
										<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-fg-subtle">
											{offer.segments.map((s) => (
												<span key={`${s.origin}-${s.destination}`}>
													{formatTime(s.departingAt)}{" "}
													{formatAirportValue(s.origin)} {"->"}{" "}
													{formatAirportValue(s.destination)}{" "}
													{formatTime(s.arrivingAt)}
												</span>
											))}
										</div>
									</div>
									<div className="shrink-0 text-right">
										<p className="text-xl font-bold tabular-nums text-fg">
											${offer.totalAmount.toFixed(2)}
										</p>
										<p className="text-xs text-fg-subtle">{offer.currency}</p>
									</div>
								</div>
							</div>
						))}
					</div>
				</div>
			)}

			<div className="mb-8">
				<h2 className="mb-3 text-sm font-medium text-fg-subtle">
					Tracked routes
				</h2>
				{routes.length === 0 ? (
					<div className="rounded-2xl border border-dashed border-border px-8 py-12 text-center">
						<p className="font-medium text-fg">No tracked routes yet</p>
						<p className="mt-1 text-sm text-fg-subtle">
							Search for flights above and start tracking a route
						</p>
					</div>
				) : (
					<div className="space-y-3">
						{routes.map((route) => (
							<RouteCard
								key={route.id}
								route={route}
								onCancel={(id) =>
									setRoutes((prev) => prev.filter((r) => r.id !== id))
								}
							/>
						))}
					</div>
				)}
			</div>

			{recentSearches.length > 0 && (
				<div>
					<h2 className="mb-3 text-sm font-medium text-fg-subtle">
						Recent searches
					</h2>
					<div className="space-y-2">
						{recentSearches.map((search) => (
							<button
								key={`${search.origin}-${search.destination}-${search.outboundDate}-${search.returnDate ?? ""}`}
								type="button"
								onClick={() => fillFromRecentSearch(search)}
								className="flex w-full items-center justify-between rounded-lg border border-border bg-surface px-4 py-3 text-left text-sm transition-colors hover:border-border hover:bg-surface-muted"
							>
								<div className="flex items-center gap-2">
									<span className="font-medium text-fg">
										{formatAirportValue(search.origin)}
									</span>
									<span className="text-fg-subtle">{"->"}</span>
									<span className="font-medium text-fg">
										{formatAirportValue(search.destination)}
									</span>
									<span className="text-fg-subtle">
										{formatDate(search.outboundDate)}
										{search.returnDate && ` - ${formatDate(search.returnDate)}`}
									</span>
								</div>
								<div className="flex items-center gap-3 text-xs text-fg-subtle">
									{search.bestPrice != null && (
										<span className="font-medium text-fg-muted">
											from ${search.bestPrice.toFixed(0)} {search.currency}
										</span>
									)}
									<span>
										{search.resultCount} offer
										{search.resultCount !== 1 ? "s" : ""}
									</span>
								</div>
							</button>
						))}
					</div>
				</div>
			)}
		</div>
	);
}

function RouteCard({
	route,
	onCancel,
}: { route: Route; onCancel: (id: string) => void }) {
	const check = route.latestPriceCheck;
	const [confirming, setConfirming] = useState(false);
	const confirmRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		if (!confirming) return;
		const timer = setTimeout(() => setConfirming(false), 3000);
		function handleClickOutside(e: MouseEvent) {
			if (
				confirmRef.current &&
				!confirmRef.current.contains(e.target as Node)
			) {
				setConfirming(false);
			}
		}
		document.addEventListener("mousedown", handleClickOutside);
		return () => {
			clearTimeout(timer);
			document.removeEventListener("mousedown", handleClickOutside);
		};
	}, [confirming]);

	async function handleCancel() {
		const res = await fetch(`/api/routes/${route.id}`, { method: "DELETE" });
		if (res.ok) {
			onCancel(route.id);
		}
	}

	return (
		<div className="rounded-xl border border-border bg-surface p-5 shadow-sm transition-shadow hover:shadow-md">
			<div className="flex items-start justify-between gap-4">
				<div className="min-w-0 flex-1">
					<div className="flex items-center gap-2">
						<span className="font-semibold text-fg">
							{formatAirport(route.origin)}
						</span>
						<span className="text-fg-subtle">{"->"}</span>
						<span className="font-semibold text-fg">
							{formatAirport(route.destination)}
						</span>
					</div>
					<div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-fg-subtle">
						<span>{formatDate(route.outboundDate)}</span>
						{route.returnDate && <span>- {formatDate(route.returnDate)}</span>}
						{!route.returnDate && (
							<span className="text-fg-subtle">(one-way)</span>
						)}
						<span className="text-fg-subtle">|</span>
						<span>{formatCabin(route.cabinClass)}</span>
					</div>
					<div className="mt-2 flex flex-wrap gap-2">
						{route.priceTarget && (
							<span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
								Target: ${route.priceTarget}
							</span>
						)}
						{route.priceDropDelta && (
							<span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
								Drop alert: ${route.priceDropDelta}
							</span>
						)}
						{!route.priceTarget && !route.priceDropDelta && (
							<span className="inline-flex items-center rounded-md bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-emerald-950/50 dark:text-emerald-300">
								Smart alerts
							</span>
						)}
					</div>
				</div>
				<div className="flex shrink-0 items-start gap-2">
					<div className="text-right">
						{check ? (
							<>
								<p className="text-2xl font-bold tabular-nums text-fg">
									${check.bestPrice}
									<span className="ml-1 text-xs font-normal text-fg-subtle">
										{check.currency}
									</span>
								</p>
								<p className="mt-0.5 text-xs text-fg-subtle">
									{check.airline} - {check.offerCount} offer
									{check.offerCount !== 1 ? "s" : ""}
								</p>
								<p className="mt-0.5 text-xs text-fg-subtle">
									{new Date(check.checkedAt).toLocaleString()}
								</p>
							</>
						) : (
							<p className="text-sm text-fg-subtle">No checks yet</p>
						)}
					</div>
					{confirming ? (
						<button
							ref={confirmRef}
							type="button"
							onClick={handleCancel}
							className="rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-red-700"
						>
							Cancel?
						</button>
					) : (
						<button
							type="button"
							onClick={() => setConfirming(true)}
							title="Stop tracking"
							className="rounded-md p-1 text-fg-subtle transition-colors hover:bg-red-50 hover:text-red-500"
						>
							<Trash2 size={16} />
						</button>
					)}
				</div>
			</div>
		</div>
	);
}

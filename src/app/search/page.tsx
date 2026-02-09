"use client";

import AirportInput from "@/components/AirportInput";
import { getAirport } from "@/lib/airports";
import Link from "next/link";
import { useState } from "react";

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
}

function formatTime(iso: string): string {
	return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatAirport(iata: string): string {
	const airport = getAirport(iata);
	return airport ? `${airport.city} (${iata})` : iata;
}

export default function SearchPage() {
	const [origin, setOrigin] = useState("");
	const [destination, setDestination] = useState("");
	const [outboundDate, setOutboundDate] = useState("");
	const [returnDate, setReturnDate] = useState("");
	const [cabinClass, setCabinClass] = useState("economy");
	const [offers, setOffers] = useState<Offer[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState("");
	const [searched, setSearched] = useState(false);

	async function handleSearch(e: React.FormEvent) {
		e.preventDefault();
		setError("");
		setLoading(true);
		setSearched(false);

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
				setError(data.error || "Search failed");
				return;
			}

			const data = await res.json();
			setOffers(data.offers);
			setSearched(true);
		} catch {
			setError("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-toucan-600 text-sm font-bold text-white shadow-sm">
						T
					</Link>
					<h1 className="text-lg font-semibold tracking-tight">Search Flights</h1>
				</div>
				<Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
					Dashboard
				</Link>
			</div>

			{/* Search form */}
			<form onSubmit={handleSearch} className="mb-8 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
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
						<label htmlFor="outbound" className="mb-1.5 block text-sm font-medium text-gray-700">
							Depart
						</label>
						<input
							id="outbound"
							type="date"
							value={outboundDate}
							onChange={(e) => setOutboundDate(e.target.value)}
							required
							className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
						/>
					</div>
					<div>
						<label htmlFor="return" className="mb-1.5 block text-sm font-medium text-gray-700">
							Return <span className="text-gray-400">(optional)</span>
						</label>
						<input
							id="return"
							type="date"
							value={returnDate}
							onChange={(e) => setReturnDate(e.target.value)}
							className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
						/>
					</div>
					<div>
						<label htmlFor="cabin" className="mb-1.5 block text-sm font-medium text-gray-700">
							Cabin
						</label>
						<select
							id="cabin"
							value={cabinClass}
							onChange={(e) => setCabinClass(e.target.value)}
							className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
						>
							<option value="economy">Economy</option>
							<option value="premium_economy">Premium Economy</option>
							<option value="business">Business</option>
							<option value="first">First</option>
						</select>
					</div>
				</div>

				{error && (
					<div className="mt-4 rounded-lg bg-red-50 px-3.5 py-2.5 text-sm text-red-700">
						{error}
					</div>
				)}

				<button
					type="submit"
					disabled={loading}
					className="mt-5 w-full rounded-lg bg-toucan-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-toucan-700 hover:shadow-md disabled:opacity-50"
				>
					{loading ? (
						<span className="inline-flex items-center gap-2">
							<span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
							Searching...
						</span>
					) : (
						"Search flights"
					)}
				</button>
			</form>

			{/* Results */}
			{searched && offers.length === 0 && (
				<div className="rounded-xl border border-dashed border-gray-200 px-8 py-12 text-center">
					<p className="font-medium text-gray-900">No flights found</p>
					<p className="mt-1 text-sm text-gray-500">Try different dates or airports</p>
				</div>
			)}

			{offers.length > 0 && (
				<div>
					<p className="mb-3 text-sm font-medium text-gray-500">
						{offers.length} offer{offers.length !== 1 && "s"} found
					</p>
					<div className="space-y-2">
						{offers
							.sort((a, b) => a.totalAmount - b.totalAmount)
							.map((offer, i) => (
								<div
									key={offer.id}
									className={`rounded-xl border bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${
										i === 0 ? "border-toucan-200 ring-1 ring-toucan-100" : "border-gray-200"
									}`}
								>
									<div className="flex items-center justify-between gap-4">
										<div className="min-w-0 flex-1">
											<div className="flex items-center gap-2">
												<span className="font-semibold text-gray-900">{offer.airline}</span>
												{offer.segments[0]?.flightNumber && (
													<span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs text-gray-500">
														{offer.segments[0].flightNumber}
													</span>
												)}
												{i === 0 && (
													<span className="rounded-full bg-toucan-50 px-2 py-0.5 text-xs font-medium text-toucan-700">
														Best price
													</span>
												)}
											</div>
											<div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500">
												{offer.segments.map((s) => (
													<span key={`${s.origin}-${s.destination}`} className="inline-flex items-center gap-1.5">
														<span className="font-medium text-gray-700">{formatTime(s.departingAt)}</span>
														<span>{formatAirport(s.origin)}</span>
														<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-300">
															<path d="M5 12h14"/>
															<path d="m12 5 7 7-7 7"/>
														</svg>
														<span>{formatAirport(s.destination)}</span>
														<span className="font-medium text-gray-700">{formatTime(s.arrivingAt)}</span>
													</span>
												))}
											</div>
										</div>
										<div className="shrink-0 text-right">
											<p className="text-xl font-bold tabular-nums text-gray-900">
												${offer.totalAmount.toFixed(2)}
											</p>
											<p className="text-xs text-gray-400">{offer.currency}</p>
										</div>
									</div>
								</div>
							))}
					</div>
				</div>
			)}
		</div>
	);
}

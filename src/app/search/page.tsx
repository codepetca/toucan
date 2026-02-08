"use client";

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
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Search Flights</h1>
				<Link href="/" className="text-sm text-blue-600 hover:underline">
					Back to dashboard
				</Link>
			</div>

			<form onSubmit={handleSearch} className="mb-6 space-y-4">
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label htmlFor="origin" className="mb-1 block text-sm font-medium">
							Origin (IATA)
						</label>
						<input
							id="origin"
							value={origin}
							onChange={(e) => setOrigin(e.target.value)}
							placeholder="YYZ"
							required
							maxLength={3}
							className="w-full rounded border px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label
							htmlFor="destination"
							className="mb-1 block text-sm font-medium"
						>
							Destination (IATA)
						</label>
						<input
							id="destination"
							value={destination}
							onChange={(e) => setDestination(e.target.value)}
							placeholder="YHZ"
							required
							maxLength={3}
							className="w-full rounded border px-3 py-2 uppercase focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="outbound"
							className="mb-1 block text-sm font-medium"
						>
							Outbound date
						</label>
						<input
							id="outbound"
							type="date"
							value={outboundDate}
							onChange={(e) => setOutboundDate(e.target.value)}
							required
							className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label htmlFor="return" className="mb-1 block text-sm font-medium">
							Return date (optional)
						</label>
						<input
							id="return"
							type="date"
							value={returnDate}
							onChange={(e) => setReturnDate(e.target.value)}
							className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>
				<div>
					<label htmlFor="cabin" className="mb-1 block text-sm font-medium">
						Cabin class
					</label>
					<select
						id="cabin"
						value={cabinClass}
						onChange={(e) => setCabinClass(e.target.value)}
						className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						<option value="economy">Economy</option>
						<option value="premium_economy">Premium Economy</option>
						<option value="business">Business</option>
						<option value="first">First</option>
					</select>
				</div>
				{error && <p className="text-sm text-red-600">{error}</p>}
				<button
					type="submit"
					disabled={loading}
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? "Searching..." : "Search"}
				</button>
			</form>

			{searched && offers.length === 0 && (
				<p className="text-gray-500">No offers found.</p>
			)}

			{offers.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm text-gray-500">
						{offers.length} offer{offers.length !== 1 && "s"} found
					</p>
					{offers
						.sort((a, b) => a.totalAmount - b.totalAmount)
						.map((offer) => (
							<div
								key={offer.id}
								className="rounded border bg-white p-3 shadow-sm"
							>
								<div className="flex items-center justify-between">
									<div>
										<p className="font-medium">
											{offer.airline}
											{offer.segments[0]?.flightNumber &&
												` · ${offer.segments[0].flightNumber}`}
										</p>
										<p className="text-sm text-gray-500">
											{offer.segments.map((s) => (
												<span key={`${s.origin}-${s.destination}`}>
													{s.origin} → {s.destination}{" "}
													{new Date(s.departingAt).toLocaleTimeString([], {
														hour: "2-digit",
														minute: "2-digit",
													})}
													{"  "}
												</span>
											))}
										</p>
									</div>
									<p className="text-lg font-bold">
										${offer.totalAmount} {offer.currency}
									</p>
								</div>
							</div>
						))}
				</div>
			)}
		</div>
	);
}

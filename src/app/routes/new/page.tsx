"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewRoutePage() {
	const router = useRouter();
	const [origin, setOrigin] = useState("");
	const [destination, setDestination] = useState("");
	const [outboundDate, setOutboundDate] = useState("");
	const [returnDate, setReturnDate] = useState("");
	const [cabinClass, setCabinClass] = useState("economy");
	const [priceTarget, setPriceTarget] = useState("");
	const [priceDropDelta, setPriceDropDelta] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError("");

		if (!priceTarget && !priceDropDelta) {
			setError("Set at least one of price target or price drop alert");
			return;
		}

		setLoading(true);

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
				setError(data.error || "Failed to create route");
				return;
			}

			router.push("/");
		} catch {
			setError("Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div>
			<div className="mb-6 flex items-center justify-between">
				<h1 className="text-2xl font-bold">Add Route</h1>
				<Link href="/" className="text-sm text-blue-600 hover:underline">
					Back to dashboard
				</Link>
			</div>

			<form onSubmit={handleSubmit} className="max-w-lg space-y-4">
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

				<div className="grid grid-cols-2 gap-4">
					<div>
						<label
							htmlFor="priceTarget"
							className="mb-1 block text-sm font-medium"
						>
							Price target ($)
						</label>
						<input
							id="priceTarget"
							type="number"
							min="0"
							step="0.01"
							value={priceTarget}
							onChange={(e) => setPriceTarget(e.target.value)}
							placeholder="200"
							className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
					<div>
						<label
							htmlFor="priceDropDelta"
							className="mb-1 block text-sm font-medium"
						>
							Price drop alert ($)
						</label>
						<input
							id="priceDropDelta"
							type="number"
							min="0"
							step="0.01"
							value={priceDropDelta}
							onChange={(e) => setPriceDropDelta(e.target.value)}
							placeholder="20"
							className="w-full rounded border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
						/>
					</div>
				</div>

				{error && <p className="text-sm text-red-600">{error}</p>}

				<button
					type="submit"
					disabled={loading}
					className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50"
				>
					{loading ? "Creating..." : "Add route"}
				</button>
			</form>
		</div>
	);
}

"use client";

import AirportInput from "@/components/AirportInput";
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
			{/* Header */}
			<div className="mb-6 flex items-center justify-between">
				<div className="flex items-center gap-3">
					<Link href="/" className="flex h-9 w-9 items-center justify-center rounded-xl bg-toucan-600 text-sm font-bold text-white shadow-sm">
						T
					</Link>
					<h1 className="text-lg font-semibold tracking-tight">Add Route</h1>
				</div>
				<Link href="/" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700">
					Dashboard
				</Link>
			</div>

			{/* Form */}
			<form onSubmit={handleSubmit} className="max-w-xl">
				<div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
					<h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Flight details</h2>
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
				</div>

				<div className="mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
					<h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-gray-400">Price alerts</h2>
					<p className="mb-4 text-sm text-gray-500">Set at least one alert condition</p>
					<div className="grid grid-cols-2 gap-4">
						<div>
							<label htmlFor="priceTarget" className="mb-1.5 block text-sm font-medium text-gray-700">
								Target price
							</label>
							<div className="relative">
								<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
								<input
									id="priceTarget"
									type="number"
									min="0"
									step="0.01"
									value={priceTarget}
									onChange={(e) => setPriceTarget(e.target.value)}
									placeholder="200"
									className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-7 pr-3.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
								/>
							</div>
							<p className="mt-1 text-xs text-gray-400">Alert when price drops to this</p>
						</div>
						<div>
							<label htmlFor="priceDropDelta" className="mb-1.5 block text-sm font-medium text-gray-700">
								Price drop amount
							</label>
							<div className="relative">
								<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-gray-400">$</span>
								<input
									id="priceDropDelta"
									type="number"
									min="0"
									step="0.01"
									value={priceDropDelta}
									onChange={(e) => setPriceDropDelta(e.target.value)}
									placeholder="20"
									className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-7 pr-3.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
								/>
							</div>
							<p className="mt-1 text-xs text-gray-400">Alert when price drops by this much</p>
						</div>
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
					{loading ? "Creating..." : "Start tracking this route"}
				</button>
			</form>
		</div>
	);
}

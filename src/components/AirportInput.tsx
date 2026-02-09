"use client";

import { type Airport, getAirport, searchAirports } from "@/lib/airports";
import { useCallback, useEffect, useRef, useState } from "react";

interface AirportInputProps {
	id: string;
	label: string;
	value: string;
	onChange: (iata: string) => void;
	placeholder?: string;
	required?: boolean;
}

export default function AirportInput({
	id,
	label,
	value,
	onChange,
	placeholder = "City or airport code",
	required = false,
}: AirportInputProps) {
	const [query, setQuery] = useState("");
	const [results, setResults] = useState<Airport[]>([]);
	const [open, setOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(-1);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Sync display text when value changes externally
	useEffect(() => {
		if (value) {
			const airport = getAirport(value);
			if (airport) {
				setQuery(`${airport.iata} — ${airport.city}`);
			} else {
				setQuery(value);
			}
		} else {
			setQuery("");
		}
	}, [value]);

	// Close dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const handleInput = useCallback(
		(text: string) => {
			setQuery(text);
			const matches = searchAirports(text);
			setResults(matches);
			setOpen(matches.length > 0);
			setHighlightIndex(-1);

			// If they typed an exact 3-letter code match, auto-select it
			if (text.trim().length === 3) {
				const exact = matches.find(
					(a) => a.iata.toLowerCase() === text.trim().toLowerCase()
				);
				if (exact && matches.length === 1) {
					selectAirport(exact);
					return;
				}
			}

			// Clear the selected value if they're editing
			if (value) {
				onChange("");
			}
		},
		[value, onChange]
	);

	const selectAirport = useCallback(
		(airport: Airport) => {
			onChange(airport.iata);
			setQuery(`${airport.iata} — ${airport.city}`);
			setOpen(false);
			setHighlightIndex(-1);
		},
		[onChange]
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!open) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" && highlightIndex >= 0) {
				e.preventDefault();
				selectAirport(results[highlightIndex]);
			} else if (e.key === "Escape") {
				setOpen(false);
			}
		},
		[open, highlightIndex, results, selectAirport]
	);

	const handleFocus = useCallback(() => {
		if (query && !value) {
			const matches = searchAirports(query);
			setResults(matches);
			setOpen(matches.length > 0);
		}
	}, [query, value]);

	const handleBlur = useCallback(() => {
		// If they typed something but didn't select, try to match
		setTimeout(() => {
			if (!value && query.trim()) {
				const matches = searchAirports(query.trim());
				if (matches.length === 1) {
					selectAirport(matches[0]);
				}
			}
		}, 200);
	}, [value, query, selectAirport]);

	return (
		<div ref={wrapperRef} className="relative">
			<label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
				{label}
			</label>
			<input
				ref={inputRef}
				id={id}
				type="text"
				value={query}
				onChange={(e) => handleInput(e.target.value)}
				onKeyDown={handleKeyDown}
				onFocus={handleFocus}
				onBlur={handleBlur}
				placeholder={placeholder}
				required={required}
				autoComplete="off"
				className="w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-sm transition-colors placeholder:text-gray-400 focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
			/>
			{/* Hidden input to carry the actual IATA value for form validation */}
			<input type="hidden" name={id} value={value} />

			{open && results.length > 0 && (
				<ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
					{results.map((airport, i) => (
						<li key={airport.iata}>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									selectAirport(airport);
								}}
								onMouseEnter={() => setHighlightIndex(i)}
								className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
									i === highlightIndex
										? "bg-teal-50 text-teal-900"
										: "text-gray-700 hover:bg-gray-50"
								}`}
							>
								<span className="shrink-0 rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-gray-600">
									{airport.iata}
								</span>
								<span className="truncate">
									{airport.city}
									<span className="ml-1 text-gray-400">
										— {airport.name}
									</span>
								</span>
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

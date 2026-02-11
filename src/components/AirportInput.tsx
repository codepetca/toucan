"use client";

import {
	CITY_GROUPS,
	type SearchResult,
	getAirport,
	resolveAirportCodes,
	searchAirports,
} from "@/lib/airports";
import { useCallback, useEffect, useRef, useState } from "react";

interface AirportInputProps {
	id: string;
	label: string;
	value: string; // single IATA or comma-separated (e.g. "YYZ,YTZ")
	onChange: (value: string) => void;
	placeholder?: string;
	required?: boolean;
}

function displayLabel(value: string): string {
	if (!value) return "";
	const codes = resolveAirportCodes(value);
	if (codes.length === 1) {
		const airport = getAirport(codes[0]);
		return airport ? `${airport.iata} — ${airport.city}` : codes[0];
	}
	const group = CITY_GROUPS.find(
		(g) =>
			g.codes.length === codes.length &&
			codes.every((c) => g.codes.includes(c)),
	);
	if (group) return `${group.city} — All airports (${group.codes.join(", ")})`;
	return codes.join(", ");
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
	const [results, setResults] = useState<SearchResult[]>([]);
	const [open, setOpen] = useState(false);
	const [highlightIndex, setHighlightIndex] = useState(-1);
	const wrapperRef = useRef<HTMLDivElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// Sync display text when value changes externally
	useEffect(() => {
		if (value) {
			setQuery(displayLabel(value));
		} else {
			setQuery("");
		}
	}, [value]);

	// Close dropdown on outside click
	useEffect(() => {
		function handleClick(e: MouseEvent) {
			if (
				wrapperRef.current &&
				!wrapperRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);

	const selectResult = useCallback(
		(result: SearchResult) => {
			if (result.type === "airport") {
				onChange(result.airport.iata);
			} else {
				onChange(result.group.codes.join(","));
			}
			setOpen(false);
			setHighlightIndex(-1);
		},
		[onChange],
	);

	const handleInput = useCallback(
		(text: string) => {
			setQuery(text);
			const matches = searchAirports(text);
			setResults(matches);
			setOpen(matches.length > 0);
			setHighlightIndex(-1);

			// If they typed an exact 3-letter code match with only one result, auto-select
			if (
				text.trim().length === 3 &&
				matches.length === 1 &&
				matches[0].type === "airport"
			) {
				const a = matches[0].airport;
				if (a.iata.toLowerCase() === text.trim().toLowerCase()) {
					selectResult(matches[0]);
					return;
				}
			}

			// Clear the selected value if they're editing
			if (value) {
				onChange("");
			}
		},
		[value, onChange, selectResult],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent) => {
			if (!open || results.length === 0) return;

			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
			} else if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightIndex((i) => Math.max(i - 1, 0));
			} else if (e.key === "Enter" || e.key === "Tab") {
				const idx = highlightIndex >= 0 ? highlightIndex : 0;
				e.preventDefault();
				selectResult(results[idx]);
			} else if (e.key === "Escape") {
				setOpen(false);
			}
		},
		[open, highlightIndex, results, selectResult],
	);

	const handleFocus = useCallback(() => {
		if (query && !value) {
			const matches = searchAirports(query);
			setResults(matches);
			setOpen(matches.length > 0);
		}
	}, [query, value]);

	const handleBlur = useCallback(() => {
		setTimeout(() => {
			if (!value && query.trim()) {
				const matches = searchAirports(query.trim());
				if (matches.length === 1) {
					selectResult(matches[0]);
				}
			}
		}, 200);
	}, [value, query, selectResult]);

	return (
		<div ref={wrapperRef} className="relative">
			<label
				htmlFor={id}
				className="mb-1.5 block text-sm font-medium text-fg-muted"
			>
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
				className="w-full rounded-lg border border-border bg-surface px-3.5 py-2.5 text-sm transition-colors placeholder:text-fg-subtle focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
			/>
			<input type="hidden" name={id} value={value} />

			{open && results.length > 0 && (
				<ul className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-border bg-surface py-1 shadow-lg">
					{results.map((result, i) => (
						<li
							key={
								result.type === "airport"
									? result.airport.iata
									: `city-${result.group.city}`
							}
						>
							<button
								type="button"
								onMouseDown={(e) => {
									e.preventDefault();
									selectResult(result);
								}}
								onMouseEnter={() => setHighlightIndex(i)}
								className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm transition-colors ${
									i === highlightIndex
										? "bg-teal-50 text-teal-900"
										: "text-fg-muted hover:bg-surface-muted"
								}`}
							>
								{result.type === "city" ? (
									<>
										<span className="shrink-0 rounded bg-toucan-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-toucan-700">
											{result.group.codes.join("+")}
										</span>
										<span className="truncate">
											{result.group.city}
											<span className="ml-1 text-fg-subtle">
												— All airports
											</span>
										</span>
									</>
								) : (
									<>
										<span className="shrink-0 rounded bg-surface-muted px-1.5 py-0.5 font-mono text-xs font-semibold text-fg-muted">
											{result.airport.iata}
										</span>
										<span className="truncate">
											{result.airport.city}
											<span className="ml-1 text-fg-subtle">
												— {result.airport.name}
											</span>
										</span>
									</>
								)}
							</button>
						</li>
					))}
				</ul>
			)}
		</div>
	);
}

"use client";

import type { FilterSettings } from "@/lib/local-storage";
import { loadFilterSettings, saveFilterSettings } from "@/lib/local-storage";
import { Settings2, SlidersHorizontal } from "lucide-react";
import { useEffect, useState } from "react";

export interface FilterValues {
	cabinClass: string;
	maxStops: number | null;
	selectedAirlines: string[];
	sortBy: "price" | "stops" | "departure";
	priceMin: string;
	priceMax: string;
}

export const DEFAULT_FILTERS: FilterValues = {
	cabinClass: "economy",
	maxStops: null,
	selectedAirlines: [],
	sortBy: "price",
	priceMin: "",
	priceMax: "",
};

const DEFAULT_SETTINGS: FilterSettings = {
	cabin: true,
	stops: true,
	airlines: true,
	sortBy: true,
	priceRange: false,
};

const SETTING_LABELS: Record<keyof FilterSettings, string> = {
	cabin: "Cabin",
	stops: "Stops",
	airlines: "Preferred airlines",
	sortBy: "Sort by",
	priceRange: "Price range",
};

const KNOWN_AIRLINES = ["Air Canada", "Porter Airlines", "WestJet", "Flair Airlines"];

interface FilterPanelProps {
	values: FilterValues;
	onChange: (values: FilterValues) => void;
	availableAirlines: string[];
}

export default function FilterPanel({
	values,
	onChange,
	availableAirlines,
}: FilterPanelProps) {
	const [settings, setSettings] = useState<FilterSettings>(DEFAULT_SETTINGS);
	const [showSettings, setShowSettings] = useState(false);

	useEffect(() => {
		const saved = loadFilterSettings();
		if (saved) setSettings(saved);
	}, []);

	function updateSettings(next: FilterSettings) {
		setSettings(next);
		saveFilterSettings(next);
	}

	function update(partial: Partial<FilterValues>) {
		onChange({ ...values, ...partial });
	}

	function handleClearFilters() {
		onChange({ ...DEFAULT_FILTERS });
	}

	const hasActiveFilters =
		values.cabinClass !== "economy" ||
		values.maxStops !== null ||
		values.selectedAirlines.length > 0 ||
		values.sortBy !== "price" ||
		values.priceMin !== "" ||
		values.priceMax !== "";

	const cabinOptions = [
		{ value: "economy", label: "Economy" },
		{ value: "premium_economy", label: "Premium" },
		{ value: "business", label: "Business" },
		{ value: "first", label: "First" },
	];

	const stopsOptions: { value: number | null; label: string }[] = [
		{ value: null, label: "Any" },
		{ value: 0, label: "Nonstop" },
		{ value: 1, label: "1 stop" },
		{ value: 2, label: "2 stops" },
	];

	const sortOptions = [
		{ value: "price" as const, label: "Price" },
		{ value: "stops" as const, label: "Stops" },
		{ value: "departure" as const, label: "Departure" },
	];

	return (
		<div className="rounded-xl border border-border bg-surface shadow-sm">
			{/* Header */}
			<div className="flex items-center justify-between border-b border-border px-4 py-3">
				<div className="flex items-center gap-2">
					<SlidersHorizontal size={15} className="text-fg-subtle" />
					<span className="text-sm font-semibold text-fg">Filters</span>
				</div>
				<div className="flex items-center gap-1">
					{hasActiveFilters && (
						<button
							type="button"
							onClick={handleClearFilters}
							className="rounded-md px-2 py-1 text-xs font-medium text-toucan-600 transition-colors hover:bg-toucan-50 hover:text-toucan-700 dark:hover:bg-toucan-950/30"
						>
							Clear
						</button>
					)}
					<button
						type="button"
						onClick={() => setShowSettings(!showSettings)}
						className={`rounded-md p-1.5 transition-colors ${
							showSettings
								? "bg-surface-muted text-fg-muted"
								: "text-fg-subtle hover:bg-surface-muted hover:text-fg-muted"
						}`}
						title="Configure visible filters"
					>
						<Settings2 size={14} />
					</button>
				</div>
			</div>

			{/* Settings panel */}
			{showSettings && (
				<div className="border-b border-border bg-surface-muted/50 px-4 py-3">
					<p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
						Show filters
					</p>
					<div className="space-y-1">
						{(Object.keys(DEFAULT_SETTINGS) as (keyof FilterSettings)[]).map(
							(key) => (
								<div
									key={key}
									className="flex items-center justify-between py-1.5"
								>
									<span className="text-sm text-fg-muted">
										{SETTING_LABELS[key]}
									</span>
									<button
										type="button"
										role="switch"
										aria-checked={settings[key]}
										aria-label={`Toggle ${SETTING_LABELS[key]} filter`}
										onClick={() =>
											updateSettings({ ...settings, [key]: !settings[key] })
										}
										className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
											settings[key] ? "bg-toucan-600" : "bg-border"
										}`}
									>
										<span
											className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform ${
												settings[key]
													? "translate-x-[18px]"
													: "translate-x-[3px]"
											}`}
										/>
									</button>
								</div>
							),
						)}
					</div>
				</div>
			)}

			{/* Filter sections */}
			<div className="space-y-5 p-4">
				{/* Cabin */}
				{settings.cabin && (
					<div>
						<p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
							Cabin
						</p>
						<div className="flex flex-wrap gap-1.5">
							{cabinOptions.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => update({ cabinClass: opt.value })}
									className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
										values.cabinClass === opt.value
											? "bg-toucan-600 text-white shadow-sm"
											: "bg-surface-muted text-fg-muted hover:bg-border hover:text-fg"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Stops */}
				{settings.stops && (
					<div>
						<p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
							Stops
						</p>
						<div className="flex flex-wrap gap-1.5">
							{stopsOptions.map((opt) => (
								<button
									key={String(opt.value)}
									type="button"
									onClick={() => update({ maxStops: opt.value })}
									className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
										values.maxStops === opt.value
											? "bg-toucan-600 text-white shadow-sm"
											: "bg-surface-muted text-fg-muted hover:bg-border hover:text-fg"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Preferred airlines */}
				{settings.airlines && (
					<div>
						<p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
							Preferred airlines
						</p>
						<div className="space-y-1">
							{[
								...KNOWN_AIRLINES,
								...availableAirlines.filter(
									(a) => !KNOWN_AIRLINES.includes(a),
								),
							].map((airline) => {
								const isChecked =
									values.selectedAirlines.includes(airline);
								const inResults =
									availableAirlines.length === 0 ||
									availableAirlines.includes(airline);
								return (
									<label
										key={airline}
										className="flex cursor-pointer items-center gap-2.5 rounded-md px-1 py-1.5 text-sm text-fg-muted transition-colors hover:text-fg"
									>
										<input
											type="checkbox"
											checked={isChecked}
											onChange={(e) => {
												if (e.target.checked) {
													update({
														selectedAirlines: [
															...values.selectedAirlines,
															airline,
														],
													});
												} else {
													update({
														selectedAirlines:
															values.selectedAirlines.filter(
																(a) => a !== airline,
															),
													});
												}
											}}
											className="h-3.5 w-3.5 rounded accent-teal-600"
										/>
										<span>{airline}</span>
										{availableAirlines.length > 0 && !inResults && (
											<span className="text-[10px] text-fg-subtle">
												no flights
											</span>
										)}
									</label>
								);
							})}
						</div>
					</div>
				)}

				{/* Sort by */}
				{settings.sortBy && (
					<div>
						<p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
							Sort by
						</p>
						<div className="flex flex-wrap gap-1.5">
							{sortOptions.map((opt) => (
								<button
									key={opt.value}
									type="button"
									onClick={() => update({ sortBy: opt.value })}
									className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
										values.sortBy === opt.value
											? "bg-toucan-600 text-white shadow-sm"
											: "bg-surface-muted text-fg-muted hover:bg-border hover:text-fg"
									}`}
								>
									{opt.label}
								</button>
							))}
						</div>
					</div>
				)}

				{/* Price range */}
				{settings.priceRange && (
					<div>
						<p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
							Price range
						</p>
						<div className="flex items-center gap-2">
							<input
								type="number"
								min="0"
								placeholder="Min"
								value={values.priceMin}
								onChange={(e) => update({ priceMin: e.target.value })}
								className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
							/>
							<span className="shrink-0 text-xs text-fg-subtle">to</span>
							<input
								type="number"
								min="0"
								placeholder="Max"
								value={values.priceMax}
								onChange={(e) => update({ priceMax: e.target.value })}
								className="w-full rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm transition-colors focus:border-toucan-500 focus:outline-none focus:ring-2 focus:ring-toucan-500/20"
							/>
						</div>
					</div>
				)}

				{/* Empty state when all filters hidden */}
				{!settings.cabin &&
					!settings.stops &&
					!settings.airlines &&
					!settings.sortBy &&
					!settings.priceRange && (
						<p className="py-2 text-center text-sm text-fg-subtle">
							No filters enabled. Click the gear icon to configure.
						</p>
					)}
			</div>
		</div>
	);
}

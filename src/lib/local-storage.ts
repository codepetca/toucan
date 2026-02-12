export interface RecentSearch {
	origin: string;
	destination: string;
	outboundDate: string;
	returnDate?: string;
	cabinClass: string;
	resultCount: number;
	bestPrice?: number;
	currency?: string;
	searchedAt: string;
}

export interface AdvancedOptions {
	maxStops: string;
	selectedAirlines: string[];
}

export interface FilterSettings {
	cabin: boolean;
	stops: boolean;
	airlines: boolean;
	sortBy: boolean;
	priceRange: boolean;
}

const RECENT_SEARCHES_KEY = "toucan_recent_searches";
const ADVANCED_OPTIONS_KEY = "toucan_advanced_options";
const FILTER_SETTINGS_KEY = "toucan_filter_settings";

export function loadRecentSearches(): RecentSearch[] {
	try {
		const raw = localStorage.getItem(RECENT_SEARCHES_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch {
		return [];
	}
}

export function saveRecentSearches(searches: RecentSearch[]): void {
	try {
		localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
	} catch {
		// localStorage full or unavailable
	}
}

export function loadAdvancedOptions(): AdvancedOptions | null {
	try {
		const raw = localStorage.getItem(ADVANCED_OPTIONS_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function saveAdvancedOptions(options: AdvancedOptions): void {
	try {
		localStorage.setItem(ADVANCED_OPTIONS_KEY, JSON.stringify(options));
	} catch {
		// localStorage full or unavailable
	}
}

export function loadFilterSettings(): FilterSettings | null {
	try {
		const raw = localStorage.getItem(FILTER_SETTINGS_KEY);
		return raw ? JSON.parse(raw) : null;
	} catch {
		return null;
	}
}

export function saveFilterSettings(settings: FilterSettings): void {
	try {
		localStorage.setItem(FILTER_SETTINGS_KEY, JSON.stringify(settings));
	} catch {
		// localStorage full or unavailable
	}
}

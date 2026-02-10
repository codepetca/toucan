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

const RECENT_SEARCHES_KEY = "toucan_recent_searches";
const ADVANCED_OPTIONS_KEY = "toucan_advanced_options";

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

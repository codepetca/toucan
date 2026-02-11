export interface Airport {
	iata: string;
	name: string;
	city: string;
	country: string;
}

export interface CityGroup {
	city: string;
	country: string;
	codes: string[];
}

export interface Airline {
	code: string;
	name: string;
}

// Common airlines for filtering (focused on Canadian routes)
export const AIRLINES: Airline[] = [
	{ code: "PD", name: "Porter Airlines" },
	{ code: "AC", name: "Air Canada" },
	{ code: "WS", name: "WestJet" },
	{ code: "TS", name: "Air Transat" },
	{ code: "F8", name: "Flair Airlines" },
	{ code: "AA", name: "American Airlines" },
	{ code: "UA", name: "United Airlines" },
	{ code: "DL", name: "Delta Air Lines" },
	{ code: "BA", name: "British Airways" },
	{ code: "LH", name: "Lufthansa" },
	{ code: "AF", name: "Air France" },
];

// Cities with multiple airports — shown as a single option in the autocomplete
export const CITY_GROUPS: CityGroup[] = [
	{ city: "Toronto", country: "CA", codes: ["YYZ", "YTZ"] },
	{ city: "New York", country: "US", codes: ["JFK", "LGA", "EWR"] },
	{ city: "London", country: "GB", codes: ["LHR", "LGW", "STN", "LTN"] },
	{ city: "Paris", country: "FR", codes: ["CDG", "ORY"] },
	{ city: "Chicago", country: "US", codes: ["ORD", "MDW"] },
	{ city: "Washington", country: "US", codes: ["IAD", "DCA"] },
	{ city: "Tokyo", country: "JP", codes: ["NRT", "HND"] },
	{ city: "Milan", country: "IT", codes: ["FCO", "MXP"] },
	{ city: "San Francisco Bay", country: "US", codes: ["SFO", "OAK", "SJC"] },
	{ city: "Miami/Fort Lauderdale", country: "US", codes: ["MIA", "FLL"] },
	{ city: "Houston", country: "US", codes: ["IAH"] },
];

// Major world airports — biased toward North America, Europe, and common long-haul destinations
export const AIRPORTS: Airport[] = [
	// Canada
	{ iata: "YYZ", name: "Toronto Pearson", city: "Toronto", country: "CA" },
	{
		iata: "YTZ",
		name: "Billy Bishop Toronto City",
		city: "Toronto",
		country: "CA",
	},
	{ iata: "YUL", name: "Montréal-Trudeau", city: "Montréal", country: "CA" },
	{
		iata: "YVR",
		name: "Vancouver International",
		city: "Vancouver",
		country: "CA",
	},
	{
		iata: "YOW",
		name: "Ottawa Macdonald-Cartier",
		city: "Ottawa",
		country: "CA",
	},
	{ iata: "YHZ", name: "Halifax Stanfield", city: "Halifax", country: "CA" },
	{
		iata: "YEG",
		name: "Edmonton International",
		city: "Edmonton",
		country: "CA",
	},
	{
		iata: "YYC",
		name: "Calgary International",
		city: "Calgary",
		country: "CA",
	},
	{
		iata: "YWG",
		name: "Winnipeg James Armstrong Richardson",
		city: "Winnipeg",
		country: "CA",
	},
	{
		iata: "YQB",
		name: "Québec City Jean Lesage",
		city: "Québec City",
		country: "CA",
	},
	{
		iata: "YXE",
		name: "Saskatoon John G. Diefenbaker",
		city: "Saskatoon",
		country: "CA",
	},
	{ iata: "YQR", name: "Regina International", city: "Regina", country: "CA" },
	{
		iata: "YYJ",
		name: "Victoria International",
		city: "Victoria",
		country: "CA",
	},
	{ iata: "YKF", name: "Region of Waterloo", city: "Kitchener", country: "CA" },
	{ iata: "YXU", name: "London International", city: "London", country: "CA" },
	{
		iata: "YQM",
		name: "Greater Moncton Roméo LeBlanc",
		city: "Moncton",
		country: "CA",
	},
	{
		iata: "YFC",
		name: "Fredericton International",
		city: "Fredericton",
		country: "CA",
	},
	{ iata: "YSJ", name: "Saint John", city: "Saint John", country: "CA" },
	{
		iata: "YYT",
		name: "St. John's International",
		city: "St. John's",
		country: "CA",
	},
	{
		iata: "YQT",
		name: "Thunder Bay International",
		city: "Thunder Bay",
		country: "CA",
	},
	{ iata: "YXS", name: "Prince George", city: "Prince George", country: "CA" },
	{
		iata: "YLW",
		name: "Kelowna International",
		city: "Kelowna",
		country: "CA",
	},
	{ iata: "YZF", name: "Yellowknife", city: "Yellowknife", country: "CA" },
	{
		iata: "YXY",
		name: "Erik Nielsen Whitehorse",
		city: "Whitehorse",
		country: "CA",
	},

	// United States — Major hubs
	{
		iata: "JFK",
		name: "John F. Kennedy International",
		city: "New York",
		country: "US",
	},
	{ iata: "LGA", name: "LaGuardia", city: "New York", country: "US" },
	{
		iata: "EWR",
		name: "Newark Liberty International",
		city: "Newark",
		country: "US",
	},
	{
		iata: "LAX",
		name: "Los Angeles International",
		city: "Los Angeles",
		country: "US",
	},
	{ iata: "ORD", name: "O'Hare International", city: "Chicago", country: "US" },
	{ iata: "MDW", name: "Midway International", city: "Chicago", country: "US" },
	{
		iata: "ATL",
		name: "Hartsfield-Jackson Atlanta",
		city: "Atlanta",
		country: "US",
	},
	{
		iata: "DFW",
		name: "Dallas/Fort Worth International",
		city: "Dallas",
		country: "US",
	},
	{ iata: "DEN", name: "Denver International", city: "Denver", country: "US" },
	{
		iata: "SFO",
		name: "San Francisco International",
		city: "San Francisco",
		country: "US",
	},
	{
		iata: "SEA",
		name: "Seattle-Tacoma International",
		city: "Seattle",
		country: "US",
	},
	{ iata: "MIA", name: "Miami International", city: "Miami", country: "US" },
	{
		iata: "FLL",
		name: "Fort Lauderdale-Hollywood",
		city: "Fort Lauderdale",
		country: "US",
	},
	{ iata: "BOS", name: "Logan International", city: "Boston", country: "US" },
	{ iata: "IAD", name: "Washington Dulles", city: "Washington", country: "US" },
	{
		iata: "DCA",
		name: "Ronald Reagan Washington National",
		city: "Washington",
		country: "US",
	},
	{
		iata: "PHL",
		name: "Philadelphia International",
		city: "Philadelphia",
		country: "US",
	},
	{
		iata: "MSP",
		name: "Minneapolis-Saint Paul",
		city: "Minneapolis",
		country: "US",
	},
	{
		iata: "DTW",
		name: "Detroit Metropolitan Wayne County",
		city: "Detroit",
		country: "US",
	},
	{
		iata: "CLT",
		name: "Charlotte Douglas International",
		city: "Charlotte",
		country: "US",
	},
	{
		iata: "MCO",
		name: "Orlando International",
		city: "Orlando",
		country: "US",
	},
	{ iata: "TPA", name: "Tampa International", city: "Tampa", country: "US" },
	{
		iata: "IAH",
		name: "George Bush Intercontinental",
		city: "Houston",
		country: "US",
	},
	{ iata: "PHX", name: "Phoenix Sky Harbor", city: "Phoenix", country: "US" },
	{
		iata: "SAN",
		name: "San Diego International",
		city: "San Diego",
		country: "US",
	},
	{
		iata: "SLC",
		name: "Salt Lake City International",
		city: "Salt Lake City",
		country: "US",
	},
	{
		iata: "PDX",
		name: "Portland International",
		city: "Portland",
		country: "US",
	},
	{
		iata: "BNA",
		name: "Nashville International",
		city: "Nashville",
		country: "US",
	},
	{
		iata: "AUS",
		name: "Austin-Bergstrom International",
		city: "Austin",
		country: "US",
	},
	{
		iata: "HNL",
		name: "Daniel K. Inouye International",
		city: "Honolulu",
		country: "US",
	},
	{ iata: "OGG", name: "Kahului", city: "Maui", country: "US" },
	{
		iata: "ANC",
		name: "Ted Stevens Anchorage",
		city: "Anchorage",
		country: "US",
	},
	{
		iata: "BUF",
		name: "Buffalo Niagara International",
		city: "Buffalo",
		country: "US",
	},
	{
		iata: "PIT",
		name: "Pittsburgh International",
		city: "Pittsburgh",
		country: "US",
	},
	{
		iata: "RDU",
		name: "Raleigh-Durham International",
		city: "Raleigh",
		country: "US",
	},
	{
		iata: "STL",
		name: "St. Louis Lambert International",
		city: "St. Louis",
		country: "US",
	},
	{
		iata: "MCI",
		name: "Kansas City International",
		city: "Kansas City",
		country: "US",
	},
	{
		iata: "IND",
		name: "Indianapolis International",
		city: "Indianapolis",
		country: "US",
	},
	{
		iata: "CLE",
		name: "Cleveland Hopkins International",
		city: "Cleveland",
		country: "US",
	},
	{
		iata: "CMH",
		name: "John Glenn Columbus International",
		city: "Columbus",
		country: "US",
	},
	{
		iata: "SJC",
		name: "San José Mineta International",
		city: "San José",
		country: "US",
	},
	{
		iata: "OAK",
		name: "Oakland International",
		city: "Oakland",
		country: "US",
	},
	{
		iata: "LAS",
		name: "Harry Reid International",
		city: "Las Vegas",
		country: "US",
	},

	// United Kingdom
	{ iata: "LHR", name: "Heathrow", city: "London", country: "GB" },
	{ iata: "LGW", name: "Gatwick", city: "London", country: "GB" },
	{ iata: "STN", name: "Stansted", city: "London", country: "GB" },
	{ iata: "LTN", name: "Luton", city: "London", country: "GB" },
	{ iata: "MAN", name: "Manchester", city: "Manchester", country: "GB" },
	{ iata: "EDI", name: "Edinburgh", city: "Edinburgh", country: "GB" },
	{ iata: "BHX", name: "Birmingham", city: "Birmingham", country: "GB" },
	{ iata: "GLA", name: "Glasgow", city: "Glasgow", country: "GB" },
	{ iata: "BRS", name: "Bristol", city: "Bristol", country: "GB" },

	// Europe
	{ iata: "CDG", name: "Charles de Gaulle", city: "Paris", country: "FR" },
	{ iata: "ORY", name: "Orly", city: "Paris", country: "FR" },
	{ iata: "AMS", name: "Schiphol", city: "Amsterdam", country: "NL" },
	{ iata: "FRA", name: "Frankfurt am Main", city: "Frankfurt", country: "DE" },
	{ iata: "MUC", name: "Munich", city: "Munich", country: "DE" },
	{ iata: "BER", name: "Berlin Brandenburg", city: "Berlin", country: "DE" },
	{
		iata: "MAD",
		name: "Adolfo Suárez Madrid-Barajas",
		city: "Madrid",
		country: "ES",
	},
	{
		iata: "BCN",
		name: "Josep Tarradellas Barcelona-El Prat",
		city: "Barcelona",
		country: "ES",
	},
	{
		iata: "FCO",
		name: "Leonardo da Vinci-Fiumicino",
		city: "Rome",
		country: "IT",
	},
	{ iata: "MXP", name: "Milan Malpensa", city: "Milan", country: "IT" },
	{ iata: "LIS", name: "Humberto Delgado", city: "Lisbon", country: "PT" },
	{ iata: "OPO", name: "Francisco Sá Carneiro", city: "Porto", country: "PT" },
	{ iata: "ZRH", name: "Zürich", city: "Zürich", country: "CH" },
	{ iata: "GVA", name: "Geneva", city: "Geneva", country: "CH" },
	{ iata: "VIE", name: "Vienna International", city: "Vienna", country: "AT" },
	{ iata: "BRU", name: "Brussels", city: "Brussels", country: "BE" },
	{ iata: "CPH", name: "Copenhagen", city: "Copenhagen", country: "DK" },
	{ iata: "OSL", name: "Oslo Gardermoen", city: "Oslo", country: "NO" },
	{ iata: "ARN", name: "Stockholm Arlanda", city: "Stockholm", country: "SE" },
	{ iata: "HEL", name: "Helsinki-Vantaa", city: "Helsinki", country: "FI" },
	{ iata: "DUB", name: "Dublin", city: "Dublin", country: "IE" },
	{ iata: "ATH", name: "Eleftherios Venizelos", city: "Athens", country: "GR" },
	{ iata: "IST", name: "Istanbul", city: "Istanbul", country: "TR" },
	{ iata: "WAW", name: "Warsaw Chopin", city: "Warsaw", country: "PL" },
	{ iata: "PRG", name: "Václav Havel", city: "Prague", country: "CZ" },
	{
		iata: "BUD",
		name: "Budapest Ferenc Liszt",
		city: "Budapest",
		country: "HU",
	},
	{
		iata: "KEF",
		name: "Keflavík International",
		city: "Reykjavík",
		country: "IS",
	},

	// Caribbean & Mexico
	{ iata: "CUN", name: "Cancún International", city: "Cancún", country: "MX" },
	{
		iata: "MEX",
		name: "Mexico City International",
		city: "Mexico City",
		country: "MX",
	},
	{
		iata: "SJD",
		name: "Los Cabos International",
		city: "San José del Cabo",
		country: "MX",
	},
	{
		iata: "PVR",
		name: "Gustavo Díaz Ordaz International",
		city: "Puerto Vallarta",
		country: "MX",
	},
	{
		iata: "MBJ",
		name: "Sangster International",
		city: "Montego Bay",
		country: "JM",
	},
	{
		iata: "NAS",
		name: "Lynden Pindling International",
		city: "Nassau",
		country: "BS",
	},
	{
		iata: "PUJ",
		name: "Punta Cana International",
		city: "Punta Cana",
		country: "DO",
	},
	{
		iata: "SJU",
		name: "Luis Muñoz Marín International",
		city: "San Juan",
		country: "PR",
	},
	{
		iata: "AUA",
		name: "Queen Beatrix International",
		city: "Oranjestad",
		country: "AW",
	},
	{
		iata: "BGI",
		name: "Grantley Adams International",
		city: "Bridgetown",
		country: "BB",
	},

	// Asia-Pacific
	{ iata: "NRT", name: "Narita International", city: "Tokyo", country: "JP" },
	{ iata: "HND", name: "Haneda", city: "Tokyo", country: "JP" },
	{ iata: "ICN", name: "Incheon International", city: "Seoul", country: "KR" },
	{
		iata: "HKG",
		name: "Hong Kong International",
		city: "Hong Kong",
		country: "HK",
	},
	{ iata: "SIN", name: "Changi", city: "Singapore", country: "SG" },
	{ iata: "BKK", name: "Suvarnabhumi", city: "Bangkok", country: "TH" },
	{ iata: "SYD", name: "Kingsford Smith", city: "Sydney", country: "AU" },
	{
		iata: "MEL",
		name: "Melbourne Tullamarine",
		city: "Melbourne",
		country: "AU",
	},
	{ iata: "AKL", name: "Auckland", city: "Auckland", country: "NZ" },
	{
		iata: "DEL",
		name: "Indira Gandhi International",
		city: "Delhi",
		country: "IN",
	},
	{
		iata: "BOM",
		name: "Chhatrapati Shivaji Maharaj",
		city: "Mumbai",
		country: "IN",
	},
	{
		iata: "PEK",
		name: "Beijing Capital International",
		city: "Beijing",
		country: "CN",
	},
	{
		iata: "PVG",
		name: "Shanghai Pudong International",
		city: "Shanghai",
		country: "CN",
	},
	{
		iata: "TPE",
		name: "Taiwan Taoyuan International",
		city: "Taipei",
		country: "TW",
	},
	{
		iata: "MNL",
		name: "Ninoy Aquino International",
		city: "Manila",
		country: "PH",
	},
	{
		iata: "KUL",
		name: "Kuala Lumpur International",
		city: "Kuala Lumpur",
		country: "MY",
	},
	{
		iata: "CGK",
		name: "Soekarno-Hatta International",
		city: "Jakarta",
		country: "ID",
	},
	{
		iata: "DPS",
		name: "Ngurah Rai International",
		city: "Bali",
		country: "ID",
	},

	// Middle East
	{ iata: "DXB", name: "Dubai International", city: "Dubai", country: "AE" },
	{
		iata: "AUH",
		name: "Abu Dhabi International",
		city: "Abu Dhabi",
		country: "AE",
	},
	{ iata: "DOH", name: "Hamad International", city: "Doha", country: "QA" },
	{ iata: "TLV", name: "Ben Gurion", city: "Tel Aviv", country: "IL" },

	// South America
	{
		iata: "GRU",
		name: "São Paulo-Guarulhos",
		city: "São Paulo",
		country: "BR",
	},
	{
		iata: "GIG",
		name: "Rio de Janeiro-Galeão",
		city: "Rio de Janeiro",
		country: "BR",
	},
	{
		iata: "EZE",
		name: "Ministro Pistarini",
		city: "Buenos Aires",
		country: "AR",
	},
	{
		iata: "SCL",
		name: "Arturo Merino Benítez",
		city: "Santiago",
		country: "CL",
	},
	{
		iata: "BOG",
		name: "El Dorado International",
		city: "Bogotá",
		country: "CO",
	},
	{
		iata: "LIM",
		name: "Jorge Chávez International",
		city: "Lima",
		country: "PE",
	},

	// Africa
	{
		iata: "JNB",
		name: "O.R. Tambo International",
		city: "Johannesburg",
		country: "ZA",
	},
	{
		iata: "CPT",
		name: "Cape Town International",
		city: "Cape Town",
		country: "ZA",
	},
	{ iata: "CAI", name: "Cairo International", city: "Cairo", country: "EG" },
	{
		iata: "CMN",
		name: "Mohammed V International",
		city: "Casablanca",
		country: "MA",
	},
	{
		iata: "ADD",
		name: "Bole International",
		city: "Addis Ababa",
		country: "ET",
	},
	{
		iata: "NBO",
		name: "Jomo Kenyatta International",
		city: "Nairobi",
		country: "KE",
	},
];

const normalize = (s: string) =>
	s
		.toLowerCase()
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "");

export type SearchResult =
	| { type: "airport"; airport: Airport }
	| { type: "city"; group: CityGroup };

export function searchAirports(query: string, limit = 8): SearchResult[] {
	const q = normalize(query.trim());
	if (!q) return [];

	const results: SearchResult[] = [];

	// City groups that match (show before individual airports)
	const cityMatches = CITY_GROUPS.filter(
		(g) =>
			normalize(g.city).includes(q) ||
			g.codes.some((c) => c.toLowerCase().startsWith(q)),
	);
	for (const group of cityMatches) {
		results.push({ type: "city", group });
	}

	// Exact IATA match
	const exactIata = AIRPORTS.filter((a) => a.iata.toLowerCase() === q);
	for (const a of exactIata) results.push({ type: "airport", airport: a });

	// Prefix matches on IATA (skip those already in city groups)
	const cityIatas = new Set(cityMatches.flatMap((g) => g.codes));
	const iataPrefix = AIRPORTS.filter(
		(a) =>
			a.iata.toLowerCase().startsWith(q) &&
			a.iata.toLowerCase() !== q &&
			!cityIatas.has(a.iata),
	);
	for (const a of iataPrefix) results.push({ type: "airport", airport: a });

	// Name matches (skip exact IATA and those in city groups)
	const seenIatas = new Set([
		...cityIatas,
		...exactIata.map((a) => a.iata),
		...iataPrefix.map((a) => a.iata),
	]);
	const nameMatches = AIRPORTS.filter(
		(a) =>
			!seenIatas.has(a.iata) &&
			(normalize(a.city).includes(q) || normalize(a.name).includes(q)),
	);
	for (const a of nameMatches) results.push({ type: "airport", airport: a });

	return results.slice(0, limit);
}

export function getAirport(iata: string): Airport | undefined {
	return AIRPORTS.find((a) => a.iata === iata.toUpperCase());
}

/** Resolve a value (single IATA or comma-separated) to an array of IATA codes */
export function resolveAirportCodes(value: string): string[] {
	if (!value) return [];
	return value
		.split(",")
		.map((s) => s.trim().toUpperCase())
		.filter(Boolean);
}

/** Get display label for an airport value (handles both single and multi) */
export function formatAirportValue(value: string): string {
	const codes = resolveAirportCodes(value);
	if (codes.length === 0) return "";
	if (codes.length === 1) {
		const airport = getAirport(codes[0]);
		return airport ? `${airport.city} (${airport.iata})` : codes[0];
	}
	// Multi-airport — find the city group
	const group = CITY_GROUPS.find(
		(g) =>
			g.codes.length === codes.length &&
			codes.every((c) => g.codes.includes(c)),
	);
	if (group) return `${group.city} (${group.codes.join(", ")})`;
	return codes.join(", ");
}

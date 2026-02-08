export interface SearchInput {
	origin: string; // IATA code, e.g. "YYZ"
	destination: string; // IATA code, e.g. "YHZ"
	outboundDate: string; // YYYY-MM-DD
	returnDate?: string; // YYYY-MM-DD, optional for one-way
	cabinClass: "economy" | "premium_economy" | "business" | "first";
	passengers?: number;
}

export interface FlightSegment {
	airline: string;
	flightNumber: string;
	departingAt: string; // ISO 8601
	arrivingAt: string; // ISO 8601
	origin: string;
	destination: string;
	duration?: string; // ISO 8601 duration
}

export interface FlightOffer {
	id: string;
	totalAmount: number;
	currency: string;
	airline: string; // operating carrier of first segment
	segments: FlightSegment[];
}

export interface FlightSearchProvider {
	searchOffers(input: SearchInput): Promise<FlightOffer[]>;
}

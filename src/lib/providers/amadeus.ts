import type {
	FlightOffer,
	FlightSearchProvider,
	FlightSegment,
	SearchInput,
} from "./types";

export type AmadeusEnvironment = "test" | "production";

interface AmadeusProviderConfig {
	clientId: string;
	clientSecret: string;
	environment?: AmadeusEnvironment;
}

interface CachedToken {
	value: string;
	expiresAt: number;
}

interface AmadeusTokenResponse {
	access_token: string;
	expires_in: number;
}

interface AmadeusFlightOfferResponse {
	data?: AmadeusOffer[];
}

interface AmadeusOffer {
	id?: string;
	price?: {
		grandTotal?: string;
		total?: string;
		currency?: string;
	};
	itineraries?: Array<{
		segments?: Array<{
			carrierCode?: string;
			number?: string;
			departure?: {
				iataCode?: string;
				at?: string;
			};
			arrival?: {
				iataCode?: string;
				at?: string;
			};
			duration?: string;
			operating?: {
				carrierCode?: string;
			};
		}>;
	}>;
}

function mapCabinClass(cabinClass: SearchInput["cabinClass"]): string {
	switch (cabinClass) {
		case "economy":
			return "ECONOMY";
		case "premium_economy":
			return "PREMIUM_ECONOMY";
		case "business":
			return "BUSINESS";
		case "first":
			return "FIRST";
		default:
			return "ECONOMY";
	}
}

export class AmadeusProvider implements FlightSearchProvider {
	private cachedToken: CachedToken | null = null;

	constructor(
		private readonly config: AmadeusProviderConfig,
		private readonly fetchImpl: typeof fetch = fetch,
	) {}

	private get baseUrl(): string {
		return this.config.environment === "production"
			? "https://api.amadeus.com"
			: "https://test.api.amadeus.com";
	}

	private async getAccessToken(): Promise<string> {
		const now = Date.now();
		if (this.cachedToken && now < this.cachedToken.expiresAt - 60_000) {
			return this.cachedToken.value;
		}

		const body = new URLSearchParams({
			grant_type: "client_credentials",
			client_id: this.config.clientId,
			client_secret: this.config.clientSecret,
		});

		const res = await this.fetchImpl(
			`${this.baseUrl}/v1/security/oauth2/token`,
			{
				method: "POST",
				headers: {
					"Content-Type": "application/x-www-form-urlencoded",
				},
				body,
			},
		);

		if (!res.ok) {
			throw new Error(`Amadeus auth failed (${res.status})`);
		}

		const tokenPayload = (await res.json()) as Partial<AmadeusTokenResponse>;
		if (!tokenPayload.access_token || !tokenPayload.expires_in) {
			throw new Error("Amadeus auth response missing token details");
		}

		this.cachedToken = {
			value: tokenPayload.access_token,
			expiresAt: now + tokenPayload.expires_in * 1000,
		};

		return this.cachedToken.value;
	}

	async searchOffers(input: SearchInput): Promise<FlightOffer[]> {
		const params = new URLSearchParams({
			originLocationCode: input.origin,
			destinationLocationCode: input.destination,
			departureDate: input.outboundDate,
			adults: String(Math.max(1, input.passengers ?? 1)),
			travelClass: mapCabinClass(input.cabinClass),
			max: "50",
		});

		if (input.returnDate) {
			params.set("returnDate", input.returnDate);
		}
		if (input.maxConnections === 0) {
			params.set("nonStop", "true");
		}

		const fetchOffers = (token: string) =>
			this.fetchImpl(
				`${this.baseUrl}/v2/shopping/flight-offers?${params.toString()}`,
				{
					headers: {
						Authorization: `Bearer ${token}`,
					},
				},
			);

		let accessToken = await this.getAccessToken();
		let res = await fetchOffers(accessToken);
		if (res.status === 401) {
			this.cachedToken = null;
			accessToken = await this.getAccessToken();
			res = await fetchOffers(accessToken);
		}

		if (!res.ok) {
			throw new Error(`Amadeus flight search failed (${res.status})`);
		}

		const payload = (await res.json()) as AmadeusFlightOfferResponse;
		const rawOffers = payload.data ?? [];

		const offers = rawOffers.map((offer, index) => {
			const itineraries = offer.itineraries ?? [];
			const segments: FlightSegment[] = itineraries.flatMap((itinerary) =>
				(itinerary.segments ?? []).map((segment) => {
					const carrierCode =
						segment.operating?.carrierCode ?? segment.carrierCode ?? "Unknown";
					const flightNumber = segment.number
						? `${carrierCode}${segment.number}`
						: carrierCode;

					return {
						airline: carrierCode,
						flightNumber,
						departingAt: segment.departure?.at ?? "",
						arrivingAt: segment.arrival?.at ?? "",
						origin: segment.departure?.iataCode ?? "",
						destination: segment.arrival?.iataCode ?? "",
						duration: segment.duration,
					};
				}),
			);

			const maxStops =
				itineraries.length > 0
					? Math.max(
							...itineraries.map((it) => (it.segments?.length ?? 0) - 1),
							0,
						)
					: 0;

			const totalAmount = Number.parseFloat(
				offer.price?.grandTotal ?? offer.price?.total ?? "0",
			);

			return {
				id: offer.id ?? `amadeus-${index}`,
				totalAmount: Number.isFinite(totalAmount) ? totalAmount : 0,
				currency: offer.price?.currency ?? "CAD",
				airline: segments[0]?.airline ?? "Unknown",
				segments,
				maxStops,
			} satisfies FlightOffer;
		});

		const maxConnections = input.maxConnections;
		if (maxConnections != null && maxConnections > 0) {
			return offers.filter((offer) => offer.maxStops <= maxConnections);
		}

		return offers;
	}
}

export function createAmadeusProvider(
	config: AmadeusProviderConfig,
	fetchImpl?: typeof fetch,
): AmadeusProvider {
	return new AmadeusProvider(config, fetchImpl);
}

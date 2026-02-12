export type FetchRoutesResult =
	| { routes: unknown[]; error: null }
	| { routes: null; error: "auth" | "network" };

export async function fetchRoutes(): Promise<FetchRoutesResult> {
	try {
		const res = await fetch("/api/routes");

		if (!res.ok) {
			return { routes: null, error: "auth" };
		}

		const data = (await res.json()) as unknown[];
		return { routes: data, error: null };
	} catch {
		return { routes: null, error: "network" };
	}
}

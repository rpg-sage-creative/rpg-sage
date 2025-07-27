import { error, verbose, warn } from "@rsc-utils/core-utils";
import { AppServer, getJson, type AppServerEndpoint } from "@rsc-utils/io-utils";
import { renderMap } from "./render/renderMap.js";
import { serverHandler } from "./serverHandler.js";
import type { GameMapData } from "./types/GameMapData.js";
import type { MapRenderPayload } from "./types/MapRenderPayload.js";
import type { MapRenderResponse } from "./types/MapRenderResponse.js";
import type { MimeType } from "./types/MimeType.js";

/**
 * Catches an error when using an internal server to creating image buffers.
 * Returns false if the map server is down.
 * Returns null for any other error.
 */
function catchBufferFetch(err: any): false | null {
	if (String(err).includes("ECONNREFUSED")) {
		warn(`MapServer down.`);
		return false;
	}else {
		error(`MapServer error:`, err);
		return null;
	}
}

async function renderMapData(mapData: GameMapData, mimeType: MimeType = "image/webp"): Promise<MapRenderResponse> {
	const payload: MapRenderPayload = { mapData, mimeType };
	let response: MapRenderResponse | false | null = false;

	const awsEndpoint = MapServer.awsEndpointUrl;
	if (awsEndpoint) {
		verbose(`Rendering Map via AWS Lambda.`);
		response = await getJson<MapRenderResponse>(awsEndpoint, payload).catch(catchBufferFetch);
	}

	if (!response) {
		const serverEndpoint = MapServer.endpointUrl;
		if (serverEndpoint) {
			verbose(`Rendering Map via MapServer.`);
			response = await getJson<MapRenderResponse>(serverEndpoint, payload).catch(catchBufferFetch);
		}
	}

	if (response === false) {
		verbose(`Rendering Map in main thread.`);
		response = await renderMap(mapData, mimeType);
	}

	// we have a response, let's use it
	if (response !== null) {
		/** @todo do something about these bad images */
		verbose(`${response.invalidImageUrls.length ?? 0} invalidImageUrls`);
		if (response.invalidImageUrls.length) {
			response.invalidImageUrls.forEach(url => verbose(`\tinvalidImageUrl: ${url}`));
		}
		verbose(`${response.invalidImages.length ?? 0} invalidImages`);
		if (response.invalidImages.length) {
			response.invalidImages.forEach(url => verbose(`\tinvalidImage: ${url}`));
		}

		return response;
	}

	return {
		base64: undefined,
		invalidImages: [],
		invalidImageUrls: [],
		mapData: mapData,
		mimeType: mimeType
	};
}

/**
 * An app server specific to our maps.
 */
export class MapServer {

	/** Render the map and return the resulting Buffer. */
	public static async render(mapData: GameMapData, mimeType?: MimeType): Promise<Buffer | null> {
		const response = mapData ? await renderMapData(mapData, mimeType) : null;
		return response?.base64 ? Buffer.from(response.base64, "base64") : null;
	}

	/** Render the map, but return the render data instead of a Buffer. */
	public static testRender(mapData: GameMapData, mimeType?: MimeType): Promise<MapRenderResponse> {
		return renderMapData(mapData, mimeType);
	}

	/** When set, a call to render or testRender will send the request to AWS instead of rendering in the current process. */
	public static awsEndpointUrl: string = "";
	public static setAwsEndpointUrl(awsEndpointUrl: string): void {
		this.awsEndpointUrl = awsEndpointUrl;
		verbose(`MapServer.setEndpoint("${awsEndpointUrl}") = ${this.awsEndpointUrl}`);
	}

	/** When set, a call to render or testRender will send the request to the MapServer instead of rendering in the current process. */
	public static endpointUrl: string = "";
	public static setEndpoint(endpointUrl: string): void;
	public static setEndpoint(endpoint: Partial<AppServerEndpoint>): void;
	public static setEndpoint(endpointOrUrl: string | Partial<AppServerEndpoint>): void {
		if (typeof(endpointOrUrl) === "string") {
			this.endpointUrl = endpointOrUrl;
		}else {
			const protocol = endpointOrUrl.secure ? "https" : "http";
			const hostname = endpointOrUrl.hostname ?? "localhost";
			const port = endpointOrUrl.port ?? 0;
			this.endpointUrl = `${protocol}://${hostname}:${port}`;
		}
		verbose(`MapServer.setEndpoint(${JSON.stringify(endpointOrUrl)}) = ${this.endpointUrl}`);
	}

	/** @todo why is this here? */
	public static setEndpoints(data: { aws:string; port:number; }): void {
		this.setAwsEndpointUrl(data.aws);
		this.setEndpoint(data);
	}

	/** Starts the MapServer on the given port. */
	public static startServer(port: number): AppServer<MapRenderResponse> {
		return AppServer.start("Map", port, serverHandler);
	}
}

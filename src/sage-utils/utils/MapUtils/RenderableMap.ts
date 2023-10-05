import type { Awaitable } from "../..";
import { error, verbose, warn } from "../ConsoleUtils";
import { errorReturnNull } from "../ConsoleUtils/Catchers";
import { AppServer, AppServerEndpoint, getJson } from "../HttpsUtils";
import { renderMap } from "./internal/renderMap.js";
import { serverHandler } from "./internal/serverHandler.js";
import type { GameMap, GameMapBackgroundImage, GameMapData, GameMapLayer, MapRenderPayload, MapRenderResponse, MimeType } from "./types";

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

/**
 * A template for creating maps that can be rendered through this library.
 */
export abstract class RenderableMap implements GameMap {
	abstract getBackground(): Awaitable<GameMapBackgroundImage>;
	abstract getGrid(): Awaitable<[number, number]>;
	abstract getLayers(): Awaitable<GameMapLayer[]>;
	public async render(mimeType: MimeType = "image/webp"): Promise<Buffer | null> {
		const mapData = await Promise.resolve(this.toJSON()).catch(errorReturnNull);
		if (mapData) {
			const payload: MapRenderPayload = { mapData, mimeType };
			let response: MapRenderResponse | false | null = false;

			const awsEndpoint = RenderableMap.awsEndpointUrl;
			if (awsEndpoint) {
				verbose(`Rendering Map via AWS Lambda.`);
				response = await getJson<MapRenderResponse>(awsEndpoint, payload).catch(catchBufferFetch);
			}

			if (!response) {
				const serverEndpoint = RenderableMap.endpointUrl;
				if (serverEndpoint) {
					verbose(`Rendering Map via AppServer.`);
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
				verbose(`${response.invalidImages.length ?? 0} invalidImages`);

				return response.base64 ? Buffer.from(response.base64, "base64") : null;
			}
		}
		return null;
	}
	abstract toJSON(): Awaitable<GameMapData>;

	public static awsEndpointUrl: string = "";
	public static setAwsEndpointUrl(awsEndpointUrl: string): void {
		RenderableMap.awsEndpointUrl = awsEndpointUrl;
		verbose(`RenderableMap.setEndpoint("${awsEndpointUrl}") = ${RenderableMap.awsEndpointUrl}`);
	}

	public static endpointUrl: string = "";
	public static setEndpoint(endpointUrl: string): void;
	public static setEndpoint(endpoint: Partial<AppServerEndpoint>): void;
	public static setEndpoint(endpointOrUrl: string | Partial<AppServerEndpoint>): void {
		if (typeof(endpointOrUrl) === "string") {
			RenderableMap.endpointUrl = endpointOrUrl;
		}else {
			const protocol = endpointOrUrl.secure ? "https" : "http";
			const hostname = endpointOrUrl.hostname ?? "localhost";
			const port = endpointOrUrl.port ?? 0;
			RenderableMap.endpointUrl = `${protocol}://${hostname}:${port}`;
		}
		verbose(`RenderableMap.setEndpoint(${JSON.stringify(endpointOrUrl)}) = ${RenderableMap.endpointUrl}`);
	}

	public static setEndpoints(data: { aws:string; port:number; }): void {
		RenderableMap.setAwsEndpointUrl(data.aws);
		RenderableMap.setEndpoint(data);
	}

	public static startServer(port: number): AppServer<MapRenderResponse> {
		return AppServer.start("Map", port, serverHandler);
	}
}
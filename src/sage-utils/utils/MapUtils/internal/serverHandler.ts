import type { BufferHandlerJsonError, BufferHandlerResponse } from "@rsc-utils/https-utils";
import type { MapRenderPayload, MapRenderResponse } from "../types";
import { renderMap } from "./renderMap.js";

/**
 * @private
 * Receives a payload, renders the given map, and returns a json response.
 */
export async function serverHandler(bufferOrPayload: Buffer | MapRenderPayload): Promise<BufferHandlerResponse<MapRenderResponse | BufferHandlerJsonError>> {
	const payload = Buffer.isBuffer(bufferOrPayload) ? JSON.parse(bufferOrPayload.toString()) as MapRenderPayload : bufferOrPayload;
	const response = await renderMap(payload.mapData, payload.mimeType);
	if (response) {
		return {
			statusCode: 200,
			contentType: "application/json",
			body: response
		};
	}
	return {
		statusCode: 500,
		contentType: "application/json",
		body: { error:"Error rendering map!" }
	};
}
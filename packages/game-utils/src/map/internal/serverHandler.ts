import { parseJson } from "@rsc-utils/core-utils";
import type { BufferHandlerJsonError, BufferHandlerResponse } from "@rsc-utils/io-utils";
import type { MapRenderPayload, MapRenderResponse } from "../types.js";
import { renderMap } from "./renderMap.js";

/**
 * @private
 * Receives a payload, renders the given map, and returns a json response.
 */
export async function serverHandler(bufferOrPayload: Buffer | MapRenderPayload): Promise<BufferHandlerResponse<MapRenderResponse | BufferHandlerJsonError>> {
	const payload = Buffer.isBuffer(bufferOrPayload) ? parseJson(bufferOrPayload.toString()) as MapRenderPayload : bufferOrPayload;
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
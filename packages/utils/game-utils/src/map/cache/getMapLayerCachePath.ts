import type { MimeType } from "../types/MimeType.js";
import { getMapCachePathRoot } from "./getMapCachePathRoot.js";

type Args = {
	userId: string;
	mapId: string;
	layerId: string;
};

/** Create the file path for where to store the image locally. */
export function getMapLayerCachePath(args: Args): string {
	const { userId, mapId, layerId } = args;
	const ext = getMapLayerCacheMimeType().split("/").pop();
	return `${getMapCachePathRoot()}/users/${userId}/maps/${mapId}/${layerId}.${ext}`;
}

export function getMapLayerCacheMimeType(): MimeType {
	return "image/webp";
}
import { getMapCachePathRoot } from "./getMapCachePathRoot.js";

type Args = {
	userId: string;
	mapId: string;
	layerId: string;
	imageId: string;
	imageExt: string;
};

/** Create the file path for where to store the image locally. */
export function getMapImageCachePath(args: Args): string {
	const { userId, mapId, layerId, imageId, imageExt } = args;
	return `${getMapCachePathRoot()}/users/${userId}/maps/${mapId}/${layerId}-${imageId}.${imageExt}`;
}

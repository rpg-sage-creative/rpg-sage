import { errorReturnNull, type Awaitable } from "@rsc-utils/core-utils";
import { MapServer } from "./MapServer.js";
import type { GameMapData } from "./types/GameMapData.js";
import type { MimeType } from "./types/MimeType.js";


/**
 * A template for creating maps that can be rendered through this library.
 */
export abstract class RenderableMap {
	public async render(mimeType?: MimeType): Promise<Buffer | null> {
		const mapData = await Promise.resolve(this.toJSON()).catch(errorReturnNull);
		return mapData ? MapServer.render(mapData, mimeType) : null;
	}
	abstract toJSON(): Awaitable<GameMapData>;
}

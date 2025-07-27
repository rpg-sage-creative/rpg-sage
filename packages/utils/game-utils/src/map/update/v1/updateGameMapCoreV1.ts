import { randomSnowflake, type Snowflake } from "@rsc-utils/core-utils";
import type { ActiveLayerMap, GameMapData } from "../../types/GameMapData.js";
import type { GameMapAura, GameMapImage } from "../../types/GameMapImage.js";
import type { GameMapLayerData } from "../../types/GameMapLayer.js";
import type { GridArgs } from "../../types/GridArgs.js";
import type { GridCoordinate } from "../../types/GridCoordinate.js";
import type { GridType } from "../../types/GridType.js";
import type { LayerType } from "../../types/LayerType.js";
import { LayerTypeV1, type GameMapCoreV1, type TGameMapImage } from "./GameMapCoreV1.js";

function updateLayerType(layerType?: LayerTypeV1): LayerType | undefined {
	switch(layerType) {
		case LayerTypeV1.Aura: return "aura";
		case LayerTypeV1.Terrain: return "terrain";
		case LayerTypeV1.Token: return "token";
		default: return undefined;
	}
}

function updateActiveMap(v1: GameMapCoreV1): ActiveLayerMap {
	const map: ActiveLayerMap = { };
	const oldMap = v1.activeMap ?? {};
	Object.keys(oldMap).forEach(key => {
		const [activeLayer, activeTerrain, activeAura, activeToken, previousLayer] = oldMap[key];
		map[key] = {
			activeLayer: updateLayerType(activeLayer),
			activeTerrain,
			activeAura,
			activeToken,
			previousLayer: updateLayerType(previousLayer)
		};
	});
	return map;
}

function updateGridType(value?: string): GridType {
	switch(value) {
		case "vhex": return "pointy";
		case "hex": return "flat";
		default: return "square";
	}
}

function updateGridArgs(v1: GameMapCoreV1): GridArgs | undefined {
	const [cols, rows, gridColor, gridType] = v1.grid;
	const width = 0, height = 0;
	return {
		cols,
		gridColor,
		gridType: updateGridType(gridType),
		height,
		rows,
		width,
	};
}

function pairToGrid(pair?: number[]): GridCoordinate | undefined {
	return pair ? { col:pair[0], row:pair[1] } : undefined;
}

function updateAura(image: TGameMapImage, anchorId?: Snowflake, isActive?: boolean): GameMapAura {
	return {
		anchorId,
		cols: image.size[0],
		gridOffset: { col:image.pos[0], row:image.pos[1] },
		id: image.id,
		isActive,
		name: image.name,
		rows: image.size[1],
		scale: image.scale,
		url: image.url,
		userId: image.userId
	};
}

function updateImage(image: TGameMapImage): GameMapImage {
	return {
		auras: image.auras?.map(aura => updateAura(aura, image.id, image.auraId === aura.id)),
		cols: image.size[0],
		gridOffset: { col:image.pos[0], row:image.pos[1] },
		id: image.id,
		name: image.name,
		rows: image.size[1],
		scale: image.scale,
		url: image.url,
		userId: image.userId
	};
}

function toBackgroundLayer(v1: GameMapCoreV1): GameMapLayerData {
	const [ clipX, clipY, clipWidth, clipHeight ] = (v1.clip ?? []);
	const [ cols, rows ] = v1.grid;
	return {
		id: randomSnowflake(),
		images: [
			{
				cols,
				clipHeight,
				clipWidth,
				clipX,
				clipY,
				id: randomSnowflake(),
				name: "Background",
				rows,
				url: v1.url
			}
		],
		type: "background"
	};
}

function toLayer(images: TGameMapImage[], type: LayerType): GameMapLayerData | undefined {
	if (images?.length) {
		return {
			id: randomSnowflake(),
			images: images.map(image => updateImage(image)),
			type
		};
	}
	return undefined;
}

/** @internal */
export function updateGameMapCoreV1(v1: GameMapCoreV1): GameMapData {
	return {
		activeMap: updateActiveMap(v1),
		grid: updateGridArgs(v1),
		id: v1.id,
		layers: {
			background: toBackgroundLayer(v1),
			terrain: toLayer(v1.terrain, "terrain"),
			aura: toLayer(v1.auras, "aura"),
			token: toLayer(v1.tokens, "token")
		},
		messageId: v1.messageId,
		name: v1.name,
		spawn: pairToGrid(v1.spawn),
		userId: v1.userId,
		ver: "v2"
	};
}

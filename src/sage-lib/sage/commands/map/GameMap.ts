import type { Snowflake } from "discord.js";
import GameMapBase, { COL, LayerType, ROW, TGameMapAura, TGameMapCore, TGameMapImage, UserLayerType } from "./GameMapBase";

/** shuffles an image on a layer */
export type TShuffleUpDown = "up" | "down";
export type TShuffleDirection = "top" | "bottom" | "up" | "down";
function shuffleImage(images: TGameMapImage[], imageId: Snowflake, direction: TShuffleDirection): boolean {
	const image = images.find(img => img.id === imageId);
	if (!image) {
		return false;
	}
	const index = images.indexOf(image);
	switch(direction) {
		case "top":
			images = images.filter(t => t !== image).concat([image]);
			break;
		case "bottom":
			images = [image].concat(images.filter(t => t !== image));
			break;
		case "up":
			if (images.slice().pop() !== image) {
				const newIndex = index + 1;
				images = images.filter(t => t !== image);
				images.splice(newIndex, 0, image);
			}
			break;
		case "down":
			if (images[0] === image) {
				const newIndex = index - 1;
				images = images.filter(t => t !== image);
				images.splice(newIndex, 0, image);
			}
			break;
	}
	return index !== images.indexOf(image);
}

const UP = -1;
const DOWN = 1;
const LEFT = -1;
const RIGHT = 1;

export type TMoveDirection = "upleft" | "up" | "upright" | "left" | "right" | "downleft" | "down" | "downright";
function moveImage(image: TGameMapImage, direction: TMoveDirection): boolean {
	switch(direction) {
		case "upleft": return move(image, [ROW, UP], [COL, LEFT]);
		case "up": return move(image, [ROW, UP]);
		case "upright": return move(image, [ROW, UP], [COL, RIGHT]);
		case "left": return move(image, [COL, LEFT]);
		case "right": return move(image, [COL, RIGHT]);
		case "downleft": return move(image, [ROW, DOWN], [COL, LEFT]);
		case "down": return move(image, [ROW, DOWN]);
		case "downright": return move(image, [ROW, DOWN], [COL, RIGHT]);
		default: return false;
	}
}

const POS = 0;
const DIR = 1;

function move(image: TGameMapImage, ...posDirs: [0 | 1, -1 | 1][]): boolean {
	posDirs.forEach(posDir => {
		image.pos[posDir[POS]] += posDir[DIR];
		image.auras?.forEach(aura => aura.pos[posDir[POS]] += posDir[DIR]);
	});
	return true;
}

export default class GameMap extends GameMapBase {
	/** constructs a map for the given core and user */
	public constructor(core: TGameMapCore, public userId: Snowflake) {
		super(core);
	}

	//#region properties

	/** returns the user's currently active aura, or their active token's active aura if the active layer is Token */
	public get activeAura() {
		if (this.activeLayer === LayerType.Terrain) {
			const activeAuraId = this.activeLayerValues[LayerType.Aura];
			const userAuras = this.userAuras;
			return userAuras.find(aura => aura.id === activeAuraId) ?? userAuras[0];
		}
		const activeToken = this.activeToken;
		return activeToken?.auraId ? activeToken.auras.find(aura => aura.id === activeToken.auraId) : undefined;
	}

	/** returns the currently active image */
	public get activeImage() {
		switch(this.activeLayer) {
			case LayerType.Aura: return this.activeAura;
			case LayerType.Terrain: return this.activeTerrain;
			case LayerType.Token:
			default:
				return this.activeToken;
		}
	}

	/** sets the user's currently active layer and image */
	public set activeImage(activeImage: TGameMapImage | undefined) {
		const values = this.activeLayerValues;
		values[UserLayerType.Layer] = activeImage!.layer ?? LayerType.Token;
		values[activeImage!.layer] = activeImage!.id;
	}

	/** returns the user's currently active image's id */
	public get activeImageId() { return this.activeLayerValues[this.activeLayer]; }

	/** returns the user's currently active layer */
	public get activeLayer() { return this.activeLayerValues[UserLayerType.Layer]; }
	public set activeLayer(activeLayer) {
		if (this.activeLayer !== LayerType.Aura) {
			this.activeLayerValues[UserLayerType.PreviousLayer] = this.activeLayer;
		}
		this.activeLayerValues[UserLayerType.Layer] = activeLayer;
	}

	/** returns the user's active layer values */
	public get activeLayerValues() {
		return this.activeLayerMap[this.userId]
			?? (this.activeLayerMap[this.userId] = [LayerType.Token, undefined, undefined, undefined, LayerType.Token]);
	}

	/** returns the user's currently active terrain */
	public get activeTerrain() {
		const activeTerrainId = this.activeLayerValues[LayerType.Terrain];
		const userTerrain = this.userTerrain;
		return userTerrain.find(terrain => terrain.id === activeTerrainId) ?? userTerrain[0];
	}

	/** returns the user's currently active token */
	public get activeToken() {
		const activeTokenId = this.activeLayerValues[LayerType.Token];
		const userTokens = this.userTokens;
		return userTokens.find(token => token.id === activeTokenId) ?? userTokens[0];
	}

	/** returns the maps grid dimensions: [rows, cols] */
	public get grid() {
		return this.core.grid;
	}

	/** indicates the user is the owner of the map */
	public get isOwner() { return this.userId === this.ownerId; }

	/** returns the user's previously active layer */
	public get previousLayer() { return this.activeLayerValues[UserLayerType.PreviousLayer] ?? LayerType.Token; }

	/** retuns all the auras on the map this user can access */
	public get userAuras() { return this.isOwner ? this.auras : this.auras.filter(aura => aura.userId === this.userId); }

	/** returns all the terrain on the map this user can access */
	public get userTerrain() { return this.isOwner ? this.terrain : this.terrain.filter(terrain => terrain.userId === this.userId); }

	/** returns all the tokens on the map this user can access */
	public get userTokens() { return this.isOwner ? this.tokens : this.tokens.filter(token => token.userId === this.userId); }

	//#endregion

	//#region methods

	/** cycles to the next active aura */
	public cycleActiveAura() {
		if (this.activeLayer !== LayerType.Aura) {
			this.activeLayer = LayerType.Aura;
			return true;
		}
		if (this.previousLayer === LayerType.Terrain) {
			const auras = this.userAuras;
			if (auras.length < 2) {
				return false;
			}
			const prev = this.activeAura;
			const index = prev ? auras.indexOf(prev) : -1;
			const next = auras[index + 1] ?? auras[0];
			this.activeLayerValues[LayerType.Aura] = next.id;
		}else {
			const activeToken = this.activeToken;
			if (!activeToken) {
				return false;
			}
			const prev = this.activeAura;
			const index = prev ? activeToken.auras.indexOf(prev) : -1;
			const next = activeToken.auras[index + 1];
			activeToken.auraId = next?.id;
		}
		return true;
	}

	/** sets the active layer to Terrain and cycles to the next active terrain */
	public cycleActiveTerrain() {
		if (this.activeLayer !== LayerType.Terrain) {
			this.activeLayer = LayerType.Terrain;
			return true;
		}
		const terrain = this.userTerrain;
		if (terrain.length < 2) {
			return false;
		}
		const prev = this.activeTerrain;
		const index = terrain.indexOf(prev);
		const next = terrain[index + 1] ?? terrain[0];
		this.activeImage = next;
		return true;
	}

	/** sets the active layer to Token and cycles to the next active token */
	public cycleActiveToken() {
		if (this.activeLayer !== LayerType.Token) {
			this.activeLayer = LayerType.Token;
			return true;
		}
		const tokens = this.userTokens;
		if (tokens.length < 2) {
			return false;
		}
		const prev = this.activeToken;
		const index = tokens.indexOf(prev);
		const next = tokens[index + 1] ?? tokens[0];
		this.activeImage = next;
		return true;
	}

	public deleteImage(image: TGameMapImage): boolean {
		if (image.layer === LayerType.Terrain) {
			return this.core.terrain.splice(this.core.terrain.findIndex(terrain => terrain.id === image.id), 1).length === 1;
		}else if (image.layer === LayerType.Token) {
			return this.core.tokens.splice(this.core.tokens.findIndex(token => token.id === image.id), 1).length === 1;
		}else {
			if ((image as TGameMapAura).anchorId) {
				const anchor = this.tokens.find(token => token.auras.find(aura => aura.id === image.id))
					?? this.terrain.find(terrain => terrain.auras.find(aura => aura.id === image.id));
				if (anchor?.auraId === image.id) {
					delete anchor.auraId;
				}
				return anchor?.auras.splice(anchor.auras.findIndex(aura => aura.id === image.id), 1).length === 1;
			}else {
				return this.core.auras.splice(this.core.auras.findIndex(aura => aura.id === image.id), 1).length === 1;
			}
		}
	}

	/** move the active token in the given direction */
	public moveActiveToken(direction: TMoveDirection): boolean {
		const activeImage = this.activeImage;
		if (!activeImage) {
			return false;
		}
		return moveImage(activeImage, direction);
	}

	/** change the active aura's opacity */
	public shiftOpacity(direction: TShuffleUpDown): boolean {
		const activeAura = this.activeAura;
		if (activeAura) {
			switch(direction) {
				case "up":
					if ((activeAura.opacity ?? 0.5) < 1) {
						activeAura.opacity = (activeAura.opacity ?? 0.5) + 0.1;
						return true;
					}
					break;
				case "down":
					if ((activeAura.opacity ?? 0.5) > 0) {
						activeAura.opacity = (activeAura.opacity ?? 0.5) - 0.1;
						return true;
					}
					break;
			}
		}
		return false;
	}

	/** shuffles the user's active terrain */
	public shuffleActiveTerrain(direction: TShuffleDirection): boolean {
		const terrain = this.activeTerrain;
		if (!terrain) {
			return false;
		}
		return shuffleImage(this.terrain, terrain.id, direction);
	}

	/** shuffles the user's active token */
	public shuffleActiveToken(direction: TShuffleDirection): boolean {
		const token = this.activeToken;
		if (!token) {
			return false;
		}
		return shuffleImage(this.tokens, token.id, direction);
	}

	//#endregion

	//#region static

	/** loads the map for the given id for the given user */
	public static async forUser(messageId: Snowflake, userId: Snowflake, existingOnly = false) {
		const core = await GameMapBase.readCore(messageId);
		const map = core ? new GameMap(core, userId) : null;
		if (map) {
			return !existingOnly || map.isValidUser(userId) ? map : null;
		}
		return null;
	}

	//#endregion
}

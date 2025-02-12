import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageCommand } from "../../model/SageCommand.js";
import { COL, GameMapBase, LayerType, ROW, UserLayerType, type TGameMapAura, type TGameMapCore, type TGameMapImage } from "./GameMapBase.js";
import { MoveDirection, type Direction } from "./MoveDirection.js";

/** shuffles an image on a layer */
export type TShuffleUpDown = "up" | "down";
export type TShuffleDirection = "top" | "bottom" | "up" | "down";
function shuffleImage(images: TGameMapImage[], imageId: Snowflake, direction: TShuffleDirection): boolean {
	const image = images.find(img => img.id === imageId);
	if (!image) {
		return false;
	}
	const index = images.indexOf(image);
	let newIndex: number;
	switch(direction) {
		case "top":
			newIndex = images.length - 1;
			break;
		case "bottom":
			newIndex = 0;
			break;
		case "up":
			newIndex = Math.min(index + 1, images.length - 1);
			break;
		case "down":
			newIndex = Math.max(index - 1, 0);
			break;
	}
	images.splice(index, 1);
	images.splice(newIndex, 0, image);
	return index !== images.indexOf(image);
}

const UP = -1;
const DOWN = 1;
const LEFT = -1;
const RIGHT = 1;
type PosDir = [0 | 1, -1 | 1];

function moveImage(image: TGameMapImage, ...directions: Direction[]): boolean {
	const [startCol, startRow] = image.pos;

	const moveImage = (distance: number, ...posDirs: PosDir[]) => {
		while (distance--) {
			move(image, ...posDirs);
		}
	};

	directions.forEach(dir => {
		const direction = MoveDirection.from(dir);
		switch(direction.arrow) {
			case "upleft": return moveImage(direction.distance, [ROW, UP], [COL, LEFT]);
			case "up": return moveImage(direction.distance, [ROW, UP]);
			case "upright": return moveImage(direction.distance, [ROW, UP], [COL, RIGHT]);
			case "left": return moveImage(direction.distance, [COL, LEFT]);
			case "right": return moveImage(direction.distance, [COL, RIGHT]);
			case "downleft": return moveImage(direction.distance, [ROW, DOWN], [COL, LEFT]);
			case "down": return moveImage(direction.distance, [ROW, DOWN]);
			case "downright": return moveImage(direction.distance, [ROW, DOWN], [COL, RIGHT]);
			default: return;
		}
	});

	return image.pos[COL] !== startCol || image.pos[ROW] !== startRow;
}

const POS = 0;
const DIR = 1;

function move(image: TGameMapImage, ...posDirs: PosDir[]): boolean {
	posDirs.forEach(posDir => {
		image.pos[posDir[POS]] += posDir[DIR];
		image.auras?.forEach(aura => aura.pos[posDir[POS]] += posDir[DIR]);
	});
	return true;
}

type GameUsers = { gameMasters:Snowflake[]; players:Snowflake[]; };

export class GameMap extends GameMapBase {
	/** constructs a map for the given core and user */
	public constructor(core: TGameMapCore, public userId: Snowflake, public gameUsers?: GameUsers) {
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
	public get isGameMaster() { return this.gameUsers?.gameMasters.includes(this.userId); }
	public get isGameMasterOrOwner() { return this.isOwner || this.isGameMaster; }
	public get isPlayer() { return this.gameUsers?.players.includes(this.userId); }

	/** returns the user's previously active layer */
	public get previousLayer() { return this.activeLayerValues[UserLayerType.PreviousLayer] ?? LayerType.Token; }

	/** retuns all the auras on the map this user can access */
	public get userAuras() { return this.isGameMasterOrOwner ? this.auras : this.auras.filter(aura => aura.userId === this.userId); }

	/** returns all the terrain on the map this user can access */
	public get userTerrain() { return this.isGameMasterOrOwner ? this.terrain : this.terrain.filter(terrain => terrain.userId === this.userId); }

	/** returns all the tokens on the map this user can access */
	public get userTokens() { return this.isGameMasterOrOwner ? this.tokens : this.tokens.filter(token => token.userId === this.userId); }

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
	public moveActiveToken(...directions: Direction[]): boolean {
		const activeImage = this.activeImage;
		if (!activeImage) {
			return false;
		}
		return moveImage(activeImage, ...directions);
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

	/**
	 * loads the map for the given id for the given user
	 * @deprecated user GameMap.forActor()
	 */
	public static async forUser(messageId: Snowflake, userId: Snowflake): Promise<GameMap | undefined> {
		const core = await GameMapBase.readCore(messageId);
		if (!core) return undefined;

		const map = new GameMap(core, userId);
		if (map.isValidUser(userId)) {
			return map;
		}

		return undefined;
	}

	/**
	 * Loads the map found in the message of the command for the given user.
	 * If a Game is present, then the gms and players are added to the GameMap for permissions checking.
	 */
	public static async forActor(sageCommand: SageCommand): Promise<GameMap | undefined> {
		const message = await sageCommand.fetchMessage();
		if (!message) return undefined;

		// when we add app commands they will be directly on the map ... also, if we call this from button events ... thus: ?? message.id
		const messageId = message.reference?.messageId as Snowflake ?? message.id;

		const core = await GameMapBase.readCore(messageId);
		if (!core) return undefined;

		const userId = sageCommand.sageUser.did;

		const { game } = sageCommand;
		if (!game) return new GameMap(core, userId);

		const players = await game.pGuildMembers();
		const gameMasters = await game.gmGuildMembers();
		const gameUsers = {
			gameMasters: gameMasters.map(gm => gm.id as Snowflake),
			players: players.map(p => p.id as Snowflake)
		};

		return new GameMap(core, userId, gameUsers);
	}

	//#endregion
}

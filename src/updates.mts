import { existsSync, mkdir, readdir, readFile, rmSync, writeFile } from "fs";

//#region helpers

function isPrimitive(value: any): boolean {
	return !exists(value) || value instanceof Date || ["string", "number", "boolean"].includes(typeof(value));
}

function cleanJson(object: any): boolean {
	if (isPrimitive(object)) return false;
	if (Array.isArray(object)) return object.map(cleanJson).includes(true);

	let changed = false;
	Object.keys(object as any).forEach(key => {
		const value = object[key];
		if (!exists(value)) {
			delete object[key];
			changed = true;
		}else if (!isPrimitive(value)) {
			changed = cleanJson(value) || changed;
		}
	});

	return changed;
}

function exists<T>(value?: T | null | undefined): value is T {
	return value !== null && value !== undefined;
}

function isNonNilSnowflake(value: string): boolean {
	return !!value.match(/^\d{16,}$/) && !value.match(/^0{16,}$/);
}

function listFiles(path: string, ext?: string): Promise<string[]> {
	return new Promise((resolve, reject) => {
		if (existsSync(path)) {
			readdir(path, (error: NodeJS.ErrnoException | null, files: string[]) => {
				if (error) {
					reject(error);
				}else {
					if (ext) {
						const fileExt = `.${ext}`;
						resolve(files.filter(file => file.endsWith(fileExt)));
					}else {
						resolve(files);
					}
				}
			});
		}else {
			console.warn(`Invalid path: ${path}`);
			resolve([]);
		}
	});
}

function readJsonFile<T>(path: string): Promise<T | null> {
	return new Promise((resolve, reject) => {
		readFile(path, null, (error: NodeJS.ErrnoException | null, buffer: Buffer) => {
			if (error) {
				reject(error);
			}else if (Buffer.isBuffer(buffer)) {
				let object: T | null | undefined;
				try {
					object = JSON.parse(buffer.toString("utf8"));
				}catch(ex) {
					reject(ex);
				}
				if (object !== undefined) {
					resolve(object as T);
				}else {
					// In case we didn't reject an exception somehow, we don't want the Promise to hang ...
					reject("Unable to parse!");
				}
			}else {
				reject("Not a Buffer");
			}
		});
	});
}

function save<T extends IdCore<any>>(core: TPair<T>): Promise<true> {
	return new Promise((resolve, reject) => {
		if (live) {
			writeFile(core.path, JSON.stringify(core.json), error => {
				if (error) {
					reject(error);
				}else {
					console.log(`\t\t${core.path}: saved.`);
					resolve(true);
				}
			});
		}else {
			console.log(`\t\t${core.path}: saved.`);
			resolve(true);
		}
	});
}

function rename<T extends IdCore<any>>(core: TPair<T>): Promise<true> {
	return new Promise((resolve, reject) => {
		const oldPath = core.path;
		if (core.parentPath) {
			core.path = `${core.parentPath}/${core.did ?? core.id}.json`;
		}else {
			core.path = oldPath.replace(core.id, core.did);
		}
		save(core).then(() => {
			if (live) {
				rmSync(oldPath);
			}
			resolve(true);
		}).catch(reject);
	});
}

function isOlderVer(obj: Core<any>, verToCheck: ValidVersion): boolean {
	if (verToCheck === "v2") {
		// all non v2 is older, including undefined
		return obj.ver !== "v2";
	}
	if (verToCheck === "v1") {
		// v1 and v2 are *NOT* older, only undefined
		return !obj.ver;
	}
	return false;
}

//#endregion

//#region main processing

async function processUpdates(): Promise<void> {
	console.log(`Checking for data file updates ...`);
	const changes: [string, number][] = [];
	const updateFns = [updateBots, updateGames, updateMaps, updateMessages, updateServers, updateUsers];
	for (const updateFn of updateFns) {
		const updates = await updateFn();
		changes.push(...updates);
	}
	const totalChanges = changes.reduce((count, change) => count += change[1], 0);
	const totalFiles = changes.map(change => change[0]).filter((s, i, a) => a.indexOf(s) === i).length;
	console.log(`Total updates: ${totalChanges} (${totalFiles} files)`);
}

const sagePath = `./data/sage`;
type ValidVersion = "v1" | "v2";
type Core<V extends ValidVersion> = { ver?:V; }
type IdCore<V extends ValidVersion> = Core<V> & { id:string; }
type DidCore<V extends ValidVersion> = IdCore<V> & { did:string; }
type TPair<T extends IdCore<any>> = { type:string; id:string; did:string; path:string; json:T; parentPath?:string; };

async function readFiles<T extends IdCore<any>>(type: string): Promise<TPair<T>[]> {
	const out: TPair<T>[] = [];
	const typePath = `${sagePath}/${type}`;
	const files = await listFiles(typePath, "json");
	for (const file of files) {
		const id = file.slice(0, -5);
		const path = `${typePath}/${file}`;
		const json = await readJsonFile<T>(path);
		if (json) {
			const did = (json as IdCore<any> as DidCore<any>).did;
			out.push({ type, id, did, path, json  });
		}else {
			console.warn(`\t\tInvalid JSON file: ${typePath}/${id}.json`);
		}
	}
	return out;
}

async function updateType(type: string, handlers: Function[]):  Promise<[string, number][]> {
	const singular = type.endsWith("s") ? type.slice(0, -1) : type;
	console.log(`\tChecking for ${singular} file updates ...`);
	const changes: [string, number][] = [];
	for (const handler of handlers) {
		const updates = await update(type, handler);
		changes.push(...updates);
	}
	const totalChanges = changes.reduce((count, change) => count += change[1], 0);
	const totalFiles = changes.map(change => change[0]).filter((s, i, a) => a.indexOf(s) === i).length;
	console.log(`\tTotal ${singular} updates: ${totalChanges} (${totalFiles} files)`);
	return changes;

}

async function update(type: string, handler: Function): Promise<[string, number][]> {
	const changes: [string, number][] = [];
	const pairs = await readFiles(type);
	for (const pair of pairs) {
		const updates = await handler(pair, pair.json, pair.json);
		if (updates) {
			changes.push(updates);
		}
	}
	return changes;
}

//#endregion

//#region bots - completed: v1 (devs), v2 (images, rename)

async function updateBots(): Promise<[string, number][]> {
	return updateType("bots", [updateBots_v1, updateBots_v2]);
}

type BotCore_v1 = DidCore<"v1"> & {
	devs: {
		did: string;
		logLevel: string;
		/** @deprecated */
		channelDids?:[];
	}[];
	tokenUrl?: string;
}

/**
 * ensure devs array
 * remove .channels dev entries
 */
async function updateBots_v1(pair: TPair<BotCore_v1>, v1: BotCore_v1): Promise<[string, number] | null> {
	if (!isOlderVer(v1, "v1")) return null;

	let changes = 0;

	//#region ensure devs includes SuperUser
	if (!v1.devs || !v1.devs.find(dev => dev.did === "253330271678627841")) {
		const devs = v1.devs ?? (v1.devs = []);
		devs.push({ did:"253330271678627841", logLevel:"Error" });
		console.log(`\t\t${pair.id}: devs added.`);
		changes++;
	}
	//#endregion

	//#region remove channels from devs
	for (const dev of v1.devs) {
		if ("channelDids" in dev) {
			delete dev.channelDids;
			console.log(`\t\t${pair.id}: channelDids removed.`);
			changes++;
		}
	};
	//#endregion

	v1.ver = "v1";

	save(pair);

	return [pair.did, changes];
}

type BotImage = { tags:"avatar"[]; url:string; };

type BotCore_v2 = DidCore<"v2"> & {
	images: BotImage[];
};

/**
 * move old tokenUrl to an image with tag "avatar" (bring image names inline with Discord)
 * rename files to did.json
 */
async function updateBots_v2(pair: TPair<BotCore_v1>, v1: BotCore_v1, v2: BotCore_v2): Promise<[string, number] | null> {
	if (!isOlderVer(v2, "v2")) return null;

	let changes = 0;

	if ("tokenUrl" in v1) {
		if (v1.tokenUrl) {
			const images = v2.images ?? (v2.images = []);
			images.push({ tags:["avatar"], url:v1.tokenUrl })
		}
		delete v1.tokenUrl;
		changes++;
	}

	v2.ver = "v2";

	if (pair.id !== pair.did && !isNonNilSnowflake(pair.id)) {
		const renamed = await rename(pair);
		if (!renamed) throw new Error(`Unable to rename: ${pair.path}`);
	}else {
		save(pair);
	}

	return [pair.did, changes];
}

//#endregion

//#region channels - completed: v1 (old perms), v2 (commands, sendTo)

type ChannelCore<V extends ValidVersion> = Core<V> & {
	did: string;
	commands?: boolean;
	dialog?: boolean;
	dice?: boolean;
	gameChannelType?: GameChannelType;
};
type ChannelCore_v1 = ChannelCore<"v1">;
type ChannelCore_v2 = ChannelCore<"v2">;

// type TGameChannelType = keyof typeof GameChannelType;
enum GameChannelType { None = 0, InCharacter = 1, OutOfCharacter = 2, GameMaster = 3, Miscellaneous = 4, Dice = 5 }

/** @deprecated */
type THasGameMasterPlayerNonPlayer = {
	/** @deprecated */
	gameMaster?: number;
	/** @deprecated */
	player?: number;
	/** @deprecated */
	nonPlayer?: number;
}

function cleanChannelCore_v1(channel: ChannelCore_v1): boolean {
	if (!isOlderVer(channel, "v1")) return false;

	//#region change a

	const channelA = channel as ChannelCore_v1 & THasGameMasterPlayerNonPlayer;

	if (!exists(channelA.gameChannelType)) {
		const gameMaster = channelA.gameMaster;
		const player = channelA.player;
		const nonPlayer = channelA.nonPlayer;

		if (exists(gameMaster) || exists(player) || exists(nonPlayer)) {
			const gmWrite = channelA.gameMaster === 3;
			const pcWrite = channelA.player === 3;
			const bothWrite = gmWrite && pcWrite;

			const dialog = channelA.dialog === true;
			const commands = channelA.commands === true;

			const gm = gmWrite && !pcWrite;
			const ooc = bothWrite && (!dialog || commands);
			const ic = bothWrite && !ooc && dialog;
			const misc = !ic && !ooc && !gm;

			let type: GameChannelType | undefined;
			if (ic) type = GameChannelType.InCharacter;
			if (gm) type = GameChannelType.GameMaster;
			if (ooc) type = GameChannelType.OutOfCharacter;
			if (misc) type = GameChannelType.Miscellaneous;
			channelA.gameChannelType = type;
		}
	}

	delete channelA.gameMaster;
	delete channelA.player;
	delete channelA.nonPlayer;

	//#endregion

	cleanJson(channel);

	channel.ver = "v1";
	return true;
}

/** @deprecated */
type THasAdminSearch = {
	/** @deprecated */
	admin?: boolean;
	/** @deprecated */
	search?: boolean;
};

/** @deprecated */
type THasSendCommandToSendSearchTo = {
	/** @deprecated */
	sendCommandTo?: string;
	/** @deprecated */
	sendSearchTo?: string;
}

function cleanChannelCore_v2(channel: ChannelCore_v2): boolean {
	if (!isOlderVer(channel, "v2")) return false;

	//#region change a
	const channelA = channel as ChannelCore_v2 & THasAdminSearch;
	if (channelA.admin || channelA.search) {
		channelA.commands = true;
	}
	delete channelA.admin;
	delete channelA.search;
	//#endregion

	//#region change b
	const channelB = channel as ChannelCore_v2 & THasSendCommandToSendSearchTo;
	delete channelB.sendCommandTo;
	delete channelB.sendSearchTo;
	//#endregion

	cleanJson(channel);

	channel.ver = "v2";
	return true;
}

//#endregion

//#region characters - completed: v1 (iconUrl), v2 (images)

type GameCharacterTag = "pc" | "npc" | "gm" | "ally" | "enemy" | "boss";

type GameCharacter_v2 = {
	charId: string;
	tags: GameCharacterTag[];
	userDid?: string
};

type UserCharacter_v2 = {
	charId: string;
	tags: GameCharacterTag[];
};

type CharacterCore_v1 = IdCore<"v1"> & {
	avatarUrl: string;
	userDid?: string;
};

/** @deprecated */
type THasIconUrl = {
	/** @deprecated */
	iconUrl?: string;
}

function updateCharacters_v1(v1: CharacterCore_v1 & THasIconUrl): boolean {
	if (!isOlderVer(v1, "v1")) return false;

	if ("iconUrl" in v1) {
		if (v1.iconUrl) {
			v1.avatarUrl = v1.iconUrl;
		}
		delete v1.iconUrl;
		return true;
	}

	v1.ver = "v1";
	return false;
}

type TCharacterImageTag = "avatar" | "dialog" | "token";

type TCharacterImage = {
	/** Tags to note how to use this image. */
	tags: TCharacterImageTag[];
	/** Url to the image. */
	url: string;
};

type CharacterCore_v2 = IdCore<"v2"> & {
	images?: TCharacterImage[];
	sheet: { macroUserId:string; };
}

/** @deprecated */
type THasOldCharacterImages = {
	/** @deprecated */
	avatarUrl?: string;
	/** @deprecated */
	tokenUrl?: string;
}

function updateCharacters_v2(v2: CharacterCore_v2 & THasOldCharacterImages): boolean {
	if (!isOlderVer(v2, "v2")) return false;

	let changes = false;

	//#region image changes
	if ("avatarUrl" in v2 || "tokenUrl" in v2) {
		const images: TCharacterImage[] = [];
		if (v2.avatarUrl) {
			images.push({ url:v2.avatarUrl, tags:["dialog"] });
		}
		if (v2.tokenUrl) {
			images.push({ url:v2.tokenUrl, tags:["token"] });
		}
		v2.images = images;

		delete v2.avatarUrl;
		delete v2.tokenUrl;

		changes = true;
	}
	//#endregion

	v2.ver = "v2";
	return changes;
}

//#endregion

//#region games - completed: v1 (channels, characters), v2 (channels, characters)

type GameCore_v1 = IdCore<"v1"> & {
	channels?: ChannelCore_v1[];
	playerCharacters?: CharacterCore_v1[];
	nonPlayerCharacters?: CharacterCore_v1[];
};

type GameCore_v2 = IdCore<"v2"> & {
	channels?: ChannelCore_v2[];
	characters?: GameCharacter_v2[];
};

async function updateGames(): Promise<[string, number][]> {
	return updateType("games", [updateGames_v1, updateGames_v2]);
}

async function updateGames_v1(pair: TPair<GameCore_v1>, v1: GameCore_v1): Promise<[string, number] | null> {
	if (!isOlderVer(v1, "v1")) return null;

	let changes = 0;

	//#region update channels
	let channelChanges = 0;
	v1.channels?.forEach(channel => {
		if (cleanChannelCore_v1(channel)) {
			channelChanges++;
		}
	});
	if (channelChanges) {
		console.log(`\t\t${pair.id}: channel cleanup.`);
		changes += channelChanges;
	}
	//#endregion

	//#region update characters
	let characterChanges = 0;
	v1.nonPlayerCharacters?.forEach(character => {
		if (updateCharacters_v1(character)) {
			characterChanges++;
		}
	});
	v1.playerCharacters?.forEach(character => {
		if (updateCharacters_v1(character)) {
			characterChanges++;
		}
	});
	if (characterChanges) {
		console.log(`\t\t${pair.id}: character cleanup.`);
		changes += characterChanges;
	}
	//#endregion

	v1.ver = "v1";

	save(pair);

	return [pair.id, changes];
}

type GameCharacterForUser = { gameId:string; userId:string; charId:string; char:any; type:"pc"|"npc"; };
const gameCharactersForUsers: GameCharacterForUser[] = [];
async function updateGames_v2(pair: TPair<GameCore_v2>, v1: GameCore_v1, v2: GameCore_v2): Promise<[string, number] | null> {
	if (!isOlderVer(v2, "v2")) return null;

	let changes = 0;

	//#region update channels
	let channelChanges = 0;
	v2.channels?.forEach(channel => {
		if (cleanChannelCore_v2(channel)) {
			channelChanges++;
		}
	});
	if (channelChanges) {
		console.log(`\t\t${pair.id}: channel cleanup.`);
		changes += channelChanges;
	}
	//#endregion

	//#region make characters references to User characters
	if ("playerCharacters" in v1 || "nonPlayerCharacters" in v1) {
		let charChanges = 0;
		const characters: GameCharacter_v2[] = [];

		if ("playerCharacters" in v1 ) {
			const v1PlayerCharacters = v1.playerCharacters ?? [];
			if (v1PlayerCharacters.length) {
				for (const v1Char of v1PlayerCharacters) {
					if (v1Char.userDid) {
						gameCharactersForUsers.push({ gameId:pair.id, userId:v1Char.userDid, charId:v1Char.id, char:v1Char, type:"pc" });
						characters.push({ userDid:v1Char.userDid, charId:v1Char.id, tags:["pc"] });
					}
				}
			}
			delete v1.playerCharacters;
			charChanges += Math.max(1, v1PlayerCharacters.length);
		}

		if ("nonPlayerCharacters" in v1) {
			const v1NonPlayerCharacters = v1.nonPlayerCharacters ?? [];
			if (v1NonPlayerCharacters.length) {
				for (const v1Char of v1NonPlayerCharacters) {
					if (v1Char.userDid) {
						gameCharactersForUsers.push({ gameId:pair.id, userId:v1Char.userDid, charId:v1Char.id, char:v1Char, type:"npc" });
						characters.push({ userDid:v1Char.userDid, charId:v1Char.id, tags:["npc"] });
					}else {
						updateCharacters_v2(v1Char as unknown as CharacterCore_v2);
						await writeCharacterToFile("games", pair.id, v1Char)
						characters.push({ charId:v1Char.id, tags:["npc"] });
					}
				}
			}
			delete v1.nonPlayerCharacters;
			charChanges += Math.max(1, v1NonPlayerCharacters.length);
		}

		if (characters.length) {
			v2.characters = characters;
		}

		console.log(`\t\t${pair.id} character cleanup.`);
		changes += charChanges;
	}

	//#endregion

	v2.ver = "v2";

	save(pair);

	return [pair.id, changes];
}

//#endregion

//#region maps

async function updateMaps(): Promise<[string, number][]> {
	return updateType("maps", [updateMaps_v1, updateMaps_v2]);
}

async function updateMaps_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateMaps_v2(): Promise<[string, number] | null> {
	return null;
}

//#endregion

//#region messages

async function updateMessages(): Promise<[string, number][]> {
	return updateType("messages", [updateMessages_v1, updateMessages_v2]);
}

async function updateMessages_v1(): Promise<[string, number] | null> {
	return null;
}

async function updateMessages_v2(): Promise<[string, number] | null> {
	return null;
}

//#endregion

//#region servers

async function updateServers(): Promise<[string, number][]> {
	return updateType("servers", [updateServers_v1, updateServers_v2]);
}

// type ServerCore_v1 = DidCore & {
// };

async function updateServers_v1(): Promise<[string, number] | null> {
	return null;
}

type ServerCore_v2 = DidCore<"v2"> & {
	channels?: ChannelCore_v2[];
};

async function updateServers_v2(pair: TPair<ServerCore_v2>, v2: ServerCore_v2): Promise<[string, number] | null> {
	if (!isOlderVer(v2, "v2")) return null;

	let changes = 0;

	//#region update channels
	let channelChanges = 0;
	v2.channels?.forEach(channel => {
		if (cleanChannelCore_v2(channel)) {
			channelChanges++;
		}
	});
	if (channelChanges) {
		console.log(`\t\t${pair.id}: channel cleanup.`);
		changes += channelChanges;
	}
	//#endregion

	v2.ver = "v2";

	if (pair.id !== pair.did && !isNonNilSnowflake(pair.id)) {
		const renamed = await rename(pair);
		if (!renamed) throw new Error(`Unable to rename: ${pair.path}`);
		changes++;
	}else {
		save(pair);
	}

	return [pair.did, changes];
}

//#endregion

//#region users

async function updateUsers(): Promise<[string, number][]> {
	return updateType("users", [updateUsers_v1, updateUsers_v2]);
}

type UserCore_v1 = DidCore<"v1"> & {
	/** @deprecated */
	characters?: CharacterCore_v1[];
	/** @deprecated */
	nonPlayerCharacters?: CharacterCore_v1[];
	/** @deprecated */
	playerCharacters?: CharacterCore_v1[];
};

type UserCore_v2 = DidCore<"v2"> & {
	characters?: UserCharacter_v2[];
};

async function updateUsers_v1(pair: TPair<DidCore<any>>, v1: UserCore_v1): Promise<[string, number] | null> {
	if (!isOlderVer(v1, "v1")) return null;

	const charUpdates = (v1.characters?.forEach(char => updateCharacters_v1(char)) ?? []).filter(b => b).length;
	const npcUpdates = (v1.nonPlayerCharacters?.forEach(char => updateCharacters_v1(char)) ?? []).filter(b => b).length;
	const pcUpdates = (v1.playerCharacters?.forEach(char => updateCharacters_v1(char)) ?? []).filter(b => b).length;
	const changes = charUpdates + npcUpdates + pcUpdates;

	v1.ver = "v1";

	save(pair);

	return [pair.id, changes];
}

async function updateUsers_v2(pair: TPair<DidCore<any>>, v1: UserCore_v1, v2: UserCore_v2): Promise<[string, number] | null> {
	if (!isOlderVer(v2, "v2")) return null;

	let changes = 0;

	const v2Characters = v2.characters ?? (v2.characters = []);

	//#region user characters
	if ("nonPlayerCharacters" in v1) {
		const v1NonPlayerCharacters = v1.nonPlayerCharacters ?? [];
		if (v1NonPlayerCharacters.length) {
			for (const v1Char of v1NonPlayerCharacters) {
				v1Char.userDid = pair.did;
				updateCharacters_v2(v1Char as unknown as CharacterCore_v2);
				await writeCharacterToFile("users", pair.did, v1Char);
				v2Characters.push({ charId:v1Char.id, tags:["npc"] });
				changes++;
			}
		}
		delete v1.nonPlayerCharacters;
		console.log(`\t\t${pair.did} nonPlayer character cleanup.`);
	}
	if ("characters" in v1 || "playerCharacters" in v1) {
		const v1PlayerCharacters = (v1.characters ?? []).concat(v1.playerCharacters ?? []);
		if (v1PlayerCharacters.length) {
			for (const v1Char of v1PlayerCharacters) {
				v1Char.userDid = pair.did;
				updateCharacters_v2(v1Char as unknown as CharacterCore_v2);
				await writeCharacterToFile("users", pair.did, v1Char);
				v2Characters.push({ charId:v1Char.id, tags:["pc"] });
				changes++;
			}
		}
		delete v1.characters;
		delete v1.playerCharacters;
		console.log(`\t\t${pair.did} player character cleanup.`);
	}
	//#endregion

	//#region game characters
	const gameCharacters = gameCharactersForUsers.filter(gc => gc.userId === pair.did);
	if (gameCharacters.length) {
		for (const gc of gameCharacters) {
			updateCharacters_v2(gc.char);
			await writeCharacterToFile("users", pair.did, gc.char);
			v2Characters.push({ charId:gc.charId, tags:[gc.type] });
			changes++;
		}
		console.log(`\t\t${pair.did} game character cleanup.`);
	}
	//#endregion

	v2.ver = "v2";

	if (pair.id !== pair.did && !isNonNilSnowflake(pair.id)) {
		const renamed = await rename(pair);
		if (!renamed) throw new Error(`Unable to rename: ${pair.path}`);
		changes++;
	}else {
		save(pair);
	}

	return [pair.did, changes];

}

async function writeCharacterToFile<T extends IdCore<any>>(ownerPlural: "games" | "users", ownerId: string, char: T): Promise<boolean> {
	const path = `${sagePath}/${ownerPlural}/${ownerId}/characters`;
	const filePath = `${path}/${char.id}.json`;
	return new Promise((resolve, reject) => {
		if (live) {
			if (!existsSync(path)) {
				mkdir(path, { recursive:true }, err => {
					console.error(err);
				});
			}
			if (existsSync(path)) {
				writeFile(filePath, JSON.stringify(char), error => {
					if (error) {
						reject(error);
					}else {
						console.log(`\t\t${filePath}: saved.`);
						resolve(true);
					}
				});
			}
			reject("NO PATH!");
		}else {
			console.log(`\t\t${filePath}: saved.`);
			resolve(true);
		}
	});
}

//#endregion

const live = false;
processUpdates();

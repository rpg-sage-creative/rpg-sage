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

function save<T extends IdCore>(core: TPair<T>): Promise<true> {
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

function rename<T extends IdCore>(core: TPair<T>): Promise<true> {
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

//#endregion

//#region channels

type ChannelCore = {
	did: string;
	commands?: boolean;
	dialog?: boolean;
	dice?: boolean;
	gameChannelType?: GameChannelType;
};
type ChannelCore_v1 = ChannelCore;
type ChannelCore_v2 = ChannelCore;

// type TGameChannelType = keyof typeof GameChannelType;
enum GameChannelType { None = 0, InCharacter = 1, OutOfCharacter = 2, GameMaster = 3, Miscellaneous = 4, Dice = 5 }

/** @deprecated */
type THasAdminSearch = {
	/** @deprecated */
	admin?: boolean;
	/** @deprecated */
	search?: boolean;
};

function removeAdminSearch(channel: ChannelCore_v2 & THasAdminSearch): boolean {
	let changed = "admin" in channel || "search" in channel;

	if (channel.admin || channel.search) {
		channel.commands = true;
	}

	delete channel.admin;
	delete channel.search;

	return changed;
}

/** @deprecated */
type THasGameMasterPlayerNonPlayer = {
	/** @deprecated */
	gameMaster?: number;
	/** @deprecated */
	player?: number;
	/** @deprecated */
	nonPlayer?: number;
}

function removeGameMasterPlayerNonPlayer(channel: ChannelCore_v1 & THasGameMasterPlayerNonPlayer): boolean {
	let changed = "gameMaster" in channel || "player" in channel || "nonPlayer" in channel;

	if (!exists(channel.gameChannelType)) {
		const gameMaster = channel.gameMaster;
		const player = channel.player;
		const nonPlayer = channel.nonPlayer;

		if (exists(gameMaster) || exists(player) || exists(nonPlayer)) {
			const gmWrite = channel.gameMaster === 3;
			const pcWrite = channel.player === 3;
			const bothWrite = gmWrite && pcWrite;

			const dialog = channel.dialog === true;
			const commands = channel.commands === true;

			const gm = gmWrite && !pcWrite;
			const ooc = bothWrite && (!dialog || commands);
			const ic = bothWrite && !ooc && dialog;
			const misc = !ic && !ooc && !gm;

			let type: GameChannelType | undefined;
			if (ic) type = GameChannelType.InCharacter;
			if (gm) type = GameChannelType.GameMaster;
			if (ooc) type = GameChannelType.OutOfCharacter;
			if (misc) type = GameChannelType.Miscellaneous;
			channel.gameChannelType = type;
		}
	}

	delete channel.gameMaster;
	delete channel.player;
	delete channel.nonPlayer;

	return changed;
}

/** @deprecated */
type THasSendCommandToSendSearchTo = {
	/** @deprecated */
	sendCommandTo?: string;
	/** @deprecated */
	sendSearchTo?: string;
}

function removeSendCommandToSendSearchTo(channel: ChannelCore_v2 & THasSendCommandToSendSearchTo): boolean {
	let changed = "sendCommandTo" in channel || "sendSearchTo" in channel;

	delete channel.sendCommandTo;
	delete channel.sendSearchTo;

	return changed;
}

function cleanChannelCore_v1(channel: ChannelCore_v1): boolean {
	const removed = removeGameMasterPlayerNonPlayer(channel);
	const cleaned = cleanJson(channel);
	return removed || cleaned;
}

function cleanChannelCore_v2(channel: ChannelCore_v2): boolean {
	const removed_a = removeAdminSearch(channel);
	const removed_b = removeSendCommandToSendSearchTo(channel);
	const cleaned = cleanJson(channel);
	return removed_a || removed_b || cleaned;
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
type IdCore = { id:string; }
type DidCore = IdCore & { did:string; }
type TPair<T extends IdCore> = { type:string; id:string; did:string; path:string; json:T; parentPath?:string; };
async function readFiles<T extends IdCore>(type: string): Promise<TPair<T>[]> {
	const out: TPair<T>[] = [];
	const typePath = `${sagePath}/${type}`;
	const files = await listFiles(typePath, "json");
	for (const file of files) {
		const id = file.slice(0, -5);
		const path = `${typePath}/${file}`;
		const json = await readJsonFile<T>(path);
		if (json) {
			const did = (json as IdCore as DidCore).did;
			out.push({ type, id, did, path, json  });
		}else {
			console.warn(`\t\tInvalid JSON file: ${typePath}/${id}.json`);
		}
	}
	return out;
}

type TUpdateHandler<T extends IdCore, U extends IdCore, V extends IdCore> = (pair: TPair<T>, oldCore: U, newCore: V) => Promise<[string, number] | null>;
async function updateType<T extends IdCore, U extends IdCore, V extends IdCore>(type: string, handlers: TUpdateHandler<T, U, V>[]):  Promise<[string, number][]> {
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

async function update<T extends IdCore, U extends IdCore, V extends IdCore>(type: string, handler: TUpdateHandler<T, U, V>): Promise<[string, number][]> {
	const changes: [string, number][] = [];
	const pairs = await readFiles<T>(type);
	for (const pair of pairs) {
		const updates = await handler(pair, pair.json as any, pair.json as any);
		if (updates) {
			changes.push(updates);
		}
	}
	return changes;
}

//#endregion

//#region bots

async function updateBots(): Promise<[string, number][]> {
	return updateType("bots", [updateBots_v1, updateBots_v2]);
}

type BotCore_v1 = DidCore & {
	devs: {
		did: string;
		logLevel: string;
		/** @deprecated */
		channelDids?:[];
	}[];
}

/**
 * ensure devs array
 * remove .channels dev entries
 */
async function updateBots_v1(bot: TPair<BotCore_v1>): Promise<[string, number] | null> {
	let changes = 0;
	const json = bot.json;

	//#region ensure devs includes Randal
	if (!json.devs) {
		json.devs = [{ did:"253330271678627841", logLevel:"Error" }];
		console.log(`\t\t${bot.id}: devs added.`);
		changes++;
	}
	//#endregion

	//#region remove channels from devs
	for (const dev of json.devs) {
		if (dev.channelDids) {
			delete dev["channelDids"];
			console.log(`\t\t${bot.id}: channelDids removed.`);
			changes++;
		}
	};
	//#endregion

	if (changes) {
		save(bot);
	}

	return [bot.did, changes];
}

/**
 * rename files to did.json
 */
async function updateBots_v2(bot: TPair<BotCore_v1>): Promise<[string, number] | null> {
	if (bot.id !== bot.json.did && !isNonNilSnowflake(bot.id)) {
		const renamed = await rename(bot);
		if (!renamed) throw new Error(`Unable to rename: ${bot.path}`);
		return [bot.did, 1];
	}
	return null;
}

//#endregion

//#region characters

type GameCharacterTag = "pc" | "npc" | "gm" | "ally" | "enemy" | "boss";
type GameCharacter_v2 = {
	userDid: string;
	charId: string;
	tags: GameCharacterTag[];
} | {
	char: CharacterCore_v2;
	tags: GameCharacterTag[];
};

type UserCharacter_v2 = {
	charId: string;
	tags: GameCharacterTag[];
};

type CharacterCore_v1 = IdCore & {
	avatarUrl: string;
	userDid?: string;
};

/** @deprecated */
type THasIconUrl = {
	/** @deprecated */
	iconUrl?: string;
}

function updateCharacters_v1(v1: CharacterCore_v1 & THasIconUrl): boolean {
	if ("iconUrl" in v1) {
		if (v1.iconUrl) {
			v1.avatarUrl = v1.iconUrl;
		}
		delete v1.iconUrl;
		return true;
	}
	return false;
}

type CharacterCore_v2 = IdCore & {
	sheet: { macroUserId:string; };
}

// async function updateCharacters_v2(v1: CharacterCore_v1, v2: CharacterCore_v2): Promise<[string, number] | null> {
// 	// set parentPath and save?
// 	return null;
// }

//#endregion

//#region games

type GameCore_v1 = IdCore & {
	channels?: ChannelCore_v1[];
	playerCharacters?: CharacterCore_v1[];
	nonPlayerCharacters?: CharacterCore_v1[];
};

type GameCore_v2 = IdCore & {
	channels?: ChannelCore_v2[];
	characters?: GameCharacter_v2[];
};

async function updateGames(): Promise<[string, number][]> {
	return updateType("games", [updateGames_v1, updateGames_v2]);
}

async function updateGames_v1(pair: TPair<IdCore>, v1: GameCore_v1): Promise<[string, number] | null> {
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

	if (changes) {
		save(pair);
	}

	return [pair.id, changes];
}

type GameCharacterForUser = { gameId:string; userId:string; charId:string; char:any; type:"pc"|"npc"; };
const gameCharactersForUsers: GameCharacterForUser[] = [];
async function updateGames_v2(pair: TPair<IdCore>, v1: GameCore_v1, v2: GameCore_v2): Promise<[string, number] | null> {
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
		const characters: GameCharacter_v2[] = [];

		v1.playerCharacters?.forEach(gc => {
			if (gc.userDid) {
				gameCharactersForUsers.push({ gameId:pair.id, userId:gc.userDid, charId:gc.id, char:gc, type:"pc" });
				characters.push({ userDid:gc.userDid, charId:gc.id, tags:["pc"] });
			}
			changes++;
		});
		delete v1.playerCharacters;

		v1.nonPlayerCharacters?.forEach(gc => {
			if (gc.userDid) {
				gameCharactersForUsers.push({ gameId:pair.id, userId:gc.userDid, charId:gc.id, char:gc, type:"npc" });
				characters.push({ userDid:gc.userDid, charId:gc.id, tags:["npc"] });
			}else {
				characters.push({ char:gc as unknown as CharacterCore_v2, tags:["npc"] });
			}
			changes++;
		});
		delete v1.nonPlayerCharacters;

		if (characters.length) {
			v2.characters = characters;
		}

		console.log(`\t\t${pair.id} character cleanup.`);
	}

	//#endregion

	if (changes) {
		save(pair);
	}

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

type ServerCore_v2 = DidCore & {
	channels?: ChannelCore_v2[];
};

async function updateServers_v2(server: TPair<ServerCore_v2>): Promise<[string, number] | null> {
	let changes = 0;

	//#region update channels
	let channelChanges = 0;
	server.json.channels?.forEach(channel => {
		if (cleanChannelCore_v2(channel)) {
			channelChanges++;
		}
	});
	if (channelChanges) {
		console.log(`\t\t${server.id}: channel cleanup.`);
		changes += channelChanges;
	}
	//#endregion

	if (changes) {
		save(server);
	}

	//#region rename
	if (server.id !== server.json.did && !isNonNilSnowflake(server.id)) {
		const renamed = await rename(server);
		if (!renamed) throw new Error(`Unable to rename: ${server.path}`);
		changes++;
	}
	//#endregion

	return [server.did, changes];
}

//#endregion

//#region users

async function updateUsers(): Promise<[string, number][]> {
	return updateType("users", [updateUsers_v1, updateUsers_v2]);
}

type UserCore_v1 = DidCore & {
	/** @deprecated */
	characters?: CharacterCore_v1[];
	/** @deprecated */
	nonPlayerCharacters?: CharacterCore_v1[];
	/** @deprecated */
	playerCharacters?: CharacterCore_v1[];
};

type UserCore_v2 = DidCore & {
	characters?: UserCharacter_v2[];
};

async function updateUsers_v1(pair: TPair<DidCore>, v1: UserCore_v1): Promise<[string, number]> {
	const charUpdates = (v1.characters?.forEach(char => updateCharacters_v1(char)) ?? []).filter(b => b).length;
	const npcUpdates = (v1.nonPlayerCharacters?.forEach(char => updateCharacters_v1(char)) ?? []).filter(b => b).length;
	const pcUpdates = (v1.playerCharacters?.forEach(char => updateCharacters_v1(char)) ?? []).filter(b => b).length;
	const changes = charUpdates + npcUpdates + pcUpdates;
	return [pair.id, changes];
}

async function updateUsers_v2(pair: TPair<DidCore>, v1: UserCore_v1, v2: UserCore_v2): Promise<[string, number]> {
	let changes = 0;

	//#region rename file
	if (pair.id !== pair.did && !isNonNilSnowflake(pair.id)) {
		const renamed = await rename(pair);
		if (!renamed) throw new Error(`Unable to rename: ${pair.path}`);
		changes++;
	}
	//#endregion

	//#region user characters
	if ("nonPlayerCharacters" in v1) {
		const v1NonPlayerCharacters = v1.nonPlayerCharacters ?? [];
		if (v1NonPlayerCharacters.length) {
			v2.characters = [];
			for (const v1Char of v1NonPlayerCharacters) {
				v1Char.userDid = pair.did;
				await writeUserCharacterToFile(pair.did, v1Char.id, v1Char);
				v2.characters!.push({ charId:v1Char.id, tags:["npc"] });
				changes++;
			}
		}
		delete v1.nonPlayerCharacters;
		console.log(`\t\t${pair.did} nonPlayer character cleanup.`);
	}
	if ("characters" in v1 || "playerCharacters" in v1) {
		const v1PlayerCharacters = (v1.characters ?? []).concat(v1.playerCharacters ?? []);
		if (v1PlayerCharacters.length) {
			v2.characters = [];
			for (const v1Char of v1PlayerCharacters) {
				v1Char.userDid = pair.did;
				await writeUserCharacterToFile(pair.did, v1Char.id, v1Char);
				v2.characters!.push({ charId:v1Char.id, tags:["pc"] });
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
			await writeUserCharacterToFile(pair.did, gc.charId, gc.char);
			v2.characters?.push({ charId:gc.charId, tags:[gc.type] });
			changes++;
		}
		console.log(`\t\t${pair.did} game character cleanup.`);
	}
	//#endregion

	return [pair.did, changes];

}

async function writeUserCharacterToFile(userDid: string, charId: string, char: CharacterCore_v1 | CharacterCore_v2): Promise<boolean> {
	const path = `${sagePath}/users/${userDid}/characters`;
	const filePath = `${path}/${charId}.json`;
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

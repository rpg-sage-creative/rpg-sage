import type * as Discord from "discord.js";
import utils, { Optional, UUID } from "../../../sage-utils";
import type DiscordKey from "../../../sage-utils/utils/DiscordUtils/DiscordKey";
import type { TDialogMessage } from "../repo/DialogMessageRepository";
import CharactersMatch from "./CharactersMatch";
import type Game from "./Game";
import type { GameCharacterCore, TGameCharacterType } from "./GameCharacter";
import GameCharacter from "./GameCharacter";
import type { IHasSave } from "./NamedCollection";
import NamedCollection from "./NamedCollection";
import type User from "./User";

/*
// function remapCharacters(this: CharacterManager, core: GameCharacterCore, index: number, array: (GameCharacterCore | GameCharacter)[]): void {
// 	if (!core.id) {
// 		core.id = utils.UuidUtils.generate();
// 	}
// 	array[index] = new GameCharacter(core, this);
// }
*/

type TGameCharacterOwner = Game | GameCharacter | User;

export class CharacterManager extends NamedCollection<GameCharacter> implements IHasSave {
	// 			public async addCharacter(userDid: Discord.Snowflake, name: string, iconUrl: string): Promise<boolean> {
	// 				const found = findByUserDidAndName(this, userDid, name);
	// 				if (found) {
	// 					return false;
	//				}
	//			}
	// 			public getCharacter(userDid: Discord.Snowflake, name: string): IGameCharacter {
	// 				return findByUserDidAndName(this, userDid, name);
	//			}

	/** The type of character represented by this manager. */
	public characterType?: TGameCharacterType;

	/** Convenient way to get the GM Character Name from this manager's owner Game. */
	public get gmCharacterName(): string | undefined { return (this.owner as Game).gmCharacterName; }

	/** The owner of this collection that can be saved when changes are made. */
	protected owner?: TGameCharacterOwner;

	/** Tests to see if any characters match the given name, defaults to no recursion. */
	public hasMatching(name: string, recursive = false): boolean {
		return this.find(gameCharacter => gameCharacter.matches(name, recursive)) !== undefined;
	}

	//#region Character

	/** Creates a new GameCharacter object from the given core and adds it to the collection. Returns the GameCharacter if the save is successful, null otherwise. */
	public async addCharacter(core: GameCharacterCore): Promise<GameCharacter | null> {
		const found = this.findByUserAndName(core.userDid, core.name);
		if (!found) {
			const newCore = <GameCharacterCore>{ ...core, id: utils.UuidUtils.generate() };
			const character = new GameCharacter(newCore, this),
				added = await this.pushAndSave(character);
			return added ? character : null;
		}
		return null;
	}

	/** Returns all characters that match the given name. */
	public filterByName(name: string): NamedCollection<GameCharacter>;
	/** Returns all characters that match the given partial name. */
	public filterByName(name: string, partial: true): NamedCollection<GameCharacter>;
	public filterByName(name: string, partial?: true): NamedCollection<GameCharacter> {
		if (partial) {
			return this.filter(character => character.name.match(new RegExp(name, "i"))) as NamedCollection<GameCharacter>;
		}
		return this.filter(character => character.matches(name)) as NamedCollection<GameCharacter>;
	}

	/** Returns all characters with the given userDid. */
	public filterByUser(userDid: Discord.Snowflake): NamedCollection<GameCharacter> {
		return this.filter(character => character.userDid === userDid) as NamedCollection<GameCharacter>;
	}

	/** Returns the first character that has a companion matching the given name. */
	public findByCompanionName(companionName: string): GameCharacter | undefined {
		return this.find(character => character.companions.findByName(companionName));
	}

	/** Returns the character with the given id, recursively. */
	public findById(characterId: UUID): GameCharacter | undefined {
		for (const character of this) {
			if (character.id === characterId) {
				return character;
			}
			const companion = character.companions.findById(characterId);
			if (companion) {
				return companion;
			}
		}
		return undefined;
	}

	/** Returns the first character that matches the given name. */
	public findByName(name: Optional<string>): GameCharacter | undefined {
		return name ? this.find(character => character.matches(name)) : undefined;
	}

	/** Returns the first character that matches the given name. */
	public findByNameOrIndex(nameOrIndex: Optional<string>): GameCharacter | undefined {
		const index = +(nameOrIndex ?? 0);
		if (isNaN(index)) {
			return this.findByName(nameOrIndex);
		}
		return this[index];
	}

	/** Returns the first character with the given userDid. */
	public findByUser(userDid: Discord.Snowflake): GameCharacter | undefined {
		if (!userDid) {
			return undefined;
		}
		return this.find(character => character.userDid === userDid);
	}

	/** Filters by userDid (if it exists) and then returns the first character that matches the given name. */
	public findByUserAndName(userDid: Optional<Discord.Snowflake>, name: Optional<string>): GameCharacter | undefined {
		if (userDid && name) {
			const characters = this.filterByUser(userDid);
			return characters.find(character => character.matches(name));
		}
		return this.findByName(name);
	}
	//#endregion

	//#region Companion

	/** Finds the character for the given userDid and characterName and then returns the first companion that matches the given companion name. */
	public findCompanion(userDid: Optional<Discord.Snowflake>, characterName: Optional<string>, companionName: Optional<string>): GameCharacter | undefined {
		return this.findByUserAndName(userDid, characterName)?.companions.findByName(companionName);
	}

	/** Iterates all the characters' companions and returns the first that matches the given companion name. */
	public findCompanionByName(companionName: Optional<string>): GameCharacter | undefined {
		let companion: GameCharacter | undefined;
		if (companionName) {
			this.find(character => companion = character.companions.findByName(companionName));
		}
		return companion;
	}
	//#endregion

	/** Returns the newest dialog message from all characters and companions. (Helpful for NPCs) */
	public getLastMessage(discordKey: DiscordKey): TDialogMessage | undefined {
		return this.getLastMessages(discordKey).pop();
	}

	/** Returns all the dialog messages for all characters/companions, sorted oldest to newest. (.pop() gets the newest) */
	public getLastMessages(discordKey: DiscordKey): TDialogMessage[] {
		const lastMessages: TDialogMessage[] = [];
		this.forEach(character => {
			lastMessages.push(...character.getLastMessages(discordKey));
		});
		/*
		// lastMessages.sort((a, b) => a.timestamp - b.timestamp);
		*/
		return lastMessages;
	}

	/** We likely don't want a CharacterManager if we map to a non-named value. */
	public map<T>(callbackfn: (value: GameCharacter, index: number, collection: CharacterManager) => T, thisArg?: any): utils.ArrayUtils.Collection<T> {
		const mapped = new utils.ArrayUtils.Collection<T>();
		this.forEach((value, index, collection) => mapped.push(callbackfn.call(thisArg, value, index, collection)));
		return mapped;
	}

	public matchCharacters(input: string): CharactersMatch {
		return CharactersMatch.match(this, input);
	}

	//#region IHasSave

	/** Fires a .save on the owner, generally a Game or User. Returns false if no owner. */
	public save(): Promise<boolean> {
		return this.owner?.save() ?? Promise.resolve(false);
	}

	//#endregion

	/** Creates a new NamedCollection from the given values and optional owner. */
	public static from<T extends GameCharacterCore>(arrayLike: ArrayLike<T> | Iterable<T>): CharacterManager;
	public static from<T extends GameCharacterCore>(arrayLike: ArrayLike<T> | Iterable<T>, owner: TGameCharacterOwner, characterType: TGameCharacterType): CharacterManager;
	public static from(other: CharacterManager): CharacterManager;
	public static from(other: CharacterManager, owner: TGameCharacterOwner, characterType: TGameCharacterType): CharacterManager;
	public static from<T extends GameCharacterCore>(values: ArrayLike<T> | Iterable<T> | CharacterManager, owner?: TGameCharacterOwner, characterType?: TGameCharacterType): CharacterManager {
		const characterManager = new CharacterManager();
		characterManager.owner = owner ?? undefined;
		characterManager.characterType = characterType ?? undefined;
		if (values instanceof CharacterManager) {
			characterManager.owner = owner ?? values.owner ?? undefined;
			characterManager.characterType = characterType ?? values.characterType ?? undefined;
			characterManager.push(...values);
		}else if (values) {
			Array.from(values).forEach(core => {
				if (!core.id) {
					core.id = utils.UuidUtils.generate();
				}
				characterManager.push(new GameCharacter(core, characterManager));
			});
		}
		return characterManager;
	}
}

// Update the Collection signatures to indicate that we are now returning a NamedCollection
export interface CharacterManager {

	concat(...items: ConcatArray<GameCharacter>[]): CharacterManager;
	concat(...items: (GameCharacter | ConcatArray<GameCharacter>)[]): CharacterManager;

	filter(predicate: (value: GameCharacter, index: number, manager: CharacterManager) => unknown, thisArg?: any): CharacterManager;
	filter<T extends GameCharacter>(predicate: (value: GameCharacter, index: number, manager: CharacterManager) => value is T, thisArg?: any): CharacterManager;

	forEach(callbackfn: (value: GameCharacter, index: number, manager: CharacterManager) => void, thisArg?: any): void;

	map<T>(callbackfn: (value: GameCharacter, index: number, manager: CharacterManager) => T, thisArg?: any): utils.ArrayUtils.Collection<T>;
	// map<T extends GameCharacter>(callbackfn: (value: GameCharacter, index: number, manager: CharacterManager) => T, thisArg?: any): NamedCollection<T>;

	reduce(callbackfn: (previousValue: GameCharacter, currentValue: GameCharacter, currentIndex: number, manager: CharacterManager) => GameCharacter): GameCharacter;
	reduce(callbackfn: (previousValue: GameCharacter, currentValue: GameCharacter, currentIndex: number, manager: CharacterManager) => GameCharacter, initialValue: GameCharacter): GameCharacter;
	reduce<T>(callbackfn: (previousValue: T, currentValue: GameCharacter, currentIndex: number, manager: CharacterManager) => T, initialValue: T): T;

	reduceRight(callbackfn: (previousValue: GameCharacter, currentValue: GameCharacter, currentIndex: number, manager: CharacterManager) => GameCharacter): GameCharacter;
	reduceRight(callbackfn: (previousValue: GameCharacter, currentValue: GameCharacter, currentIndex: number, manager: CharacterManager) => GameCharacter, initialValue: GameCharacter): GameCharacter;
	reduceRight<T>(callbackfn: (previousValue: T, currentValue: GameCharacter, currentIndex: number, manager: CharacterManager) => T, initialValue: T): T;

	reverse(): this;

	slice(start?: number, end?: number): CharacterManager;

	splice(start: number, deleteCount?: number): CharacterManager;
	splice(start: number, deleteCount: number, ...items: GameCharacter[]): CharacterManager;
}

export default CharacterManager;
import { Collection } from "@rsc-utils/array-utils";
import type { Optional, Snowflake } from "@rsc-utils/core-utils";
import { randomSnowflake } from "@rsc-utils/dice-utils";
import type { DiscordKey } from "@rsc-utils/discord-utils";
import { CharactersMatch } from "./CharactersMatch.js";
import type { Game } from "./Game.js";
import { GameCharacter, type GameCharacterCore, type TDialogMessage, type TGameCharacterType } from "./GameCharacter.js";
import { NamedCollection, type IHasSave } from "./NamedCollection.js";
import type { User } from "./User.js";

/*
// function remapCharacters(this: CharacterManager, core: GameCharacterCore, index: number, array: (GameCharacterCore | GameCharacter)[]): void {
// 	if (!core.id) {
// 		core.id = randomSnowflake();
// 	}
// 	array[index] = new GameCharacter(core, this);
// }
*/

type TGameCharacterOwner = Game | GameCharacter | User;

export class CharacterManager extends NamedCollection<GameCharacter> implements IHasSave {
	// 			public async addCharacter(userDid: Snowflake, name: string, iconUrl: string): Promise<boolean> {
	// 				const found = findByUserDidAndName(this, userDid, name);
	// 				if (found) {
	// 					return false;
	//				}
	//			}
	// 			public getCharacter(userDid: Snowflake, name: string): IGameCharacter {
	// 				return findByUserDidAndName(this, userDid, name);
	//			}

	/** The type of character represented by this manager. */
	public characterType?: TGameCharacterType;

	/** Convenient way to get the GM Character Name from this manager's owner Game. */
	public get gmCharacterName(): string | undefined { return (this.owner as Game).gmCharacterName; }

	/** The owner of this collection that can be saved when changes are made. */
	declare protected owner?: TGameCharacterOwner;

	/** Tests to see if any characters match the given name, defaults to no recursion. */
	public hasMatching(name: string, recursive = false): boolean {
		return this.find(gameCharacter => gameCharacter.matches(name, recursive)) !== undefined;
	}

	//#region Character

	/** Creates a new GameCharacter object from the given core and adds it to the collection. Returns the GameCharacter if the save is successful, null otherwise. */
	public async addCharacter(core: GameCharacterCore): Promise<GameCharacter | null> {
		const found = this.findByUserAndName(core.userDid, core.name);
		if (!found) {
			const newCore = <GameCharacterCore>{ ...core, id: randomSnowflake() };
			const character = new GameCharacter(newCore, this),
				added = await this.pushAndSave(character);
			return added ? character : null;
		}
		return null;
	}

	/** Returns all characters that match the given name. */
	public filterByName(name: string): NamedCollection<GameCharacter> {
		return this.filter(character => character.matches(name)) as NamedCollection<GameCharacter>;
	}

	/** Returns all characters with the given userDid. */
	public filterByUser(userDid: Snowflake): NamedCollection<GameCharacter> {
		return this.filter(character => character.userDid === userDid) as NamedCollection<GameCharacter>;
	}

	/** Returns the first character that has a companion matching the given name. */
	public findByCompanionName(companionName: string): GameCharacter | undefined {
		return this.find(character => character.companions.findByName(companionName));
	}

	/** Returns the character with the given id, recursively. */
	public findById(characterId: Snowflake): GameCharacter | undefined {
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

	/**
	 * Finds character by user and name, if both given.
	 * If only id is given, the first character for that user is returned.
	 * If only name is given, the first character to match is returned.
	 */
	public findByUser(userDid: Optional<Snowflake>, name?: Optional<string>): GameCharacter | undefined {
		if (userDid && name) {
			return this.filterByUser(userDid).find(character => character.matches(name));
		}else if (userDid) {
			return this.find(character => character.userDid === userDid);
		}else if (name) {
			return this.find(character => character.matches(name));
		}
		return undefined;
	}

	/** @deprecated use .findByUser() */
	public findByUserAndName(userDid: Optional<Snowflake>, name: Optional<string>): GameCharacter | undefined {
		return this.findByUser(userDid, name);
	}

	//#endregion

	//#region Companion

	/** Finds the first companion that matches the given companion name. */
	public findCompanion(companionName: Optional<string>): GameCharacter | undefined;
	/** Filters the characters for the given userDid and returns the first companion that matches the given companion name. */
	public findCompanion(userDid: Optional<Snowflake>, companionName: Optional<string>): GameCharacter | undefined;
	/** Filters the characters for the given userDid and characterName and returns the first companion that matches the given companion name. */
	public findCompanion(userDid: Optional<Snowflake>, characterName: Optional<string>, companionName: Optional<string>): GameCharacter | undefined;
	public findCompanion(...args: Optional<string>[]): GameCharacter | undefined {
		// grab the args
		const companionName = args.pop();
		const userDid = args.shift();
		const characterName = args.shift();

		// filter on user
		let characters = userDid ? this.filter(char => char.userDid === userDid) : this;

		// filter on character
		if (characterName) {
			characters = characters.filter(char => char.matches(characterName));
		}

		// find companion
		let companion: GameCharacter | undefined;
		characters.find(character => companion = character.companions.findByName(companionName));
		return companion;
	}

	/** @deprecated use .findCompanion(companionName) */
	public findCompanionByName(companionName: Optional<string>): GameCharacter | undefined {
		return this.findCompanion(companionName);
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
	public map<T>(callbackfn: (value: GameCharacter, index: number, collection: CharacterManager) => T, thisArg?: any): Collection<T> {
		const mapped = new Collection<T>();
		this.forEach((value, index, collection) => mapped.push(callbackfn.call(thisArg, value, index, collection)));
		return mapped;
	}

	public matchCharacters(input: string): CharactersMatch {
		return CharactersMatch.match(this, input);
	}

	public getAutoCharacter(autoChannelData: {channelDid:Snowflake;userDid:Snowflake;}): GameCharacter | null {
		for (const char of this) {
			if (char.hasAutoChannel(autoChannelData)) {
				return char;
			}
			for (const comp of char.companions) {
				if (comp.hasAutoChannel(autoChannelData)) {
					return comp;
				}
			}
		}
		return null;
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
					core.id = randomSnowflake();
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

	map<T>(callbackfn: (value: GameCharacter, index: number, manager: CharacterManager) => T, thisArg?: any): Collection<T>;
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

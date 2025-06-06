import { randomSnowflake, type Optional, type OrUndefined, type Snowflake } from "@rsc-utils/core-utils";
import { resolveSnowflake, type CanBeSnowflakeResolvable } from "@rsc-utils/discord-utils";
import type { Game } from "./Game.js";
import { GameCharacter, type GameCharacterCore, type TGameCharacterType } from "./GameCharacter.js";
import type { Server } from "./Server.js";
import type { User } from "./User.js";

type TGameCharacterOwner = Game | GameCharacter | Server | User;

export class CharacterManager extends Array<GameCharacter> {

	/** The type of character represented by this manager. */
	public characterType?: TGameCharacterType;

	/** The owner of this collection that can be saved when changes are made. */
	protected owner?: TGameCharacterOwner;

	/** Tests to see if any characters match the given name, defaults to no recursion. */
	public hasMatching(name: string, recursive = false): boolean {
		return this.find(gameCharacter => gameCharacter.matches(name, recursive)) !== undefined;
	}

	//#region Character

	/** Creates a new GameCharacter object from the given core and adds it to the collection. Returns the GameCharacter if the save is successful, null otherwise. */
	public async addCharacter(core: GameCharacterCore): Promise<GameCharacter | null> {
		const found = this.findByUser(core.userDid, core.name);
		if (!found) {
			const newCore = <GameCharacterCore>{ ...core, id: randomSnowflake() };
			const character = new GameCharacter(newCore, this);
			if (!this.findByName(character.name)) {
				this.push(character);
				if (await this.save()) {
					return character;
				}
			}
		}
		return null;
	}

	/** Returns all characters with the given userDid. */
	public filterByUser(userDid: Snowflake): GameCharacter[] {
		return this.filter(character => character.userDid === userDid);
	}

	/** Returns the first character that has a companion matching the given name. */
	public findByCompanionName(companionName: string): GameCharacter | undefined {
		return this.find(character => character.companions.findByName(companionName));
	}

	/** Returns the character with the given id, recursively. */
	public findById(resolvable: CanBeSnowflakeResolvable): GameCharacter | undefined {
		const characterId = resolveSnowflake(resolvable) ?? resolvable;
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

	/**
	 * Finds character by user and name, if both given.
	 * If only id is given, the first character for that user is returned.
	 * If only name is given, the first character to match is returned.
	 */
	public findByUser(userId: Optional<Snowflake>, name?: Optional<string>): GameCharacter | undefined {
		if (userId && name) {
			return this.find(character => character.userDid === userId && character.matches(name));
		}else if (userId) {
			return this.find(character => character.userDid === userId);
		}else if (name) {
			return this.find(character => character.matches(name));
		}
		return undefined;
	}

	//#endregion

	//#region Companion

	/** Finds the first companion that matches the given companion name. */
	public findCompanion(companionName: Optional<string>): GameCharacter | undefined;
	/** Filters the characters for the given userId and returns the first companion that matches the given companion name. */
	public findCompanion(userId: Optional<Snowflake>, companionName: Optional<string>): GameCharacter | undefined;
	/** Filters the characters for the given userId and characterName and returns the first companion that matches the given companion name. */
	public findCompanion(userId: Optional<Snowflake>, characterName: Optional<string>, companionName: Optional<string>): GameCharacter | undefined;
	public findCompanion(...args: Optional<string>[]): GameCharacter | undefined {
		// grab the args
		const companionName = args.pop();
		const userId = args.shift();
		const characterName = args.shift();

		// filter on user
		let characters = userId ? this.filter(char => char.userDid === userId) : this;

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

	public getAutoCharacter(autoChannelData: {channelDid:Snowflake;userDid:Snowflake;}): GameCharacter | undefined {
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
		return undefined;
	}

	//#region owner/save related

	/** Fires a .save on the owner, generally a Game or User. Returns false if no owner. */
	public async save(): Promise<OrUndefined<boolean>> {
		const { owner } = this;
		return owner ? owner.save() : undefined;
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

import type { Optional } from "@rsc-utils/type-utils";
import { HasIdCore, IdCore } from "../ClassUtils";

type TSimpleMap = { [key:string]:any; };

export interface CharacterBaseCore<T extends string = string> extends IdCore<T> {
	name?: string;
	sheet?: TSimpleMap;
	/** link to the game/user character */
	characterId?: string;
	/** message where the char sheet is posted */
	messageId?: string;
	/** link to the character's user */
	userDid?: string;
}

export abstract class CharacterBase<T extends CharacterBaseCore<U> = CharacterBaseCore<any>, U extends string = string> extends HasIdCore<T, U> {
	public get name(): string { return this.core.name ?? ""; }
	public set name(name: string) { this.core.name = name; }

	/** The characterId value from the Game or User. */
	public get characterId(): string { return this.core.characterId ?? ""; }
	public set characterId(characterId: Optional<string>) { this.core.characterId = characterId ?? undefined; }

	/** The messageId value from the Message where the character sheet is posted. */
	public get messageId(): string { return this.core.messageId ?? ""; }
	public set messageId(messageId: Optional<string>) { this.core.messageId = messageId ?? undefined; }

	/** The id value from the characterId's User. */
	public get userDid(): string { return this.core.userDid ?? ""; }
	public set userDid(userDid: Optional<string>) { this.core.userDid = userDid ?? undefined; }

	//#region interactive char sheet
	private get sheet(): TSimpleMap { return this.core.sheet ?? (this.core.sheet = {}); }
	public getSheetValue<V = string>(key: string): V | undefined {
		return this.sheet[key];
	}
	public setSheetValue<V>(key: string, value: V): void {
		if (value === undefined) {
			delete this.sheet[key];
		}else {
			this.sheet[key] = value;
		}
	}
	//#endregion
}

import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import type { Message, MessageReference } from "discord.js";

/** Represents an object that can be null or undefined. */
type Optional<T> = T | null | undefined;

type TSimpleMap = { [key:string]:any; };

export interface CharacterBaseCore<T extends string = string> extends IdCore<T> {
	name?: string;
	sheet?: TSimpleMap;
	/** link to the game/user character */
	characterId?: string;
	/** message where the char sheet is posted */
	sheetRef?: MessageReference;
	/** @deprecated */
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
	public get sheetRef(): MessageReference | undefined {
		if (this.core.sheetRef) return this.core.sheetRef;
		// this allows us to function from old/inadequate data
		if (this.core.messageId) return { messageId:this.core.messageId } as MessageReference;
		return undefined;
	}
	public setSheetRef(msgOrRef: Optional<Message | MessageReference>): boolean {
		let changed = false;
		if (msgOrRef) {
			// check guild/channel now, but do message later for different keys
			if (this.core.sheetRef?.guildId !== (msgOrRef.guildId ?? undefined)) changed = true;
			if (this.core.sheetRef?.channelId !== msgOrRef.channelId) changed = true;

			if ("messageId" in msgOrRef) {
				if (this.core.sheetRef?.messageId !== msgOrRef.messageId) changed = true;
				this.core.sheetRef = {
					guildId: msgOrRef.guildId,
					channelId: msgOrRef.channelId,
					messageId: msgOrRef.messageId
				};
			}else {
				if (this.core.sheetRef?.messageId !== msgOrRef.id) changed = true;
				this.core.sheetRef = {
					guildId: msgOrRef.guildId ?? undefined,
					channelId: msgOrRef.channelId,
					messageId: msgOrRef.id
				};
			}
		}else {
			if (this.core.sheetRef) changed = true;
			this.core.sheetRef = undefined;
		}
		if (this.core.messageId) delete this.core.messageId;
		return changed;
	}
	public get hasSheetRef(): boolean { return this.core.sheetRef !== undefined || this.core.messageId !== undefined; }

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

	/** Returns a list of sections that have data to render. */
	public abstract getValidSections<V extends string>(): V[];

	/** Returns a list of views that have sections with data to render. */
	public abstract getValidViews<V extends string>(): V[];

	/** Returns the character name used in toHtml(). */
	public abstract toHtmlName(): string;

	/** Returns the character "sheet" formatted in HTML. */
	public abstract toHtml(): string;

	/** Returns the character "sheet" formatted in HTML. */
	public abstract toHtml<V>(sections: V[]): string;
}

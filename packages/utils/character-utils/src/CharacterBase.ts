import { HasIdCore, type IdCore } from "@rsc-utils/class-utils";
import type { Optional } from "@rsc-utils/core-utils";

type MessageReference = { channelId:string; guildId:string|undefined; messageId:string|undefined; };

type TSimpleMap = { [key:string]:any; };

export interface CharacterBaseCore<T extends string = string> extends IdCore<T> {

	/** the id of the Sage character used for dialog */
	characterId?: string;

	/** name of the character */
	name?: string;

	/** @deprecated sheetRef will be used going forward */
	messageId?: string;

	/** a map of state data used by the char sheet linked in .sheetRef */
	sheet?: TSimpleMap;

	/** message where the char sheet is posted */
	sheetRef?: MessageReference;

	/** link to the character's user */
	userId?: string;
}


type OldCore = CharacterBaseCore & {
	/** @deprecated use userId */
	userDid?: string;
}
function updateCore<T extends CharacterBaseCore>(core: OldCore): T {
	if (core.userDid) {
		core.userId = core.userDid;
		delete core.userDid;
	}
	return core as T;
}

export abstract class CharacterBase<T extends CharacterBaseCore<U> = CharacterBaseCore<any>, U extends string = string> extends HasIdCore<T, U> {
	public constructor(core: T) { super(updateCore(core)); }

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
	public setSheetRef(msgRef: Optional<MessageReference>): boolean {
		let changed = false;
		if (msgRef) {
			const { channelId, guildId, messageId } = msgRef;

			// see if we have any changes
			const { sheetRef } = this.core;
			changed = !sheetRef
				|| sheetRef.guildId !== guildId
				|| sheetRef.channelId !== channelId
				|| sheetRef.messageId !== messageId;

			this.core.sheetRef = { channelId, guildId, messageId };

		}else {
			changed = !!this.core.sheetRef;
			this.core.sheetRef = undefined;
		}
		if (this.core.messageId) delete this.core.messageId;
		return changed;
	}
	public get hasSheetRef(): boolean { return this.core.sheetRef !== undefined || this.core.messageId !== undefined; }

	/** The id value from the characterId's User. */
	public get userId(): string { return this.core.userId ?? ""; }
	public set userId(userId: Optional<string>) { this.core.userId = userId ?? undefined; }

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

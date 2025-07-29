import { HasIdCore, isNullOrUndefined, type IdCore, type Optional } from "@rsc-utils/core-utils";

type MessageReference = { channelId:string; guildId:string|undefined; messageId:string|undefined; };

/** Represents the different names we might have/use for a character. */
type CharacterNames = {
	/** Character's name. */
	name?: string;

	/** (Optional) Character's nickname. */
	nick?: string;

	/** (Optional) A short name used to access the character via commands. */
	alias?: string;

	/** (Optional) Name of the player. */
	player?: string;
};

export interface CharacterBaseCore<T extends string = string> extends IdCore<T> {

	/** @deprecated the id of the Sage character used for dialog; should be just using this.id */
	characterId?: string;

	/** name of the character */
	names?: CharacterNames;

	/** @deprecated sheetRef will be used going forward */
	messageId?: string;

	/** a map of state data used by the char sheet linked in .sheetRef */
	sheet?: Record<string, any>;

	/** message where the char sheet is posted */
	sheetRef?: MessageReference;

	/** link to the character's user */
	userId?: string;
}

type OldCore = CharacterBaseCore & {
	/** @deprecated use names.name */
	name?: string;
	/** @deprecated use userId */
	userDid?: string;
}
function updateCore<T extends CharacterBaseCore>(core: OldCore): T {
	if (core.name?.trim()) {
		core.names = { name:core.name };
	}
	if (core.userDid) {
		core.userId = core.userDid;
		delete core.userDid;
	}
	return core as T;
}

export abstract class CharacterBase<T extends CharacterBaseCore<U> = CharacterBaseCore<any>, U extends string = string> extends HasIdCore<T, U> {
	public constructor(core: T) {
		super(updateCore(core));
	}

	//#region names

	/** Returns all the different names for a character */
	protected get names(): CharacterNames { return this.core.names ??= {}; };

	/** Convenient access to the default character name */
	public get name(): string { return this.names.name ?? ""; }
	public set name(name: string) { this.names.name = name; }

	public get nick(): string { return this.names.nick ?? ""; }
	public set nick(nick: string) { this.names.nick = nick; }

	public get alias(): string { return this.names.alias ?? ""; }
	public set alias(alias: string) { this.names.alias = alias; }

	public get player(): string { return this.names.player ?? ""; }
	public set player(player: string) { this.names.player = player; }

	//#endregion

	/** @deprecated The characterId value from the Game or User. */
	public get characterId(): string { return this.core.characterId ?? ""; }
	/** @deprecated */
	public set characterId(characterId: Optional<string>) { this.core.characterId = characterId ?? undefined; }

	/** The MessageReference where the character sheet is posted. */
	public get sheetRef(): MessageReference | undefined {
		if (this.core.sheetRef) return this.core.sheetRef;
		// this allows us to function from old/inadequate data
		if (this.core.messageId) return { messageId:this.core.messageId } as MessageReference;
		return undefined;
	}
	public set sheetRef(msgRef: MessageReference | undefined) {
		this.core.sheetRef = msgRef ?? undefined;
		delete this.core.messageId;
	}

	/** Returns true if .sheetRef is not undefined. */
	public get hasSheetRef(): boolean {
		return this.core.sheetRef !== undefined || this.core.messageId !== undefined;
	}

	/** Updates sheetRef and returns true if the value was changed, false otherwise. */
	public setSheetRef(msgRef: MessageReference | undefined): boolean {
		const match = this.sheetsMatch(msgRef);
		this.sheetRef = msgRef;
		return !match;
	}

	/** Compares the given msgRef to .sheetRef and returns true if they are the same. */
	public sheetsMatch(msgRef: MessageReference | undefined) {
		const { sheetRef } = this;
		if (!sheetRef || !msgRef) return false;
		return sheetRef.channelId === msgRef.channelId
			&& sheetRef.guildId === msgRef.guildId
			&& sheetRef.messageId === msgRef.messageId;
	}

	/** The id value from the characterId's User. */
	public get userId(): string { return this.core.userId ?? ""; }
	public set userId(userId: Optional<string>) { this.core.userId = userId ?? undefined; }

	//#region interactive char sheet
	private get sheet(): Record<string, any> {
		return this.core.sheet ??= {};
	}
	public getSheetValue<V = string>(key: string): V | undefined {
		return this.sheet[key];
	}
	public setSheetValue<V>(key: string, value: V): void {
		if (isNullOrUndefined(value)) {
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

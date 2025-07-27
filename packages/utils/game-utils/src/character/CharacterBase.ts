import { HasIdCore, type IdCore, type Optional } from "@rsc-utils/core-utils";

type MessageReference = { channelId:string; guildId:string|undefined; messageId:string|undefined; };

type TSimpleMap = { [key:string]:any; };

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

	/** name of the character */
	names?: CharacterNames;

	/** a map of state data used by the char sheet linked in .sheetRef */
	sheet?: TSimpleMap;

	/** message where the char sheet is posted */
	sheetRef?: MessageReference;

	/** link to the character's user */
	userId?: string;
}

export abstract class CharacterBase<T extends CharacterBaseCore<U> = CharacterBaseCore<any>, U extends string = string> extends HasIdCore<T, U> {
	// public constructor(core: T) { super(core); }

	//#region names

	public get names(): CharacterNames { return this.core.names ?? (this.core.names = { }); }

	public get name(): string { return this.core.names?.name ?? ""; }
	public set name(name: string) { this.names.name = name; }

	public get nick(): string { return this.core.names?.nick ?? ""; }
	public set nick(nick: string) { this.names.nick = nick; }

	public get alias(): string { return this.core.names?.alias ?? ""; }
	public set alias(alias: string) { this.names.alias = alias; }

	public get player(): string { return this.core.names?.player ?? ""; }
	public set player(player: string) { this.names.player = player; }

	//#endregion

	/** The messageId value from the Message where the character sheet is posted. */
	public get sheetRef(): MessageReference | undefined { return this.core.sheetRef; }
	public set sheetRef(sheetRef: Optional<MessageReference>) { this.core.sheetRef = sheetRef ?? undefined; }

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

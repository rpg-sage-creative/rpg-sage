import { type DialogOptions, DialogPostType, DiceCritMethodType, type DiceOptions, DiceOutputType, DicePostType, DiceSecretMethodType, DiceSortType, type GameOptions, GameSystemType, parseEnum, type SageChannelOptions, SageChannelType, type ServerOptions, type SystemOptions } from "@rsc-sage/types";
import { Color, type HexColorString } from "@rsc-utils/color-utils";
import { type Args, type EnumLike, isDefined, isEmpty, isSnowflake, isUuid, type Optional, type Snowflake, type UUID } from "@rsc-utils/core-utils";
import { type MessageChannel, parseIds } from "@rsc-utils/discord-utils";
import { type VALID_URL } from "@rsc-utils/io-utils";
import { createUrlRegex, unwrap } from "@rsc-utils/string-utils";
import type { Attachment, Role, User } from "discord.js";
import type { SageCommand } from "./SageCommand.js";

/** An object containing names. */
export type Names = {
	/** Name of the parent character.  */
	charName?: string;
	/** Old name when renaming. */
	oldName?: string;
	/** Name of the character. */
	name?: string;
	/** New name when renaming. */
	newName?: string;
	/** Count of names present in the object. */
	count?: number;
	/** true if oldName and newName are present */
	isRename?: boolean;
};

export abstract class SageCommandArgs<T extends SageCommand> {
	public constructor(public sageCommand: T) { }

	/** @todo determine if we really need this ... is this a memory leak we /actually/ have? */
	public clear(): void { this.sageCommand = undefined!; }

	//#region basic get/has

	/** Returns a list of all argument keys passed to the command. */
	public abstract keys(): string[];

	/** Returns keys partitioned into valid/invalid */
	public validateKeys(validKeys: string[]) {
		const toLower = (key: string) => key.toLowerCase();
		const allKeysLower = this.keys().map(toLower);
		const validKeysLower = validKeys.map(toLower);
		return allKeysLower.reduce((keys, key) => {
			if (validKeysLower.includes(key)) {
				keys.hasValidKeys = true;
				keys.validKeys.push(validKeys[validKeysLower.indexOf(key)]);
			}else {
				keys.hasInvalidKeys = true;
				keys.invalidKeys.push(key);
			}
			return keys;
		}, { hasValidKeys:false, validKeys:[] as string[], hasInvalidKeys:false, invalidKeys:[] as string[] });
	}

	/** Returns true if an argument matches the given key, regardless of value. */
	public abstract hasKey(key: string): boolean;

	/** Returns true if the argument matching the given key has the value "unset". */
	public abstract hasUnset(key: string): boolean;

	/**
	 * Gets the named option as an attachment.
	 * Returns undefined if not found.
	 * Returns null if not a valid attachment or "unset".
	 */
	public abstract getAttachment(name: string): Optional<Attachment>;

	/** Returns true if getAttachment(name) is not null and not undefined. */
	public hasAttachment(name: string): boolean {
		return isDefined(this.getAttachment(name));
	}

	/**
	 * Gets the named option as an attachment with contentType of "application/pdf".
	 * Returns undefined if not found.
	 * Returns null if not a valid attachment or "unset".
	 */
		public getAttachmentPdf(name: string): Optional<Attachment> {
		const attachment = this.getAttachment(name);
		if (!attachment) return attachment;
		return attachment.contentType === "application/pdf" ? attachment : null;
	}

	/** Returns true if getAttachmentPdf(name) is not null and not undefined. */
	public hasAttachmentPdf(name: string): boolean {
		return isDefined(this.getAttachmentPdf(name));
	}

	/**
	 * Gets the named option as a boolean.
	 * Returns undefined if not found.
	 * Returns null if not a valid boolean or "unset".
	 */
	public abstract getBoolean(key: string): Optional<boolean>;

	/** Returns true if getBoolean(name) is not null and not undefined. */
	public hasBoolean(key: string): boolean {
		return isDefined(this.getBoolean(key));
	}

	/**
	 * Gets the named option as a GuildBasedChannel.
	 * Returns undefined if not found.
	 * Returns null if not a valid GuildBasedChannel or "unset".
	 */
	public abstract getChannel(name: string): Optional<MessageChannel>;

	/** Returns true if getChannel(name) is not null and not undefined. */
	public hasChannel(name: string): boolean {
		return isDefined(this.getChannel(name));
	}

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	public getChannelId(name: string): Optional<Snowflake> {
		const channel = this.getChannel(name);
		return channel ? channel.id as Snowflake : channel;
	}

	/** Returns true if getChannelId(name) is not null and not undefined. */
	public hasChannelId(name: string): boolean {
		return isDefined(this.getChannelId(name));
	}

	/** Returns an array of channelIds passed in for the given argument. */
	public getChannelIds(name: string): Snowflake[] {
		const channelIdSet = new Set<Snowflake>();

		if (this.hasChannel(name)) {
			channelIdSet.add(this.getChannelId(name)!);
		}

		const stringValue = this.getString(name);
		if (stringValue) {
			parseIds(stringValue, "channel").forEach(channelId => channelIdSet.add(channelId));
		}

		return [...channelIdSet];
	}

	/** @deprecated */
	public abstract findEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>): Optional<V>;

	/**
	 * Gets the named option as a value from the given enum type.
	 * Returns undefined if not found.
	 * Returns null if not a valid enum value or "unset".
	 */
	public getEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): Optional<V> {
		const string = this.getString(name);
		if (isDefined(string)) {
			return parseEnum(type, string) ?? null;
		}
		return string;
	}

	/** Returns true if getEnum(type, name) is not null and not undefined. */
	public hasEnum<K extends string = string, V extends number = number>(type: EnumLike<K, V>, name: string): boolean {
		return isDefined(this.getEnum(type, name));
	}

	/**
	 * Gets the named option as a number.
	 * Returns undefined if not found.
	 * Returns null if not a valid number or "unset".
	 */
	public abstract getNumber(name: string): Optional<number>;

	/** Returns true if getNumber(name) is not null and not undefined. */
	public hasNumber(name: string): boolean {
		return isDefined(this.getNumber(name));
	}

	/**
	 * Gets the named option as a Role.
	 * Returns undefined if not found.
	 * Returns null if not a valid Role or "unset".
	 */
	public abstract getRole(name: string): Optional<Role>;

	/** Returns true if getRole(name) is not null and not undefined. */
	public hasRole(name: string): boolean {
		return isDefined(this.getRole(name));
	}

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	public getRoleId(name: string): Optional<Snowflake> {
		const role = this.getRole(name);
		return role ? role.id as Snowflake : role;
	}

	/** Returns true if getRoleId(name) is not null and not undefined. */
	public hasRoleId(name: string): boolean {
		return isDefined(this.getRoleId(name));
	}

	/**
	 * Gets the named option as a string.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public abstract getString<U extends string = string>(name: string): Optional<U>;

	/** Returns true if getString(name) is not null and not undefined. */
	public hasString(name: string): boolean;
	/** Returns true if the argument was given the value passed. */
	public hasString(name: string, value: string): boolean;
	/** Returns true if the argument matches the given regex. */
	public hasString(name: string, regex: RegExp): boolean;
	public hasString(name: string, value?: string | RegExp): boolean {
		const argValue = this.getString(name);
		if (!argValue) return false;
		if (value) {
			if (typeof(value) === "string") return argValue === value;
			return value.test(argValue);
		}
		return true;
	}

	/**
	 * Gets the named option as an unwrapped url (meaning without <>).
	 * Returns undefined if not found.
	 * Returns null if empty, invalid or "unset".
	 */
	public getUrl(name: string): VALID_URL | null | undefined {
		const url = this.getString(name);
		if (isDefined(url)) {
			const regex = createUrlRegex({ anchored:true, wrapOptional:true, wrapChars:"<>" });
			return regex.test(url) ? unwrap(url, "<>") as VALID_URL : null;
		}
		return url;
	}

	/** Returns true if getUrl(name) is not null and not undefined. */
	public hasUrl(name: string): boolean {
		return isDefined(this.getUrl(name));
	}

	/**
	 * Gets the named option as a User.
	 * Returns undefined if not found.
	 * Returns null if not a valid User or "unset".
	 */
	public abstract getUser(name: string): Optional<User>;

	/** Returns true if getUser(name) is not null and not undefined. */
	public hasUser(name: string): boolean {
		return isDefined(this.getUser(name));
	}

	/**
	 * Gets the named option as a Snowflake.
	 * Returns undefined if not found.
	 * Returns null if not a valid Snowflake or "unset".
	 */
	public getUserId(name: string): Optional<Snowflake> {
		const user = this.getUser(name);
		return user ? user.id as Snowflake : user;
	}

	/** Returns true if getUserId(name) is not null and not undefined. */
	public hasUserId(name: string): boolean {
		return isDefined(this.getUserId(name));
	}

	/** Returns an array of user snowflakes passed in for the given argument. Optionally finds roles and gets all the users from the roles. */
	public async getUserIds(name: string, expandRoles?: boolean): Promise<Snowflake[]> {
		const userIdSet = new Set<Snowflake>();
		const expandRoleId = async (roleId: string) => {
			const guildRole = await this.sageCommand.discord.fetchGuildRole(roleId);
			if (guildRole) {
				guildRole.members.forEach(guildMember => userIdSet.add(guildMember.id as Snowflake));
			}
		};

		if (this.hasUser(name)) {
			userIdSet.add(this.getUserId(name)!);
		}

		if (this.hasRole(name)) {
			await expandRoleId(this.getRoleId(name)!);
		}

		const stringValue = this.getString(name);
		if (stringValue) {
			parseIds(stringValue, "user").forEach(userId => userIdSet.add(userId));
			if (expandRoles) {
				const roleIds = parseIds(stringValue, "role");
				for (const roleId of roleIds) {
					await expandRoleId(roleId);
				}
			}
		}

		return [...userIdSet];
	}

	/**
	 * Gets the named option as a VALID_UUID.
	 * Returns undefined if not found.
	 * Returns null if empty or "unset".
	 */
	public getUuid(name: string): Optional<UUID> {
		const value = this.getString(name);
		if (value) {
			return isUuid(value) ? value : null;
		}
		return value as null | undefined;
	}

	/** Returns true if getUuid(name) is not null and not undefined. */
	public hasUuid(name: string): boolean {
		return isDefined(this.getUuid(name));
	}

	//#endregion

	//#region complex get

	public getChannelOptions(): Args<SageChannelOptions> | undefined {
		const channelOptions = {
			...this.getDialogOptions(),
			...this.getDiceOptions(),
			...this.getSystemOptions(),
			type: this.getEnum(SageChannelType, "type"),
		};
		if (isEmpty(channelOptions)) {
			return undefined;
		}
		return channelOptions;
	}

	public getColor(key: string): Color | null | undefined {
		const color = this.getString(key);
		if (isDefined(color)) {
			return Color.from(color) ?? null;
		}
		return color;
	}

	public getDialogOptions(): Args<DialogOptions> | undefined {
		const dialogOptions = {
			dialogPostType: this.getEnum(DialogPostType, "dialogPost"),
			gmCharacterName: this.getString("gmCharName") ?? this.getString("gmName"),
			sendDialogTo: this.getChannelId("dialogTo"),
		};
		if (isEmpty(dialogOptions)) {
			return undefined;
		}
		return dialogOptions;
	}

	public getDiceOptions(): Args<DiceOptions> | undefined {
		const diceOptions = {
			diceCritMethodType: this.getEnum(DiceCritMethodType, "diceCrit"),
			diceOutputType: this.getEnum(DiceOutputType, "diceOutput"),
			dicePostType: this.getEnum(DicePostType, "dicePost"),
			diceSecretMethodType: this.getEnum(DiceSecretMethodType, "diceSecret"),
			diceSortType: this.getEnum(DiceSortType, "diceSort"),
			sendDiceTo: this.getChannelId("diceTo"),
		};
		if (isEmpty(diceOptions)) {
			return undefined;
		}
		return diceOptions;
	}

	public getHexColorString(key: string): HexColorString | null | undefined {
		const color = this.getColor(key);
		if (color) {
			return color.hex ?? null;
		}
		return color;
	}

	/** Returns GameOptions pulled from command arguments. */
	public getGameOptions(): Args<GameOptions> | undefined {
		const gameOptions = {
			...this.getDialogOptions(),
			...this.getDiceOptions(),
			...this.getSystemOptions(),
			name: this.getString("name"),
		};
		if (isEmpty(gameOptions)) {
			return undefined;
		}
		return gameOptions;
	}

	public getIdType(key: string): Snowflake | UUID | null | undefined {
		const id = this.getString(key);
		if (id) {
			return isSnowflake(id) || isUuid(id) ? id : null;
		}
		return id as null;
	}

	/** Gets all the different names that might be passed into the command. */
	public getNames(): Names {
		const charName = this.getString("charName") ?? undefined;
		const oldName = this.getString("oldName") ?? undefined;
		const name = this.getString("name") ?? undefined;
		const newName = this.getString("newName") ?? undefined;
		const count = (charName ? 1 : 0) + (oldName ? 1 : 0) + (name ? 1 : 0) + (newName ? 1 : 0);
		const isRename = !!oldName && !!newName;
		return { charName, oldName, name, newName, count, isRename };
	}

	public getServerOptions(): Args<ServerOptions> | undefined {
		const serverOptions = {
			...this.getDialogOptions(),
			...this.getDiceOptions(),
			...this.getSystemOptions(),
		};
		if (isEmpty(serverOptions)) {
			return undefined;
		}
		return serverOptions;
	}

	public getSystemOptions(): Args<SystemOptions> | undefined {
		const serverOptions = {
			gameSystemType: this.getEnum(GameSystemType, "gameSystem") ?? this.getEnum(GameSystemType, "system"),
		};
		if (isEmpty(serverOptions)) {
			return undefined;
		}
		return serverOptions;
	}

	//#endregion
}

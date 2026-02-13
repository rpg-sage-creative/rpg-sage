import type { Snowflake } from "@rsc-utils/core-utils";
import type { SageCore } from "../../index.js";

export type SageMessageReferenceCoreV1 = Omit<SageCore<"Message", Snowflake>, "did" | "uuid"> & {

	/** the id of the channel the message is in */
	channelId: Snowflake;

	/** the id of the character the message is from */
	characterId: Snowflake;

	/** the id of the game the message is in */
	gameId?: Snowflake;

	/** the id of the guild the message is in */
	guildId: Snowflake;

	// id from SageCore

	/** the ids of the messages from a dialog that was too long and split over multiple messages */
	messageIds: Snowflake[];

	// objectType from SageCore

	/** the timestamp of the message */
	ts: number;

	/** the id of the user that posted the dialog */
	userId: Snowflake;

	// ver from SageCore

};

export const SageMessageReferenceV1Keys: (keyof SageMessageReferenceCoreV1)[] = [
	"channelId",
	"characterId",
	"gameId",
	"guildId",
	"id",           // id from SageCore
	"messageIds",
	"objectType",   // id from SageCore
	"ts",
	"userId",
	"ver",          // id from SageCore
];

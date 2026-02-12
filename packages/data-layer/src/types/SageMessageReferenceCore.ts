import type { Snowflake } from "@rsc-utils/core-utils";

export type SageMessageReferenceCore = {

	/** the id of the channel the message is in */
	channelId: Snowflake;

	/** the id of the character the message is from */
	characterId: Snowflake;

	/** the id of the game the message is in */
	gameId?: Snowflake;

	/** the id of the guild the message is in */
	guildId: Snowflake;

	/** the id of the message */
	id: Snowflake;

	/** the ids of the messages from a dialog that was too long and split over multiple messages */
	messageIds: Snowflake[];

	/** All SageCore objects include id, objectType, and ver */
	objectType: "Message";

	/** the timestamp of the message */
	ts: number;

	/** the id of the user that posted the dialog */
	userId: Snowflake;

	/** All SageCore objects include id, objectType, and ver */
	ver: number;
};
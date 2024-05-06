/** Contains the parts of a formatted dice roll ready to be sent in a message. */
export type FormattedDiceOutput = {
	/** true if the secret flag was detected */
	hasSecret: boolean;

	/** content to be sent as a post */
	postContent?: string;

	/** content to be sent as an embed */
	embedContent?: string;

	/** text sent to non-gm channel in the place of hidden roll results */
	notificationContent: string;
};
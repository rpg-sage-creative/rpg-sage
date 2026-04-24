type Attachment = unknown;
type AttachmentBuilder = unknown;
export type AttachmentResolvable = Attachment | AttachmentBuilder;

type SplitOptions = unknown;
type SupportedMessagesChannel = unknown;

type SageCache = {
	canSendMessageToChannel: (channel: SupportedMessagesChannel) => Promise<boolean>;
	user: { sagePostType: number; };
};

type SendToArgs = {
	avatarURL?: string;
	// components?: ActionRow<MessageActionRowComponent>[];
	content?: string;
	embedContent?: string;
	// embeds?: EmbedResolvable[];
	files?: AttachmentResolvable[];
	replyingTo?: string;
	sageCache: SageCache;
	// target: SupportedTarget | Webhook;
	// threadId?: Snowflake;
	username?: string;
};

export async function sendTo(sendArgs: SendToArgs, splitOptions: SplitOptions): Promise<undefined>;
export async function sendTo(sendArgs: SendToArgs, splitOptions: SplitOptions, catchHandler: (err: unknown) => void): Promise<undefined>;
export async function sendTo(sendArgs: SendToArgs, splitOptions: SplitOptions, catchHandler?: (err: unknown) => void): Promise<undefined> {
	sendArgs;
	splitOptions;
	catchHandler;
	return undefined;
}


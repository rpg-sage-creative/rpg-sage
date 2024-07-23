import { error, type Optional, warn } from "@rsc-utils/core-utils";
import { type RenderableContentResolvable } from "@rsc-utils/render-utils";
import type { BaseMessageOptions, InteractionReplyOptions, Message, MessageEditOptions } from "discord.js";
import { deleteMessage, isDeletable } from "../../discord/deletedMessages.js";
import type { SageCommand, TSendArgs } from "./SageCommand.js";
import { addMessageDeleteButton, includeDeleteButton } from "./utils/deleteButton.js";

/*
startThinking
- message: post thinking, save as thinkingMessage
- interaction: defer, fetch, save as thinkingMessage

reply
- thinking: edit thinking
- message: reply to message
- interaction: reply to interaction

editReply
- edit if a reply exists
- reply if one doesn't exist

send
- send message

editLast?
- edit the last message sent

stopThinking
*/

function errorReturnPromiseResolve<T = any>(err: unknown): Promise<T> {
	error(err);
	return Promise.resolve() as Promise<T>;
}

async function deleteIfNotThenReturnNull(message: Optional<Message>, id?: string): Promise<Optional<Message>> {
	if (message) {
		if (message.id !== id) {
			await deleteMessage(message);
		}
		return null;
	}
	return message;
}

type ResolveArgs = { appendSpinner?:boolean; fetchReply?:boolean; };

/**
 * A temporary placeholder for new send/reply logic.
 * SageCommand and its children need to be rewritten so that they all follow the same send/reply/edit logic.
 */
export class ReplyStack {
	public static readonly SpinnerEmoji = `<a:purple_spinner:1247285832822554738>`;

	public constructor(public sageCommand: SageCommand, private deletableBy = sageCommand.authorDid) { }

	//#region flags

	public get deferred(): boolean {
		return this.deferMessage !== undefined
			|| (this.sageCommand.isSageInteraction("REPLIABLE") && this.sageCommand.interaction.deferred === true);
	}

	public get deletable(): boolean {
		return this.deletableBy ? !this.ephemeral : false;
	}

	private _ephemeral: boolean | undefined;
	public get ephemeral(): boolean {
		return this._ephemeral
			?? (this._ephemeral = this.sageCommand.isSageInteraction("REPLIABLE") && this.sageCommand.interaction.ephemeral === true);
	 }

	public get thinking(): boolean {
		return !!this.thinkingMessage;
	}

	public get replied(): boolean {
		return this.replyMessage !== undefined
			|| (this.sageCommand.isSageInteraction("REPLIABLE") && this.sageCommand.interaction.replied === true);
	}

	public get sent(): boolean {
		return this.lastMessage !== undefined;
	}

	//#endregion

	//#region replyStack

	private replyStack?: Promise<any>;
	private pushToReplyStack<T = any>(fn: () => Promise<T>): Promise<T> {
		if (!this.replyStack) {
			this.replyStack = Promise.resolve();
		}
		const promise = this.replyStack.then(fn, errorReturnPromiseResolve);
		this.replyStack = promise;
		return promise;
	}

	//#endregion

	//#region thinking

	/*
	undefined = startThinking() not called yet
	message = currently thinking
	null = stopThinking() was called
	*/
	private thinkingMessage: Message | undefined | null;

	private async _startThinking(): Promise<void> {
		// if we have a message, don't make a new one
		if (this.thinkingMessage) return; //NOSONAR

		// create the send/reply args
		const content = `RPG Sage is thinking ... ${ReplyStack.SpinnerEmoji}`;
		const replyArgs = this.deletable
			 ? includeDeleteButton({ content }, this.deletableBy)
			 : { content };

		// if we have a null thinkingMessage or we have already deferred then we must use dChannel.send
		if (this.thinkingMessage === null || this.deferred || this.replied) {
			const message = await this.sageCommand.dChannel?.send(replyArgs);
			this.thinkingMessage = message ?? null;
			return;
		}

		// we haven't deferred yet, reply to the original command
		if (this.sageCommand.isSageMessage()) {
			this.thinkingMessage = await this.sageCommand.message.reply(replyArgs);

		}else if (this.sageCommand.isSageInteraction("REPLIABLE")) {
			await this._defer();
			this.thinkingMessage = this.deferMessage;
			if (this.deletable) {
				await addMessageDeleteButton(this.thinkingMessage, this.deletableBy);
			}
		}else {
			warn(`startThinking(): not isSageMessage() && !isSageInteraction("REPLIABLE")`);
		}
	}
	public startThinking(): Promise<void> {
		return this.pushToReplyStack(async () => this._startThinking());
	}

	private async _stopThinking(): Promise<void> {
		this.thinkingMessage = await deleteIfNotThenReturnNull(this.thinkingMessage, this.lastMessage?.id);
	}
	public stopThinking(): Promise<void> {
		return this.pushToReplyStack(async () => this._stopThinking());
	}

	//#endregion

	//#region defer

	private deferMessage: Message | undefined | null;

	private async _defer(): Promise<void> {
		if (!this.deferred && !this.replied && this.sageCommand.isSageInteraction("REPLIABLE")) {
			const { interaction } = this.sageCommand;
			if ("deferUpdate" in interaction) {
				this.deferMessage = await interaction.deferUpdate({ fetchReply:true }) as Message;
			}else {
				this.deferMessage = await interaction.deferReply({ fetchReply:true }) as Message;
			}
		}
	}
	public defer(): Promise<void> {
		return this.pushToReplyStack(async () => this._defer());
	}

	private async _deleteDefer(): Promise<void> {
		if (this.deferMessage && this.sageCommand.isSageInteraction("REPLIABLE")) {
			await this.sageCommand.interaction.deleteReply(this.deferMessage);
			this.deferMessage = null;
		}
	}
	public deleteDefer(): Promise<void> {
		return this.pushToReplyStack(async () => this._deleteDefer());
	}

	private async _deferAndDelete(): Promise<void> {
		await this._defer();
		await this._deleteDefer();
	}
	public deferAndDelete(): Promise<void> {
		return this.pushToReplyStack(async () => this._deferAndDelete());
	}

	//#endregion


	private resolveArgs(renderable: RenderableContentResolvable | TSendArgs, options?: { appendSpinner?:boolean; }): BaseMessageOptions;
	private resolveArgs(renderable: RenderableContentResolvable | TSendArgs, options: { fetchReply:true }): InteractionReplyOptions & { fetchReply:true };
	private resolveArgs(renderable: RenderableContentResolvable | TSendArgs, options?: ResolveArgs): BaseMessageOptions | InteractionReplyOptions {
		const args = typeof(renderable) === "string" ? { content:renderable } : renderable;
		const messageOptions = this.sageCommand.resolveToOptions(args);
		if (options?.appendSpinner) {
			messageOptions.content = `${messageOptions.content ?? ""} ${ReplyStack.SpinnerEmoji}`.trim();
		}
		if (options?.fetchReply) {
			(messageOptions as InteractionReplyOptions).fetchReply = true;
		}
		if (this.deletable) {
			return includeDeleteButton(messageOptions, this.deletableBy);
		}
		return messageOptions;
	}

	//#region reply

	private replyMessage: Message | undefined | null;

	/** The reply logic without pushing to the stack. */
	private async _reply(_args: RenderableContentResolvable | TSendArgs, replyOpts?: ResolveArgs): Promise<Message | undefined> {
		// we have already reply, treat this as a send instead
		if (this.deferred || this.replied) {
			return this._send(_args, replyOpts);

		// this is a SageMessage, so reply to the posted message
		}else if (this.sageCommand.isSageMessage()) {
			const replyArgs = this.resolveArgs(_args);
			this.replyMessage = await this.sageCommand.message.reply(replyArgs);

		// this is a repliable SageInteraction, so check the interaction
		}else if (this.sageCommand.isSageInteraction("REPLIABLE")) {
			// it should be safe to use the interaction reply mechanism
			const { interaction } = this.sageCommand;
			const replyArgs = this.resolveArgs(_args, { fetchReply:true });
			this.replyMessage = await interaction.reply(replyArgs) as Message;

		}else {
			warn(`ReplyStack._reply ELSE!?`);
		}

		// we shouldn't get here, but return undefined just in case
		return this.replyMessage ?? undefined;
	}
	public reply(contentOrArgs: RenderableContentResolvable | TSendArgs, appendSpinner?: boolean): Promise<Message | undefined> {
		return this.pushToReplyStack(async () => this._reply(contentOrArgs, { appendSpinner }));
	}

	private async _editReply(_args: RenderableContentResolvable | TSendArgs, opts?: ResolveArgs): Promise<void> {
		// to avoid interaction conflicts, edit the message directly instead of through the interaction
		if (isDeletable(this.replyMessage)) {
			const resolvedArgs = this.resolveArgs(_args, opts);
			const components = this.replyMessage.components;
			const editArgs = { ...resolvedArgs, components } as MessageEditOptions;
			await this.replyMessage.edit(editArgs);

		// we don't have a valid reply to edit, so treat as a reply instead
		}else {
			await this._reply(_args);
		}
	}
	public editReply(contentOrArgs: RenderableContentResolvable | TSendArgs, appendSpinner?: boolean): Promise<void> {
		return this.pushToReplyStack(async () => this._editReply(contentOrArgs, { appendSpinner }));
	}

	private async _deleteReply(): Promise<void> {
		if (this.replyMessage) {
			await deleteMessage(this.replyMessage);
			this.replyMessage = null;
		}
	}
	public deleteReply(): Promise<void> {
		return this.pushToReplyStack(async () => this._deleteReply());
	}

	//#endregion reply

	//#region send

	private lastMessage: Message | undefined | null;

	private async _send(args: RenderableContentResolvable | TSendArgs, opts?: ResolveArgs): Promise<Message | undefined> {
		// send directly to the discord channel, bypassing interactions
		if (this.sageCommand.dChannel) {
			const sendOptions = this.resolveArgs(args, opts);
			this.lastMessage = await this.sageCommand.dChannel.send(sendOptions);
		}else {
			warn(`ReplyStack._send w/o a sageCommand.dChannel!`);
		}

		return this.lastMessage ?? undefined;
	}
	public send(contentOrArgs: RenderableContentResolvable | TSendArgs, appendSpinner?: boolean): Promise<Message | undefined> {
		return this.pushToReplyStack(async () => this._send(contentOrArgs, { appendSpinner }));
	}

	private async _deleteLast() {
		if (this.lastMessage) {
			await deleteMessage(this.lastMessage);
			this.lastMessage = null;
		}
	}
	public deleteLast(): Promise<void> {
		return this.pushToReplyStack(async () => this._deleteLast());
	}

	public async editLast(content: string): Promise<void> {
		const msg = this.lastMessage;
		if (msg) {
			const { embeds, components } = msg;
			await msg.edit({ content, embeds, components });
		}
	}

	//#endregion

	//#region whisper

	private async _whisper(contentOrArgs: TSendArgs | RenderableContentResolvable): Promise<void> {
		const updated = await this._reply(contentOrArgs);
		if (updated) {
			// whisper is intended to be the only response, so we clear out all the others
			this.thinkingMessage = await deleteIfNotThenReturnNull(this.thinkingMessage, updated.id);
			this.deferMessage = await deleteIfNotThenReturnNull(this.deferMessage, updated.id);
			this.replyMessage = await deleteIfNotThenReturnNull(this.replyMessage, updated.id);
			this.lastMessage = await deleteIfNotThenReturnNull(this.lastMessage, updated.id);
		}
	}

	public whisper(contentOrArgs: TSendArgs | RenderableContentResolvable): Promise<void> {
		return this.pushToReplyStack(async () => this._whisper(contentOrArgs));
	}

	//#endregion
}

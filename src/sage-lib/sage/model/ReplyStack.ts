import type { BaseMessageOptions, InteractionReplyOptions, Message } from "discord.js";
import { deleteMessage, isDeletable } from "../../discord/deletedMessages.js";
import type { SageCommand } from "./SageCommand.js";
import { addMessageDeleteButton, includeDeleteButton } from "./utils/deleteButton.js";

type Options = {
	updateLast: boolean;
	updateReply: boolean;
};

/**
 * A temporary placeholder for new send/reply logic.
 * SageCommand and its children need to be rewritten so that they all follow the same send/reply/edit logic.
 */
export class ReplyStack {
	public static readonly SpinnerEmoji = `<a:purple_spinner:1247285832822554738>`;

	private replyStack?: Promise<any>;
	private pushToReplyStack<T = any>(fn: () => Promise<T>): Promise<T> {
		if (!this.replyStack) {
			this.replyStack = Promise.resolve();
		}
		const promise = this.replyStack.then(fn);
		this.replyStack = promise;
		return promise;
	}

	// public lastMessage: Message | undefined;
	public replyMessage: Message | undefined;
	// public messages: Message[];
	private async processMessage(message: Message | undefined, options: Options): Promise<Message | undefined> {
		if (message) {
			/** @todo if we track multiple messages: this.messages.push(message) */
			/** @todo if we track last message: if (options.updateLast) this.lastMessage = message */
			if (options.updateReply) {
				this.replyMessage = message;
			}
			if (this.deletableBy) {
				const ephemeral = this.sageCommand.isSageInteraction("REPLIABLE") && this.sageCommand.interaction.ephemeral;
				if (!ephemeral) {
					await addMessageDeleteButton(message, this.deletableBy);
				}
			}
			return message;
		}
		return undefined;
	}

	private createArgs<T extends BaseMessageOptions | InteractionReplyOptions>(args: T): T {
		if (args.content) {
			args.content = this.sageCommand.sageCache.format(args.content);
		}
		if (this.deletableBy) {
			const ephemeral = this.sageCommand.isSageInteraction("REPLIABLE") && this.sageCommand.interaction.ephemeral;
			if (!ephemeral) {
				return includeDeleteButton(args, this.deletableBy);
			}
		}
		return args;
	}

	public constructor(public sageCommand: SageCommand, public deletableBy = sageCommand.authorDid) {
		// this.messages = [];
	}

	private async _defer() {
		const options = { updateLast: false, updateReply: true };

		// do nothing, it's too late to defer
		if (this.replyMessage) {

		// there is no defer mechanism for SageMessage, so reply with "thinking ..."
		}else if (this.sageCommand.isSageMessage()) {
			const message = await this.sageCommand.message.reply(`RPG Sage is thinking ... ${ReplyStack.SpinnerEmoji}`);
			return this.processMessage(message, options);

		// try to safeul handle the defer for the interaction
		}else if (this.sageCommand.isSageInteraction("REPLIABLE")) {
			const { interaction } = this.sageCommand;
			if (!interaction.deferred && !interaction.replied) {
				if ("deferUpdate" in interaction) {
					return interaction.deferUpdate();
					// const message = await interaction.deferUpdate({ fetchReply:true }) as Message;
					// return this.processMessage(message, options);
				}
				return interaction.deferReply();
				// const message = await interaction.deferReply({ fetchReply:true }) as Message;
				// return this.processMessage(message, options);
			}
		}

		// we shouldn't get here, but return undefined just in case
		return undefined;
	}
	public async defer() {
		return this.pushToReplyStack(async () => this._defer());
	}

	private async _noDefer(): Promise<void> {
		// there is no defer mechanism for SageMessage

		// defer and then delete the defer message
		if (this.sageCommand.isSageInteraction("REPLIABLE")) {
			const { interaction } = this.sageCommand;
			if (!interaction.deferred && !interaction.replied) {
				const message = await interaction.deferReply({ fetchReply:true }) as Message;
				await this.processMessage(message, { updateLast: false, updateReply: true });
				await interaction.deleteReply(message);
			}
		}
	}
	public async noDefer(): Promise<void> {
		return this.pushToReplyStack(async () => this._noDefer());
	}

	/** The reply logic without pushing to the stack. */
	private async _reply(content: string, _options?: Partial<Options>): Promise<Message | undefined> {
		const options = {
			updateLast: _options?.updateLast ?? true,
			updateReply: _options?.updateReply ?? true
		};

		// we have already reply, treat this as a send instead
		if (this.replyMessage) {
			return this._send(content, options);

		// this is a SageMessage, so reply the the posted message
		}else if (this.sageCommand.isSageMessage()) {
			const replyArgs = this.createArgs({ content });
			const message = await this.sageCommand.message.reply(replyArgs);
			return this.processMessage(message, options);

		// this is a repliable SageInteraction, so check the interaction
		}else if (this.sageCommand.isSageInteraction("REPLIABLE")) {
			const { interaction } = this.sageCommand;

			// in case we replied to the interaction without the ReplyStack, treat it as a send instead
			if (interaction.replied || interaction.deferred) {
				return this._send(content, options);

			// it should be safe to use the interaction reply mechanism
			}else {
				const replyArgs = this.createArgs({ content, fetchReply:true });
				const response = await interaction.reply(replyArgs);
				const message = await response.fetch();
				return this.processMessage(message, options);
			}
		}

		// we shouldn't get here, but return undefined just in case
		return undefined;
	}
	public async reply(content: string): Promise<Message | undefined> {
		return this.pushToReplyStack(async () => this._reply(content));
	}

	private async _editReply(content: string) {
		// to avoid interaction conflicts, edit the message directly instead of through the interaction
		if (isDeletable(this.replyMessage)) {
			const editArgs = this.createArgs({ content, components:this.replyMessage.components });
			await this.replyMessage.edit(editArgs);

		// we don't have a valid reply to edit, so treat as a reply instead
		}else {
			await this._reply(content);
		}
	}
	public async editReply(content: string) {
		return this.pushToReplyStack(async () => this._editReply(content));
	}

	private async _send(content: string, _options?: Partial<Options>): Promise<Message | undefined> {
		const options = {
			updateLast: _options?.updateLast ?? true,
			updateReply: _options?.updateReply ?? false
		};

		// send directly to the discord channel, bypassing interactions
		const sendArgs = this.createArgs({ content });
		const message = await this.sageCommand.dChannel?.send(sendArgs);
		return this.processMessage(message, options);
	}
	public async send(content: string): Promise<Message | undefined> {
		return this.pushToReplyStack(async () => this._send(content));
	}

	private async _deleteReply() {
		await deleteMessage(this.replyMessage);
	}
	public async deleteReply() {
		return this.pushToReplyStack(async () => this._deleteReply());
	}
}
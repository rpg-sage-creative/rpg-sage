import type { Message } from "discord.js";
import { DiscordKey } from "../../../../discord";
import type Game from "../../../model/Game";

export type PinData = { channelId:string; messageId:string; };

export type HasPinsCore = {
	/** messsage ids where we have pinned things */
	pins?: { [key: string]: PinData[]; };
};

export abstract class HasPins<Core extends HasPinsCore, Type extends string> {
	declare protected core: Core;
	declare public id: string;
	declare public game: Game;
	protected abstract changed(): void;
	protected abstract render(type: Type): string;

	public getPin(type: Type, channelId: string): PinData | null {
		return this.core.pins?.[type]?.find(data => data.channelId === channelId) ?? null;
	}

	/** adds the channel/message to the list of known pins. */
	public async pin(type: Type, message: Message): Promise<boolean> {
		if (!message?.pinnable) {
			return false;
		}

		if (!message.pinned) {
			const pinnedMessage = await message.pin();
			if (!pinnedMessage.pinned) {
				return false;
			}
		}

		const channelId = message.channelId;
		const messageId = message.id;

		// check for existing
		if (this.getPin(type, channelId)?.messageId === messageId) {
			return false;
		}

		// remove all others
		this.unpin(type, channelId);

		// get or create pins
		const pins = this.core.pins ?? (this.core.pins = {});

		// get or create array
		const array = pins[type] ?? (pins[type] = []);

		// add new pin
		array.push({ channelId, messageId });

		this.changed();

		return true;
	}

	/** removes the channel from the list of known pins. */
	private async _unpin(type: Type, channelId: string): Promise<boolean> {
		const messageId = this.getPin(type, channelId)?.messageId;
		if (messageId) {
			const discordKey = new DiscordKey(this.game.serverDid, channelId, undefined, messageId);
			const message = await this.game.server.discord.fetchMessage(discordKey);
			if (message?.pinned) {
				await message.unpin();
			}
		}
		const pins = this.core.pins;
		if (pins) {
			const array = pins[type];
			if (array) {
				pins[type] = array.filter(data => data.channelId !== channelId);
				if (pins[type]!.length < array.length) {
					this.changed();
					return true;
				}
			}
		}
		return false;
	}

	/** unpin all pins for this object. */
	public async unpin(): Promise<boolean>;
	/** unpin all pins of the given type for this object. */
	public async unpin(type: Type): Promise<boolean>;
	/** unpin the specific type and channel for this object. */
	public async unpin(type: Type, channelId: string): Promise<boolean>;
	public async unpin(type?: Type, channelId?: string): Promise<boolean> {
		let results = true;
		if (type && channelId) {
			results = await this._unpin(type, channelId);
		}else if (type) {
			const pins = this.core.pins?.[type] ?? [];
			for (const pin of pins) {
				results = results && await this._unpin(type, pin.channelId);
			}
		}else {
			const types = Object.keys(this.core.pins ?? {}) as Type[];
			for (const type of types) {
				const pins = this.core.pins?.[type] ?? [];
				for (const pin of pins) {
					results = results && await this._unpin(type, pin.channelId);
				}
			}
		}
		return results;
	}

	private async _updatePins(pinType: Type): Promise<void> {
		const pins = this.core.pins?.[pinType] ?? [];
		if (pins.length) {
			const content = this.render(pinType);
			for (const pin of pins) {
				const discordKey = new DiscordKey(this.game.server.did, pin.channelId, undefined, pin.messageId);
				const message = await this.game.server.discord.fetchMessage(discordKey);
				if (message?.editable && message.content !== content) {
					await message.edit(content);
				}
			}
		}
	}

	/** update all pins */
	public async updatePins(): Promise<void>;
	/** update the specified pin */
	public async updatePins(pinType: Type): Promise<void>;
	public async updatePins(pinType?: Type): Promise<void> {
		if (pinType) {
			await this._updatePins(pinType);
		}else {
			const types = Object.keys(this.core.pins ?? {});
			for (const type of types) {
				await this._updatePins(type as Type);
			}
		}
	}

}
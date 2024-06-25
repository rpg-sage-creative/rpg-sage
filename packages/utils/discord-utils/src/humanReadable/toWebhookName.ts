import type { Optional } from "@rsc-utils/core-utils";
import type { Webhook } from "discord.js";
import { toUserName } from "./toUserName.js";

/** Returns the webhook name as a readable value or "$UnknownWebhook" */
export function toWebhookName(webhook: Optional<Webhook>): string {
	if (webhook) {
		if (webhook.sourceGuild) {
			return `${webhook.sourceGuild.name}$${webhook.name}`;
		}
		if (webhook.owner) {
			return `${toUserName(webhook.owner)}$${webhook.name}`;
		}
		return `$${webhook.name}`;
	}
	return "$UnknownWebhook";
}
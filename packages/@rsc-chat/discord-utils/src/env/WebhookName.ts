const SageDialogWebhookName = "SageDialogWebhookName";

export type SageWebhookType = "dialog";

export function getWebhookName(_type: SageWebhookType): string {
	return SageDialogWebhookName;
}
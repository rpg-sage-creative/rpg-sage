export type PinData = { channelId:string; messageId:string; };

export type HasTemplatesCore = {
	/** template value holder */
	templates?: { [key: string]: string; };
};

export abstract class HasTemplates<Core extends HasTemplatesCore, Type extends string> {
	declare protected core: Core;
	protected abstract changed(): void;

	public getTemplate(type: Type): string | null;
	public getTemplate(type: Type, defaultValue: string): string;
	public getTemplate(type: Type, defaultValue?: string): string | null {
		const value = this.core.templates?.[type] ?? null;
		return !value && defaultValue ? defaultValue : value;
	}

	public setTemplate(type: Type, value: string | null): boolean {
		if (value === this.getTemplate(type)) {
			return false;
		}

		const templates = this.core.templates ?? (this.core.templates = {});
		if (value === null) {
			delete templates[type];
		}else {
			templates[type] = value;
		}
		this.changed();
		return true;
	}

}
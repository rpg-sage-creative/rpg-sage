import type { Optional } from "@rsc-utils/core-utils";
import { EmbedBuilder as _EmbedBuilder } from "discord.js";

export class EmbedBuilder extends _EmbedBuilder {
	public appendDescription(appendix: Optional<string>, delimiter?: string) {
		if (this.data.description && appendix) {
			this.setDescription(this.data.description + (delimiter ?? "") + appendix);
		}else if (appendix) {
			this.setDescription(appendix);
		}
	}
	public getDescription(): string | undefined {
		return this.data.description;
	}
}
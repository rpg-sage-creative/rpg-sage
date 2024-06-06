import { MessageEmbed } from "discord.js";

export class EmbedBuilder extends MessageEmbed {
	public appendDescription(appendix?: string | null) {
		if (this.description && appendix) {
			this.setDescription(this.description + appendix);
		}else if (appendix) {
			this.setDescription(appendix);
		}
	}
}
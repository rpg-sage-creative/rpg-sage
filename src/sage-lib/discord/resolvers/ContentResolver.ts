import type { RenderableContentResolvable } from "@rsc-utils/core-utils";
import type { EmbedBuilder } from "discord.js";
import type { SageCache } from "../../sage/model/SageCache.js";
import { resolveToContent } from "./resolveToContent.js";
import { resolveToEmbeds } from "./resolveToEmbeds.js";

/**
 * @todo Find out what the deal is with this class.
 * Was it deprecated?
 * Was it meant to replace something else?
 */
export class ContentResolver {
	public constructor(public sageCache: SageCache) { }

	public resolveToContent(resolvable: RenderableContentResolvable): string {
		return resolveToContent(resolvable, this.sageCache.getFormatter()).join("\n\n").trim();
	}

	public resolveToEmbeds(resolvable: RenderableContentResolvable): EmbedBuilder[] {
		return resolveToEmbeds(resolvable, this.sageCache.getFormatter());
	}
}
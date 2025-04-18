import type { RenderableContentResolvable } from "@rsc-utils/core-utils";
import type { EmbedBuilder } from "discord.js";
import type { SageCache } from "../../sage/model/SageCache.js";
import { resolveToContent } from "./resolveToContent.js";
import { resolveToEmbeds } from "./resolveToEmbeds.js";

export class ContentResolver {
	public constructor(public sageCache: SageCache) { }

	public resolveToContent(renderableContentResolvable: RenderableContentResolvable): string {
		return resolveToContent(this.sageCache, renderableContentResolvable).join("\n\n").trim();
	}

	public resolveToEmbeds(renderableContentResolvable: RenderableContentResolvable): EmbedBuilder[] {
		return resolveToEmbeds(this.sageCache, renderableContentResolvable);
	}
}
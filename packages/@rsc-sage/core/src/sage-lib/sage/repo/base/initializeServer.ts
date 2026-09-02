import { DataTable } from "@rsc-sage/data-layer";
import { info, type Optional } from "@rsc-utils/core-utils";
import type { Guild } from "discord.js";
import { ActiveBot } from "../../model/ActiveBot.js";
import { Server } from "../../model/Server.js";

export async function initializeServer(guild: Optional<Guild>): Promise<boolean> {
	if (!guild) {
		return false;
	}

	const dataTable = DataTable.for("Server");

	const exists = dataTable.has(guild.id);
	if (exists) {
		info(`${ActiveBot.active.codeName} rejoined ${guild?.name} (${guild?.id})`);
		return false;
	}

	const saved = await dataTable.write(Server.createCore(guild));
	if (saved) {
		info(`${ActiveBot.active.codeName} joined ${guild.name} (${guild.id})`);
	}

	return saved;
}
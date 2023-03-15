import type { Snowflake } from "discord.js";
import type { Optional } from "../../../../../sage-utils";
import { GameRoleType, IGameRole, TGameRoleType } from "../../../model/Game";
import type SageMessage from "../../../model/SageMessage";
import { createAdminRenderableContent, registerAdminCommand } from "../../cmd";
import { registerAdminCommandHelp } from "../../help";

function getGameRoleLabel(gameRole: IGameRole): TGameRoleType {
	return <TGameRoleType>GameRoleType[gameRole.type || 0];
}

async function gameRoleList(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("List Game Roles");
	if (denial) {
		return denial;
	}

	const game = sageMessage.game!;

	const renderableContent = createAdminRenderableContent(game, `<b>Game Roles</b>`);
	if (game.roles.length) {
		for (const gameRole of game.roles) {
			const role = await sageMessage.discord.fetchGuildRole(gameRole.did);
			const title = `<b>${getGameRoleLabel(gameRole)}</b> @${role?.name}`;
			const roleId = `<b>Role Id</b> ${gameRole.did}`;
			renderableContent.appendTitledSection(title, roleId);
			// TODO: list users
		}
	} else {
		renderableContent.append(`<blockquote>No Roles Found!</blockquote>`);
	}
	return <any>sageMessage.send(renderableContent);
}

function getRoleDidArg(sageMessage: SageMessage, type: GameRoleType): Optional<Snowflake> {
	if (type === GameRoleType.GameMaster && sageMessage.args.hasKey("GM")) {
		return sageMessage.args.getRoleDid("GM");
	}
	return sageMessage.args.getRoleDid(GameRoleType[type]);
}

async function gameRoleSet(sageMessage: SageMessage): Promise<void> {
	const denial = sageMessage.checkDenyAdminGame("Set Game Role");
	if (denial) {
		return denial;
	}

	// GameRoleType { Unknown = 0, Spectator = 1, Player = 2, GameMaster = 3, Cast = 4, Table = 5 }
	const gameRoles = [1,2,3,4,5]
		.map((type: GameRoleType) => ({ type, did: getRoleDidArg(sageMessage, type) }))
		.filter(gameRole => gameRole.did !== undefined) as {type:GameRoleType;did:Snowflake|null}[];
	if (!gameRoles.length) {
		return sageMessage.reactFailure(`You must provide at least one valid role type and value. Ex: sage!!game role set player="@MyGamePlayer" gm="@MyGameMaster"`);
	}

	const updated = await sageMessage.game!.setRole(...gameRoles);
	return sageMessage.reactSuccessOrFailure(updated, "Game Role Set", "Unknown Error; Game Role NOT Set");
}

//TODO: remove roles by mentioning them
//TODO: have a generic set of role commands that dyanmically figure out game or server roletype

export default function register(): void {
	registerAdminCommand(gameRoleList, "game-role-list");
	registerAdminCommandHelp("Admin", "Game", "role list");

	registerAdminCommand(gameRoleSet, "game-role-set");
	registerAdminCommandHelp("Admin", "Game", `game role set player="@MyGamePlayer" gm="@MyGameMaster"`);
}

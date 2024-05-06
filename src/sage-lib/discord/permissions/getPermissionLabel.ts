import type { PermissionString } from "discord.js";

export function getPermissionLabel(permissionString: PermissionString): string {
	return permissionString
		.split("_")
		.map(part => part[0] + part.slice(1).toLowerCase())
		.join("");
}
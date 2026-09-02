import { getCodeName } from "@rsc-utils/core-utils";

export function commandPathValidator(commandPath: string): boolean {
	const codeName = getCodeName();
	if (commandPath.includes("/dev/")) return codeName === "dev";
	if (commandPath.includes("/beta/")) return codeName === "beta";
	if (commandPath.includes("/stable/")) return codeName === "stable";
	return true;
}
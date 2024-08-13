import type { Optional } from "@rsc-utils/core-utils";
import { isBlank } from "@rsc-utils/string-utils";
import type { SageCommand } from "../../../model/SageCommand.js";
import type { TAlias } from "../../../model/User.js";
import { findCompanion } from "./findCompanion.js";
import { findNpc } from "./findNpc.js";
import { findPc } from "./findPc.js";

type AliasResult = TAlias & { charAlias?:boolean; };

export function findAlias(sageCommand: SageCommand, aliasName: Optional<string>): AliasResult | undefined {
	if (isBlank(aliasName)) {
		return undefined;
	}

	const found = sageCommand.sageUser.aliases.findByName(aliasName, true);
	if (found) {
		return found;
	}

	const findOpts = { auto:false, first:false };
	const char = findPc(sageCommand, aliasName, findOpts)
		?? findCompanion(sageCommand, aliasName, findOpts)
		?? findNpc(sageCommand, aliasName, findOpts);
	if (char) {
		return {
			name: aliasName,
			target: `${char.type}::${char.name}::`,
			charAlias: true
		};
	}

	return undefined;
}
import { debug } from "@rsc-utils/core-utils";
import { isDefined } from "@rsc-utils/core-utils";
import { PostType } from "../PostType.js";
import { updateDialogOptions, type OldDialogOptions } from "./updateDialogOptions.js";

type SageOptions = {
	sagePostType?: PostType;
};
type OldSageOptions = SageOptions & {
	/** @deprecated */
	defaultSagePostType?: PostType;
};

type CharacterOptions = {
	playerCharacters?: any[];
};
type OldCharacterOptions = CharacterOptions & {
	/** @deprecated */
	characters?: any[];
};

type UserCore = OldDialogOptions & OldSageOptions & OldCharacterOptions & {
	id: string;
};

export function updateUser<T>(user: T): T;
export function updateUser<T extends UserCore>(user: T): T {
	debug(`Updating User: ${user.id} ...`);
	updateDialogOptions(user);

	if (isDefined(user.characters)) {
		user.playerCharacters = user.characters;
		delete user.characters;
	}

	if (isDefined(user.defaultSagePostType)) {
		user.sagePostType = user.defaultSagePostType === 1 ? PostType.Content : PostType.Embed;
		delete user.defaultSagePostType;
	}

	debug(`Updating User: ${user.id} ... done.`);
	return user;
}

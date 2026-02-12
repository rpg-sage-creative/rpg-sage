// import type { AutoChannelData } from "../../../types/AutoChannelData.js";
// import { isEmptyArray } from "../../../types/isEmptyArray.js";
// import { isEmptyString } from "../../../types/isEmptyString.js";
// import type { HasVer } from "../../../types/types.js";
// import type { CharacterV0 } from "../v0/CharacterV0.js";
// import type { CharacterV1 } from "../v1.js";

// export function characterV1FromV0(core: CharacterV0 & HasVer): CharacterV1 {
// 	if (core.ver > 0) throw new Error(`cannot convert v${core.ver} to v1`);

// 	if (isEmptyString(core.aka)) {
// 		delete core.aka;
// 	}

// 	if (isEmptyString(core.alias)) {
// 		delete core.alias;
// 	}

// 	if (isEmptyArray(core.autoChannels)) {
// 		delete core.autoChannels;
// 	}

// 	if ("autoChannels" in core) {
// 		core.autoChannels = core.autoChannels?.map(ac => {
// 			if (typeof(ac) === "string") {
// 				return { channelId:ac };
// 			}
// 			return ac;
// 		}) as AutoChannelData[];
// 	}

// 	if (isEmptyString(core.avatarUrl)) {
// 		delete core.avatarUrl;
// 	}

// 	if ("avatarUrl" in core) {
// 		// if (!isUrl(core.avatarUrl)) delete core.avatarUrl;
// 	}

// 	if (isEmptyArray(core.companions)) {
// 		delete core.companions;
// 	}

// 	if ("companions" in core) {
// 		core.companions = core.companions?.map(comp => comp.ver > 0 ? comp : characterV1FromV0(comp));
// 	}

// 	if (isEmptyArray(core.decks)) {
// 		delete core.decks;
// 	}

// 	if ("decks" in core) {
// 		// core.decks = core.decks?.map(comp => comp.ver > 0 ? comp : characterV1FromV0(comp));
// 	}

// 	if (isEmptyString(core.embedColor)) {
// 		delete core.embedColor;
// 	}

// 	if ("embedColor" in core) {
// 		// if (!isHexColorString(core.embedColor)) delete core.embedColor;
// 	}

// 	if ("essence20" in core) {
// 		// ?
// 	}

// 	if (isEmptyString(core.essence20Id)) {
// 		delete core.essence20Id;
// 	}

// 	if ("essence20Id" in core) {
// 		// look up char somewhere, somehow?
// 	}

// 	// id ?

// 	if (isEmptyArray(core.lastMessages)) {
// 		delete core.lastMessages;
// 	}

// 	if ("lastMessages" in core) {
// 		// core.lastMessages = core.lastMessages.map
// 	}

// 	if (isEmptyArray(core.macros)) {
// 		delete core.macros;
// 	}

// 	if ("macros" in core) {
// 		// core.macros = core.macros.map
// 	}

// 	// name ?

// 	if (isEmptyArray(core.notes)) {
// 		delete core.notes;
// 	}

// 	if ("notes" in core) {
// 		// core.notes = core.notes.map
// 	}

// 	core.objectType = "Character";

// 	if ("pathbuilder" in core) {
// 		// ?
// 	}

// 	if (isEmptyString(core.pathbuilderId)) {
// 		delete core.pathbuilderId;
// 	}

// 	if ("pathbuilderId" in core) {
// 		// look up char somewhere, somehow?
// 	}

// 	if (isEmptyString(core.tokenUrl)) {
// 		delete core.tokenUrl;
// 	}

// 	if ("tokenUrl" in core) {
// 		// if (!isUrl(core.tokenUrl)) delete core.tokenUrl;
// 	}

// 	if (isEmptyString(core.userDid)) {
// 		delete core.userDid;
// 	}

// 	if ("userDid" in core) {
// 		// validate? how? not all users change their user data which is how/why/when we create a user file
// 	}

// 	core.ver = 1;
// 	return core as CharacterV1;
// }
import type { BuilderOrOption, NameAndDescription } from "../index.js";

/** shortcut for setting name/desc on all objects, also cleans the name for the API */
export function setName<T extends BuilderOrOption>(builder: T, hasName: NameAndDescription): T {
	try {
		builder.setName(hasName.name.toLowerCase().replace(/\s+/g, "-"));
		builder.setDescription(hasName.description ?? hasName.name);
	}catch(ex) {
		console.error(`${hasName.name}: ${hasName.description}`);
	}
	return builder;
}
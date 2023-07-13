import type { OrNull, OrUndefined } from "../../sage-utils";
import { isString } from "../../sage-utils/StringUtils";
import type { Base, BaseCore, TChildCoreParser } from "../model/base/Base";
import type { HasSource } from "../model/base/HasSource";

export type TObjectTypeAndPlural = {
	objectType: string;
	objectTypePlural: string;
};

type TRepositoryItem = {
	constructor: typeof Base;
	objectType: string;
	objectTypeLower: string;
	objectTypePlural: string;
	objectTypePluralLower: OrUndefined<string>;
	objects: Base[];
	erratad: Base[];
};

const repoMap: Map<string, TRepositoryItem> = new Map();

/** Returns the objectType values (sorted) currently loaded. */
export function getObjectTypes(): string[] {
	return Array.from(repoMap.keys()).sort();
}

/** Returns all the objects for the given objectType. */
export function getByType<T extends Base>(objectType: string): T[] {
	const objects = repoMap.get(objectType)?.objects as T[];
	return objects ? objects.slice() : [];
}

/** Used to find a properly cased objectType from any objectType or objectTypePlural */
export function parseObjectType(objectType: string): OrNull<TObjectTypeAndPlural> {
	const objectTypeLower = String(objectType).toLowerCase();
	const repoItem = Array.from(repoMap.values())
		.find(_repoItem => _repoItem.objectTypeLower === objectTypeLower || _repoItem.objectTypePluralLower === objectTypeLower);
	if (!repoItem) {
		return null;
	}
	return {
		objectType: repoItem.objectType,
		objectTypePlural: repoItem.objectTypePlural
	};
}

/** Creates a RepositoryItem for the given constructor */
export function registerObject<T = any>(itemConstructor: T): void;

/** Creates a RepositoryItem for the given constructor */
export function registerObject(objectType: string, objectTypePlural: string): void;

export function registerObject(objectTypeOrItemConstructor: string | typeof Base, objectTypePlural?: string): void {
	const objectType = isString(objectTypeOrItemConstructor) ? objectTypeOrItemConstructor : objectTypeOrItemConstructor.singular;
	if (!repoMap.has(objectType)) {
		const itemConstructor = isString(objectTypeOrItemConstructor) ? null! : objectTypeOrItemConstructor;
		objectTypePlural = isString(objectTypeOrItemConstructor) ? objectTypePlural! : objectTypeOrItemConstructor.plural;
		repoMap.set(objectType, {
			objectType: objectType,
			objectTypeLower: objectType.toLowerCase(),
			objectTypePlural: objectTypePlural,
			objectTypePluralLower: objectTypePlural?.toLowerCase(),
			constructor: itemConstructor,
			objects: [],
			erratad: []
		});
		console.info(`Registering Object #${repoMap.size}: ${objectType}`);
	}
}

export function hasObjectType(objectType: string): boolean {
	return repoMap.has(objectType);
}

/** Adds the given Sage entity to the appropriate collection. */
export function loadSageCore(core: BaseCore): void {
	const repoItem = repoMap.get(core.objectType);
	if (repoItem) {
		const entity: HasSource = new repoItem.constructor(core) as HasSource;
		if (entity.isErrata) {
			const index = repoItem.objects.findIndex(o => o.id === entity.previousId);
			const isRemoved = entity.version < 0;
			if (isRemoved) {
				if (-1 < index) {
					repoItem.erratad.push(...repoItem.objects.splice(index, 1));
				}
			} else {
				if (index < 0) {
					repoItem.objects.push(entity);
				} else {
					repoItem.erratad.push(...repoItem.objects.splice(index, 1, entity));
				}
			}
		} else {
			repoItem.objects.push(entity);
		}
	}
}

export function getChildParser(objectType: string): TChildCoreParser<BaseCore> | undefined {
	return repoMap.get(objectType)?.constructor.childParser;
}
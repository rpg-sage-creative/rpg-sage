import { registerObject } from "../../data";
import { Creature } from "./Creature";
import { CreatureCategory } from "./CreatureCategory";

export * from "./Creature";
export * from "./CreatureCategory";
export * from "./CreatureLanguages";
export * from "./ICreature";

export function register(): void {
	registerObject(Creature);
	registerObject(CreatureCategory);
}
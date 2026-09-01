import { registerObject } from "../../data/Repository.js";
import { Creature } from "./Creature.js";
import { CreatureCategory } from "./CreatureCategory.js";

export function registerBestiaryObjects(): void {
	registerObject(Creature);
	registerObject(CreatureCategory);
}
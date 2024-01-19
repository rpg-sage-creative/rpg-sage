import { registerObject } from "../../data/Repository";
import { Creature } from "./Creature";
import { CreatureCategory } from "./CreatureCategory";

export function registerBestiaryObjects(): void {
	registerObject(Creature);
	registerObject(CreatureCategory);
}
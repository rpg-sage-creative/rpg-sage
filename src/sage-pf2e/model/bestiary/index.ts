import { registerObject } from "../../data/Repository";
import Creature from "./Creature";
import CreatureCategory from "./CreatureCategory";

export default function register(): void {
	registerObject(Creature);
	registerObject(CreatureCategory);
}
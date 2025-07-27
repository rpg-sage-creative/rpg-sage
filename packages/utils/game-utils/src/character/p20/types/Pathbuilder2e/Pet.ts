import type { AnimalCompanion } from "./AnimalCompanion.js";
import type { Familiar } from "./Familiar.js";
import type { OtherPet } from "./OtherPet.js";

export type Pet = Familiar | AnimalCompanion | OtherPet;
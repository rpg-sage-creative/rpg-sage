/*
// namespace pf {
// 	export namespace model {
// 		export namespace bestiary {

// 			export interface ISourceReference {
// 				name: string;
// 				page: number;
// 			}

// 			export interface IBestiary {
// 				name: string;
// 				creatureCategories: ICreatureCategory[];
// 				hazards: any[];
// 				items: IItem[];
// 			}

// 			const BestiaryObjectType = "Bestiary";
// 			export class Bestiary {
// 				private _creatureCategories: CreatureCategory[];
// 				private _creatures: Creature[];
// 				private _items: Item[];

// 				public constructor(private core: IBestiary) {
// 					this.creatures;
// 				}

// 				public get creatureCategories(): CreatureCategory[] {
// 					if (!this._creatureCategories) {
// 						this._creatureCategories = this.core.creatureCategories.map(category => new CreatureCategory(category));
// 						this._creatureCategories.sort((a, b) => sortStringIgnoreCase(a.name, b.name));
// 					}
// 					return this._creatureCategories.slice();
// 				}
// 				public get creatures(): Creature[] {
// 					if (!this._creatures) {
// 						this._creatures = [];
// 						this.creatureCategories.map(cat => cat.creatures).forEach(creatures => creatures.forEach(creature => this._creatures.push(creature)));
// 						this._creatures.sort(sortByLevelThenName);
// 					}
// 					return this._creatures.slice();
// 				}
// 				public get items(): Item[] {
// 					if (!this._items) {
// 						this._items = (this.core.items || []).map(item => new Item(item));
// 						this._items.sort(sortByLevelThenName);
// 					}
// 					return this._items.slice();
// 				}
// 				public get name(): string { return this.core.name; }

// 				public matches(value: string): boolean {
// 					return this.matchesLower(value.toLowerCase());
// 				}
// 				private matchesLower(lower: string): boolean {
// 					return this.name.toLowerCase() == lower;
// 				}

// 				// Static Methods


// 				public static get all(): Bestiary[] {
// 					return bestiaries.slice();
// 				}

// 				public static find(value: string): Bestiary {
// 					return data.Repository.findObject(BestiaryObjectType, value);
// 				}

// 			}

// 		}
// 	}
// }
*/
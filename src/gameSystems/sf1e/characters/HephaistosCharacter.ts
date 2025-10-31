import { CharacterBase, type DiceMacroBase } from "@rsc-utils/character-utils";
import { addCommas, errorReturnFalse, errorReturnUndefined, getDataRoot, type Optional } from "@rsc-utils/core-utils";
import { fileExistsSync, readJsonFile, readJsonFileSync, writeFile } from "@rsc-utils/io-utils";
import { Ability } from "../../d20/lib/Ability.js";
import { Check } from "../../d20/lib/Check.js";
import { SavingThrow } from "../../d20/lib/SavingThrow.js";
import { toModifier } from "../../utils/toModifier.js";
import type { HephaistosCharacterCoreSF1e, HephaistosCharacterSF1eInventoryItem } from "../import/types.js";
import { Abilities } from "../lib/Abilities.js";
import { HAbilities } from "../lib/HAbilities.js";
import { Skill } from "../lib/Skill.js";
import type { MacroBase } from "../../../sage-lib/sage/model/Macro.js";

export type CharacterSectionType = "All" | "Armor" | "Attacks" | "Equipment" | "Feats" | "Formulas" | "Languages" | "Perception" | "Pets" | "Skills" | "Speed" | "Spells" | "SpellsKnown" | "Stats" | "Traits" | "Weapons";

export type CharacterViewType = "All" | "Combat" | "Equipment" | "Feats" | "Formulas" | "Pets" | "Spells";

function bracketTraits(...traits: string[]): string {
	const filtered = traits.map(t => t?.trim()).filter(t => t);
	return `[${filtered.join("] [")}]`;
}

function toHtmlPerception(char: HephaistosCharacterSF1e): string {
	const modifier = toModifier(char.perceptionMod);
	const specials = char.perceptionSpecials.length ? `; ${char.perceptionSpecials.map(s => s.toLowerCase()).join(", ")}` : ``;
	const incredibleInit = ``;//char.hasFeat("Incredible Initiative") ? `; incredible initiative (+2)` : ``;
	return `${modifier}${specials}${incredibleInit}`;
}

function profToHtml(char: HephaistosCharacterSF1e): string {
	const json = char.toJSON();
	return json.skills
		.filter(skill => skill.skill === "Profession" && skill.name)
		.map(skill => {
			return `${skill.name} ${toModifier(skill.total)}`;
		}).join(", ");
}

function skillsToHtml(char: HephaistosCharacterSF1e): string {
	const json = char.toJSON();
	return Skill.all().map(({ name }) => {
		const skill = json.skills.find(({ skill }) => skill === name);
		if (!skill) {
			return "";
		}

		if (!skill.ranks && skill.trainedOnly) {
			return "";
		}

		return `${skill.name ?? skill.skill} ${toModifier(skill.total)}`;
	}).filter(s => s).join(", ");
}

function itemsToHtml(weapons: HephaistosCharacterSF1eInventoryItem[], armors: HephaistosCharacterSF1eInventoryItem[]): string {
	const weaponNames = weapons.map(weapon => weapon.name);
	const armorNames = armors.map(armor => armor.name);
	return weaponNames.concat(armorNames).join(", ");
}

function abilitiesToHtml(char: HephaistosCharacterSF1e): string {
	const core = char.toJSON();
	return Ability.all().map(abil => {
		const score = core.abilityScores[abil.key].total;
		const mod = Ability.scoreToMod(score);
		return `<b>${abil.name}</b> ${score} (${toModifier(mod)})`;
	}).join(", ");
}

function acToHtml(char: HephaistosCharacterSF1e): string {
	const core = char.toJSON();
	const out: string[] = [
		`<b>EAC</b> ${core.armorClass.eac.total}`,
		`<b>KAC</b> ${core.armorClass.kac.total}`,
		`<b>vs CM</b> ${core.armorClass.acVsCombatManeuver.total}`,
	];
	return out.join("; ");
}

function savingThrowsToHtml(char: HephaistosCharacterSF1e): string {
	const core = char.toJSON();
	const out: string[] = [
		`<b>Fort</b> ${toModifier(core.saves.fortitude.total)}`,
		`<b>Ref</b> ${toModifier(core.saves.reflex.total)}`,
		`<b>Will</b> ${toModifier(core.saves.will.total)}`,
	];
	return out.join(", ");
}

function vitalsToHtml(char: HephaistosCharacterSF1e): string {
	const { vitals } = char;
	const out: string[] = [
		`<b>HP</b> ${vitals.maxHp ?? "??"}`,
		`<b>Resolve</b> ${vitals.maxRp ?? "??"}`,
		`<b>Stamina</b> ${vitals.maxSp ?? "??"}`,
	];
	return out.join("; ");
}

function weaponToHtml(_char: HephaistosCharacterSF1e, { name, toHit, damage, damageBonus }: HephaistosCharacterSF1eInventoryItem): string {
	// return `<b>${weapon.display}</b> ${toModifier(weapon.attack)} <b>Damage</b> ${damage}`;
	const dmg = [
		`${damage.dice.count}d${damage.dice.sides}`,
		damageBonus ? toModifier(damageBonus) : ``,
		damage.damage.length > 1 ? `(${damage.damage.join(", ")})` : damage.damage[0]
	].filter(s => s).join(" ");
	return `<b>${name}</b> ${toModifier(toHit)} <b>Damage</b> ${dmg}`;
}

function moneyToHtml(money: HephaistosCharacterCoreSF1e): string {
	const coins = <string[]>[];
	if (money.credits) {
		coins.push(`${addCommas(money.credits)} credits`);
	}
	if (money.upbs) {
		coins.push(`${addCommas(money.upbs)} upbs`);
	}
	return coins.join(", ");
}

function doEquipmentMoney(char: HephaistosCharacterSF1e) {
	const out = [];
	const core = char.toJSON();
	const equipment = core.inventory.filter(item => item.type !== "Weapon" && item.type !== "Armor");
	const hasEquipment = equipment.length > 0;
	const hasMoney = core.credits || core.upbs;
	if (hasEquipment || hasMoney) {
		if (hasEquipment) {
			const mapItem = (item: HephaistosCharacterSF1eInventoryItem) => item.quantity > 1 ? `${item.name} x${item.quantity}` : item.name;
			const worn = equipment.filter(item => !item.stashed && item.isEquipped).map(mapItem);
			if (worn.length) {
				out.push(`<b>Equipment</b> <i>(worn)</i> ${worn.join(", ")}`.trim());
			}
			const carried = equipment.filter(item => !item.stashed && !item.isEquipped).map(mapItem);
			if (carried.length) {
				out.push(`<b>Equipment</b> <i>(carried)</i> ${carried.join(", ")}`.trim());
			}
			const stashed = equipment.filter(item => item.stashed).map(mapItem);
			if (stashed.length) {
				out.push(`<b>Equipment</b> <i>(stashed)</i> ${stashed.join(", ")}`.trim());
			}
		}
		if (hasMoney) {
			out.push(`<b>Currency</b> ${moneyToHtml(core)}`);
		}
	}
	return out;
}

function weaponToMacro(_char: HephaistosCharacterSF1e, weapon: HephaistosCharacterSF1eInventoryItem): DiceMacroBase {
	const { damage:{ damage:types, dice:{ count, sides } }, damageBonus, name, toHit } = weapon;
	const damageDice = [`${count}d${sides}`,damageBonus ? toModifier(damageBonus) : 0].filter(s => s).join(" ");
	const damageTypes = types.map(s => s?.trim()).map(s => s);
	const damageType = damageTypes.length > 1 ? `(${damageTypes.join(",")})` : damageTypes[0] ?? "";
	const dice = `[1d20 ${toModifier(toHit)} ${name}; ${damageDice} ${damageType}]`;
	return { name, dice };
}

export class HephaistosCharacterSF1e extends CharacterBase<HephaistosCharacterCoreSF1e, CharacterSectionType, CharacterViewType> {
	public constructor(core: HephaistosCharacterCoreSF1e) {
		super(core);
		this.abilities = new HAbilities(this);
	}
	public gameSystem: "SF1e" = "SF1e";
	public importedFrom: "Hephaistos" = "Hephaistos";

	public abilities: Abilities;

	public createCheck(key: string): Check | undefined {
		const skill = Skill.findByName(key);
		if (skill) {
			const mod = this.core.skills.find(sk => sk.skill === skill.name)?.total ?? 0
			const check = new Check(this, skill.name);
			check.modifiers.push({ bonus:mod, penalty:0, source:"", type:"" });
			return check;
		}

		const savingThrow = SavingThrow.findByName(key);
		if (savingThrow) {
			const mod = this.core.saves[savingThrow.key].total
			const check = new Check(this, savingThrow.name);
			check.modifiers.push({ bonus:mod, penalty:0, source:"", type:"" });
			return check;
		}

		const keyLower = key.toLowerCase();
		const profession = this.core.skills.find(prof => prof.skill === "Profession" && prof.name?.toLowerCase() === keyLower);
		if (profession) {
			const mod = profession.total;
			const check = new Check(this, profession.name!);
			check.modifiers.push({ bonus:mod, penalty:0, source:"", type:"" });
			return check;
		}

		if (Ability.isValid(key)) {
			return this.abilities.getCheck(key);
		}

		return undefined;
	}

	public get vitals() {
		return {
			maxHp: this.core.vitals.health.max,
			maxRp: this.core.vitals.resolve.max,
			maxSp: this.core.vitals.stamina.max,
			temp: this.core.vitals.temporary
		};
	}

	public get perceptionMod(): number {
		const perc = this.core.skills.find(sk => sk.skill === "Perception");
		return perc?.total ?? 0;
	}

	public get perceptionSpecials(): string[] {
		return this.core.senses.filter(({ senseType:s }, _, a) =>
			(s === "Low-Light Vision" && !a.find(s => s.senseType.includes("Darkvision")))
			|| s === "Darkvision"
			|| s.startsWith("Scent")
			|| s.startsWith("Echolocation")
			|| s.startsWith("Tremorsense")
		).map(s => s.senseType);
	}

	public getWeapons() { return this.core.inventory.filter(item => item.type === "Weapon"); }
	public getArmor() { return this.core.inventory.filter(item => item.type === "Armor"); }
	public getSpellCasters() { return []; }
	public getSpellsKnown() { return []; }
	public getEquipment() { return this.core.inventory.filter(item => item.type !== "Weapon" && item.type !== "Armor"); }
	public getFeats() { return this.core.feats.acquiredFeats; }
	public getMoney() { const { credits, upbs } = this.core; return { credits, upbs, isEmpty:!credits&&!upbs }; }

		public getSheetMacros(type: "attack" | "spell"): DiceMacroBase[];
		public getSheetMacros<User extends { id:string; macros: MacroBase[]; }>(type: "user", macroUser: Optional<User>): DiceMacroBase[];
		public getSheetMacros<User extends { id:string; macros: MacroBase[]; }>(type: "attack" | "spell" | "user", macroUser?: Optional<User>): DiceMacroBase[] {
			if (type === "attack") {
				return this.getWeapons().map(wpn => weaponToMacro(this, wpn));
			}
			return super.getSheetMacros(type as "user", macroUser);
		}


	public getValidSections<V extends string = CharacterSectionType>(): V[] {
		const outputTypes: CharacterSectionType[] = [
			"Traits",
			"Perception"
		];

		if (this.core.languages.length) {
			outputTypes.push("Languages");
		}

		outputTypes.push("Skills");

		const weapons = this.getWeapons();
		if (weapons.length) {
			outputTypes.push("Weapons");
		}

		const armor = this.getArmor();
		if (armor.length) {
			outputTypes.push("Armor");
		}

		outputTypes.push("Stats", "Speed");

		if (weapons.length) {
			outputTypes.push("Attacks");
		}

		const spellCasters = this.getSpellCasters();
		if (spellCasters.length) {
			outputTypes.push("Spells");
		}

		const spellsKnown = this.getSpellsKnown();
		if (spellsKnown.length) {
			outputTypes.push("SpellsKnown");
		}

		if (this.core.drone) {
			outputTypes.push("Pets");
		}

		//#region Equipment
		const equipment = this.getEquipment();
		const hasEquipment = equipment.length > 0;
		const money = this.getMoney();
		const hasMoney = !money.isEmpty;
		if (hasEquipment || hasMoney) {
			outputTypes.push("Equipment");
		}
		//#endregion

		const feats = this.getFeats();
		if (feats.length) {
			outputTypes.push("Feats");
		}

		// if (this.core.formula.length) {
		// 	outputTypes.push("Formulas");
		// }

		return outputTypes as V[];
	}

	public getValidViews<V extends string = CharacterViewType>(): V[] {
		const outputTypes: CharacterViewType[] = [];

		const weapons = this.getWeapons();
		if (weapons.length) {
			outputTypes.push("Combat");
		}

		//#region Equipment
		const equipment = this.getEquipment();
		const hasEquipment = equipment.length > 0;
		const money = this.getMoney();
		const hasMoney = !money.isEmpty;
		if (hasEquipment || hasMoney) {
			outputTypes.push("Equipment");
		}
		//#endregion

		const feats = this.getFeats();
		if (feats.length) {
			outputTypes.push("Feats");
		}

		// if (this.core.formula?.length) {
		// 	outputTypes.push("Formulas");
		// }

		if (this.core.drone) {
			outputTypes.push("Pets");
		}

		const spellCasters = this.getSpellCasters();
		if (spellCasters.length) {
			outputTypes.push("Spells");
		}

		return outputTypes as V[];
	}

	public toHtmlName(): string {
		const name = this.core.name;
		const classes = this.core.classes.map(({ name, levels }) => `${name} ${levels}`);
		return `${name} - ${classes.join(" / ")}`;
	}

	public toHtml(outputTypes: CharacterSectionType[] = ["All"]): string {
		const html: string[] = [];

		push(`<b><u>${this.toHtmlName()}</u></b>`);

		if (includes(["All", "Traits"])) {
			push(`${bracketTraits(this.core.race.size, this.core.race.name, this.core.theme.name, ...this.core.classes.map(c => c.name))}`);
		}

		if (includes(["All", "Perception"])) {
			push(`<b>Perception</b> ${toHtmlPerception(this)}`);
		}

		if (includes(["All", "Languages"]) && this.core.languages.length) {
			push(`<b>Languages</b> ${this.core.languages}`);
		}

		if (includes(["All", "Skills"])) {
			push(`<b>Skills</b> ${skillsToHtml(this)}; <b>Profession</b> ${profToHtml(this)}; <i>mods from gear excluded</i>`);
		}

		const weapons = this.getWeapons();
		const doWeapons = includes(["All", "Weapons"]) && weapons.length;
		const armor = this.getArmor();
		const doArmor = includes(["All", "Armor"]) && armor.length;
		if (doWeapons || doArmor) {
			push(`<b>Items</b> ${itemsToHtml(doWeapons ? weapons : [], doArmor ? armor : [])}`);
		}

		if (includes(["All", "Stats"])) {
			push();
			push(`${abilitiesToHtml(this)}`);
			push(`${acToHtml(this)}; ${savingThrowsToHtml(this)}`);
			push(`${vitalsToHtml(this)}`);
		}

		if (includes(["All", "Speed"])) {
			push();
			const speeds = Object.keys(this.core.speed).filter(key => key !== "notes").map(key => `${key} ${this.core.speed[key as keyof typeof this.core.speed]} feet`);
			push(`<b>Speed</b> ${speeds.join(", ")}`);
		}

		if (includes(["All", "Attacks"]) && weapons.length) {
			push();
			weapons.map(weapon => weaponToHtml(this, weapon)).forEach(push);
		}

		// if (includes(["All", "Spells"]) && this.core.spellCasters?.length) {
		// 	push();
		// 	this.core.spellCasters.map(spellCaster => spellCasterToHtml(this, spellCaster)).forEach(push);
		// 	focusSpellsToHtml(this).forEach(push);
		// }

		// const preparedCasters = this.core.spellCasters?.filter(caster => caster?.spellcastingType === "prepared");
		// if (includes(["All", "SpellsKnown"]) && preparedCasters?.length) {
		// 	push();
		// 	preparedCasters.map(preparedCaster => spellCasterToKnownHtml(preparedCaster)).forEach(push);
		// }

		if (includes(["All", "Pets"]) && this.core.drone) {
			push();
			push(`<b>Drone</b> ${this.core.drone.name} - ${this.core.drone.chassis}`);
			// doPets(this).forEach(push);
		}

		if (includes(["All", "Equipment"])) {
			const lines = doEquipmentMoney(this);
			if (lines.length) {
				push();
				lines.forEach(push);
			}
		}

		const feats = this.getFeats();
		if (includes(["All", "Feats"]) && feats.length) {
			push();
			push(`<b>Feats</b> ${feats.map(feat => feat.name).join(", ")}`);
		}

		//#region formulas
		// if (includes(["All", "Formulas"]) && this.core.formula?.length) {
		// 	push();
		// 	const one = this.core.formula.length === 1;
		// 	this.core.formula.forEach(formulaType => {
		// 		const type = formulaType.type !== "other" || one ? ` (${formulaType.type})` : ``;
		// 		push(`<b>Formula Book${type}</b> ${formulaType.known.join(", ")}`);
		// 	});
		// }
		//#endregion

		return html.join("");

		function includes(types: CharacterSectionType[]): boolean {
			return types.find(type => outputTypes.includes(type)) !== undefined;
		}
		function push(value?: string) {
			if (value || html.length > 1) {
				html.push(`${html.length ? "<br/>" : ""}${value ?? "---"}`);
			}
		}
	}

	public static async saveCharacter(character: HephaistosCharacterCoreSF1e | HephaistosCharacterSF1e): Promise<boolean> {
		const json = "toJSON" in character ? character.toJSON() : character;
		return writeFile(HephaistosCharacterSF1e.createFilePath(character.id), json, true).catch(errorReturnFalse);
	}
	public save(): Promise<boolean> {
		return HephaistosCharacterSF1e.saveCharacter(this);
	}

	public static createFilePath(characterId: string): string {
		return `${getDataRoot("sage")}/heph/${characterId}.json`;
	}
	public static exists(characterId: string): boolean {
		return fileExistsSync(HephaistosCharacterSF1e.createFilePath(characterId));
	}
	public static async loadCharacter(characterId: string): Promise<HephaistosCharacterSF1e | null> {
		const core = await readJsonFile<HephaistosCharacterCoreSF1e>(HephaistosCharacterSF1e.createFilePath(characterId)).catch(errorReturnUndefined);
		return core ? new HephaistosCharacterSF1e(core) : null;
	}
	public static loadCharacterSync(characterId: string): HephaistosCharacterSF1e | undefined {
		try {
			const core = readJsonFileSync<HephaistosCharacterCoreSF1e>(HephaistosCharacterSF1e.createFilePath(characterId));
			return core ? new HephaistosCharacterSF1e(core) : undefined;
		}catch(ex) {
			return errorReturnUndefined(ex);
		}
	}
	public static getCharacterSections<SectionType, ViewType>(view: Optional<ViewType>): SectionType[] | undefined {
		switch(view) {
			case "All": return ["All"] as SectionType[];
			case "Combat": return ["Traits", "Perception", "Languages", "Skills", "Weapons", "Armor", "Stats", "Speed", "Attacks"] as SectionType[];
			case "Equipment": return ["Traits", "Perception", "Languages", "Skills", "Weapons", "Armor", "Equipment"] as SectionType[];
			case "Feats": return ["Traits", "Perception", "Languages", "Skills", "Feats"] as SectionType[];
			case "Formulas": return ["Traits", "Perception", "Languages", "Skills", "Formulas"] as SectionType[];
			case "Pets": return ["Traits", "Perception", "Languages", "Skills", "Pets"] as SectionType[];
			case "Spells": return ["Traits", "Perception", "Languages", "Skills", "Spells", "SpellsKnown"] as SectionType[];
		}
		return undefined;
	}
}
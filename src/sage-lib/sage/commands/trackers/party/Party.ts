import { applyMixins } from "../../../../../sage-utils/utils/TypeUtils/applyMixins";
import { CharacterShell } from "../../../model/CharacterShell";
import type Game from "../../../model/Game";
import GameCharacter from "../../../model/GameCharacter";
import { CharacterSorter, HasCharacters, type HasCharactersCore } from "../common/HasCharacters";
import { HasCore } from "../common/HasCore";
import { HasPins, HasPinsCore } from "../common/HasPins";
import { HasTemplates, HasTemplatesCore } from "../common/HasTemplates";
import { appendWealth } from "../wealth/appendWealth";
import { getCharWealth } from "../wealth/getCharWealth";

export type PartyType = "pc" | "npc" | "mixed";

type PinType = "loot" | "status";

type TemplateType = "statusHeader" | "statusCharacter" | "statusCharacterExploration" | "statusCompanion" | "statusCompanionExploration" | "statusFooter"
	| "lootHeader" | "lootCharacter" | "lootSummaryHeader" | "lootSummaryName" | "lootSummary";

export type PartyCore = HasCharactersCore & HasPinsCore & HasTemplatesCore & {
	/** id */
	id: string;
	/** party name */
	name: string;
	/** party type */
	// type: PartyType;
};

export class Party {
	public constructor(protected core: PartyCore, public game: Game) { }

	protected changed(): void {
		delete this._type;
	}

	protected getCharacterSorter(): CharacterSorter {
		return (a, b) => {
			const aLower = a.name.toLowerCase();
			const bLower = b.name.toLowerCase();
			if (aLower !== bLower) {
				return aLower < bLower ? -1 : 1;
			}
			return 0;
		};
	}

	public get id(): string { return this.core.id; }
	public get name(): string { return this.core.name; }
	private _type: PartyType | undefined;
	public get type(): PartyType {
		if (!this._type) {
			const characterCores = this.characterCores;
			const pcCount = characterCores.filter(c => c.type === "pc" || c.type === "companion").length;
			const npcCount = characterCores.filter(c => c.type === "npc" || c.type === "minion").length;
			if (pcCount && !npcCount) {
				this._type = "pc";
			}else if (!pcCount && npcCount) {
				this._type = "npc";
			}else {
				this._type = "mixed";
			}
		}
		return this._type;
	}

	public renderLoot(): string {
		const lines: string[] = [];

		const headerTemplate = this.getTemplate("statusHeader", "## Loot: {name}");
		if (headerTemplate) {
			const header = headerTemplate
				.replace(/{name}/gi, this.name)
				;
			lines.push(header);
		}

		lines.push("### *(by char)*");

		const totalWealth = {
			name: this.getTemplate("lootSummaryName", "Total"),
			credits: 0,
			pp: 0,
			gp: 0,
			ep: 0,
			sp: 0,
			cp: 0,
			valuables: [],
			summary: ""
		};

		const lootCharacterTemplate = this.getTemplate("lootCharacter");
		const lootSummaryTemplate = this.getTemplate("lootSummary");

		const characters = this.getSortedCharacters();
		if (characters.length) {
			characters.forEach(charShell => {
				const charWealth = charShell.getWealth(lootCharacterTemplate);
				lines.push(charWealth.summary);
				appendWealth(totalWealth, charWealth, lootSummaryTemplate);

				charShell.companions?.forEach(comp => {
					const compWealth = getCharWealth(comp, lootCharacterTemplate);
					lines.push("- " + compWealth.summary);
					appendWealth(totalWealth, compWealth, lootSummaryTemplate);
				});
			});
		}else {
			lines.push(`*empty party*`);
		}

		lines.push(this.getTemplate("lootSummaryHeader", "### *(combined)*"));
		lines.push(totalWealth.summary);

		return lines.join("\n");
	}

	public renderStatus(): string {
		const lines: string[] = [];

		const headerTemplate = this.getTemplate("statusHeader", "## Status: {name}");
		if (headerTemplate) {
			const header = headerTemplate
				.replace(/{name}/gi, this.name)
				;
			lines.push(header);
		}

		const characterTemplate = this.getTemplate("statusCharacter", "{name} ({hp}/{maxhp} HP): {conditions}");
		const characterExplorationTemplate = this.getTemplate("statusCharacterExploration", "- Exploration Mode: {explorationMode} ({explorationSkill})");
		const companionTemplate = this.getTemplate("statusCompanion", "> {name} ({hp}/{maxhp} HP): {conditions}");
		const companionExplorationTemplate = this.getTemplate("statusCompanionExploration", "> - Exploration Mode: {explorationMode} ({explorationSkill})");
		const characters = this.getSortedCharacters();
		if (characters.length) {
			const formatter = (charShell: CharacterShell | GameCharacter, template: string) => template
				.replace(/{name}/gi, charShell.name)
				.replace(/{hp}/gi, charShell.getStat("hp") ?? "?")
				.replace(/{maxhp}/gi, charShell.getStat("maxhp") ?? "?")
				.replace(/{conditions}/gi, charShell.getStat("conditions") ?? "*no conditions*")
				.replace(/{explorationMode}/gi, charShell.getStat("explorationMode") ?? "*unknown*")
				.replace(/ \({explorationSkill}\)$/gi, () => { const skill = charShell.getStat("explorationSkill") ?? ""; return skill ? ` (${skill})` : ""; })
				.replace(/{explorationSkill}/gi, charShell.getStat("explorationSkill") ?? "*unknown*")
				;
			characters.forEach(charShell => {
				lines.push(formatter(charShell, characterTemplate));
				if (charShell.getStat("explorationMode")) {
					lines.push(formatter(charShell, characterExplorationTemplate));
				}
				charShell.companions?.forEach(comp => {
					lines.push(formatter(comp, companionTemplate));
					if (comp.getStat("explorationMode")) {
						lines.push(formatter(comp, companionExplorationTemplate));
					}
					});
			});
		}else {
			lines.push(`*empty party*`);
		}

		// statusFooter

		return lines.join("\n");
	}

	protected render(pinType: PinType): string {
		return pinType === "loot" ? this.renderLoot() : this.renderStatus();
	}

}

export interface Party extends
	HasCore<PartyCore>,
	HasCharacters<PartyCore>,
	HasPins<PartyCore, PinType>,
	HasTemplates<PartyCore, TemplateType>
	{ }

applyMixins(Party, [HasCore, HasCharacters, HasPins, HasTemplates]);

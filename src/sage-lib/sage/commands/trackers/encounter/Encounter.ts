import { applyMixins } from "@rsc-utils/type-utils";
import type { CharacterShell } from "../../../model/CharacterShell";
import type Game from "../../../model/Game";
import { CharacterSorter, HasCharacters, type HasCharactersCore } from "../common/HasCharacters";
import { HasCore } from "../common/HasCore";
import { HasPins, type HasPinsCore } from "../common/HasPins";
import { HasTemplates, type HasTemplatesCore } from "../common/HasTemplates";
import type { Party } from "../party/Party";

type CurrentValues = {
	init?: number;
	round?: number;
	state?: "active";
};

type State = {
	/** */
	init?: number;
	/** checked, unchecked, arrow, skull? ... pf2e: one/two/three action icons? */
	activity?: string;
	/** summary of actions */
	actions?: string;
};

type StateMap = {
	[
		/** party character id */
		key: string
	]: State;
};

type PinType = "init";
type TemplateType = "header" | "party" | "character" | "footer";

export type EncounterCore = HasCharactersCore & HasPinsCore & HasTemplatesCore & {
	/** doing block initiative? */
	block?: boolean;
	/** "current" value holder */
	current?: CurrentValues;
	/** id */
	id: string;
	/** encounter name */
	name: string;
	/** states by partycharacter.id */
	states?: StateMap;
	/** how to traverse init */
	type?: "block" | "standard";
};

export class Encounter {
	public constructor(protected core: EncounterCore, public game: Game) { }

	protected changed(): void {
		// this._type = undefined;
	}

	protected getCharacterSorter(): CharacterSorter {
		return (a, b) => {
			const aInit =  this.getState(a.id).init ?? 0;
			const bInit =  this.getState(b.id).init ?? 0;
			if (aInit !== bInit) {
				return aInit < bInit ? 1 : -1;
			}
			const aLower = a.name.toLowerCase();
			const bLower = b.name.toLowerCase();
			if (aLower !== bLower) {
				return aLower < bLower ? -1 : 1;
			}
			return 0;
		};
	}

	public get active() { return this.core.current?.state === "active"; }
	public get id() { return this.core.id; }
	public get name() { return this.core.name; }

	public addParty(...parties: Party[]): CharacterShell[] {
		const shells: CharacterShell[] = [];
		for (const party of parties) {
			const chars = party.getSortedCharacters();
			for (const char of chars) {
				if (char.game) {
					shells.push(this.addChar(char.game, char.core.nickname));
				}
			}
		}
		return shells;
	}

	public getState(id: string): State {
		const states = this.core.states ?? (this.core.states = {});
		const state = states[id] ?? (states[id] = {});
		return state;
	}

	public setInit(value: number | null): void;
	public setInit(id: string, value: number | null): void;
	public setInit(...args: (string | number | null)[]): void {
		const id = typeof(args[0]) === "string" ? args.shift() as string : null;
		const value = args[0] as number | null;
		if (id) {
			this.getState(id).init = value ?? undefined;
		}else {
			const current = this.core.current ?? (this.core.current = { });
			current.init = value ?? undefined;
		}
	}

	public start(clear = false): void {
		if (clear) {
			this.core.states = {};
		}
		const current = this.core.current ?? (this.core.current = {});
		current.init = current.init ?? 0;
		current.state = "active";
	}

	public stop(): void {
		const current = this.core.current ?? (this.core.current = {});
		delete current.state;
	}

	public renderInit(): string {
		const lines: string[] = [];

		const headerTemplate = this.core.templates?.header ?? "## {name} - Round {round}";
		if (headerTemplate) {
			const header = headerTemplate
				.replace(/{name}/gi, this.name)
				.replace(/Round {round}/gi, () => this.active ? `Round ${this.core.current?.round ?? "*0*"}` : `*not active*`)
				.replace(/{round}/gi, String(this.core.current?.round ?? "*0*"))
				.replace(/{init}/gi, String(this.core.current?.init ?? "*0*"))
				;
			lines.push(header);
		}

		const characterTemplate = this.core.templates?.character ?? "{init} {activity} {name} {hp}/{maxhp}: {conditions}\n- {actions}";
		if (characterTemplate) {
			const characters = this.getSortedCharacters();
			characters.forEach(shell => {
				const state = this.getState(shell.id);
				const line = characterTemplate
					.replace(/{init}/gi, String(state.init ?? ":question:"))
					.replace(/{activity}/gi, state.activity ?? ":question:")
					.replace(/{name}/gi, shell.name)
					.replace(/{hp}/gi, shell.getStat("hp") ?? "?")
					.replace(/{maxhp}/gi, shell.getStat("maxhp") ?? "?")
					.replace(/{conditions}/gi, shell.getStat("conditions") ?? "*no conditions*")
					.replace(/{actions}/gi, shell.getStat("actions") ?? "*no actions*")
					;
				lines.push(line);
			});
		}

		return lines.join("\n");
	}

	protected render(_pinType: PinType): string {
		return this.renderInit();
	}

}

export interface Encounter extends
	HasCore<EncounterCore>,
	HasCharacters<EncounterCore>,
	HasPins<EncounterCore, PinType>,
	HasTemplates<EncounterCore, TemplateType>
	{ }

applyMixins(Encounter, [HasCore, HasCharacters, HasPins, HasTemplates]);

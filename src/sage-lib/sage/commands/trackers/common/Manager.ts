import type { Optional } from "@rsc-utils/type-utils";
import XRegExp from "xregexp";
import type { CharacterShell } from "../../../model/CharacterShell.js";
import type { Game } from "../../../model/Game.js";
import type { HasCharacters } from "./HasCharacters.js";
import type { HasPins } from "./HasPins.js";

type Base = { id:string; name:string; };
type BaseClass = HasCharacters<any> & HasPins<any, any>;

export abstract class Manager<Core extends Base, Class extends BaseClass> {
	public constructor(protected cores: Core[], protected game: Game) { }

	protected abstract changed(): void;
	protected abstract createCore(name: string): Core;
	protected abstract wrap(core: Core): Class;

	public get all(): Class[] { return this.cores.map(core => this.wrap(core)); }
	public get count(): number { return this.cores.length; }
	public get first(): Class | undefined { return this.cores.length ? this.wrap(this.cores[0]) : undefined; }
	public get only(): Class | undefined { return this.cores.length === 1 ? this.wrap(this.cores[0]) : undefined; }

	public add(name: string): Class | null {
		if (this.has(name)) {
			return null;
		}
		const core = this.createCore(name);
		this.cores.push(core);
		this.changed();
		return this.wrap(core);
	}

	public findCharacter(name: string): CharacterShell | undefined {
		const wrapped = this.all;
		for (const wrap of wrapped) {
			const charPair = wrap.getCharShell(name);
			if (charPair) {
				return charPair;
			}
		}
		return undefined;
	}

	public get(value: Optional<string>): Class | null {
		if (!value) {
			return null;
		}
		const regex = new RegExp(`^${XRegExp.escape(value)}$`, "i");
		const core = this.cores.find(core => regex.test(core.id) || regex.test(core.name));
		return core ? this.wrap(core) : null;
	}

	public getOrFirst(value: Optional<string>): Class | null {
		return this.get(value) ?? this.first ?? null;
	}
	public getOrOnly(value: Optional<string>): Class | null {
		return this.get(value) ?? this.only ?? null;
	}

	public has(classOrValue: string | Class): boolean {
		const value = typeof(classOrValue) === "string" ? classOrValue : classOrValue.id;
		const regex = new RegExp(`^${XRegExp.escape(value)}$`, "i");
		return !!this.cores.find(core => regex.test(core.id) || regex.test(core.name));
	}

	public remove(value: string): boolean {
		if (!this.has(value)) {
			return false;
		}
		const regex = new RegExp(`^${XRegExp.escape(value)}$`, "i");
		this.cores = this.cores.filter(p => !regex.test(p.id) && !regex.test(p.name));
		this.changed();
		return true;
	}

	public toJSON(): Core[] { return this.cores; }

	public async updatePins(): Promise<void> {
		for (const core of this.cores) {
			const wrapped = this.wrap(core);
			await wrapped.updatePins();
		}
	}
}

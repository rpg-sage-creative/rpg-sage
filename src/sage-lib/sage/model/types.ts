import NamedCollection from "./NamedCollection";

export type TMacro = {
	category?: string;
	name: string;
	dice: string;
};

export type CoreWithMacros = {
	macros?: TMacro[];
};

export type HasMacros = {
	macros: NamedCollection<TMacro>;
	save(): Promise<boolean>;
};

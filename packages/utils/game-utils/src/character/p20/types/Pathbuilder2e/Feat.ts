type Feat4 = [
	string,
	string | null,
	string,
	number
];
type Feat4_2 = [
	string,
	"string" | "null",
	string,
	number
];
type Feat7 = [
	string,
	string | null,
	string,
	number,
	string,
	string,
	string | null
];
type Feat7_2 = [
	string,
	"string" | "null",
	string,
	number,
	string,
	string,
	"string" | "null"
];

/** [name (Assurance), selection (Arcana), type, level, type/level, "standardChoice" | "childChoice", ?] */
export type Feat = Feat4 | Feat4_2 | Feat7 | Feat7_2;

/** @internal */
export type TextField = { name:string; value:string; };

/** @internal */
export type CheckField = { name:string; checked:boolean; };

/** @internal */
export type Field = TextField | CheckField;

/** @internal */
export type FieldJson = {
	id?: { Id: string; };
	T?: { Name: string; };
	V?: string;
};

/** @internal */
export type BoxsetJson = {
	boxes: {
		id?: { Id:string; };
		T?: { Name:string; };
		checked?: boolean;
	}[];
};

/** @internal */
export type TextJson = {
	R?: {
		T: string;
	}[];
}

/** @internal */
export type PageJson = {
	Fields: FieldJson[];
	Boxsets: BoxsetJson[];
	Texts: TextJson[];
};

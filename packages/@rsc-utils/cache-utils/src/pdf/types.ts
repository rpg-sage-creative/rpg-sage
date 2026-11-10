
/** Represents a textbox of an extracted PDF. */
export type TextField = { name:string; value:string; };

/** Represents a checkbox of an extracted PDF. */
export type CheckField = { name:string; checked:boolean; };

/** Represents a textbox or checkbox of an extracted PDF. */
export type Field = TextField | CheckField;

export type FieldJson = {
	id?: { Id: string; };
	T?: { Name: string; };
	V?: string;
};

export type BoxsetJson = {
	boxes: {
		id?: { Id:string; };
		T?: { Name:string; };
		checked?: boolean;
	}[];
};

export type TextJson = {
	R?: {
		T: string;
	}[];
}

/** Represents a page of an extracted PDF. */
export type PageJson = {
	Fields: FieldJson[];
	Boxsets: BoxsetJson[];
	Texts: TextJson[];
};

/** Represents the JSON extracted from a PDF. */
export type PdfJson = {
	Meta?: {
		Title?: string;
	};
	Pages: PageJson[];
};

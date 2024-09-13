export type PdfKeyMapItem = {
	sageKey: string;
	checked?: boolean;
};

export type PdfKeyMap = Map<string | number, PdfKeyMapItem>;


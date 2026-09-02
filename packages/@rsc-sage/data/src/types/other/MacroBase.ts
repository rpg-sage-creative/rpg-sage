export type MacroBase<Category extends string = string> = {
	category?: Category;
	dice?: string;
	dialog?: string;
	name: string;
};
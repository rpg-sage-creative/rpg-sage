export type Flags = `${"g"|""}${"i"|""}`;

//#region TagName

type TagNameOptions = { captureGroups?:{ tagName?:string; }; pattern?:string; flags?:Flags; };

/** @internal used to match element names, default: [a-zA-Z0-9]+ */
export function createTagNameSource(options?: TagNameOptions): string {
	const { tagName = "tagName" } = options?.captureGroups ?? { };
	const { pattern = "[a-zA-Z0-9]+" } = options ?? { };
	return `(?<${tagName}>${pattern})`;
}

//#endregion

//#region Attributes

type AttributesOptions = { captureGroups?:{ attributes?:string; quotes?:string; }; flags?:Flags; };

/** @internal used to match one or more: att="value" */
export function createAttributesSource(options?: AttributesOptions): string {
	const { attributes = "attributes", quotes = "quotes" } = options?.captureGroups ?? { };
	return `(?<${attributes}>(\\s+[a-zA-Z\\-]+(=(?<${quotes}>["']).*?\\k<${quotes}>)?)+)?`;
}

//#endregion

//#region SelfClose

const SelfClosePattern = "br|hr|img|input|link|meta";

type SelfCloseOptions = { captureGroups?:{ tagName?:string; attributes?:string; quotes?:string; }; pattern?:string; flags?:Flags; };

/** @internal used to match one self closing element (/ optional) with zero or more attributes: <elementName/> */
export function createSelfCloseSource(options?: SelfCloseOptions): string {
	return `(<${createTagNameSource({ pattern:SelfClosePattern, ...options })}${createAttributesSource(options)}\\s*/?>)`;
}

//#endregion

//#region OpenTag

type OpenTagOptions = { captureGroups?:{ tagName?:string; attributes?:string; quotes?:string; }; pattern?:string; flags?:Flags; };

/** @internal */
export function createOpenTagSource(options?: OpenTagOptions): string {
	return `(<${createTagNameSource(options)}${createAttributesSource(options)}\\s*>)`;
}

//#endregion

//#region CloseTag

type CloseTagOptions = { captureGroups?:{ tagName?:string; }; pattern?:string; flags?:Flags; };

/** @internal Used to match one: </elementName> */
export function createCloseTagSource(options?: CloseTagOptions): string {
	return `(</${createTagNameSource(options)}\\s*>)`;
}

//#endregion

//#region FullTag

type FullTagOptions = { captureGroups?:{ tagName?:string; attributes?:string; quotes?:string; inner?:string; }; pattern?:string; flags?:Flags; };

/** @internal Used to match one full element with optional attributes and inner: <elementName attributes>inner</elementName> */
export function createFullTagSource(options?: FullTagOptions): string {
	const { tagName = "tagName", inner = "inner" } = options?.captureGroups ?? { };
	return `(<${createTagNameSource(options)}${createAttributesSource(options)}\\s*>(?<${inner}>(.|\\n)*?)</\\k<${tagName}>>)`;
}

//#endregion

type SelfCloseElement = "br"|"hr"|"img"|"input"|"link"|"meta";
export function isSelfCloseElement(element: string): element is SelfCloseElement {
	return SelfClosePattern.split("|").includes(element.toLowerCase());
}
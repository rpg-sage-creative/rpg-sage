import type { PdfJsonFieldManager } from "@rsc-utils/io-utils";

export type PdfKeyMapValueParser = (mgr: PdfJsonFieldManager, value?: string) => string | undefined;

export type PdfKeyMapItem = {
	sageKey: string;
	checked?: boolean;
	valueParser?: never;
} | {
	sageKey: string;
	checked?: never;
	valueParser?: PdfKeyMapValueParser;
};;


export type PdfKeyMap = Map<string | number, PdfKeyMapItem>;


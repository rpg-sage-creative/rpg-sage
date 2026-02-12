import type { IdCore } from "@rsc-utils/core-utils";



export type DeckType = "English52" | "English54";

export enum DialogPostType {
	Embed = 0,
	Post = 1
}

export enum DialogDiceBehaviorType {
	Default = 0,
	Inline = 1
}



export enum MoveDirectionOutputType {
	Compact = 0,
	Verbose = 1
}



export type HasVer = { ver:number; };
export type SageCore<ObjectType extends string, IdType extends string> = IdCore<ObjectType> & HasVer & { id:IdType; };

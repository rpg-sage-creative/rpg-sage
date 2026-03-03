
export type AssertArgs<Core, Type = any> = {
	asserter?: never;
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator: (value: Type) => unknown
} | {
	asserter: (arg: { core:Type, objectType:string; }) => boolean;
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator?: never;
} | {
	asserter?: never;
	core: Core;
	key: keyof Core;
	objectType: string;
	optional?: "optional";
	validator?: never;
};

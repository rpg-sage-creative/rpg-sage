export type TSlashCommandChoice = string | [string, string] | { name:string; description?:string; value?:string; };
export type TNameDescription = { name:string; description:string; };
export type TSlashCommandOption = TNameDescription & { choices?:TSlashCommandChoice[]; };
export type TSlashCommand = TNameDescription & { children?:TSlashCommand[]; options?:TSlashCommandOption[]; };

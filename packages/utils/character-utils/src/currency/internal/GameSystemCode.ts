export type GameSystemCode = "None" | "PF1e" | "PF2e" | "SF1e" | "SF2e" | "CnC" | "E20" | "D20" | "DnD5e" | "Quest" | "VtM5e";
export type GameSystem = { code:GameSystemCode; isP20?:boolean; };
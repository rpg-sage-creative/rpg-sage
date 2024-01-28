
/** @internal @private */
export type TextField = { name:string; value:string; };

/** @internal @private */
export type CheckField = { name:string; checked:boolean; };

/** @internal @private */
export type Field = TextField | CheckField;

/** @internal @private */
export type FieldJson = { id?:{ Id:string; }; T?:{ Name:string; }; V?:string; };

/** @internal @private */
export type BoxsetJson = { boxes:{ id?:{ Id:string; }; T?:{ Name:string; }; checked?:boolean; }[]; };

/** @internal @private */
export type PageJson = { Fields:FieldJson[]; Boxsets:BoxsetJson[]; Texts:{ R?:{ T:string; }[]; }[]; };

/** @internal @private */
export type RawJson = { Pages:PageJson[]; Meta?:{ Title?:string; }; };

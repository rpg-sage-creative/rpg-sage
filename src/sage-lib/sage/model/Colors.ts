import type { Optional } from "../../../sage-utils";
import { Color } from "../../../sage-utils/ColorUtils";

//#region types

export enum ColorType {
	Command = 1,

	AdminCommand = 2,

	Search = 3,
	SearchFind = 31,

	Dice = 4,

	Dialog = 5,
	GameMaster = 51,
	NonPlayerCharacter = 52,
	NonPlayerCharacterAlly = 521,
	NonPlayerCharacterEnemy = 522,
	PlayerCharacter = 53,
	PlayerCharacterAlt = 531,
	PlayerCharacterCompanion = 532,
	PlayerCharacterHireling = 533,

	PfsCommand = 6
}

//#endregion

//#region interfaces

export type ColorData = {
	type: ColorType;
	hex: string;
	/** only used for dev purposes */
	label?: string;
};

export interface CoreWithColors {
	colors: ColorData[];
}

export interface HasCoreWithColors {
	colors: Colors;
	toDiscordColor(colorType: ColorType): string | null;
}

//#endregion

export type TColorAndType = { type: ColorType; color: Color };

export class Colors {
	public constructor(private colors: ColorData[]) { }

	private findColor(type: Optional<ColorType>): ColorData | undefined {
		return this.colors.find(color => color.type === type);
	}

	public get size(): number { return this.colors.length; }

	// #region get/set/unset

	public get(type: ColorType): Color | null {
		const color = this.findColor(type);
		return color && Color.from(color.hex) || null;
	}

	public set(colorAndType: TColorAndType): boolean {
		if (!colorAndType?.color || !colorAndType?.type) {
			return false;
		}
		let found = this.findColor(colorAndType.type);
		if (!found) {
			found = { type: colorAndType.type, hex: undefined! };
			this.colors.push(found);
		}
		found.hex = colorAndType.color.toDiscordColor();
		return true;
	}

	public unset(type: Optional<ColorType>): boolean {
		const found = this.findColor(type);
		if (!found) {
			return false;
		}
		this.colors.splice(this.colors.indexOf(found), 1);
		return true;
	}

	// #endregion

	public sync(colors: Colors): boolean {
		const oldColors = this.colors.slice();
		this.colors.length = 0;
		this.colors.push(...colors.toArray());
		return colors.size !== oldColors.length
			|| this.colors.find((_, i) => oldColors[i].type !== this.colors[i].type || oldColors[i].hex !== this.colors[i].hex) !== undefined;
	}

	/** Duplicates the colors to a new array of new objects. (To avoid referencing the originals.) */
	public toArray(): ColorData[] {
		return this.colors.map(({ type, hex }) => ({ type, hex }));
	}

	public toDiscordColor(colorType: ColorType): string | null {
		const color = this.get(colorType);
		switch (colorType) {
			case ColorType.Command:
			case ColorType.AdminCommand:
			case ColorType.Search:
			case ColorType.Dice:
			case ColorType.Dialog:
			case ColorType.PfsCommand:
				return color?.toDiscordColor() ?? this.toDiscordColor(undefined!);

			case ColorType.SearchFind:
				return color?.toDiscordColor() ?? this.toDiscordColor(ColorType.Search);

			case ColorType.GameMaster:
			case ColorType.PlayerCharacter:
			case ColorType.NonPlayerCharacter:
				return color?.toDiscordColor() ?? this.toDiscordColor(ColorType.Dialog);

			case ColorType.PlayerCharacterAlt:
			case ColorType.PlayerCharacterCompanion:
			case ColorType.PlayerCharacterHireling:
				return color?.toDiscordColor() ?? this.toDiscordColor(ColorType.PlayerCharacter);

			case ColorType.NonPlayerCharacterAlly:
			case ColorType.NonPlayerCharacterEnemy:
				return color?.toDiscordColor() ?? this.toDiscordColor(ColorType.NonPlayerCharacter);

			default:
				console.warn(`Missing ColorType: ${colorType}`);
				return null;
		}
	}

}

import { Color, warn, type HexColorString, type Optional } from "@rsc-utils/core-utils";
import { ColorType, type IColor } from "./HasColorsCore.js";

export type TColorAndType = { type: ColorType; color: Color; };

export class Colors {
	public constructor(private colors: IColor[]) { }

	public findColor(type: Optional<ColorType>): IColor | undefined {
		return this.colors.find(color => color.type === type);
	}

	public get size(): number { return this.colors.length; }

	// #region get/set/unset

	public get(type: ColorType): Color | null {
		const color = this.findColor(type);
		return Color.from(color?.hex) ?? null;
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

		found.hex = colorAndType.color.hex;

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

	public toArray(): IColor[] {
		return this.colors.map(({ type, hex }) => ({ type, hex }));
	}

	public toHexColorString(colorType: ColorType): HexColorString | undefined {
		const color = this.get(colorType);
		switch (colorType) {
			case ColorType.Command:
			case ColorType.AdminCommand:
			case ColorType.Search:
			case ColorType.Dice:
			case ColorType.Dialog:
			case ColorType.PfsCommand:
				return color?.hex ?? this.toHexColorString(undefined!);

			case ColorType.SearchFind:
				return color?.hex ?? this.toHexColorString(ColorType.Search);

			case ColorType.GameMaster:
			case ColorType.PlayerCharacter:
			case ColorType.NonPlayerCharacter:
				return color?.hex ?? this.toHexColorString(ColorType.Dialog);

			case ColorType.PlayerCharacterAlt:
			case ColorType.PlayerCharacterCompanion:
			case ColorType.PlayerCharacterFamiliar:
			case ColorType.PlayerCharacterHireling:
				return color?.hex ?? this.toHexColorString(ColorType.PlayerCharacter);

			case ColorType.NonPlayerCharacterAlly:
			case ColorType.NonPlayerCharacterEnemy:
			case ColorType.NonPlayerCharacterBoss:
			case ColorType.NonPlayerCharacterMinion:
				return color?.hex ?? this.toHexColorString(ColorType.NonPlayerCharacter);

			default:
				warn(`Missing ColorType: ${colorType}`);
				return undefined;
		}
	}

}

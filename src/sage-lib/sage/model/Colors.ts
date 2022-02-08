import utils, { Optional } from "../../../sage-utils";
import { ColorType, IColor } from "./HasColorsCore";

export type TColorAndType = { type: ColorType; color: utils.ColorUtils.Color };

export default class Colors {
	public constructor(private colors: IColor[]) { }

	private findColor(type: Optional<ColorType>): IColor | undefined {
		return this.colors.find(color => color.type === type);
	}

	public get size(): number { return this.colors.length; }

	// #region get/set/unset

	public get(type: ColorType): utils.ColorUtils.Color | null {
		const color = this.findColor(type);
		return color && utils.ColorUtils.Color.from(color.hex) || null;
	}

	public set(colorAndType: TColorAndType): boolean {
		if (!colorAndType?.color || !colorAndType?.type) {
			return false;
		}
		let found = this.findColor(colorAndType.type);
		if (!found) {
			this.colors.push(found = { type: colorAndType.type, hex: undefined! });
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

	public toArray(): IColor[] {
		return this.colors.map(color => ({ type: color.type, hex: color.hex }));
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

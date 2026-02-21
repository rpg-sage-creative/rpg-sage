import { EmbedColorType, type EmbedColor } from "@rsc-sage/data-layer";
import { Color, warn, type HexColorString, type Optional } from "@rsc-utils/core-utils";

export type ColorAndType = { type: EmbedColorType; color: Color; };


export type HasColorsCore = {
	colors: Colors;
	toHexColorString(colorType: EmbedColorType): HexColorString | undefined;
};

export class Colors {
	public constructor(private colors: EmbedColor[]) { }

	public findColor(type: Optional<EmbedColorType>): EmbedColor | undefined {
		return this.colors.find(color => color.type === type);
	}

	public get size(): number { return this.colors.length; }

	// #region get/set/unset

	public get(type: EmbedColorType): Color | null {
		const color = this.findColor(type);
		return Color.from(color?.hex) ?? null;
	}

	public set(colorAndType: ColorAndType): boolean {
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

	public unset(type: Optional<EmbedColorType>): boolean {
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

	public toArray(): EmbedColor[] {
		return this.colors.map(({ type, hex }) => ({ type, hex }));
	}

	public toHexColorString(colorType: EmbedColorType): HexColorString | undefined {
		const color = this.get(colorType);
		switch (colorType) {
			case EmbedColorType.Command:
			case EmbedColorType.AdminCommand:
			case EmbedColorType.Search:
			case EmbedColorType.Dice:
			case EmbedColorType.Dialog:
			case EmbedColorType.PfsCommand:
				return color?.hex ?? this.toHexColorString(undefined!);

			case EmbedColorType.SearchFind:
				return color?.hex ?? this.toHexColorString(EmbedColorType.Search);

			case EmbedColorType.GameMaster:
			case EmbedColorType.PlayerCharacter:
			case EmbedColorType.NonPlayerCharacter:
				return color?.hex ?? this.toHexColorString(EmbedColorType.Dialog);

			case EmbedColorType.PlayerCharacterAlt:
			case EmbedColorType.PlayerCharacterCompanion:
			case EmbedColorType.PlayerCharacterFamiliar:
			case EmbedColorType.PlayerCharacterHireling:
				return color?.hex ?? this.toHexColorString(EmbedColorType.PlayerCharacter);

			case EmbedColorType.NonPlayerCharacterAlly:
			case EmbedColorType.NonPlayerCharacterEnemy:
			case EmbedColorType.NonPlayerCharacterBoss:
			case EmbedColorType.NonPlayerCharacterMinion:
				return color?.hex ?? this.toHexColorString(EmbedColorType.NonPlayerCharacter);

			default:
				warn(`Missing EmbedColorType: ${colorType}`);
				return undefined;
		}
	}

}

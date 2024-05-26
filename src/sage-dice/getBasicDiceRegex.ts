const BASIC_DICE_REGEX = /\[[^\]]*(\d|\b)d\d+[^\]]*\]/ig;

export function getBasicDiceRegex(): RegExp {
	return BASIC_DICE_REGEX;
}
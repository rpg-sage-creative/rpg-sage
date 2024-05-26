
export function getBasicDiceRegex(): RegExp {
	return /\[[^\]]*(\d|\b)d\d+[^\]]*\]/ig;
}
const urls = {
	"COLOR_MANAGEMENT": `https://github.com/rpg-sage-creative/rpg-sage/wiki/Color-Management`,
	"EMOJI_MANAGEMENT": `https://github.com/rpg-sage-creative/rpg-sage/wiki/Emoji-Management`,
	"IMPORT_CHARACTERS": `https://github.com/rpg-sage-creative/rpg-sage/wiki/Character-Management#importing-characters`,
	"REIMPORT_CHARACTERS": `https://github.com/rpg-sage-creative/rpg-sage/wiki/Character-Management#importing-characters`,
	"MACROS": `https://github.com/rpg-sage-creative/rpg-sage/wiki/Dice-Macros`,
};

export type WikiUrlKey = keyof typeof urls;

export function getWikiUrl(key: WikiUrlKey): string {
	return urls[key];
}

export function hasWikiUrl(key: string): key is WikiUrlKey {
	return key in urls;
}
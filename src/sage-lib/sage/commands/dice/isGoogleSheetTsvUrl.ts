export function isGoogleSheetTsvUrl(value: string): boolean {
	return /^https:\/\/docs\.google\.com\/spreadsheets\/d\/e\/[^/]+\/pub.*?output=tsv/i.test(value);
	// return "https://docs.google.com/spreadsheets/d/e/2PACX-1vQWjSJswz85uqy-LvQBbjDgXcIJamuUnO30x3JZzgg09wc3CCbbXFyTIVFj79cdKhNJVS89Gi66XA9T/pub?gid=0&single=true&output=tsv";
}
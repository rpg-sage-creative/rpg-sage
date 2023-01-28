export function createSearchUrl(searchText: string): string | null {
	const cleanSearchText = searchText.replace(/\s+/g, "+");
	return `https://www.aonsrd.com/Search.aspx?Query=${cleanSearchText}`;
}
export function getPage<T>(array: T[], pageSize: number, pageIndex: number): T[] {
	// negative numbers imply starting from the end
	if (pageIndex < 0) {
		const pageCount = Math.max(1, Math.ceil(array.length / pageSize));
		pageIndex = pageCount + pageIndex;
	}
	const startIndex = pageIndex * pageSize;
	return array.slice(startIndex, startIndex + pageSize);
}

export function getPages<T>(items: T[], pageSize: number): T[][] {
	const pages: T[][] = [];
	items.forEach(item => {
		let page = pages[pages.length - 1];
		if (!page || page.length === pageSize) {
			page = [];
			pages.push(page);
		}
		page.push(item);
	});
	return pages;
}
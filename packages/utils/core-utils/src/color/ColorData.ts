export type HexColorString = `#${string}`;
export type RgbColorString = `rgb(${number},${number},${number})`;
export type RgbaColorString = `rgba(${number},${number},${number},${number})`;

/** @internal */
export type RgbString = RgbColorString | RgbaColorString;

/** Stores all the information we know about a color */
export type ColorData = {
	names: string[];
	hex: HexColorString;
	hexa: HexColorString;
	rgb: RgbColorString;
	rgba: RgbaColorString;
	red: number;
	green: number;
	blue: number;
	alpha: number;
};


// The following allows you to validate types using the following typeguards: function hex<T extends string>(s: HexColor<T>): T { return s; }
// https://www.typescriptlang.org/play/?ts=4.4.0-beta&ssl=13&ssc=1&pln=1&pc=1#code/C4TwDgpgBAEhAeARAlgc2cAPAFSg4EAdgCYDOUA5AAwVQA+lAjLQxQEwuUDMnFALLwCsvAGy8A7LwAcvAJy8AhrwBGvAMa9ivCBVYAzXgEFeAIV4BhXol4BRXZQBiFAHxQAvFGwBuAFChIsAjmAPYANsEATjh48AQk5KTAEciEqK5uPlBZnjFxZFAABgDEACQA3nBIaBiYKXoQEVCIjM4AvuWVKOhYdQ1NbG0dCF01vY2IXINlY1AAShCJjK0FmdlrAPxQABTzi7lE+QUFUKtrZ1CbuAD0V1DAABYREBAAtMTVwFD3CFBqYZGnc7ZABc20BQLOu2AjH28UKQyq3VqhHq4z4U06H2RqKaggxwyxM0QIjaKwh5OylyyNygpGQ8DeHy+Pz+4Qi4IpZ1BhAgADcGhzzgBKQVQEUQ7l8hq+Hx6ACuhDUwGQwUIzPg0XwBwSSRSaS2pFBlRCbJwziFoNwZUBT2AcoiatIvlaPh8NMMoVCUF5ClCyGIPm+8C2FCKenDEYoQt8QZDYfDUZjCDjVFTicDydDjDYXD4gjE0YzwdDCmUamIEAMhdjoao2YrVaTxaKhhM5kQNic0aAA
// type HexDigit<T extends '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'a' | 'b' | 'c' | 'd' | 'e'| 'f' | 'A' | 'B' | 'C' | 'D' | 'E'| 'F'> = T;
// type HexColor<T extends string> =
// 	T extends `#${HexDigit<infer D1>}${HexDigit<infer D2>}${HexDigit<infer D3>}${infer Rest1}`
// 		? (Rest1 extends ``
// 			? T // three-digit hex color
// 			: (
// 				Rest1 extends `${HexDigit<infer D4>}${HexDigit<infer D5>}${HexDigit<infer D6>}`
// 					? T  // six-digit hex color
// 					: never
// 			)
// 		)
// 		: never;

import { toLiteral } from "../../../build/index.js";
import { toMarkdown } from "../../../build/index.js";

describe("string", () => {
	describe("markdown", () => {

			const tests = [
				{
					input:
`
<h1>Header 1</h1>
<h2>Header 2</h2>
<h3>Header 3</h3>
<h4>Header 4</h4>
<blockquote>line 1
line 2</blockquote>
<b>bold</b> and <strong>strong</strong>
<i>italics
more</i>
<code>code</code>
<footer>footer</footer>
<s>s</s> or <strike>strike</strike>
line<br>break
<sup>12.34567809</sup>
<sub>12.34567809</sub>
<a href="https://rpgsage.io">RPG Sage Site</a>
<a href="https://rpgsage.io" title="cool site bro">RPG Sage Site</a>
line<br/>break
line<br />break 2
line<br readonly/>break 3
<u>underline</u>
<ul><li>first</li><li>second</li></ul>
<ul><li>first</li><ol><li>first child first</li><li>first child second</li></ol><li>second</li></ul>
\ttabbed
dec: &#9770; hex: &#x262a;
<ol><li>first</li><li>second</li></ol>
<ol start="5"><li>first</li><li>second</li></ol>
`,
					expected:
`

# Header 1

## Header 2

### Header 3

__**Header 4**__


> line 1
> line 2

**bold** and **strong**
*italics
more*
\`code\`
-# footer
~~s~~ or ~~strike~~
line
break
¹²\u22C5³⁴⁵⁶⁷⁸⁰⁹
₁₂\u2024₃₄₅₆₇₈₀₉
[RPG Sage Site](https://rpgsage.io)
[RPG Sage Site](https://rpgsage.io "cool site bro")
line
break
line
break 2
line
break 3
__underline__

- first
- second

- first
  1. first child first
  2. first child second
- second
 \u00A0 \u00A0tabbed
dec: ☪ hex: ☪

1. first
2. second

5. first
6. second
`
				},
				{
					input:
`
<table>
<tr><td>r0 c0</td><td>r0 c1</td></tr>
<tr><td>r1 c0</td><td>r1 c1</td></tr>
<tr><td>r2 <b>c0</b></td><td>r2 <broken> c1</td></tr>
</table>
`,
					expected:
`
> __r0 c0 | r0 c1__
> r1 c0 | r1 c1
> r2 c0 | r2  c1
`
				}
			];

			tests.forEach(({ input, expected }) => {
				test(`toMarkdown()`, () => {
					expect(toMarkdown(input)).toBe(expected);
				});
			});

	});
});
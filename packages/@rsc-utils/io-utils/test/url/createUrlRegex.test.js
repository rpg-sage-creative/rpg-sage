import { tagLiterals } from "@rsc-utils/core-utils";
import { getUrlRegex } from "../../build/index.js";

describe("url", () => {

	const tests = [

		// basic
		{ options:undefined, input:"http://google.com/q?word=text#marked", testResult:true, execResult:["http://google.com/q?word=text#marked"], captureGroup:undefined, captureValue:undefined },
		{ options:undefined, input:"https://google.com:80/q?word=text#marked", testResult:true, execResult:["https://google.com:80/q?word=text#marked"], captureGroup:undefined, captureValue:undefined },
		{ options:undefined, input:"ftp://google.com:80/q?word=text#marked", testResult:true, execResult:["ftp://google.com:80/q?word=text#marked"], captureGroup:undefined, captureValue:undefined },
		{ options:undefined, input:"sftp://google.com:80/q?word=text#marked", testResult:true, execResult:["sftp://google.com:80/q?word=text#marked"], captureGroup:undefined, captureValue:undefined },

		// basic capture
		{ options:{capture:"url"}, input:"http://google.com/q?word=text#marked", testResult:true, execResult:["http://google.com/q?word=text#marked"], captureGroup:"url", captureValue:"http://google.com/q?word=text#marked" },
		{ options:{capture:"url"}, input:"https://google.com:80/q?word=text#marked", testResult:true, execResult:["https://google.com:80/q?word=text#marked"], captureGroup:"url", captureValue:"https://google.com:80/q?word=text#marked" },
		{ options:{capture:"url"}, input:"ftp://google.com:80/q?word=text#marked", testResult:true, execResult:["ftp://google.com:80/q?word=text#marked"], captureGroup:"url", captureValue:"ftp://google.com:80/q?word=text#marked" },
		{ options:{capture:"url"}, input:"sftp://google.com:80/q?word=text#marked", testResult:true, execResult:["sftp://google.com:80/q?word=text#marked"], captureGroup:"url", captureValue:"sftp://google.com:80/q?word=text#marked" },

		// port too long; but without anchor the valid host/port is a valid url
		{ options:undefined, input:"https://google.com:655350/q?word=text#marked", testResult:true, execResult:["https://google.com:65535"], captureGroup:undefined, captureValue:undefined },
		// port too long
		{ options:{anchored:true}, input:"https://google.com:655350/q?word=text#marked", testResult:false, execResult:null, captureGroup:undefined, captureValue:undefined },
		// shttp not valid
		{ options:undefined, input:"shttp://google.com:80/q?word=text#marked", testResult:false, execResult:null, captureGroup:undefined, captureValue:undefined },
		// shttp not valid; but a space the url can be found
		{ options:undefined, input:"s http://google.com:80/q?word=text#marked", testResult:true, execResult:["http://google.com:80/q?word=text#marked"], captureGroup:undefined, captureValue:undefined },
		// shttp not valid; but even with a space, the anchor stops it from being found
		{ options:{anchored:true}, input:"s http://google.com:80/q?word=text#marked", testResult:false, execResult:null, captureGroup:undefined, captureValue:undefined },
		// ftps not valid
		{ options:undefined, input:"ftps://google.com:80/q?word=text#marked", testResult:false, execResult:null, captureGroup:undefined, captureValue:undefined },

		// { options:undefined, input:"STRING", testResult:true, execResult:null, captureGroup:undefined, captureValue:undefined },
	];
	tests.forEach(({ options, input, testResult, execResult, captureGroup, captureValue }) => {
		// simple test
		test(tagLiterals`getUrlRegex(${options}).test(${input}) === ${testResult}`, () => {
			// console.debug(getUrlRegex(options))
			expect(getUrlRegex(options).test(input)).toBe(testResult);
		});
		// if failed, we expect null
		if (execResult === null) {
			test(tagLiterals`getUrlRegex(${options}).exec(${input}) === null`, () => {
				expect(getUrlRegex(options).exec(input)).toBeNull();
			});

		}else {
			// compare exec results
			test(tagLiterals`getUrlRegex(${options}).exec(${input}) equals ${execResult}`, () => {
				// full match is index 0, capture value is index 1
				const expected = captureValue ? execResult.concat([captureValue]) : execResult;
				expect(String(getUrlRegex(options).exec(input))).toBe(String(expected));
			});

			if (captureGroup || captureValue) {
				// get capture group results
				test(tagLiterals`getUrlRegex(${options}).exec(${input}) equals ${execResult}`, () => {
					expect(getUrlRegex(options).exec(input).groups[captureGroup]).toBe(captureValue);
				});

			}else {
				// ensure capture group is undefined
				test(tagLiterals`getUrlRegex(${options}).exec(${input}).groups === undefined`, () => {
					expect(getUrlRegex(options).exec(input).groups).toBeUndefined();
				});
			}
		}
	});

	const wrapRegex = getUrlRegex({ wrapChars:"<>" });

	const wrapGoodUrls = [
		"<http://google.com/q?word=text#marked>",
		"<https://google.com:80/q?word=text#marked>"
	];
	wrapGoodUrls.forEach(url => {
		test(tagLiterals`${wrapRegex}.test(${url}) === true`, () => {
			expect(wrapRegex.test(url)).toBe(true);
			expect(wrapRegex.exec(url)[0]).toBe(url);
		});
	});

	const wrapBadUrls = [
		"http://google.com/q?word=text#marked",
		"https://google.com:80/q?word=text#marked"
	];
	wrapBadUrls.forEach(url => {
		test(tagLiterals`${wrapRegex}.test(${url}) === false`, () => {
			expect(wrapRegex.test(url)).toBe(false);
			expect(wrapRegex.exec(url)).toBeNull();
		});
	});

	const wrapOptionalRegex = getUrlRegex({ wrapChars:"<>", wrapOptional:true });

	const wrapOptionalGoodUrls = [
		"http://google.com/q?word=text#marked",
		"<https://google.com:80/q?word=text#marked>"
	];
	wrapOptionalGoodUrls.forEach(url => {
		test(tagLiterals`getUrlRegex({ wrapChars:"<>", wrapOptional:true }).test(${url}) === true`, () => {
			expect(wrapOptionalRegex.test(url)).toBe(true);
			expect(wrapOptionalRegex.exec(url)[0]).toBe(url);
		});
	});

	const wrapOptionalBadUrls = [
		"ftps://google.com/q?word=text#marked",
		"<ftps://google.com:80/q?word=text#marked>"
	];
	wrapOptionalBadUrls.forEach(url => {
		test(tagLiterals`getUrlRegex({ wrapChars:"<>", wrapOptional:true }).test(${url}) === false`, () => {
			expect(wrapOptionalRegex.test(url)).toBe(false);
			expect(wrapOptionalRegex.exec(url)).toBeNull();
		});
	});

	const anchoredWrapOptionalRegex = getUrlRegex({ anchored:true, wrapChars:"<>", wrapOptional:true });
	const anchoredWrapOptionalGoodUrls = [
		"https://cdn.discordapp.com/attachments/1173111558428184678/1204632128369983578/image.png?ex=65d57018&is=65c2fb18&hm=dfe49eddd9d55f29dd00a6d12e1bcc6e64218b7598b62827c32b15c5f0d466e3&",
	];
	anchoredWrapOptionalGoodUrls.forEach(url => {
		test(tagLiterals`getUrlRegex({ anchored:true, wrapChars:"<>", wrapOptional:true }).test(${url}) === true`, () => {
			expect(anchoredWrapOptionalRegex.test(url)).toBe(true);
			expect(anchoredWrapOptionalRegex.exec(url)[0]).toBe(url);
		});
	});

});

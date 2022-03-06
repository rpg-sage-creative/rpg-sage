const LZString = require("lz-string");
// const lzma = require("lzma");
const fs = require("fs");

// const decoder = lz4.createDecoderStream();
// const input = fs.createReadStream("pf2e-raw.txt");
// const output = fs.createWriteStream("pf2e.txt");
// input.pipe(decoder).pipe(output);

function log(o) { if (o) console.log(o) }
function error(err) { }
[undefined,'ascii', 'utf8', 'utf-8', 'utf16le', 'ucs2', 'ucs-2', 'base64', 'base64url', 'latin1', 'binary', 'hex'].forEach((fsEnc,fsI) => {
	if (fsI) return;
	const buffer = fs.readFileSync("pf2e-raw.txt", { encoding:fsEnc });
	console.log(Object.prototype.toString.call(buffer),Object.prototype.toString.call(buffer.buffer), buffer.byteLength);
	[undefined,'ascii', 'utf8', 'utf-8', 'utf16le', 'ucs2', 'ucs-2', 'base64', 'base64url', 'latin1', 'binary', 'hex'].forEach(enc => {
		const raw = buffer.toString(enc)
		try { log(JSON.parse(LZString.decompress(raw))); }catch(ex) { error(ex); }
		try { log(JSON.parse(LZString.decompressFromBase64(raw))); }catch(ex) { error(ex); }
		try { log(JSON.parse(LZString.decompressFromEncodedURIComponent(raw))); }catch(ex) { error(ex); }
		try { log(JSON.parse(LZString.decompressFromUTF16(raw))); }catch(ex) { error(ex); }
		try { log(JSON.parse(LZString.decompressFromUint8Array(buffer))); }catch(ex) { error(ex); }
		try { log(JSON.parse(LZString.decompressFromUint8Array(buffer.buffer))); }catch(ex) { error(ex); }
	})
})
	// console.log(LZString.decompressFromUint8Array(raw));

/*
// (function() {
// 	indexedDB.open("pathbuilder2e_db").onsucces = onDataOpen;
// 	function onDataOpen(ev) {
// 		const db = ev.target.result;
// 		db.transaction("data").objectStore("data").get(43).onsuccess = onDataGet;
// 	}
// 	function onDataGet(ev) {
// 		const raw = ev.target.result;
// 	}
// })()
*/

const fs = require("fs");
const raw = fs.readFileSync("./pf2e-raw.txt");
function gt(t, e, i) { if (e > i) throw ui("Cannot coerce value to an empty range: maximum " + i + " is less than minimum " + e + "."); return t < e ? e : t > i ? i : t }
function jt() { }
function Dtt(t) { this.this$MainActivity = t }
function xtt() {
	jtt = this,
	this.keyStr_0 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=",
	this.keyStrUri_0 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+-$"
}
function ztt(t, e, i) {
	void 0 === t && (t = 48),
	void 0 === e && (e = 0),
	void 0 === i && (i = 1),
	this.value = K(t),
	this.position = e,
	this.index = i
}
function Ott(t, e, i, a, r, o, s, l) {
	return function () {
		var o = t.v,
			c = function (t, e, i, a, r) {
				return function () {
					for (var o = t.v, s = 0; s < o; s++) {
						var l = e,
							c = i;
						l.v = l.v << 1,
						c()
					}
					r.v = 0 | a.v.charCodeAt(0);
					for (var p = 0; p < 8; p++) {
						var h = e,
							d = r,
							u = i;
						h.v = h.v << 1 | 1 & d.v,
						u(),
						d.v = d.v >> 1
					}
					return n
				}
			}(e, i, a, t, r),
			p = function (t, e, i, a, r) {
				return function () {
					t.v = 1;
					for (var o = e.v, s = 0; s < o; s++) {
						var l = i,
							c = t,
							p = a;
						l.v = l.v << 1 | c.v,
						p(),
						c.v = 0
					}
					t.v = 0 | r.v.charCodeAt(0);
					for (var h = 0; h < 16; h++) {
						var d = i,
							u = t,
							_ = a;
						d.v = d.v << 1 | 1 & u.v,
						_(),
						u.v = u.v >> 1
					}
					return n
				}
			}(r, e, i, a, t);
		(0 | o.charCodeAt(0)) < 256 ? c() : p(),
		s(),
		l.remove_11rb$(t.v)
	}
}
function Ftt(t) {
	return K(Bt(t))
}
function Btt(t) {
	return K(Bt(t + 32 | 0))
}
Dtt.prototype.completed_asi2v1$ = function (t) {
	this.this$MainActivity.loaderSet_0.setCustomFileHashMap_asi2v1$(t),
	this.this$MainActivity.masterDataHandler.requestDataComp()
},
// Dtt.$metadata$ = { kind: p, interfaces: [J8] },
// utt.$metadata$ = { kind: p, simpleName: "MainActivity", interfaces: [] },
// ztt.$metadata$ = { kind: p, simpleName: "Data", interfaces: [] },
ztt.prototype.component1 = function () { return this.value },
ztt.prototype.component2 = function () { return this.position },
ztt.prototype.component3 = function () { return this.index },
ztt.prototype.copy_t0c4sj$ = function (t, e, i) {
	return new ztt(void 0 === t ? this.value : t, void 0 === e ? this.position : e, void 0 === i ? this.index : i)
},
ztt.prototype.toString = function () {
	return "Data(value=" + e.toString(this.value) + ", position=" + e.toString(this.position) + ", index=" + e.toString(this.index) + ")"
},
ztt.prototype.hashCode = function () {
	var t = 0;
	return t = 31 * (t = 31 * (t = 31 * t + e.hashCode(this.value) | 0) + e.hashCode(this.position) | 0) + e.hashCode(this.index) | 0;
},
ztt.prototype.equals = function (t) {
	return this === t || null !== t && "object" == typeof t && Object.getPrototypeOf(this) === Object.getPrototypeOf(t) && e.equals(this.value, t.value) && e.equals(this.position, t.position) && e.equals(this.index, t.index)
},
xtt.prototype.charLess256_0 = function (t, e, i) {
	(0 | t.charCodeAt(0)) < 256 ? e() : i()
},
xtt.prototype.power_0 = function (t) { return 1 << t },
xtt.prototype._compress_0 = function (t, i, a) {
	var r, n, s, l, c, p, h, _,
		f = { v: null }, m = { v: null }, $ = { v: "" }, g = { v: null },
		v = Ot(), S = Ot(), C = { v: 3 }, E = u(), A = { v: 2 }, b = { v: 0 }, w = { v: 0 },
		L = (r = { v: 2 }, n = A, function () {
			var t, e;
			if (t = r.v, r.v = t - 1, 0 === r.v) {
				var i = r, a = n.v;
				i.v = I.pow(2, a), e = n.v, n.v = e + 1 | 0
			}
		}),
		T = (s = w, l = i, c = E, p = a, h = b, function () {
			var t; s.v === (l - 1 | 0) ? (s.v = 0, c.add_11rb$(p(h.v)), h.v = 0) : (t = s.v, s.v = t + 1 | 0)
		}),
		k = function (t, e, i, a, r, n, s, l, c) {
			return function () {
				if (t.containsKey_11rb$(e.v)) i();
				else {
					r.v = o(a.get_11rb$(e.v));
					for (var p = n.v, h = 0; h < p; h++) {
						var d = s, u = r, _ = l;
						d.v = d.v << 1 | 1 & u.v, _(), u.v = u.v >> 1
					}
				}
				c()
			}
		}(S, $, Ott($, A, b, T, m, 0, L, S), v, m, A, b, T, L);
	for (_ = Pt(t); _.hasNext();) {
		var R, P = Mt(_.next()), M = K(P);
		if (f.v = String.fromCharCode(Mt(M)), null == v.get_11rb$(f.v)) {
			var N, D = f.v, x = (N = C.v, C.v = N + 1 | 0, N);
			v.put_xwzc9p$(D, x);
			var z = f.v;
			S.put_xwzc9p$(z, !0)
		}
		g.v = $.v + f.v;
		var O, F = g.v;
		if ((e.isType(O = v, y) ? O : d()).containsKey_11rb$(F))
			$.v = g.v;
		else {
			k();
			var B = g.v, j = (R = C.v, C.v = R + 1 | 0, R);
			v.put_xwzc9p$(B, j), $.v = f.v
		}
	}
	gt($.v) || k(), m.v = 2;
	for (var H = A.v, q = 0; q < H; q++)
		b.v = b.v << 1 | 1 & m.v,
		w.v === (i - 1 | 0) ? (w.v = 0, E.add_11rb$(a(b.v)), b.v = 0) : w.v = w.v + 1 | 0,
		m.v = m.v >> 1;
	for (; ;) {
		if (b.v = b.v << 1, w.v === (i - 1 | 0)) {
			E.add_11rb$(a(b.v));
			break
		}
		w.v = w.v + 1 | 0
	}
	return Ft(E, "")
},
xtt.prototype.get_string_0 = function (t) { return String.fromCharCode(Bt(t)) },
xtt.prototype._decompress_0 = function (t, i, a) {
	var r, n, o, s, l, c, p, h, d, u, _, f, y, m, $, g, v,
		S = jt(),
		C = Ht([this.get_string_0(0), this.get_string_0(1), this.get_string_0(2)]),
		E = { v: 0 },
		A = new ztt(Mt(a(0)), i, 1),
		b = { v: "" }, I = { v: 3 }, w = { v: 4 }, L = { v: 4 }, T = { v: 0 },
		k = (l = E, c = this, p = { v: null }, h = { v: null }, d = A, u = { v: null }, _ = i, f = a, y = b, m = C, $ = L, g = T, v = w, function (t, i, a, r) {
			var n, o, s;
			for (void 0 === r && (r = 0), l.v = t, p.v = c.power_0(a), h.v = i; h.v !== p.v;)
				u.v = (0 | Mt(d.value)) & d.position,
				d.position = d.position >> 1,
				0 === d.position && (d.position = _, d.value = f((n = d.index, d.index = n + 1 | 0, n))),
				l.v = l.v | e.imul(u.v > 0 ? 1 : 0, h.v),
				h.v = h.v << 1;
			switch (r) {
				case 0: break;
				case 1: y.v = c.get_string_0(l.v); break;
				case 2: m.add_wxm5ur$((o = $.v, $.v = o + 1 | 0, o), c.get_string_0(l.v)),
					g.v = $.v - 1 | 0, s = v.v, v.v = s - 1 | 0
			}
		}),
		R = function (t, e, i) {
			return function () {
				var a;
				0 === t.v && (t.v = i.power_0(e.v), a = e.v, e.v = a + 1 | 0)
			}
		}(w, I, this);
	switch (k(E.v, 1, 2), T.v = E.v, T.v) {
		case 0: k(0, 1, 8, 1); break;
		case 1: k(0, 1, 16, 1); break;
		case 2: return ""
	}
	for (C.add_wxm5ur$(3, b.v), o = b.v, S.append_pdl1vj$(o); ;) {
		if (A.index > t) return "";
		switch (k(0, 1, I.v), T.v = E.v, T.v) {
			case 0: k(0, 1, 8, 2); break;
			case 1: k(0, 1, 16, 2); break;
			case 2: return S.toString()
		}
		if (R(), C.size > T.v) r = C.get_za3lpa$(T.v);
		else {
			if (T.v !== L.v) return null;
			r = o + String.fromCharCode(K(o.charCodeAt(0)))
		}
		s = r,
		S.append_pdl1vj$(s),
		C.add_wxm5ur$((n = L.v, L.v = n + 1 | 0, n), o + String.fromCharCode(K(s.charCodeAt(0)))),
		w.v = w.v - 1 | 0, o = s, R()
	}
},
xtt.prototype.compress_61zpoe$ = function (t) { return this._compress_0(t, 16, Ftt) },
xtt.prototype.decompres_61zpoe$ = function (t) { return gt(t) ? null : this._decompress_0(t.length, 32768, (e = t, function (t) { return K(e.charCodeAt(t)) })); var e },
xtt.prototype.decompressFromEncodedURIComponent_61zpoe$ = function (t) { return gt(t) ? "" : this._decompress_0(t.length, 32, (e = this, i = t, function (t) { return K(Bt(qt(e.keyStrUri_0, i.charCodeAt(t)))) })); var e, i },
xtt.prototype.compressToEncodedURIComponent_61zpoe$ = function (t) { return this._compress_0(t, 6, (e = this, function (t) { return K(e.keyStrUri_0.charCodeAt(t)) })); var e },
xtt.prototype.compressToBase64_61zpoe$ = function (t) { var e, i, a = this._compress_0(t, 6, (i = this, function (t) { return K(i.keyStr_0.charCodeAt(t)) })); switch (a.length % 4) { case 0: e = a; break; case 1: e = a + "==="; break; case 2: e = a + "=="; break; case 3: e = a + "="; break; default: throw Ut("i do not know what happened") }return e },
xtt.prototype.decompressFromBase64_61zpoe$ = function (t) { return gt(t) ? null : this._decompress_0(t.length, 32, (e = this, i = t, function (t) { return K(Bt(qt(e.keyStr_0, i.charCodeAt(t)))) })); var e, i },
xtt.prototype.decompressFromUTF16_61zpoe$ = function (t) { return gt(t) ? null : this._decompress_0(t.length, 16384, (e = t, function (t) { return K(Bt((0 | e.charCodeAt(t)) - 32 | 0)) })); var e },
xtt.prototype.compressToUTF16_61zpoe$ = function (t) { return this._compress_0(t, 15, Btt) + " " }
// xtt.$metadata$ = { kind: f, simpleName: "LZ4K", interfaces: [] };
var jtt = null;
function Htt() { return null === jtt && new xtt, jtt }
function It(t) { return new vt((e = t, function () { return e.iterator() })); var e }
function parseData_bm4lxs$(t, i) {
	var a, r, n, o, c, e;
	try {
		var p, h = Htt().decompressFromBase64_61zpoe$(It(e.isCharSequence(p = t) ? p : d()).toString()),
		u = JSON.parse("string" == typeof (a = h) ? a : d());
		for (r = At(Object.keys(u)); r.hasNext();) {
			var _ = r.next(), f = "string" == typeof (n = u[_]) ? n : d();
			c = this.hashMapRawData;
			var y = "string" == typeof (o = _) ? o : d();
			c.put_xwzc9p$(y, f)
		}
		this.mainActivity_0.onFinishedLoadingRaw()
	} catch (t) {
		if (!e?.isType(t, l)) throw t;
		s(t), console.log("failed to parse data!"), this.mainActivity_0.fileManager.clearDataAndDownloadFresh_za3lpa$(i + 1 | 0)
	}
}

console.log(Htt().decompressFromBase64_61zpoe$(raw));
console.log(parseData_bm4lxs$(raw));
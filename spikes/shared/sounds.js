var C28_SOUNDS = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	//#region src/engine/audio/synth.ts
	const BASE_RATE = 11025;
	const TAU = Math.PI * 2;
	function seeded(seed) {
		let state = seed >>> 0;
		return () => {
			state = state + 1831565813 >>> 0;
			let z = state;
			z = Math.imul(z ^ z >>> 15, z | 1);
			z ^= z + Math.imul(z ^ z >>> 7, z | 61);
			return ((z ^ z >>> 14) >>> 0) / 4294967296 * 2 - 1;
		};
	}
	function buffer(seconds) {
		return new Float32Array(Math.round(seconds * BASE_RATE));
	}
	function firstEndingAfter(times, t) {
		let [lo, hi] = [1, times.length];
		while (lo < hi) {
			const mid = lo + hi >> 1;
			if (times[mid] < t) lo = mid + 1;
			else hi = mid;
		}
		return lo;
	}
	function envelope(points) {
		const times = points.map(([at]) => at);
		const values = points.map(([, v]) => v);
		return (t) => {
			const i = firstEndingAfter(times, t);
			if (i >= times.length) return 0;
			const [t0, v0, t1, v1] = [
				times[i - 1],
				values[i - 1],
				times[i],
				values[i]
			];
			if (t < t0) return 0;
			return t1 === t0 ? v1 : v0 + (v1 - v0) * (t - t0) / (t1 - t0);
		};
	}
	function sweep(points) {
		const times = points.map(([at]) => at);
		const values = points.map(([, v]) => v);
		return (t) => {
			if (t <= times[0]) return values[0];
			const i = firstEndingAfter(times, t);
			if (i >= times.length) return values[values.length - 1];
			const [t0, v0, t1, v1] = [
				times[i - 1],
				values[i - 1],
				times[i],
				values[i]
			];
			return t1 === t0 ? v1 : v0 * (v1 / v0) ** ((t - t0) / (t1 - t0));
		};
	}
	function wave(shape, phase) {
		switch (shape) {
			case "sine": return Math.sin(phase * TAU);
			case "square": return phase < .5 ? 1 : -1;
			case "saw": return phase * 2 - 1;
			case "triangle": return 1 - 4 * Math.abs(phase - .5);
		}
	}
	function osc(shape, freq) {
		let phase = 0;
		return (t) => {
			const value = wave(shape, phase);
			phase = (phase + freq(t) / BASE_RATE) % 1;
			return value;
		};
	}
	function onePole(cutoff, kind) {
		const alpha = 1 - Math.exp(-TAU * cutoff / BASE_RATE);
		let low = 0;
		return (x) => {
			low += alpha * (x - low);
			return kind === "low" ? low : x - low;
		};
	}
	function biquad(kind, freq, q) {
		const w = TAU * freq / BASE_RATE;
		const cos = Math.cos(w);
		const alpha = Math.sin(w) / (2 * q);
		const a0 = 1 + alpha;
		const [n0, n1, n2] = kind === "low" ? [
			(1 - cos) / 2,
			1 - cos,
			(1 - cos) / 2
		] : kind === "high" ? [
			(1 + cos) / 2,
			-(1 + cos),
			(1 + cos) / 2
		] : [
			alpha,
			0,
			-alpha
		];
		const b0 = n0 / a0;
		const b1 = n1 / a0;
		const b2 = n2 / a0;
		const a1 = -2 * cos / a0;
		const a2 = (1 - alpha) / a0;
		let x1 = 0;
		let x2 = 0;
		let y1 = 0;
		let y2 = 0;
		return (x) => {
			const y = b0 * x + b1 * x1 + b2 * x2 - a1 * y1 - a2 * y2;
			x2 = x1;
			x1 = x;
			y2 = y1;
			y1 = y;
			return y;
		};
	}
	function fill(out, fn) {
		for (let i = 0; i < out.length; i++) out[i] = fn(i / BASE_RATE, i);
		return out;
	}
	function quantize8(samples) {
		return samples.map((x) => {
			return (Math.min(127, Math.max(-128, Math.round(x * 127.5 - .5))) + .5) / 127.5;
		});
	}
	//#endregion
	//#region src/game/sound/recipes/shape.ts
	const render = (seconds, sample) => quantize8(fill(buffer(seconds), sample));
	const clip = (x, drive) => Math.tanh(x * drive) / Math.tanh(drive);
	const grain = (level, until) => {
		const noise = seeded(99);
		return (t) => t < until ? level * noise() : 0;
	};
	function steady(seconds, source, windowSeconds = .005) {
		const raw = fill(buffer(seconds), source);
		const half = Math.max(1, Math.round(windowSeconds * BASE_RATE / 2));
		const energy = new Float64Array(raw.length + 1);
		raw.forEach((x, i) => energy[i + 1] = energy[i] + x * x);
		return raw.map((x, i) => {
			const from = Math.max(0, i - half);
			const to = Math.min(raw.length, i + half);
			const power = (energy[to] - energy[from]) / (to - from);
			return power > 0 ? x / Math.sqrt(power) : 0;
		});
	}
	const fadeOut = (end, seconds = .01) => (t) => Math.min(1, Math.max(0, (end - t) / seconds));
	const steps = (width, levels) => (t) => levels[Math.floor(t / width)] ?? 0;
	const driven = (carrier, drive, windowSeconds = .01) => steady(carrier.length / BASE_RATE, (_, i) => clip(carrier[i], drive), windowSeconds);
	function sweptLow(cutoff) {
		let first = 0;
		let second = 0;
		return (x, t) => {
			const alpha = 1 - Math.exp(-2 * Math.PI * cutoff(t) / BASE_RATE);
			first += alpha * (x - first);
			second += alpha * (first - second);
			return second / Math.sqrt(alpha);
		};
	}
	//#endregion
	//#region src/game/sound/recipes/combat.ts
	function gunShot() {
		const noise = seeded(1);
		const rumble = onePole(200, "low");
		const hiss = biquad("band", 1200, .5);
		const thump = osc("sine", sweep([[.02, 110], [.06, 60]]));
		const kick = envelope([
			[0, 0],
			[.019, 0],
			[.022, 2],
			[.055, 2],
			[.065, 0]
		]);
		const body = envelope([
			[0, 0],
			[.019, 0],
			[.022, .3],
			[.05, .6],
			[.06, .9],
			[.19, .9],
			[.2, .3],
			[.23, .2],
			[.245, .13],
			[.27, .18],
			[.29, .17],
			[.3, .07],
			[.35, .06],
			[.5, .03],
			[.6, .025],
			[.8, .012],
			[.86, 0]
		]);
		const tail = envelope([
			[0, 0],
			[.2, 0],
			[.3, .3],
			[.45, .25],
			[.55, .18],
			[.7, .13],
			[.8, .08],
			[.9, 0]
		]);
		return render(1.187, (t) => {
			const n = noise();
			return clip(body(t) * 8 * rumble(n) + kick(t) * thump(t), 1.5) + tail(t) * hiss(n);
		});
	}
	function cannon() {
		const noise = seeded(16);
		const rumble = biquad("low", 160, .7);
		const crackle = biquad("high", 500, .7);
		const thump = osc("square", () => 80);
		const kick = envelope([
			[0, -.4],
			[.01, -.4],
			[.012, 0],
			[.023, 0],
			[.024, .5],
			[.045, .5],
			[.047, 0]
		]);
		const crack = envelope([
			[0, 0],
			[.011, 0],
			[.012, .4],
			[.022, .4],
			[.023, .05],
			[.05, .05],
			[.056, .5],
			[.13, .45],
			[.16, .4],
			[.3, .32],
			[.36, .18],
			[.42, .06],
			[.5, 0]
		]);
		const boom = envelope([
			[0, 0],
			[.13, 0],
			[.15, .4],
			[.175, .6],
			[.29, .62],
			[.31, .46],
			[.33, .54],
			[.36, .42],
			[.4, .52],
			[.425, .31],
			[.45, .23],
			[.495, .44],
			[.515, .1],
			[.54, .3],
			[.565, .14],
			[.59, .22],
			[.61, .14],
			[.69, .15],
			[.725, .08],
			[.77, .2],
			[.84, .08],
			[.885, .1],
			[.9, .48],
			[.92, .45],
			[.94, .1],
			[1, .04],
			[1.06, .12],
			[1.12, .06],
			[1.21, .2],
			[1.24, .1],
			[1.3, .15],
			[1.33, .13],
			[1.37, .08],
			[1.5, .1],
			[1.6, .07],
			[1.71, .05],
			[1.722, 0]
		]);
		const floor = grain(.02, 1.72);
		return render(1.733, (t) => {
			const n = noise();
			return clip(boom(t) * 8 * rumble(n) + kick(t) * thump(t), 1.2) + crack(t) * crackle(n) + floor(t);
		});
	}
	function laser() {
		const noise = seeded(3);
		const tone = osc("sine", sweep([
			[.07, 2600],
			[.082, 2150],
			[.105, 1460],
			[.128, 1077],
			[.151, 689],
			[.175, 517],
			[.198, 388],
			[.233, 258],
			[.28, 175],
			[.32, 125],
			[.38, 88],
			[.46, 63],
			[.54, 47],
			[.61, 38],
			[.72, 32],
			[.86, 27],
			[1.04, 24],
			[1.2, 21],
			[1.575, 18]
		]));
		const level = envelope([
			[0, 0],
			[.045, 0],
			[.06, .2],
			[.1, .3],
			[.13, .5],
			[.16, 1],
			[.6, 1],
			[.65, .8],
			[.97, .8],
			[1, .45],
			[1.02, .3],
			[1.045, .23],
			[1.07, .17],
			[1.115, .12],
			[1.16, .1],
			[1.2, .06],
			[1.28, .045],
			[1.35, .035],
			[1.4, .015],
			[1.45, .025],
			[1.53, .015],
			[1.575, 0]
		]);
		const smooth = biquad("low", 1800, .7);
		const wobble = osc("sine", () => 40);
		const zap = envelope([
			[0, .6],
			[.004, .6],
			[.005, 0],
			[.008, .5],
			[.04, .45],
			[.06, 0]
		]);
		const rumble = envelope([
			[0, .8],
			[.06, .8],
			[.12, 0]
		]);
		const floor = grain(.01, 1.565);
		return render(1.575, (t) => smooth(clip(level(t) * tone(t), 3)) + zap(t) * noise() + rumble(t) * wobble(t) + floor(t));
	}
	function beam() {
		const noise = seeded(4);
		const hiss = biquad("high", 3500, .7);
		const tone = osc("sine", sweep([
			[.012, 5200],
			[.035, 3800],
			[.046, 2600],
			[.057, 1600],
			[.069, 1150],
			[.081, 820],
			[.1, 660],
			[.13, 540],
			[.17, 410],
			[.21, 300],
			[.26, 230],
			[.35, 200]
		]));
		const level = envelope([
			[0, 0],
			[.012, 0],
			[.014, .04],
			[.026, .06],
			[.033, .55],
			[.039, .68],
			[.05, .56],
			[.064, .44],
			[.075, .29],
			[.082, .2],
			[.11, .16],
			[.14, .12],
			[.17, .085],
			[.2, .06],
			[.33, .05],
			[.348, 0]
		]);
		const chirp = osc("sine", sweep([
			[.265, 4500],
			[.29, 2400],
			[.3, 1600],
			[.32, 850],
			[.35, 680]
		]));
		const echo = envelope([
			[0, 0],
			[.265, 0],
			[.275, .1],
			[.3, .1],
			[.34, .05],
			[.348, 0]
		]);
		const click = envelope([
			[0, 1],
			[.011, 1],
			[.012, 0]
		]);
		const floor = grain(.035, .335);
		return render(.351, (t) => {
			const crackle = hiss(noise());
			return clip(level(t) * tone(t), 1.2) + echo(t) * chirp(t) + (click(t) + .03 * level(t)) * crackle + floor(t);
		});
	}
	function punch() {
		const noise = seeded(5);
		const hiss = biquad("high", 1500, .7);
		const crack = biquad("band", 900, .8);
		const tone = osc("sine", sweep([
			[.035, 250],
			[.036, 100],
			[.04, 100],
			[.21, 40]
		]));
		const swing = envelope([
			[0, .2],
			[.008, .5],
			[.012, .9],
			[.02, .6],
			[.05, .65],
			[.09, .8],
			[.12, 1],
			[.214, 1],
			[.222, 0]
		]);
		const ring = osc("sine", () => 120);
		const tail = envelope([
			[0, 0],
			[.214, 0],
			[.225, 1.1],
			[.338, 1],
			[.352, 0]
		]);
		const grit = envelope([
			[0, .15],
			[.01, 0],
			[.205, 0],
			[.215, .06],
			[.25, 0]
		]);
		const smack = envelope([
			[0, 0],
			[.003, 8],
			[.03, 5],
			[.08, 2],
			[.15, .8],
			[.214, .5],
			[.23, 0]
		]);
		const floor = grain(.045, .35);
		return render(.363, (t) => .5 * clip(swing(t) * tone(t), 6) + smack(t) * crack(noise()) + tail(t) * (.1 + .17 * ring(t)) + grit(t) * hiss(noise()) + floor(t));
	}
	function explosion() {
		const noise = seeded(17);
		const rumble = onePole(200, "low");
		const level = envelope([
			[0, 1.1],
			[.05, 1.2],
			[.065, .4],
			[.085, .35],
			[.105, .85],
			[.135, .75],
			[.195, .42],
			[.24, .38],
			[.285, .4],
			[.375, .48],
			[.435, .85],
			[.47, .7],
			[.5, .75],
			[.555, .55],
			[.6, .6],
			[.625, .3],
			[.645, .22],
			[.706, .2],
			[.766, .12],
			[.946, .22],
			[1.066, .19],
			[1.126, .09],
			[1.306, .15],
			[1.366, .1],
			[1.606, .1],
			[1.696, .045],
			[1.756, .06],
			[1.816, .03],
			[2.1, .015],
			[2.6, .01],
			[2.68, 0]
		]);
		return render(2.695, (t) => clip(level(t) * 6 * rumble(noise()), 1));
	}
	//#endregion
	//#region src/game/sound/recipes/film.ts
	function servo() {
		const noise = seeded(41);
		const pitch = sweep([
			[0, 175],
			[.15, 190],
			[.25, 207],
			[.37, 216],
			[.5, 210],
			[.63, 199]
		]);
		const harmonics = [
			[2, 1],
			[5, .8],
			[7, .4],
			[8, .35],
			[10, .15]
		];
		const hiss = biquad("low", 1100, .7);
		const smooth = biquad("low", 1100, .7);
		const hum = osc("sine", () => 64);
		const whining = envelope([
			[0, .2],
			[.1, .3],
			[.22, 1],
			[.632, 1]
		]);
		const buzz = biquad("band", 1250, 3);
		const buzzing = envelope([
			[0, 1],
			[.12, 1],
			[.22, 0],
			[.632, 0]
		]);
		let cycles = 0;
		const carrier = steady(.632, (t) => {
			cycles += pitch(t) / BASE_RATE;
			const whine = harmonics.reduce((sum, [k, w]) => sum + w * Math.sin(2 * Math.PI * k * cycles), 0);
			const n = noise();
			return smooth(hiss(n)) * 2 + .5 * whining(t) * whine + .4 * hum(t) + buzzing(t) * buzz(n);
		});
		const level = envelope([
			[0, .9],
			[.008, .85],
			[.015, .1],
			[.025, .12],
			[.045, .31],
			[.055, .31],
			[.065, .24],
			[.075, .35],
			[.085, .38],
			[.095, .38],
			[.115, .29],
			[.155, .45],
			[.175, .4],
			[.185, .28],
			[.195, .23],
			[.215, .49],
			[.225, .58],
			[.235, .4],
			[.265, .34],
			[.275, .45],
			[.285, .49],
			[.295, .46],
			[.305, .37],
			[.325, .4],
			[.355, .17],
			[.375, .42],
			[.385, .5],
			[.415, .34],
			[.425, .42],
			[.445, .37],
			[.475, .55],
			[.515, .22],
			[.525, .36],
			[.535, .28],
			[.545, .34],
			[.575, .27],
			[.585, .34],
			[.595, .35],
			[.605, .32],
			[.618, .23],
			[.6181, 0],
			[.632, 0]
		]);
		return render(.632, (t, i) => level(t) * carrier[i]);
	}
	function hatch() {
		const noise = seeded(46);
		const rumble = biquad("low", 160, .8);
		const carrier = driven(steady(.3365, () => rumble(noise()), .01), 4);
		const level = steps(.01, [
			.65,
			.81,
			.79,
			.64,
			.79,
			.83,
			.8,
			.75,
			.8,
			.69,
			.66,
			.74,
			.8,
			.79,
			.73,
			.83,
			.71,
			.74,
			.66,
			.63,
			.83,
			.71,
			.77,
			.72,
			.89,
			.68,
			.68,
			.86,
			.84,
			.86,
			.76,
			.75,
			1.4
		]);
		const fade = fadeOut(.3265);
		return render(.3365, (t, i) => fade(t) * level(t) * carrier[i]);
	}
	function slam() {
		const noise = seeded(47);
		const thud = biquad("low", 220, 1);
		const body = biquad("low", 900, .7);
		const hiss = biquad("high", 3800, .7);
		const bodied = envelope([
			[0, .25],
			[.15, .1],
			[.3, .05],
			[.5, 0],
			[.79, 0]
		]);
		const hissing = envelope([
			[0, .3],
			[.05, .1],
			[.15, .04],
			[.45, .015],
			[.6, 0],
			[.79, 0]
		]);
		const carrier = driven(steady(.79, (t) => {
			const n = noise();
			return thud(n) + bodied(t) * body(n) + hissing(t) * hiss(n);
		}, .01), 2.5);
		const level = envelope([
			[0, .71],
			[.065, .91],
			[.085, .78],
			[.115, .83],
			[.125, .73],
			[.145, .89],
			[.155, .68],
			[.165, .91],
			[.215, .67],
			[.265, .87],
			[.285, .83],
			[.295, .66],
			[.305, .81],
			[.315, .7],
			[.335, .82],
			[.355, .76],
			[.365, .57],
			[.385, .78],
			[.395, .55],
			[.425, .82],
			[.435, .41],
			[.445, .73],
			[.455, .75],
			[.485, .53],
			[.505, .68],
			[.515, .32],
			[.545, .54],
			[.555, .45],
			[.565, .24],
			[.595, .34],
			[.605, .18],
			[.625, .13],
			[.635, .25],
			[.645, .12],
			[.665, .19],
			[.685, .1],
			[.705, .1],
			[.715, .05],
			[.725, .09],
			[.735, .05],
			[.755, .11],
			[.775, .05],
			[.78, 0],
			[.79, 0]
		]);
		return render(.79, (t, i) => level(t) * carrier[i]);
	}
	function heavyDoor() {
		const noise = seeded(50);
		const hums = [
			[57, 1],
			[94, .5],
			[40, .45],
			[83, .35]
		].map(([freq, weight]) => [osc("sine", () => freq), weight]);
		const swell = osc("sine", () => 12);
		const swelling = envelope([
			[0, 0],
			[.15, 0],
			[.2, .7],
			[.22, .7],
			[.24, 0],
			[1.647, 0]
		]);
		const humming = envelope([
			[0, 0],
			[.2, 0],
			[.26, 1],
			[1.647, 1]
		]);
		const rumble = biquad("low", 200, .7);
		const crash = biquad("low", 700, .7);
		const crashing = envelope([
			[0, 0],
			[.3, 0],
			[.34, 1],
			[.47, 1],
			[.55, .2],
			[.65, 0],
			[.69, 0],
			[.7, 1],
			[.72, 0],
			[1.647, 0]
		]);
		const carrier = driven(steady(1.647, (t) => {
			const n = noise();
			const hum = hums.reduce((sum, [tone, weight]) => sum + weight * tone(t), 0);
			return humming(t) * (hum + .4 * rumble(n)) + crashing(t) * crash(n);
		}, .01), 2);
		const level = envelope([
			[0, 0],
			[.205, 0],
			[.224, .66],
			[.234, .87],
			[.244, .48],
			[.274, .47],
			[.304, .77],
			[.314, .48],
			[.324, .73],
			[.334, .5],
			[.344, .84],
			[.374, .97],
			[.444, .9],
			[.464, .54],
			[.484, .88],
			[.524, .92],
			[.544, .63],
			[.554, .89],
			[.574, .56],
			[.604, .93],
			[.614, .57],
			[.624, .9],
			[.644, .59],
			[.663, .9],
			[.683, .85],
			[.693, .41],
			[.713, .9],
			[.723, .61],
			[.743, .8],
			[.753, .38],
			[.793, .88],
			[.803, .37],
			[.813, .67],
			[.843, .73],
			[.873, .54],
			[.883, .29],
			[.893, .82],
			[.933, .5],
			[.953, .86],
			[.973, .78],
			[.993, .34],
			[1.013, .61],
			[1.073, .33],
			[1.083, .62],
			[1.122, .33],
			[1.132, .68],
			[1.162, .54],
			[1.172, .33],
			[1.212, .59],
			[1.232, .23],
			[1.242, .52],
			[1.262, .32],
			[1.272, .45],
			[1.282, .28],
			[1.302, .33],
			[1.312, .1],
			[1.322, .36],
			[1.352, .15],
			[1.392, .44],
			[1.422, .22],
			[1.452, .3],
			[1.472, .04],
			[1.532, .13],
			[1.541, .04],
			[1.581, .13],
			[1.6, 0],
			[1.647, 0]
		]);
		return render(1.647, (t, i) => t < .007 ? -.95 : swelling(t) * swell(t) + level(t) * carrier[i]);
	}
	function crackle() {
		const noise = seeded(42);
		const hiss = biquad("high", 900, .7);
		const hum = osc("sine", sweep([
			[0, 43],
			[.3, 62],
			[.6, 48],
			[1, 59],
			[1.3, 70],
			[2, 65]
		]));
		const chirp = osc("sine", sweep([
			[0, 1460],
			[.52, 1460],
			[.82, 2900],
			[.98, 1400],
			[1.08, 2750]
		]));
		const chirping = envelope([
			[0, 0],
			[.38, 0],
			[.4, .3],
			[.5, .3],
			[.52, 0],
			[.82, 0],
			[.84, .5],
			[.96, .5],
			[.98, 0],
			[1.08, 0],
			[1.1, .3],
			[1.18, .3],
			[1.2, 0],
			[2.02, 0]
		]);
		const humming = envelope([
			[0, .7],
			[.3, 1],
			[.7, 1],
			[1.2, 1.4],
			[1.7, 2.5],
			[2.02, 2.5]
		]);
		const carrier = steady(2.02, (t) => {
			const n = noise();
			return hiss(n) + .2 * n + humming(t) * .5 * clip(hum(t), 2) + chirping(t) * chirp(t);
		}, .01);
		const level = envelope([
			[0, .44],
			[.025, .78],
			[.055, .75],
			[.085, .46],
			[.115, .77],
			[.165, .32],
			[.185, .43],
			[.205, .27],
			[.234, .67],
			[.254, .32],
			[.294, .56],
			[.324, .36],
			[.334, .54],
			[.344, .45],
			[.354, .58],
			[.414, .5],
			[.424, .75],
			[.444, .45],
			[.494, .66],
			[.514, .45],
			[.524, .75],
			[.544, .49],
			[.554, .77],
			[.574, .51],
			[.594, .77],
			[.614, .59],
			[.783, .65],
			[.793, .44],
			[.803, .6],
			[.923, .36],
			[.953, .47],
			[.983, .34],
			[1.003, .49],
			[1.023, .32],
			[1.053, .49],
			[1.202, .28],
			[1.222, .41],
			[1.242, .31],
			[1.282, .41],
			[1.302, .27],
			[1.312, .35],
			[1.322, .23],
			[1.442, .18],
			[1.671, .17],
			[1.691, .11],
			[1.711, .16],
			[2.005, 0],
			[2.02, 0]
		]);
		return render(2.02, (t, i) => level(t) * carrier[i]);
	}
	function ignition() {
		const noise = seeded(43);
		const rumble = biquad("low", 300, .7);
		const roar = biquad("low", 2e3, .7);
		const nozzle = biquad("band", 2450, 4);
		const whistle = biquad("band", 3500, 10);
		const roaring = envelope([
			[0, 0],
			[1.42, 0],
			[1.51, .4],
			[1.53, 1.2],
			[1.9, 1.2],
			[2.1, .35],
			[3.2, .15],
			[4.13, .15]
		]);
		const cracking = envelope([
			[0, 0],
			[1.52, 0],
			[1.53, 2],
			[1.57, .2],
			[1.9, .2],
			[2.1, .05],
			[4.13, .05]
		]);
		const ringing = envelope([
			[0, 0],
			[1.9, 0],
			[2.1, .7],
			[2.6, .6],
			[3.2, .35],
			[4.13, .35]
		]);
		const carrier = steady(4.13, (t) => {
			const n = noise();
			return rumble(n) + roaring(t) * roar(n) + cracking(t) * n + ringing(t) * (nozzle(n) + .2 * whistle(n));
		}, .01);
		const level = envelope([
			[0, .01],
			[.145, .11],
			[.185, .03],
			[.224, .11],
			[.264, .06],
			[.314, .18],
			[.334, .04],
			[.434, .08],
			[.454, .22],
			[.504, .09],
			[.534, .26],
			[.594, .07],
			[.693, .4],
			[.723, .38],
			[.743, .1],
			[.753, .24],
			[.783, .11],
			[.803, .31],
			[.813, .15],
			[.833, .27],
			[.853, .17],
			[.883, .45],
			[.913, .13],
			[.923, .3],
			[.933, .2],
			[.963, .37],
			[.993, .13],
			[1.003, .32],
			[1.023, .14],
			[1.033, .3],
			[1.073, .39],
			[1.142, .13],
			[1.252, .28],
			[1.282, .17],
			[1.302, .43],
			[1.322, .23],
			[1.342, .38],
			[1.352, .19],
			[1.382, .5],
			[1.412, .16],
			[1.442, .44],
			[1.452, .27],
			[1.462, .5],
			[1.492, .62],
			[1.502, .37],
			[1.532, .42],
			[1.541, .82],
			[1.561, .49],
			[1.571, .76],
			[1.621, .8],
			[1.851, .43],
			[1.881, .79],
			[1.931, .57],
			[1.961, .8],
			[1.99, .59],
			[2.21, .72],
			[2.22, .5],
			[2.23, .69],
			[2.27, .53],
			[2.28, .85],
			[2.36, .74],
			[2.38, .47],
			[2.429, .78],
			[2.499, .49],
			[2.629, .83],
			[2.639, .47],
			[2.649, .67],
			[2.699, .48],
			[2.759, .76],
			[2.779, .42],
			[2.809, .7],
			[2.878, .5],
			[2.888, .75],
			[2.928, .75],
			[2.938, .46],
			[2.968, .68],
			[2.978, .37],
			[2.998, .7],
			[3.008, .46],
			[3.058, .66],
			[3.138, .39],
			[3.168, .39],
			[3.178, .67],
			[3.238, .32],
			[3.317, .42],
			[3.337, .2],
			[3.467, .25],
			[3.6, .14],
			[3.7, .08],
			[3.8, .05],
			[3.9, .03],
			[4, .02],
			[4.12, 0],
			[4.13, 0]
		]);
		return render(4.13, (t, i) => level(t) * carrier[i]);
	}
	function flyby() {
		const noise = seeded(44);
		const dark = biquad("low", 160, .7);
		const bright = onePole(700, "low");
		const brightness = envelope([
			[0, 0],
			[.4, .1],
			[.8, .6],
			[1, 1],
			[1.3, 1],
			[1.5, .3],
			[1.8, .05],
			[2.74, 0]
		]);
		const carrier = steady(2.74, (t) => {
			const n = noise();
			const mix = brightness(t);
			return (1 - mix) * dark(n) + mix * (bright(n) + .05 * n);
		}, .01);
		const level = envelope([
			[0, 0],
			[.025, 0],
			[.644, .13],
			[.723, .34],
			[.793, .21],
			[1.003, .61],
			[1.372, .69],
			[1.472, .44],
			[1.522, .73],
			[1.541, .47],
			[1.551, .63],
			[1.631, .52],
			[1.641, .27],
			[1.671, .24],
			[1.681, .45],
			[1.731, .49],
			[1.741, .29],
			[1.761, .29],
			[1.791, .49],
			[1.801, .23],
			[1.831, .45],
			[1.881, .25],
			[1.921, .44],
			[1.931, .22],
			[1.941, .5],
			[1.961, .23],
			[2, .42],
			[2.02, .14],
			[2.06, .19],
			[2.07, .38],
			[2.09, .11],
			[2.11, .24],
			[2.12, .13],
			[2.14, .33],
			[2.16, .17],
			[2.17, .43],
			[2.19, .09],
			[2.2, .27],
			[2.21, .08],
			[2.22, .21],
			[2.23, .07],
			[2.26, .3],
			[2.28, .07],
			[2.3, .18],
			[2.32, .03],
			[2.34, .1],
			[2.39, .06],
			[2.4, .21],
			[2.42, .04],
			[2.479, .12],
			[2.559, .02],
			[2.725, 0],
			[2.74, 0]
		]);
		return render(2.74, (t, i) => t < .007 ? -.95 : level(t) * carrier[i]);
	}
	function flyover() {
		const noise = seeded(45);
		const drone = biquad("band", 330, 4);
		const engine = sweptLow(sweep([
			[0, 120],
			[1, 200],
			[1.5, 450],
			[2.2, 850],
			[2.6, 1050],
			[3.1, 850],
			[3.7, 500],
			[4.2, 280],
			[4.7, 160],
			[5.69, 120]
		]));
		const carrier = steady(5.69, (t) => {
			const n = noise();
			return 1.2 * drone(n) + engine(n, t);
		}, .01);
		const level = envelope([
			[0, 0],
			[.314, .01],
			[.374, .07],
			[.584, .02],
			[.703, .14],
			[.723, .05],
			[.743, .21],
			[.763, .19],
			[.783, .68],
			[.793, .35],
			[.823, .4],
			[.853, .11],
			[.903, .12],
			[.923, .4],
			[.953, .14],
			[1.033, .27],
			[1.073, .11],
			[1.132, .32],
			[1.222, .14],
			[1.232, .34],
			[1.252, .23],
			[1.322, .53],
			[1.362, .28],
			[1.432, .32],
			[1.442, .17],
			[1.452, .44],
			[1.472, .39],
			[1.482, .67],
			[1.502, .38],
			[1.512, .55],
			[1.522, .3],
			[1.541, .47],
			[1.611, .34],
			[1.661, .65],
			[1.721, .42],
			[1.741, .71],
			[1.781, .45],
			[1.831, .83],
			[1.901, .5],
			[1.931, .81],
			[1.971, .54],
			[1.99, .82],
			[2.11, .57],
			[2.12, .84],
			[2.36, .5],
			[2.38, .75],
			[2.489, .62],
			[2.509, .9],
			[2.549, .66],
			[2.968, .95],
			[3.128, .69],
			[3.168, .91],
			[3.188, .6],
			[3.307, .74],
			[3.317, .47],
			[3.557, .89],
			[3.567, .54],
			[3.687, .82],
			[3.707, .54],
			[3.746, .82],
			[3.776, .48],
			[3.816, .76],
			[3.836, .54],
			[3.846, .82],
			[3.906, .51],
			[3.936, .7],
			[3.966, .43],
			[3.976, .62],
			[4.046, .6],
			[4.066, .31],
			[4.096, .48],
			[4.156, .34],
			[4.195, .62],
			[4.225, .47],
			[4.235, .23],
			[4.285, .17],
			[4.295, .39],
			[4.355, .52],
			[4.485, .12],
			[4.545, .32],
			[4.605, .14],
			[4.644, .27],
			[4.724, .12],
			[4.754, .4],
			[4.774, .11],
			[4.794, .21],
			[4.824, .12],
			[4.864, .46],
			[4.884, .28],
			[4.894, .67],
			[4.914, .19],
			[4.934, .23],
			[4.954, .05],
			[4.974, .13],
			[5.093, .02],
			[5.313, .07],
			[5.67, 0],
			[5.69, 0]
		]);
		return render(5.69, (t, i) => 1.1 * level(t) * carrier[i]);
	}
	function takeoff() {
		const noise = seeded(48);
		const rumble = biquad("low", 200, .7);
		const deep = biquad("low", 200, .7);
		const body = onePole(300, "low");
		const smooth = onePole(900, "low");
		const roar = biquad("low", 2500, .7);
		const roaring = envelope([
			[0, .15],
			[1, .04],
			[3, .01],
			[5.611, 0]
		]);
		const bodied = envelope([
			[0, .55],
			[1, .4],
			[2.5, .3],
			[5.611, .25]
		]);
		const carrier = driven(steady(5.611, (t) => {
			const n = noise();
			return deep(rumble(n)) + bodied(t) * smooth(body(n)) + roaring(t) * roar(n);
		}, .01), 1.5);
		const level = steps(110 / BASE_RATE, [
			.73,
			.74,
			.82,
			.87,
			.76,
			.8,
			.64,
			.68,
			.77,
			.53,
			.64,
			.58,
			.71,
			.72,
			.58,
			.77,
			.66,
			.71,
			.7,
			.91,
			.69,
			.76,
			.58,
			.68,
			.68,
			.66,
			.77,
			.49,
			.72,
			.76,
			.64,
			.79,
			.67,
			.74,
			.74,
			.79,
			.73,
			.77,
			.68,
			.79,
			.82,
			.7,
			.76,
			.75,
			.81,
			.86,
			.74,
			.64,
			.68,
			.85,
			.78,
			.78,
			.79,
			.67,
			.88,
			.65,
			.65,
			.68,
			.81,
			.71,
			.69,
			.7,
			.69,
			.72,
			.83,
			.73,
			.74,
			.55,
			.63,
			.81,
			.77,
			.82,
			.59,
			.69,
			.61,
			.57,
			.7,
			.79,
			.65,
			.75,
			.8,
			.8,
			.63,
			.75,
			.85,
			.77,
			.85,
			.85,
			.52,
			.6,
			.73,
			.63,
			.87,
			.86,
			.74,
			.8,
			.66,
			.68,
			.8,
			.76,
			.74,
			.63,
			.57,
			.65,
			.67,
			.88,
			.61,
			.77,
			.69,
			.8,
			.77,
			.77,
			.85,
			.56,
			.55,
			.71,
			.58,
			.89,
			.75,
			.67,
			.69,
			.66,
			.72,
			.68,
			.76,
			.75,
			.89,
			.84,
			.66,
			.69,
			.78,
			.7,
			.82,
			.82,
			.57,
			.71,
			.84,
			.74,
			.81,
			.69,
			.63,
			.79,
			.86,
			.53,
			.84,
			.76,
			.71,
			.7,
			.62,
			.76,
			.8,
			.76,
			.75,
			.85,
			.73,
			.83,
			.54,
			.59,
			.79,
			.77,
			.61,
			.83,
			.6,
			.76,
			.81,
			.86,
			.8,
			.71,
			.72,
			.82,
			.81,
			.81,
			.94,
			.8,
			.84,
			.75,
			.71,
			.72,
			.84,
			.83,
			.68,
			.75,
			.71,
			.63,
			.88,
			.7,
			.66,
			.86,
			.77,
			.71,
			.61,
			.6,
			.79,
			.73,
			.73,
			.48,
			.75,
			.68,
			.73,
			.73,
			.73,
			.77,
			.82,
			.86,
			.72,
			.82,
			.74,
			.7,
			.82,
			.89,
			.97,
			.61,
			.68,
			.59,
			.62,
			.93,
			.87,
			.78,
			.62,
			.81,
			.88,
			.76,
			.79,
			.61,
			.54,
			.75,
			.75,
			.81,
			.72,
			.84,
			.83,
			.79,
			.66,
			.78,
			.86,
			.7,
			.77,
			.73,
			.83,
			.78,
			.64,
			.76,
			.73,
			.88,
			.7,
			.69,
			.69,
			.83,
			.66,
			.59,
			.65,
			.79,
			.8,
			.78,
			.89,
			.78,
			.85,
			.68,
			.69,
			.8,
			.77,
			.82,
			.76,
			.76,
			.62,
			.65,
			.85,
			.86,
			.8,
			.75,
			.88,
			.57,
			.78,
			.75,
			.69,
			.71,
			.81,
			.7,
			.87,
			.69,
			.65,
			.9,
			.79,
			.79,
			.73,
			.96,
			.68,
			.87,
			.8,
			.7,
			.61,
			.75,
			.71,
			.74,
			.67,
			.69,
			.74,
			.69,
			.79,
			.7,
			.58,
			.61,
			.8,
			.75,
			.56,
			.55,
			.85,
			.82,
			.74,
			.81,
			.87,
			.73,
			.64,
			.62,
			.68,
			.75,
			.59,
			.71,
			.72,
			.74,
			.49,
			.85,
			.74,
			.83,
			.81,
			.61,
			.75,
			.77,
			.87,
			.91,
			.68,
			.81,
			.87,
			.76,
			.93,
			.56,
			.7,
			.81,
			.7,
			.79,
			.42,
			.78,
			.53,
			.73,
			.92,
			.68,
			.44,
			.65,
			.82,
			.89,
			.72,
			.55,
			.72,
			.81,
			.7,
			.74,
			.8,
			.6,
			.75,
			.81,
			.85,
			.89,
			.85,
			.56,
			.78,
			.81,
			.74,
			.68,
			.72,
			.73,
			.71,
			.89,
			.87,
			.63,
			.8,
			.85,
			.8,
			.74,
			.64,
			.71,
			.76,
			.72,
			.83,
			.84,
			.51,
			.7,
			.81,
			.69,
			.69,
			.53,
			.74,
			.66,
			.67,
			.73,
			.81,
			.72,
			.68,
			.73,
			.83,
			.69,
			.79,
			.68,
			.71,
			.71,
			.78,
			.73,
			.64,
			.45,
			.66,
			.85,
			.8,
			.66,
			.79,
			.89,
			.79,
			.58,
			.84,
			.67,
			.7,
			.83,
			.77,
			.8,
			.83,
			.84,
			.85,
			.93,
			.94,
			.72,
			.57,
			.65,
			.76,
			.65,
			.8,
			.82,
			.64,
			.69,
			.49,
			.82,
			.77,
			.47,
			.75,
			.84,
			.73,
			.8,
			.75,
			.79,
			.81,
			.68,
			.72,
			.58,
			.65,
			.85,
			.9,
			.7,
			.63,
			.58,
			.72,
			.8,
			.9,
			.91,
			.78,
			.78,
			.75,
			.46,
			.92,
			.64,
			.87,
			.8,
			.76,
			.62,
			.63,
			.57,
			.81,
			.87,
			.83,
			.8,
			.51,
			.86,
			.87,
			.5,
			.6,
			.76,
			.66,
			.54,
			.76,
			.84,
			.69,
			.88,
			.65,
			.79,
			.83,
			.69,
			.77,
			.57,
			.75,
			.92,
			.53,
			.78,
			.8,
			.6,
			.74,
			.67,
			.6,
			.55,
			.43,
			.69,
			.71,
			.8,
			.66,
			.46,
			.86,
			.82,
			.74,
			.76,
			.52,
			.82,
			.76,
			.79,
			.67,
			.79,
			.66,
			.82,
			.74,
			.8,
			.73,
			.74,
			.64,
			.67,
			.62,
			.66,
			.71,
			.55,
			.67,
			.72,
			.44,
			.6,
			.55,
			.5,
			.48,
			.55,
			.66,
			.61,
			.5,
			.65,
			.45,
			.39,
			.39,
			.47,
			.41,
			.44,
			.22,
			.3,
			.25,
			.13,
			.14,
			.2,
			.12,
			.11,
			.09,
			.07,
			.11,
			.19
		]);
		const fade = fadeOut(5.6);
		return render(5.611, (t, i) => fade(t) * level(t) * carrier[i]);
	}
	function blast() {
		const noise = seeded(49);
		const roar = sweptLow(sweep([
			[0, 600],
			[1.3, 650],
			[1.9, 650],
			[2.4, 600],
			[3, 480],
			[3.6, 330],
			[4.33, 250]
		]));
		const edge = biquad("low", 1400, .7);
		const carrier = driven(steady(4.33, (t) => edge(roar(noise(), t)), .01), 1.2);
		const level = envelope([
			[0, .9],
			[.035, .62],
			[.045, .93],
			[.065, .7],
			[.195, .97],
			[.234, .68],
			[.244, .92],
			[.254, .66],
			[.324, .95],
			[.364, .54],
			[.394, .87],
			[.823, .9],
			[.943, .71],
			[.953, .46],
			[.963, .78],
			[.993, .88],
			[1.073, .83],
			[1.083, .58],
			[1.102, .83],
			[1.252, .84],
			[1.272, .54],
			[1.342, .94],
			[1.412, .69],
			[1.512, .9],
			[1.532, .51],
			[1.571, .89],
			[1.98, .54],
			[2.01, .8],
			[2.05, .53],
			[2.06, .76],
			[2.19, .47],
			[2.25, .67],
			[2.28, .37],
			[2.34, .66],
			[2.519, .35],
			[2.599, .54],
			[2.699, .34],
			[2.719, .52],
			[2.799, .25],
			[2.839, .44],
			[2.859, .17],
			[2.868, .3],
			[2.898, .17],
			[2.958, .36],
			[3.048, .18],
			[3.198, .31],
			[3.258, .09],
			[3.288, .25],
			[3.477, .16],
			[3.487, .06],
			[3.537, .18],
			[3.607, .04],
			[3.637, .12],
			[3.667, .03],
			[4.31, 0],
			[4.33, 0]
		]);
		return render(4.33, (t, i) => level(t) * carrier[i]);
	}
	//#endregion
	//#region src/game/sound/recipes/world.ts
	function step() {
		const noise = seeded(21);
		const thump = osc("sine", sweep([
			[0, 130],
			[.05, 80],
			[.1, 55],
			[.2, 43]
		]));
		const level = envelope([
			[0, .4],
			[.03, 1.3],
			[.09, 1.2],
			[.15, .7],
			[.16, .85],
			[.22, .3],
			[.26, .15],
			[.3, .08],
			[.47, .03],
			[.48, 0]
		]);
		const clank = envelope([
			[0, .45],
			[.1, .3],
			[.2, .15],
			[.3, 0],
			[.48, 0]
		]);
		const ring = biquad("band", 3300, 3);
		const buzz = biquad("band", 5e3, 1.5);
		const tail = envelope([
			[0, 0],
			[.15, .1],
			[.22, .45],
			[.3, .55],
			[.46, .45],
			[.48, 0]
		]);
		return render(.836, (t) => {
			const n = noise();
			return clip(level(t) * (thump(t) - .3), 2) + clank(t) * n + tail(t) * (ring(n) + buzz(n));
		});
	}
	function land() {
		const tone = osc("sine", sweep([
			[0, 250],
			[.03, 225],
			[.09, 225],
			[.12, 265],
			[.42, 260]
		]));
		const level = steps(.01, [
			.89,
			.98,
			.97,
			.98,
			.98,
			.97,
			.98,
			.97,
			.89,
			.48,
			.07,
			.07,
			.21,
			.37,
			.58,
			.54,
			.72,
			.82,
			.87,
			.85,
			.86,
			.82,
			.64,
			.77,
			.74,
			.5,
			.64,
			.81,
			.83,
			.8,
			.7,
			.42,
			.31,
			.36,
			.7,
			.7,
			.73,
			.71,
			.62,
			.62,
			.52,
			.31
		]);
		const drive = envelope([
			[0, 8],
			[.08, 8],
			[.12, 1.8],
			[.425, 1.8]
		]);
		return render(.425, (t) => t < .414 ? 1.12 * level(t) * clip(tone(t) - .08, drive(t)) : 0);
	}
	function click() {
		const noise = seeded(30);
		const tone = osc("sine", () => 870);
		const knock = osc("sine", () => 150);
		const level = steps(.01, [
			1,
			1,
			.97,
			.98,
			1,
			1,
			.98,
			1,
			1,
			.96,
			.86,
			.97,
			.61,
			.4
		]);
		const thud = envelope([
			[0, 0],
			[.08, 0],
			[.11, .15],
			[.14, .15]
		]);
		return render(.149, (t) => t < .138 ? level(t) * (clip(tone(t), 2.5) + .25 * noise() + thud(t) * knock(t)) : 0);
	}
	function inventory() {
		const noise = seeded(22);
		const hum = onePole(150, "low");
		const partials = [
			1,
			3,
			5,
			7
		].map((harmonic) => osc("sine", () => 360 * harmonic));
		const third = envelope([
			[0, 0],
			[.04, .2],
			[.235, .2]
		]);
		const fifth = envelope([
			[0, .9],
			[.04, .4],
			[.07, .1],
			[.12, .05],
			[.15, .3],
			[.235, .3]
		]);
		const seventh = envelope([
			[0, .5],
			[.04, .15],
			[.07, .08],
			[.12, .05],
			[.15, .28],
			[.235, .28]
		]);
		const level = steps(.01, [
			.22,
			.25,
			.22,
			.22,
			.2,
			.16,
			.12,
			.13,
			.16,
			.22,
			.27,
			.26,
			.24,
			.2,
			.16,
			.27,
			.28,
			.33,
			.4,
			.39,
			.36,
			.32,
			.24
		]);
		return render(.235, (t) => {
			const weights = [
				1,
				third(t),
				fifth(t),
				seventh(t)
			];
			const power = weights.reduce((sum, w) => sum + w * w, 0) / 2;
			const tone = partials.reduce((sum, partial, k) => sum + weights[k] * partial(t), 0);
			return t < .224 ? level(t) * tone / Math.sqrt(power) + .25 * hum(noise()) : 0;
		});
	}
	function power() {
		const noise = seeded(31);
		const hum = osc("sine", () => 43);
		const glide = osc("sine", sweep([[.93, 1900], [2.32, 650]]));
		const fall = osc("sine", sweep([[.7, 4200], [2.32, 2300]]));
		const rise = osc("sine", sweep([[1.16, 1200], [2.1, 4e3]]));
		const sweeps = envelope([
			[0, 0],
			[.75, 0],
			[.95, 1],
			[2.32, 1],
			[2.4, 0]
		]);
		const hiss = onePole(1200, "low");
		const growl = biquad("band", 450, 1);
		const carrier = steady(2.521, (t) => clip(hum(t) + .2 * hiss(noise()) + growl(noise()) + sweeps(t) * (.5 * glide(t) + .15 * fall(t) + .15 * rise(t)), 3), .01);
		const level = envelope([
			[0, .04],
			[.035, .08],
			[.055, .43],
			[.075, .7],
			[.095, .33],
			[.115, .47],
			[.125, .14],
			[.135, .28],
			[.155, .08],
			[.175, .19],
			[.205, .13],
			[.245, .86],
			[.295, .41],
			[.305, .83],
			[.385, .85],
			[.395, .51],
			[.425, .89],
			[.465, .79],
			[.495, .41],
			[.505, .81],
			[.525, .6],
			[.595, .77],
			[.615, .41],
			[.625, .7],
			[.655, .88],
			[.695, .61],
			[.835, .88],
			[.865, .62],
			[.885, .86],
			[.925, .42],
			[.955, .87],
			[.995, .53],
			[1.075, .77],
			[1.175, .62],
			[1.195, .81],
			[1.225, .55],
			[1.415, .78],
			[1.475, .52],
			[1.515, .86],
			[1.535, .55],
			[1.565, .8],
			[1.605, .61],
			[1.645, .87],
			[1.715, .52],
			[1.725, .77],
			[1.755, .81],
			[1.775, .35],
			[1.785, .6],
			[1.825, .5],
			[1.835, .68],
			[1.845, .45],
			[1.885, .78],
			[1.905, .51],
			[1.925, .78],
			[1.955, .43],
			[1.995, .73],
			[2.035, .4],
			[2.045, .59],
			[2.095, .72],
			[2.145, .32],
			[2.175, .61],
			[2.245, .58],
			[2.285, .24],
			[2.305, .35],
			[2.345, .13],
			[2.385, .23],
			[2.415, .09],
			[2.495, .04],
			[2.525, 0]
		]);
		return render(2.521, (t, i) => clip(.9 * level(t) * carrier[i], 1));
	}
	function siren() {
		const noise = seeded(32);
		const pitch = sweep([
			[0, 470],
			[.06, 490],
			[.12, 520],
			[.18, 577],
			[.24, 613],
			[.3, 657],
			[.38, 700],
			[.48, 750],
			[.6, 785],
			[.69, 820],
			[.84, 880],
			[.9, 850]
		]);
		const formant = envelope([
			[0, -14],
			[400, -14],
			[1100, -8],
			[1600, 0],
			[2400, -6],
			[3300, -15],
			[4e3, -23],
			[5500, -30]
		]);
		const level = envelope([
			[0, .04],
			[.115, .41],
			[.135, .28],
			[.215, .47],
			[.225, .32],
			[.255, .49],
			[.265, .32],
			[.275, .56],
			[.305, .71],
			[.345, .42],
			[.465, .75],
			[.495, .44],
			[.545, .76],
			[.585, .45],
			[.635, .72],
			[.685, .61],
			[.695, .43],
			[.735, .65],
			[.765, .26],
			[.785, .4],
			[.835, .19],
			[.855, .33],
			[.895, .03],
			[1.025, 0]
		]);
		let cycles = 0;
		return render(1.025, (t) => {
			const f0 = pitch(t);
			cycles += f0 / BASE_RATE;
			let tone = 0;
			let power = 0;
			for (let k = 1; k * f0 < 5500; k++) {
				const weight = 10 ** (formant(k * f0) / 20);
				tone += weight * Math.sin(2 * Math.PI * k * cycles);
				power += weight * weight / 2;
			}
			return level(t) * (tone / Math.sqrt(power) + .25 * noise());
		});
	}
	function liftStart() {
		const noise = seeded(23);
		const motor = osc("sine", sweep([
			[.02, 70],
			[.1, 90],
			[.14, 150],
			[.2, 300],
			[.26, 420],
			[.3, 200],
			[.54, 180]
		]));
		const drive = envelope([
			[0, 1],
			[.03, 6],
			[.12, 6],
			[.2, 2],
			[.3, 5],
			[.548, 5]
		]);
		const grit = biquad("band", 600, 1);
		const crackle = envelope([
			[0, .5],
			[.1, .3],
			[.12, 0]
		]);
		const carrier = steady(.548, (t) => {
			const n = noise();
			return clip(motor(t) - .2, drive(t)) + .6 * grit(n) + crackle(t) * n;
		}, .01);
		const level = envelope([
			[0, .34],
			[.015, .2],
			[.025, .68],
			[.035, .54],
			[.085, .88],
			[.105, .84],
			[.125, .41],
			[.185, .57],
			[.205, .33],
			[.225, .64],
			[.255, .58],
			[.265, .82],
			[.335, .3],
			[.405, .31],
			[.445, .15],
			[.455, .22],
			[.545, 0]
		]);
		const offset = envelope([
			[0, .5],
			[.004, .5],
			[.005, 0]
		]);
		return render(.548, (t, i) => clip(.87 * level(t) * carrier[i], 1) - offset(t));
	}
	function liftStop() {
		const noise = seeded(24);
		const thud = osc("sine", sweep([
			[0, 300],
			[.1, 200],
			[.15, 200]
		]));
		const rattle = biquad("band", 700, 1);
		const smooth = biquad("low", 1500, .7);
		const mix = envelope([
			[0, 0],
			[.13, 0],
			[.18, 1],
			[.579, 1]
		]);
		const carrier = steady(.579, (t) => (1 - mix(t)) * clip(thud(t), 4) + mix(t) * smooth(rattle(noise())) + .1 * noise(), .01);
		const level = envelope([
			[0, .91],
			[.015, .58],
			[.055, .53],
			[.065, .34],
			[.115, .52],
			[.135, .29],
			[.155, .49],
			[.165, .22],
			[.185, .18],
			[.195, .49],
			[.205, .31],
			[.395, .28],
			[.415, .16],
			[.485, .18],
			[.568, 0]
		]);
		return render(.579, (t, i) => clip(.87 * level(t) * carrier[i], 1));
	}
	function door() {
		const noise = seeded(25);
		const rumble = biquad("low", 70, .9);
		const carrier = steady(1.609, () => rumble(noise()), .01);
		const level = envelope([
			[0, .04],
			[.035, .16],
			[.065, .06],
			[.095, .1],
			[.105, .16],
			[.115, .67],
			[.125, .5],
			[.135, .98],
			[.145, .73],
			[.165, .78],
			[.175, .42],
			[.185, .94],
			[.205, .7],
			[.215, .22],
			[.235, .62],
			[.265, .95],
			[.275, .51],
			[.295, .72],
			[.305, .41],
			[.315, .69],
			[.325, .4],
			[.335, .55],
			[.345, .35],
			[.365, .85],
			[.395, .52],
			[.415, .61],
			[.425, .99],
			[.455, .45],
			[.475, .89],
			[.515, .91],
			[.525, .45],
			[.535, .37],
			[.555, .42],
			[.565, .91],
			[.585, .27],
			[.605, .15],
			[.625, .41],
			[.635, .28],
			[.665, .43],
			[.675, .12],
			[.685, .08],
			[.745, .6],
			[.825, .13],
			[.845, .5],
			[.855, .27],
			[.865, .34],
			[.885, .12],
			[.915, .16],
			[.935, .04],
			[.985, .22],
			[1.015, .07],
			[1.035, .16],
			[1.075, .04],
			[1.095, .11],
			[1.115, .02],
			[1.205, .11],
			[1.215, .03],
			[1.255, .03],
			[1.285, .11],
			[1.325, .03],
			[1.345, .1],
			[1.375, .02],
			[1.395, .08],
			[1.405, .01],
			[1.425, .09],
			[1.465, .02],
			[1.495, .12],
			[1.525, .02],
			[1.585, .04],
			[1.598, 0]
		]);
		return render(1.609, (t, i) => clip(level(t) * carrier[i], 1));
	}
	function grate() {
		const noise = seeded(26);
		const rattle = biquad("band", 550, 1.2);
		const smooth = biquad("low", 1e3, .7);
		const carrier = steady(1.534, () => smooth(rattle(noise())));
		const level = envelope([
			[0, .36],
			[.035, .31],
			[.045, .68],
			[.055, .35],
			[.075, .47],
			[.095, .3],
			[.115, .43],
			[.125, .83],
			[.135, .48],
			[.145, .58],
			[.185, .22],
			[.195, .51],
			[.205, .59],
			[.225, .39],
			[.255, .65],
			[.275, .47],
			[.285, .21],
			[.315, .28],
			[.325, .5],
			[.355, .19],
			[.375, .33],
			[.385, .77],
			[.445, .27],
			[.465, .26],
			[.485, .49],
			[.505, .18],
			[.545, .54],
			[.595, .25],
			[.615, .71],
			[.635, .5],
			[.645, .74],
			[.665, .53],
			[.675, .69],
			[.685, .37],
			[.695, .35],
			[.705, .69],
			[.725, .5],
			[.775, .65],
			[.785, .33],
			[.815, .2],
			[.825, .65],
			[.865, .67],
			[.885, .39],
			[.895, .8],
			[.925, .35],
			[.995, .17],
			[1.005, .3],
			[1.055, .13],
			[1.065, .28],
			[1.145, .17],
			[1.165, .27],
			[1.185, .15],
			[1.445, .06],
			[1.535, 0]
		]);
		return render(1.534, (t, i) => clip(.93 * level(t) * carrier[i], 1));
	}
	function thunder() {
		const noise = seeded(27);
		const roll = biquad("band", 450, .8);
		const dark = biquad("low", 650, .7);
		const light = biquad("low", 1600, .7);
		const crack = envelope([
			[0, 0],
			[.7, 0],
			[.76, 1],
			[1.898, 1]
		]);
		const carrier = steady(1.898, (t) => {
			const band = roll(noise());
			return (1 - crack(t)) * dark(band) + crack(t) * light(band);
		});
		const level = envelope([
			[0, .37],
			[.085, .29],
			[.135, .45],
			[.155, .26],
			[.175, .39],
			[.185, .24],
			[.225, .21],
			[.235, .34],
			[.275, .18],
			[.285, .34],
			[.335, .17],
			[.345, .31],
			[.405, .17],
			[.455, .22],
			[.735, .05],
			[.745, .1],
			[.765, .66],
			[.815, .82],
			[.845, .77],
			[.895, .22],
			[.925, .64],
			[.965, .28],
			[.975, .37],
			[.985, .14],
			[.995, .46],
			[1.015, .19],
			[1.045, .15],
			[1.075, .48],
			[1.115, .15],
			[1.125, .27],
			[1.145, .16],
			[1.155, .52],
			[1.185, .22],
			[1.195, .67],
			[1.235, .27],
			[1.255, .4],
			[1.325, .36],
			[1.355, .73],
			[1.385, .37],
			[1.415, .44],
			[1.425, .68],
			[1.485, .22],
			[1.505, .39],
			[1.515, .25],
			[1.555, .43],
			[1.605, .19],
			[1.625, .4],
			[1.635, .21],
			[1.645, .61],
			[1.665, .22],
			[1.675, .45],
			[1.695, .43],
			[1.705, .65],
			[1.755, .3],
			[1.785, .41],
			[1.835, .11],
			[1.887, 0]
		]);
		return render(1.898, (t, i) => clip(.9 * level(t) * carrier[i], 1));
	}
	function teleport() {
		const noise = seeded(28);
		const buzz = osc("saw", sweep([[0, 240], [1.5, 280]]));
		const buzzing = envelope([
			[0, .8],
			[1, .6],
			[1.6, 0],
			[4.531, 0]
		]);
		const darkTone = biquad("low", 400, .7);
		const brightTone = biquad("low", 1800, .7);
		const darkNoise = biquad("low", 400, .7);
		const brightNoise = biquad("low", 1800, .7);
		const brightness = envelope([
			[0, 0],
			[.3, .15],
			[.6, .4],
			[1.3, 1],
			[2, 1],
			[2.1, .5],
			[4.531, .5]
		]);
		const rumble = biquad("low", 200, .7);
		const rumbling = envelope([
			[0, 0],
			[1.5, 0],
			[1.65, 1.5],
			[2.1, 1.5],
			[2.3, .8],
			[2.6, .3],
			[2.9, .6],
			[3.7, .6],
			[4.531, .6]
		]);
		const hiss = biquad("high", 2500, .7);
		const hissing = envelope([
			[0, 0],
			[1.5, 0],
			[1.6, .2],
			[2.05, .2],
			[2.15, 1],
			[2.6, 1],
			[2.75, .2],
			[2.9, 0],
			[4.531, 0]
		]);
		const ring = osc("sine", () => 940);
		const ringing = envelope([
			[0, 0],
			[2.7, 0],
			[2.85, .5],
			[3.1, .5],
			[3.3, .3],
			[4.531, .2]
		]);
		const whine = osc("sine", () => 1330);
		const whining = envelope([
			[0, 0],
			[3.25, 0],
			[3.35, .3],
			[4.531, .3]
		]);
		const carrier = steady(4.531, (t) => {
			const n = noise();
			const tone = buzzing(t) * buzz(t);
			const mix = brightness(t);
			return (1 - mix) * (darkTone(tone) + darkNoise(n)) + mix * (brightTone(tone) + brightNoise(n)) + rumbling(t) * rumble(n) + hissing(t) * hiss(n) + ringing(t) * ring(t) + whining(t) * whine(t);
		}, .01);
		const level = envelope([
			[0, .76],
			[.015, .04],
			[.185, .36],
			[.195, .73],
			[.215, .48],
			[.265, .51],
			[.335, .83],
			[.395, .57],
			[.475, .88],
			[.505, .57],
			[.525, .82],
			[.955, .65],
			[.985, .89],
			[1.075, .58],
			[1.095, .78],
			[1.375, .53],
			[1.415, .76],
			[1.925, .64],
			[1.945, .87],
			[2.015, .58],
			[2.055, .79],
			[2.165, .6],
			[2.255, .87],
			[2.645, .71],
			[2.665, .48],
			[2.685, .64],
			[2.745, .45],
			[2.785, .69],
			[3.005, .46],
			[3.015, .66],
			[3.045, .45],
			[3.075, .68],
			[3.085, .36],
			[3.145, .24],
			[3.195, .4],
			[3.235, .2],
			[3.265, .32],
			[3.505, .13],
			[3.525, .26],
			[3.545, .11],
			[4.545, 0]
		]);
		return render(4.531, (t, i) => clip(level(t) * carrier[i], 1));
	}
	function spark() {
		const noise = seeded(29);
		const crackle = biquad("low", 900, .7);
		const carrier = steady(.1425, () => crackle(noise()), .002);
		const level = steps(.01, [
			.5,
			.6,
			.5,
			.48,
			.58,
			.63,
			.55,
			.57,
			.61,
			.54,
			.6,
			.62,
			.7,
			1.3
		]);
		return render(.1425, (t, i) => t < .1325 ? clip(level(t) * carrier[i], .5) - .08 : 0);
	}
	//#endregion
	//#region src/game/sound/index.ts
	const SOUNDS = {
		gunShot,
		cannon,
		laser,
		beam,
		punch,
		explosion,
		step,
		land,
		click,
		inventory,
		power,
		siren,
		liftStart,
		liftStop,
		door,
		grate,
		thunder,
		teleport,
		spark,
		servo,
		crackle,
		ignition,
		flyby,
		flyover,
		hatch,
		slam,
		takeoff,
		blast,
		heavyDoor
	};
	//#endregion
	exports.BASE_RATE = BASE_RATE;
	exports.SOUNDS = SOUNDS;
	return exports;
})({});

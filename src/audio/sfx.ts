// Звуки Crusade. Всё синтезируется на лету через Web Audio — без файлов.
// Колокола: неровные (негармонические) обертоны с биениями. Рог: два расстроенных
// пилообразных голоса через фильтр. Хор: пила через «гласные» формантные фильтры.
// Общий реверб — сгенерированный импульс «каменного зала».

export type SfxName =
  | 'tap'
  | 'open'
  | 'close'
  | 'march'
  | 'pause'
  | 'resume'
  | 'finish'
  | 'capture'
  | 'border'
  | 'regalia'
  | 'title'
  | 'found'
  | 'exile'
  | 'restore'
  | 'quest'
  | 'toast';

// крупные звуки не накладываются друг на друга, а встают в очередь
const MAJOR: Partial<Record<SfxName, number>> = { regalia: 2.2, found: 1.8, exile: 2.4, restore: 1.6, title: 1.2, capture: 1.0, border: 1.2, finish: 1.0 };

const NOTE = (n: string) => {
  const m = /^([A-G])(#|b)?(\d)$/.exec(n)!;
  const base = { C: -9, D: -7, E: -5, F: -4, G: -2, A: 0, B: 2 }[m[1] as 'A'];
  const acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return 440 * Math.pow(2, (base + acc + (Number(m[3]) - 4) * 12) / 12);
};

class Sfx {
  private ctx: AudioContext | null = null;
  private out: GainNode | null = null;
  private wet: GainNode | null = null;
  private noise: AudioBuffer | null = null;
  private majorUntil = 0;
  enabled = true;
  volume = 0.7;

  constructor() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      this.ensure();
      if (this.ctx?.state === 'running') {
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('keydown', unlock);
      }
    };
    window.addEventListener('pointerdown', unlock);
    window.addEventListener('keydown', unlock);
  }

  setVolume(v: number) {
    this.volume = v;
    if (this.out && this.ctx) this.out.gain.setTargetAtTime(v * 0.9, this.ctx.currentTime, 0.05);
  }

  private ensure(): AudioContext | null {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return null;
        const ctx = new AC();
        const comp = ctx.createDynamicsCompressor();
        comp.threshold.value = -14;
        comp.ratio.value = 4;
        comp.attack.value = 0.004;
        comp.release.value = 0.25;
        const out = ctx.createGain();
        out.gain.value = this.volume * 0.9;
        out.connect(comp).connect(ctx.destination);
        // реверб
        const len = Math.floor(ctx.sampleRate * 2.8);
        const ir = ctx.createBuffer(2, len, ctx.sampleRate);
        for (let ch = 0; ch < 2; ch++) {
          const d = ir.getChannelData(ch);
          let lp = 0;
          for (let i = 0; i < len; i++) {
            const t = i / len;
            lp += (Math.random() * 2 - 1 - lp) * (0.55 - t * 0.4); // темнеет к хвосту
            d[i] = lp * Math.pow(1 - t, 2.6) * (i < 400 ? i / 400 : 1);
          }
        }
        const conv = ctx.createConvolver();
        conv.buffer = ir;
        const wet = ctx.createGain();
        wet.gain.value = 0.55;
        wet.connect(conv).connect(out);
        // шум
        const nb = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
        const nd = nb.getChannelData(0);
        for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
        this.ctx = ctx;
        this.out = out;
        this.wet = wet;
        this.noise = nb;
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return this.ctx;
    } catch {
      return null;
    }
  }

  play(name: SfxName) {
    if (!this.enabled || this.volume <= 0) return;
    const ctx = this.ensure();
    if (!ctx || !this.out) return;
    let t = ctx.currentTime + 0.01;
    const major = MAJOR[name];
    if (major) {
      t = Math.max(t, this.majorUntil);
      this.majorUntil = t + major * 0.7;
    }
    try {
      this[name](t);
    } catch {
      /* звук — не повод падать */
    }
  }

  // ── инструменты ──────────────────────────────────────
  private bus(gain: number, wet = 0.3) {
    const ctx = this.ctx!;
    const g = ctx.createGain();
    g.gain.value = gain;
    g.connect(this.out!);
    if (wet > 0) {
      const s = ctx.createGain();
      s.gain.value = wet;
      g.connect(s).connect(this.wet!);
    }
    return g;
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private osc(type: OscillatorType, f: number, t: number, dur: number, dest: AudioNode, detune = 0) {
    const o = this.ctx!.createOscillator();
    o.type = type;
    o.frequency.value = f;
    o.detune.value = detune;
    o.connect(dest);
    o.start(t);
    o.stop(t + dur + 0.05);
    return o;
  }

  private noiseSrc(t: number, dur: number) {
    const s = this.ctx!.createBufferSource();
    s.buffer = this.noise;
    s.loop = true;
    s.start(t, Math.random() * 0.5);
    s.stop(t + dur + 0.05);
    return s;
  }

  private filter(type: BiquadFilterType, f: number, q = 0.7) {
    const b = this.ctx!.createBiquadFilter();
    b.type = type;
    b.frequency.value = f;
    b.Q.value = q;
    return b;
  }

  /** Колокол: негармонические обертоны, у высоких короче затухание. */
  private bell(f: number, t: number, o: { gain?: number; dur?: number; wet?: number; bright?: number } = {}) {
    const dur = o.dur ?? 3;
    const bus = this.bus(o.gain ?? 0.25, o.wet ?? 0.45);
    const parts: [number, number, number][] = [
      [0.5, 0.55, 1],
      [1, 1, 0.8],
      [1.19, 0.5, 0.6],
      [1.5, 0.32, 0.5],
      [2, 0.42, 0.42],
      [2.51, 0.2 * (o.bright ?? 1), 0.3],
      [2.66, 0.16 * (o.bright ?? 1), 0.26],
      [3.01, 0.12 * (o.bright ?? 1), 0.2],
      [4.07, 0.08 * (o.bright ?? 1), 0.14],
    ];
    for (const [r, a, dk] of parts) {
      const g = this.ctx!.createGain();
      g.connect(bus);
      this.env(g, t, 0.004, a, dur * dk);
      this.osc('sine', f * r, t, dur * dk, g);
      if (r <= 1) this.osc('sine', f * r * 1.003, t, dur * dk, g); // биения «гула»
    }
    // удар языка
    const n = this.noiseSrc(t, 0.05);
    const bp = this.filter('bandpass', f * 3, 2);
    const ng = this.ctx!.createGain();
    this.env(ng, t, 0.001, 0.25, 0.04);
    n.connect(bp).connect(ng).connect(bus);
  }

  /** Рог: два расстроенных голоса + суб, фильтр раскрывается на атаке. */
  private horn(f: number, t: number, dur: number, gain = 0.22, wet = 0.35) {
    const ctx = this.ctx!;
    const bus = this.bus(gain, wet);
    const lp = this.filter('lowpass', 500, 1.2);
    lp.frequency.setValueAtTime(380, t);
    lp.frequency.linearRampToValueAtTime(1900, t + 0.09);
    lp.frequency.exponentialRampToValueAtTime(900, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + 0.07);
    g.gain.setValueAtTime(0.85, t + dur * 0.7);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    lp.connect(g).connect(bus);
    const vib = ctx.createOscillator();
    const vg = ctx.createGain();
    vib.frequency.value = 5.2;
    vg.gain.setValueAtTime(0, t);
    vg.gain.linearRampToValueAtTime(9, t + dur * 0.6);
    vib.connect(vg);
    vib.start(t);
    vib.stop(t + dur + 0.3);
    for (const det of [-7, 6]) {
      const o = this.osc('sawtooth', f, t, dur + 0.25, lp, det);
      o.frequency.setValueAtTime(f * 0.97, t);
      o.frequency.linearRampToValueAtTime(f, t + 0.06);
      vg.connect(o.detune);
    }
    const sub = this.osc('sine', f / 2, t, dur + 0.25, g);
    void sub;
  }

  /** Боевой барабан: тело с падением высоты + кожа. */
  private drum(t: number, gain = 0.5, f = 110) {
    const ctx = this.ctx!;
    const bus = this.bus(gain, 0.25);
    const g = ctx.createGain();
    this.env(g, t, 0.002, 1, 0.55);
    const o = this.osc('sine', f, t, 0.6, g);
    o.frequency.setValueAtTime(f * 1.6, t);
    o.frequency.exponentialRampToValueAtTime(f * 0.45, t + 0.3);
    g.connect(bus);
    const n = this.noiseSrc(t, 0.12);
    const lp = this.filter('lowpass', 700, 0.8);
    const ng = ctx.createGain();
    this.env(ng, t, 0.001, 0.5, 0.1);
    n.connect(lp).connect(ng).connect(bus);
  }

  /** Хор «а-а»: пила через формантные фильтры, медленная атака. */
  private choir(freqs: number[], t: number, dur: number, gain = 0.12) {
    const ctx = this.ctx!;
    const bus = this.bus(gain, 0.8);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + dur * 0.35);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    g.connect(bus);
    const formants: [number, number, number][] = [
      [730, 8, 1],
      [1090, 9, 0.5],
      [2440, 12, 0.25],
    ];
    const mix = ctx.createGain();
    for (const [f, q, a] of formants) {
      const bp = this.filter('bandpass', f, q);
      const fg = ctx.createGain();
      fg.gain.value = a * 3;
      mix.connect(bp).connect(fg).connect(g);
    }
    for (const f of freqs)
      for (const det of [-9, 0, 8]) {
        const o = this.osc('sawtooth', f, t, dur, mix, det + (Math.random() - 0.5) * 4);
        const lfo = ctx.createOscillator();
        const lg = ctx.createGain();
        lfo.frequency.value = 4.5 + Math.random();
        lg.gain.value = 6;
        lfo.connect(lg).connect(o.detune);
        lfo.start(t);
        lfo.stop(t + dur);
      }
  }

  private swoosh(t: number, dur: number, f0: number, f1: number, gain = 0.12) {
    const ctx = this.ctx!;
    const bus = this.bus(gain, 0.15);
    const n = this.noiseSrc(t, dur);
    const bp = this.filter('bandpass', f0, 1.4);
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + dur * 0.3);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(bp).connect(g).connect(bus);
  }

  private clink(t: number, f: number, gain = 0.1) {
    const bus = this.bus(gain, 0.3);
    for (const [r, a, d] of [
      [1, 1, 0.35],
      [1.48, 0.6, 0.25],
      [2.17, 0.4, 0.18],
    ] as const) {
      const g = this.ctx!.createGain();
      this.env(g, t, 0.002, a, d);
      g.connect(bus);
      this.osc('sine', f * r, t, d, g);
    }
  }

  // ── звуки игры ───────────────────────────────────────
  private tap(t: number) {
    const ctx = this.ctx!;
    const bus = this.bus(0.7, 0.05);
    const n = this.noiseSrc(t, 0.03);
    const bp = this.filter('bandpass', 1500, 3);
    const g = ctx.createGain();
    this.env(g, t, 0.001, 1, 0.025);
    n.connect(bp).connect(g).connect(bus);
    const og = ctx.createGain();
    this.env(og, t, 0.001, 0.35, 0.04);
    og.connect(bus);
    this.osc('triangle', 520, t, 0.05, og);
  }
  private open(t: number) {
    this.swoosh(t, 0.22, 600, 2600, 0.4);
  }
  private close(t: number) {
    this.swoosh(t, 0.18, 2200, 500, 0.28);
  }
  /** Клинок из ножен + удар барабана. */
  private march(t: number) {
    const ctx = this.ctx!;
    const bus = this.bus(0.14, 0.35);
    const n = this.noiseSrc(t, 0.45);
    const hp = this.filter('highpass', 2500, 0.7);
    const bp = this.filter('bandpass', 2000, 4);
    bp.frequency.setValueAtTime(1800, t);
    bp.frequency.exponentialRampToValueAtTime(7500, t + 0.38);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(1, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.42);
    n.connect(hp).connect(bp).connect(g).connect(bus);
    for (const [f, a] of [
      [1870, 0.5],
      [2730, 0.35],
      [3910, 0.25],
      [5200, 0.15],
    ] as const) {
      const mg = ctx.createGain();
      this.env(mg, t + 0.32, 0.002, a, 0.9);
      mg.connect(bus);
      this.osc('sine', f, t + 0.32, 0.9, mg);
    }
    this.drum(t + 0.36, 0.55, 95);
    this.drum(t + 0.66, 0.4, 80);
  }
  private pause(t: number) {
    this.clink(t, 880, 0.26);
  }
  private resume(t: number) {
    this.clink(t, 1320, 0.24);
  }
  private finish(t: number) {
    this.drum(t, 0.45, 85);
    this.bell(NOTE('D3'), t + 0.12, { gain: 0.2, dur: 3.2, wet: 0.55 });
  }
  /** Короткий клич рога. */
  private capture(t: number) {
    this.drum(t, 0.4, 100);
    this.horn(NOTE('D4'), t + 0.02, 0.32);
    this.horn(NOTE('A4'), t + 0.38, 0.62);
  }
  private border(t: number) {
    this.drum(t, 0.45, 90);
    this.drum(t + 0.2, 0.4, 90);
    this.drum(t + 0.4, 0.5, 80);
    this.horn(NOTE('A3'), t + 0.45, 0.4, 0.2);
    this.horn(NOTE('C4'), t + 0.85, 0.7, 0.2);
  }
  /** Регалия: большой колокол и хор в ля миноре. */
  private regalia(t: number) {
    this.bell(NOTE('A3'), t, { gain: 0.28, dur: 4.2, wet: 0.6 });
    this.choir([NOTE('A2'), NOTE('E3'), NOTE('A3'), NOTE('C4')], t + 0.05, 3.4, 0.1);
    this.bell(NOTE('E4'), t + 0.9, { gain: 0.12, dur: 3, wet: 0.6 });
  }
  private title(t: number) {
    ['E4', 'G4', 'B4', 'E5'].forEach((n, i) => this.bell(NOTE(n), t + i * 0.14, { gain: 0.13, dur: 2.2, wet: 0.5 }));
  }
  /** Основание королевства: фанфара рога, колокола, барабан. */
  private found(t: number) {
    this.drum(t, 0.5, 90);
    this.horn(NOTE('D4'), t, 0.24);
    this.horn(NOTE('F#4'), t + 0.26, 0.24);
    this.horn(NOTE('A4'), t + 0.52, 0.85);
    this.horn(NOTE('D4'), t + 0.52, 0.85, 0.12);
    this.drum(t + 0.52, 0.5, 80);
    this.bell(NOTE('D5'), t + 0.6, { gain: 0.14, dur: 3, wet: 0.55 });
    this.bell(NOTE('A4'), t + 0.75, { gain: 0.12, dur: 3, wet: 0.55 });
  }
  /** Изгнание: низкий набат и мрачный хор. */
  private exile(t: number) {
    this.bell(NOTE('D2'), t, { gain: 0.32, dur: 5, wet: 0.7, bright: 0.6 });
    this.bell(NOTE('D2') * 1.06, t + 0.02, { gain: 0.08, dur: 4, wet: 0.7, bright: 0.4 });
    this.choir([NOTE('D2'), NOTE('A2'), NOTE('F3'), NOTE('Bb3')], t + 0.3, 3.6, 0.09);
    this.drum(t, 0.5, 55);
  }
  private restore(t: number) {
    this.bell(NOTE('D4'), t, { gain: 0.16, dur: 2.6 });
    this.bell(NOTE('A4'), t + 0.18, { gain: 0.14, dur: 2.6 });
    this.bell(NOTE('D5'), t + 0.36, { gain: 0.13, dur: 2.8 });
    this.horn(NOTE('D4'), t + 0.36, 0.7, 0.16);
  }
  private quest(t: number) {
    this.bell(NOTE('E5'), t, { gain: 0.09, dur: 1.4, wet: 0.35 });
    this.bell(NOTE('B5'), t + 0.09, { gain: 0.07, dur: 1.4, wet: 0.35 });
  }
  private toast(t: number) {
    this.bell(NOTE('A5'), t, { gain: 0.13, dur: 1.2, wet: 0.4, bright: 0.5 });
  }
}

export const sfx = new Sfx();

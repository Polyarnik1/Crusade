// Музыка Бенедикта: одна тема («Seal of the Forgotten King») в бесшовной петле.
// Тихий эмбиент на постоянной громкости: плавно входит, мягко гаснет при уходе, а на цундере обрывается
// «остановкой плёнки» — тон падает, звук съезжает в ноль, и наступает неловкая тишина.

import { sfx } from './sfx';

// тихий фон: слышен, но не спорит с «голосом» Бенедикта
const BASE = 0.12;

class Music {
  private buf: AudioBuffer | null = null;
  private loading: Promise<AudioBuffer | null> | null = null;
  private src: AudioBufferSourceNode | null = null;
  private lp: BiquadFilterNode | null = null;
  private gain: GainNode | null = null;
  private offset = 0;
  private startedAt = 0;
  private want = false;
  private fading = false;
  private hidden = false;
  /** музыка оборвана «остановкой плёнки» и пока не вернулась */
  cut = false;

  constructor() {
    if (typeof document === 'undefined') return;
    document.addEventListener('visibilitychange', () => {
      this.hidden = document.hidden;
      this.apply(0.15);
    });
  }

  private target() {
    if (this.hidden || !sfx.enabled) return 0;
    return BASE * Math.min(1.4, sfx.volume / 0.7);
  }

  private apply(tc: number) {
    const ctx = sfx.audioContext();
    if (!ctx || !this.gain || this.fading) return;
    this.gain.gain.setTargetAtTime(this.target(), ctx.currentTime, tc);
  }

  /** Распаковка заранее, чтобы в нужный момент музыка не опаздывала. */
  preload() {
    const ctx = sfx.audioContext();
    if (ctx) void this.load(ctx);
  }

  private load(ctx: AudioContext): Promise<AudioBuffer | null> {
    if (this.buf) return Promise.resolve(this.buf);
    this.loading ??= import('./theme.gen')
      .then(({ THEME }) => {
        const bin = atob(THEME.slice(THEME.indexOf(',') + 1));
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        return ctx.decodeAudioData(bytes.buffer);
      })
      .then((b) => (this.buf = b))
      .catch(() => {
        this.loading = null;
        return null;
      });
    return this.loading;
  }

  private drop() {
    try {
      this.src?.stop();
    } catch {
      /* уже остановлен */
    }
    this.src?.disconnect();
    this.gain?.disconnect();
    this.src = this.gain = this.lp = null;
  }

  /** Запустить (или вернуть после обрыва) с плавным нарастанием. */
  async play(fade = 3) {
    this.want = true;
    if (this.cut && this.src) this.drop();
    this.cut = false;
    this.fading = false;
    if (!sfx.enabled || sfx.volume <= 0) return;
    const ctx = sfx.audioContext();
    if (!ctx) return;
    const buf = await this.load(ctx);
    if (!buf || !this.want || this.src) return;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 5200; // срезаем верх — мягче, мягче «мешает» речи
    const g = ctx.createGain();
    g.gain.value = 0.0001;
    src.connect(lp).connect(g).connect(ctx.destination);
    this.offset %= buf.duration;
    src.start(0, this.offset);
    this.startedAt = ctx.currentTime;
    this.src = src;
    this.lp = lp;
    this.gain = g;
    g.gain.setValueAtTime(0.0001, ctx.currentTime);
    g.gain.linearRampToValueAtTime(Math.max(0.0002, this.target()), ctx.currentTime + fade);
  }

  private remember(ctx: AudioContext) {
    this.offset += ctx.currentTime - this.startedAt;
  }

  /** Спокойный уход: музыка тает. */
  fadeOut(sec = 2.2) {
    this.want = false;
    const ctx = sfx.audioContext();
    if (!ctx || !this.src || !this.gain || this.fading) return;
    this.fading = true;
    this.remember(ctx);
    const g = this.gain.gain;
    g.cancelScheduledValues(ctx.currentTime);
    g.setValueAtTime(Math.max(0.0001, g.value), ctx.currentTime);
    g.linearRampToValueAtTime(0.0001, ctx.currentTime + sec);
    const dead = this.src;
    window.setTimeout(() => {
      if (this.src === dead) this.drop();
      this.fading = false;
      // распакованная мелодия весит десятки мегабайт — после ухода освобождаем
      if (!this.want) this.buf = this.loading = null;
    }, sec * 1000 + 80);
  }

  /** Смешной обрыв: плёнка «садится» — тон ныряет вниз, фильтр глохнет, и тишина. */
  tapeStop() {
    this.want = false;
    const ctx = sfx.audioContext();
    if (!ctx || !this.src || !this.gain || !this.lp || this.cut) return;
    this.cut = true;
    this.fading = true;
    this.remember(ctx);
    const t = ctx.currentTime;
    const g = this.gain.gain;
    g.cancelScheduledValues(t);
    g.setValueAtTime(Math.max(0.0001, g.value), t);
    g.setValueAtTime(Math.max(0.0001, g.value), t + 0.42);
    g.linearRampToValueAtTime(0.0001, t + 0.82);
    const r = this.src.playbackRate;
    r.cancelScheduledValues(t);
    r.setValueAtTime(1, t);
    r.exponentialRampToValueAtTime(0.05, t + 0.8);
    this.lp.frequency.cancelScheduledValues(t);
    this.lp.frequency.setValueAtTime(5200, t);
    this.lp.frequency.exponentialRampToValueAtTime(260, t + 0.8);
    const dead = this.src;
    window.setTimeout(() => {
      if (this.src === dead) this.drop();
      this.fading = false;
    }, 900);
  }
}

export const music = new Music();

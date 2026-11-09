// Audio files are local copies; the source project is never modified.
const tracks = {
  drop: 'audio/sfx_click.mp3', merge: 'audio/sfx_correct.mp3',
  won: 'audio/sfx_celebrate.mp3', tool: 'audio/sfx_unlock.mp3', lose: 'audio/sfx_wrong.mp3',
};
const assetUrl = path => `${import.meta.env.BASE_URL}${path}`;
export class GameAudio {
  constructor(preferences) {
    this.preferences = preferences;
    this.music = new Audio(assetUrl('audio/bgm-sunny-30s.mp3'));
    this.music.loop = true;
    this.music.volume = 0.23;
    this.started = false;
    this.suspended = false;
    this.effects = Object.fromEntries(Object.entries(tracks).map(([name, path]) => [name, Array.from({ length: 4 }, () => { const a = new Audio(assetUrl(path)); a.preload = 'auto'; a.volume = name === 'drop' ? 0.2 : 0.38; return a; })]));
    this.next = {};
  }
  unlock() { this.started = true; this.sync(); }
  sync() {
    if (!this.preferences.sound) Object.values(this.effects).flat().forEach(a => a.pause());
    if (this.preferences.music && this.started && !this.suspended) this.music.play().catch(() => {});
    else this.music.pause();
  }
  pause(value) { this.suspended = value; this.sync(); }
  play(name) {
    if (!this.preferences.sound) return;
    this.unlock();
    const pool = this.effects[name];
    if (!pool) return;
    const index = (this.next[name] || 0) % pool.length; this.next[name] = index + 1;
    const a = pool[index]; a.currentTime = 0; a.play().catch(() => {});
  }
  state() {
    return {
      musicEnabled: this.preferences.music, soundEnabled: this.preferences.sound,
      musicReady: this.music.readyState, musicDuration: this.music.duration,
      musicPlaying: !this.music.paused, musicError: this.music.error?.code || null,
      effects: Object.fromEntries(Object.entries(this.effects).map(([name, pool]) => [name, { ready: pool[0].readyState, error: pool[0].error?.code || null, duration: pool[0].duration }])),
    };
  }
}

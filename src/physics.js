import Matter from 'matter-js';
import { W, H, DANGER_Y, sizeFor } from './data.js';
const { Engine, Bodies, Body, Composite, Events } = Matter;

export class DropGame {
  constructor(level, emit = () => {}, random = Math.random) {
    this.emit = emit;
    this.random = random;
    this.engine = Engine.create({ enableSleeping: true, positionIterations: 8, velocityIterations: 8 });
    this.engine.gravity.y = 1.15;
    this.pending = [];
    Events.on(this.engine, 'collisionStart', event => this.findMerges(event.pairs));
    Events.on(this.engine, 'collisionActive', event => this.findMerges(event.pairs));
    this.start(level);
  }

  start(level) {
    Composite.clear(this.engine.world, false);
    Engine.clear(this.engine);
    this.level = level;
    this.tiles = new Map();
    this.pending = [];
    this.obstacles = [];
    this.time = 0;
    this.score = 0;
    this.drops = 0;
    this.merges = 0;
    this.maxValue = 0;
    this.combo = 0;
    this.lastMergeAt = -Infinity;
    this.lastDropAt = -Infinity;
    this.dangerTime = 0;
    this.inDanger = false;
    this.result = null;
    this.history = [];
    this.tools = { undo: 3, shuffle: 2, remove: 2 };
    this.bag = [];
    this.current = this.drawValue();
    this.next = [this.drawValue(), this.drawValue()];
    const wallOptions = { isStatic: true, friction: 0.32, restitution: 0.22, label: 'wall' };
    Composite.add(this.engine.world, [
      Bodies.rectangle(-15, H / 2, 40, H + 100, wallOptions),
      Bodies.rectangle(W + 15, H / 2, 40, H + 100, wallOptions),
      Bodies.rectangle(W / 2, H + 15, W + 80, 40, wallOptions),
    ]);
    for (const item of level.obstacles) {
      const body = Bodies.rectangle(item.x, item.y, item.width, 15, { ...wallOptions, angle: item.angle || 0, chamfer: { radius: 7 }, label: 'obstacle' });
      Composite.add(this.engine.world, body);
      this.obstacles.push({ ...item, body });
    }
    // Start with a scattered handful; every level still requires making its target.
    level.seeds.forEach((value, i) => {
      const x = 53 + (i % 5) * 78;
      const y = H - 45 - Math.floor(i / 5) * 80;
      const body = this.addTile(value, x, y, (i % 2 ? 1 : -1) * 0.12);
      body.plugin.born = -2000;
    });
    this.emit('update', this.state());
  }

  drawValue() {
    // A shuffled bag preserves each level's distribution and prevents long droughts.
    if (!this.bag.length) {
      this.bag = [...this.level.pool];
      for (let i = this.bag.length - 1; i > 0; i--) {
        const j = Math.floor(this.random() * (i + 1));
        [this.bag[i], this.bag[j]] = [this.bag[j], this.bag[i]];
      }
    }
    return this.bag.pop();
  }

  addTile(value, x, y, angle = 0) {
    const s = sizeFor(value);
    const body = Bodies.rectangle(x, y, s, s, {
      chamfer: { radius: s * 0.24 }, restitution: 0.18, friction: 0.35,
      frictionStatic: 0.55, frictionAir: 0.012, density: 0.0018,
      angle, sleepThreshold: 75, label: 'tile',
      plugin: { value, born: this.time, merging: false, dangerSince: null },
    });
    this.tiles.set(body.id, body);
    this.maxValue = Math.max(this.maxValue, value);
    Composite.add(this.engine.world, body);
    return body;
  }

  drop(x) {
    if (this.result || this.time - this.lastDropAt < 380 || this.drops >= this.level.drops) return false;
    this.history.push(this.snapshot());
    if (this.history.length > 3) this.history.shift();
    const s = sizeFor(this.current);
    const body = this.addTile(this.current, Math.max(s / 2 + 8, Math.min(W - s / 2 - 8, x)), 44);
    Body.setVelocity(body, { x: 0, y: 1.5 });
    this.drops++;
    this.lastDropAt = this.time;
    this.current = this.next.shift();
    this.next.push(this.drawValue());
    this.emit('drop', { x: body.position.x, value: body.plugin.value });
    this.emit('update', this.state());
    return true;
  }

  findMerges(pairs) {
    if (this.result) return;
    for (const { bodyA: a, bodyB: b } of pairs) {
      if (a.label !== 'tile' || b.label !== 'tile') continue;
      if (a.plugin.value !== b.plugin.value || a.plugin.merging || b.plugin.merging) continue;
      if (this.time - Math.max(a.plugin.born, b.plugin.born) < 240) continue;
      a.plugin.merging = b.plugin.merging = true;
      this.pending.push([a.id, b.id]);
    }
  }

  resolveMerges() {
    const pending = this.pending.splice(0);
    for (const [aId, bId] of pending) {
      const a = this.tiles.get(aId), b = this.tiles.get(bId);
      if (!a || !b) continue;
      const value = a.plugin.value * 2;
      const s = sizeFor(value);
      const x = Math.max(s / 2 + 8, Math.min(W - s / 2 - 8, (a.position.x + b.position.x) / 2));
      const y = Math.min(H - s / 2 - 8, (a.position.y + b.position.y) / 2);
      const velocity = { x: (a.velocity.x + b.velocity.x) / 2, y: Math.min(-1.4, (a.velocity.y + b.velocity.y) / 2) };
      this.removeTile(a); this.removeTile(b);
      const tile = this.addTile(value, x, y, (a.angle + b.angle) / 2);
      Body.setVelocity(tile, velocity);
      Body.setAngularVelocity(tile, (a.angularVelocity + b.angularVelocity) / 2);
      this.combo = this.time - this.lastMergeAt < 1600 ? this.combo + 1 : 1;
      this.lastMergeAt = this.time;
      this.score += value;
      this.merges++;
      this.emit('merge', { x, y, value, combo: this.combo });
      this.emit('update', this.state());
      if (value >= this.level.target) { this.finish('won'); break; }
    }
  }

  removeTile(body) { Composite.remove(this.engine.world, body); this.tiles.delete(body.id); }

  step(delta = 1000 / 60) {
    if (this.result) return;
    this.time += delta;
    for (const o of this.obstacles) {
      if (o.type === 'spinner') Body.setAngle(o.body, (this.time / (1000 / 60)) * o.speed);
    }
    Engine.update(this.engine, delta);
    this.resolveMerges();
    if (this.result) return;
    let danger = false;
    for (const body of this.tiles.values()) {
      // Falling pieces get a grace period; only a settled pile can end the game.
      if (body.bounds.min.y < DANGER_Y && this.time - body.plugin.born > 2000 && body.speed < 1.8) {
        if (body.plugin.dangerSince === null) body.plugin.dangerSince = this.time;
        danger = true;
        if (this.time - body.plugin.dangerSince > 2800) { this.finish('overflow'); break; }
      } else body.plugin.dangerSince = null;
    }
    if (danger !== this.inDanger) { this.inDanger = danger; this.emit('danger', danger); }
    if (!this.result && this.drops >= this.level.drops && this.time - this.lastDropAt > 5000 && this.time - this.lastMergeAt > 1600) this.finish('out-of-drops');
  }

  finish(result) {
    if (this.result) return;
    this.result = result;
    this.emit('result', { ...this.state(), result });
  }

  snapshot() {
    return {
      tiles: [...this.tiles.values()].map(b => ({ value: b.plugin.value, x: b.position.x, y: b.position.y, angle: b.angle, velocity: { ...b.velocity }, angularVelocity: b.angularVelocity })),
      score: this.score, drops: this.drops, merges: this.merges, maxValue: this.maxValue,
      current: this.current, next: [...this.next], bag: [...this.bag], time: this.time,
    };
  }

  restore(saved) {
    this.tiles.forEach(b => this.removeTile(b));
    this.pending = [];
    Engine.clear(this.engine);
    Object.assign(this, { score: saved.score, drops: saved.drops, merges: saved.merges, maxValue: saved.maxValue, current: saved.current, next: [...saved.next], bag: [...saved.bag], time: saved.time });
    for (const tile of saved.tiles) {
      const b = this.addTile(tile.value, tile.x, tile.y, tile.angle);
      b.plugin.born = this.time - 2400;
      Body.setVelocity(b, tile.velocity);
      Body.setAngularVelocity(b, tile.angularVelocity);
    }
    this.lastDropAt = this.time - 500;
    this.lastMergeAt = -Infinity;
    this.combo = 0;
    this.result = null;
    this.inDanger = false;
    this.emit('danger', false);
    this.emit('update', this.state());
  }

  useTool(name, tileId) {
    if (this.result || !this.tools[name]) return false;
    if (name === 'undo') {
      if (!this.history.length) return false;
      this.restore(this.history.pop());
    } else if (name === 'shuffle') {
      // Impulses remix positions without creating or destroying any value.
      this.tiles.forEach(b => {
        Matter.Sleeping.set(b, false);
        b.plugin.dangerSince = null;
        Body.setVelocity(b, { x: (this.random() - 0.5) * 13, y: -6 - this.random() * 4 });
        Body.setAngularVelocity(b, (this.random() - 0.5) * 0.15);
      });
      this.lastDropAt = this.time;
    } else if (name === 'remove') {
      const body = this.tiles.get(tileId);
      if (!body) return false;
      this.emit('remove', { x: body.position.x, y: body.position.y, value: body.plugin.value });
      this.removeTile(body);
    } else return false;
    this.tools[name]--;
    this.emit('tool', name);
    this.emit('update', this.state());
    return true;
  }

  state() {
    return { score: this.score, drops: this.drops, merges: this.merges, maxValue: this.maxValue, current: this.current, next: [...this.next], tools: { ...this.tools }, canUndo: this.history.length > 0, result: this.result };
  }
}

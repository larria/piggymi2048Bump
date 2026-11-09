import test from 'node:test';
import assert from 'node:assert/strict';
import Matter from 'matter-js';
import { DropGame } from '../src/physics.js';
import { levels, endlessLevel, W, H } from '../src/data.js';

const blank = { ...levels[0], target: Infinity, seeds: [], pool: [2], drops: Infinity };
const run = (game, ms) => { for (let elapsed = 0; elapsed < ms; elapsed += 1000 / 60) game.step(1000 / 60); };
const total = game => [...game.tiles.values()].reduce((sum, body) => sum + body.plugin.value, 0);
const settledTile = (game, value, x, y = H - 34) => { const b = game.addTile(value, x, y); b.plugin.born = -3000; return b; };

test('real collisions merge equal tiles, conserve value and award the resulting value', () => {
  const game = new DropGame(blank);
  settledTile(game, 4, 180); settledTile(game, 4, 230);
  run(game, 1000);
  assert.equal(game.tiles.size, 1); assert.equal(total(game), 8);
  assert.equal(game.score, 8); assert.equal(game.merges, 1);
});
test('three contacting equal tiles cannot consume a body twice', () => {
  const game = new DropGame(blank);
  settledTile(game, 4, 160); settledTile(game, 4, 210); settledTile(game, 4, 260);
  run(game, 1500);
  assert.equal(total(game), 12); assert.equal(game.tiles.size, 2); assert.equal(game.score, 8);
});
test('different values collide without merging', () => {
  const game = new DropGame(blank);
  settledTile(game, 4, 180); settledTile(game, 8, 230);
  run(game, 1200);
  assert.equal(game.tiles.size, 2); assert.equal(game.score, 0); assert.equal(total(game), 12);
});
test('newly merged tiles can produce a physical chain reaction', () => {
  const game = new DropGame(blank);
  settledTile(game, 4, 170); settledTile(game, 4, 218); settledTile(game, 8, 194, H - 90);
  run(game, 3500);
  assert.equal(total(game), 16); assert.equal(game.tiles.size, 1); assert.equal(game.score, 24);
});
test('target collision ends the level and emits one victory', () => {
  const events = [];
  const game = new DropGame({ ...blank, target: 8 }, (type, data) => { if (type === 'result') events.push(data); });
  settledTile(game, 4, 180); settledTile(game, 4, 230); run(game, 1500);
  assert.equal(game.result, 'won'); assert.equal(events.length, 1); assert.equal(events[0].maxValue, 8);
  assert.equal(game.drop(200), false);
});
test('drop clamps to the walls and enforces a short cooldown', () => {
  const game = new DropGame(blank);
  assert.equal(game.drop(-999), true); assert.equal(game.drop(999), false);
  run(game, 400); assert.equal(game.drop(999), true);
  for (const b of game.tiles.values()) assert.ok(b.position.x > 5 && b.position.x < W - 5);
  assert.equal(game.drops, 2);
});
test('undo restores the exact queue, score and pre-drop pile with a finite budget', () => {
  const game = new DropGame(levels[0], () => {}, () => 0.6);
  run(game, 2000); const before = game.snapshot();
  game.drop(200); run(game, 800);
  assert.equal(game.useTool('undo'), true);
  assert.equal(game.drops, before.drops); assert.equal(game.score, before.score);
  assert.equal(total(game), before.tiles.reduce((s, t) => s + t.value, 0));
  assert.deepEqual(game.next, before.next); assert.equal(game.current, before.current);
  assert.equal(game.tools.undo, 2); assert.equal(game.useTool('undo'), false);
});
test('shuffle conserves tiles and value and stops after two uses', () => {
  const game = new DropGame(levels[0]); const mass = total(game), count = game.tiles.size;
  assert.equal(game.useTool('shuffle'), true); assert.equal(game.useTool('shuffle'), true); assert.equal(game.useTool('shuffle'), false);
  assert.equal(total(game), mass); assert.equal(game.tiles.size, count); assert.equal(game.tools.shuffle, 0);
});
test('removal only consumes a use when it actually removes a tile', () => {
  const game = new DropGame(levels[0]); const b = [...game.tiles.values()][0]; const mass = total(game);
  assert.equal(game.useTool('remove', -1), false); assert.equal(game.tools.remove, 2);
  assert.equal(game.useTool('remove', b.id), true); assert.equal(total(game), mass - b.plugin.value); assert.equal(game.tools.remove, 1);
  assert.equal(game.useTool('remove', b.id), false);
});
test('restart clears old bodies, history, result and tools', () => {
  const game = new DropGame(levels[2]); game.drop(210); game.useTool('shuffle'); game.finish('overflow');
  const oldIds = [...game.tiles.keys()]; game.start(levels[0]);
  assert.equal(game.result, null); assert.equal(game.score, 0); assert.equal(game.drops, 0);
  assert.equal(game.obstacles.length, 0); assert.equal(game.tiles.size, levels[0].seeds.length);
  assert.deepEqual(game.tools, { undo: 3, shuffle: 2, remove: 2 }); assert.equal(game.history.length, 0);
  assert.ok(oldIds.every(id => !game.tiles.has(id)));
  assert.equal(Matter.Composite.allBodies(game.engine.world).length, 9);
});
test('falling through the warning line does not immediately lose', () => {
  const game = new DropGame(blank); game.drop(210); run(game, 2500);
  assert.equal(game.result, null); assert.equal(game.inDanger, false);
});
test('a stationary pile above the warning line loses after the grace period', () => {
  const game = new DropGame(blank); const body = game.addTile(4, 210, 60); Matter.Body.setStatic(body, true);
  run(game, 2400); assert.equal(game.result, null); assert.equal(game.inDanger, true);
  run(game, 3000); assert.equal(game.result, 'overflow');
});
test('running out of drops waits for the last falling piece', () => {
  const game = new DropGame({ ...blank, drops: 1 }); game.drop(210); assert.equal(game.drop(210), false);
  run(game, 1500); assert.equal(game.result, null);
  run(game, 4500); assert.equal(game.result, 'out-of-drops');
});
test('a last-drop target collision wins before the drop limit ends the game', () => {
  const game = new DropGame({ ...blank, target: 4, drops: 1 }); settledTile(game, 2, 210); game.drop(210); run(game, 6000);
  assert.equal(game.result, 'won');
});
test('spinning obstacles move while static ledges keep their angle', () => {
  const game = new DropGame(levels[6]); const [spinner, ledge] = game.obstacles; const initial = ledge.body.angle;
  run(game, 1000); assert.ok(Math.abs(spinner.body.angle) > 0.5); assert.equal(ledge.body.angle, initial);
});
test('all 12 levels have reachable numerical budgets and increasing challenges', () => {
  assert.equal(levels.length, 12); assert.equal(levels[11].target, 8192);
  for (const [i, level] of levels.entries()) {
    assert.ok(level.seeds.every(v => v < level.target));
    assert.ok(level.target <= level.seeds.reduce((s, v) => s + v, 0) + Math.max(...level.pool) * level.drops);
    assert.ok(level.pool.every(v => Number.isInteger(Math.log2(v))));
    if (i) assert.ok(level.difficulty >= levels[i - 1].difficulty);
    const game = new DropGame(level); run(game, 2500);
    assert.equal(game.result, null, `level ${i + 1} must not lose on startup`);
    assert.ok([...game.tiles.values()].every(b => Number.isFinite(b.position.x) && Number.isFinite(b.position.y)));
  }
});
test('endless mode never wins from a finite merge target', () => {
  const game = new DropGame(endlessLevel); assert.equal(game.level.target, Infinity); assert.equal(game.level.drops, Infinity);
});
test('balanced bags include the entire weighted pool in every cycle', () => {
  const game = new DropGame(levels[0]); game.bag = [];
  for (let cycle = 0; cycle < 10; cycle++) {
    const values = levels[0].pool.map(() => game.drawValue());
    assert.deepEqual(values.sort((a, b) => a - b), [...levels[0].pool].sort((a, b) => a - b));
  }
});
test('undo restores the remaining shuffled bag as well as the visible queue', () => {
  const game = new DropGame(levels[1]); const saved = game.snapshot();
  game.drop(200); game.useTool('undo'); assert.deepEqual(game.bag, saved.bag);
});

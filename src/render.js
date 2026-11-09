import Matter from 'matter-js';
import { W, H, DANGER_Y, sizeFor, colorsFor } from './data.js';

export function createRenderer(canvas, getGame, controls) {
  const ctx = canvas.getContext('2d');
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = W * ratio; canvas.height = H * ratio; ctx.scale(ratio, ratio);
  let particles = [], floatTexts = [], rings = [];
  const roundRect = (x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

  function tile(value, x, y, angle = 0, scale = 1, alpha = 1, preview = false) {
    const s = sizeFor(value), [base, light, ink] = colorsFor(value);
    ctx.save(); ctx.translate(x, y); ctx.rotate(angle); ctx.scale(scale, scale); ctx.globalAlpha = alpha;
    ctx.shadowColor = preview ? 'rgba(91,94,64,.12)' : 'rgba(61,73,64,.19)'; ctx.shadowBlur = 9; ctx.shadowOffsetY = 5;
    const g = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2); g.addColorStop(0, light); g.addColorStop(0.4, base); g.addColorStop(1, base);
    roundRect(-s / 2, -s / 2, s, s, s * 0.24); ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = 'transparent'; ctx.lineWidth = 1.5; ctx.strokeStyle = 'rgba(255,255,255,.72)'; ctx.stroke();
    // Folded pig ears stay inside the collider, keeping visual and collision shapes aligned.
    ctx.fillStyle = 'rgba(255,255,255,.45)';
    ctx.beginPath(); ctx.moveTo(-s * 0.32, -s * 0.35); ctx.quadraticCurveTo(-s * 0.43, -s * 0.5, -s * 0.19, -s * 0.41); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.moveTo(s * 0.32, -s * 0.35); ctx.quadraticCurveTo(s * 0.43, -s * 0.5, s * 0.19, -s * 0.41); ctx.closePath(); ctx.fill();
    roundRect(-s / 2 + 5, -s / 2 + 5, s - 10, s - 10, s * 0.18); ctx.strokeStyle = 'rgba(255,255,255,.21)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, -s * 0.3, s * 0.12, s * 0.035, -0.25, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = ink; ctx.font = `800 ${value >= 10000 ? 17 : value >= 1000 ? 20 : value >= 100 ? 24 : 29}px "Avenir Next", "Trebuchet MS", sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(value, 0, -1);
    ctx.fillStyle = ink; ctx.globalAlpha = alpha * 0.25; ctx.beginPath(); ctx.ellipse(0, s * 0.29, 8, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = alpha * 0.65; ctx.fillStyle = light; ctx.beginPath(); ctx.ellipse(-2.6, s * 0.29, 1, 1.8, 0, 0, Math.PI * 2); ctx.ellipse(2.6, s * 0.29, 1, 1.8, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }

  function burst(x, y, value, count = 16) {
    const color = colorsFor(value)[0];
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2, speed = 1.5 + Math.random() * 3;
      particles.push({ x, y, vx: Math.cos(a) * speed, vy: Math.sin(a) * speed - 1.2, life: 1, color, size: 2 + Math.random() * 3, angle: Math.random() * 6 });
    }
    rings.push({ x, y, r: 15, life: 1, color });
  }

  function draw(dt) {
    const game = getGame();
    ctx.clearRect(0, 0, W, H);
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#edf2ed'); bg.addColorStop(1, '#e6ece4'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ced8cf'; ctx.globalAlpha = 0.4;
    for (let x = 21; x < W; x += 24) for (let y = 17; y < H; y += 24) { ctx.beginPath(); ctx.arc(x, y, 0.85, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(125,149,126,.04)'; ctx.beginPath(); ctx.arc(W - 20, H - 130, 165, 0, 7); ctx.fill(); ctx.beginPath(); ctx.arc(0, H - 20, 135, 0, 7); ctx.fill();
    ctx.strokeStyle = '#ced8cd'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(6, H - 13); ctx.quadraticCurveTo(6, H - 5, 14, H - 5); ctx.lineTo(W - 14, H - 5); ctx.quadraticCurveTo(W - 6, H - 5, W - 6, H - 13); ctx.lineTo(W - 6, 0); ctx.stroke();
    ctx.save(); ctx.strokeStyle = game.inDanger ? '#d77965' : '#d5afa1'; ctx.lineWidth = 1.2; ctx.setLineDash([5, 7]); ctx.beginPath(); ctx.moveTo(17, DANGER_Y); ctx.lineTo(W - 17, DANGER_Y); ctx.stroke(); ctx.restore();
    ctx.fillStyle = '#ae9587'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right'; ctx.fillText(game.inDanger ? '快满啦！' : '小猪警戒线', W - 19, DANGER_Y - 9);
    // A quiet pig watermark at the bottom of the playfield.
    ctx.save(); ctx.translate(W / 2, H - 100); ctx.globalAlpha = 0.08; ctx.strokeStyle = '#71836e'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(0, 0, 35, 30, 0, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-25, -23); ctx.lineTo(-28, -40); ctx.quadraticCurveTo(-13, -37, -12, -28); ctx.moveTo(25, -23); ctx.lineTo(28, -40); ctx.quadraticCurveTo(13, -37, 12, -28); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, 9, 13, 9, 0, 0, 7); ctx.stroke(); ctx.fillStyle = '#71836e'; for (const [x,y,r] of [[-12,-6,2],[12,-6,2],[-4,9,1.7],[4,9,1.7]]) { ctx.beginPath(); ctx.arc(x,y,r,0,7); ctx.fill(); } ctx.restore();
    for (const o of game.obstacles) {
      ctx.save(); ctx.translate(o.body.position.x, o.body.position.y); ctx.rotate(o.body.angle);
      ctx.shadowColor = '#84928540'; ctx.shadowBlur = 6; ctx.shadowOffsetY = 4;
      roundRect(-o.width / 2, -7.5, o.width, 15, 7); ctx.fillStyle = o.type === 'spinner' ? '#a9bba4' : '#c4b9a4'; ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.strokeStyle = '#ffffff88'; ctx.lineWidth = 1.5; ctx.stroke();
      for (let x = -o.width / 2 + 12; x < o.width / 2 - 6; x += 12) { ctx.strokeStyle = '#ffffff44'; ctx.beginPath(); ctx.moveTo(x, -3); ctx.lineTo(x - 3, 3); ctx.stroke(); }
      if (o.type === 'spinner') { ctx.beginPath(); ctx.arc(0,0,5,0,7); ctx.fillStyle = '#e9eee3'; ctx.fill(); ctx.beginPath(); ctx.arc(0,0,2,0,7); ctx.fillStyle = '#87947e'; ctx.fill(); }
      ctx.restore();
    }
    if (!game.result && !controls.removeMode) {
      const s = sizeFor(game.current); controls.aim = Math.max(s / 2 + 8, Math.min(W - s / 2 - 8, controls.aim));
      const aim = controls.aim;
      const ray = Matter.Query.ray([...game.tiles.values(), ...game.obstacles.map(o => o.body)], { x: aim, y: 82 }, { x: aim, y: H - 10 });
      let bottom = H - s / 2 - 8;
      for (const collision of ray) bottom = Math.min(bottom, collision.bodyA.bounds.min.y - s / 2);
      ctx.save(); ctx.strokeStyle = '#879e7280'; ctx.lineWidth = 2; ctx.setLineDash([2, 9]); ctx.beginPath(); ctx.moveTo(aim, 76); ctx.lineTo(aim, Math.max(108, bottom - 5)); ctx.stroke(); ctx.restore();
      if (bottom > 120) { ctx.save(); ctx.globalAlpha = 0.14; roundRect(aim - s / 2, bottom - s / 2, s, s, s * 0.24); ctx.fillStyle = colorsFor(game.current)[0]; ctx.fill(); ctx.restore(); }
      const cooldown = game.time - game.lastDropAt < 380;
      tile(game.current, aim, 42, 0, controls.down ? 1.04 : 0.93, cooldown || game.drops >= game.level.drops ? 0.35 : 0.95, true);
      ctx.fillStyle = '#8e9d82'; ctx.beginPath(); ctx.moveTo(aim - 3, 4); ctx.lineTo(aim + 3, 4); ctx.lineTo(aim, 8); ctx.fill();
    }
    for (const body of game.tiles.values()) {
      const pop = Math.min(1, (game.time - body.plugin.born) / 170);
      tile(body.plugin.value, body.position.x, body.position.y, body.angle, 0.75 + pop * 0.25);
      if (controls.removeMode) { ctx.save(); ctx.translate(body.position.x, body.position.y); ctx.rotate(body.angle); ctx.strokeStyle = '#d88069'; ctx.lineWidth = 2; ctx.setLineDash([3,3]); const s = sizeFor(body.plugin.value) + 6; roundRect(-s / 2, -s / 2, s, s, 16); ctx.stroke(); ctx.restore(); }
    }
    const factor = dt / 16.67;
    for (const p of particles) { p.x += p.vx * factor; p.y += p.vy * factor; p.vy += 0.065 * factor; p.life -= 0.02 * factor; ctx.save(); ctx.globalAlpha = Math.max(0,p.life); ctx.translate(p.x,p.y); ctx.rotate(p.angle); ctx.fillStyle = p.color; ctx.fillRect(-p.size/2,-p.size/2,p.size,p.size); ctx.restore(); } particles = particles.filter(p => p.life > 0);
    for (const r of rings) { r.r += 1.6 * factor; r.life -= 0.035 * factor; ctx.save(); ctx.globalAlpha = Math.max(0,r.life) * 0.5; ctx.strokeStyle = r.color; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(r.x,r.y,r.r,0,7); ctx.stroke(); ctx.restore(); } rings = rings.filter(r => r.life > 0);
    for (const f of floatTexts) { f.y -= 0.7 * factor; f.life -= 0.015 * factor; ctx.save(); ctx.globalAlpha = Math.max(0,f.life); ctx.font = 'bold 18px "Avenir Next", sans-serif'; ctx.fillStyle = f.color; ctx.textAlign = 'center'; ctx.fillText(f.text,f.x,f.y); ctx.restore(); } floatTexts = floatTexts.filter(f => f.life > 0);
  }
  return { draw, burst, reset: () => { particles = []; floatTexts = []; rings = []; }, merge: data => { burst(data.x, data.y, data.value); floatTexts.push({ x: data.x, y: data.y - 35, text: `+${data.value}`, color: colorsFor(data.value)[2], life: 1 }); } };
}

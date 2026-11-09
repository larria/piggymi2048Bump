import './style.css';
import Matter from 'matter-js';
import { DropGame } from './physics.js';
import { levels, endlessLevel, W, H, colorsFor } from './data.js';
import { icon, pig } from './icons.js';
import { createRenderer } from './render.js';
import { GameAudio } from './audio.js';
import { setupPwa } from './pwa.js';

const $ = selector => document.querySelector(selector);
const storageKey = 'mizhu-2048-v1';
const defaults = { unlocked: 1, best: 0, stars: {}, sound: true, music: true, selected: 0 };
let progress;
try { progress = { ...defaults, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch { progress = { ...defaults }; }
progress.unlocked = Math.max(1, Math.min(12, Number(progress.unlocked) || 1));
progress.stars = progress.stars && typeof progress.stars === 'object' ? progress.stars : {};
progress.best = Math.max(0, Number(progress.best) || 0);
let levelIndex = Math.max(0, Math.min(progress.unlocked - 1, Number(progress.selected) || 0));
let endless = false, paused = false, dialogOpen = false, game;
let modalCloseAction = null, lastWinStars = 0, statusTimer, toastTimer;
const controls = { aim: W / 2, down: false, removeMode: false };
const audio = new GameAudio(progress);
function saveProgress() { try { localStorage.setItem(storageKey, JSON.stringify(progress)); } catch { /* Play still works without storage. */ } }
const smallTile = (value, cls = '') => `<span class="mini-tile ${cls}" style="--tile:${colorsFor(value)[0]};--tile-light:${colorsFor(value)[1]};--tile-ink:${colorsFor(value)[2]}">${value}</span>`;

$('#app').innerHTML = `
  <header class="site-header">
    <a class="brand" href="#" aria-label="咪猪头的2048碰碰大挑战，回到游戏">${pig('brand-pig')}<span><strong>咪猪头<span class="brand-dot">.</span></strong><small>2048 碰碰大挑战</small></span></a>
    <nav class="main-nav" aria-label="游戏模式"><button class="nav-button active" id="challenge-nav">闯关挑战<span></span></button><button class="nav-button" id="endless-nav">自由模式<span></span></button><button class="nav-button" id="map-nav">关卡地图${icon('map')}</button></nav>
    <div class="header-actions"><span class="local-label"><span></span>快乐，正在发生</span><button class="icon-button music-button" aria-label="关闭音乐" title="背景音乐">${icon('music')}</button><button class="icon-button sound-button" aria-label="关闭音效" title="游戏音效">${icon('sound')}</button></div>
  </header>
  <main class="main-layout">
    <aside class="intro-column">
      <div class="eyebrow"><span class="tiny-pig-nose"><i></i><i></i></span> 小猪的快乐实验室</div>
      <h1>咪猪头的<br><span class="title-number">2048<span class="title-spark">✳</span></span><br>碰碰大挑战<span class="title-dot">.</span></h1>
      <p class="intro-copy">轻轻一放，碰碰就长大。<br>和咪猪头一起，碰出一点惊喜！</p>
      <div class="mascot-scene"><div class="mascot-bubble">哼哼，今天也要碰个大的！<span></span></div><div class="orbit"></div>${smallTile(8, 'scene-tile scene-eight')}${pig('hero-pig')}${smallTile(4, 'scene-tile scene-four')}<span class="scene-flower">✳</span><span class="scene-dot"></span></div>
      <section class="mission-card" aria-labelledby="mission-title"><div class="section-label"><span id="mission-title">本关小目标</span>${icon('target')}</div><div class="mission-value"><span id="target-value">128</span><span class="target-tag">合成目标</span></div><div class="mission-progress"><span id="target-progress"></span></div><p id="mission-caption">让两个 64 相遇，就能过关啦</p><div class="mission-meta"><span id="difficulty-label">难度</span><div id="difficulty-dots" aria-label="难度 1 星"></div><span id="level-counter">01 / 12</span></div></section>
      <button class="map-link" id="map-link">去小猪的冒险地图${icon('arrow')}</button>
    </aside>
    <section class="game-column" aria-label="2048 物理合并游戏">
      <div class="game-topline"><span><span class="live-dot"></span><span id="mode-label">闯关模式</span></span><span id="level-rule">自由投放 · 熟悉引力</span></div>
      <div class="game-card"><div class="board-header"><div><span class="level-pill" id="level-pill">01</span><h2 id="level-name">初见引力</h2></div><div class="board-actions"><button class="icon-button" id="pause-button" aria-label="暂停游戏" title="暂停（P）">${icon('pause')}</button><button class="icon-button" id="restart-button" aria-label="重新开始本关" title="重新开始">${icon('restart')}</button></div></div>
        <div class="score-row"><div class="current-score"><span>本局得分</span><strong id="score">0</strong></div><div class="record-score"><span>${icon('trophy')}个人纪录</span><strong id="best">0</strong></div><div class="remaining-drops"><span>剩余投放</span><strong id="remaining">∞<small>次</small></strong></div></div>
        <div class="canvas-wrap" id="canvas-wrap"><canvas id="game-canvas" width="420" height="560" tabindex="0" aria-label="游戏区。左右方向键瞄准，空格键投放。触屏拖动瞄准，松手投放。"></canvas><div class="board-status" id="board-status" aria-live="polite"></div><div class="pause-overlay" id="pause-overlay" hidden>${pig('pause-pig')}<h3>小猪休息一下</h3><p>快乐不着急，我们等你回来</p><button class="primary-button" id="resume-button">${icon('play')}继续碰碰</button></div></div>
        <div class="board-footer"><span>${icon('cursor')}移动瞄准，松手投放</span><span class="keyboard-hint"><kbd>←</kbd><kbd>→</kbd><kbd>空格</kbd></span></div>
      </div><div class="game-caption"><span class="caption-line"></span><span>相同数字碰一碰，就会变成双倍的快乐</span><span class="caption-line"></span></div>
    </section>
    <aside class="play-column">
      <section class="next-card" aria-labelledby="next-title"><div class="section-label"><span id="next-title">准备好，下一只</span><span class="tag">NEXT</span></div><div class="next-preview" id="next-preview"></div><div class="queue"><span>随后登场</span><div id="next-queue"></div></div></section>
      <section class="tools-card" aria-labelledby="tools-title"><div class="section-label"><span id="tools-title">小猪的百宝袋</span>${icon('sparkles')}</div><p class="section-copy">留到关键时刻，会有奇效哦</p><button class="tool-button" id="undo-tool"><span class="tool-icon undo-icon">${icon('undo')}</span><span class="tool-text"><strong>再想一步</strong><small>撤回上一次投放</small></span><span class="tool-count" id="undo-count">3</span></button><button class="tool-button" id="shuffle-tool"><span class="tool-icon shuffle-icon">${icon('shuffle')}</span><span class="tool-text"><strong>猪猪摇一摇</strong><small>打散方块，创造相遇</small></span><span class="tool-count" id="shuffle-count">2</span></button><button class="tool-button" id="remove-tool"><span class="tool-icon remove-icon">${icon('wand')}</span><span class="tool-text"><strong>烦恼消失术</strong><small>点选消除一个方块</small></span><span class="tool-count" id="remove-count">2</span></button></section>
      <section class="guide-card"><div class="guide-title">${pig('guide-pig')}<span>咪猪头的小贴士</span></div><p id="level-tip">先把小数字合并，再让大数字相遇。慢一点，观察落点。</p><button id="help-button">第一次玩？看这里${icon('arrow')}</button></section>
      <div class="evolution-card"><div class="section-label"><span>快乐进化论</span><span>× 2</span></div><div class="evolution-chain">${smallTile(2)}<span>→</span>${smallTile(4)}<span>→</span>${smallTile(8)}<span>→</span><span class="more-dots">···</span></div></div>
    </aside>
  </main>
  <footer class="site-footer"><span>一点引力 · 一点运气 · 很多快乐</span><button class="install-button" id="install-button">${icon('install')}<span id="install-text">把小猪带回家</span></button><span class="offline-label" id="offline-label" hidden><span class="save-dot"></span>离线也能玩</span><span id="save-status"><span class="save-dot"></span>进度自动保存在本机</span></footer>
  <div class="update-notice" id="update-notice" role="status" hidden><div><strong>小猪带着新惊喜回来啦</strong><span>更新会重新开始本局，关卡进度会保留</span></div><button id="update-later">稍后再说</button><button id="update-now">更新并重开</button></div>
  <div class="toast" id="toast" role="status"></div><dialog id="modal"><div class="modal-shell"><button class="icon-button modal-close" id="modal-close" aria-label="关闭弹窗">${icon('close')}</button><div id="modal-content"></div></div></dialog>
`;
const canvas = $('#game-canvas');
const renderer = createRenderer(canvas, () => game, controls);

function onEvent(type, data) {
  if (type === 'update') updateUI(data);
  if (type === 'drop') { audio.play('drop'); controls.removeMode = false; updateRemoveMode(); }
  if (type === 'merge') { renderer.merge(data); audio.play('merge'); if (data.combo >= 3) status(`连碰 ×${data.combo}！猪事顺利`, 1800); }
  if (type === 'remove') renderer.burst(data.x, data.y, data.value, 25);
  if (type === 'tool') audio.play('tool');
  if (type === 'danger') { $('#canvas-wrap').classList.toggle('danger', data); if (data) status('快满啦！腾点空间给小猪', 2800); }
  if (type === 'result') handleResult(data);
}
function updateUI(state) {
  $('#score').textContent = state.score.toLocaleString();
  if (state.score > progress.best) { progress.best = state.score; saveProgress(); }
  $('#best').textContent = progress.best.toLocaleString();
  const remaining = (game ? game.level : endless ? endlessLevel : levels[levelIndex]).drops - state.drops;
  $('#remaining').innerHTML = `${Number.isFinite(remaining) ? remaining : '∞'}<small>次</small>`; $('#remaining').classList.toggle('low', remaining <= 10);
  $('#next-preview').innerHTML = `<div class="preview-halo"></div>${smallTile(state.current, 'preview-tile')}<span class="next-caption">${state.current <= 8 ? '小小一只，潜力无限' : '大一点，快乐多一点'}</span>`;
  $('#next-queue').innerHTML = state.next.map(v => smallTile(v)).join('');
  const target = endless ? Math.max(2048, state.maxValue * 2) : levels[levelIndex].target;
  $('#target-progress').style.width = `${Math.min(100, state.maxValue / target * 100)}%`;
  for (const name of ['undo', 'shuffle', 'remove']) { $(`#${name}-count`).textContent = state.tools[name]; $(`#${name}-tool`).disabled = !state.tools[name] || !!state.result || (name === 'undo' && !state.canUndo); }
  if (endless) { $('#target-value').textContent = target; $('#mission-caption').textContent = `继续合并，向 ${target} 进发`; }
}
function loadLevel(index = levelIndex, free = endless) {
  levelIndex = index; endless = free; const level = free ? endlessLevel : levels[index];
  paused = false; controls.removeMode = false; controls.down = false; renderer.reset();
  $('#pause-overlay').hidden = true; $('#pause-button').innerHTML = icon('pause'); $('#pause-button').setAttribute('aria-label', '暂停游戏'); $('#canvas-wrap').classList.remove('danger');
  $('#level-name').textContent = level.name; $('#level-pill').textContent = free ? '∞' : String(index + 1).padStart(2, '0'); $('#level-rule').textContent = level.rule; $('#mode-label').textContent = free ? '自由模式' : '闯关模式'; $('#level-tip').textContent = level.tip;
  $('#target-value').textContent = free ? 2048 : level.target; $('#mission-caption').textContent = free ? '继续合并，向 2048 进发' : `让两个 ${level.target / 2} 相遇，就能过关啦`; $('#level-counter').textContent = free ? '无尽' : `${String(index + 1).padStart(2, '0')} / 12`;
  $('#difficulty-dots').innerHTML = Array.from({ length: 5 }, (_, i) => `<i class="${i < level.difficulty ? 'filled' : ''}"></i>`).join(''); $('#difficulty-dots').setAttribute('aria-label', `难度 ${level.difficulty} 星`); $('#difficulty-label').textContent = free ? '自由' : '难度';
  $('#challenge-nav').classList.toggle('active', !free); $('#endless-nav').classList.toggle('active', free);
  if (!free) { progress.selected = index; saveProgress(); }
  if (game) game.start(level); else game = new DropGame(level, onEvent);
  updateUI(game.state()); updateRemoveMode(); syncAudio(); status(free ? '小猪自由玩，快乐不设限' : `第 ${index + 1} 关 · ${level.name}`, 2200);
}
function status(message, duration = 1600) { const el = $('#board-status'); el.textContent = message; el.classList.add('visible'); clearTimeout(statusTimer); statusTimer = setTimeout(() => el.classList.remove('visible'), duration); }
function toast(message) { $('#toast').textContent = message; $('#toast').classList.add('visible'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('visible'), 2600); }
function syncAudio() { audio.pause(paused || dialogOpen || document.hidden || !!game?.result); }
function showModal(html, className = '', onClose = null) { dialogOpen = true; controls.down = false; modalCloseAction = onClose; $('#modal-content').innerHTML = html; $('#modal').className = className; if (!$('#modal').open) $('#modal').showModal(); syncAudio(); }
function closeModal() { if (!$('#modal').open) return; $('#modal').close(); dialogOpen = false; const action = modalCloseAction; modalCloseAction = null; action?.(); syncAudio(); canvas.focus({ preventScroll: true }); }
$('#modal-close').addEventListener('click', closeModal);
$('#modal').addEventListener('cancel', e => { e.preventDefault(); closeModal(); });
$('#modal').addEventListener('click', e => { if (e.target === $('#modal')) { const r = $('#modal').getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) closeModal(); } });

function showMap() {
  showModal(`<div class="modal-heading"><span class="eyebrow">小猪的冒险地图</span><h2>一关一关，碰见更大的世界<span>.</span></h2><p>十二站引力旅行，后面的惊喜可没那么简单。</p></div><div class="map-grid">${levels.map((l, i) => {
    const locked = i >= progress.unlocked, stars = progress.stars[i] || 0;
    return `<button class="level-card ${locked ? 'locked' : ''} ${!endless && i === levelIndex ? 'selected' : ''}" data-level="${i}" ${locked ? 'disabled' : ''}><div class="level-card-top"><span>${String(i + 1).padStart(2, '0')}</span>${locked ? icon('lock') : stars ? `<span class="level-stars">${Array.from({ length: 3 }, (_, n) => icon('star', n < stars ? 'earned' : '')).join('')}</span>` : icon('arrow')}</div>${smallTile(l.target, 'map-tile')}<strong>${l.name}</strong><small>${l.rule}</small>${locked ? '<span class="locked-label">通过前一关解锁</span>' : `<span class="unlocked-label">${i === levelIndex && !endless ? '正在挑战' : stars ? '再碰一次' : '开始挑战'}</span>`}</button>`;
  }).join('')}</div><div class="map-bottom">${pig('map-pig')}<span>已解锁 <strong>${progress.unlocked} / 12</strong> 关 · 每一关都有专属机关和限量道具</span></div>`, 'map-modal');
  document.querySelectorAll('[data-level]').forEach(btn => btn.addEventListener('click', () => { const index = Number(btn.dataset.level); if (index >= progress.unlocked) return; if (index === levelIndex && !endless && !game.result) { closeModal(); return; } if (game.drops > 0 && !game.result) confirmChange(() => { closeModal(); loadLevel(index, false); }); else { closeModal(); loadLevel(index, false); } }));
}
function confirmChange(action, restart = false) {
  showModal(`${pig('result-pig')}<span class="eyebrow">${restart ? '再来一次，也很好' : '准备去新的地方？'}</span><h2>${restart ? '这次一定，猪事顺利' : '要离开这一局吗？'}</h2><p class="modal-copy">本局的方块和得分将重新开始，已解锁关卡与个人纪录会保留。</p><div class="modal-actions"><button class="secondary-button" id="cancel-change">继续这一局</button><button class="primary-button" id="confirm-change">${restart ? '重新挑战' : '确认切换'}${icon('arrow')}</button></div>`, 'confirm-modal');
  $('#cancel-change').addEventListener('click', closeModal); $('#confirm-change').addEventListener('click', action);
}
function showHelp() {
  showModal(`<div class="help-heading">${pig('help-pig')}<span class="eyebrow">欢迎来到小猪的快乐实验室</span><h2>三步，开始碰碰<span>.</span></h2></div><div class="help-steps"><div><span class="step-number">01</span><div>${icon('cursor')}<h3>瞄准，松手</h3><p>在游戏区移动鼠标，点击投放。手机上拖动瞄准，松手落下。</p></div></div><div><span class="step-number">02</span><div><div class="help-equation">${smallTile(4)}<span>+</span>${smallTile(4)}<span>=</span>${smallTile(8)}</div><h3>相同数字，碰成双倍</h3><p>相同的方块碰在一起，就会合成更大的数字。连续合并更痛快！</p></div></div><div><span class="step-number">03</span><div>${icon('target')}<h3>达到目标，解锁冒险</h3><p>合出本关目标数字即可过关。别让堆积的方块超过虚线，留意剩余投放次数。</p></div></div></div><div class="help-note"><strong>小猪还有三个秘密武器</strong><p>撤回上次投放、摇一摇打散方块、点选消除一个方块。每关限量，重新开始会补满。</p><span><kbd>←</kbd><kbd>→</kbd> 瞄准 &nbsp; <kbd>空格</kbd> 投放 &nbsp; <kbd>P</kbd> 暂停 &nbsp; <kbd>Esc</kbd> 取消消除</span></div><button class="primary-button help-start" id="help-start">懂啦，开碰！${icon('arrow')}</button>`, 'help-modal');
  $('#help-start').addEventListener('click', closeModal);
}
function handleResult(data) {
  controls.removeMode = false; updateRemoveMode(); const won = data.result === 'won';
  if (won) {
    lastWinStars = game.level.drops === Infinity ? (data.drops <= 20 ? 3 : data.drops <= 35 ? 2 : 1) : data.drops <= game.level.drops * 0.55 ? 3 : data.drops <= game.level.drops * 0.8 ? 2 : 1;
    progress.stars[levelIndex] = Math.max(progress.stars[levelIndex] || 0, lastWinStars); progress.unlocked = Math.max(progress.unlocked, Math.min(12, levelIndex + 2)); saveProgress(); audio.play('won');
    for (let i = 0; i < 6; i++) renderer.burst(70 + Math.random() * 280, 120 + Math.random() * 240, [4, 8, 128][i % 3], 20);
  } else audio.play('lose');
  syncAudio();
  const finishedGameTime = game.time;
  setTimeout(() => {
    if (!game.result || game.time !== finishedGameTime) return;
    showModal(`${pig('result-pig', won ? 'happy' : 'sad')}<span class="eyebrow">${won ? levelIndex === 11 ? '冒险毕业，猪猪万岁' : '猪事顺利，挑战成功' : '每一次尝试，都会更接近'}</span><h2>${won ? `碰出 ${game.level.target}，好耶！` : data.result === 'overflow' ? '小猪的口袋装满啦' : '机会用完，差一点点'}</h2>${won ? `<div class="result-stars">${Array.from({ length: 3 }, (_, i) => icon('star', i < lastWinStars ? 'earned' : '')).join('')}</div>` : `<p class="modal-copy">${data.result === 'overflow' ? '方块在警戒线上停留太久了。试着集中合并小数字，为大数字腾出空间。' : '本关投放次数已经用完。利用挡板反弹与道具，少走几步也能合出大数字。'}</p>`}<div class="result-stats"><div><small>本局得分</small><strong>${data.score.toLocaleString()}</strong></div><div><small>成功合并</small><strong>${data.merges}<span>次</span></strong></div><div><small>投放次数</small><strong>${data.drops}<span>次</span></strong></div></div><div class="modal-actions"><button class="secondary-button" id="result-map">关卡地图</button><button class="primary-button" id="result-next">${won && levelIndex < 11 ? '下一关，继续碰碰' : '再挑战一次'}${icon('arrow')}</button></div>`, 'result-modal', () => { if (game.result) status(won ? '挑战成功！打开地图继续冒险' : '本局结束，点击重新开始再试一次', 10000); });
    $('#result-map').addEventListener('click', showMap); $('#result-next').addEventListener('click', () => { closeModal(); loadLevel(won && levelIndex < 11 ? levelIndex + 1 : levelIndex, endless); });
  }, won ? 850 : 300);
}
function togglePause() { if (dialogOpen || game.result) return; paused = !paused; controls.down = false; $('#pause-overlay').hidden = !paused; $('#pause-button').innerHTML = icon(paused ? 'play' : 'pause'); $('#pause-button').setAttribute('aria-label', paused ? '继续游戏' : '暂停游戏'); syncAudio(); if (!paused) canvas.focus({ preventScroll: true }); }
function updateRemoveMode() { $('#remove-tool').classList.toggle('selected', controls.removeMode); $('#canvas-wrap').classList.toggle('removing', controls.removeMode); if (controls.removeMode) status('点击想消除的方块 · Esc 取消', 10000); else $('#board-status').classList.remove('visible'); }
function tryDrop() { if (paused || dialogOpen || game.result || controls.removeMode) return; audio.unlock(); if (!game.drop(controls.aim) && game.drops >= game.level.drops) status('投放用完啦，等待最后的碰撞…', 1500); }

canvas.addEventListener('pointermove', e => { const r = canvas.getBoundingClientRect(); controls.aim = Math.max(35, Math.min(W - 35, (e.clientX - r.left) / r.width * W)); });
canvas.addEventListener('pointerdown', e => {
  if (paused || dialogOpen || game.result || e.button !== 0) return;
  e.preventDefault(); canvas.focus({ preventScroll: true }); audio.unlock();
  const r = canvas.getBoundingClientRect(); controls.aim = Math.max(35, Math.min(W - 35, (e.clientX - r.left) / r.width * W));
  if (controls.removeMode) { const y = (e.clientY - r.top) / r.height * H; const body = Matter.Query.point([...game.tiles.values()], { x: controls.aim, y })[0]; if (body && game.useTool('remove', body.id)) { controls.removeMode = false; updateRemoveMode(); toast('烦恼消失！又多了一点空间'); } else status('点一下数字方块，就能消除它', 1500); return; }
  controls.down = true; canvas.setPointerCapture(e.pointerId);
});
canvas.addEventListener('pointerup', e => { if (controls.down) { controls.down = false; tryDrop(); } if (canvas.hasPointerCapture(e.pointerId)) canvas.releasePointerCapture(e.pointerId); });
canvas.addEventListener('pointercancel', () => { controls.down = false; });
window.addEventListener('keydown', e => {
  if (dialogOpen || ['INPUT', 'TEXTAREA'].includes(e.target.tagName)) return;
  if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') { e.preventDefault(); controls.aim = Math.max(42, Math.min(W - 42, controls.aim + (e.code === 'ArrowLeft' ? -14 : 14))); }
  if (e.code === 'Space' && (e.target === canvas || e.target === document.body)) { e.preventDefault(); if (!e.repeat) tryDrop(); }
  if (e.code === 'KeyP') togglePause(); if (e.code === 'Escape' && controls.removeMode) { controls.removeMode = false; updateRemoveMode(); toast('已取消消除'); }
});
$('#pause-button').addEventListener('click', togglePause); $('#resume-button').addEventListener('click', togglePause);
$('#restart-button').addEventListener('click', () => { if (game.drops > 0 && !game.result) confirmChange(() => { closeModal(); loadLevel(); }, true); else loadLevel(); });
['#map-nav', '#map-link'].forEach(id => $(id).addEventListener('click', showMap)); $('#help-button').addEventListener('click', showHelp);
function switchMode(free) { if (endless === free) { if (game.result) loadLevel(levelIndex, free); return; } if (game.drops && !game.result) confirmChange(() => { closeModal(); loadLevel(levelIndex, free); }); else loadLevel(levelIndex, free); }
$('#challenge-nav').addEventListener('click', () => switchMode(false)); $('#endless-nav').addEventListener('click', () => switchMode(true)); $('.brand').addEventListener('click', e => { e.preventDefault(); canvas.focus({ preventScroll: true }); });
function updateSound() { $('.sound-button').innerHTML = icon(progress.sound ? 'sound' : 'muted'); $('.sound-button').setAttribute('aria-label', progress.sound ? '关闭音效' : '开启音效'); $('.sound-button').classList.toggle('is-off', !progress.sound); $('.music-button').setAttribute('aria-label', progress.music ? '关闭音乐' : '开启音乐'); $('.music-button').classList.toggle('is-off', !progress.music); }
$('.sound-button').addEventListener('click', () => { progress.sound = !progress.sound; saveProgress(); updateSound(); audio.unlock(); if (progress.sound) audio.play('tool'); toast(progress.sound ? '音效开启，小猪有声陪伴' : '音效关闭，安静碰碰'); });
$('.music-button').addEventListener('click', () => { progress.music = !progress.music; saveProgress(); updateSound(); audio.unlock(); audio.sync(); toast(progress.music ? '音乐开启，快乐有节奏' : '音乐已关闭'); });
$('#undo-tool').addEventListener('click', () => { if (paused || dialogOpen) return; if (game.useTool('undo')) { renderer.reset(); controls.removeMode = false; updateRemoveMode(); toast('回到上一步，重新想想落点'); } });
$('#shuffle-tool').addEventListener('click', () => { if (paused || dialogOpen) return; if (game.useTool('shuffle')) { controls.removeMode = false; updateRemoveMode(); toast('猪猪摇一摇，相遇有新可能'); } });
$('#remove-tool').addEventListener('click', () => { if (paused || dialogOpen || !game.tools.remove || game.result) return; controls.removeMode = !controls.removeMode; updateRemoveMode(); });
loadLevel(); updateSound();
setupPwa({
  notify: toast,
  showInstallGuide() {
    showModal(`<img class="install-pig" src="${import.meta.env.BASE_URL}icons/pig-192.png" alt="粉红小猪" /><span class="eyebrow">让快乐住进桌面</span><h2>把小猪带回家<span>.</span></h2><p class="modal-copy">安装后，可像小游戏 App 一样打开。在线加载完成后，没网络也能玩。</p><div class="install-guide"><strong>iPhone / iPad</strong><p>在 Safari 打开游戏，点击「分享」→「添加到主屏幕」。</p><strong>Android / 电脑</strong><p>在 Chrome 或 Edge 的菜单中选择「安装应用」或「添加到主屏幕」。出现安装提示时，也可以直接安装。</p></div><button class="primary-button help-start" id="install-guide-close">好哒，猪猪等我${icon('arrow')}</button>`, 'confirm-modal');
    $('#install-guide-close').addEventListener('click', closeModal);
  },
});
let previous = performance.now(), accumulator = 0;
function frame(now) { const dt = Math.min(60, now - previous); previous = now; if (!paused && !dialogOpen && !document.hidden) { accumulator += dt; let steps = 0; while (accumulator >= 1000 / 60 && steps < 4) { game.step(1000 / 60); accumulator -= 1000 / 60; steps++; } } else accumulator = 0; renderer.draw(paused || dialogOpen ? 0 : dt); requestAnimationFrame(frame); }
requestAnimationFrame(frame);
document.addEventListener('visibilitychange', () => { previous = performance.now(); accumulator = 0; controls.down = false; syncAudio(); });
window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
// Read-only diagnostics, with no game-state mutation or production cheats.
window.mizhuGame = Object.freeze({ getAudioState: () => audio.state(), getState: () => ({ ...game.state(), level: levelIndex + 1, mode: endless ? 'endless' : 'challenge', paused, bodies: game.tiles.size, totalValue: [...game.tiles.values()].reduce((sum,b) => sum + b.plugin.value,0) }) });

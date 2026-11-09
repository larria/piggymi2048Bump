export const W = 420;
export const H = 560;
export const DANGER_Y = 95;

export const tileColors = {
  2: ['#f3d483', '#fff0b9', '#93722c'],
  4: ['#efa187', '#ffd0b8', '#944f3c'],
  8: ['#8fceb5', '#cae9d7', '#356b54'],
  16: ['#88bfe2', '#cee8f8', '#3c698e'],
  32: ['#b1a6d4', '#e0d9f0', '#635287'],
  64: ['#e5a3ba', '#f8d3df', '#8f4961'],
  128: ['#c4dd6e', '#e9f2b5', '#5d7523'],
  256: ['#68c5c0', '#b9e9dc', '#27645c'],
  512: ['#eeac5e', '#ffe0a9', '#935923'],
  1024: ['#72a990', '#b6d9c1', '#244e3c'],
  2048: ['#e5c34a', '#fff0a7', '#80601b'],
  4096: ['#d87662', '#ffc7ad', '#772d23'],
  8192: ['#607eac', '#b5c9e6', '#233d68'],
  16384: ['#546855', '#b2ca91', '#ffffff'],
};

const ledge = (x, y, width, angle = 0) => ({ x, y, width, angle, type: 'ledge' });
const spinner = (x, y, width, speed) => ({ x, y, width, speed, type: 'spinner' });
export const levels = [
  { name: '初见引力', subtitle: '每一次落下，都有新的可能', target: 128, drops: Infinity, difficulty: 1, pool: [2, 4, 4, 8, 8], seeds: [4, 16, 64, 8, 2, 32], obstacles: [], tip: '先把小数字合并，再让大数字相遇。慢一点，观察落点。', rule: '自由投放 · 熟悉引力' },
  { name: '恰好相遇', subtitle: '找准落点，让好事发生', target: 256, drops: 65, difficulty: 1, pool: [2, 4, 8, 8, 16], seeds: [8, 32, 128, 4, 16, 64], obstacles: [], tip: '65 次投放内合成 256。把相同数字放在同一侧，节省空间。', rule: '65 次投放 · 精准合并' },
  { name: '小小岔路', subtitle: '绕个弯，也能遇见彼此', target: 256, drops: 55, difficulty: 2, pool: [2, 4, 8, 8, 16], seeds: [8, 64, 4, 128, 16, 32], obstacles: [ledge(210, 292, 108, 0.18)], tip: '中央挡板会改变落点。试着从两侧投放，利用反弹合并。', rule: '中央挡板 · 55 次投放' },
  { name: '摇摆时刻', subtitle: '把握节奏，顺势而为', target: 512, drops: 65, difficulty: 2, pool: [4, 8, 8, 16, 32], seeds: [16, 64, 256, 8, 32, 128], obstacles: [spinner(210, 275, 116, 0.008)], tip: '转动挡板会让方块滑向两侧。观察它的角度，再松手。', rule: '旋转挡板 · 65 次投放' },
  { name: '双重奏', subtitle: '两道弧线，一场连锁反应', target: 512, drops: 55, difficulty: 3, pool: [4, 8, 16, 16, 32], seeds: [32, 128, 8, 256, 16, 64], obstacles: [ledge(118, 300, 100, 0.25), ledge(309, 375, 100, -0.25)], tip: '两道挡板形成不同高度的落点。小数字堆在挡板上会很危险。', rule: '双层挡板 · 55 次投放' },
  { name: '一线之间', subtitle: '留一点空间，给下一次惊喜', target: 1024, drops: 70, difficulty: 3, pool: [8, 16, 16, 32, 64], seeds: [32, 128, 256, 8, 64, 256], obstacles: [ledge(74, 356, 108, -0.18), ledge(346, 356, 108, 0.18)], tip: '两侧的挡板收窄了空间。保持中央通道畅通，争取连锁合并。', rule: '收窄空间 · 70 次投放' },
  { name: '引力回旋', subtitle: '每个时机，都值得等待', target: 1024, drops: 58, difficulty: 4, pool: [8, 16, 32, 32, 64], seeds: [64, 256, 16, 128, 32, 128], obstacles: [spinner(210, 275, 142, 0.012), ledge(100, 415, 88, 0.2)], tip: '旋转挡板与侧边平台同时出现。优先清理上层的小数字。', rule: '组合机关 · 58 次投放' },
  { name: '交错轨道', subtitle: '复杂一点，才更有意思', target: 2048, drops: 70, difficulty: 4, pool: [8, 16, 32, 32, 64], seeds: [128, 256, 256, 16, 64, 512], obstacles: [ledge(105, 272, 106, 0.28), ledge(315, 355, 106, -0.28)], tip: '需要合成 2048。把大方块留在底部，避免被小方块隔开。', rule: '交错平台 · 70 次投放' },
  { name: '双星引力', subtitle: '两颗星，也有共同的方向', target: 2048, drops: 60, difficulty: 4, pool: [16, 32, 32, 64, 64], seeds: [128, 512, 32, 256, 64, 256], obstacles: [spinner(116, 290, 104, 0.01), spinner(305, 375, 104, -0.013)], tip: '两块挡板以不同速度转动。谨慎使用洗牌，把关键数字带到一起。', rule: '双旋转机关 · 60 次投放' },
  { name: '深空漫游', subtitle: '更大的数字，更小的余地', target: 4096, drops: 70, difficulty: 5, pool: [16, 32, 64, 64, 128], seeds: [256, 1024, 64, 512, 128, 512], obstacles: [ledge(80, 325, 105, -0.22), spinner(240, 275, 116, 0.014), ledge(342, 405, 100, 0.2)], tip: '三道机关与更大的方块占据空间。每一次投放都要为下一步留位置。', rule: '三重机关 · 70 次投放' },
  { name: '极限共振', subtitle: '让所有可能，恰好发生', target: 4096, drops: 58, difficulty: 5, pool: [32, 32, 64, 64, 128], seeds: [256, 1024, 64, 512, 128, 512], obstacles: [spinner(132, 290, 112, 0.014), spinner(292, 375, 112, -0.016), ledge(72, 445, 82, 0.1)], tip: '只有 58 次机会。尽量制造连续合并，必要时用消除打开通道。', rule: '高速机关 · 58 次投放' },
  { name: '无限可能', subtitle: '在引力尽头，遇见 8192', target: 8192, drops: 68, difficulty: 5, pool: [32, 64, 64, 128, 256], seeds: [512, 2048, 128, 1024, 256, 1024], obstacles: [ledge(95, 278, 102, 0.28), spinner(278, 325, 126, 0.016), ledge(94, 411, 108, -0.24)], tip: '最终挑战：合成 8192。腾出空间、利用机关、把道具用在关键时刻。', rule: '最终挑战 · 68 次投放' },
];

export const endlessLevel = { name: '自由落体', subtitle: '没有终点，只有下一次惊喜', target: Infinity, drops: Infinity, difficulty: 0, pool: [2, 4, 4, 8, 8, 16], seeds: [4, 16, 64, 8, 2, 32], obstacles: [], tip: '尽情探索连锁合并。最高纪录会保存在这台设备上。', rule: '无限投放 · 挑战个人纪录' };
export const sizeFor = value => Math.min(78, 46 + Math.log2(value) * 2.5);
export const colorsFor = value => tileColors[value] || tileColors[16384];

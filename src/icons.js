export function icon(name, cls = '') {
  const paths = {
    arrow: '<path d="M5 12h14m-5-5 5 5-5 5"/>',
    install: '<path d="M12 3v12m-4-4 4 4 4-4M4 15v5h16v-5"/>',
    sound: '<path d="M11 5 6 9H3v6h3l5 4V5Zm4 3a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"/>',
    muted: '<path d="M11 5 6 9H3v6h3l5 4V5Zm5 4 5 6m0-6-5 6"/>',
    music: '<path d="M9 18V5l11-2v13M9 9l11-2"/><ellipse cx="6" cy="18" rx="3" ry="2.5"/><ellipse cx="17" cy="16" rx="3" ry="2.5"/>',
    pause: '<path d="M8 5v14M16 5v14"/>',
    play: '<path d="m8 5 11 7-11 7V5Z"/>',
    restart: '<path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/>',
    undo: '<path d="M8 4 3 9l5 5M3 9h11a7 7 0 0 1 0 14"/>',
    shuffle: '<path d="m17 3 4 4-4 4M3 17 17 7h4M17 13l4 4-4 4M3 7l5 4m5 3 4 3h4"/>',
    wand: '<path d="m4 20 12-12 4 4L8 24M17 2v3m5 2h-3M7 3v4M5 5h4M22 17v4m-2-2h4" transform="translate(0 -2)"/>',
    map: '<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3V6Zm6-3v15m6-12v15"/>',
    lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>',
    star: '<path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z"/>',
    trophy: '<path d="M7 3h10v7a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 4 4m10-7h4v3a4 4 0 0 1-4 4m-5 3v6m-4 0h8"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    leaf: '<path d="M20 3C8 1 1 9 6 16s15 2 14-13ZM5 20 16 8"/>',
    target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
    cursor: '<path d="m5 3 4 17 3-7 7-3L5 3Z"/>',
    sparkles: '<path d="m12 3 2 6 6 2-6 2-2 6-2-6-6-2 6-2 2-6Zm8 14v5m-2-2h4M4 2v4M2 4h4"/>',
  };
  return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.star}</svg>`;
}
export function pig(cls = '', mood = 'happy') {
  return `<svg class="pig ${cls}" viewBox="0 0 160 150" fill="none" aria-hidden="true"><path d="M34 59C17 46 15 17 25 17c13 0 27 13 33 29M126 59c17-13 19-42 9-42-13 0-27 13-33 29" fill="#f0b2a4" stroke="#986e60" stroke-width="2.3" stroke-linejoin="round"/><path d="m29 29 10 20-12-7m104-13-10 20 12-7" fill="#db8f87"/><ellipse cx="80" cy="85" rx="62" ry="55" fill="#f8cabc" stroke="#986e60" stroke-width="2.3"/><path d="M38 59c6-9 15-14 25-16" stroke="#ffe8db" stroke-width="6" stroke-linecap="round"/><ellipse cx="44" cy="95" rx="10" ry="6" fill="#ed9b98" opacity=".6"/><ellipse cx="116" cy="95" rx="10" ry="6" fill="#ed9b98" opacity=".6"/>${mood === 'sad' ? '<path d="m52 75 12 5m32 0 12-5" stroke="#6c5147" stroke-width="3" stroke-linecap="round"/><circle cx="61" cy="84" r="3" fill="#6c5147"/><circle cx="99" cy="84" r="3" fill="#6c5147"/>' : '<path d="M53 80q6-8 12 0m30 0q6-8 12 0" stroke="#6c5147" stroke-width="3.3" stroke-linecap="round"/>'}<ellipse cx="80" cy="103" rx="24" ry="17" fill="#eea69a" stroke="#bb8174" stroke-width="2"/><ellipse cx="72" cy="103" rx="3.6" ry="5" fill="#a16b61"/><ellipse cx="88" cy="103" rx="3.6" ry="5" fill="#a16b61"/><path d="M67 127q13 8 26 0" stroke="#bb8174" stroke-width="2" stroke-linecap="round"/></svg>`;
}

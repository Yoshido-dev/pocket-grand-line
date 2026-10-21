// probe: node probe.mjs "<js expression using g (window.__game)>" [url]  -> prints the JSON result after boot (intro done)
import { chromium } from 'playwright-core';
const expr = process.argv[2];
const url = process.argv[3] || 'http://localhost:8787/';
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
const page = await browser.newPage({ viewport: { width: 960, height: 600 } });
const logs = [];
page.on('pageerror', (e) => logs.push('pageerror: ' + e.message));
await page.goto(url);
await page.waitForSelector('#b-start', { timeout: 90000 });
await page.evaluate(() => localStorage.setItem('pgl-save-v1', JSON.stringify({ v: 1, jobs: {}, tracked: null, flags: [], chests: [], zones: [], posters: [], outfit: {}, opened: true, finale: false, stats: { m: 0, swims: 0, time: 0 }, settings: { music: 0, sfx: 0, blips: false, quality: 'high', largeText: false, reducedMotion: false, online: false, nightSky: true } })));
await page.reload();
await page.waitForSelector('#b-start', { timeout: 90000 });
await page.click('#b-start');
await page.waitForTimeout(3000);
const r = await page.evaluate(`(async () => { const g = window.__game; const w = g.world; const D = Math.PI/180; const V = g.player.dir.constructor; const dir = (lat, lon) => new V(Math.cos(lat*D)*Math.sin(lon*D), Math.sin(lat*D), Math.cos(lat*D)*Math.cos(lon*D)); const ll = (p) => [+(Math.asin(p.y)/D).toFixed(3), +(((Math.atan2(p.x,p.z)/D)+360)%360).toFixed(3)]; const sleep = (ms) => new Promise((r) => setTimeout(r, ms)); return (${expr}); })()`);
console.log(JSON.stringify(r, null, 1));
if (logs.length) console.log(logs);
await browser.close();

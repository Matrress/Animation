// Media probe and poster-frame proposer. Written for the OWNER'S machine (or any machine that can reach the media host):
// the sandbox this study was written in gets HTTP 403 from media.divinedunlop.com, so the numbers it would produce are
// NOT in the study. Nothing is uploaded, nothing is changed on the host; files are only read.
//
//   node tools/media-probe.mjs probe  [urls-or-paths…]            sizes, types, range support, cache headers (HTTP only)
//   node tools/media-probe.mjs frames [urls-or-paths…] [--out dir]  downloads each video to a temp folder, reads codec, bitrate,
//                                                                   duration and whether the file can start before it is fully
//                                                                   downloaded (faststart), extracts candidate frames and writes
//                                                                   frames/<name>/*.jpg and a contact sheet to choose from
// With no urls it reads the video and cover addresses from source/botanic-original-description.html (the approved source).
// Needs ffmpeg and ffprobe for `frames`. A local file path may be given in place of an address (used by the self-test).
import { readFileSync, mkdirSync, writeFileSync, existsSync, statSync, readdirSync, copyFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { dirname, join, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const [mode = 'probe', ...rest] = process.argv.slice(2);
const outIdx = rest.indexOf('--out');
const outDir = outIdx >= 0 ? rest.splice(outIdx, 2)[1] : join(root, 'docs', 'mobile', 'premium', 'frames');
let targets = rest;
if (!targets.length) {
  const src = readFileSync(join(root, 'source', 'botanic-original-description.html'), 'utf8');
  targets = [...new Set([...src.matchAll(/https:\/\/media\.divinedunlop\.com\/[^"'\s)]+\.(?:mp4|webp)/g)].map(m => m[0]))];
}
const isUrl = t => /^https?:\/\//.test(t);

async function probeOne(t) {
  if (!isUrl(t)) { const s = statSync(t); return { target: t, bytes: s.size, local: true }; }
  const r = { target: t };
  try {
    const h = await fetch(t, { method: 'HEAD' });
    r.status = h.status; r.type = h.headers.get('content-type'); r.bytes = Number(h.headers.get('content-length')) || null;
    r.acceptRanges = h.headers.get('accept-ranges'); r.cache = h.headers.get('cache-control'); r.encoding = h.headers.get('content-encoding');
    if (/\.mp4$/i.test(t)) {      // does a range request work (needed for playback to start early and for seeking)?
      const g = await fetch(t, { headers: { Range: 'bytes=0-1023' } });
      r.rangeStatus = g.status; r.rangeBytes = (await g.arrayBuffer()).byteLength;
    }
  } catch (e) { r.error = String(e.cause && e.cause.code || e.message); }
  return r;
}

function ffprobe(path) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-print_format', 'json', '-show_format', '-show_streams', path], { encoding: 'utf8' }));
  const v = (j.streams || []).find(s => s.codec_type === 'video') || {}; const a = (j.streams || []).find(s => s.codec_type === 'audio');
  return { codec: v.codec_name, profile: v.profile, width: v.width, height: v.height, fps: v.avg_frame_rate, pixFmt: v.pix_fmt, durationS: Number(j.format.duration), bitRateKbps: Math.round(Number(j.format.bit_rate) / 1000), audio: a ? a.codec_name : null, sizeBytes: Number(j.format.size) };
}
// faststart: the 'moov' atom must come before 'mdat' or the browser cannot start playing until it has fetched the end of the file
function faststart(path) {
  const b = readFileSync(path); let pos = 0, moov = -1, mdat = -1;
  while (pos + 8 <= b.length) { let size = b.readUInt32BE(pos); const type = b.toString('latin1', pos + 4, pos + 8); if (size === 1) size = Number(b.readBigUInt64BE(pos + 8)); if (type === 'moov' && moov < 0) moov = pos; if (type === 'mdat' && mdat < 0) mdat = pos; if (size < 8) break; pos += size; }
  return { moovOffset: moov, mdatOffset: mdat, faststart: moov >= 0 && mdat >= 0 ? moov < mdat : null };
}

if (mode === 'probe') {
  const rows = [];
  for (const t of targets) rows.push(await probeOne(t));
  console.table(rows.map(r => ({ file: basename(r.target), status: r.status ?? (r.local ? 'local' : r.error), MB: r.bytes ? +(r.bytes / 1048576).toFixed(2) : null, type: r.type, ranges: r.acceptRanges || r.rangeStatus, cache: r.cache })));
  const total = rows.reduce((a, r) => a + (r.bytes || 0), 0);
  console.log(`total of listed files: ${(total / 1048576).toFixed(1)} MB (${rows.filter(r => r.bytes).length} of ${rows.length} sizes known)`);
  mkdirSync(join(root, 'docs', 'mobile', 'premium', 'data'), { recursive: true });
  writeFileSync(join(root, 'docs', 'mobile', 'premium', 'data', 'media-probe.json'), JSON.stringify({ date: new Date().toISOString(), rows }, null, 1));
} else if (mode === 'frames') {
  const work = join(tmpdir(), 'ddtv-media-probe'); mkdirSync(work, { recursive: true }); mkdirSync(outDir, { recursive: true });
  const sheet = [];
  for (const t of targets.filter(x => /\.mp4$/i.test(x))) {
    const name = basename(t).replace(/\.mp4$/i, ''); let local = t;
    if (isUrl(t)) { local = join(work, basename(t)); const r = await fetch(t); if (!r.ok) { console.error('skip', name, r.status); continue; } writeFileSync(local, Buffer.from(await r.arrayBuffer())); }
    const info = { ...ffprobe(local), ...faststart(local) };
    const dir = join(outDir, name); mkdirSync(dir, { recursive: true });
    // Candidate frames at fixed fractions, 640 px wide, then scored: sharp (edge energy), not too dark/bright, distinct from the others.
    const cands = []; const fr = [0.05, 0.15, 0.25, 0.35, 0.5, 0.65, 0.8, 0.9];
    for (const f of fr) {
      const file = join(dir, `f${String(Math.round(f * 100)).padStart(2, '0')}.jpg`);
      execFileSync('ffmpeg', ['-v', 'error', '-y', '-ss', String(Math.max(0, info.durationS * f)), '-i', local, '-frames:v', '1', '-vf', 'scale=640:-2', '-q:v', '4', file]);
      cands.push({ at: f, file: basename(file), brightness: null });
    }
    // brightness and detail from a tiny grayscale histogram via ffmpeg's signalstats (YAVG) and a Sobel-edge average
    for (const c of cands) {
      const p = join(dir, c.file);
      const o = execFileSync('ffmpeg', ['-v', 'error', '-i', p, '-vf', 'sobel,signalstats,metadata=print:file=-', '-f', 'null', '-'], { encoding: 'utf8' });
      const m = /YAVG=([\d.]+)/.exec(o); c.edge = m ? +m[1] : 0;
      const o2 = execFileSync('ffmpeg', ['-v', 'error', '-i', p, '-vf', 'signalstats,metadata=print:file=-', '-f', 'null', '-'], { encoding: 'utf8' });
      const m2 = /YAVG=([\d.]+)/.exec(o2); c.brightness = m2 ? +m2[1] : 0;
      c.score = c.edge - Math.abs(c.brightness - 110) * 0.15;       // more detail, mid brightness: a PROPOSAL only
    }
    cands.sort((a, b) => b.score - a.score);
    sheet.push({ name, info, proposed: cands[0].file, candidates: cands });
    console.log(`${name}: ${info.codec} ${info.width}x${info.height} ${info.durationS.toFixed(1)}s ${info.bitRateKbps} kbit/s ${(info.sizeBytes / 1048576).toFixed(2)} MB faststart=${info.faststart}; proposed frame ${cands[0].file}`);
  }
  const html = `<!doctype html><meta charset="utf-8"><title>Poster frame candidates</title><body style="font:14px system-ui;margin:20px;background:#EDF5F7;color:#364849"><h1>Poster frame candidates</h1><p>Proposal only: the highlighted frame scores best on detail and mid brightness. Choose by eye; the owner decides.</p>` +
    sheet.map(s => `<h2>${s.name}</h2><p>${s.info.codec} ${s.info.width}×${s.info.height}, ${s.info.durationS.toFixed(1)} s, ${s.info.bitRateKbps} kbit/s, ${(s.info.sizeBytes / 1048576).toFixed(2)} MB, faststart: ${s.info.faststart}</p><div style="display:flex;flex-wrap:wrap;gap:8px">` + s.candidates.map(c => `<figure style="margin:0;${c.file === s.proposed ? 'outline:3px solid #759397' : ''}"><img src="${s.name}/${c.file}" width="220"><figcaption>${Math.round(c.at * 100)} % · detail ${c.edge.toFixed(1)} · light ${c.brightness.toFixed(0)}</figcaption></figure>`).join('') + '</div>').join('');
  writeFileSync(join(outDir, 'contact-sheet.html'), html); writeFileSync(join(outDir, 'frames.json'), JSON.stringify({ date: new Date().toISOString(), sheet }, null, 1));
  console.log('wrote ' + outDir);
} else { console.error('mode: probe | frames'); process.exit(2); }

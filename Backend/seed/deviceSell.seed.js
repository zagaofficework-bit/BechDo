const mongoose = require("mongoose");
const EvaluationConfig = require("../models/evaluationConfig.model");
const DeviceCatalog    = require("../models/deviceCatalog.model");
require("dotenv").config();

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/cashify_backend";

// ─── SVG builder ────────────────────────────────────────────────────────────
const svg = (content) => {
  const raw = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" fill="none">${content}</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(raw).toString("base64")}`;
};

// ─── Shared shape snippets ───────────────────────────────────────────────────
const PHONE = `<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
<rect x="48" y="10" width="24" height="3" rx="1.5" fill="#cbd5e1"/>`;

const PHONE_BACK = `<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
<rect x="48" y="10" width="24" height="3" rx="1.5" fill="#cbd5e1"/>
<rect x="42" y="20" width="20" height="20" rx="4" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
<circle cx="52" cy="30" r="6" fill="#e0f2fe" stroke="#1e293b" stroke-width="1.5"/>`;

const LAPTOP = `<rect x="10" y="30" width="100" height="68" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="16" y="36" width="88" height="52" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<rect x="5" y="98" width="110" height="8" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
<rect x="40" y="100" width="40" height="4" rx="2" fill="#e2e8f0"/>`;

const TABLET = `<rect x="22" y="6" width="76" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="30" y="16" width="60" height="88" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<rect x="55" y="10" width="10" height="3" rx="1.5" fill="#cbd5e1"/>`;

const WATCH = `<rect x="42" y="28" width="36" height="36" rx="8" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="46" y="32" width="28" height="28" rx="5" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<rect x="50" y="6" width="20" height="22" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
<rect x="50" y="64" width="20" height="22" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>`;

const TV = `<rect x="8" y="14" width="104" height="72" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
<rect x="14" y="20" width="92" height="60" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
<path d="M44 86 L40 106 M76 86 L80 106" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
<rect x="36" y="106" width="48" height="5" rx="2.5" fill="white" stroke="#1e293b" stroke-width="2"/>`;

// Accent colors
const T = "#00b4a0"; // teal
const R = "#ef4444"; // red

// ─── ALL SVG ICONS ──────────────────────────────────────────────────────────
const IMG = {

  // ════════ MOBILE ════════
  mobile_screen_cracked: svg(`${PHONE}
    <line x1="48" y1="24" x2="56" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="42" x2="44" y2="58" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="42" x2="70" y2="52" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="44" y1="58" x2="52" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="48" y1="24" x2="38" y2="32" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="48" y1="24" x2="62" y2="20" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  mobile_dead_pixels: svg(`${PHONE}
    <circle cx="50" cy="38" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="60" cy="38" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="70" cy="38" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="50" cy="50" r="3" fill="${T}"/>
    <line x1="47" y1="47" x2="53" y2="53" stroke="white" stroke-width="1.5"/>
    <line x1="53" y1="47" x2="47" y2="53" stroke="white" stroke-width="1.5"/>
    <circle cx="60" cy="50" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="70" cy="50" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="50" cy="62" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="60" cy="62" r="3" fill="${T}" opacity="0.4"/>
    <circle cx="70" cy="62" r="3" fill="${T}" opacity="0.4"/>`),

  mobile_touch: svg(`${PHONE}
    <path d="M54 70 C54 62 58 56 64 54 C68 52 72 54 72 58 L72 72 C72 76 76 76 76 80 L76 84 C76 90 70 94 64 94 L60 94 C54 94 50 90 50 84 L50 74 C50 70 54 70 54 70Z" fill="white" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="57" y1="44" x2="63" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="44" x2="57" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  mobile_display_lines: svg(`${PHONE}
    <line x1="38" y1="28" x2="82" y2="28" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="38" y1="38" x2="82" y2="38" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="38" y1="52" x2="82" y2="52" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="62" y1="16" x2="62" y2="92" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),

  mobile_burn_in: svg(`${PHONE}
    <rect x="40" y="20" width="40" height="28" rx="2" fill="${T}" opacity="0.08"/>
    <rect x="43" y="23" width="34" height="22" rx="1" fill="${T}" opacity="0.1"/>
    <text x="45" y="37" font-size="7" fill="${T}" font-family="sans-serif" opacity="0.5">GHOST</text>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="none" stroke="${T}" stroke-width="1.5" stroke-dasharray="5 3"/>`),

  mobile_back_cracked: svg(`${PHONE_BACK}
    <line x1="60" y1="50" x2="68" y2="70" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="68" y1="70" x2="58" y2="82" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="60" y1="50" x2="72" y2="56" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="58" y1="82" x2="66" y2="88" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  mobile_body_dents: svg(`<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M32 48 C28 50 26 54 28 58 C30 62 32 62 32 62" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="28" cy="53" r="3" fill="${T}" opacity="0.3"/>
    <path d="M88 68 C92 66 94 70 92 74 C90 78 88 77 88 77" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>`),

  mobile_body_scratches: svg(`<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="36" y1="40" x2="40" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="34" y1="55" x2="37" y2="68" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="84" y1="50" x2="87" y2="70" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`),

  mobile_frame_bent: svg(`<rect x="32" y="6" width="56" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="38" y="16" width="44" height="76" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="103" r="4" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M32 60 C28 62 26 70 30 74 C34 78 36 76 38 74" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M28 62 L34 60 M30 68 L36 66" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.6"/>`),

  mobile_camera_broken: svg(`${PHONE_BACK}
    <circle cx="52" cy="30" r="9" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="48" y1="26" x2="56" y2="34" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="50" y1="24" x2="54" y2="36" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  mobile_camera_notworking: svg(`${PHONE_BACK}
    <circle cx="52" cy="30" r="9" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="48" y1="26" x2="56" y2="34" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="26" x2="48" y2="34" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  mobile_front_camera: svg(`${PHONE}
    <circle cx="60" cy="12" r="4" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="12" r="2" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <line x1="57" y1="7" x2="63" y2="7" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="63" y1="7" x2="57" y2="13" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="68" cy="6" r="4" fill="${T}" opacity="0.8"/>
    <text x="65.5" y="9.5" font-size="6" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),

  mobile_charging_port: svg(`${PHONE}
    <rect x="53" y="108" width="14" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M62 96 L58 103 L62 103 L58 112" stroke="${T}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  mobile_speaker: svg(`${PHONE}
    <rect x="50" y="10" width="20" height="4" rx="2" fill="#94a3b8"/>
    <path d="M54 36 L58 32 L58 44 L54 40 L50 40 L50 36 Z" fill="${T}" opacity="0.8"/>
    <line x1="62" y1="33" x2="66" y2="43" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="66" y1="33" x2="62" y2="43" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  mobile_microphone: svg(`${PHONE}
    <rect x="56" y="32" width="8" height="16" rx="4" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M50 44 C50 50 54 54 60 54 C66 54 70 50 70 44" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <line x1="60" y1="54" x2="60" y2="60" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="56" y1="60" x2="64" y2="60" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="56" y1="36" x2="62" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="62" y1="36" x2="56" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  mobile_battery: svg(`${PHONE}
    <rect x="42" y="46" width="36" height="20" rx="3" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="78" y="52" width="4" height="8" rx="2" fill="#1e293b"/>
    <rect x="45" y="49" width="8" height="14" rx="2" fill="${T}" opacity="0.3"/>
    <line x1="56" y1="50" x2="62" y2="64" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="50" x2="56" y2="64" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  mobile_water: svg(`${PHONE}
    <path d="M52 50 C52 46 56 38 60 36 C64 38 68 46 68 50 C68 55.5 64.4 60 60 60 C55.6 60 52 55.5 52 50Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>
    <path d="M42 64 C42 61 44 56 46 55 C48 56 50 61 50 64 C50 67.3 48.2 70 46 70 C43.8 70 42 67.3 42 64Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>
    <path d="M66 66 C66 63 68 60 70 59 C72 60 74 63 74 66 C74 69 72.2 72 70 72 C67.8 72 66 69 66 66Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>`),

  mobile_overheating: svg(`${PHONE}
    <path d="M52 60 C52 48 58 40 60 36 C62 40 68 48 68 60 C68 67 64.4 72 60 72 C55.6 72 52 67 52 60Z" fill="${R}" opacity="0.15" stroke="${R}" stroke-width="2"/>
    <path d="M56 58 C56 52 59 47 60 44 C61 47 64 52 64 58 C64 63 62.2 66 60 66 C57.8 66 56 63 56 58Z" fill="${R}" opacity="0.25" stroke="${R}" stroke-width="1.5"/>`),

  mobile_wifi_issue: svg(`${PHONE}
    <path d="M60 56 C66 56 71 53 74 48" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M60 56 C54 56 49 53 46 48" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
    <path d="M60 56 C63 56 66 54.5 68 52" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M60 56 C57 56 54 54.5 52 52" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <circle cx="60" cy="58" r="3" fill="#1e293b"/>
    <line x1="56" y1="38" x2="64" y2="46" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="64" y1="38" x2="56" y2="46" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  mobile_fingerprint: svg(`${PHONE}
    <path d="M46 72 C46 64 52 58 60 58 C68 58 74 64 74 72" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M50 72 C50 66 54 62 60 62 C66 62 70 66 70 72" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <path d="M54 72 C54 68 57 66 60 66 C63 66 66 68 66 72" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" fill="none"/>
    <line x1="56" y1="46" x2="64" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="64" y1="46" x2="56" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  // ════════ LAPTOP ════════
  laptop_screen_cracked: svg(`${LAPTOP}
    <line x1="46" y1="42" x2="56" y2="60" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="60" x2="44" y2="74" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="60" x2="70" y2="68" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="46" y1="42" x2="36" y2="50" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="46" y1="42" x2="58" y2="38" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  laptop_dead_pixels: svg(`${LAPTOP}
    <circle cx="52" cy="55" r="3.5" fill="${T}"/>
    <line x1="49" y1="52" x2="55" y2="58" stroke="white" stroke-width="1.5"/>
    <line x1="55" y1="52" x2="49" y2="58" stroke="white" stroke-width="1.5"/>
    <circle cx="64" cy="48" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="74" cy="62" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="44" cy="66" r="2.5" fill="${T}" opacity="0.5"/>`),

  laptop_display_lines: svg(`${LAPTOP}
    <line x1="16" y1="48" x2="104" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="16" y1="58" x2="104" y2="58" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="16" y1="72" x2="104" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="68" y1="36" x2="68" y2="88" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),

  laptop_backlight: svg(`${LAPTOP}
    <rect x="16" y="36" width="88" height="52" rx="2" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="16" y="36" width="44" height="52" rx="2" fill="#e0f2fe" opacity="0.6"/>
    <line x1="60" y1="38" x2="60" y2="86" stroke="${T}" stroke-width="1.5" stroke-dasharray="4 3"/>
    <text x="28" y="66" font-size="9" fill="${T}" font-family="sans-serif" opacity="0.8">DIM</text>
    <text x="70" y="66" font-size="9" fill="#94a3b8" font-family="sans-serif">OK</text>`),

  laptop_discoloration: svg(`${LAPTOP}
    <rect x="16" y="36" width="88" height="52" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <ellipse cx="45" cy="62" rx="22" ry="16" fill="${T}" opacity="0.15"/>
    <ellipse cx="80" cy="50" rx="14" ry="10" fill="${R}" opacity="0.1"/>
    <text x="34" y="65" font-size="8" fill="${T}" font-family="sans-serif" opacity="0.7">stain</text>`),

  laptop_keyboard: svg(`${LAPTOP}
    <rect x="16" y="98" width="88" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="22" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>
    <rect x="36" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>
    <rect x="50" y="100" width="10" height="4" rx="1" fill="${T}" stroke="${T}" stroke-width="1"/>
    <line x1="53" y1="101.5" x2="57" y2="103.5" stroke="white" stroke-width="1.2"/>
    <line x1="57" y1="101.5" x2="53" y2="103.5" stroke="white" stroke-width="1.2"/>
    <rect x="64" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>
    <rect x="78" y="100" width="10" height="4" rx="1" fill="white" stroke="#1e293b" stroke-width="1"/>`),

  laptop_trackpad: svg(`${LAPTOP}
    <rect x="40" y="100" width="40" height="5" rx="1" fill="#f1f5f9" stroke="${T}" stroke-width="1.5"/>
    <line x1="56" y1="101.5" x2="64" y2="104.5" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="64" y1="101.5" x2="56" y2="104.5" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  laptop_hinge: svg(`<rect x="10" y="58" width="100" height="48" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="16" y="64" width="88" height="32" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="5" y="106" width="110" height="8" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M10 58 C10 30 14 18 30 14" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M110 58 C110 30 106 18 90 14" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <path d="M30 14 L90 14" stroke="#1e293b" stroke-width="2.5"/>
    <circle cx="28" cy="57" r="5" fill="white" stroke="${T}" stroke-width="2.5"/>
    <line x1="25" y1="54" x2="31" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="31" y1="54" x2="25" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <circle cx="92" cy="57" r="5" fill="white" stroke="${T}" stroke-width="2.5"/>
    <line x1="89" y1="54" x2="95" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="95" y1="54" x2="89" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  laptop_body_cracks: svg(`${LAPTOP}
    <line x1="20" y1="88" x2="34" y2="96" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="34" y1="96" x2="24" y2="104" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="34" y1="96" x2="46" y2="98" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="86" y1="92" x2="96" y2="98" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`),

  laptop_body_dents: svg(`${LAPTOP}
    <path d="M20 72 C16 70 14 72 16 76 C18 80 22 79 22 79" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="15" cy="73" r="3" fill="${T}" opacity="0.25"/>
    <path d="M100 58 C104 56 106 58 104 62 C102 66 98 65 98 65" stroke="${T}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>`),

  laptop_port_damage: svg(`${LAPTOP}
    <rect x="102" y="54" width="10" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="102" y="66" width="10" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="103" y1="55" x2="111" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="111" y1="55" x2="103" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <rect x="5" y="62" width="8" height="5" rx="1.5" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="6" y1="63" x2="12" y2="67" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  laptop_battery: svg(`${LAPTOP}
    <rect x="32" y="50" width="56" height="28" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="88" y="60" width="6" height="8" rx="2" fill="#1e293b"/>
    <rect x="35" y="53" width="12" height="22" rx="2" fill="${T}" opacity="0.3"/>
    <line x1="56" y1="56" x2="64" y2="72" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    <line x1="64" y1="56" x2="56" y2="72" stroke="${T}" stroke-width="3" stroke-linecap="round"/>`),

  laptop_fan: svg(`${LAPTOP}
    <circle cx="60" cy="62" r="18" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="62" r="4" fill="${T}"/>
    <path d="M60 58 C58 52 52 50 50 54 C48 58 54 62 60 62" fill="${T}" opacity="0.5"/>
    <path d="M64 62 C70 60 72 54 68 52 C64 50 62 56 62 62" fill="${T}" opacity="0.5"/>
    <path d="M60 66 C62 72 68 74 70 70 C72 66 66 62 60 62" fill="${T}" opacity="0.5"/>
    <path d="M56 62 C50 64 48 70 52 72 C56 74 60 68 60 62" fill="${T}" opacity="0.5"/>
    <circle cx="75" cy="48" r="8" fill="${T}"/>
    <text x="72" y="52" font-size="10" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),

  laptop_liquid: svg(`${LAPTOP}
    <path d="M44 52 C44 46 48 38 52 36 C56 38 60 46 60 52 C60 58.6 56.4 64 52 64 C47.6 64 44 58.6 44 52Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>
    <path d="M62 58 C62 54 64 50 66 49 C68 50 70 54 70 58 C70 62 68 65 66 65 C64 65 62 62 62 58Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>`),

  laptop_ram: svg(`${LAPTOP}
    <rect x="28" y="52" width="64" height="18" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="32" y="56" width="8" height="10" rx="1.5" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="44" y="56" width="8" height="10" rx="1.5" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="56" y="56" width="8" height="10" rx="1.5" fill="${T}" opacity="0.4" stroke="${T}" stroke-width="1"/>
    <rect x="68" y="56" width="8" height="10" rx="1.5" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <circle cx="84" cy="48" r="7" fill="${T}"/>
    <text x="81.5" y="52" font-size="8" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),

  laptop_storage: svg(`${LAPTOP}
    <rect x="30" y="50" width="60" height="28" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="34" y="55" width="28" height="4" rx="2" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="34" y="63" width="28" height="4" rx="2" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <rect x="34" y="71" width="18" height="4" rx="2" fill="${T}" opacity="0.4" stroke="${T}" stroke-width="1"/>
    <line x1="70" y1="56" x2="82" y2="70" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="82" y1="56" x2="70" y2="70" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  // ════════ TABLET ════════
  tablet_screen_cracked: svg(`${TABLET}
    <line x1="44" y1="24" x2="54" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="54" y1="48" x2="40" y2="68" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="54" y1="48" x2="72" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="44" y1="24" x2="32" y2="34" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="44" y1="24" x2="58" y2="18" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  tablet_touch: svg(`${TABLET}
    <path d="M52 72 C52 62 57 55 64 53 C69 51 74 53 74 58 L74 74 C74 79 78 79 78 84 L78 88 C78 95 72 99 66 99 L62 99 C56 99 52 95 52 89 L52 76 C52 72 52 72 52 72Z" fill="white" stroke="#1e293b" stroke-width="1.8"/>
    <line x1="56" y1="42" x2="62" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="62" y1="42" x2="56" y2="48" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  tablet_dead_pixels: svg(`${TABLET}
    <circle cx="52" cy="44" r="3.5" fill="${T}"/>
    <line x1="49" y1="41" x2="55" y2="47" stroke="white" stroke-width="1.5"/>
    <line x1="55" y1="41" x2="49" y2="47" stroke="white" stroke-width="1.5"/>
    <circle cx="66" cy="36" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="76" cy="56" r="2.5" fill="${T}" opacity="0.5"/>
    <circle cx="44" cy="60" r="2.5" fill="${T}" opacity="0.5"/>`),

  tablet_display_lines: svg(`${TABLET}
    <line x1="30" y1="36" x2="90" y2="36" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="30" y1="50" x2="90" y2="50" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="30" y1="68" x2="90" y2="68" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="65" y1="16" x2="65" y2="104" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),

  tablet_back_cracked: svg(`<rect x="22" y="6" width="76" height="108" rx="9" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="55" y="10" width="10" height="3" rx="1.5" fill="#cbd5e1"/>
    <rect x="30" y="16" width="30" height="30" rx="5" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="45" cy="31" r="8" fill="#e0f2fe" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="58" y1="56" x2="68" y2="80" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="68" y1="80" x2="56" y2="96" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="58" y1="56" x2="72" y2="64" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  tablet_body_dents: svg(`${TABLET}
    <path d="M22 50 C17 48 15 52 18 56 C20 60 22 59 22 59" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="16" cy="52" r="3.5" fill="${T}" opacity="0.25"/>
    <path d="M98 70 C103 68 105 72 102 76 C100 80 98 79 98 79" stroke="${T}" stroke-width="2" stroke-linecap="round" fill="none" opacity="0.6"/>`),

  tablet_body_scratches: svg(`${TABLET}
    <line x1="26" y1="30" x2="30" y2="55" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="24" y1="48" x2="27" y2="65" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="93" y1="40" x2="96" y2="65" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>`),

  tablet_charging_port: svg(`${TABLET}
    <rect x="54" y="111" width="12" height="6" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M62 97 L58 105 L62 105 L58 114" stroke="${T}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>`),

  tablet_battery: svg(`${TABLET}
    <rect x="34" y="52" width="52" height="24" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="86" y="61" width="5" height="6" rx="2" fill="#1e293b"/>
    <rect x="37" y="55" width="10" height="18" rx="2" fill="${T}" opacity="0.3"/>
    <line x1="56" y1="57" x2="64" y2="71" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    <line x1="64" y1="57" x2="56" y2="71" stroke="${T}" stroke-width="3" stroke-linecap="round"/>`),

  tablet_water: svg(`${TABLET}
    <path d="M48 52 C48 45 52 37 56 35 C60 37 64 45 64 52 C64 58 60.4 63 56 63 C51.6 63 48 58 48 52Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>
    <path d="M66 60 C66 57 68 54 70 53 C72 54 74 57 74 60 C74 63 72.2 66 70 66 C67.8 66 66 63 66 66Z" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="1.5"/>`),

  tablet_camera: svg(`${TABLET}
    <circle cx="80" cy="25" r="7" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="80" cy="25" r="4" fill="#e0f2fe" stroke="#1e293b" stroke-width="1"/>
    <line x1="77" y1="20" x2="83" y2="26" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="83" y1="20" x2="77" y2="26" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  tablet_speaker: svg(`${TABLET}
    <rect x="28" y="52" width="6" height="28" rx="3" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="31" y1="56" x2="31" y2="60" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="31" y1="64" x2="31" y2="68" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="27" y1="54" x2="33" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="33" y1="54" x2="27" y2="62" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  // ════════ SMARTWATCH ════════
  watch_screen_cracked: svg(`${WATCH}
    <line x1="50" y1="35" x2="56" y2="46" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="46" x2="48" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="56" y1="46" x2="66" y2="50" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="35" x2="44" y2="40" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  watch_dead_pixels: svg(`${WATCH}
    <circle cx="56" cy="42" r="3" fill="${T}"/>
    <line x1="53.5" y1="39.5" x2="58.5" y2="44.5" stroke="white" stroke-width="1.5"/>
    <line x1="58.5" y1="39.5" x2="53.5" y2="44.5" stroke="white" stroke-width="1.5"/>
    <circle cx="66" cy="46" r="2" fill="${T}" opacity="0.5"/>
    <circle cx="57" cy="52" r="2" fill="${T}" opacity="0.4"/>`),

  watch_touch_issue: svg(`${WATCH}
    <path d="M55 50 C55 46 57.5 43 60 42 C62.5 43 65 46 65 50 C65 53.5 62.7 56.5 60 56.5 C57.3 56.5 55 53.5 55 50Z" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="57" y1="36" x2="63" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="36" x2="57" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  watch_body_scratches: svg(`${WATCH}
    <line x1="44" y1="32" x2="46" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.8"/>
    <line x1="43" y1="40" x2="44.5" y2="50" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="74" y1="38" x2="76" y2="50" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.6"/>`),

  watch_body_dents: svg(`${WATCH}
    <path d="M42 38 C38 36 36 40 38 44 C40 48 42 47 42 47" stroke="${T}" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <circle cx="37" cy="40" r="3" fill="${T}" opacity="0.25"/>`),

  watch_strap_damaged: svg(`${WATCH}
    <line x1="50" y1="8" x2="70" y2="8" stroke="${T}" stroke-width="2.5" stroke-linecap="round" stroke-dasharray="3 2"/>
    <line x1="52" y1="12" x2="62" y2="16" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="62" y1="12" x2="52" y2="16" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="82" x2="70" y2="82" stroke="${T}" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 2" opacity="0.6"/>`),

  watch_crown: svg(`${WATCH}
    <rect x="78" y="40" width="10" height="12" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <line x1="80" y1="42" x2="86" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="86" y1="42" x2="80" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  watch_battery: svg(`${WATCH}
    <rect x="46" y="34" width="28" height="18" rx="3" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="74" y="40" width="4" height="6" rx="1.5" fill="#1e293b"/>
    <rect x="49" y="37" width="5" height="12" rx="1.5" fill="${T}" opacity="0.3"/>
    <line x1="57" y1="37" x2="63" y2="49" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="37" x2="57" y2="49" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  watch_charging: svg(`${WATCH}
    <circle cx="60" cy="96" r="8" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M60 88 L60 80 M56 84 L60 88 L64 84" stroke="#1e293b" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
    <line x1="57" y1="93" x2="63" y2="99" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="63" y1="93" x2="57" y2="99" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>`),

  watch_water: svg(`${WATCH}
    <path d="M50 76 C50 70 54 62 58 60 C62 62 66 70 66 76 C66 82.6 62.4 88 58 88 C53.6 88 50 82.6 50 76Z" fill="${T}" opacity="0.2" stroke="${T}" stroke-width="2"/>`),

  watch_sensor: svg(`${WATCH}
    <rect x="48" y="60" width="24" height="16" rx="4" fill="#f0f9ff" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="68" r="4" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <line x1="56" y1="64" x2="64" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="64" y1="64" x2="56" y2="72" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  // ════════ TELEVISION ════════
  tv_panel_cracked: svg(`${TV}
    <line x1="40" y1="28" x2="52" y2="50" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="52" y1="50" x2="38" y2="68" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="52" y1="50" x2="70" y2="60" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="40" y1="28" x2="28" y2="36" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="40" y1="28" x2="54" y2="22" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="70" y1="60" x2="80" y2="54" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  tv_panel_lines: svg(`${TV}
    <line x1="14" y1="42" x2="106" y2="42" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="14" y1="52" x2="106" y2="52" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>
    <line x1="14" y1="68" x2="106" y2="68" stroke="${T}" stroke-width="2" stroke-linecap="round" opacity="0.7"/>
    <line x1="72" y1="20" x2="72" y2="86" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.4"/>`),

  tv_dead_pixels: svg(`${TV}
    <circle cx="48" cy="46" r="4" fill="${T}"/>
    <line x1="45" y1="43" x2="51" y2="49" stroke="white" stroke-width="1.5"/>
    <line x1="51" y1="43" x2="45" y2="49" stroke="white" stroke-width="1.5"/>
    <circle cx="72" cy="38" r="3" fill="${T}" opacity="0.5"/>
    <circle cx="88" cy="60" r="3" fill="${T}" opacity="0.5"/>
    <circle cx="36" cy="62" r="3" fill="${T}" opacity="0.5"/>`),

  tv_burn_in: svg(`${TV}
    <rect x="30" y="28" width="60" height="44" rx="2" fill="${T}" opacity="0.08"/>
    <rect x="36" y="34" width="48" height="32" rx="1" fill="${T}" opacity="0.1"/>
    <text x="38" y="56" font-size="8" fill="${T}" font-family="sans-serif" opacity="0.5">GHOST</text>
    <rect x="14" y="20" width="92" height="60" rx="2" fill="none" stroke="${T}" stroke-width="1.5" stroke-dasharray="5 3"/>`),

  tv_discoloration: svg(`${TV}
    <ellipse cx="42" cy="50" rx="22" ry="18" fill="${T}" opacity="0.12"/>
    <ellipse cx="80" cy="42" rx="15" ry="12" fill="${R}" opacity="0.1"/>
    <ellipse cx="70" cy="65" rx="12" ry="8" fill="#a855f7" opacity="0.1"/>`),

  tv_bezel_cracked: svg(`${TV}
    <line x1="14" y1="38" x2="26" y2="54" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <line x1="26" y1="54" x2="14" y2="66" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="26" y1="54" x2="34" y2="58" stroke="${T}" stroke-width="1.5" stroke-linecap="round"/>`),

  tv_stand_broken: svg(`<rect x="8" y="14" width="104" height="72" rx="5" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="14" y="20" width="92" height="60" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M44 86 L36 106 M76 86 L84 106" stroke="#1e293b" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 3"/>
    <rect x="32" y="106" width="56" height="5" rx="2.5" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="40" y1="108" x2="50" y2="112" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="50" y1="108" x2="40" y2="112" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  tv_speaker: svg(`${TV}
    <path d="M26 44 L32 38 L32 62 L26 56 L20 56 L20 44 Z" fill="${T}" opacity="0.8"/>
    <line x1="36" y1="41" x2="42" y2="59" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="42" y1="41" x2="36" y2="59" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  tv_hdmi: svg(`${TV}
    <rect x="96" y="38" width="14" height="10" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="96" y="54" width="14" height="10" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="97" y1="40" x2="108" y2="48" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="108" y1="40" x2="97" y2="48" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  tv_usb_port: svg(`${TV}
    <rect x="5" y="46" width="12" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="5" y="58" width="12" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="1.5"/>
    <line x1="6" y1="47" x2="15" y2="54" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="15" y1="47" x2="6" y2="54" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  tv_power: svg(`${TV}
    <circle cx="90" cy="44" r="10" fill="white" stroke="${T}" stroke-width="2"/>
    <path d="M90 38 L90 44" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M85 41 C83 43 82 46 82 49 C82 54.5 85.7 59 90 59 C94.3 59 98 54.5 98 49 C98 46 97 43 95 41" stroke="${T}" stroke-width="2" stroke-linecap="round" fill="none"/>
    <circle cx="90" cy="30" r="5" fill="${T}"/>
    <text x="87.5" y="34" font-size="8" fill="white" font-family="sans-serif" font-weight="bold">!</text>`),

  tv_remote_issue: svg(`${TV}
    <rect x="50" y="42" width="20" height="44" rx="7" fill="white" stroke="#1e293b" stroke-width="2"/>
    <circle cx="60" cy="56" r="5" fill="#f0f9ff" stroke="${T}" stroke-width="1.5"/>
    <circle cx="54" cy="68" r="3" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <circle cx="60" cy="68" r="3" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <circle cx="66" cy="68" r="3" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <line x1="56" y1="48" x2="64" y2="56" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="64" y1="48" x2="56" y2="56" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  tv_no_signal: svg(`${TV}
    <rect x="14" y="20" width="92" height="60" rx="2" fill="#1e293b" stroke="#1e293b" stroke-width="1.5"/>
    <text x="28" y="52" font-size="10" fill="${T}" font-family="sans-serif" opacity="0.8">NO SIGNAL</text>
    <circle cx="88" cy="36" r="6" fill="${T}" opacity="0.3"/>
    <text x="85.5" y="39.5" font-size="8" fill="${T}" font-family="sans-serif" font-weight="bold">!</text>`),

  // ════════ ACCESSORIES ════════
  acc_box: svg(`<path d="M60 14 L100 34 L100 86 L60 106 L20 86 L20 34 Z" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <path d="M60 14 L60 106" stroke="#1e293b" stroke-width="1.5" stroke-dasharray="5 3"/>
    <path d="M20 34 L60 54 L100 34" stroke="#1e293b" stroke-width="2"/>
    <path d="M60 54 L60 106" stroke="#1e293b" stroke-width="2"/>
    <path d="M42 24 L58 32" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <path d="M42 30 L58 38" stroke="${T}" stroke-width="1.5" stroke-linecap="round" opacity="0.5"/>`),

  acc_charger: svg(`<rect x="38" y="12" width="44" height="36" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="46" y="6" width="8" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="66" y="6" width="8" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M60 48 L60 72" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M48 72 L72 72" stroke="#1e293b" stroke-width="2"/>
    <path d="M54 72 L50 88 L70 88 L66 72" stroke="#1e293b" stroke-width="2"/>
    <rect x="50" y="88" width="20" height="8" rx="3" fill="white" stroke="${T}" stroke-width="2"/>
    <rect x="57" y="96" width="6" height="14" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M54 102 L66 102" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  acc_invoice: svg(`<rect x="26" y="10" width="68" height="90" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <path d="M54 10 L54 28 L80 28" stroke="#1e293b" stroke-width="2"/>
    <path d="M54 10 L80 28 L80 100 L26 100 L26 10 Z" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <line x1="36" y1="44" x2="74" y2="44" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <line x1="36" y1="54" x2="74" y2="54" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="64" x2="74" y2="64" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
    <line x1="36" y1="74" x2="60" y2="74" stroke="#cbd5e1" stroke-width="1.5" stroke-linecap="round"/>
    <rect x="36" y="80" width="20" height="10" rx="2" fill="${T}" opacity="0.15"/>
    <line x1="36" y1="85" x2="56" y2="85" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  acc_strap: svg(`<rect x="46" y="28" width="28" height="28" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="50" y="32" width="20" height="20" rx="3" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="50" y="6" width="20" height="22" rx="5" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="2"/>
    <rect x="54" y="9" width="12" height="3" rx="1.5" fill="${T}" opacity="0.5"/>
    <rect x="54" y="14" width="12" height="3" rx="1.5" fill="${T}" opacity="0.3"/>
    <rect x="50" y="56" width="20" height="22" rx="5" fill="${T}" opacity="0.15" stroke="${T}" stroke-width="2"/>
    <rect x="54" y="59" width="12" height="3" rx="1.5" fill="${T}" opacity="0.5"/>
    <rect x="54" y="64" width="12" height="3" rx="1.5" fill="${T}" opacity="0.3"/>`),

  acc_remote: svg(`<rect x="38" y="8" width="44" height="96" rx="14" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <circle cx="60" cy="34" r="12" fill="#f0f9ff" stroke="${T}" stroke-width="2"/>
    <circle cx="60" cy="34" r="5" fill="${T}" opacity="0.3"/>
    <circle cx="48" cy="56" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="56" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="72" cy="56" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="48" cy="70" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="70" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="72" cy="70" r="5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="48" y="82" width="24" height="5" rx="2.5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>
    <rect x="48" y="92" width="24" height="5" rx="2.5" fill="#f1f5f9" stroke="#1e293b" stroke-width="1.5"/>`),

  acc_stand: svg(`<rect x="8" y="14" width="104" height="58" rx="4" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="14" y="20" width="92" height="46" rx="2" fill="#f8fafc" stroke="#1e293b" stroke-width="1.5"/>
    <path d="M42 72 L36 96 M78 72 L84 96" stroke="${T}" stroke-width="2.5" stroke-linecap="round"/>
    <rect x="30" y="96" width="60" height="8" rx="3" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="36" y1="92" x2="84" y2="92" stroke="#e2e8f0" stroke-width="1.5"/>`),

  acc_cable: svg(`<path d="M28 40 C28 34 32 28 40 28 L80 28 C88 28 92 34 92 40" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" fill="none"/>
    <rect x="24" y="40" width="16" height="10" rx="3" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="80" y="40" width="16" height="10" rx="3" fill="white" stroke="${T}" stroke-width="2"/>
    <line x1="82" y1="42" x2="94" y2="50" stroke="${T}" stroke-width="2" stroke-linecap="round"/>
    <path d="M28 50 C28 70 32 80 36 90 M92 50 C92 70 88 80 84 90" stroke="#1e293b" stroke-width="2" stroke-linecap="round" fill="none"/>
    <rect x="30" y="88" width="12" height="8" rx="2" fill="white" stroke="#1e293b" stroke-width="2"/>
    <rect x="78" y="88" width="12" height="8" rx="2" fill="white" stroke="${T}" stroke-width="2"/>`),

  acc_stylus: svg(`<rect x="54" y="10" width="12" height="80" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <path d="M54 90 L60 108 L66 90" fill="white" stroke="#1e293b" stroke-width="2" stroke-linejoin="round"/>
    <rect x="56" y="14" width="8" height="3" rx="1.5" fill="${T}" opacity="0.5"/>
    <circle cx="60" cy="26" r="3" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <line x1="57" y1="105" x2="63" y2="105" stroke="${T}" stroke-width="2" stroke-linecap="round"/>`),

  acc_earphones: svg(`<path d="M36 60 C36 36 44 22 60 20 C76 22 84 36 84 60" stroke="#1e293b" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="36" cy="64" r="10" fill="white" stroke="#1e293b" stroke-width="2"/>
    <circle cx="36" cy="64" r="5" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <circle cx="84" cy="64" r="10" fill="white" stroke="#1e293b" stroke-width="2"/>
    <circle cx="84" cy="64" r="5" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <circle cx="60" cy="82" r="6" fill="white" stroke="#1e293b" stroke-width="2"/>
    <path d="M60 76 L60 70" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>`),

  acc_keyboard: svg(`<rect x="10" y="32" width="100" height="56" rx="6" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <rect x="16" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="32" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="48" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="64" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="80" y="40" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="16" y="54" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="32" y="54" width="12" height="8" rx="2" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1"/>
    <rect x="48" y="54" width="28" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="80" y="54" width="12" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>
    <rect x="28" y="68" width="64" height="8" rx="2" fill="#f1f5f9" stroke="#1e293b" stroke-width="1"/>`),

  acc_mouse: svg(`<path d="M40 60 C40 36 50 20 60 18 C70 20 80 36 80 60 C80 80 72 100 60 100 C48 100 40 80 40 60Z" fill="white" stroke="#1e293b" stroke-width="2.5"/>
    <line x1="60" y1="18" x2="60" y2="58" stroke="#1e293b" stroke-width="1.5"/>
    <circle cx="60" cy="54" r="5" fill="${T}" opacity="0.3" stroke="${T}" stroke-width="1.5"/>
    <path d="M60 6 L60 12" stroke="#1e293b" stroke-width="2" stroke-linecap="round"/>
    <path d="M60 12 L60 18" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round"/>`),
};

////////////////////////////////////////////////////////////////////
//// CATALOG SEED DATA
////////////////////////////////////////////////////////////////////

const catalogSeed = [

  // ── MOBILE ───────────────────────────────────────────────────────
  {
    brand: "Apple", category: "mobile",
    models: [
      {
        name: "iPhone 16 Pro Max",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: 90000 },
          { specs: { ram: "8 GB", storage: "512 GB" }, basePrice: 110000 },
          { specs: { ram: "8 GB", storage: "1 TB"   }, basePrice: 130000 },
        ],
      },
      {
        name: "iPhone 16 Pro",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "128 GB" }, basePrice: 75000 },
          { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: 85000 },
          { specs: { ram: "8 GB", storage: "512 GB" }, basePrice: 100000 },
        ],
      },
      {
        name: "iPhone 16",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "128 GB" }, basePrice: 60000 },
          { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: 70000 },
          { specs: { ram: "8 GB", storage: "512 GB" }, basePrice: 85000 },
        ],
      },
      {
        name: "iPhone 15 Pro Max",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: 75000 },
          { specs: { ram: "8 GB", storage: "512 GB" }, basePrice: 90000 },
          { specs: { ram: "8 GB", storage: "1 TB"   }, basePrice: 110000 },
        ],
      },
      {
        name: "iPhone 15 Pro",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "128 GB" }, basePrice: 62000 },
          { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: 72000 },
          { specs: { ram: "8 GB", storage: "512 GB" }, basePrice: 90000 },
        ],
      },
      {
        name: "iPhone 15",
        image: null,
        variants: [
          { specs: { ram: "6 GB", storage: "128 GB" }, basePrice: 50000 },
          { specs: { ram: "6 GB", storage: "256 GB" }, basePrice: 60000 },
          { specs: { ram: "6 GB", storage: "512 GB" }, basePrice: 75000 },
        ],
      },
      {
        name: "iPhone 14",
        image: null,
        variants: [
          { specs: { ram: "6 GB", storage: "128 GB" }, basePrice: 42000 },
          { specs: { ram: "6 GB", storage: "256 GB" }, basePrice: 50000 },
          { specs: { ram: "6 GB", storage: "512 GB" }, basePrice: 62000 },
        ],
      },
      {
        name: "iPhone 13",
        image: null,
        variants: [
          { specs: { ram: "4 GB", storage: "128 GB" }, basePrice: 32000 },
          { specs: { ram: "4 GB", storage: "256 GB" }, basePrice: 38000 },
          { specs: { ram: "4 GB", storage: "512 GB" }, basePrice: 48000 },
        ],
      },
    ],
  },
  {
    brand: "Samsung", category: "mobile",
    models: [
      {
        name: "Galaxy S25 Ultra",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 95000 },
          { specs: { ram: "12 GB", storage: "512 GB" }, basePrice: 110000 },
          { specs: { ram: "12 GB", storage: "1 TB"   }, basePrice: 130000 },
        ],
      },
      {
        name: "Galaxy S25+",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 70000 },
          { specs: { ram: "12 GB", storage: "512 GB" }, basePrice: 82000 },
        ],
      },
      {
        name: "Galaxy S25",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "128 GB" }, basePrice: 55000 },
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 62000 },
        ],
      },
      {
        name: "Galaxy S24 Ultra",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 75000 },
          { specs: { ram: "12 GB", storage: "512 GB" }, basePrice: 88000 },
          { specs: { ram: "12 GB", storage: "1 TB"   }, basePrice: 105000 },
        ],
      },
      {
        name: "Galaxy S24",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 38000 },
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 48000 },
        ],
      },
      {
        name: "Galaxy Z Fold 6",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 120000 },
          { specs: { ram: "12 GB", storage: "512 GB" }, basePrice: 140000 },
        ],
      },
      {
        name: "Galaxy Z Flip 6",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 70000 },
          { specs: { ram: "12 GB", storage: "512 GB" }, basePrice: 82000 },
        ],
      },
      {
        name: "Galaxy A55",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 22000 },
          { specs: { ram: "8 GB",  storage: "256 GB" }, basePrice: 26000 },
        ],
      },
      {
        name: "Galaxy A54",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "128 GB" }, basePrice: 18000 },
          { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: 22000 },
        ],
      },
    ],
  },
  {
    brand: "OnePlus", category: "mobile",
    models: [
      {
        name: "OnePlus 13",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 50000 },
          { specs: { ram: "16 GB", storage: "512 GB" }, basePrice: 60000 },
        ],
      },
      {
        name: "OnePlus 12R",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 30000 },
          { specs: { ram: "16 GB", storage: "256 GB" }, basePrice: 36000 },
        ],
      },
      {
        name: "OnePlus Nord 4",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 24000 },
          { specs: { ram: "8 GB",  storage: "256 GB" }, basePrice: 28000 },
        ],
      },
    ],
  },
  {
    brand: "Google", category: "mobile",
    models: [
      {
        name: "Pixel 9 Pro XL",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "128 GB" }, basePrice: 82000 },
          { specs: { ram: "16 GB", storage: "256 GB" }, basePrice: 92000 },
          { specs: { ram: "16 GB", storage: "512 GB" }, basePrice: 108000 },
        ],
      },
      {
        name: "Pixel 9 Pro",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "128 GB" }, basePrice: 68000 },
          { specs: { ram: "16 GB", storage: "256 GB" }, basePrice: 78000 },
        ],
      },
      {
        name: "Pixel 9",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "128 GB" }, basePrice: 52000 },
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 62000 },
        ],
      },
      {
        name: "Pixel 8a",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "128 GB" }, basePrice: 38000 },
          { specs: { ram: "8 GB", storage: "256 GB" }, basePrice: 44000 },
        ],
      },
    ],
  },
  {
    brand: "Xiaomi", category: "mobile",
    models: [
      {
        name: "Xiaomi 14 Ultra",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 62000 },
          { specs: { ram: "16 GB", storage: "512 GB" }, basePrice: 75000 },
        ],
      },
      {
        name: "Xiaomi 14",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 48000 },
          { specs: { ram: "12 GB", storage: "512 GB" }, basePrice: 56000 },
        ],
      },
      {
        name: "Redmi Note 13 Pro+",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 22000 },
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 28000 },
        ],
      },
      {
        name: "Redmi Note 13 Pro",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 18000 },
          { specs: { ram: "8 GB",  storage: "256 GB" }, basePrice: 22000 },
        ],
      },
    ],
  },
  {
    brand: "Vivo", category: "mobile",
    models: [
      {
        name: "Vivo X100 Pro",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 58000 },
          { specs: { ram: "16 GB", storage: "512 GB" }, basePrice: 68000 },
        ],
      },
      {
        name: "Vivo V30 Pro",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 26000 },
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 32000 },
        ],
      },
    ],
  },
  {
    brand: "OPPO", category: "mobile",
    models: [
      {
        name: "OPPO Find X8 Pro",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 60000 },
          { specs: { ram: "16 GB", storage: "512 GB" }, basePrice: 72000 },
        ],
      },
      {
        name: "OPPO Reno 12 Pro",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 30000 },
          { specs: { ram: "12 GB", storage: "512 GB" }, basePrice: 36000 },
        ],
      },
    ],
  },
  {
    brand: "Nothing", category: "mobile",
    models: [
      {
        name: "Nothing Phone (2a) Plus",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 24000 },
        ],
      },
      {
        name: "Nothing Phone (2)",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB" }, basePrice: 28000 },
          { specs: { ram: "12 GB", storage: "256 GB" }, basePrice: 34000 },
        ],
      },
    ],
  },

  // ── LAPTOP ───────────────────────────────────────────────────────
  {
    brand: "Apple", category: "laptop",
    models: [
      {
        name: "MacBook Air M3",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "256 GB", processor: "Apple M3" }, basePrice: 90000 },
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Apple M3" }, basePrice: 110000 },
          { specs: { ram: "24 GB", storage: "1 TB",   processor: "Apple M3" }, basePrice: 135000 },
        ],
      },
      {
        name: "MacBook Air M2",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "256 GB", processor: "Apple M2" }, basePrice: 75000 },
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Apple M2" }, basePrice: 95000 },
        ],
      },
      {
        name: "MacBook Pro M4 Pro",
        image: null,
        variants: [
          { specs: { ram: "24 GB", storage: "512 GB", processor: "Apple M4 Pro"  }, basePrice: 180000 },
          { specs: { ram: "48 GB", storage: "1 TB",   processor: "Apple M4 Pro"  }, basePrice: 220000 },
        ],
      },
      {
        name: "MacBook Pro M3 Pro",
        image: null,
        variants: [
          { specs: { ram: "18 GB", storage: "512 GB", processor: "Apple M3 Pro" }, basePrice: 160000 },
          { specs: { ram: "36 GB", storage: "1 TB",   processor: "Apple M3 Max" }, basePrice: 220000 },
        ],
      },
    ],
  },
  {
    brand: "Dell", category: "laptop",
    models: [
      {
        name: "XPS 15",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel i7 13th Gen" }, basePrice: 85000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel i9 13th Gen" }, basePrice: 120000 },
        ],
      },
      {
        name: "XPS 13",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel i7 13th Gen" }, basePrice: 70000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel i7 13th Gen" }, basePrice: 90000 },
        ],
      },
      {
        name: "Inspiron 15",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "512 GB", processor: "Intel i5 12th Gen" }, basePrice: 42000 },
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel i7 12th Gen" }, basePrice: 58000 },
        ],
      },
      {
        name: "Latitude 5540",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel i5 13th Gen" }, basePrice: 55000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel i7 13th Gen" }, basePrice: 75000 },
        ],
      },
    ],
  },
  {
    brand: "HP", category: "laptop",
    models: [
      {
        name: "HP Spectre x360 14",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel Core Ultra 7" }, basePrice: 90000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel Core Ultra 7" }, basePrice: 115000 },
        ],
      },
      {
        name: "HP Envy 15",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel i7 13th Gen" }, basePrice: 65000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel i9 13th Gen" }, basePrice: 85000 },
        ],
      },
      {
        name: "HP Pavilion 15",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "512 GB", processor: "Intel i5 12th Gen" }, basePrice: 38000 },
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel i7 12th Gen" }, basePrice: 52000 },
        ],
      },
    ],
  },
  {
    brand: "Lenovo", category: "laptop",
    models: [
      {
        name: "ThinkPad X1 Carbon",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel Core Ultra 7" }, basePrice: 95000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel Core Ultra 7" }, basePrice: 125000 },
        ],
      },
      {
        name: "Legion Pro 7",
        image: null,
        variants: [
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "AMD Ryzen 9 7945HX" }, basePrice: 130000 },
          { specs: { ram: "64 GB", storage: "2 TB",   processor: "AMD Ryzen 9 7945HX" }, basePrice: 165000 },
        ],
      },
      {
        name: "IdeaPad Slim 5",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "512 GB", processor: "AMD Ryzen 5 7530U" }, basePrice: 40000 },
          { specs: { ram: "16 GB", storage: "512 GB", processor: "AMD Ryzen 7 7730U" }, basePrice: 52000 },
        ],
      },
    ],
  },
  {
    brand: "ASUS", category: "laptop",
    models: [
      {
        name: "ROG Zephyrus G16",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel Core Ultra 9" }, basePrice: 130000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel Core Ultra 9" }, basePrice: 165000 },
        ],
      },
      {
        name: "ZenBook 14 OLED",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "512 GB", processor: "Intel Core Ultra 5" }, basePrice: 62000 },
          { specs: { ram: "32 GB", storage: "1 TB",   processor: "Intel Core Ultra 7" }, basePrice: 80000 },
        ],
      },
      {
        name: "VivoBook 16",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "512 GB", processor: "AMD Ryzen 5 5600H" }, basePrice: 38000 },
          { specs: { ram: "16 GB", storage: "512 GB", processor: "AMD Ryzen 7 5800H" }, basePrice: 50000 },
        ],
      },
    ],
  },
  {
    brand: "Microsoft", category: "laptop",
    models: [
      {
        name: "Surface Laptop 6",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "256 GB", processor: "Intel Core Ultra 5" }, basePrice: 85000 },
          { specs: { ram: "32 GB", storage: "512 GB", processor: "Intel Core Ultra 7" }, basePrice: 120000 },
        ],
      },
      {
        name: "Surface Pro 11",
        image: null,
        variants: [
          { specs: { ram: "16 GB", storage: "256 GB", processor: "Snapdragon X Elite" }, basePrice: 90000 },
          { specs: { ram: "32 GB", storage: "512 GB", processor: "Snapdragon X Elite" }, basePrice: 125000 },
        ],
      },
    ],
  },

  // ── TABLET ───────────────────────────────────────────────────────
  {
    brand: "Apple", category: "tablet",
    models: [
      {
        name: "iPad Pro 13\" M4",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "256 GB", cellularSupport: "Wi-Fi Only"      }, basePrice: 110000 },
          { specs: { ram: "8 GB",  storage: "512 GB", cellularSupport: "Wi-Fi + Cellular"}, basePrice: 135000 },
          { specs: { ram: "16 GB", storage: "1 TB",   cellularSupport: "Wi-Fi + Cellular"}, basePrice: 175000 },
        ],
      },
      {
        name: "iPad Pro 11\" M4",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "256 GB", cellularSupport: "Wi-Fi Only"      }, basePrice: 85000 },
          { specs: { ram: "8 GB",  storage: "512 GB", cellularSupport: "Wi-Fi + Cellular"}, basePrice: 105000 },
        ],
      },
      {
        name: "iPad Air M2",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "128 GB", cellularSupport: "Wi-Fi Only"       }, basePrice: 60000 },
          { specs: { ram: "8 GB", storage: "256 GB", cellularSupport: "Wi-Fi Only"       }, basePrice: 70000 },
          { specs: { ram: "8 GB", storage: "128 GB", cellularSupport: "Wi-Fi + Cellular" }, basePrice: 76000 },
        ],
      },
      {
        name: "iPad Air M1",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "64 GB",  cellularSupport: "Wi-Fi Only" }, basePrice: 52000 },
          { specs: { ram: "8 GB", storage: "256 GB", cellularSupport: "Wi-Fi Only" }, basePrice: 65000 },
        ],
      },
      {
        name: "iPad 10th Gen",
        image: null,
        variants: [
          { specs: { ram: "4 GB", storage: "64 GB",  cellularSupport: "Wi-Fi Only" }, basePrice: 32000 },
          { specs: { ram: "4 GB", storage: "256 GB", cellularSupport: "Wi-Fi Only" }, basePrice: 40000 },
        ],
      },
      {
        name: "iPad mini 7",
        image: null,
        variants: [
          { specs: { ram: "8 GB", storage: "128 GB", cellularSupport: "Wi-Fi Only"       }, basePrice: 40000 },
          { specs: { ram: "8 GB", storage: "256 GB", cellularSupport: "Wi-Fi + Cellular" }, basePrice: 54000 },
        ],
      },
    ],
  },
  {
    brand: "Samsung", category: "tablet",
    models: [
      {
        name: "Galaxy Tab S10 Ultra",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB", cellularSupport: "Wi-Fi Only"      }, basePrice: 90000 },
          { specs: { ram: "16 GB", storage: "512 GB", cellularSupport: "Wi-Fi + Cellular"}, basePrice: 115000 },
        ],
      },
      {
        name: "Galaxy Tab S10+",
        image: null,
        variants: [
          { specs: { ram: "12 GB", storage: "256 GB", cellularSupport: "Wi-Fi Only"      }, basePrice: 72000 },
          { specs: { ram: "12 GB", storage: "512 GB", cellularSupport: "Wi-Fi + Cellular"}, basePrice: 90000 },
        ],
      },
      {
        name: "Galaxy Tab S9",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "128 GB", cellularSupport: "Wi-Fi Only"      }, basePrice: 48000 },
          { specs: { ram: "12 GB", storage: "256 GB", cellularSupport: "Wi-Fi + Cellular"}, basePrice: 62000 },
        ],
      },
      {
        name: "Galaxy Tab A9+",
        image: null,
        variants: [
          { specs: { ram: "4 GB", storage: "64 GB",  cellularSupport: "Wi-Fi Only"       }, basePrice: 18000 },
          { specs: { ram: "8 GB", storage: "128 GB", cellularSupport: "Wi-Fi + Cellular" }, basePrice: 25000 },
        ],
      },
    ],
  },
  {
    brand: "Lenovo", category: "tablet",
    models: [
      {
        name: "Lenovo Tab P12 Pro",
        image: null,
        variants: [
          { specs: { ram: "8 GB",  storage: "256 GB", cellularSupport: "Wi-Fi Only" }, basePrice: 40000 },
          { specs: { ram: "12 GB", storage: "256 GB", cellularSupport: "Wi-Fi Only" }, basePrice: 50000 },
        ],
      },
      {
        name: "Lenovo Tab M11",
        image: null,
        variants: [
          { specs: { ram: "4 GB", storage: "128 GB", cellularSupport: "Wi-Fi Only"  }, basePrice: 14000 },
          { specs: { ram: "4 GB", storage: "128 GB", cellularSupport: "Wi-Fi + LTE" }, basePrice: 18000 },
        ],
      },
    ],
  },

  // ── SMARTWATCH ────────────────────────────────────────────────────
  {
    brand: "Apple", category: "smartwatch",
    models: [
      {
        name: "Apple Watch Series 10",
        image: null,
        variants: [
          { specs: { caseSize: "42", connectivity: "GPS"            }, basePrice: 42000 },
          { specs: { caseSize: "46", connectivity: "GPS"            }, basePrice: 46000 },
          { specs: { caseSize: "42", connectivity: "GPS + Cellular" }, basePrice: 52000 },
          { specs: { caseSize: "46", connectivity: "GPS + Cellular" }, basePrice: 56000 },
        ],
      },
      {
        name: "Apple Watch Series 9",
        image: null,
        variants: [
          { specs: { caseSize: "41", connectivity: "GPS"            }, basePrice: 38000 },
          { specs: { caseSize: "45", connectivity: "GPS"            }, basePrice: 42000 },
          { specs: { caseSize: "41", connectivity: "GPS + Cellular" }, basePrice: 48000 },
          { specs: { caseSize: "45", connectivity: "GPS + Cellular" }, basePrice: 52000 },
        ],
      },
      {
        name: "Apple Watch Ultra 2",
        image: null,
        variants: [
          { specs: { caseSize: "49", connectivity: "GPS + Cellular" }, basePrice: 80000 },
        ],
      },
      {
        name: "Apple Watch SE (2nd Gen)",
        image: null,
        variants: [
          { specs: { caseSize: "40", connectivity: "GPS"            }, basePrice: 20000 },
          { specs: { caseSize: "44", connectivity: "GPS"            }, basePrice: 22000 },
          { specs: { caseSize: "40", connectivity: "GPS + Cellular" }, basePrice: 26000 },
        ],
      },
    ],
  },
  {
    brand: "Samsung", category: "smartwatch",
    models: [
      {
        name: "Galaxy Watch 7",
        image: null,
        variants: [
          { specs: { caseSize: "40", connectivity: "Bluetooth + Wi-Fi"       }, basePrice: 24000 },
          { specs: { caseSize: "44", connectivity: "Bluetooth + Wi-Fi"       }, basePrice: 28000 },
          { specs: { caseSize: "40", connectivity: "Bluetooth + Wi-Fi + LTE" }, basePrice: 32000 },
        ],
      },
      {
        name: "Galaxy Watch 6",
        image: null,
        variants: [
          { specs: { caseSize: "40", connectivity: "Bluetooth + Wi-Fi"       }, basePrice: 22000 },
          { specs: { caseSize: "44", connectivity: "Bluetooth + Wi-Fi"       }, basePrice: 26000 },
          { specs: { caseSize: "40", connectivity: "Bluetooth + Wi-Fi + LTE" }, basePrice: 28000 },
        ],
      },
      {
        name: "Galaxy Watch Ultra",
        image: null,
        variants: [
          { specs: { caseSize: "47", connectivity: "Bluetooth + Wi-Fi + LTE" }, basePrice: 58000 },
        ],
      },
    ],
  },
  {
    brand: "Garmin", category: "smartwatch",
    models: [
      {
        name: "Garmin Fenix 8",
        image: null,
        variants: [
          { specs: { caseSize: "47", connectivity: "GPS + Cellular" }, basePrice: 85000 },
          { specs: { caseSize: "51", connectivity: "GPS + Cellular" }, basePrice: 100000 },
        ],
      },
      {
        name: "Garmin Venu 3",
        image: null,
        variants: [
          { specs: { caseSize: "41", connectivity: "GPS" }, basePrice: 32000 },
          { specs: { caseSize: "45", connectivity: "GPS" }, basePrice: 36000 },
        ],
      },
    ],
  },
  {
    brand: "Fitbit", category: "smartwatch",
    models: [
      {
        name: "Fitbit Sense 2",
        image: null,
        variants: [
          { specs: { caseSize: "40", connectivity: "Bluetooth + Wi-Fi" }, basePrice: 18000 },
        ],
      },
    ],
  },

  // ── TELEVISION ────────────────────────────────────────────────────
  {
    brand: "Samsung", category: "television",
    models: [
      {
        name: "Samsung Neo QLED QN90D",
        image: null,
        variants: [
          { specs: { screenSize: "55", resolution: "4K UHD", displayType: "Neo QLED"  }, basePrice: 95000 },
          { specs: { screenSize: "65", resolution: "4K UHD", displayType: "Neo QLED"  }, basePrice: 130000 },
          { specs: { screenSize: "75", resolution: "4K UHD", displayType: "Neo QLED"  }, basePrice: 180000 },
        ],
      },
      {
        name: "Samsung QLED Q80C",
        image: null,
        variants: [
          { specs: { screenSize: "43", resolution: "4K UHD",  displayType: "QLED"     }, basePrice: 55000 },
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "QLED"     }, basePrice: 80000 },
          { specs: { screenSize: "65", resolution: "4K UHD",  displayType: "QLED"     }, basePrice: 110000 },
        ],
      },
      {
        name: "Samsung Crystal 4K",
        image: null,
        variants: [
          { specs: { screenSize: "32", resolution: "Full HD",  displayType: "LED"     }, basePrice: 18000 },
          { specs: { screenSize: "43", resolution: "4K UHD",   displayType: "LED"     }, basePrice: 30000 },
          { specs: { screenSize: "50", resolution: "4K UHD",   displayType: "LED"     }, basePrice: 40000 },
        ],
      },
    ],
  },
  {
    brand: "LG", category: "television",
    models: [
      {
        name: "LG OLED C4",
        image: null,
        variants: [
          { specs: { screenSize: "48", resolution: "4K UHD",  displayType: "OLED evo"}, basePrice: 95000  },
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "OLED evo"}, basePrice: 130000 },
          { specs: { screenSize: "65", resolution: "4K UHD",  displayType: "OLED evo"}, basePrice: 180000 },
          { specs: { screenSize: "77", resolution: "4K UHD",  displayType: "OLED evo"}, basePrice: 260000 },
        ],
      },
      {
        name: "LG OLED C3",
        image: null,
        variants: [
          { specs: { screenSize: "48", resolution: "4K UHD",  displayType: "OLED" }, basePrice: 90000  },
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "OLED" }, basePrice: 120000 },
          { specs: { screenSize: "65", resolution: "4K UHD",  displayType: "OLED" }, basePrice: 170000 },
        ],
      },
      {
        name: "LG QNED 85",
        image: null,
        variants: [
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "QNED" }, basePrice: 55000 },
          { specs: { screenSize: "65", resolution: "4K UHD",  displayType: "QNED" }, basePrice: 75000 },
        ],
      },
      {
        name: "LG NanoCell 75",
        image: null,
        variants: [
          { specs: { screenSize: "43", resolution: "4K UHD",  displayType: "NanoCell" }, basePrice: 35000 },
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "NanoCell" }, basePrice: 50000 },
        ],
      },
    ],
  },
  {
    brand: "Sony", category: "television",
    models: [
      {
        name: "Sony Bravia XR A95L",
        image: null,
        variants: [
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "QD-OLED" }, basePrice: 180000 },
          { specs: { screenSize: "65", resolution: "4K UHD",  displayType: "QD-OLED" }, basePrice: 240000 },
          { specs: { screenSize: "77", resolution: "4K UHD",  displayType: "QD-OLED" }, basePrice: 340000 },
        ],
      },
      {
        name: "Sony Bravia XR X90L",
        image: null,
        variants: [
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "Full Array LED" }, basePrice: 80000 },
          { specs: { screenSize: "65", resolution: "4K UHD",  displayType: "Full Array LED" }, basePrice: 110000 },
          { specs: { screenSize: "75", resolution: "4K UHD",  displayType: "Full Array LED" }, basePrice: 150000 },
        ],
      },
      {
        name: "Sony Bravia X74L",
        image: null,
        variants: [
          { specs: { screenSize: "43", resolution: "4K UHD",  displayType: "LED" }, basePrice: 40000 },
          { specs: { screenSize: "55", resolution: "4K UHD",  displayType: "LED" }, basePrice: 58000 },
        ],
      },
    ],
  },
  {
    brand: "OnePlus", category: "television",
    models: [
      {
        name: "OnePlus TV Q2 Pro",
        image: null,
        variants: [
          { specs: { screenSize: "55", resolution: "4K UHD", displayType: "QLED" }, basePrice: 50000 },
          { specs: { screenSize: "65", resolution: "4K UHD", displayType: "QLED" }, basePrice: 70000 },
        ],
      },
      {
        name: "OnePlus TV Y1S Pro",
        image: null,
        variants: [
          { specs: { screenSize: "43", resolution: "4K UHD", displayType: "LED" }, basePrice: 24000 },
          { specs: { screenSize: "55", resolution: "4K UHD", displayType: "LED" }, basePrice: 35000 },
        ],
      },
    ],
  },
  {
    brand: "TCL", category: "television",
    models: [
      {
        name: "TCL C845",
        image: null,
        variants: [
          { specs: { screenSize: "55", resolution: "4K UHD", displayType: "Mini LED QLED" }, basePrice: 55000 },
          { specs: { screenSize: "65", resolution: "4K UHD", displayType: "Mini LED QLED" }, basePrice: 75000 },
          { specs: { screenSize: "75", resolution: "4K UHD", displayType: "Mini LED QLED" }, basePrice: 105000 },
        ],
      },
      {
        name: "TCL P745",
        image: null,
        variants: [
          { specs: { screenSize: "43", resolution: "4K UHD", displayType: "QLED" }, basePrice: 22000 },
          { specs: { screenSize: "55", resolution: "4K UHD", displayType: "QLED" }, basePrice: 32000 },
        ],
      },
    ],
  },
];

////////////////////////////////////////////////////////////////////
//// EVALUATION CONFIG SEED DATA
////////////////////////////////////////////////////////////////////

const evaluationConfigSeed = [

  //////////////////////////////////////////////////////////////////
  // MOBILE
  //////////////////////////////////////////////////////////////////
  {
    category:      "mobile",
    processingFee: 200,
    questions: [
      { key: "device_turns_on",  label: "Does the device turn on and boot normally?",     order: 1, deductionOnNo: 50 },
      { key: "touch_working",    label: "Is the touchscreen responsive and working?",     order: 2, deductionOnNo: 25 },
      { key: "can_make_calls",   label: "Can the device make and receive calls?",          order: 3, deductionOnNo: 20 },
      { key: "wifi_working",     label: "Is Wi-Fi connecting and working properly?",       order: 4, deductionOnNo: 10 },
      { key: "fingerprint",      label: "Is the fingerprint / Face ID working?",           order: 5, deductionOnNo: 5  },
    ],
    defects: [
      {
        key: "screen_damage", label: "Screen / Display Damage",
        image: IMG.mobile_screen_cracked, order: 1, deduction: 0,
        children: [
          { key: "screen_cracked",     label: "Screen cracked or shattered",             image: IMG.mobile_screen_cracked,   deduction: 40 },
          { key: "dead_pixels",        label: "Dead pixels or display lines",             image: IMG.mobile_dead_pixels,      deduction: 20 },
          { key: "touch_unresponsive", label: "Touchscreen partially unresponsive",       image: IMG.mobile_touch,            deduction: 30 },
          { key: "display_lines",      label: "Horizontal or vertical lines on screen",   image: IMG.mobile_display_lines,    deduction: 20 },
          { key: "burn_in",            label: "Screen burn-in or ghost image",            image: IMG.mobile_burn_in,          deduction: 20 },
        ],
      },
      {
        key: "body_damage", label: "Body / Frame Damage",
        image: IMG.mobile_body_dents, order: 2, deduction: 0,
        children: [
          { key: "back_cracked",    label: "Back panel cracked",                image: IMG.mobile_back_cracked,   deduction: 15 },
          { key: "body_dents",      label: "Significant dents on frame",        image: IMG.mobile_body_dents,     deduction: 10 },
          { key: "body_scratches",  label: "Deep scratches on body",            image: IMG.mobile_body_scratches, deduction: 5  },
          { key: "frame_bent",      label: "Frame or chassis bent",             image: IMG.mobile_frame_bent,     deduction: 20 },
        ],
      },
      {
        key: "camera_damage", label: "Camera Issues",
        image: IMG.mobile_camera_broken, order: 3, deduction: 0,
        children: [
          { key: "camera_glass_broken",  label: "Camera lens cracked or broken",     image: IMG.mobile_camera_broken,     deduction: 15 },
          { key: "camera_not_working",   label: "Rear camera not working at all",    image: IMG.mobile_camera_notworking, deduction: 25 },
          { key: "front_camera_issue",   label: "Front camera not working",          image: IMG.mobile_front_camera,      deduction: 15 },
        ],
      },
      {
        key: "hardware_issues", label: "Hardware / Functional Issues",
        image: IMG.mobile_charging_port, order: 4, deduction: 0,
        children: [
          { key: "charging_port_damaged", label: "Charging port damaged or loose",      image: IMG.mobile_charging_port, deduction: 15 },
          { key: "speaker_issue",         label: "Speaker not working or muffled",      image: IMG.mobile_speaker,       deduction: 10 },
          { key: "microphone_issue",      label: "Microphone not working",              image: IMG.mobile_microphone,    deduction: 10 },
          { key: "battery_drains_fast",   label: "Battery drains very fast",            image: IMG.mobile_battery,       deduction: 15 },
          { key: "water_damage",          label: "Water or liquid damage",              image: IMG.mobile_water,         deduction: 45 },
          { key: "overheating",           label: "Device overheats frequently",         image: IMG.mobile_overheating,   deduction: 15 },
          { key: "wifi_issue",            label: "Wi-Fi or network issues",             image: IMG.mobile_wifi_issue,    deduction: 10 },
          { key: "fingerprint_issue",     label: "Fingerprint / Face ID not working",  image: IMG.mobile_fingerprint,   deduction: 10 },
        ],
      },
    ],
    accessories: [
      { key: "original_box",     label: "Original box included",          image: IMG.acc_box,     order: 1, addition: 2 },
      { key: "original_charger", label: "Original charger included",      image: IMG.acc_charger, order: 2, addition: 3 },
      { key: "bill_invoice",     label: "Original purchase bill/invoice", image: IMG.acc_invoice, order: 3, addition: 2 },
      { key: "earphones",        label: "Original earphones included",    image: IMG.acc_earphones,order: 4, addition: 1 },
    ],
  },

  //////////////////////////////////////////////////////////////////
  // LAPTOP
  //////////////////////////////////////////////////////////////////
  {
    category:      "laptop",
    processingFee: 500,
    questions: [
      { key: "powers_on",        label: "Does the laptop power on normally?",               order: 1, deductionOnNo: 60 },
      { key: "display_working",  label: "Is the display working without lines or patches?", order: 2, deductionOnNo: 30 },
      { key: "keyboard_working", label: "Are all keyboard keys functioning properly?",      order: 3, deductionOnNo: 15 },
      { key: "wifi_working",     label: "Is Wi-Fi connecting and working properly?",        order: 4, deductionOnNo: 10 },
      { key: "battery_charges",  label: "Does the battery charge normally?",                order: 5, deductionOnNo: 20 },
    ],
    defects: [
      {
        key: "display_damage", label: "Display Damage",
        image: IMG.laptop_screen_cracked, order: 1, deduction: 0,
        children: [
          { key: "screen_cracked",    label: "Screen cracked or broken",           image: IMG.laptop_screen_cracked, deduction: 50 },
          { key: "dead_pixels",       label: "Dead pixels or lines on screen",     image: IMG.laptop_dead_pixels,    deduction: 25 },
          { key: "display_lines",     label: "Horizontal or vertical lines",       image: IMG.laptop_display_lines,  deduction: 20 },
          { key: "backlight_issue",   label: "Backlight bleeding or dim display",  image: IMG.laptop_backlight,      deduction: 20 },
          { key: "discoloration",     label: "Screen discoloration or staining",   image: IMG.laptop_discoloration,  deduction: 15 },
        ],
      },
      {
        key: "keyboard_trackpad", label: "Keyboard / Trackpad Issues",
        image: IMG.laptop_keyboard, order: 2, deduction: 0,
        children: [
          { key: "keys_not_working",      label: "Multiple keys not registering",  image: IMG.laptop_keyboard, deduction: 20 },
          { key: "trackpad_unresponsive", label: "Trackpad not working",           image: IMG.laptop_trackpad, deduction: 15 },
        ],
      },
      {
        key: "body_damage", label: "Body / Chassis Damage",
        image: IMG.laptop_hinge, order: 3, deduction: 0,
        children: [
          { key: "hinge_broken", label: "Hinge damaged or broken",   image: IMG.laptop_hinge,       deduction: 25 },
          { key: "body_cracks",  label: "Cracks on chassis or lid",  image: IMG.laptop_body_cracks, deduction: 15 },
          { key: "body_dents",   label: "Dents on body",             image: IMG.laptop_body_dents,  deduction: 5  },
          { key: "port_damage",  label: "USB / HDMI ports damaged",  image: IMG.laptop_port_damage, deduction: 10 },
        ],
      },
      {
        key: "hardware_issues", label: "Hardware / Component Issues",
        image: IMG.laptop_battery, order: 4, deduction: 0,
        children: [
          { key: "battery_issue",    label: "Battery not charging or dead",       image: IMG.laptop_battery, deduction: 30 },
          { key: "fan_not_working",  label: "Fan not working or excessive noise", image: IMG.laptop_fan,     deduction: 15 },
          { key: "liquid_damage",    label: "Liquid damage inside",               image: IMG.laptop_liquid,  deduction: 60 },
          { key: "ram_issue",        label: "RAM failure or memory errors",       image: IMG.laptop_ram,     deduction: 25 },
          { key: "storage_issue",    label: "Storage / SSD not detected",         image: IMG.laptop_storage, deduction: 30 },
        ],
      },
    ],
    accessories: [
      { key: "original_charger", label: "Original charger/adapter",         image: IMG.acc_charger,  order: 1, addition: 5 },
      { key: "original_box",     label: "Original box included",            image: IMG.acc_box,      order: 2, addition: 2 },
      { key: "bill_invoice",     label: "Original purchase bill/invoice",   image: IMG.acc_invoice,  order: 3, addition: 2 },
      { key: "mouse",            label: "Mouse included",                   image: IMG.acc_mouse,    order: 4, addition: 1 },
      { key: "keyboard_acc",     label: "External keyboard included",       image: IMG.acc_keyboard, order: 5, addition: 1 },
    ],
  },

  //////////////////////////////////////////////////////////////////
  // TABLET
  //////////////////////////////////////////////////////////////////
  {
    category:      "tablet",
    processingFee: 300,
    questions: [
      { key: "device_turns_on",   label: "Does the tablet turn on normally?",        order: 1, deductionOnNo: 50 },
      { key: "touch_working",     label: "Is the touchscreen working perfectly?",    order: 2, deductionOnNo: 25 },
      { key: "wifi_working",      label: "Is Wi-Fi working properly?",               order: 3, deductionOnNo: 15 },
      { key: "camera_working",    label: "Is the camera working correctly?",         order: 4, deductionOnNo: 10 },
      { key: "battery_charges",   label: "Does the battery charge normally?",        order: 5, deductionOnNo: 20 },
    ],
    defects: [
      {
        key: "screen_damage", label: "Screen / Display Damage",
        image: IMG.tablet_screen_cracked, order: 1, deduction: 0,
        children: [
          { key: "screen_cracked",     label: "Screen cracked or shattered",      image: IMG.tablet_screen_cracked, deduction: 45 },
          { key: "touch_unresponsive", label: "Touchscreen unresponsive",          image: IMG.tablet_touch,          deduction: 30 },
          { key: "dead_pixels",        label: "Dead pixels on display",            image: IMG.tablet_dead_pixels,    deduction: 20 },
          { key: "display_lines",      label: "Lines or patches on screen",        image: IMG.tablet_display_lines,  deduction: 20 },
        ],
      },
      {
        key: "body_damage", label: "Body / Frame Damage",
        image: IMG.tablet_back_cracked, order: 2, deduction: 0,
        children: [
          { key: "back_cracked",     label: "Back panel cracked",       image: IMG.tablet_back_cracked,  deduction: 15 },
          { key: "body_dents",       label: "Dents on frame",           image: IMG.tablet_body_dents,    deduction: 10 },
          { key: "body_scratches",   label: "Deep scratches on body",   image: IMG.tablet_body_scratches,deduction: 5  },
        ],
      },
      {
        key: "camera_damage", label: "Camera Issues",
        image: IMG.tablet_camera, order: 3, deduction: 0,
        children: [
          { key: "camera_not_working", label: "Camera not working",          image: IMG.tablet_camera,  deduction: 20 },
          { key: "camera_lens_broken", label: "Camera lens cracked/broken",  image: IMG.tablet_camera,  deduction: 15 },
        ],
      },
      {
        key: "hardware_issues", label: "Hardware / Functional Issues",
        image: IMG.tablet_battery, order: 4, deduction: 0,
        children: [
          { key: "charging_port_issue", label: "Charging port damaged",       image: IMG.tablet_charging_port, deduction: 15 },
          { key: "battery_issue",       label: "Battery not holding charge",  image: IMG.tablet_battery,       deduction: 20 },
          { key: "speaker_issue",       label: "Speaker not working",         image: IMG.tablet_speaker,       deduction: 10 },
          { key: "water_damage",        label: "Water or liquid damage",      image: IMG.tablet_water,         deduction: 40 },
        ],
      },
    ],
    accessories: [
      { key: "original_box",     label: "Original box included",          image: IMG.acc_box,     order: 1, addition: 2 },
      { key: "original_charger", label: "Original charger/cable",         image: IMG.acc_charger, order: 2, addition: 3 },
      { key: "bill_invoice",     label: "Original purchase bill/invoice", image: IMG.acc_invoice, order: 3, addition: 2 },
      { key: "stylus",           label: "Stylus / Apple Pencil included", image: IMG.acc_stylus,  order: 4, addition: 5 },
      { key: "keyboard_acc",     label: "Keyboard cover included",        image: IMG.acc_keyboard,order: 5, addition: 3 },
    ],
  },

  //////////////////////////////////////////////////////////////////
  // SMARTWATCH
  //////////////////////////////////////////////////////////////////
  {
    category:      "smartwatch",
    processingFee: 150,
    questions: [
      { key: "device_turns_on",  label: "Does the watch turn on normally?",          order: 1, deductionOnNo: 60 },
      { key: "touch_working",    label: "Is the touchscreen responding correctly?",  order: 2, deductionOnNo: 25 },
      { key: "battery_good",     label: "Does battery last a full day?",             order: 3, deductionOnNo: 20 },
      { key: "sensors_working",  label: "Are health sensors (heart rate etc.) working?", order: 4, deductionOnNo: 15 },
    ],
    defects: [
      {
        key: "screen_damage", label: "Screen / Display Damage",
        image: IMG.watch_screen_cracked, order: 1, deduction: 0,
        children: [
          { key: "screen_cracked",     label: "Screen cracked or shattered",  image: IMG.watch_screen_cracked, deduction: 50 },
          { key: "dead_pixels",        label: "Dead pixels on display",       image: IMG.watch_dead_pixels,    deduction: 25 },
          { key: "touch_unresponsive", label: "Touch unresponsive",           image: IMG.watch_touch_issue,    deduction: 20 },
        ],
      },
      {
        key: "body_damage", label: "Body / Casing Damage",
        image: IMG.watch_body_scratches, order: 2, deduction: 0,
        children: [
          { key: "body_scratches",  label: "Deep scratches on case",          image: IMG.watch_body_scratches, deduction: 10 },
          { key: "body_dents",      label: "Dents on case",                   image: IMG.watch_body_dents,     deduction: 10 },
          { key: "crown_damaged",   label: "Digital crown/buttons damaged",   image: IMG.watch_crown,          deduction: 15 },
          { key: "strap_damaged",   label: "Strap broken or damaged",         image: IMG.watch_strap_damaged,  deduction: 5  },
        ],
      },
      {
        key: "hardware_issues", label: "Hardware / Functional Issues",
        image: IMG.watch_battery, order: 3, deduction: 0,
        children: [
          { key: "battery_issue",   label: "Battery not holding charge",  image: IMG.watch_battery,  deduction: 25 },
          { key: "charging_issue",  label: "Charging not working",        image: IMG.watch_charging, deduction: 20 },
          { key: "sensor_issue",    label: "Health sensors not working",  image: IMG.watch_sensor,   deduction: 20 },
          { key: "water_damage",    label: "Water damage",                image: IMG.watch_water,    deduction: 40 },
        ],
      },
    ],
    accessories: [
      { key: "original_box",     label: "Original box included",          image: IMG.acc_box,     order: 1, addition: 3 },
      { key: "original_charger", label: "Original charger",               image: IMG.acc_charger, order: 2, addition: 4 },
      { key: "extra_strap",      label: "Extra strap included",           image: IMG.acc_strap,   order: 3, addition: 2 },
    ],
  },

  //////////////////////////////////////////////////////////////////
  // TELEVISION
  //////////////////////////////////////////////////////////////////
  {
    category:      "television",
    processingFee: 800,
    questions: [
      { key: "powers_on",         label: "Does the TV power on and off normally?",         order: 1, deductionOnNo: 70 },
      { key: "display_uniform",   label: "Is the display uniform with no patches?",        order: 2, deductionOnNo: 40 },
      { key: "remote_working",    label: "Is the original remote control working?",        order: 3, deductionOnNo: 10 },
      { key: "hdmi_working",      label: "Are HDMI ports working properly?",               order: 4, deductionOnNo: 15 },
      { key: "smart_tv_working",  label: "Is Smart TV / internet working?",                order: 5, deductionOnNo: 10 },
    ],
    defects: [
      {
        key: "panel_damage", label: "Panel / Screen Damage",
        image: IMG.tv_panel_cracked, order: 1, deduction: 0,
        children: [
          { key: "panel_cracked",   label: "Panel cracked or physically broken",    image: IMG.tv_panel_cracked,   deduction: 80 },
          { key: "panel_lines",     label: "Horizontal or vertical lines",          image: IMG.tv_panel_lines,     deduction: 35 },
          { key: "dead_pixels",     label: "Dead pixels or dark patches",           image: IMG.tv_dead_pixels,     deduction: 25 },
          { key: "burn_in",         label: "Screen burn-in or ghost image",         image: IMG.tv_burn_in,         deduction: 40 },
          { key: "discoloration",   label: "Screen discoloration or colour shift",  image: IMG.tv_discoloration,   deduction: 20 },
        ],
      },
      {
        key: "body_damage", label: "Body / Casing Damage",
        image: IMG.tv_bezel_cracked, order: 2, deduction: 0,
        children: [
          { key: "bezel_cracked", label: "Bezel/frame cracked",          image: IMG.tv_bezel_cracked, deduction: 15 },
          { key: "stand_broken",  label: "Stand/legs broken or missing", image: IMG.tv_stand_broken,  deduction: 15 },
        ],
      },
      {
        key: "hardware_issues", label: "Hardware / Functional Issues",
        image: IMG.tv_power, order: 3, deduction: 0,
        children: [
          { key: "speaker_issue",   label: "Speaker not working or distorted",    image: IMG.tv_speaker,     deduction: 15 },
          { key: "hdmi_port_issue", label: "HDMI ports not working",              image: IMG.tv_hdmi,        deduction: 15 },
          { key: "usb_port_issue",  label: "USB ports not working",               image: IMG.tv_usb_port,    deduction: 10 },
          { key: "power_issue",     label: "Takes long to power on/restarts",     image: IMG.tv_power,       deduction: 20 },
          { key: "remote_issue",    label: "Remote control not working",          image: IMG.tv_remote_issue,deduction: 5  },
          { key: "no_signal",       label: "No signal / input detection issues",  image: IMG.tv_no_signal,   deduction: 15 },
        ],
      },
    ],
    accessories: [
      { key: "remote",         label: "Original remote control",        image: IMG.acc_remote,  order: 1, addition: 3 },
      { key: "original_stand", label: "Original stand/legs",            image: IMG.acc_stand,   order: 2, addition: 3 },
      { key: "original_box",   label: "Original packaging box",         image: IMG.acc_box,     order: 3, addition: 2 },
      { key: "bill_invoice",   label: "Original purchase bill/invoice", image: IMG.acc_invoice, order: 4, addition: 2 },
      { key: "hdmi_cable",     label: "HDMI cable included",            image: IMG.acc_cable,   order: 5, addition: 1 },
    ],
  },
];

////////////////////////////////////////////////////////////////////
//// RUN SEED
////////////////////////////////////////////////////////////////////
async function seed() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // ── Evaluation Config ──────────────────────────────────────────
    await EvaluationConfig.deleteMany({});
    console.log("🗑️  Cleared existing evaluation configs");

    const insertedConfigs = await EvaluationConfig.insertMany(evaluationConfigSeed);
    console.log(`✅ Inserted ${insertedConfigs.length} evaluation configs:\n`);

    for (const cfg of insertedConfigs) {
      const totalDefects     = cfg.defects.reduce((n, d) => n + (d.children?.length || 1), 0);
      const totalQuestions   = cfg.questions.length;
      const totalAccessories = cfg.accessories.length;
      console.log(
        `  📋 ${cfg.category.toUpperCase().padEnd(12)} | ` +
        `Questions: ${totalQuestions} | ` +
        `Defect groups: ${cfg.defects.length} (${totalDefects} sub-defects) | ` +
        `Accessories: ${totalAccessories} | ` +
        `Fee: ₹${cfg.processingFee}`
      );
    }

    // ── Device Catalog ─────────────────────────────────────────────
    console.log("\n🗑️  Clearing existing device catalog...");
    await DeviceCatalog.deleteMany({});

    console.log("📦 Inserting device catalog...");
    const insertedCatalog = await DeviceCatalog.insertMany(catalogSeed);
    console.log(`✅ Inserted ${insertedCatalog.length} catalog entries:\n`);

    for (const entry of insertedCatalog) {
      const totalVariants = entry.models.reduce(
        (n, m) => n + (m.variants?.length || 0), 0
      );
      console.log(
        `  📱 ${entry.brand.padEnd(12)} | ` +
        `Category: ${entry.category.padEnd(12)} | ` +
        `Models: ${entry.models.length} | ` +
        `Variants: ${totalVariants}`
      );
    }

    // ── Verify SVG icons ───────────────────────────────────────────
    const sampleKey = Object.keys(IMG)[0];
    console.log(`\n✅ Sample SVG (${sampleKey}): ${IMG[sampleKey].substring(0, 60)}...`);
    console.log(`✅ Total SVG icons defined: ${Object.keys(IMG).length}`);
    console.log("\n🎉 Seed completed successfully!");

  } catch (err) {
    console.error("❌ Seed error:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
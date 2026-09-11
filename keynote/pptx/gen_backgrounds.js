// Generates one 2000x1125 PNG background per slide: act gradient + decorative
// generative art (roots / network / constellation / butterfly / blob / boids),
// mirroring the visual language of the web keynote (styles.css / app.js).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const SLIDES = require('/home/user/collaboration-intelligence/keynote/data.js');

const W = 2000, H = 1125;
const OUT = path.join(__dirname, 'assets', 'bg');

const PALETTE = {
  toyota:   { a:'#14140f', b:'#1d1a12', accent:'#d99a4e', accent2:'#8a8f7e' },
  nature:   { a:'#0c1710', b:'#132015', accent:'#d9c27e', accent2:'#8fae6b' },
  yo:       { a:'#181009', b:'#241608', accent:'#f0b45f', accent2:'#c97a3a' },
  nosotros: { a:'#08151b', b:'#0c222b', accent:'#8fd0d6', accent2:'#4f8f95' },
  org:      { a:'#0d130e', b:'#141c15', accent:'#a9c48f', accent2:'#6b6f68' },
  close:    { a:'#06070a', b:'#0b0d12', accent:'#e8c27a', accent2:'#8fae6b' },
};

function mulberry32(a){
  return function(){
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function bgDefs(pal, id){
  return `<radialGradient id="grad${id}" cx="18%" cy="0%" r="115%">
    <stop offset="0%" stop-color="${pal.b}"/>
    <stop offset="60%" stop-color="${pal.a}"/>
    <stop offset="100%" stop-color="${pal.a}"/>
  </radialGradient>
  <radialGradient id="vig${id}" cx="50%" cy="42%" r="72%">
    <stop offset="45%" stop-color="#000000" stop-opacity="0"/>
    <stop offset="100%" stop-color="#000000" stop-opacity="0.55"/>
  </radialGradient>`;
}

function frame(pal, id, inner){
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>${bgDefs(pal, id)}</defs>
  <rect width="${W}" height="${H}" fill="url(#grad${id})"/>
  ${inner}
  <rect width="${W}" height="${H}" fill="url(#vig${id})"/>
</svg>`;
}

// ---------- roots ----------
function roots(pal, params){
  const rnd = mulberry32((params.seed || 1) * 7919);
  const originY = H;
  const hero = !!params.hero;
  const branches = [];
  function grow(x, y, angle, len, depth){
    if (depth > (hero ? 8 : 6) || len < 16) return;
    const x2 = x + Math.cos(angle)*len, y2 = y + Math.sin(angle)*len;
    branches.push({x1:x,y1:y,x2,y2,depth});
    const n = depth < 2 ? 2 : (rnd() > .55 ? 2 : 1);
    for (let i=0;i<n;i++){
      const spread = (rnd()*0.6 + 0.18) * (rnd()>.5?1:-1);
      grow(x2, y2, angle+spread, len*(0.72+rnd()*0.12), depth+1);
    }
  }
  const trunkCount = hero ? 5 : 3;
  const originX = hero ? W*0.5 : W*0.66;
  for (let i=0;i<trunkCount;i++){
    const baseAngle = -Math.PI/2 + (i-(trunkCount-1)/2)*0.34 + (rnd()-.5)*0.1;
    grow(originX + (i-(trunkCount-1)/2)*46, originY, baseAngle, (hero?250:200), 0);
  }
  const maxDepth = Math.max(...branches.map(b=>b.depth),1);
  let paths = branches.map(b=>{
    const t = b.depth/maxDepth;
    const w = Math.max(0.9, (hero?3.6:2.7)*(1-t*0.75));
    const op = (0.16+(1-t)*0.5).toFixed(2);
    return `<line x1="${b.x1.toFixed(1)}" y1="${b.y1.toFixed(1)}" x2="${b.x2.toFixed(1)}" y2="${b.y2.toFixed(1)}" stroke="${pal.accent}" stroke-width="${w.toFixed(2)}" stroke-linecap="round" opacity="${op}"/>`;
  }).join('\n');
  if (params.bloom){
    const tips = branches.filter(b=>b.depth>=maxDepth-1);
    paths += tips.map(b=>`<circle cx="${b.x2.toFixed(1)}" cy="${b.y2.toFixed(1)}" r="${hero?6:4}" fill="${pal.accent2}" opacity="0.85"/>`).join('\n');
  }
  return paths;
}

// ---------- network ----------
function network(pal, params){
  const rnd = mulberry32(42);
  const density = { low:16, medium:30, high:48 }[params.density||'medium'];
  const nodes = [];
  const clusterX = W*0.65;
  for (let i=0;i<density;i++){
    let x,y;
    if (params.organic){
      const a=rnd()*Math.PI*2, r=rnd()*520;
      x = clusterX + Math.cos(a)*r; y = H*0.5 + Math.sin(a)*r*0.62;
    } else {
      x = W*0.51 + rnd()*W*0.43; y = H*0.11 + rnd()*H*0.78;
    }
    nodes.push({x,y,r: params.organic ? (1.8+rnd()*2.6) : (2.4+rnd()*3.6)});
  }
  let out = '';
  const edges = [];
  for (let i=0;i<nodes.length;i++) for (let j=i+1;j<nodes.length;j++){
    const d = Math.hypot(nodes[i].x-nodes[j].x, nodes[i].y-nodes[j].y);
    const thresh = params.organic ? 220 : 300;
    if (d < thresh && rnd() > (params.organic?0.35:0.55)) edges.push([i,j,d]);
  }
  let brokenIdx = params.broken ? Math.floor(rnd()*nodes.length) : -1;
  edges.forEach(([i,j,d])=>{
    const involved = params.broken && (i===brokenIdx || j===brokenIdx);
    out += `<line x1="${nodes[i].x.toFixed(1)}" y1="${nodes[i].y.toFixed(1)}" x2="${nodes[j].x.toFixed(1)}" y2="${nodes[j].y.toFixed(1)}" stroke="${involved?'#c0553a':pal.accent2}" stroke-width="${involved?1.6:(params.organic?0.7:1.0)}" opacity="${involved?0.55:((1-d/1000)*0.5).toFixed(2)}" ${involved?'stroke-dasharray="4 6"':''}/>\n`;
  });
  nodes.forEach((n,i)=>{
    const isHi = (params.highlight==='single' && i===0) || (params.broken && i===brokenIdx);
    out += `<circle cx="${n.x.toFixed(1)}" cy="${n.y.toFixed(1)}" r="${isHi? n.r*2.4 : n.r}" fill="${isHi?'#c0553a':pal.accent}" opacity="${isHi?0.95:0.55}"/>\n`;
  });
  if (params.healing || params.healed){
    const c = nodes[brokenIdx>=0?brokenIdx:0] || {x:clusterX,y:H*0.5};
    out += `<circle cx="${c.x}" cy="${c.y}" r="60" fill="none" stroke="${pal.accent2}" stroke-width="1.4" opacity="0.5"/>`;
  }
  return out;
}

// ---------- constellation (dots + connecting lines only; labels are native pptx text) ----------
function constellation(pal){
  const items = [
    {x:1180,y:230},{x:1480,y:330},{x:1720,y:560},{x:1520,y:820},{x:1200,y:900},{x:1030,y:560}
  ].map(p=>({x:p.x*(W/1920), y:p.y*(H/1080)}));
  let out = '';
  for (let i=0;i<items.length;i++){
    const j=(i+1)%items.length;
    out += `<line x1="${items[i].x}" y1="${items[i].y}" x2="${items[j].x}" y2="${items[j].y}" stroke="${pal.accent2}" stroke-width="0.8" opacity="0.35"/>\n`;
  }
  items.forEach(p=> out += `<circle cx="${p.x}" cy="${p.y}" r="5" fill="${pal.accent}" opacity="0.9"/>\n`);
  return out;
}

// ---------- butterfly ----------
function butterfly(pal){
  const cx=W*0.665, cy=H*0.5;
  function wing(sign){
    return `M ${cx} ${cy}
      C ${cx+sign*46} ${cy-190} ${cx+sign*268} ${cy-200} ${cx+sign*292} ${cy-46}
      C ${cx+sign*304} ${cy+46} ${cx+sign*164} ${cy+46} ${cx+sign*70} ${cy+12}
      C ${cx+sign*164} ${cy+140} ${cx+sign*222} ${cy+270} ${cx+sign*105} ${cy+304}
      C ${cx+sign*24} ${cy+270} ${cx} ${cy+140} ${cx} ${cy} Z`;
  }
  const chrysalis = `<path d="M ${cx} ${cy-140} C ${cx-82} ${cy-105} ${cx-82} ${cy+105} ${cx} ${cy+152} C ${cx+82} ${cy+105} ${cx+82} ${cy-105} ${cx} ${cy-140} Z" fill="none" stroke="${pal.accent2}" stroke-width="1.5" stroke-dasharray="2 8" opacity="0.4"/>`;
  const w1 = `<path d="${wing(-1)}" fill="none" stroke="${pal.accent}" stroke-width="1.8" opacity="0.8"/>`;
  const w2 = `<path d="${wing(1)}" fill="none" stroke="${pal.accent}" stroke-width="1.8" opacity="0.8"/>`;
  const body = `<line x1="${cx}" y1="${cy-12}" x2="${cx}" y2="${cy+104}" stroke="${pal.accent}" stroke-width="2.4"/>`;
  return chrysalis+w1+w2+body;
}

// ---------- blob (immune) ----------
function blob(pal){
  const shapes = [
    {cx:W*0.56, cy:H*0.30, r:210, op:0.5},
    {cx:W*0.73, cy:H*0.55, r:160, op:0.35},
    {cx:W*0.50, cy:H*0.66, r:125, op:0.28},
  ];
  return shapes.map(s=>`<circle cx="${s.cx}" cy="${s.cy}" r="${s.r}" fill="${pal.accent}" opacity="${s.op}" style="filter:blur(2px)"/>`).join('\n');
}

// ---------- boids (frozen scatter, school / ants) ----------
function boids(pal, params){
  const rnd = mulberry32(params.mode==='ants'?911:311);
  const count = params.mode==='ants'?70:90;
  const pts = [];
  const cx = W*0.6, cy = H*0.52;
  for (let i=0;i<count;i++){
    const cluster = Math.floor(rnd()*3);
    const ang = rnd()*Math.PI*2;
    const spread = params.mode==='ants' ? 60+rnd()*380 : 40+rnd()*470;
    const ox = [0,-260,260][cluster], oy=[0,140,-120][cluster];
    pts.push({ x: cx+ox+Math.cos(ang)*spread*rnd(), y: cy+oy+Math.sin(ang)*spread*0.7*rnd() });
  }
  let out = '';
  for (let i=0;i<pts.length;i++) for (let j=i+1;j<pts.length;j++){
    const d = Math.hypot(pts[i].x-pts[j].x, pts[i].y-pts[j].y);
    if (d < 60){ out += `<line x1="${pts[i].x.toFixed(1)}" y1="${pts[i].y.toFixed(1)}" x2="${pts[j].x.toFixed(1)}" y2="${pts[j].y.toFixed(1)}" stroke="${pal.accent}" stroke-width="0.6" opacity="0.12"/>\n`; }
  }
  pts.forEach(p=> out += `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="${params.mode==='ants'?2.6:3.6}" fill="${pal.accent}" opacity="0.85"/>\n`);
  return out;
}

function buildInner(slide, pal){
  const v = slide.visual || {};
  switch (v.type){
    case 'roots': return roots(pal, v);
    case 'network': return network(pal, v);
    case 'constellation': return constellation(pal);
    case 'butterfly': return butterfly(pal);
    case 'blob': return blob(pal);
    case 'boids': return boids(pal, v);
    default: return ''; // flow / radial / model / contrast / word -> gradient only, native pptx shapes on top
  }
}

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive:true });

(async () => {
  for (const slide of SLIDES){
    const pal = PALETTE[slide.act] || PALETTE.nature;
    const inner = buildInner(slide, pal);
    const svg = frame(pal, slide.id, inner);
    const outPath = path.join(OUT, `slide${String(slide.id).padStart(2,'0')}.png`);
    await sharp(Buffer.from(svg)).png().toFile(outPath);
    process.stdout.write(`.`);
  }
  console.log('\nDone:', SLIDES.length, 'backgrounds ->', OUT);
})();

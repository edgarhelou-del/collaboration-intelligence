/* ============================================================
   BIOADAPTABILIDAD — App engine
   Render, navigation, visuals (SVG/canvas), notes, presenter sync.
   ============================================================ */

(function(){
  'use strict';

  const REDUCE_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Slides whose diagram owns the full layout (no generic text-layer).
  const DIAGRAM_SLIDES = new Set([15, 28, 31, 34, 36, 38]);

  const stageEl   = document.getElementById('stage');
  const counterEl = document.getElementById('counter');
  const actLabelEl= document.getElementById('act-label');
  const progressFill = document.getElementById('progress-fill');
  const notesOverlay = document.getElementById('notes-overlay');
  const splash = document.getElementById('splash');

  const ACT_NAMES = {
    toyota:'Acto I — El mundo cambió', nature:'Acto II — La naturaleza ya lo sabe',
    yo:'Dimensión 1 — Yo', nosotros:'Dimensión 2 — Nosotros', org:'Dimensión 3 — Organización',
    close:'Cierre'
  };

  let current = 0;
  let slideEls = [];
  let boidControllers = {}; // idx -> {stop, start}
  let presenterWin = null;
  let startTime = null;

  /* ---------------- seeded random ---------------- */
  function mulberry32(a){
    return function(){
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs){
    const el = document.createElementNS(SVGNS, tag);
    for (const k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  function el(tag, attrs, ...kids){
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs){
      if (k === 'class') e.className = attrs[k];
      else if (k === 'text') e.textContent = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    kids.forEach(k => k && e.appendChild(k));
    return e;
  }

  /* ============================================================
     VISUAL BUILDERS
     ============================================================ */

  function buildRoots(container, params, idx){
    const svg = svgEl('svg', { class:'viz', viewBox:'0 0 1920 1080', preserveAspectRatio:'xMidYMid slice' });
    const rnd = mulberry32((params.seed || 1) * 7919);
    const originX = params.hero ? 960 : (1200 + rnd()*500);
    const originY = 1080;
    const g = svgEl('g', { opacity: params.decay ? .35 : 1 });
    svg.appendChild(g);

    const branches = [];
    function grow(x, y, angle, len, depth){
      if (depth > (params.hero ? 8 : 6) || len < 14) return;
      const x2 = x + Math.cos(angle)*len;
      const y2 = y + Math.sin(angle)*len;
      branches.push({x1:x,y1:y,x2,y2,depth});
      const nBranches = depth < 2 ? 2 : (rnd() > .55 ? 2 : 1);
      for (let i=0;i<nBranches;i++){
        const spread = (rnd()*0.6 + 0.18) * (rnd()>.5?1:-1);
        grow(x2, y2, angle + spread, len * (0.72 + rnd()*0.12), depth+1);
      }
    }
    // multiple root trunks fanning upward/outward
    const trunkCount = params.hero ? 5 : 3;
    for (let i=0;i<trunkCount;i++){
      const baseAngle = -Math.PI/2 + (i - (trunkCount-1)/2) * 0.34 + (rnd()-.5)*0.1;
      grow(originX + (i-(trunkCount-1)/2)*40, originY, baseAngle, params.hero ? 210 : 170, 0);
    }

    const maxDepth = Math.max(...branches.map(b=>b.depth), 1);
    branches.forEach((b, i) => {
      const t = b.depth / maxDepth;
      const w = Math.max(0.8, (params.hero?3.2:2.4) * (1 - t*0.75));
      const path = svgEl('path', {
        d:`M ${b.x1.toFixed(1)} ${b.y1.toFixed(1)} L ${b.x2.toFixed(1)} ${b.y2.toFixed(1)}`,
        stroke:'var(--accent)', 'stroke-width':w.toFixed(2), 'stroke-linecap':'round',
        fill:'none', opacity:(0.16 + (1-t)*0.5).toFixed(2)
      });
      if (!REDUCE_MOTION){
        const len = Math.hypot(b.x2-b.x1, b.y2-b.y1) + 2;
        path.style.strokeDasharray = len;
        path.style.strokeDashoffset = len;
        path.style.transition = `stroke-dashoffset ${(params.slow?2.6:1.4)}s ${(0.15*b.depth + (i%5)*0.02).toFixed(2)}s cubic-bezier(.22,.61,.36,1)`;
      }
      g.appendChild(path);
    });

    if (params.bloom){
      const tips = branches.filter(b=>b.depth>=maxDepth-1);
      tips.forEach((b,i)=>{
        const c = svgEl('circle', { cx:b.x2, cy:b.y2, r: params.hero?5:3.4, fill:'var(--accent-2)', opacity:0 });
        c.style.transition = `opacity 1.1s ${(1.2 + i*0.03).toFixed(2)}s ease`;
        g.appendChild(c);
        requestAnimationFrame(()=> requestAnimationFrame(()=>{ c.setAttribute('opacity', 0.85); }));
      });
    }

    container.appendChild(svg);

    return {
      onActivate(){
        if (REDUCE_MOTION) return;
        g.querySelectorAll('path').forEach(p => { p.style.strokeDashoffset = 0; });
      },
      onDeactivate(){
        if (REDUCE_MOTION) return;
        g.querySelectorAll('path').forEach(p => {
          const len = p.style.strokeDasharray;
          p.style.transition = 'none';
          p.style.strokeDashoffset = len;
          void p.offsetWidth;
          p.style.transition = `stroke-dashoffset ${(params.slow?2.6:1.4)}s cubic-bezier(.22,.61,.36,1)`;
        });
      }
    };
  }

  function buildNetwork(container, params){
    const svg = svgEl('svg', { class:'viz', viewBox:'0 0 1920 1080', preserveAspectRatio:'xMidYMid slice' });
    const rnd = mulberry32(42);
    const density = { low:16, medium:30, high:48 }[params.density || 'medium'];
    const nodes = [];
    const clusterX = params.organic ? 1250 : 1300;
    for (let i=0;i<density;i++){
      let x, y;
      if (params.organic){
        const a = rnd()*Math.PI*2, r = rnd()*430;
        x = clusterX + Math.cos(a)*r; y = 540 + Math.sin(a)*r*0.62;
      } else {
        x = 980 + rnd()*820; y = 120 + rnd()*840;
      }
      nodes.push({x,y,r: params.organic ? (1.6+rnd()*2.2) : (2+rnd()*3)});
    }
    const g = svgEl('g', {});
    svg.appendChild(g);
    // edges: connect near neighbors
    const edges = [];
    for (let i=0;i<nodes.length;i++){
      for (let j=i+1;j<nodes.length;j++){
        const d = Math.hypot(nodes[i].x-nodes[j].x, nodes[i].y-nodes[j].y);
        const thresh = params.organic ? 190 : 260;
        if (d < thresh && rnd() > (params.organic?0.35:0.55)) edges.push([i,j,d]);
      }
    }
    let brokenIdx = params.broken ? Math.floor(rnd()*nodes.length) : -1;
    edges.forEach(([i,j,d])=>{
      const involved = params.broken && (i===brokenIdx || j===brokenIdx);
      const line = svgEl('line', {
        x1:nodes[i].x, y1:nodes[i].y, x2:nodes[j].x, y2:nodes[j].y,
        stroke: involved ? '#c0553a' : 'var(--accent-2)',
        'stroke-width': involved ? 1.4 : (params.organic?0.6:0.9),
        opacity: involved ? 0.55 : (1 - d/900) * 0.5,
        'stroke-dasharray': involved ? '3 5' : 'none'
      });
      g.appendChild(line);
    });
    nodes.forEach((n,i)=>{
      const isHi = (params.highlight==='single' && i===0) || (params.broken && i===brokenIdx);
      const c = svgEl('circle', {
        cx:n.x, cy:n.y, r: isHi ? n.r*2.4 : n.r,
        fill: isHi ? '#c0553a' : 'var(--accent)',
        opacity: isHi ? 0.95 : 0.55
      });
      if (params.pulse && !REDUCE_MOTION && i%4===0){
        const an = svgEl('animate', { attributeName:'opacity', values:'0.3;0.85;0.3', dur:(2.4+rnd()*1.6)+'s', repeatCount:'indefinite' });
        c.appendChild(an);
      }
      g.appendChild(c);
    });
    if (params.healing || params.healed){
      const cx=nodes[brokenIdx>=0?brokenIdx:0]?.x||1300, cy=nodes[brokenIdx>=0?brokenIdx:0]?.y||540;
      const ring = svgEl('circle', { cx, cy, r:8, fill:'none', stroke:'var(--accent-2)', 'stroke-width':1.2, opacity:0.7 });
      if (!REDUCE_MOTION){
        ring.appendChild(svgEl('animate', { attributeName:'r', values:'8;120;8', dur:'3.4s', repeatCount:'indefinite' }));
        ring.appendChild(svgEl('animate', { attributeName:'opacity', values:'0.7;0;0.7', dur:'3.4s', repeatCount:'indefinite' }));
      }
      g.appendChild(ring);
    }
    if (params.fast && !REDUCE_MOTION){
      for (let i=0;i<10;i++){
        const y = 100 + rnd()*880;
        const ln = svgEl('line', { x1:-40, y1:y, x2:120, y2:y, stroke:'var(--accent)', 'stroke-width':1, opacity:0.35 });
        ln.appendChild(svgEl('animate', { attributeName:'x1', values:'-100;2100', dur:(1.4+rnd()*1.2)+'s', repeatCount:'indefinite', begin:(rnd()*2)+'s' }));
        ln.appendChild(svgEl('animate', { attributeName:'x2', values:'-20;2180', dur:(1.4+rnd()*1.2)+'s', repeatCount:'indefinite', begin:(rnd()*2)+'s' }));
        g.appendChild(ln);
      }
    }
    container.appendChild(svg);
  }

  function buildConstellation(container){
    const svg = svgEl('svg', { class:'viz', viewBox:'0 0 1920 1080', preserveAspectRatio:'xMidYMid slice' });
    const items = [
      {label:'Bosque', x:1180, y:230}, {label:'Micelio', x:1480, y:330},
      {label:'Cardumen', x:1720, y:560}, {label:'Hormigas', x:1520, y:820},
      {label:'Sistema inmune', x:1200, y:900}, {label:'Evolución', x:1030, y:560}
    ];
    const g = svgEl('g', {});
    for (let i=0;i<items.length;i++){
      const j=(i+1)%items.length;
      g.appendChild(svgEl('line', { x1:items[i].x,y1:items[i].y,x2:items[j].x,y2:items[j].y, stroke:'var(--accent-2)', 'stroke-width':0.7, opacity:0.35 }));
    }
    items.forEach(p=>{
      g.appendChild(svgEl('circle', { cx:p.x, cy:p.y, r:4, fill:'var(--accent)', opacity:0.9 }));
    });
    svg.appendChild(g);
    container.appendChild(svg);
    items.forEach(p=>{
      const pct = (v,total)=> (v/total*100).toFixed(1)+'%';
      const lbl = el('div', { class:'const-label' }, document.createTextNode(p.label));
      lbl.style.left = pct(p.x,1920);
      lbl.style.top = pct(p.y+18,1080);
      lbl.style.transform = 'translate(-50%,0)';
      container.appendChild(lbl);
    });
  }

  function buildButterfly(container){
    const svg = svgEl('svg', { class:'viz', viewBox:'0 0 1920 1080', preserveAspectRatio:'xMidYMid slice' });
    const cx=1280, cy=540;
    const g = svgEl('g', { opacity:.85 });
    // fading chrysalis outline (previous form)
    const chrysalis = svgEl('path', {
      d:`M ${cx} ${cy-120} C ${cx-70} ${cy-90} ${cx-70} ${cy+90} ${cx} ${cy+130} C ${cx+70} ${cy+90} ${cx+70} ${cy-90} ${cx} ${cy-120} Z`,
      fill:'none', stroke:'var(--accent-2)', 'stroke-width':1.3, 'stroke-dasharray':'2 7', opacity:0.45
    });
    g.appendChild(chrysalis);
    // single-line wing contour (left + right), minimalist
    function wing(sign){
      return svgEl('path', {
        d:`M ${cx} ${cy}
           C ${cx+sign*40} ${cy-160} ${cx+sign*230} ${cy-170} ${cx+sign*250} ${cy-40}
           C ${cx+sign*260} ${cy+40} ${cx+sign*140} ${cy+40} ${cx+sign*60} ${cy+10}
           C ${cx+sign*140} ${cy+120} ${cx+sign*190} ${cy+230} ${cx+sign*90} ${cy+260}
           C ${cx+sign*20} ${cy+230} ${cx} ${cy+120} ${cx} ${cy} Z`,
        fill:'none', stroke:'var(--accent)', 'stroke-width':1.6, opacity:0.8
      });
    }
    const wL = wing(-1), wR = wing(1);
    g.appendChild(wL); g.appendChild(wR);
    g.appendChild(svgEl('line', { x1:cx,y1:cy-10,x2:cx,y2:cy+90, stroke:'var(--accent)', 'stroke-width':2 }));
    svg.appendChild(g);
    if (!REDUCE_MOTION){
      [wL,wR].forEach((w,i)=>{
        const len = w.getTotalLength ? 900 : 900;
        w.style.strokeDasharray = len;
        w.style.strokeDashoffset = len;
        w.style.transition = `stroke-dashoffset 1.8s ${0.3+i*0.2}s cubic-bezier(.22,.61,.36,1)`;
      });
    }
    container.appendChild(svg);
    return { onActivate(){ if(!REDUCE_MOTION){ wL.style.strokeDashoffset=0; wR.style.strokeDashoffset=0; } } };
  }

  function buildBlob(container){
    const wrap = el('div', { style:'position:absolute;inset:0;overflow:hidden;' });
    const shapes = [
      { top:'18%', left:'54%', size:340, dur:'11s', op:.5 },
      { top:'48%', left:'70%', size:260, dur:'14s', op:.35 },
      { top:'58%', left:'46%', size:200, dur:'9s', op:.28 }
    ];
    shapes.forEach((s,i)=>{
      const b = el('div', { style:`
        position:absolute; top:${s.top}; left:${s.left}; width:${s.size}px; height:${s.size}px;
        background: radial-gradient(circle at 35% 35%, var(--accent), transparent 70%);
        opacity:${s.op}; filter:blur(6px);
        border-radius:60% 40% 30% 70% / 60% 30% 70% 40%;
        animation:${REDUCE_MOTION?'none':`blobmorph ${s.dur} ease-in-out infinite`};
        animation-delay:${i*0.6}s;
      ` });
      wrap.appendChild(b);
    });
    container.appendChild(wrap);
    if (!document.getElementById('blob-kf')){
      const st = document.createElement('style'); st.id='blob-kf';
      st.textContent = `@keyframes blobmorph{
        0%,100%{ border-radius:60% 40% 30% 70% / 60% 30% 70% 40%; transform:scale(1) rotate(0deg); }
        50%{ border-radius:40% 60% 70% 30% / 40% 70% 30% 60%; transform:scale(1.08) rotate(8deg); }
      }`;
      document.head.appendChild(st);
    }
  }

  function buildBoids(container, params, idx){
    const canvas = document.createElement('canvas');
    canvas.className = 'viz';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    let W=0, H=0, raf=null;
    const count = params.mode === 'ants' ? 70 : 90;
    const boids = [];

    function resize(){
      const rect = container.getBoundingClientRect();
      W = canvas.width = Math.max(1, rect.width * devicePixelRatio);
      H = canvas.height = Math.max(1, rect.height * devicePixelRatio);
    }
    function init(){
      boids.length = 0;
      for (let i=0;i<count;i++){
        boids.push({
          x: Math.random()*W, y: Math.random()*H,
          vx:(Math.random()-.5)*2, vy:(Math.random()-.5)*2,
          phase: Math.random()*Math.PI*2
        });
      }
    }
    function step(){
      const isAnt = params.mode === 'ants';
      const maxSpeed = isAnt ? 1.6 : 2.4;
      for (const b of boids){
        let ax=0, ay=0, sepx=0, sepy=0, cnt=0, cx=0, cy=0, avx=0, avy=0;
        for (const o of boids){
          if (o===b) continue;
          const dx=o.x-b.x, dy=o.y-b.y, d=Math.hypot(dx,dy)+0.001;
          if (d < 60*devicePixelRatio){
            cnt++; cx+=o.x; cy+=o.y; avx+=o.vx; avy+=o.vy;
            if (d < 22*devicePixelRatio){ sepx -= dx/d; sepy -= dy/d; }
          }
        }
        if (cnt>0){
          ax += (cx/cnt - b.x) * 0.0006;
          ay += (cy/cnt - b.y) * 0.0006;
          ax += (avx/cnt - b.vx) * 0.02;
          ay += (avy/cnt - b.vy) * 0.02;
        }
        ax += sepx*0.02; ay += sepy*0.02;
        // gentle drift toward center-ish + wander
        b.phase += 0.01;
        ax += Math.cos(b.phase)*0.01;
        ay += Math.sin(b.phase*0.7)*(isAnt?0.02:0.01);
        b.vx = (b.vx+ax)*0.985; b.vy = (b.vy+ay)*0.985;
        const sp = Math.hypot(b.vx,b.vy);
        if (sp > maxSpeed){ b.vx = b.vx/sp*maxSpeed; b.vy = b.vy/sp*maxSpeed; }
        b.x += b.vx; b.y += b.vy;
        if (b.x < -20) b.x = W+20; if (b.x > W+20) b.x = -20;
        if (b.y < -20) b.y = H+20; if (b.y > H+20) b.y = -20;
      }
    }
    function draw(){
      ctx.clearRect(0,0,W,H);
      const styles = getComputedStyle(container.closest('.stage') || stageEl);
      const accent = styles.getPropertyValue('--accent').trim() || '#8fd0d6';
      ctx.fillStyle = accent;
      ctx.globalAlpha = 0.85;
      for (const b of boids){
        ctx.beginPath();
        ctx.arc(b.x, b.y, (params.mode==='ants'?1.6:2.2)*devicePixelRatio, 0, Math.PI*2);
        ctx.fill();
      }
      ctx.globalAlpha = 0.12;
      ctx.strokeStyle = accent;
      for (let i=0;i<boids.length;i++){
        for (let j=i+1;j<boids.length;j++){
          const dx=boids[i].x-boids[j].x, dy=boids[i].y-boids[j].y;
          const d = Math.hypot(dx,dy);
          if (d < 46*devicePixelRatio){
            ctx.beginPath(); ctx.moveTo(boids[i].x,boids[i].y); ctx.lineTo(boids[j].x,boids[j].y); ctx.stroke();
          }
        }
      }
      ctx.globalAlpha = 1;
    }
    function loop(){ step(); draw(); raf = requestAnimationFrame(loop); }

    resize(); init(); draw();
    window.addEventListener('resize', resize);

    return {
      onActivate(){ if (!REDUCE_MOTION && !raf){ resize(); loop(); } },
      onDeactivate(){ if (raf){ cancelAnimationFrame(raf); raf=null; } }
    };
  }

  function buildContrastDiagram(container, slide){
    const wrap = el('div', { class:'contrast-wrap' });
    const left = el('div', { class:'contrast-half left' },
      el('h3', { text:'Máquina' }),
      el('ul', {},
        el('li', { text:'Estabilidad' }), el('li', { text:'Control' }),
        el('li', { text:'Eficiencia' }), el('li', { text:'Predictibilidad' })
      )
    );
    const right = el('div', { class:'contrast-half right' },
      el('h3', { text:'Organismo' }),
      el('ul', {},
        el('li', { text:'Percibir' }), el('li', { text:'Aprender' }),
        el('li', { text:'Experimentar' }), el('li', { text:'Conectar' }), el('li', { text:'Adaptarse' })
      )
    );
    wrap.appendChild(left);
    wrap.appendChild(el('div', { class:'contrast-divider' }));
    wrap.appendChild(right);
    container.appendChild(wrap);
    const kick = el('div', { class:'kicker', style:'position:absolute;top:6.5vh;left:9vw;' }, document.createTextNode(slide.kicker||''));
    container.appendChild(kick);
    container.appendChild(el('div', { class:'contrast-caption' }, document.createTextNode(slide.title.replace(/\n/g,' '))));
  }

  function buildContrastAmbient(container){
    const wrap = el('div', { style:`position:absolute;inset:0;
      background:linear-gradient(100deg, rgba(255,255,255,.03) 0%, transparent 40%, transparent 60%, rgba(255,255,255,.03) 100%);` });
    wrap.appendChild(el('div', { style:'position:absolute; left:50%; top:0; bottom:0; width:1px; background:var(--line);' }));
    container.appendChild(wrap);
  }

  function buildFlowDiagram(container, slide){
    const steps = slide.title.replace(/\n/g,' ').split('→').map(s=>s.trim()).filter(Boolean);
    const wrap = el('div', { class:'flow-wrap' });
    const row = el('div', { class:'flow-steps' });
    steps.forEach((s,i)=>{
      row.appendChild(el('div', { class:'flow-step' },
        el('div', { class:'flow-dot' }),
        el('div', { class:'flow-label', text:s })
      ));
      if (i < steps.length-1) row.appendChild(el('div', { class:'flow-arrow', text:'→' }));
    });
    wrap.appendChild(row);
    container.appendChild(wrap);
    container.appendChild(el('div', { class:'kicker', style:'position:absolute;top:6.5vh;left:9vw;' }, document.createTextNode(slide.kicker||'')));
    if (slide.sub) container.appendChild(el('div', { class:'contrast-caption' }, document.createTextNode(slide.sub)));
  }

  function buildRadialDiagram(container, slide){
    const raw = slide.sub || '';
    let items = raw.includes('·') ? raw.split('·') : raw.split('.');
    items = items.map(s=>s.trim()).filter(Boolean);
    const wrap = el('div', { class:'radial-wrap' });
    const center = el('div', { style:'max-width:640px;text-align:center;padding:0 20px;' },
      el('div', { class:'kicker', style:'justify-content:center;' }, document.createTextNode(slide.kicker||'')),
      el('h1', { class:'title', style:'font-size:clamp(30px,3.6vw,58px);', text: slide.title })
    );
    wrap.appendChild(center);
    const R = 40; // percent radius
    items.forEach((label,i)=>{
      const angle = (i / items.length) * Math.PI*2 - Math.PI/2;
      const x = 50 + Math.cos(angle)*R;
      const y = 50 + Math.sin(angle)*R*0.82;
      const item = el('div', { class:'radial-item' }, document.createTextNode(''));
      item.style.left = x+'%'; item.style.top = y+'%'; item.style.transform='translate(-50%,-50%)';
      const dot = el('div', { style:'width:6px;height:6px;border-radius:50%;background:var(--accent);margin:0 auto;' });
      item.appendChild(dot);
      item.appendChild(el('b', { text: label }));
      wrap.appendChild(item);
    });
    container.appendChild(wrap);
  }

  function buildModelDiagram(container, params){
    const wrap = el('div', { class:'model-wrap' });
    const svg = svgEl('svg', { class:'viz', viewBox:'0 0 1920 1080', preserveAspectRatio:'xMidYMid slice' });
    const cx = 960;
    const tiers = params.stage === 'preview'
      ? [ {y:300,name:'Yo',verbs:''}, {y:540,name:'Nosotros',verbs:''}, {y:780,name:'Organización',verbs:''} ]
      : [ {y:260,name:'Yo',verbs:'Aprender · Desaprender'},
          {y:540,name:'Nosotros',verbs:'Conectar · Colaborar'},
          {y:820,name:'Organización',verbs:'Percibir · Experimentar · Adaptarse'} ];
    for (let i=0;i<tiers.length-1;i++){
      svg.appendChild(svgEl('line', { x1:cx,y1:tiers[i].y+50,x2:cx,y2:tiers[i+1].y-50, stroke:'var(--accent-2)', 'stroke-width':1.4, opacity:0.5 }));
      const midY = (tiers[i].y+50+tiers[i+1].y-50)/2;
      svg.appendChild(svgEl('path', { d:`M ${cx-8} ${midY-8} L ${cx} ${midY+4} L ${cx+8} ${midY-8}`, fill:'none', stroke:'var(--accent)', 'stroke-width':1.6 }));
    }
    tiers.forEach((t,i)=>{
      const r = 34 + i*4;
      svg.appendChild(svgEl('circle', { cx, cy:t.y, r, fill:'none', stroke:'var(--accent)', 'stroke-width':1.4, opacity:0.7 }));
      svg.appendChild(svgEl('circle', { cx, cy:t.y, r:4, fill:'var(--accent)' }));
    });
    wrap.appendChild(svg);
    tiers.forEach(t=>{
      const pct = (t.y/1080*100).toFixed(1)+'%';
      const tierEl = el('div', { class:'model-tier' });
      tierEl.style.top = `calc(${pct} - 90px)`;
      tierEl.appendChild(el('div', { class:'m-name', text:t.name }));
      if (t.verbs) tierEl.appendChild(el('div', { class:'m-verbs', text:t.verbs }));
      wrap.appendChild(tierEl);
    });
    container.appendChild(wrap);
  }

  function buildWordAmbient(container){
    const glow = el('div', { style:`position:absolute; inset:0;
      background:radial-gradient(50% 60% at 32% 55%, rgba(255,255,255,.06), transparent 70%);` });
    container.appendChild(glow);
  }

  /* ---------------- dispatcher ---------------- */
  function buildVisual(container, slide){
    const v = slide.visual || {};
    switch (v.type){
      case 'roots': return buildRoots(container, v, slide.id);
      case 'network': buildNetwork(container, v); return null;
      case 'constellation': buildConstellation(container); return null;
      case 'butterfly': return buildButterfly(container);
      case 'blob': buildBlob(container); return null;
      case 'boids': return buildBoids(container, v, slide.id);
      case 'contrast':
        if (DIAGRAM_SLIDES.has(slide.id)) buildContrastDiagram(container, slide);
        else buildContrastAmbient(container);
        return null;
      case 'flow': buildFlowDiagram(container, slide); return null;
      case 'radial': buildRadialDiagram(container, slide); return null;
      case 'model': buildModelDiagram(container, v); return null;
      case 'word': buildWordAmbient(container); return null;
      default: return null;
    }
  }

  /* ============================================================
     SLIDE DOM ASSEMBLY
     ============================================================ */
  function buildSlide(slide){
    const s = el('div', { class:'slide', 'data-kind':slide.kind, 'data-act':slide.act, 'data-id':slide.id });
    stageEl.appendChild(s); // attach first so builders can measure/inherit computed styles
    const visualLayer = el('div', { class:'visual-layer' });
    s.appendChild(visualLayer);
    const controller = buildVisual(visualLayer, slide);

    if (!DIAGRAM_SLIDES.has(slide.id)){
      const textLayer = el('div', { class:'text-layer' });
      if (slide.kicker) textLayer.appendChild(el('div', { class:'kicker' }, document.createTextNode(slide.kicker)));
      const h1 = el('h1', { class:'title' });
      h1.textContent = slide.title;
      textLayer.appendChild(h1);
      if (slide.sub) textLayer.appendChild(el('p', { class:'sub' }, document.createTextNode(slide.sub)));
      s.appendChild(textLayer);
    }

    if (slide.kind === 'word'){
      s.appendChild(el('div', { class:'word-line' }));
    }

    return { el:s, controller };
  }

  /* ============================================================
     NAVIGATION
     ============================================================ */
  function render(){
    slideEls = SLIDES.map(buildSlide);
  }

  function goTo(i, opts){
    opts = opts || {};
    i = Math.max(0, Math.min(SLIDES.length-1, i));
    if (i === current && !opts.force) return;
    const prevIdx = current;
    if (slideEls[prevIdx] && slideEls[prevIdx].controller && slideEls[prevIdx].controller.onDeactivate){
      slideEls[prevIdx].controller.onDeactivate();
    }
    if (slideEls[prevIdx]) slideEls[prevIdx].el.classList.remove('current');
    current = i;
    slideEls[current].el.classList.add('current');
    if (slideEls[current].controller && slideEls[current].controller.onActivate){
      requestAnimationFrame(()=> slideEls[current].controller.onActivate());
    }
    updateChrome();
    syncPresenter();
    if (notesOverlay.classList.contains('open')) fillNotes();
  }
  function next(){ goTo(current+1); }
  function prev(){ goTo(current-1); }

  function updateChrome(){
    const s = SLIDES[current];
    counterEl.innerHTML = `<b>${String(current+1).padStart(2,'0')}</b> / ${String(SLIDES.length).padStart(2,'0')}`;
    actLabelEl.textContent = ACT_NAMES[s.act] || '';
    progressFill.style.width = ((current) / (SLIDES.length-1) * 100).toFixed(2) + '%';
  }

  /* ============================================================
     NOTES OVERLAY
     ============================================================ */
  function fillNotes(){
    const s = SLIDES[current];
    notesOverlay.querySelector('.notes-title').textContent = s.title.replace(/\n/g,' ');
    notesOverlay.querySelector('.notes-body').textContent = s.notes || '(Sin notas para esta slide.)';
  }
  function toggleNotes(force){
    const open = typeof force === 'boolean' ? force : !notesOverlay.classList.contains('open');
    if (open) fillNotes();
    notesOverlay.classList.toggle('open', open);
  }

  /* ============================================================
     PRESENTER WINDOW SYNC
     ============================================================ */
  function openPresenter(){
    if (presenterWin && !presenterWin.closed){ presenterWin.focus(); return; }
    presenterWin = window.open('presenter.html', 'bioadapt-presenter', 'width=1180,height=700');
  }
  function syncPresenter(){
    if (!presenterWin || presenterWin.closed) return;
    const s = SLIDES[current];
    const n = SLIDES[current+1];
    presenterWin.postMessage({
      type:'state',
      index: current, total: SLIDES.length,
      startTime,
      current: { kicker:s.kicker||'', title:s.title, sub:s.sub||'', notes:s.notes||'' },
      next: n ? { kicker:n.kicker||'', title:n.title } : null
    }, '*');
  }
  window.addEventListener('message', (e)=>{
    const d = e.data || {};
    if (d.type === 'presenter-ready'){ startTime = startTime || Date.now(); syncPresenter(); }
    if (d.type === 'nav-next') next();
    if (d.type === 'nav-prev') prev();
  });

  /* ============================================================
     INPUT
     ============================================================ */
  function inFullscreen(){ return !!document.fullscreenElement; }

  document.addEventListener('keydown', (e)=>{
    if (['ArrowRight','PageDown',' '].includes(e.key)){ e.preventDefault(); next(); }
    else if (['ArrowLeft','PageUp'].includes(e.key)){ e.preventDefault(); prev(); }
    else if (e.key === 'Home'){ goTo(0); }
    else if (e.key === 'End'){ goTo(SLIDES.length-1); }
    else if (e.key.toLowerCase() === 'n'){ toggleNotes(); }
    else if (e.key.toLowerCase() === 'p'){ openPresenter(); }
    else if (e.key.toLowerCase() === 'f'){ toggleFullscreen(); }
    else if (e.key === 'Escape'){
      if (notesOverlay.classList.contains('open')) toggleNotes(false);
      else if (inFullscreen()) document.exitFullscreen();
    }
  });

  function toggleFullscreen(){
    if (!inFullscreen()) document.getElementById('viewport').requestFullscreen().catch(()=>{});
    else document.exitFullscreen();
  }

  function setupNav(){
    document.getElementById('nav-left').addEventListener('click', prev);
    document.getElementById('nav-right').addEventListener('click', next);
    document.getElementById('btn-prev').addEventListener('click', prev);
    document.getElementById('btn-next').addEventListener('click', next);

    let touchX = null;
    const vp = document.getElementById('viewport');
    vp.addEventListener('touchstart', e=> touchX = e.touches[0].clientX, {passive:true});
    vp.addEventListener('touchend', e=>{
      if (touchX === null) return;
      const dx = e.changedTouches[0].clientX - touchX;
      if (Math.abs(dx) > 60) dx < 0 ? next() : prev();
      touchX = null;
    }, {passive:true});
  }

  function setupSplash(){
    document.getElementById('btn-start').addEventListener('click', ()=>{
      splash.classList.add('hidden');
      startTime = Date.now();
      document.getElementById('viewport').requestFullscreen?.().catch(()=>{});
    });
  }

  /* ---------------- init ---------------- */
  render();
  goTo(0, { force:true });
  setupNav();
  setupSplash();

})();

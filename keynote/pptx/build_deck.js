const path = require('path');
const pptxgen = require('pptxgenjs');
const SLIDES = require('/home/user/collaboration-intelligence/keynote/data.js');

const BG = path.join(__dirname, 'assets', 'bg');
const OUT_FILE = path.join(__dirname, 'Bioadaptabilidad_CENIT.pptx');

const INK = 'F4F1E8';
const INK_DIM = 'CFCBBF';
const INK_FAINT = '8E8B80';
const TITLE_FONT = 'Cambria';
const BODY_FONT = 'Calibri';

const PALETTE = {
  toyota:   { accent:'D99A4E', accent2:'8A8F7E' },
  nature:   { accent:'D9C27E', accent2:'8FAE6B' },
  yo:       { accent:'F0B45F', accent2:'C97A3A' },
  nosotros: { accent:'8FD0D6', accent2:'4F8F95' },
  org:      { accent:'A9C48F', accent2:'6B6F68' },
  close:    { accent:'E8C27A', accent2:'8FAE6B' },
};
const ACT_NAMES = {
  toyota:'ACTO I  ·  EL MUNDO CAMBIÓ', nature:'ACTO II  ·  LA NATURALEZA YA LO SABE',
  yo:'DIMENSIÓN 1  ·  YO', nosotros:'DIMENSIÓN 2  ·  NOSOTROS', org:'DIMENSIÓN 3  ·  ORGANIZACIÓN',
  close:'CIERRE'
};

const DIAGRAM_SLIDES = new Set([15, 28, 31, 34, 36, 38]);

const SLIDE_W = 13.333, SLIDE_H = 7.5;
const MARGIN_X = 0.95;
const AVAIL_W = SLIDE_W - MARGIN_X*2; // 11.43

function titleSizeFor(kind){
  if (kind === 'cover' || kind === 'final') return 54;
  if (['question','statement','turn','emotional'].includes(kind)) return 40;
  return 36;
}
function fitTitleSize(title, baseSize, factor=0.62, availW=AVAIL_W){
  const lines = title.split('\n');
  const maxLen = Math.max(...lines.map(l=>l.length));
  const fitSize = (availW*72) / (maxLen*factor);
  return { size: Math.max(20, Math.min(baseSize, fitSize)), lines };
}
function fitWordSize(word, maxCap, factor=0.8, availIn=10.2){
  const fit = (availIn*72) / (word.length*factor);
  return Math.max(56, Math.min(maxCap, fit));
}
function titleRuns(lines, size, opts){
  return lines.map((l,i)=>({ text: l, options: Object.assign({}, opts, { fontSize:size, breakLine: i < lines.length-1 }) }));
}

const pres = new pptxgen();
pres.defineLayout({ name:'BIOADAPT', width: SLIDE_W, height: SLIDE_H });
pres.layout = 'BIOADAPT';
pres.author = 'CENIT';
pres.title = 'Bioadaptabilidad en el mundo corporativo';

function addChrome(slide, s){
  const pal = PALETTE[s.act];
  slide.addText(ACT_NAMES[s.act] || '', {
    x:MARGIN_X, y:0.42, w:7.5, h:0.3, fontFace:BODY_FONT, fontSize:10.5, color:INK_FAINT,
    charSpacing:1.5, bold:true, isTextBox:true, margin:0
  });
  slide.addText(`${String(s.id).padStart(2,'0')} / 40`, {
    x:SLIDE_W-2.4, y:0.42, w:1.45, h:0.3, fontFace:BODY_FONT, fontSize:10.5, color:INK_FAINT,
    align:'right', isTextBox:true, margin:0
  });
}

function addKicker(slide, text, pal, x, y, w, opts){
  if (!text) return;
  slide.addText(text.toUpperCase(), Object.assign({
    x, y, w, h:0.4, fontFace:BODY_FONT, fontSize:13, bold:true, color:pal.accent,
    charSpacing:1.8, isTextBox:true, margin:0
  }, opts||{}));
}

function defaultBlock(slide, s, pal){
  const hasKicker = !!s.kicker;
  const baseSize = titleSizeFor(s.kind);
  const { size, lines } = fitTitleSize(s.title, baseSize);
  const lineH = size*1.32/72;
  let y = 2.05;
  if (hasKicker){ addKicker(slide, s.kicker, pal, MARGIN_X, y, 8.6); y += 0.55; }
  const italic = ['cover','final','divider'].includes(s.kind);
  slide.addText(titleRuns(lines, size, { fontFace:TITLE_FONT, color:INK, italic, bold:!italic, wrap:false }), {
    x:MARGIN_X, y, w: AVAIL_W, h: lines.length*lineH + 0.3, fontFace:TITLE_FONT, isTextBox:true, margin:0, valign:'top', wrap:false
  });
  y += lines.length*lineH + 0.4;
  if (s.sub){
    slide.addText(s.sub, {
      x:MARGIN_X, y, w:8.4, h:1.3, fontFace:BODY_FONT, fontSize:19, color:INK_DIM, isTextBox:true, margin:0, valign:'top', lineSpacingMultiple:1.3
    });
  }
}

function wordBlock(slide, s, pal){
  const size = fitWordSize(s.title, 150);
  slide.addText(s.title, {
    x:MARGIN_X, y:2.4, w:AVAIL_W, h:2.9, fontFace:TITLE_FONT, italic:true, fontSize:size, color:INK,
    isTextBox:true, margin:0, valign:'top', wrap:false
  });
  slide.addShape('line', { x:MARGIN_X, y:5.75, w:0.65, h:0, line:{ color:pal.accent, width:2 } });
}

function dividerBlock(slide, s, pal){
  addKicker(slide, s.kicker, pal, MARGIN_X, 1.9, 6);
  const size = fitWordSize(s.title, 130);
  slide.addText(s.title, {
    x:MARGIN_X, y:2.55, w:AVAIL_W, h:2.2, fontFace:TITLE_FONT, italic:true, fontSize:size, color:INK,
    isTextBox:true, margin:0, valign:'top', wrap:false
  });
  if (s.sub){
    slide.addText(s.sub, {
      x:MARGIN_X, y:4.55, w:8, h:0.6, fontFace:TITLE_FONT, italic:true, fontSize:23, color:pal.accent,
      isTextBox:true, margin:0
    });
  }
}

function contrastDiagram(slide, s, pal){
  addKicker(slide, s.kicker, pal, MARGIN_X, 0.85, 8);
  const colW = 4.7, gap=0.5;
  const leftX = MARGIN_X, rightX = SLIDE_W - MARGIN_X - colW;
  slide.addShape('line', { x:SLIDE_W/2, y:1.7, w:0, h:4.3, line:{ color:'FFFFFF', width:0.75, transparency:82 } });
  slide.addText('Máquina', { x:leftX, y:1.75, w:colW, h:0.7, fontFace:TITLE_FONT, italic:true, fontSize:30, color:INK, isTextBox:true, margin:0 });
  ['Estabilidad','Control','Eficiencia','Predictibilidad'].forEach((t,i)=>{
    slide.addText(t, { x:leftX, y:2.65+i*0.52, w:colW, h:0.45, fontFace:BODY_FONT, fontSize:16, color:INK_DIM, isTextBox:true, margin:0 });
  });
  slide.addText('Organismo', { x:rightX, y:1.75, w:colW, h:0.7, fontFace:TITLE_FONT, italic:true, fontSize:30, color:INK, isTextBox:true, margin:0 });
  ['Percibir','Aprender','Experimentar','Conectar','Adaptarse'].forEach((t,i)=>{
    slide.addText(t, { x:rightX, y:2.65+i*0.52, w:colW, h:0.45, fontFace:BODY_FONT, fontSize:16, color:INK_DIM, isTextBox:true, margin:0 });
  });
  slide.addText(s.title.replace(/\n/g,' '), {
    x:MARGIN_X, y:6.35, w:AVAIL_W, h:0.6, align:'center', fontFace:TITLE_FONT, italic:true, fontSize:22, color:pal.accent, isTextBox:true, margin:0
  });
}

function flowDiagram(slide, s, pal){
  addKicker(slide, s.kicker, pal, MARGIN_X, 0.85, 8);
  const steps = s.title.replace(/\n/g,' ').split('→').map(x=>x.trim()).filter(Boolean);
  const n = steps.length;
  const usableW = AVAIL_W;
  const stepW = usableW/n;
  const cy = 3.7;
  steps.forEach((label, i)=>{
    const cx = MARGIN_X + stepW*i + stepW/2;
    slide.addShape('ellipse', { x:cx-0.09, y:cy-0.09, w:0.18, h:0.18, fill:{ color:pal.accent }, line:{ type:'none' } });
    slide.addText(label, { x:cx-stepW/2+0.05, y:cy+0.22, w:stepW-0.1, h:0.5, align:'center', fontFace:BODY_FONT, bold:true, fontSize:16, color:INK, isTextBox:true, margin:0 });
    if (i < n-1){
      const x2 = MARGIN_X + stepW*(i+1);
      slide.addShape('line', { x:cx+0.1, y:cy, w:stepW-0.2, h:0, line:{ color:INK_FAINT, width:1.25, endArrowType:'triangle' } });
    }
  });
  if (s.sub){
    slide.addText(s.sub, { x:MARGIN_X, y:5.7, w:AVAIL_W, h:0.6, align:'center', fontFace:TITLE_FONT, italic:true, fontSize:22, color:pal.accent, isTextBox:true, margin:0 });
  }
}

function radialDiagram(slide, s, pal){
  const raw = s.sub || '';
  let items = raw.includes('·') ? raw.split('·') : raw.split('.');
  items = items.map(x=>x.trim()).filter(Boolean);
  addKicker(slide, s.kicker, pal, 0, 0.65, SLIDE_W, { align:'center' });
  const { size, lines } = fitTitleSize(s.title, 32, 0.62, 7.2);
  const lineH = size*1.32/72;
  slide.addText(titleRuns(lines, size, { fontFace:TITLE_FONT, color:INK, bold:true, align:'center', wrap:false }), {
    x: SLIDE_W/2 - 3.6, y:1.15, w:7.2, h:lines.length*lineH+0.3, align:'center', fontFace:TITLE_FONT, isTextBox:true, margin:0, valign:'top', wrap:false
  });
  const cx = SLIDE_W/2, cyc = 4.85, rx = 4.9, ry = 1.9;
  items.forEach((label, i)=>{
    const ang = (i/items.length)*Math.PI*2 - Math.PI/2;
    const x = cx + Math.cos(ang)*rx, y = cyc + Math.sin(ang)*ry;
    slide.addShape('ellipse', { x:x-0.05, y:y-0.36, w:0.1, h:0.1, fill:{ color:pal.accent }, line:{ type:'none' } });
    slide.addText(label, { x:x-1.05, y:y-0.24, w:2.1, h:0.6, align:'center', fontFace:BODY_FONT, bold:true, fontSize:14.5, color:INK, isTextBox:true, margin:0, valign:'top' });
  });
}

function modelDiagram(slide, s, pal){
  const isFinal = (s.id === 38);
  const tiers = isFinal
    ? [ {name:'Yo', verbs:'Aprender  ·  Desaprender'},
        {name:'Nosotros', verbs:'Conectar  ·  Colaborar'},
        {name:'Organización', verbs:'Percibir  ·  Experimentar  ·  Adaptarse'} ]
    : [ {name:'Yo', verbs:''}, {name:'Nosotros', verbs:''}, {name:'Organización', verbs:''} ];
  const cx = SLIDE_W/2;
  const ys = [1.75, 3.75, 5.75];
  for (let i=0;i<ys.length-1;i++){
    slide.addShape('line', { x:cx, y:ys[i]+0.42, w:0, h: ys[i+1]-ys[i]-0.84, line:{ color:pal.accent2, width:1.25 } });
  }
  tiers.forEach((t,i)=>{
    const y = ys[i];
    slide.addShape('ellipse', { x:cx-0.42, y:y-0.42, w:0.84, h:0.84, fill:{ type:'none' }, line:{ color:pal.accent, width:1.5 } });
    slide.addShape('ellipse', { x:cx-0.05, y:y-0.05, w:0.1, h:0.1, fill:{ color:pal.accent }, line:{ type:'none' } });
    slide.addText(t.name, { x:cx-2.6, y:y-1.15, w:5.2, h:0.6, align:'center', fontFace:TITLE_FONT, italic:true, fontSize:30, color:INK, isTextBox:true, margin:0 });
    if (t.verbs){
      slide.addText(t.verbs, { x:cx-2.8, y:y+0.5, w:5.6, h:0.4, align:'center', fontFace:BODY_FONT, fontSize:14.5, color:INK_DIM, isTextBox:true, margin:0 });
    }
  });
}

SLIDES.forEach((s) => {
  const pal = PALETTE[s.act];
  const slide = pres.addSlide();
  slide.background = { path: path.join(BG, `slide${String(s.id).padStart(2,'0')}.png`) };
  addChrome(slide, s);

  if (s.kind === 'word'){
    wordBlock(slide, s, pal);
  } else if (s.kind === 'divider'){
    dividerBlock(slide, s, pal);
  } else if (DIAGRAM_SLIDES.has(s.id) && (s.visual||{}).type === 'contrast'){
    contrastDiagram(slide, s, pal);
  } else if (DIAGRAM_SLIDES.has(s.id) && (s.visual||{}).type === 'flow'){
    flowDiagram(slide, s, pal);
  } else if (DIAGRAM_SLIDES.has(s.id) && (s.visual||{}).type === 'radial'){
    radialDiagram(slide, s, pal);
  } else if (DIAGRAM_SLIDES.has(s.id) && (s.visual||{}).type === 'model'){
    modelDiagram(slide, s, pal);
  } else {
    defaultBlock(slide, s, pal);
  }

  slide.addNotes(s.notes || '');
});

pres.writeFile({ fileName: OUT_FILE }).then(()=>{
  console.log('Written:', OUT_FILE);
}).catch(err=>{
  console.error(err);
  process.exit(1);
});

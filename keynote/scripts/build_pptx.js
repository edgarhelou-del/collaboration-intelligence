const pptxgen = require("pptxgenjs");
const path = require("path");
const { ACTS, SLIDES } = require("./slides_data.js");

const BGDIR = "/home/user/collaboration-intelligence/keynote/assets/images/bg";
const OUT = "/home/user/collaboration-intelligence/keynote/deliverables/Bioadaptability_Collective_Intelligence_AI_Keynote.pptx";

const GOLD = "C49B4A";
const GOLD_LIGHT = "E0C478";
const OFFWHITE = "F4F0E6";
const SAGE = "9FB5A0";
const NEARBLACK = "0A120F";

const FONT_SERIF = "Cambria";
const FONT_SANS = "Calibri";

const SLIDE_W = 13.333, SLIDE_H = 7.5;

function scrim(slide, x, y, w, h, alpha = 42) {
  slide.addShape("roundRect", {
    x, y, w, h,
    rectRadius: 0.14,
    fill: { color: "000000", transparency: 100 - alpha },
    line: { type: "none" },
  });
}

function kicker(slide, actNum, slideNum) {
  slide.addText(ACTS[actNum], {
    x: 0.55, y: 0.32, w: 8, h: 0.4,
    fontFace: FONT_SANS, fontSize: 11, bold: true, color: GOLD,
    charSpacing: 2, align: "left", isTextBox: true, margin: 0,
  });
  slide.addText(String(slideNum).padStart(2, "0") + " / 35", {
    x: SLIDE_W - 1.5, y: SLIDE_H - 0.55, w: 1.0, h: 0.35,
    fontFace: FONT_SANS, fontSize: 10, color: SAGE, align: "right",
    isTextBox: true, margin: 0,
  });
}

function fitSize(text, base, min, step1 = 34, step2 = 70, step3 = 120, step4 = 190) {
  const len = text.length;
  if (len <= step1) return base;
  if (len <= step2) return base - Math.round(base * 0.14);
  if (len <= step3) return base - Math.round(base * 0.26);
  if (len <= step4) return base - Math.round(base * 0.38);
  return min;
}

function addBackground(slide, file) {
  slide.addImage({ path: path.join(BGDIR, file), x: 0, y: 0, w: SLIDE_W, h: SLIDE_H });
}

function buildSlide(pres, s) {
  const slide = pres.addSlide();
  addBackground(slide, s.bg);

  if (s.kind !== "title" && s.kind !== "close") {
    kicker(slide, s.act, s.n);
  }

  if (s.kind === "title") {
    slide.addText(s.title, {
      x: 0.8, y: 2.55, w: SLIDE_W - 1.6, h: 1.6,
      fontFace: FONT_SANS, fontSize: 56, bold: true, color: OFFWHITE,
      align: "center", isTextBox: true, margin: 0, charSpacing: 3,
    });
    slide.addText(s.subtitle, {
      x: 1.4, y: 4.05, w: SLIDE_W - 2.8, h: 0.7,
      fontFace: FONT_SERIF, fontSize: 20, italic: true, color: GOLD_LIGHT,
      align: "center", isTextBox: true, margin: 0,
    });

  } else if (s.kind === "statement" || s.kind === "statement_small") {
    const base = s.kind === "statement" ? 42 : 32;
    const fs = fitSize(s.text.replace(/\n/g, " "), base, 26);
    const boxY = 2.5, boxH = 2.6;
    scrim(slide, 1.0, boxY - 0.15, SLIDE_W - 2.0, boxH + 0.3, 40);
    slide.addText(s.text, {
      x: 1.3, y: boxY, w: SLIDE_W - 2.6, h: boxH,
      fontFace: FONT_SERIF, fontSize: fs, color: OFFWHITE,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
      lineSpacingMultiple: 1.18,
    });

  } else if (s.kind === "stat") {
    scrim(slide, 1.4, 2.15, SLIDE_W - 2.8, 3.1, 42);
    slide.addText(s.big, {
      x: 1.6, y: 2.35, w: SLIDE_W - 3.2, h: 1.5,
      fontFace: FONT_SANS, fontSize: fitSize(s.big, 84, 46, 10, 16, 22), bold: true, color: GOLD,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });
    if (s.label) {
      slide.addText(s.label, {
        x: 1.8, y: 3.85, w: SLIDE_W - 3.6, h: 0.75,
        fontFace: FONT_SANS, fontSize: fitSize(s.label, 22, 16), color: OFFWHITE,
        align: "center", valign: "top", isTextBox: true, margin: 0,
      });
    }
    if (s.sub) {
      slide.addText(s.sub, {
        x: 2.0, y: 4.55, w: SLIDE_W - 4.0, h: 0.6,
        fontFace: FONT_SERIF, fontSize: 13, italic: true, color: SAGE,
        align: "center", valign: "top", isTextBox: true, margin: 0,
      });
    }

  } else if (s.kind === "paradox") {
    slide.addText(s.label, {
      x: 1.5, y: 2.05, w: SLIDE_W - 3.0, h: 0.5,
      fontFace: FONT_SANS, fontSize: 14, bold: true, color: GOLD,
      align: "center", isTextBox: true, margin: 0, charSpacing: 3,
    });
    const fs = fitSize(s.text, 33, 23);
    scrim(slide, 1.5, 2.6, SLIDE_W - 3.0, 2.7, 42);
    slide.addText(s.text, {
      x: 1.8, y: 2.7, w: SLIDE_W - 3.6, h: 2.5,
      fontFace: FONT_SERIF, fontSize: fs, italic: true, color: OFFWHITE,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
      lineSpacingMultiple: 1.2,
    });

  } else if (s.kind === "question") {
    scrim(slide, 1.0, 2.7, SLIDE_W - 2.0, 2.1, 40);
    slide.addText(s.text, {
      x: 1.3, y: 2.7, w: SLIDE_W - 2.6, h: 2.1,
      fontFace: FONT_SERIF, fontSize: fitSize(s.text, 40, 26), italic: true, color: OFFWHITE,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });

  } else if (s.kind === "word") {
    slide.addText(s.text, {
      x: 1.0, y: 2.9, w: SLIDE_W - 2.0, h: 1.7,
      fontFace: FONT_SANS, fontSize: 96, bold: true, color: GOLD_LIGHT,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
    });

  } else if (s.kind === "cycle") {
    slide.addText("EL CICLO", {
      x: 1.0, y: 0.95, w: SLIDE_W - 2.0, h: 0.5,
      fontFace: FONT_SANS, fontSize: 14, bold: true, color: GOLD,
      align: "center", isTextBox: true, margin: 0, charSpacing: 3,
    });
    const cx = SLIDE_W / 2, cy = 4.15, R = 2.55;
    const n = s.steps.length;
    const boxW = 2.5, boxH = 0.55;
    s.steps.forEach((step, i) => {
      const angle = -Math.PI / 2 + (2 * Math.PI * i) / n;
      const px = cx + R * Math.cos(angle);
      const py = cy + R * Math.sin(angle) * 0.82;
      slide.addShape("ellipse", {
        x: px - 0.09, y: py - 0.09, w: 0.18, h: 0.18,
        fill: { color: GOLD }, line: { type: "none" },
      });
      const labelY = py + (Math.sin(angle) >= 0 ? 0.14 : -0.14 - boxH);
      slide.addText(`${i + 1}. ${step}`, {
        x: px - boxW / 2, y: labelY, w: boxW, h: boxH,
        fontFace: FONT_SANS, fontSize: 15, bold: true, color: OFFWHITE,
        align: "center", valign: "middle", isTextBox: true, margin: 0,
      });
    });
    slide.addText("El patrón que ya vieron cinco veces esta noche, nombrado.", {
      x: 1.5, y: SLIDE_H - 0.95, w: SLIDE_W - 3.0, h: 0.5,
      fontFace: FONT_SERIF, fontSize: 14, italic: true, color: SAGE,
      align: "center", isTextBox: true, margin: 0,
    });

  } else if (s.kind === "close") {
    scrim(slide, 1.1, 1.55, SLIDE_W - 2.2, 4.6, 46);
    slide.addText(s.text, {
      x: 1.5, y: 1.8, w: SLIDE_W - 3.0, h: 1.3,
      fontFace: FONT_SANS, fontSize: 24, bold: true, color: GOLD_LIGHT,
      align: "center", valign: "middle", isTextBox: true, margin: 0,
      lineSpacingMultiple: 1.25,
    });
    slide.addText(s.quote, {
      x: 1.9, y: 3.2, w: SLIDE_W - 3.8, h: 2.85,
      fontFace: FONT_SERIF, fontSize: 19, italic: true, color: OFFWHITE,
      align: "center", valign: "top", isTextBox: true, margin: 0,
      lineSpacingMultiple: 1.32,
    });
  }

  slide.addNotes(s.notes);
}

function main() {
  const pres = new pptxgen();
  pres.defineLayout({ name: "WIDE", width: SLIDE_W, height: SLIDE_H });
  pres.layout = "WIDE";
  pres.author = "Bioadaptability Keynote";
  pres.title = "Bioadaptability — Collective Intelligence, AI and the New Bottleneck";

  SLIDES.forEach((s) => buildSlide(pres, s));

  pres.writeFile({ fileName: OUT }).then(() => {
    console.log("Saved", OUT, "slides:", SLIDES.length);
  });
}

main();

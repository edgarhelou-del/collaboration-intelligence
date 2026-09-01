# Bioadaptability / Collective Intelligence / AI — Keynote

Research-backed keynote on organizational adaptability in the age of AI: when execution
becomes abundant and cheap, the real bottleneck shifts to collective perception, judgment,
and decision-making. Built per the master research/keynote brief.

## Deliverables (`deliverables/`)

1. **`Bioadaptability_Collective_Intelligence_AI_Keynote.pptx`** — 35-slide keynote deck,
   9-act structure, one dominant custom-generated cinematic background per slide, minimal
   on-screen text, full speaker notes on every slide.
2. **`Bioadaptability_Research.xlsx`** — 63 real, web-sourced citations (author, org, source,
   URL, year, idea, evidence, quote, category, relevance score, use in keynote), including
   deliberate contradicting/complicating evidence, not just supporting evidence.
3. **`Bioadaptability_Keynote_Narrative.docx`** — thesis, full 9-act narrative, 10 anchor
   stories, 5 paradoxes, 5 questions, 5 visual ideas, 5 original phrases, conclusion, and the
   three-reviewer QC pass (systems thinker / CEO / creative director).
4. **`Bioadaptability_Image_Sources.xlsx`** — image sourcing log: candidate real Wikimedia
   Commons/NASA images found via live web search (author, license, attribution), plus a
   sourcing-brief sheet for slides that still need a final image pass, plus a licensing
   guardrail sheet.

## Important environment note

This deck's slide backgrounds are **custom-generated abstract/cinematic compositions**
(gradients, organic branching "network" line art, particle fields, tree-ring/spiral motifs —
see `scripts/gen_backgrounds.py`), not stock photography. That was a deliberate response to
an infrastructure constraint, not a design preference: outbound network access to
Wikimedia Commons, NASA image libraries, Unsplash, and even Wikipedia was blocked by this
execution environment's organizational egress policy, so real photographs could not be
downloaded or their exact license text verified by direct page fetch inside this session.

All research citations, by contrast, were gathered via live web search (which was not
blocked) and are real — but the image candidates listed in `Bioadaptability_Image_Sources.xlsx`
should be opened and license-confirmed directly before any real photograph is swapped into
the deck for a real-world presentation.

## Repo contents

- `deliverables/` — the four requested output files.
- `assets/images/bg/` — the 35 generated background images used in the PPTX.
- `scripts/` — generator scripts (Python/Node) for every deliverable, for reproducibility:
  - `gen_backgrounds.py` — cinematic abstract background generator (PIL/numpy).
  - `slides_data.js` + `build_pptx.js` — slide content and PPTX assembly (pptxgenjs).
  - `build_research_xlsx.py`, `build_images_xlsx.py` — research/image spreadsheets (openpyxl).
  - `build_narrative_docx.js` — narrative document (docx/docx-js).
- `research/` — raw research notes gathered before synthesis (thesis draft, narrative draft,
  per-domain research dumps from the three parallel research passes, full slide script with
  on-screen text / image direction / speaker notes per slide).

## Regenerating

```bash
python3 scripts/gen_backgrounds.py
python3 scripts/build_research_xlsx.py
python3 scripts/build_images_xlsx.py
node scripts/build_narrative_docx.js
node scripts/build_pptx.js
```

Requires: `openpyxl`, `Pillow`, `numpy` (pip); `docx`, `pptxgenjs` (npm).

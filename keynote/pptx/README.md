# Bioadaptabilidad_CENIT.pptx

Versión PowerPoint (.pptx) del mismo keynote que vive en `/keynote` como
presentación web. **La fuente de contenido es una sola:** `../data.js`
(las 40 slides — título, kicker, subtítulo, notas de speaker). Este archivo
`.pptx` se genera automáticamente a partir de ahí, así que si editas el
contenido en `../data.js`, vuelve a correr el build para que el PowerPoint
quede sincronizado — no edites el texto directamente en PowerPoint y luego
en `data.js` por separado, o se desincronizan.

## Qué incluye

- 40 slides, 16:9, con el mismo sistema de diseño que la versión web
  (paleta por acto, tipografía Cambria/Calibri — ambas vienen instaladas con
  Office, así que el archivo se ve igual en cualquier máquina con PowerPoint).
- **Notas de speaker completas** en cada slide (panel de notas nativo de
  PowerPoint — vista de moderador lista para usar).
- Fondos con gradiente + arte generativo (raíces, redes, constelaciones,
  mariposa, blobs, cardumen/hormigas) renderizados como imagen de fondo por
  slide — mismo motivo que la versión web, ver la nota sobre imágenes en
  `../README.md` (sección 4): no se usó fotografía externa porque el entorno
  de construcción no tenía salida de red hacia los bancos de imágenes.
- Diagramas (modelo Yo→Nosotros→Organización, flujo de 5 pasos, radial de
  aceleradores, contraste Máquina/Organismo) construidos con formas nativas
  de PowerPoint — completamente editables, no son imágenes.

## Cómo regenerarlo

```bash
cd keynote/pptx
npm install                 # pptxgenjs + sharp
node gen_backgrounds.js     # genera assets/bg/*.png (uno por slide)
node build_deck.js          # escribe Bioadaptabilidad_CENIT.pptx
```

`assets/` (las imágenes de fondo intermedias) no se versiona — se regenera
en segundos. Si vas a inspeccionar visualmente el resultado antes de
entregarlo, conviértelo a imágenes:

```bash
soffice --headless --convert-to pdf Bioadaptabilidad_CENIT.pptx
pdftoppm -jpeg -r 120 Bioadaptabilidad_CENIT.pdf slide
```

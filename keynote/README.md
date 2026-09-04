# Bioadaptabilidad en el mundo corporativo — Keynote para CENIT

Presentación navegable en pantalla completa, 40 slides, construida como una
aplicación web estática (HTML/CSS/JS puro — sin build, sin dependencias, sin
frameworks). Vive en esta carpeta de forma independiente del resto del
repositorio (`inteligencia-natural`, la app de Next.js): son dos productos
distintos que conviven en el mismo repo.

## 1. Cómo ejecutarla

No requiere instalación. Cualquiera de estas opciones funciona:

**Opción A — abrir el archivo directamente**
Doble clic en `index.html` (o `open index.html` / arrastrarlo al navegador).
Todo funciona salvo el modo presentador con doble ventana sincronizada, que
en algunos navegadores exige servir los archivos por HTTP en vez de `file://`.

**Opción B — servidor local (recomendada para presentar)**
```bash
cd keynote
npx serve .
# o:
python3 -m http.server 8080
```
Abre `http://localhost:3000` (o el puerto que indique) en Chrome o Edge en
pantalla completa. Funciona sin conexión a internet salvo por la tipografía
(Google Fonts); si no hay internet, cae a una fuente serif/sans del sistema.

**Opción C — publicarla**
Es un sitio 100% estático: se puede desplegar tal cual en Vercel, Netlify,
GitHub Pages o cualquier hosting estático, apuntando la raíz a `/keynote`.

## 2. Controles

| Tecla / gesto | Acción |
|---|---|
| `→` `Espacio` `PgDn` | Siguiente slide |
| `←` `PgUp` | Slide anterior |
| `Home` / `End` | Ir a la primera / última slide |
| `N` | Mostrar / ocultar notas del speaker en pantalla |
| `P` | Abrir el panel de presentador en una ventana aparte |
| `F` | Pantalla completa |
| `Esc` | Cerrar notas / salir de pantalla completa |
| Clic en el tercio izquierdo / derecho de la pantalla | Anterior / siguiente |
| Swipe (móvil/tablet) | Anterior / siguiente |

Un contador de slide (`07 / 40`), el nombre del acto actual y una barra de
progreso discreta están siempre visibles.

## 3. Modo presentador

Presiona **P** para abrir `presenter.html` en una segunda ventana. Muestra:
slide actual, slide siguiente, notas completas del speaker, cronómetro desde
el inicio de la charla y reloj de pared. Se mantiene sincronizado en tiempo
real con la ventana principal (la que se proyecta) vía `postMessage`; los
botones "anterior/siguiente" del panel también controlan la presentación
principal. Pensado para llevarlo en el laptop del presentador mientras la
ventana principal se proyecta en pantalla completa en el segundo monitor.

## 4. Dirección visual — nota importante sobre las imágenes

El encargo pedía fotografía real, cinematográfica, curada (naturaleza,
bosques, micelio, cardúmenes, hormigas). Se investigaron y seleccionaron
fuentes reales en Unsplash para cada metáfora — pero el entorno en el que se
construyó esta presentación tiene el acceso de red restringido a nivel de
política organizacional (egress bloqueado hacia unsplash.com, pexels.com y
wikimedia.org), lo que impidió verificar y descargar esas imágenes de forma
confiable.

En vez de arriesgar enlaces a imágenes rotas el día del evento, se construyó
un **sistema visual original propio**: ilustraciones SVG generativas (raíces
ramificándose, redes de nodos tipo micelio, constelaciones de metáforas,
mariposa en trazo minimalista, blobs orgánicos tipo sistema inmune) y
animaciones canvas ligeras (cardumen y hormigas simulados con un algoritmo
real de *flocking*/boids). Esto tiene una ventaja adicional: cero dependencia
de internet para verse correctamente, cero riesgo de licencias, y evita por
completo el riesgo de "stock photo obvia" que el encargo pedía evitar.

**Si quieres reemplazar el sistema generativo por fotografía real**, el punto
de entrada es `data.js`: cada slide tiene un campo `visual: { type: ... }`.
Puedes añadir un campo `image: 'ruta/o/url.jpg'` y modificar `buildVisual()`
en `app.js` para renderizar una capa `<img>` (con `object-fit:cover`) detrás
o en vez del generativo — la estructura ya está pensada para eso (cada visual
vive en su propia función `build*()`). Sugerencias de búsqueda por metáfora,
si vas a curar fotografía tú mismo (Unsplash / licencia gratuita para uso
comercial, sin atribución obligatoria):

- Portada / cierre: "misty forest canopy aerial", "forest sunbeams from below"
- Toyota / red de proveedores: "car assembly line robots", "industrial network"
- Micelio: "mycelium macro", "fungal network forest floor"
- Cardumen: "school of fish underwater"
- Hormigas: "ant colony macro"
- Mariposa: "monarch butterfly chrysalis emerging"
- Máquina vs organismo: "gears macro metal" / "forest canopy from above"
- Energía / CENIT: "oil refinery night", "wind turbines sunset"
- Momento emocional / final: "lone tree vast field dramatic clouds"

## 5. Estructura de archivos

```
keynote/
  index.html       shell de la app + splash de inicio
  styles.css        sistema de diseño (tipografía, paletas por acto, layout)
  data.js           las 40 slides: contenido + notas de speaker + specs visuales
  app.js            motor: render, navegación, visuales SVG/canvas, notas, sync con presenter
  presenter.html     panel de presentador (ventana aparte)
  README.md          este archivo
```

Para editar contenido o notas, solo se toca `data.js` — no hace falta tocar
`app.js` salvo que quieras un tipo de visual nuevo.

---

## 6. Tesis, narrativa y guía de entrega

### Tesis central
> No elegimos el cambio que viene. Elegimos qué tan capaces somos de
> adaptarnos a él — y esa capacidad, como en los sistemas vivos, se cultiva
> en tres niveles que se sostienen entre sí: **yo, nosotros, la organización.**

### Transformación de la audiencia
- **Al empezar:** "El cambio es algo externo — algo que el mercado, la
  tecnología o la empresa nos imponen. Mi trabajo es resistirlo o
  sobrevivirlo."
- **Al terminar:** "Yo soy parte activa de la capacidad de adaptación de mi
  organización. Empieza conmigo: lo que aprendo, lo que suelto, y cómo me
  conecto con quienes piensan distinto a mí."

### Arco narrativo
1. **Tensión (Acto I):** una historia real y verificada — el incendio de
   Aisin Seiki en 1997 y la recuperación de Toyota en 2 días — abre la
   pregunta que sostiene toda la charla: ¿qué hace que un sistema sea capaz
   de reaccionar cuando lo estable deja de serlo?
2. **Giro conceptual (Acto II):** la respuesta no vino de un mejor plan, sino
   de una capacidad de reorganización que la naturaleza practica desde
   siempre. Se introduce la bioadaptabilidad como marco/metáfora — con el
   matiz explícito de que no es una disciplina científica formal.
3. **Descubrimiento (Actos III–V):** las tres dimensiones — Yo, Nosotros,
   Organización — cada una con sus metáforas vivas (mariposa; cardumen,
   micelio, hormigas; organismo vs. máquina, sistema inmune) y su traducción
   directa a decisiones organizacionales reales, incluyendo el rol de la IA
   como acelerador (no como tesis) y el puente explícito al sector
   energético / CENIT.
4. **Reflexión (Acto VI):** un giro de lo organizacional a lo personal — el
   momento emocional — seguido del modelo visual de cierre (Yo → Nosotros →
   Organización) y una frase final original.

### Duración estimada (objetivo: ~60 minutos)

| Acto | Slides | Minutos aprox. |
|---|---|---|
| I — El mundo cambió (Toyota) | 1–9 | ~12 min |
| II — La naturaleza ya lo sabe | 10–15 | ~7 min |
| III — Dimensión 1: Yo | 16–22 | ~9 min |
| IV — Dimensión 2: Nosotros | 23–29 | ~9 min |
| V — Dimensión 3: Organización | 30–36 | ~12 min |
| VI — Cierre | 37–40 | ~6 min |
| **Total** | **40** | **~55 min** + margen para preguntas/transiciones → **~60 min** |

Las slides de una sola palabra (Aprender, Desaprender, Conectar) y los
divisores de acto están pensados para 15–30 segundos de silencio real, no
para ser explicados — ese tiempo está descontado del promedio.

### Momentos emocionales
- **Slide 18** — "A veces es desaprender lo que nos hizo exitosos": el primer
  quiebre, dirigido especialmente a la experiencia acumulada de una
  audiencia senior.
- **Slide 37** — el momento emocional explícito de la charla: pasa a la
  audiencia de "las organizaciones se adaptan" a "yo soy parte de esa
  capacidad".
- **Slide 40** — cierre en una sola frase, sin explicación, con silencio
  después.

### Mensaje final (última slide, textual)
> **No elegimos el cambio. Elegimos quién somos frente a él.**

---

## 7. Fuentes utilizadas

**Toyota / incendio de Aisin Seiki (1997):**
- Nishiguchi, T. & Beaudet, A. (1998). *The Toyota Group and the Aisin Fire.*
  MIT Sloan Management Review — el caso académico de referencia sobre
  auto-organización en la red de proveedores de Toyota tras el incendio.
- *1997 Aisin fire* — resumen enciclopédico del incidente (fecha, ubicación,
  cifras de recuperación).
- Cobertura posterior sobre cómo Toyota aplicó lecciones del incendio de
  1997 en su respuesta al terremoto/tsunami de Tōhoku en 2011 (Automotive
  News; GEP — "Toyota's Lessons in Disaster Management").

Nota de rigor: las cifras de pérdidas económicas del incendio de 1997 varían
ligeramente entre fuentes secundarias (todas citan la misma cronología —
incendio el 1 de feb. de 1997, reinicio de producción en ~2 días, recuperación
plena en días adicionales). Se usó la cifra y cronología más consistente
entre las fuentes revisadas; se evitó cualquier cifra no corroborada por al
menos dos fuentes independientes.

**Biología / sistemas vivos (usadas como metáfora, no como equivalencia
literal):**
- Comportamiento colectivo en cardúmenes (*collective animal behavior*) —
  campo asociado a investigadores como Iain Couzin.
- Inteligencia de enjambre en colonias de hormigas (*swarm intelligence*) —
  trabajo asociado a Deborah Gordon sobre organización de colonias.
- Redes miceliales y transferencia de nutrientes entre árboles — trabajo de
  Suzanne Simard (University of British Columbia). Se señala explícitamente
  en las notas de speaker de la slide 25 que la interpretación popular de
  estos hallazgos ("los árboles se comunican y se cuidan") ha sido objeto de
  debate y cuestionamiento por parte de otros investigadores — no se
  presenta como un hecho cerrado.
- Metamorfosis de mariposas (histólisis/histogénesis dentro de la crisálida)
  — proceso biológico bien documentado, usado aquí explícitamente como
  metáfora, no como equivalencia con el cambio humano.
- Memoria inmunológica adaptativa — usada como metáfora de resiliencia
  organizacional.

**Deliberadamente NO utilizado:** la cita "no es la especie más fuerte la
que sobrevive, sino la que mejor se adapta" atribuida popularmente a Darwin
— es una atribución falsa, ampliamente documentada como mito, y por eso no
aparece en esta charla.

## 8. Revisión crítica (autoevaluación previa a la entrega)

- **¿Parece un keynote premium?** Sí — tipografía editorial (Fraunces +
  Inter), paleta por acto, mucho espacio negativo, cero iconos genéricos,
  cero azul corporativo.
- **¿Hay demasiado texto?** No — el título más largo de la charla son dos
  líneas cortas; el contenido denso vive exclusivamente en las notas.
- **¿Toyota lleva naturalmente a bioadaptabilidad?** Sí — la slide 9 nombra
  explícitamente el giro ("no fue el plan, fue la capacidad de
  reorganizarse") antes de que la slide 10 lo traduzca a biología.
- **¿Las tres dimensiones están conectadas?** Sí — cada dimensión cierra con
  una slide-puente explícita hacia la siguiente (22 → Nosotros, 29 → 30).
- **¿Las metáforas aportan o decoran?** Cada metáfora tiene una traducción
  corporativa explícita en la misma sección (cardumen/micelio/hormigas →
  "detectar-comunicar-interpretar-actuar-aprender"; sistema inmune →
  resiliencia organizacional).
- **¿La IA está presente sin dominar?** Una sola slide (35) de 40, y aparece
  como uno de seis aceleradores (slide 34), nunca como tema central.
- **¿Existe un momento emocional?** Sí, slide 37, con reflexión personal
  original (no citas genéricas).
- **¿CENIT puede verse reflejada?** Sí, slide 36, con lenguaje explícito de
  "no vine a hablar de transición energética" para evitar sonar a charla
  sectorial genérica.
- **¿La última slide deja una idea memorable?** Sí — una frase de ocho
  palabras, sola, sin explicación.

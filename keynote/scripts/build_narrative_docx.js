const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  PageBreak, PageOrientation
} = require("docx");
const fs = require("fs");

const NAVY = "1F2937";
const GOLD = "B08D57";
const GREY = "6B7280";
const LIGHT = "F3F4F6";

function h1(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 } });
}
function h2(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 } });
}
function h3(text) {
  return new Paragraph({ text, heading: HeadingLevel.HEADING_3, spacing: { before: 200, after: 100 } });
}
function p(text, opts = {}) {
  return new Paragraph({
    spacing: { after: 160, line: 300 },
    children: [new TextRun({ text, ...opts })],
  });
}
function pRuns(runs, opts = {}) {
  return new Paragraph({ spacing: { after: 160, line: 300 }, ...opts, children: runs });
}
function quote(text) {
  return new Paragraph({
    spacing: { after: 200, before: 100 },
    indent: { left: 720 },
    border: { left: { style: BorderStyle.SINGLE, size: 18, color: GOLD, space: 8 } },
    children: [new TextRun({ text, italics: true, color: "374151" })],
  });
}
function bullet(text) {
  return new Paragraph({ text, bullet: { level: 0 }, spacing: { after: 100 } });
}
function pageBreak() {
  return new Paragraph({ children: [new PageBreak()] });
}

const doc = new Document({
  styles: {
    default: {
      document: { run: { font: "Georgia", size: 22, color: "1F2937" } },
    },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Arial", size: 32, bold: true, color: NAVY }, paragraph: { spacing: { before: 400, after: 200 } } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Arial", size: 26, bold: true, color: "374151" }, paragraph: { spacing: { before: 300, after: 150 } } },
      { id: "Heading3", name: "Heading 3", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { font: "Arial", size: 22, bold: true, color: GOLD }, paragraph: { spacing: { before: 200, after: 100 } } },
    ],
  },
  sections: [
    {
      properties: {
        page: {
          size: { width: 12240, height: 15840 },
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
        },
      },
      children: [
        // TITLE PAGE
        new Paragraph({ spacing: { before: 2000 }, alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "BIOADAPTABILITY", font: "Arial", size: 56, bold: true, color: NAVY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
          children: [new TextRun({ text: "Collective Intelligence · AI · The New Bottleneck", font: "Arial", size: 28, color: GOLD, italics: true })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
          children: [new TextRun({ text: "Narrativa de Keynote", font: "Arial", size: 22, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "Documento de narrativa, tesis, actos, historias, paradojas y preguntas", font: "Arial", size: 20, color: GREY })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 1600 },
          children: [new TextRun({ text: "Septiembre 2026", font: "Arial", size: 20, color: GREY })] }),
        pageBreak(),

        // LA PREGUNTA
        h1("La pregunta que sostiene todo el keynote"),
        pRuns([new TextRun({ text: "“Si la IA hace que ejecutar sea cada vez más barato, ¿qué pasa con las organizaciones cuyo verdadero cuello de botella ya no es ejecutar, sino percibir, interpretar y decidir juntas?”", italics: true, size: 24, color: NAVY })]),
        p("Esta pregunta funciona como columna vertebral intelectual de toda la investigación y de toda la presentación. No se asumió como cierta: se sometió a evidencia real — académica, empírica y empresarial — buscando confirmarla, matizarla o contradecirla. El resultado no es una historia complaciente."),

        // TESIS
        h1("Tesis central"),
        h3("Título de trabajo: “El vacío de percepción” (The Sensing Gap)"),
        p("Durante la mayor parte del último siglo, la ventaja de una organización fue una función de lo que podía ejecutar: cuánto sabía, cuántos especialistas empleaba, cuán eficientemente convertía decisiones en resultados. La IA está desmontando esa ventaja desde la raíz: producir, analizar, disear, programar, investigar y crear contenido se está colapsando en costo y tiempo hacia casi cero."),
        p("Esto no es una mejora modesta de productividad. Un experimento aleatorizado con consultores de BCG encontró que, dentro de la frontera de competencia de la IA, la velocidad aumentó más de 25% y la calidad más de 40% (Dell’Acqua, McFowland, Mollick et al., 2023–25). Otro ensayo aleatorizado encontró que los desarrolladores con GitHub Copilot completaron una tarea 55.8% más rápido (Peng et al., 2023). Un fundador solitario construyó y vendió una empresa de seis meses por 80 millones de dólares usando IA, sin equipo ni capital de riesgo (Base44, 2025). La ejecución — lo que las organizaciones se construyeron para proteger y escalar — se está volviendo abundante."),
        p("Pero la ejecución abundante no produce automáticamente mejores organizaciones: produce organizaciones que ejecutan lo equivocado, más rápido, a menos que algo más lo compense. Ese algo es lo que llamamos capacidad de sensemaking colectivo: la habilidad de un sistema —no de una persona— para notar señales débiles, sostener múltiples interpretaciones el tiempo suficiente para discutirlas hasta un significado compartido, y comprometerse con un curso de acción antes de que la ventana para actuar se cierre."),
        p("Esto siempre fue el verdadero cuello de botella. La escasez de ejecución simplemente lo ocultaba: cuando ejecutar era lento y caro, el mal juicio tenía tiempo de ser detectado, y el despliegue lento limitaba el costo de equivocarse. La IA eliminó ambas cosas: el retraso y la excusa."),
        h3("Por qué esto no es una tesis cómoda"),
        bullet("Los grupos SÍ pueden ser medible mente más inteligentes que su miembro más inteligente — el “factor c” de Woolley et al. (Science, 2010) correlaciona con sensibilidad social y equidad de turnos de habla, casi nada con el CI promedio."),
        bullet("Pero ese mismo hallazgo está disputado (Credé & Howardson, 2017): la inteligencia colectiva no es un hecho científico cerrado, es un debate vivo — y eso la hace más creíble, no menos."),
        bullet("Los grupos también pueden volverse medible mente más estúpidos juntos: groupthink (Janis, 1972), pérdida de proceso (Steiner, 1972) y, críticamente para esta década, la visibilidad social de las elecciones ajenas destruye medible mente el efecto de sabiduría de las multitudes (Lorenz et al., PNAS 2011)."),
        bullet("La IA generativa complica esto aún más: hace a los individuos más creativos mientras vuelve el resultado colectivo más similar entre sí — individualmente novedoso, colectivamente homogéneo (Bogert, Schecter & Watson, Science Advances, 2024)."),
        bullet("La descentralización radical tampoco es automáticamente la respuesta: los propios ex empleados de Spotify documentaron cómo el “modelo Spotify” de squads autónomos, copiado globalmente, se rompió a escala por falta de coordinación (Jeremiah Lee, 2020)."),
        h3("Formulación final"),
        quote("“Las organizaciones que ganarán esta década no serán las que tengan a las personas más inteligentes, ni los modelos más poderosos. Serán las que diseñen, deliberadamente, cómo la señal se convierte en juicio compartido — porque la IA volvió alquilable, por una tarde, cualquier otro tipo de ventaja.”"),

        pageBreak(),
        h1("Lo que la tesis debe explicar"),
        bullet("1. Por qué el mundo cambió: el cambio dejó de ser un evento planificable y se volvió el ambiente permanente (WEF Future of Jobs 2025: la IA afecta al 86% de las empresas; McKinsey 2025: 88% usa IA regularmente en al menos una función)."),
        bullet("2. Por qué el modelo planificar→ejecutar se queda corto: en dominios complejos, la relación causa-efecto solo es visible en retrospectiva (Snowden & Boone, Cynefin, HBR 2007) — no se puede planificar el camino a través de algo que solo se puede sentir."),
        bullet("3. Qué enseñan los sistemas complejos: micelio, colonias de hormigas, enjambres de abejas, murmuraciones, sistemas inmunes, bosques y mohos mucilaginosos — ninguno es individualmente más inteligente; todos coordinan sensado distribuido en decisiones colectivas rápidas y resilientes sin control central, y todos muestran también qué rompe eso."),
        bullet("4. Por qué importa la inteligencia colectiva y dónde se rompe: el debate del factor c, el bono de diversidad (Page) frente a las líneas de fractura de la diversidad (Jehn et al.), la paradoja honesta de gente inteligente formando un sistema estúpido."),
        bullet("5. Cómo la IA desplaza el cuello de botella de la ejecución al juicio: “capital de tokens vs. gusto” (Nadella), contratación por “contexto y gusto” en OpenAI, “la IA baja la barrera técnica, no la barrera de pensar — en muchos sentidos la sube” (Huang), “abundancia radical” (Hassabis) — y la evidencia contraria: el estudio de la frontera irregular muestra que confiar de más en la IA fuera de su competencia es ahora un modo de fallo más común que la falta de poder de ejecución."),
        bullet("6. Qué tiene que cambiar: liderazgo (control → condiciones para que emerja el sentido), estructura (jerarquía rígida → redes que aún necesitan nodos-hub y mecanismos de tipo-quorum, no aplanamiento dogmático), información (sube/baja → circula, con fricción deliberada contra la convergencia social prematura), decisión (centralizar vs. distribuir según el dominio de Cynefin, no por dogma), cultura (cumplimiento → memoria capturada, al estilo del sistema inmune), rol de la IA (herramienta individual → miembro del sistema colectivo, cuyo riesgo principal es homogeneizar el pensamiento del grupo si no se contrarresta deliberadamente)."),

        pageBreak(),
        h1("Arquitectura narrativa — 9 actos, 35 slides"),
        p("A continuación, cada acto con su idea central, las historias/evidencia que ancla, y la línea de transición hacia el siguiente acto. El guión completo, slide por slide, con texto en pantalla, dirección de imagen y notas del orador, vive en el archivo de guión adjunto al deck; aquí se documenta la lógica narrativa."),

        h2("Acto I — El mundo cambió (slides 1–4)"),
        p("Idea: el cambio dejó de ser un evento puntual gestionable con un “proyecto de cambio” y se volvió el clima permanente en el que operan las organizaciones."),
        p("Evidencia: WEF Future of Jobs Report 2025 (86% de las empresas afectadas por IA/tecnología de procesamiento de información); McKinsey State of AI 2025 (88% usa IA en al menos una función)."),
        p("Transición: las herramientas que las organizaciones construyeron para gestionar el cambio como evento siguen siendo las que la mayoría usa."),

        h2("Acto II — La paradoja de la ejecución (slides 5–9)"),
        p("Idea: la IA colapsó la distancia entre idea y ejecución, pero eso no hace automáticamente mejores a las organizaciones — hace más caro un mal criterio, no más barato."),
        p("Evidencia: ensayo aleatorizado de GitHub Copilot (Peng et al., 2023, +55.8% velocidad); experimento BCG/HBS de la “frontera irregular” (Dell’Acqua et al., +25% velocidad, +40% calidad dentro de la frontera); historia de Base44 (fundador solitario, 80M USD, 6 meses)."),
        p("Paradoja 1: “Cuanto más barato se vuelve ejecutar una idea, más caro se vuelve ejecutar una mala.” Pregunta bisagra: “Si todos pueden ejecutar, ¿qué se vuelve escaso?” Respuesta que cierra el acto: “Juicio.”"),

        h2("Acto III — El nuevo cuello de botella (slides 10–13)"),
        p("Idea: el sensemaking — notar, interpretar y comprometerse con un significado compartido— no es una habilidad blanda; ya era el paso más lento de la organización antes de la IA generativa."),
        p("Evidencia: encuesta global de McKinsey (2019) — solo ~20% de las organizaciones sobresale en toma de decisiones, 61% dice que al menos la mitad del tiempo de decisión se usa mal, ~250M USD perdidos al año en una Fortune 500 típica."),
        p("Paradoja 2: “No construimos organizaciones lentas por accidente. La lentitud era lo que atrapaba el mal juicio antes de que se enviara. La IA no arregló la falla del mecanismo. Borró el mecanismo.”"),

        h2("Acto IV — Mira a la vida (slides 14–19)"),
        p("Idea: la biología lleva 3.800 millones de años resolviendo detección distribuida y decisión colectiva bajo incertidumbre. No es una lección de biología: cada sistema natural mostrado tiene un mecanismo documentado con un equivalente organizacional directo."),
        p("Sistemas y principio traducido: micelio (Simard, 1997/2021) — la inteligencia vive en la red, invertir en los nodos-hub humanos; enjambres de abejas (Seeley, 2010) — decidir por quorum, no por la voz más fuerte; murmuraciones (Couzin, 2005/2011) — incluir voces no partidistas protege la calidad de la decisión; sistema inmune — detección barata en todas partes, escalado rápido de respuesta confirmada; resiliencia de bosques (Holling, 1973; Panarchy, 2002) — optimizar demasiado la fase de conservación genera fragilidad no pagada."),
        p("Giro que cierra el acto: “Ninguno de estos organismos es más inteligente que las personas en esta sala. Su coordinación sí lo es.”"),

        h2("Acto V — El cerebro colectivo (slides 20–25)"),
        p("Idea: la inteligencia colectiva es real, medible y —honestamente— disputada; y tiene un lado oscuro tan real como su promesa."),
        p("Evidencia a favor: factor c de Woolley et al. (2010). Evidencia en contra/matiz: Credé & Howardson (2017); groupthink (Janis, 1972); pérdida de proceso (Steiner, 1972); líneas de fractura de la diversidad (Jehn et al.). Historia empresarial: el incendio de Aisin de 1997 — 200+ proveedores de Toyota se autoorganizaron sin plan central y restauraron producción en días. Base de la condición: seguridad psicológica (Edmondson, 1999; Project Aristotle de Google, 2015)."),
        p("Paradoja 3: “La persona más inteligente de la sala no siempre es la parte más inteligente de la sala.”"),

        h2("Acto VI — La IA entra al sistema (slides 26–29)"),
        p("Idea: cada individuo ahora tiene acceso a algo cercano a un equipo de investigación, un estudio de diseño y un departamento de ingeniería, bajo demanda — pero eso no hace automáticamente más inteligente a la organización."),
        p("Evidencia: Klarna — el asistente de IA gestionó el trabajo equivalente a 700 empleados en un mes (2024), y en 2025 el CEO admitió públicamente haber “cortado demasiado, demasiado rápido” y reincorporó humanos. Bogert, Schecter & Watson (Science Advances, 2024): la IA generativa hace a los escritores individualmente más creativos pero las historias resultantes más similares entre sí — individualmente novedoso, colectivamente homogéneo."),
        p("Paradoja 4: “Cada persona se volvió más capaz. ¿Se volvió la organización más inteligente, o solo más productiva?”"),

        h2("Acto VII — De la inteligencia individual a la inteligencia de sistema (slides 30–31)"),
        p("Idea: “el sistema es más inteligente que cualquiera de sus miembros” no es una idea que la IA inventó — la IA es lo que pasa cuando se añade un nuevo tipo de participante a un juego muy antiguo."),
        p("Historia: el grupo Foldit —jugadores sin formación en bioquímica— resolvió en ~10 días una estructura proteíca que profesionales no habían resuelto en más de una década, y fue coautor acreditado en Nature Structural & Molecular Biology (2011)."),
        p("Paradoja 5 (la más importante): “Construimos la IA para hacer más poderosos a los individuos. Las organizaciones que ganen la usarán para hacer al grupo más honesto.”"),

        h2("Acto VIII — La organización adaptativa (slides 32–34)"),
        p("Idea: SENTIR → INTERPRETAR → CONECTAR → EXPERIMENTAR → ACTUAR → APRENDER → ADAPTAR no se presenta como un framework nuevo, sino como el patrón que la audiencia ya vio cinco veces esa noche, nombrado."),
        p("Evidencia práctica: el cordón andon de Toyota — cualquier trabajador de línea puede detener la producción al detectar un problema, autoridad de detección deliberadamente distribuida al borde. Contraejemplo necesario para honestidad intelectual: el fracaso documentado del “modelo Spotify” a escala (Jeremiah Lee, 2020) y el pivote estructural de Netflix (excluir deliberadamente al equipo de DVD de las reuniones de estrategia para forzar la atención organizacional)."),

        h2("Acto IX — La ventaja humana / cierre (slides 35)"),
        p("Idea de cierre: no es humanos contra máquinas. Es inteligencia humana × inteligencia artificial × inteligencia colectiva — y la ventaja vive en el producto de esa multiplicación, no en ningún término por separado."),
        quote("“Quizá la ventaja nunca estuvo en la persona más inteligente del edificio, ni en el modelo más poderoso corriendo en sus servidores. Quizá siempre estuvo en qué tan rápido un grupo de personas —y ahora, los sistemas que construyen junto a ellas— pueden convertir una señal débil en una decisión compartida. Ese fue siempre el verdadero trabajo. La IA solo hizo imposible seguir fingiendo que no lo era.”"),

        pageBreak(),
        h1("Las 10 historias reales que sostienen el keynote"),
        h3("3 historias empresariales"),
        bullet("El incendio de Aisin (1997) — 200+ proveedores de Toyota se autoorganizaron sin coordinación central y restauraron la producción en días. Fuente: Nishiguchi & Beaudet, Sloan Management Review, 1998."),
        bullet("El cordón andon de Toyota — cualquier trabajador de línea puede detener la producción; detección distribuida diseñada deliberadamente en el sistema (Jidoka)."),
        bullet("El fracaso del “modelo Spotify” a escala — documentado por el propio ex-empleado Jeremiah Lee (2020): autonomía sin coordinación real generó duplicación y luchas de poder."),
        h3("Historias de sistemas naturales (usadas como metáfora, Acto IV)"),
        bullet("Redes micorrízicas / micelio — Suzanne Simard, 1997/2021: inteligencia distribuida en la red, no en un nodo."),
        bullet("Democracia de las abejas — Thomas Seeley, 2010: decisión colectiva por quorum, no por la voz más fuerte."),
        bullet("Resiliencia de bosques / ciclo adaptativo — C.S. Holling, 1973: la sobreoptimización de la fase de conservación genera fragilidad."),
        h3("2 historias humanas de inteligencia colectiva"),
        bullet("Apolo 13 — el equipo de control en tierra y la tripulación improvisaron en tiempo real un adaptador de filtro de CO2 con materiales a bordo; nadie por sí solo pudo resolverlo."),
        bullet("Foldit — jugadores sin formación científica resolvieron en ~10 días una estructura proteíca que profesionales no habían resuelto en 15 años; acreditados como coautores en Nature Structural & Molecular Biology (2011)."),
        h3("2 historias de IA cambiando la ejecución"),
        bullet("Base44 — fundador solitario construyó y vendió una empresa de seis meses por 80M USD usando IA, sin equipo ni capital de riesgo (2025)."),
        bullet("Klarna — el asistente de IA gestionó el trabajo equivalente a 700 empleados en un mes (2024); en 2025 el CEO admitió haber “cortado demasiado, demasiado rápido” y reincorporó humanos."),

        pageBreak(),
        h1("5 Paradojas"),
        bullet("1. “Cuanto más barato se vuelve ejecutar una idea, más caro se vuelve ejecutar una mala.”"),
        bullet("2. “No construimos organizaciones lentas por accidente. La lentitud era lo que atrapaba el mal juicio antes de que se enviara. La IA no arregló la falla del mecanismo. Borró el mecanismo.”"),
        bullet("3. “La persona más inteligente de la sala no siempre es la parte más inteligente de la sala.”"),
        bullet("4. “Cada persona se volvió más capaz con IA. Eso no significa que la organización se haya vuelto más inteligente — la ceguera nunca fue un problema individual.”"),
        bullet("5. “Construimos la IA para hacer más poderosos a los individuos. Las organizaciones que ganen la usarán para hacer al grupo más honesto.”"),

        h1("5 Preguntas"),
        bullet("1. “Si tu empresa pudiera ejecutar cualquier idea para mañana por la mañana, ¿qué te impediría ejecutar la equivocada?”"),
        bullet("2. “¿Cuándo fue la última vez que tu mejor decisión vino de una sola persona en una sola sala?”"),
        bullet("3. “¿Tu organización está diseñada para optimizar lo que ya funciona, o para notar lo que dejó de funcionar?”"),
        bullet("4. “¿Cómo sabrías —de verdad— si el mercado ya empezó a moverse sin ti?”"),
        bullet("5. “¿Qué estás construyendo que nadie en tu equipo podría haber imaginado solo?”"),

        h1("5 Ideas visuales"),
        bullet("1. Pantalla dividida en time-lapse: una mano bocetando una idea en papel vs. la misma idea como prototipo funcionando segundos después — el tiempo colapsado se visualiza como espacio colapsado."),
        bullet("2. Una sola hormiga, enfoque nítido, con miles de hormigas desenfocadas detrás formando una textura — el individuo es legible, la inteligencia no está EN él."),
        bullet("3. Sala de juntas vacía, sillas en círculo, una silla reemplazada por una pequeña fuente de luz — sin robot, solo presencia."),
        bullet("4. Una murmuración congelada a media forma, encuadrada tan cerrada que no se lee primero como “pájaros” sino como geometría viva."),
        bullet("5. Una sola palabra en un fondo negro, nada más, sostenida un instante antes de la imagen final."),

        h1("5 Frases memorables (originales)"),
        bullet("1. “La ejecución dejó de ser el cuello de botella. Empezó a ser la coartada.”"),
        bullet("2. “No necesitamos organizaciones más rápidas. Necesitamos organizaciones que noten más rápido, juntas.”"),
        bullet("3. “La inteligencia que vive en una sola persona es un recurso. La inteligencia que vive en un sistema es una ventaja.”"),
        bullet("4. “La IA terminará cualquier frase que empieces. No te dirá cuál frase vale la pena empezar.”"),
        bullet("5. “La próxima ventaja competitiva no se va a encontrar. Se va a sentir, discutir y acordar — rápido, y juntos.”"),

        pageBreak(),
        h1("Conclusión"),
        p("La transformación conceptual que busca este keynote no es de “necesitamos organizaciones más eficientes” a “necesitamos organizaciones más ágiles” — esa es la conclusión fácil, y la investigación la complica deliberadamente. La conclusión real, sostenida por evidencia contestada y matizada, es esta:"),
        quote("“En un mundo donde la IA hace que ejecutar sea abundante, nuestra verdadera ventaja puede estar en cómo percibimos, pensamos y decidimos juntos — y en si diseñamos, con la misma seriedad con la que diseñamos cualquier otro sistema, las condiciones bajo las cuales eso ocurre bien, en lugar de asumir que ocurrirá solo porque le dimos a cada persona una herramienta más poderosa.”"),
        p("Prueba final: la única idea que alguien debería recordar seis meses después es que la inteligencia colectiva no es una consecuencia automática de tener personas más capaces o mejores modelos de IA — es una capacidad que se diseña, se protege y se puede perder, exactamente como cualquier otro sistema vivo."),

        pageBreak(),
        h1("Control de calidad — tres revisiones"),
        h2("Revisión 1 — Pensamiento (profesor de sistemas complejos)"),
        p("¿Es la tesis intelectualmente sólida? Sí, con matices explícitos: la evidencia de inteligencia colectiva citada (Woolley et al.) está presentada junto a su crítica metodológica directa (Credé & Howardson), y la promesa de la diversidad se presenta junto a su límite documentado (líneas de fractura). El keynote no afirma que la colaboración, la diversidad o la descentralización sean siempre positivas — al contrario, dedica evidencia explícita a cuándo fallan (groupthink, pérdida de proceso, homogeneización por IA, colapso del modelo Spotify a escala)."),
        h2("Revisión 2 — Negocio (CEO)"),
        p("¿Esto cambia mi forma de pensar sobre mi organización? La pregunta operativa que debería quedar resonando es: ¿mi empresa invierte en la capacidad de ejecutar más rápido, o en la capacidad de decidir mejor, juntos, sobre qué ejecutar? El dato de Deloitte (93% del presupuesto de IA va a tecnología, 7% a formar el juicio de las personas) hace esa pregunta incomoda y específica, no retórica."),
        h2("Revisión 3 — Creativa (director creativo de TED)"),
        p("¿Hay momentos memorables? Cinco paradojas originales, cinco preguntas diseñadas para el silencio, un cierre sin diapositiva de “gracias” ni recapitulación en viñetas. ¿Hay clichés? Se evitaron deliberadamente robots humanoides, cerebros digitales, manos tocando hologramas y fotografía de stock genérica — ver documento de fuentes de imagen para la dirección visual completa. ¿Demasiadas palabras? El texto en pantalla de cada slide se limitó a una palabra, una frase o una pregunta; el desarrollo completo vive únicamente en las notas del orador."),

        h1("Nota sobre la investigación"),
        p("Toda la investigación para este keynote se realizó mediante búsqueda web en vivo (no memoria del modelo), documentada con autor, fuente, URL y año en el archivo Bioadaptability_Research.xlsx (63 fuentes). El acceso de descarga/verificación directa a Wikimedia Commons, NASA y otros repositorios de imágenes estuvo bloqueado por la política de red de este entorno de ejecución; el documento Bioadaptability_Image_Sources.xlsx documenta esta limitación explícitamente y entrega un brief de búsqueda de imágenes candidatas para verificación final antes de publicación."),
      ],
    },
  ],
});

Packer.toBuffer(doc).then((buf) => {
  fs.writeFileSync("/home/user/collaboration-intelligence/keynote/deliverables/Bioadaptability_Keynote_Narrative.docx", buf);
  console.log("Saved narrative docx");
});

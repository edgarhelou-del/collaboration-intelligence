/* ============================================================
   BIOADAPTABILIDAD EN EL MUNDO CORPORATIVO
   Keynote data — CENIT
   40 slides. Cada objeto define contenido + notas de speaker + visual.
   ============================================================ */

const SLIDES = [

// ============ ACTO I — EL MUNDO CAMBIÓ ============

{
  id: 1, act: 'toyota', kind: 'cover',
  kicker: 'CENIT · Un encuentro sobre el futuro del trabajo',
  title: 'Bioadaptabilidad',
  sub: 'Cómo sobrevive lo que sabe cambiar',
  visual: { type: 'roots', seed: 1 },
  notes: `Bienvenida breve, cálida, sin apuros — no arranques explicando el título. Preséntate en una frase y deja que el silencio y la imagen trabajen unos segundos antes de hablar. Esta es la slide de apertura: no hay historia previa que conectar, así que el trabajo aquí es puramente de tono — bajas el ritmo de la sala, subes la expectativa. Di algo como: "Durante la próxima hora no les voy a hablar de inteligencia artificial, ni de transformación digital, ni de ningún framework nuevo. Les voy a hablar de algo mucho más viejo: de cómo sobrevive lo que sabe cambiar." Idea que debe quedar: esta charla trata sobre capacidad de adaptación, no sobre predicción del futuro. Fuente: sin evidencia externa en esta slide — es de posicionamiento.`
},

{
  id: 2, act: 'toyota', kind: 'statement',
  title: 'Hay una pregunta que ninguna estrategia\nresponde del todo.',
  visual: { type: 'network', density: 'low', palette: 'toyota' },
  notes: `Conecta bajando la voz, como quien va a contar algo en confianza. No reveles todavía cuál es la pregunta — la tensión narrativa depende de que la audiencia la sienta antes de leerla. Puedes decir: "Todas las empresas en las que he trabajado tienen un plan estratégico. Comités, KPIs, hojas de ruta a tres años. Y sin embargo, hay una pregunta que ninguno de esos documentos responde del todo." Es una slide puente: prepara el terreno para la pregunta explícita de la siguiente. Idea a recordar: la planeación y la adaptación no son lo mismo, y esta charla es sobre la segunda.`
},

{
  id: 3, act: 'toyota', kind: 'question',
  title: '¿Qué haces cuando lo que\nsiempre funcionó, deja de funcionar?',
  visual: { type: 'network', density: 'low', palette: 'toyota', pulse: true },
  notes: `Lee la pregunta en voz alta, despacio, y luego haz una pausa real de dos o tres segundos — no la llenes. Es el gancho de toda la charla; todo lo que sigue en los próximos 40 minutos es, de una forma u otra, una respuesta a esta pregunta. Conexión con la anterior: esta es literalmente "la pregunta que ninguna estrategia responde del todo", ahora dicha en voz alta. Luego anuncia el giro: "Para responderla, no les voy a hablar en abstracto. Les voy a contar algo que pasó una madrugada de 1997, en una fábrica de autopartes en Japón." Eso abre paso a Toyota.`
},

{
  id: 4, act: 'toyota', kind: 'scene',
  kicker: '1 de febrero de 1997 · 4:18 a.m. · Kariya, Japón',
  title: 'Una fábrica se incendia.',
  sub: 'Aisin Seiki — único proveedor de una pieza que Toyota necesita para fabricar cada uno de sus autos.',
  visual: { type: 'network', density: 'medium', palette: 'toyota', highlight: 'single' },
  notes: `Cuenta esto como una escena, con datos concretos — la hora exacta, el lugar, ayudan a que se sienta real y no como una anécdota genérica de management. "4:18 de la mañana. Una planta de Aisin Seiki, en la ciudad de Kariya, se incendia. Aisin no es un proveedor cualquiera: es el único fabricante en el mundo de una válvula llamada P-valve, que regula la presión de frenado en las llantas traseras. Sin esa pieza, ningún auto Toyota sale de la línea de ensamble." Conexión: esta es la respuesta concreta a "qué pasa cuando lo estable deja de serlo" — aquí "lo estable" era literalmente la cadena de suministro. Fuente: 1997 Aisin fire — caso documentado en Nishiguchi & Beaudet, "The Toyota Group and the Aisin Fire", MIT Sloan Management Review (1998), y registrado en fuentes académicas posteriores sobre resiliencia de cadenas de suministro.`
},

{
  id: 5, act: 'toyota', kind: 'fact',
  kicker: 'Just-in-Time',
  title: 'Toyota mantenía menos de\ncuatro horas de inventario de esa pieza.',
  visual: { type: 'network', density: 'medium', palette: 'toyota', broken: true },
  notes: `Aquí explicas por qué el incendio no era un problema de un proveedor, sino un problema de todo el sistema. El Sistema de Producción Toyota (Just-in-Time) es brillante para eficiencia: casi cero inventario, cero desperdicio, producción sincronizada al minuto. Pero esa misma eficiencia significa que no había colchón. "Toyota no guardaba semanas de esa pieza. Guardaba horas." Conecta con la anterior: la escena ya mostró el incendio; aquí explicas por qué era tan grave. Idea a recordar (plántala, la vas a usar después): la misma característica que te hace eficiente en tiempos estables te puede hacer frágil en tiempos de disrupción. No lo resuelvas todavía — solo déjalo sonando. Fuente: la cifra de "cuatro horas de inventario" aparece de forma consistente en el caso académico de Nishiguchi & Beaudet y en coberturas posteriores del incidente (MIT Sloan Management Review; análisis de resiliencia de cadena de suministro).`
},

{
  id: 6, act: 'toyota', kind: 'fact',
  kicker: 'La escala del problema',
  title: 'Toda la producción global de Toyota\ndependía de una sola fábrica.',
  visual: { type: 'network', density: 'high', palette: 'toyota', broken: true },
  notes: `Sube la escala: no es solo una línea de producción, es TODA la red. Toyota fabricaba entonces más de 4 millones de vehículos al año, y cada uno necesitaba esa válvula. Los analistas externos, en ese momento, estimaban semanas de parón. Puedes decir: "Los expertos que cubrían la industria automotriz hicieron sus cálculos: esto iba a detener a Toyota durante semanas. Algunos hablaban de un golpe de miles de millones de yenes." Conexión: profundiza la tensión antes de mostrar la respuesta — necesitamos que la audiencia sienta que esto debía haber sido una catástrofe. Fuente: estimaciones de la época citadas en análisis del caso (incluyendo pérdidas estimadas cercanas a 160 mil millones de yenes en ventas para Toyota); cifras ampliamente citadas en la literatura sobre este caso, con algunas variaciones según la fuente — indícalo si alguien pregunta por el número exacto.`
},

{
  id: 7, act: 'toyota', kind: 'fact',
  kicker: 'La respuesta',
  title: 'Nadie esperó instrucciones.',
  sub: 'Más de 200 empresas se auto-organizaron para resolverlo — sin un plan central que las coordinara.',
  visual: { type: 'network', density: 'high', palette: 'toyota', healing: true },
  notes: `Este es el giro dramático de la historia. Nadie en Toyota tenía un "plan de contingencia para incendio de proveedor único" escrito en un cajón. Lo que pasó fue otra cosa: proveedores que ni siquiera competían entre sí —empresas de costura, de electrónica, talleres pequeños— empezaron, por su cuenta, a diseñar e improvisar formas de fabricar esa válvula, usando maquinaria que nunca había hecho eso. Aisin montó líneas temporales en plantas vecinas. Se dice que en cierto momento había decenas de configuraciones distintas de producción funcionando en paralelo, sin que nadie las hubiera diseñado desde arriba. Idea a recordar: la respuesta no vino de un plan mejor. Vino de una red capaz de reorganizarse sola. Fuente: este es el hallazgo central del caso de Nishiguchi & Beaudet (1998) sobre "auto-organización" en el grupo Toyota tras el incendio de Aisin — ampliamente citado en estudios de teoría de la complejidad aplicada a cadenas de suministro.`
},

{
  id: 8, act: 'toyota', kind: 'fact',
  kicker: 'El resultado',
  title: '2 días.',
  sub: 'Donde se esperaban semanas de parálisis, Toyota volvió a producir en 48 horas.',
  visual: { type: 'network', density: 'high', palette: 'toyota', healed: true },
  notes: `Deja que el número respire — "2 días" solo, grande. Luego contextualiza: los primeros lotes de válvulas utilizables llegaron a Toyota el miércoles siguiente al incendio, y la producción se retomó con apenas unos días de retraso frente a lo previsto en semanas por los analistas externos. No fue perfecto ni gratis — hubo pérdida de producción y de ventas real, documentada— pero comparado con el escenario que todos temían, fue una recuperación extraordinaria. Conexión: es la resolución de la tensión que abriste en la slide 6. Idea a recordar: la velocidad de recuperación no vino de tener más control, vino de tener más capacidad de coordinación distribuida. Fuente: Nishiguchi & Beaudet (1998); coberturas posteriores del caso sitúan la recuperación productiva plena en aproximadamente una semana, con el reinicio de producción en 2 días — cifras consistentes entre las fuentes académicas revisadas.`
},

{
  id: 9, act: 'toyota', kind: 'turn',
  title: 'No fue el plan lo que salvó a Toyota.\nFue su capacidad de reorganizarse.',
  sub: '¿Qué hace que un sistema sea capaz de reaccionar cuando aquello que parecía estable deja de serlo?',
  visual: { type: 'network', density: 'medium', palette: 'toyota', healed: true, pulse: true },
  notes: `Esta es la slide-bisagra de todo el Acto I. Aquí nombras explícitamente la lección, y la conviertes en la pregunta que va a guiar el resto de la charla. No presentes esto como "Toyota es una empresa admirable" — evita el tono de caso de éxito corporativo. El punto no es Toyota, es lo que Toyota revela: que la resiliencia no vivía en un documento, vivía en la relación entre las empresas de esa red. Di algo como: "Toyota no tenía la respuesta correcta guardada en un cajón. Tenía algo más valioso: una red capaz de encontrar la respuesta cuando la necesitó." Y luego, mirando a la audiencia: "Esa capacidad tiene un nombre, aunque no lo aprendimos en ninguna clase de administración." Esto conecta directo con la siguiente slide.`
},

// ============ ACTO II — LA NATURALEZA YA LO SABE ============

{
  id: 10, act: 'nature', kind: 'turn',
  title: 'Toyota aprendió, en dos días,\nalgo que la naturaleza lleva\nmiles de millones de años practicando.',
  visual: { type: 'roots', seed: 2, palette: 'nature' },
  notes: `Aquí ocurre el giro conceptual de la charla — el momento en que pasamos de "caso de negocio" a "metáfora viva". Baja el ritmo, cambia el tono de voz, es un cambio de registro. Puedes decir: "Lo que Aisin y sus 200 socios hicieron esa semana —percibir la amenaza, comunicarse sin jerarquía, reorganizarse en tiempo real— no es una técnica de gestión. Es, literalmente, cómo ha sobrevivido la vida en este planeta desde siempre." Conexión con la anterior: retomas la pregunta cerrada en la slide 9 y la respondes apuntando hacia la naturaleza, no hacia otro caso corporativo. Idea a recordar: el concepto que viene —bioadaptabilidad— no es una teoría nueva, es un nombre para algo que ya observamos en los sistemas vivos.`
},

{
  id: 11, act: 'nature', kind: 'concept',
  kicker: 'Un marco, no una disciplina',
  title: 'Bioadaptabilidad',
  sub: 'La capacidad de un sistema vivo — una persona, un equipo, una organización — de percibir el cambio, aprender, reorganizarse y evolucionar con él.',
  visual: { type: 'network', density: 'medium', palette: 'nature', organic: true },
  notes: `Sé honesto y preciso aquí, es importante para la credibilidad de toda la charla: "bioadaptabilidad" no es un campo científico establecido con journals propios — es un marco conceptual, una metáfora de trabajo que toma prestados principios reales de biología, evolución y sistemas complejos para hablar de adaptación humana y organizacional. Dilo explícitamente, sin miedo: "No les voy a presentar esto como una ciencia con mayúsculas. Es una lente. Y como toda buena lente, no importa tanto si es 'la' verdad, importa si nos ayuda a ver algo que no estábamos viendo." Luego da la definición de la slide, despacio. Conexión: nace directamente de la frase de cierre de la slide anterior. Fuente/nota de rigor: los principios de fondo (auto-organización, inteligencia de enjambre, redes miceliales, aprendizaje organizacional) sí tienen respaldo en biología evolutiva, ecología y teoría de la complejidad — eso se cita metáfora por metáfora a lo largo de la charla; lo que no existe es "la bioadaptabilidad" como disciplina académica unificada, y no debe presentarse como tal.`
},

{
  id: 12, act: 'nature', kind: 'gallery',
  kicker: 'La misma capacidad, en formas distintas',
  title: 'Un bosque. Un micelio.\nUn cardumen. Una colonia.\nUn sistema inmune.',
  visual: { type: 'constellation', palette: 'nature' },
  notes: `Esta slide es una promesa, no una clase de biología — no te detengas a explicar cada palabra todavía, solo nómbralas, como quien muestra el mapa de lo que viene. "Durante los próximos minutos les voy a mostrar algunas de estas formas de vida. No porque esta sea una charla de biología, sino porque cada una de ellas ya resolvió, a su manera, la pregunta que nos trajo hasta aquí." Menciona que volverán a aparecer, una por una, ligadas a personas, equipos y organizaciones — no las expliques todas ahora. Idea a recordar: es solo un adelanto visual; genera curiosidad, no la satisfagas todavía.`
},

{
  id: 13, act: 'nature', kind: 'statement',
  title: 'Los sistemas vivos no sobreviven\nporque permanecen iguales.',
  visual: { type: 'roots', seed: 3, palette: 'nature', decay: true },
  notes: `Frase corta, categórica, dicha casi como una provocación. Deja que se sostenga sola unos segundos antes de pasar a la siguiente — las dos slides funcionan como un díptico (tesis / antítesis) y deben sentirse como un solo respiro con una pausa en medio. No agregues explicación aquí todavía; la explicación llega con la frase que completa la idea en la próxima slide. Conexión: es la traducción directa, a lenguaje biológico, del contraste ya insinuado en la historia de Toyota entre "tener el plan correcto" y "tener la capacidad de cambiar".`
},

{
  id: 14, act: 'nature', kind: 'statement',
  title: 'Sobreviven porque\npueden cambiar.',
  visual: { type: 'roots', seed: 3, palette: 'nature', bloom: true },
  notes: `Esta es la contraparte de la slide anterior — el "sí" después del "no". Dila con más energía, es la resolución. Puedes anclarla con un ejemplo brevísimo, sin alargarte: "Una especie no sobrevive un millón de años porque encontró la forma perfecta y se quedó ahí. Sobrevive porque nunca dejó de ajustarse." Luego pivota hacia la estructura de la charla: "Y esa capacidad de ajustarse —de adaptarse— no ocurre en un solo nivel. Ocurre en tres, al mismo tiempo." Eso te lleva directo al marco de las tres dimensiones. Idea a recordar: esta frase es, en el fondo, la tesis biológica de toda la charla.`
},

{
  id: 15, act: 'nature', kind: 'framework',
  kicker: 'El mapa de esta charla',
  title: 'Yo. Nosotros. Organización.',
  sub: 'Tres niveles donde se juega la misma capacidad de adaptarse.',
  visual: { type: 'model', stage: 'preview', palette: 'nature' },
  notes: `Presenta el mapa completo de lo que viene, para que la audiencia sepa dónde está en todo momento — esto es clave en una charla de 40 slides, ayuda a que no se sientan perdidos. "La bioadaptabilidad no vive solo en la organización, ni solo en el individuo. Vive en tres capas que se sostienen entre sí: cómo cambio yo, cómo cambiamos juntos, y cómo cambia el sistema en el que trabajamos." Señala que van a recorrer las tres, una por una, empezando por la más cercana: uno mismo. Conexión: es la estructura completa que emergió de la definición de bioadaptabilidad (slide 11) y del "pueden cambiar" (slide 14). Este es el momento de transición hacia el Acto III.`
},

// ============ ACTO III — DIMENSIÓN 1: YO ============

{
  id: 16, act: 'yo', kind: 'divider',
  kicker: 'Dimensión 1',
  title: 'Yo',
  sub: 'Cambiar yo.',
  visual: { type: 'word', palette: 'yo', small: true },
  notes: `Slide de transición de acto — dale su propio silencio, un segundo de pausa antes de hablar, cambia físicamente de posición en el escenario si puedes, es una señal no verbal de que empieza un capítulo nuevo. "Empecemos por lo más pequeño y lo más difícil: uno mismo." Conexión: es la primera de las tres dimensiones anunciadas en el mapa. No necesitas explicar mucho aquí, la frase "Cambiar yo" ya lo dice todo — dale espacio.`
},

{
  id: 17, act: 'yo', kind: 'statement',
  title: 'Adaptarse no es\naprender más.',
  visual: { type: 'roots', seed: 4, palette: 'yo' },
  notes: `Frase que desafía el supuesto más común sobre adaptación: que es cuestión de más cursos, más certificaciones, más información. Puedes decir: "Cuando pensamos en adaptarnos, la primera reacción casi siempre es la misma: aprender algo nuevo. Un curso, una certificación, una habilidad más en el currículum. Y sí, aprender importa. Pero no es lo más difícil." Deja la pregunta abierta para que la resuelva la siguiente slide — es un díptico como el de "sobreviven/pueden cambiar". Idea a recordar: esta charla no va a menospreciar el aprendizaje, pero va a insistir en que hay algo anterior y más difícil.`
},

{
  id: 18, act: 'yo', kind: 'statement',
  title: 'A veces es desaprender\nlo que nos hizo exitosos.',
  visual: { type: 'roots', seed: 4, palette: 'yo', shedding: true },
  notes: `Este es, probablemente, el momento intelectual más importante de todo el Acto III — no lo apures. Explica la paradoja con claridad: las mismas creencias, hábitos y formas de pensar que te hicieron bueno en algo, en un contexto que cambió, se convierten en el obstáculo. "El ingeniero que fue brillante resolviendo problemas conocidos, a veces es el más lento para aceptar que el problema cambió de naturaleza. No porque sea menos capaz. Porque su mayor fortaleza —su experiencia— también es lo que más le cuesta soltar." Conecta con la audiencia senior de CENIT sin decirlo de forma obvia: ellos son, precisamente, las personas con más experiencia acumulada en la sala, y por tanto las que más tienen que "desaprender" cuando el entorno cambia — eso no es una debilidad, es una condición humana universal. Idea a recordar: nuestro mayor enemigo frente al cambio, muchas veces, es aquello que antes nos hizo exitosos.`
},

{
  id: 19, act: 'yo', kind: 'metaphor',
  kicker: 'Metáfora',
  title: 'Ninguna mariposa llega a serlo\nsin dejar atrás su forma anterior.',
  visual: { type: 'butterfly', palette: 'yo' },
  notes: `Usa esta metáfora una sola vez, con cuidado, y sin quedarte mucho tiempo en ella — el riesgo real es que suene a cliché de calendario motivacional, así que la clave es conectarla de inmediato con algo concreto y humano, no dejarla flotando como imagen bonita. "La metamorfosis no es una decoración biológica bonita: dentro de la crisálida, buena parte del cuerpo de la oruga literalmente se disuelve antes de reorganizarse en algo distinto. No hay mariposa que conserve intacta la forma de la oruga. Tiene que soltarla por completo." Luego regresa rápido al terreno humano: "A nosotros nadie nos pide que nos disolvamos. Pero sí nos pide, todo el tiempo, que soltemos identidades profesionales, formas de trabajar, certezas, que en su momento fueron nuestra fortaleza." Idea a recordar: transformarse real duele un poco, porque implica dejar ir algo que funcionó. Nota de rigor: la metamorfosis es un proceso biológico real y bien documentado (histólisis e histogénesis dentro de la crisálida); se usa aquí como metáfora, no como equivalencia literal con el cambio humano.`
},

{
  id: 20, act: 'yo', kind: 'word',
  title: 'Aprender',
  visual: { type: 'word', palette: 'yo' },
  notes: `Slide de una sola palabra — déjala respirar, no la sobreexpliques. Es el primero de los dos verbos gemelos de esta dimensión. Puedes acompañarla con una frase breve, casi al margen: "Curiosidad genuina. Ganas de hacerte preguntas cuyas respuestas no controlas." Si la audiencia necesita un respiro visual después de la slide 18 (la más densa del acto), esta y la siguiente cumplen esa función — dales el espacio, no las llenes de contenido.`
},

{
  id: 21, act: 'yo', kind: 'word',
  title: 'Desaprender',
  visual: { type: 'word', palette: 'yo', shedding: true },
  notes: `El verbo gemelo, y el más incómodo de los dos. Conecta explícitamente con la slide 18: "Este es el verbo que nadie pone en su CV, pero es el que más importa cuando el terreno cambió." Puedes cerrar con una pregunta directa a la audiencia, retórica, sin esperar respuesta en voz alta: "¿Qué modelo mental los ha hecho exitosos hasta hoy — y qué tan dispuestos estarían a cuestionarlo si el entorno se lo pidiera?" Eso siembra la reflexión personal que vas a recoger más adelante, en el cierre emocional.`
},

{
  id: 22, act: 'yo', kind: 'bridge',
  title: 'Pero nadie se adapta solo.',
  sub: 'La flexibilidad individual tiene un límite si nadie más a tu alrededor está dispuesto a moverse contigo.',
  visual: { type: 'network', density: 'low', palette: 'yo', connecting: true },
  notes: `Slide de cierre de la dimensión YO y puente hacia NOSOTROS — el trabajo aquí es mostrar el límite de todo lo dicho hasta ahora. "Todo lo que acabamos de ver —aprender, desaprender, soltar el modelo mental que nos hizo exitosos— es necesario. Pero no es suficiente. Puedes ser la persona más adaptable del edificio, y si trabajas rodeado de gente que no se mueve contigo, tu capacidad de adaptación individual choca contra un techo muy bajo." Conexión con lo que sigue: "Por eso la naturaleza no resuelve esto solo a nivel de organismo individual. Lo resuelve, sobre todo, a nivel de grupo." Eso abre la puerta directa al Acto IV.`
},

// ============ ACTO IV — DIMENSIÓN 2: NOSOTROS ============

{
  id: 23, act: 'nosotros', kind: 'divider',
  kicker: 'Dimensión 2',
  title: 'Nosotros',
  sub: 'Cambiar juntos.',
  visual: { type: 'word', palette: 'nosotros', small: true },
  notes: `Segunda transición de acto — mismo tratamiento que la slide 16: pausa, cambio de tono, cambio de paleta de color en pantalla (notarás que el fondo pasa de tonos cálidos ámbar a tonos azul-verdosos, como agua). Puedes señalar ese cambio de tono si te sirve: "Pasamos de lo individual a lo colectivo — y el color en pantalla cambia con nosotros, porque el siguiente conjunto de metáforas vive, literalmente, en el agua y bajo tierra."`
},

{
  id: 24, act: 'nosotros', kind: 'metaphor',
  kicker: 'Cardumen',
  title: 'No existe el pez líder.',
  sub: 'El comportamiento del cardumen emerge de miles de interacciones simples entre individuos — nadie da la orden.',
  visual: { type: 'boids', mode: 'school', palette: 'nosotros' },
  notes: `Explica el mecanismo real, es fascinante y verificable: cada pez sigue reglas simples respecto a sus vecinos inmediatos — mantener distancia, alinear dirección, seguir el promedio del grupo cercano — y de esa suma de reglas locales emerge un comportamiento colectivo complejísimo: el cardumen puede cambiar de forma en fracciones de segundo para esquivar un depredador, sin que ningún pez individual "decida" la maniobra completa. "No hay un pez CEO dando instrucciones al resto. La inteligencia no está en un individuo. Está en las conexiones entre todos." Conexión con lo corporativo, sin forzarla todavía —vas a hacer el puente explícito un par de slides después: por ahora deja que la metáfora hable por sí sola. Fuente: este es un hallazgo consolidado en biología del comportamiento colectivo (self-organization / collective behavior en cardúmenes), estudiado extensamente por investigadores como Iain Couzin y otros en el campo de "collective animal behavior".`
},

{
  id: 25, act: 'nosotros', kind: 'metaphor',
  kicker: 'Micelio',
  title: 'Bajo cada bosque hay una red\nque nadie ve.',
  sub: 'El micelio conecta raíces de árboles distintos y permite el intercambio de nutrientes e información.',
  visual: { type: 'network', density: 'high', palette: 'nosotros', organic: true, underground: true },
  notes: `El micelio es la red de hilos fúngicos que se extiende bajo el suelo del bosque, a veces conectando cientos de árboles entre sí — muchas veces mal llamada popularmente "wood wide web". Sé preciso: hay evidencia científica sólida de que el micelio conecta raíces y facilita transferencia de nutrientes entre plantas; la extensión exacta de "comunicación" o "cooperación" entre árboles a través de esa red sigue siendo objeto de investigación activa y algo de debate científico —dilo si el público es técnico o pregunta. Lo que importa para la metáfora es esto: "La red no se ve. No tiene marca, no tiene organigrama. Pero es la razón por la que el bosque entero responde como un solo sistema, aunque esté hecho de miles de árboles individuales." Conexión: profundiza la idea de inteligencia distribuida que abrió el cardumen. Fuente: investigación de Suzanne Simard sobre redes miceliales y transferencia de recursos entre árboles (University of British Columbia); nota de rigor: algunos hallazgos y su interpretación popular ("los árboles se comunican y cuidan a sus crías") han sido cuestionados por parte de la comunidad científica en años recientes — preséntalo como una metáfora poderosa, no como un hecho cerrado y sin debate.`
},

{
  id: 26, act: 'nosotros', kind: 'metaphor',
  kicker: 'Colonia de hormigas',
  title: 'La inteligencia no está\nen la hormiga. Está en el sistema.',
  visual: { type: 'boids', mode: 'ants', palette: 'nosotros' },
  notes: `Ninguna hormiga individual conoce el mapa completo del hormiguero, ni tiene el plan de dónde está la comida o cómo defenderse de una amenaza. Y sin embargo, la colonia como conjunto resuelve problemas de logística, defensa y asignación de recursos con una eficiencia que sorprende a quienes la estudian. Eso ocurre a través de reglas simples de interacción local —por ejemplo, el uso de rastros de feromonas que otras hormigas refuerzan o abandonan según el resultado— nunca por instrucción centralizada de una "hormiga reina estratega" (la reina, de hecho, solo pone huevos, no dirige operaciones). "Ninguna hormiga es inteligente. La colonia sí lo es." Conexión: cierra el trío de metáforas (cardumen, micelio, hormigas) y prepara el aterrizaje explícito hacia equipos humanos en la siguiente slide. Fuente: estudios de "swarm intelligence" / inteligencia de enjambre, campo consolidado en biología del comportamiento y ciencias de la complejidad (p. ej. trabajo de Deborah Gordon sobre colonias de hormigas).`
},

{
  id: 27, act: 'nosotros', kind: 'reframe',
  title: 'Un equipo adaptable no es\nel que tiene las mejores respuestas.',
  sub: 'Es el que construye las respuestas más rápido, juntos.',
  visual: { type: 'network', density: 'medium', palette: 'nosotros', pulse: true },
  notes: `Este es el aterrizaje corporativo explícito de las tres metáforas anteriores — el momento en que conectas biología con la sala de juntas. "Llevamos años contratando y premiando a la persona más inteligente del cuarto. Y la persona más inteligente del cuarto importa. Pero cuando el entorno cambia rápido, lo que determina si un equipo se adapta no es cuánto sabe su miembro más brillante. Es qué tan rápido el grupo entero puede detectar que algo cambió, y construir juntos una respuesta." Conexión: retoma directamente "nadie se adapta solo" (slide 22) y lo resuelve con lo que acabamos de ver en cardumen, micelio y hormigas. Idea a recordar: inteligencia colectiva no es la suma de inteligencias individuales, es la calidad de las conexiones entre ellas.`
},

{
  id: 28, act: 'nosotros', kind: 'flow',
  kicker: 'La secuencia que importa',
  title: 'Detectar → Comunicar → Interpretar\n→ Actuar → Aprender',
  sub: 'Más rápido, colectivamente, que la velocidad del cambio.',
  visual: { type: 'flow', palette: 'nosotros' },
  notes: `Esta slide da una herramienta concreta y memorable, algo que la audiencia se puede llevar literalmente escrito. Explica cada verbo con brevedad, casi como un latido: "Detectar — alguien nota una señal temprana. Comunicar — esa señal viaja sin fricción, sin que se pierda subiendo niveles jerárquicos. Interpretar — el equipo le da sentido juntos, no un solo experto en aislamiento. Actuar — se prueba una respuesta, aunque no sea perfecta. Aprender — se ajusta con lo que pasó, y el ciclo vuelve a empezar." Cierra con la idea central: "La velocidad de este ciclo, no la genialidad de ningún paso individual, es lo que separa a un equipo que se adapta de uno que se queda mirando cómo cambió el mundo." Conexión: es la versión operacional, aplicable el lunes en la oficina, de todo lo que mostraron cardumen, micelio y hormigas.`
},

{
  id: 29, act: 'nosotros', kind: 'word',
  title: 'Conectar',
  visual: { type: 'word', palette: 'nosotros' },
  notes: `Cierre de la dimensión NOSOTROS con una sola palabra, que resume cardumen + micelio + hormigas + el ciclo de cinco verbos. Déjala sola, sin agregar mucho más — funciona como punto final del acto. Si quieres una frase de enlace hacia lo que sigue, algo breve: "Conectar entre personas es el segundo nivel. El tercero es más grande: es el sistema completo en el que esas personas trabajan." Eso te lleva a la Dimensión 3.`
},

// ============ ACTO V — DIMENSIÓN 3: ORGANIZACIÓN ============

{
  id: 30, act: 'org', kind: 'divider',
  kicker: 'Dimensión 3',
  title: 'Organización',
  sub: 'Cambiar el sistema.',
  visual: { type: 'word', palette: 'org', small: true },
  notes: `Tercera y última transición de acto. Tono: aquí es donde la charla se vuelve más directamente relevante para las decisiones que la audiencia de CENIT toma todos los días — estructuras, procesos, cultura. Puedes decir: "Y por último, el nivel más grande: no cómo cambio yo, ni cómo cambiamos entre nosotros, sino cómo está diseñado, desde su estructura, el sistema en el que todos trabajamos." Dale a esta transición un poco más de peso que a las dos anteriores — es el acto que más se conecta con las decisiones organizacionales reales de la sala.`
},

{
  id: 31, act: 'org', kind: 'contrast',
  kicker: 'Dos formas de diseñar una organización',
  title: 'Máquina o organismo.',
  visual: { type: 'contrast', palette: 'org' },
  notes: `Presenta el contraste central del Acto V con cuidado — el riesgo aquí es que suene a "la eficiencia es mala", y eso es exactamente lo que NO quieres decir; lo vas a matizar en un par de slides. Por ahora, solo plantea las dos metáforas de diseño organizacional: "Durante el último siglo, diseñamos la mayoría de nuestras organizaciones a imagen de una máquina: piezas intercambiables, procesos estandarizados, control centralizado, previsibilidad. Y funcionó extraordinariamente bien... mientras el entorno se movía despacio." Pausa. "La naturaleza diseña de otra forma: no como máquina, como organismo." Conexión: retoma "bosque" del preview de metáforas (slide 12), que todavía no habías desarrollado — este es su momento. Idea a recordar: no es una crítica moral a la eficiencia, es una comparación de dos arquitecturas distintas de organización.`
},

{
  id: 32, act: 'org', kind: 'metaphor',
  kicker: 'Sistema inmune',
  title: 'Un organismo sano no evita\nlas amenazas. Aprende de ellas.',
  visual: { type: 'blob', palette: 'org' },
  notes: `El sistema inmune es quizás la metáfora más rica de resiliencia organizacional, y la usas aquí porque conecta perfecto con "organismo, no máquina". No busca eliminar todo riesgo desde el diseño (eso sería imposible); en cambio, detecta amenazas nuevas, monta una respuesta específica, y —esto es lo más importante— guarda memoria de esa amenaza para responder más rápido la próxima vez (por eso funcionan las vacunas). "Una organización resiliente no es la que nunca enfrenta una crisis. Es la que, cada vez que enfrenta una, queda mejor preparada para la siguiente — igual que Toyota después de 1997." Conexión directa y explícita con la historia de apertura: de hecho, cuando Toyota enfrentó una disrupción de proveedores muchísimo mayor en 2011, tras el terremoto y tsunami de Tōhoku, aplicó lecciones aprendidas del incendio de Aisin para responder con más rapidez y mejor mapeo de su cadena de suministro. Fuente: inmunología adaptativa (memoria inmunológica) como analogía consolidada en literatura de resiliencia organizacional; sobre Toyota 2011, ver cobertura de Automotive News y GEP sobre cómo Toyota aplicó lecciones de 1997 tras el terremoto de Japón de 2011.`
},

{
  id: 33, act: 'org', kind: 'reframe',
  title: 'La eficiencia optimiza el presente.\nLa adaptabilidad protege el futuro.',
  visual: { type: 'contrast', palette: 'org', balanced: true },
  notes: `Esta es la slide más importante del Acto V — el matiz que evita que toda la charla suene anti-eficiencia, algo que sería ingenuo frente a una audiencia que dirige operaciones industriales reales. Sé explícito: "No estoy aquí para decirles que la eficiencia es el enemigo. La eficiencia es lo que permite que una operación como la de CENIT funcione todos los días con márgenes ajustados, seguridad operacional y disciplina de ejecución. Eso no se negocia." Pausa. "Pero una organización optimizada al cien por ciento para la eficiencia de hoy, sin ninguna capacidad de reserva para adaptarse, es exactamente tan frágil como Toyota lo era la madrugada del incendio: brillante en tiempos estables, y sin colchón cuando el terreno se mueve." Conexión: retoma el "cuatro horas de inventario" (slide 5) explícitamente — cierra ese círculo. Idea a recordar: no es eficiencia VERSUS adaptabilidad, es encontrar dónde una organización necesita rigidez y dónde necesita margen para experimentar.`
},

{
  id: 34, act: 'org', kind: 'radial',
  kicker: 'El entorno no es que vaya a cambiar',
  title: 'El mundo ya se está acelerando.',
  sub: 'Tecnología · Geopolítica · Clima · Nuevos modelos de negocio · Demografía · Inteligencia artificial',
  visual: { type: 'radial', palette: 'org' },
  notes: `Slide de contexto: nombra, sin detenerte largo en ninguno, los grandes vectores de aceleración del cambio que la audiencia ya vive en su día a día — tecnología, tensiones geopolíticas, cambio climático, nuevos modelos de negocio, cambios demográficos, e inteligencia artificial. El punto NO es hacer un diagnóstico exhaustivo de cada uno, es mostrar que son varios a la vez, y que ninguno de ellos, por sí solo, es "la causa" del cambio. "No hay un solo factor. Es la suma, y la simultaneidad, lo que hace que este momento se sienta distinto." Conexión: prepara el terreno para hablar específicamente de IA en la siguiente slide, sin dejar que IA se sienta como el tema central de la charla — es uno de seis, no el protagonista.`
},

{
  id: 35, act: 'org', kind: 'statement',
  kicker: 'Uno de esos aceleradores',
  title: 'La IA no inventó el cambio.\nEstá cambiando la velocidad\na la que tenemos que adaptarnos.',
  visual: { type: 'network', density: 'medium', palette: 'org', fast: true },
  notes: `Sé disciplinado aquí: esta es la única slide de la charla dedicada explícitamente a inteligencia artificial, y así debe sentirse — breve, precisa, sin caer en la tentación de explicar modelos, casos de uso o herramientas. El punto no es "cómo compites contra la IA" ni "qué tan lista está tu empresa para la IA". El punto es otro, y lo dices tal cual: "La pregunta que de verdad importa no es cómo competir contra la inteligencia artificial. Es cómo seguimos siendo humanos, curiosos y adaptables, en un entorno donde las reglas cambian cada vez más rápido." Conexión: retoma el diagrama de aceleradores de la slide anterior — la IA es uno de seis factores, no el tema de la charla. Idea a recordar: toda la charla ha sido, hasta este punto, sobre cómo desarrollar la capacidad de adaptación — la IA es simplemente la razón más visible, hoy, de por qué esa capacidad urge más que nunca.`
},

{
  id: 36, act: 'org', kind: 'bridge',
  kicker: 'Y en la industria energética',
  title: 'CENIT también vive su propio\nmomento Aisin.',
  sub: 'Transición energética. Digitalización. Nuevas tecnologías. Cambios regulatorios. Nuevos patrones de consumo. Incertidumbre geopolítica.',
  visual: { type: 'radial', palette: 'org', energy: true },
  notes: `Este es el puente hacia la audiencia específica de CENIT, y hay que manejarlo con cuidado: no es una slide sobre transición energética ni sobre el futuro del petróleo, y hay que decirlo explícitamente para que nadie lo malinterprete. "No vine a decirles que el petróleo va a desaparecer, ni a darles una charla sobre transición energética. Vine a decirles algo distinto: el sector energético está atravesando, al mismo tiempo, varios cambios profundos y simultáneos — regulatorios, tecnológicos, de consumo, geopolíticos — y ninguno de ellos se resuelve con un plan estático." Luego la pregunta que de verdad importa para ellos: "La pregunta no es si el mundo de la energía va a cambiar. Ya está cambiando. La pregunta es: ¿cómo construimos una organización capaz de seguir siendo relevante mientras cambia?" Conexión: es la aplicación directa, al contexto de la sala, de "la eficiencia protege el presente / la adaptabilidad protege el futuro" (slide 33). Idea a recordar: el mensaje es capacidad de adaptación, no un pronóstico sobre el futuro del sector.`
},

// ============ ACTO VI — CIERRE ============

{
  id: 37, act: 'close', kind: 'emotional',
  title: 'Nadie te preguntó si querías\nque el mundo cambiara así de rápido.',
  sub: 'Pero sí depende de ti qué tan capaz eres de moverte con él.',
  visual: { type: 'roots', seed: 5, palette: 'close', bloom: true, slow: true },
  notes: `Este es el momento emocional de la charla — bájale la velocidad al habla, no compitas con la imagen, deja espacio real entre frases. El objetivo de esta slide es mover a la audiencia de "las organizaciones tienen que adaptarse" (algo externo, abstracto, responsabilidad de otros) a "yo soy parte de esa capacidad de adaptación" (algo personal, presente, mío). Puedes decir, mirando a la sala, sin apuro: "Todo lo que hemos hablado hoy —Toyota, cardúmenes, micelio, hormigas, máquinas y organismos— puede sonar como algo que le pasa a las organizaciones, allá afuera, lejos de nosotros. Pero no es así. La organización no se adapta. Las personas que la componen, sí — o no." Pausa larga. "Y ustedes son esas personas." Luego cierra con: "Esa capacidad de adaptarse no es un talento con el que naces. Es una práctica. Se entrena cada vez que aprendes algo nuevo, cada vez que sueltas algo que ya no sirve, cada vez que le haces una pregunta genuina a alguien que piensa distinto a ti." Conexión: es la culminación emocional de las tres dimensiones ya recorridas. Evita cualquier frase que suene a cita motivacional genérica — esta reflexión debe sonar personal y específica a este momento de la charla, no intercambiable con cualquier otra presentación.`
},

{
  id: 38, act: 'close', kind: 'model',
  kicker: 'El modelo',
  title: 'Yo → Nosotros → Organización',
  sub: 'Aprender / Desaprender · Conectar / Colaborar · Percibir / Experimentar / Adaptarse',
  visual: { type: 'model', stage: 'final', palette: 'close' },
  notes: `Aquí cierras la estructura conceptual con el modelo visual más simple posible — este es el "llévate esto a casa" de toda la charla, así que dilo con total claridad, sin agregar matices nuevos. "Todo lo que vimos hoy se resume en tres pasos que se sostienen uno sobre otro. Yo: aprender y desaprender. Nosotros: conectar y colaborar. Organización: percibir, experimentar y adaptarse." Señala visualmente cómo cada nivel depende del anterior — no son tres temas separados, son capas concéntricas: sin la primera, la segunda no tiene con qué trabajar; sin la segunda, la tercera no tiene cómo activarse a escala. Conexión: recoge, en una sola imagen, las tres dimensiones completas de la charla (Actos III, IV y V). Es literalmente el resumen ejecutivo de los últimos 30 minutos.`
},

{
  id: 39, act: 'close', kind: 'statement',
  title: 'El cambio no empieza\nen la organización.',
  sub: 'Empieza en nuestra capacidad de cambiar.',
  visual: { type: 'roots', seed: 6, palette: 'close', bloom: true },
  notes: `Frase puente entre el modelo y el cierre final — es casi un eco, dicho más despacio, de lo que ya mostró la slide del modelo. No necesita mucha explicación adicional; funciona mejor casi en silencio, dejando que la audiencia conecte los puntos por sí misma. Si necesitas una frase de transición hacia el cierre: "Y con eso, quiero dejarles una última idea, la que quiero que se lleven de aquí." Eso lleva directo a la frase final.`
},

{
  id: 40, act: 'close', kind: 'final',
  title: 'No elegimos el cambio.\nElegimos quién somos frente a él.',
  visual: { type: 'roots', seed: 7, palette: 'close', bloom: true, hero: true },
  notes: `Última slide. Dila una sola vez, completa, sin repetirla ni explicarla — cualquier explicación adicional le resta fuerza a una frase de cierre. Deja que se quede en pantalla en silencio unos segundos antes de agradecer y ceder el espacio para preguntas o el cierre del evento. No necesitas volver a mencionar bioadaptabilidad, Toyota, ni ninguna de las metáforas — todo eso ya vive en la memoria de la audiencia; esta frase es la puerta de salida, el resumen de una hora en una sola línea. Idea final que debe quedar resonando: no tenemos control sobre la velocidad ni la naturaleza del cambio que viene — pero sí tenemos control, todos los días, sobre nuestra disposición a movernos con él.`
},

];

if (typeof module !== 'undefined' && module.exports) { module.exports = SLIDES; }

// Slide content data for the Bioadaptability keynote deck.
// kind: title | statement | stat | paradox | question | word | cycle | close
const ACTS = {
  1: "ACTO I — EL MUNDO CAMBIÓ",
  2: "ACTO II — LA PARADOJA DE LA EJECUCIÓN",
  3: "ACTO III — EL NUEVO CUELLO DE BOTELLA",
  4: "ACTO IV — MIRA A LA VIDA",
  5: "ACTO V — EL CEREBRO COLECTIVO",
  6: "ACTO VI — LA IA ENTRA AL SISTEMA",
  7: "ACTO VII — DE LO INDIVIDUAL AL SISTEMA",
  8: "ACTO VIII — LA ORGANIZACIÓN ADAPTATIVA",
  9: "ACTO IX — LA VENTAJA HUMANA",
};

const SLIDES = [
{ n:1, act:1, kind:"title", bg:"slide01.jpg",
  title:"BIOADAPTABILITY",
  subtitle:"Inteligencia colectiva, IA y el nuevo cuello de botella",
  notes:"Apertura en frío. No resumir la charla. Dejar el título en silencio un instante. Frase del orador: \"No voy a hablarles de biología. Ni de inteligencia artificial. Voy a hablarles de lo que pasa entre las personas, justo antes de que cualquiera de las dos cosas importe.\"" },

{ n:2, act:1, kind:"statement", bg:"slide02.jpg",
  text:"El cambio solía ser un evento.",
  notes:"Metáfora fundacional. Históricamente el cambio llegaba como eventos discretos alrededor de los cuales se podía organizar un \"proyecto de gestión del cambio\": una fusión, una recesión, una nueva regulación. Transición hacia la siguiente idea." },

{ n:3, act:1, kind:"statement", bg:"slide03.jpg",
  text:"Ahora es el clima.",
  notes:"Evidencia: WEF Future of Jobs Report 2025 — la IA y la tecnología de procesamiento de información afecta al 86% de las empresas; McKinsey State of AI 2025 — 88% usa IA regularmente en al menos una función. La adopción dejó de ser episódica y se volvió ambiental. Frase del orador: \"No programas un proyecto para adaptarte al clima. Vives dentro de él, permanentemente, o no vives dentro de él.\"" },

{ n:4, act:1, kind:"statement_small", bg:"slide04.jpg",
  text:"Casi todas nuestras organizaciones siguen construidas para un mundo con puntuación.",
  notes:"Transición al Acto II. Los instrumentos que las organizaciones construyeron para gestionar el cambio como evento son, todavía, los que la mayoría usa. Frase del orador: \"Puntos y aparte. Principios y finales. Vamos a hablar de qué pasa cuando la puntuación desaparece.\"" },

{ n:5, act:2, kind:"stat", bg:"slide05.jpg",
  big:"55.8%", label:"más rápido — desarrolladores con IA, en un ensayo controlado aleatorizado",
  sub:"+25% velocidad · +40% calidad, dentro de la frontera de competencia de la IA (BCG/HBS, 758 consultores)",
  notes:"Evidencia mínima y concreta, sin adornos corporativos. Cita: ensayo aleatorizado (Peng, Kalliamvakou, Cihon, Demirer, 2023) — desarrolladores con GitHub Copilot completaron una tarea definida 55.8% más rápido que el grupo de control. Cita: experimento de campo Dell'Acqua/Mollick/BCG-HBS (2023-25) — dentro de la competencia de la IA, los consultores con GPT-4 fueron +25% más rápidos y +40% más precisos. Frase del orador: \"Esto no es una promesa de marketing. Es un ensayo aleatorizado.\"" },

{ n:6, act:2, kind:"stat", bg:"slide06.jpg",
  big:"1 persona. 6 meses. $80M.",
  sub:"Base44 — una herramienta de creación de apps con IA, construida casi en solitario, vendida a Wix sin equipo ni capital de riesgo",
  notes:"Historia: Maor Shlomo construyó Base44 (una herramienta de creación de apps con IA) esencialmente solo, alcanzó 1M USD de ARR tres semanas después del lanzamiento, y vendió la empresa de seis meses a Wix por 80M USD en efectivo — sin contratar nunca un equipo ni levantar capital de riesgo. Punto: esto es lo que pasa cuando la distancia entre una idea y un producto enviado colapsa casi a cero para una sola persona. Transición: si una persona puede hacer esto, ¿qué pasa dentro de una organización de miles de estas personas?" },

{ n:7, act:2, kind:"paradox", bg:"slide07.jpg", label:"PARADOJA 1",
  text:"Cuanto más barato se vuelve ejecutar una idea, más caro se vuelve ejecutar una mala.",
  notes:"Paradoja 1, dicha directamente a la sala. No explicarla de inmediato — dejarla respirar. Luego: cuando ejecutar era lento, una mala idea moría en silencio durante un retraso de seis meses. Ahora se envía el viernes, frente a clientes, antes de que nadie haya tenido tiempo de estar seguro de que valía la pena construirla." },

{ n:8, act:2, kind:"question", bg:"slide08.jpg",
  text:"Si todos pueden ejecutar, ¿qué se vuelve escaso?",
  notes:"La pregunta bisagra de toda la charla. Decirla despacio. Dejarla en silencio 3-4 segundos completos antes de avanzar. Esta es la bisagra sobre la que gira el resto de la charla." },

{ n:9, act:2, kind:"word", bg:"slide09.jpg",
  text:"Juicio.",
  notes:"Transición al Acto III. No \"creatividad\", no \"talento\" en abstracto — específicamente la capacidad de juzgar, juntos, cuál de las infinitas cosas que ahora se pueden construir realmente vale la pena construir. Frase del orador: \"No creatividad. No talento. Juicio — y específicamente, juicio que más de una persona acordó.\"" },

{ n:10, act:3, kind:"statement", bg:"slide10.jpg",
  text:"El sensemaking no es una habilidad blanda. Ahora es todo el juego.",
  notes:"Definición sin jerga: el proceso continuo y social de notar un cambio, construir una historia compartida sobre lo que significa, y comprometerse a actuar sobre esa historia antes de que sea tarde para que importe. Siempre existió en las organizaciones. Nunca fue la restricción antes, porque ejecutar era más lento que dar sentido. Ahora dar sentido suele ser el paso más lento del proceso." },

{ n:11, act:3, kind:"stat", bg:"slide11.jpg",
  big:"$250M",
  label:"perdidos cada año — una empresa Fortune 500 típica, por procesos de decisión deficientes",
  sub:"Solo ~20% de las organizaciones sobresale en toma de decisiones (McKinsey, 2019)",
  notes:"Evidencia: la encuesta global de decisiones de McKinsey (2019) encontró que solo ~20% de las organizaciones sobresale en toma de decisiones; 61% dice que al menos la mitad de su tiempo de decisión se usa mal; una empresa Fortune 500 típica pierde ~530.000 días-gerente al año — unos 250M USD — por procesos de decisión deficientes. Punto: esto ya era cierto antes de la IA generativa. La IA solo eliminó cualquier otra excusa." },

{ n:12, act:3, kind:"paradox", bg:"slide12.jpg", label:"PARADOJA 2",
  text:"No construimos organizaciones lentas por accidente. La lentitud atrapaba el mal juicio antes de que se enviara. La IA no arregló la falla del mecanismo. Borró el mecanismo.",
  notes:"Esta paradoja reformula la lentitud burocrática — usualmente ridiculizada — como algo que hacía un trabajo real, aunque torpe: era un limitador de velocidad para el error. La charla no añora la burocracia. Está nombrando lo que hay que reemplazar, no solo eliminar." },

{ n:13, act:3, kind:"statement", bg:"slide13.jpg",
  text:"Esto no es un problema nuevo. La vida lleva 3.800 millones de años resolviéndolo.",
  notes:"Puente hacia el Acto IV. Las organizaciones tienen unos 200 años como institución diseñada. El sensado distribuido y la decisión colectiva bajo incertidumbre es un problema que la biología lleva iterando desde el origen de la vida. No somos el primer sistema en enfrentarlo. Frase del orador: \"Así que antes de diseñar algo nuevo, vale la pena mirar qué ya funciona.\"" },

{ n:14, act:4, kind:"statement_small", bg:"slide14.jpg",
  text:"Nada de lo que van a ver es una metáfora del trabajo en equipo. Es el mecanismo.",
  notes:"Slide de encuadre antes de la secuencia de naturaleza. Decir explícitamente a la audiencia: esto no es una lección de biología, ni una analogía simpática. Cada sistema que sigue corre sobre un mecanismo documentado, con un equivalente directo en cómo circula la información en una empresa." },

{ n:15, act:4, kind:"statement", bg:"slide15.jpg",
  text:"Micelio: la inteligencia vive en la red, nunca en un solo nodo.",
  notes:"Evidencia: el estudio de Suzanne Simard en Nature (1997, el artículo que acuñó \"wood-wide web\") mostró carbono moviéndose entre especies de árboles distintas a través de redes fúngicas micorrízicas compartidas; su investigación de Mother Tree muestra que los árboles \"madre\", muy conectados, amortiguan y redistribuyen recursos desproporcionadamente hacia plántulas estresadas, y que remover esos árboles-hub daña medible mente la regeneración de todo el rodal. Traducción organizacional: invertir en las personas y equipos \"hub\" de la organización — por quienes muchos otros enrutan información y confianza sin que estén en el organigrama." },

{ n:16, act:4, kind:"statement", bg:"slide16.jpg",
  text:"Las abejas no votan por la más ruidosa. Esperan un quorum.",
  notes:"Evidencia: Honeybee Democracy de Thomas Seeley (2010) — cientos de abejas exploradoras evalúan de forma independiente sitios candidatos para el nuevo nido; los mejores sitios reciben danzas del meneo más largas y vigorosas, reclutando más exploradoras; el enjambre se compromete solo cuando hay ~15-20 exploradoras presentes simultáneamente en un sitio — un quorum, no un voto mayoritario ni un defensor fuerte. Traducción organizacional: un buen proceso de decisión no pregunta \"quién argumentó más fuerte\", pregunta \"cuántas personas independientes, que de verdad fueron a comprobarlo, llegaron al mismo lugar\"." },

{ n:17, act:4, kind:"statement", bg:"slide17.jpg",
  text:"Ningún pájaro ve la forma. La forma es lo que queda cuando nadie está al mando.",
  notes:"Evidencia: la investigación de Iain Couzin (Nature, 2005) muestra que una pequeña minoría informada —a veces menos del 10%— puede guiar con precisión a un grupo grande, porque la copia local amplifica la señal; su artículo de Science (2011) encontró el giro contraintuitivo de que añadir individuos no informados a un grupo dividido entre dos facciones informadas restaura el consenso mayoritario y evita que una minoría vocal capture la decisión. Traducción organizacional: las personas más calladas y menos opinativas en una reunión pueden estar haciendo más por proteger la calidad de la decisión que la más articulada." },

{ n:18, act:4, kind:"statement", bg:"slide18.jpg",
  text:"Tu sistema inmune nunca pide permiso para notar que algo anda mal.",
  notes:"Evidencia: la inmunidad innata da a cada célula un reconocimiento de patrones barato, rápido y genérico (detectar primero, preguntar después); la inmunidad adaptativa genera enorme diversidad y luego amplifica clonalmente lo que específicamente coincide con la amenaza — detectar barato y ampliamente en todas partes, y luego escalar rápido una respuesta precisa una vez confirmada una amenaza real, guardando memoria para la próxima vez. Traducción organizacional: no centralices el derecho a notar que algo anda mal. Centraliza, en cambio, qué tan rápido se financia una señal ya confirmada." },

{ n:19, act:4, kind:"statement", bg:"slide19.jpg",
  text:"Un bosque que nunca se quema no está sano. Está atrasado.\n\nNinguno de estos sistemas es más inteligente que las personas en esta sala. Su coordinación sí lo es.",
  notes:"Evidencia: la investigación de resiliencia de C.S. Holling (1973) y el \"ciclo adaptativo\" — los sistemas que sobreoptimizan el crecimiento eficiente y muy conectado (la fase \"K\") se vuelven frágiles; la perturbación periódica y la reorganización, alimentadas por la diversidad acumulada en la fase estable, es lo que mantiene adaptativo al sistema a largo plazo. Traducción organizacional: una organización con cero proyectos fallidos, cero productos descontinuados, cero desacuerdo interno no está sana — está acumulando una fragilidad que aún no ha pagado. Entregar la frase de giro como el cierre-tesis del acto, y hacer una pausa antes del Acto V." },

{ n:20, act:5, kind:"statement", bg:"slide20.jpg",
  text:"Un grupo puede ser más inteligente que su miembro más inteligente. La evidencia es real — y está en disputa.",
  notes:"Evidencia presentada con honestidad: Woolley, Chabris, Pentland, Hashmi y Malone (Science, 2010) encontraron un \"factor de inteligencia colectiva\" estadístico que predice el desempeño grupal en muchas tareas, correlacionado con la sensibilidad social promedio y la equidad en los turnos de habla — apenas correlacionado con el CI promedio o máximo del grupo. Pero: Credé y Howardson (2017) publicaron un desafío metodológico directo argumentando que los datos no sostienen un factor general único; el debate sigue vivo en la literatura (meta-análisis de 2021 con resultados mixtos). Decir esto con claridad: la audiencia no debe irse pensando que esto es ciencia cerrada — debe irse sabiendo que es un argumento real, todavía abierto, lo cual es más creíble que una historia limpia." },

{ n:21, act:5, kind:"paradox", bg:"slide21.jpg", label:"PARADOJA 3",
  text:"La persona más inteligente de la sala no siempre es la parte más inteligente de la sala.",
  notes:"Evidencia: Groupthink de Irving Janis (1972) — grupos cohesivos y de alto consenso (sus casos: Bahía de Cochinos, Pearl Harbor) suprimieron sistemáticamente la disidencia y tomaron peores decisiones de las que habrían tomado individuos solos; Steiner (1972) formalizó la \"pérdida de proceso\" — la producción real del grupo = producción potencial menos pérdidas reales de coordinación y motivación. Este es el problema de \"demasiados cocineros\", medido, no folclore." },

{ n:22, act:5, kind:"statement", bg:"slide22.jpg",
  text:"La diversidad no vuelve automáticamente más inteligente a un grupo. Vuelve más ruidosa a la pregunta equivocada.",
  notes:"Evidencia, complicando deliberadamente el elogio anterior a la diversidad: el hallazgo de Scott Page de que \"la diversidad vence a la habilidad\" (The Difference, 2007) se sostiene específicamente para problemas difíciles sin un solucionador dominante, y solo con buena comunicación y objetivos compartidos — su propio trabajo posterior (\"Diversity Paradoxes\") mapea cuándo falla. La investigación de \"líneas de fractura\" de Jehn, Northcraft y Neale muestra que cuando la diversidad divide a un grupo a lo largo de líneas demográficas correlacionadas en vez de cruzarlas, aumenta el conflicto en lugar del insight. Punto: \"más personas diferentes\" no es la palanca. \"Las diferencias correctas y cruzadas, con comunicación real\", sí lo es." },

{ n:23, act:5, kind:"statement_small", bg:"slide23.jpg",
  text:"Doscientos proveedores reconstruyeron una cadena de suministro desde un fax y un rumor. Nadie se los ordenó.",
  notes:"Historia: el incendio de Aisin en 1997 destruyó la única fuente de Toyota para una válvula de freno crítica, arrasando más de 6.000 moldes. Más de 200 empresas proveedoras independientes se autoorganizaron sin coordinación central —algunas sin experiencia previa fabricando esa pieza— re-diseñando herramental a partir de planos enviados por fax, compitiendo informalmente por ser las primeras con una pieza funcional. Toyota reanudó la producción en dos días; la recuperación completa tomó unos cinco, frente a predicciones externas de semanas. Punto: nadie diseñó esta recuperación. Emergió de una red densa y de confianza actuando sobre información local en paralelo — esto es una red de micelio real, en una cadena de suministro de autopartes." },

{ n:24, act:5, kind:"statement", bg:"slide24.jpg",
  text:"La seguridad psicológica no es un póster de cultura. Es el cableado que permite a la red esquivar el daño.",
  notes:"Evidencia: el estudio de campo de Amy Edmondson con 51 equipos (1999) encontró que la seguridad psicológica —no la confianza o eficacia del equipo— predecía el comportamiento de aprendizaje, que a su vez predecía el desempeño. El estudio interno Project Aristotle de Google (2015, 180+ equipos) encontró independientemente que la seguridad psicológica importaba más que quién estaba en el equipo. Traducción organizacional: no es un beneficio blando. Es la precondición para que la información del grupo realmente circule en vez de quedarse retenida en silencio." },

{ n:25, act:5, kind:"statement_small", bg:"slide25.jpg",
  text:"Ahora pongan una máquina en la sala.",
  notes:"Puente hacia el Acto VI. Todo lo discutido hasta ahora —quorum, diversidad, seguridad psicológica, pérdida de proceso— describe cómo piensan juntos los humanos. ¿Qué pasa cuando uno de los participantes de esa sala no es humano?" },

{ n:26, act:6, kind:"stat", bg:"slide26.jpg",
  big:"700 empleados",
  label:"de trabajo equivalente. Un asistente de IA. Un mes.",
  sub:"Klarna, 2024 — 2.3 millones de chats gestionados; tiempo de resolución de 11 a 2 minutos",
  notes:"Historia: el asistente de servicio al cliente de Klarna, construido sobre OpenAI, gestionó 2.3 millones de chats en su primer mes de 2024 — el equivalente al trabajo de 700 agentes de tiempo completo — reduciendo el tiempo promedio de resolución de 11 minutos a 2. Esto es real, no es exageración, y ocurrió en semanas, no en años." },

{ n:27, act:6, kind:"paradox", bg:"slide27.jpg", label:"PARADOJA 4",
  text:"El CEO de Klarna admitió después haber \"cortado demasiado, demasiado rápido\" — y recontrató a los humanos.",
  notes:"La corrección: para 2025, el CEO de Klarna dijo públicamente que la calidad había sufrido y reincorporó agentes humanos. Este es el ejemplo real más claro disponible para la tesis central de toda la charla: la ejecución (gestionar el volumen de chats) nunca fue el problema. El juicio (cuánto empujar la sustitución, y cuándo) sí lo fue — y ese juicio falló a nivel de decisión individual, no al nivel de ejecución de la IA." },

{ n:28, act:6, kind:"statement", bg:"slide28.jpg",
  text:"La IA te vuelve más creativo a ti. Puede volverlos a todos ustedes iguales.",
  notes:"Evidencia, contradicción deliberada del optimismo tecnológico: Bogert, Schecter y Watson (Science Advances, 2024) encontraron que los escritores que usaban IA generativa producían historias individualmente más creativas y mejor evaluadas — pero el conjunto resultante de historias era medible mente más similar entre sí. Individualmente novedoso, colectivamente homogéneo. Punto: la ejecución individual más barata no se suma automáticamente a un colectivo más inteligente. Sin gestión, puede reducirlo en silencio." },

{ n:29, act:6, kind:"statement", bg:"slide29.jpg",
  text:"La pregunta nunca fue qué tan inteligentes son ustedes con IA. Es qué tan inteligente es lo que construyen juntos.",
  notes:"Frase de reencuadre que cierra el acto. Cada individuo en la organización ahora tiene acceso a algo cercano a un equipo de investigación, un estudio de diseño y un departamento de ingeniería, bajo demanda. El organigrama no se ha puesto al día con lo que eso significa. Transición al Acto VII." },

{ n:30, act:7, kind:"statement_small", bg:"slide30.jpg",
  text:"Aficionados resolvieron una estructura proteica que profesionales no pudieron descifrar en más de una década — en diez días.",
  notes:"Historia: el grupo Foldit Contenders —jugadores de un juego de plegamiento de proteínas en línea, la mayoría sin formación en bioquímica— resolvió la estructura cristalina de una proteasa retroviral que había frustrado a biólogos estructurales profesionales durante más de una década, en unos diez días; están acreditados como coautores en el artículo revisado por pares de Nature Structural & Molecular Biology. Punto: esta no es una historia sobre IA. Es un recordatorio de que \"el sistema es más inteligente que cualquier individuo dentro de él\" no es una idea nueva que introdujo la IA — la IA es lo que pasa cuando se añade un nuevo tipo de participante a un juego muy antiguo." },

{ n:31, act:7, kind:"paradox", bg:"slide31.jpg", label:"PARADOJA 5",
  text:"Construimos la IA para hacer más poderosos a los individuos. Las organizaciones que ganen la usarán para hacer más honesto al grupo.",
  notes:"Esta es la última paradoja y la afirmación más clara del mecanismo de la tesis: la capacidad individual y la inteligencia colectiva no son la misma variable, y optimizar fuerte por una no garantiza ganancias en la otra — a veces, según la evidencia de homogeneización, una se cambia por la otra. La elección deliberada de diseño es lo que cierra esa brecha." },

{ n:32, act:8, kind:"cycle", bg:"slide32.jpg",
  steps:["SENTIR","INTERPRETAR","CONECTAR","EXPERIMENTAR","ACTUAR","APRENDER","ADAPTAR"],
  notes:"Presentar esto como la conclusión lógica de todo lo ya mostrado — la secuencia explorar-danzar-quorum del enjambre de abejas, la secuencia detectar-amplificar-recordar del sistema inmune, y la secuencia del cordón andon de Toyota son todas instancias del mismo bucle subyacente. No introducirlo como un framework nuevo; introducirlo como \"aquí está el patrón que ya vieron cinco veces esta noche, nombrado\"." },

{ n:33, act:8, kind:"statement_small", bg:"slide33.jpg",
  text:"Cualquier trabajador de la línea puede detener una fábrica de miles de millones de dólares. A propósito.",
  notes:"Evidencia: el cordón andon de Toyota — cualquier trabajador de la línea de ensamblaje, no un supervisor, puede detener la línea en el instante en que detecta un problema (Jidoka, \"automatización con un toque humano\"). Esta es una empresa que rediseñó deliberadamente en qué parte de la jerarquía vive la autoridad para decir \"algo anda mal\" — empujándola hacia quien está más cerca de la señal, no hacia quien tiene el título más alto. Traducción organizacional: preguntar, honestamente, quién en la organización tiene hoy autoridad de \"cordón andon\" — y si es la persona más cercana al problema." },

{ n:34, act:8, kind:"statement_small", bg:"slide34.jpg",
  text:"No toda red sobrevive el contacto con la escala. Hay que decirlo.",
  notes:"Contraejemplo necesario, por honestidad intelectual: el \"modelo Spotify\" de squads autónomos se publicó en 2012 como una fotografía de un momento, no como una prescripción — y fue copiado por miles de empresas de todas formas. En 2020, un ex-empleado de Spotify documentó en detalle que la propia empresa lo había abandonado silenciosamente: la autonomía sin mecanismos de coordinación reales produjo stacks tecnológicos duplicados y luchas de poder no resueltas. La lección no es \"descentralizar\". Es \"descentralizar con la misma seriedad que le pondrías a cualquier otra pieza de arquitectura — y estar dispuesto a decir cuándo no está funcionando\"." },

{ n:35, act:9, kind:"close", bg:"slide35.jpg",
  text:"Inteligencia humana. Por inteligencia artificial. Por inteligencia colectiva.\nLa ventaja está en el producto, no en ningún término por separado.",
  quote:"Quizá la ventaja nunca estuvo en la persona más inteligente del edificio, ni en el modelo más poderoso corriendo en sus servidores. Quizá siempre estuvo en qué tan rápido un grupo de personas — y ahora, los sistemas que construyen junto a ellas — pueden convertir una señal débil en una decisión compartida. Ese fue siempre el verdadero trabajo. La IA solo hizo imposible seguir fingiendo que no lo era.",
  notes:"Cierre. Decir la línea final despacio. Dejar que la imagen se sostenga. Terminar en silencio — sin diapositiva de \"gracias\", sin recapitulación en viñetas, sin logo. Dejar que la sala se quede con esto un instante antes del aplauso." },
];

module.exports = { ACTS, SLIDES };

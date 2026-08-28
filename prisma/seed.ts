import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DIMENSIONS = [
  { key: "trust", name: "Confianza", description: "Capacidad de confiar en la palabra e intención de los demás.", sortOrder: 1 },
  { key: "psychological_safety", name: "Seguridad psicológica", description: "Poder hablar, disentir y equivocarse sin miedo.", sortOrder: 2 },
  { key: "information_flow", name: "Flujo de información", description: "Qué tan bien circula la información relevante.", sortOrder: 3 },
  { key: "knowledge_sharing", name: "Compartir conocimiento", description: "Con qué facilidad el conocimiento se mueve entre personas.", sortOrder: 4 },
  { key: "cross_functional", name: "Colaboración transversal", description: "Facilidad para trabajar entre áreas distintas.", sortOrder: 5 },
  { key: "conversation_quality", name: "Calidad de las conversaciones", description: "Qué tan productivas y honestas son las conversaciones.", sortOrder: 6 },
  { key: "decision_making", name: "Toma de decisiones", description: "Claridad y calidad de cómo se deciden las cosas.", sortOrder: 7 },
  { key: "autonomy", name: "Autonomía", description: "Margen para actuar sin fricción innecesaria.", sortOrder: 8 },
  { key: "collective_learning", name: "Aprendizaje colectivo", description: "Capacidad de aprender de los errores como organización.", sortOrder: 9 },
  { key: "adaptability", name: "Adaptabilidad", description: "Velocidad y comodidad para cambiar de rumbo.", sortOrder: 10 },
] as const;

type SeedQuestion = { code: string; text: string; reverseScored?: boolean; sortOrder: number };

const QUESTIONS: Record<(typeof DIMENSIONS)[number]["key"], SeedQuestion[]> = {
  trust: [
    { code: "T1", text: "Puedo contar con que mis compañeros cumplirán lo que prometen.", sortOrder: 1 },
    { code: "T2", text: "Cuando alguien comete un error, el equipo asume buena intención antes de juzgar.", sortOrder: 2 },
    { code: "T3", text: "En mi organización, la gente suele guardarse información \"por si acaso\".", reverseScored: true, sortOrder: 3 },
  ],
  psychological_safety: [
    { code: "PS1", text: "Puedo expresar una opinión distinta a la de mi jefe sin temor a consecuencias.", sortOrder: 1 },
    { code: "PS2", text: "Está bien admitir que no sé algo delante de mi equipo.", sortOrder: 2 },
    { code: "PS3", text: "Los errores aquí se recuerdan más de lo que se aprende de ellos.", reverseScored: true, sortOrder: 3 },
  ],
  information_flow: [
    { code: "IF1", text: "La información importante llega a quien la necesita, cuando la necesita.", sortOrder: 1 },
    { code: "IF2", text: "Me entero de decisiones que me afectan después de que ya se tomaron.", reverseScored: true, sortOrder: 2 },
    { code: "IF3", text: "Es fácil encontrar quién sabe qué dentro de la organización.", sortOrder: 3 },
  ],
  knowledge_sharing: [
    { code: "KS1", text: "Cuando alguien aprende algo útil, lo comparte con los demás sin que se lo pidan.", sortOrder: 1 },
    { code: "KS2", text: "Existen espacios o hábitos claros para compartir conocimiento entre equipos.", sortOrder: 2 },
    { code: "KS3", text: "El conocimiento se queda atrapado en personas específicas.", reverseScored: true, sortOrder: 3 },
  ],
  cross_functional: [
    { code: "CF1", text: "Los equipos de distintas áreas colaboran con facilidad cuando es necesario.", sortOrder: 1 },
    { code: "CF2", text: "Cruzar información o trabajo entre áreas suele generar fricción.", reverseScored: true, sortOrder: 2 },
    { code: "CF3", text: "Las prioridades de un área rara vez chocan sin resolverse con las de otra.", sortOrder: 3 },
  ],
  conversation_quality: [
    { code: "CQ1", text: "Las reuniones en mi organización suelen llegar a algo útil.", sortOrder: 1 },
    { code: "CQ2", text: "Podemos tener desacuerdos sin que se vuelvan personales.", sortOrder: 2 },
    { code: "CQ3", text: "Muchas conversaciones importantes ocurren fuera de las reuniones oficiales, en pasillos o chats privados.", reverseScored: true, sortOrder: 3 },
  ],
  decision_making: [
    { code: "DM1", text: "Entiendo cómo y quién toma las decisiones importantes que me afectan.", sortOrder: 1 },
    { code: "DM2", text: "Las decisiones se toman con la información y las personas adecuadas.", sortOrder: 2 },
    { code: "DM3", text: "Muchas decisiones se revierten o se vuelven a discutir poco después de tomarse.", reverseScored: true, sortOrder: 3 },
  ],
  autonomy: [
    { code: "A1", text: "Tengo margen para decidir cómo hacer mi trabajo, no solo qué hacer.", sortOrder: 1 },
    { code: "A2", text: "Puedo actuar sin pedir permiso para cada paso.", sortOrder: 2 },
    { code: "A3", text: "Necesito muchas aprobaciones para avanzar en tareas simples.", reverseScored: true, sortOrder: 3 },
  ],
  collective_learning: [
    { code: "CL1", text: "Cuando algo sale mal, la organización cambia algo para que no vuelva a pasar.", sortOrder: 1 },
    { code: "CL2", text: "Aprendemos de otros equipos, no solo del propio.", sortOrder: 2 },
    { code: "CL3", text: "Los mismos errores tienden a repetirse en distintos equipos o momentos.", reverseScored: true, sortOrder: 3 },
  ],
  adaptability: [
    { code: "AD1", text: "La organización ajusta el rumbo con rapidez cuando la realidad cambia.", sortOrder: 1 },
    { code: "AD2", text: "Probar algo nuevo se siente seguro, no arriesgado.", sortOrder: 2 },
    { code: "AD3", text: "Cambiar de plan aquí se vive como un fracaso, no como algo normal.", reverseScored: true, sortOrder: 3 },
  ],
};

async function main() {
  const dimensionRecords = await Promise.all(
    DIMENSIONS.map((d) =>
      prisma.dimension.upsert({
        where: { key: d.key },
        update: { name: d.name, description: d.description, sortOrder: d.sortOrder },
        create: d,
      })
    )
  );
  const dimensionByKey = new Map(dimensionRecords.map((d) => [d.key, d]));

  const assessment = await prisma.assessment.upsert({
    where: { id: "seed-assessment-v1" },
    update: {},
    create: {
      id: "seed-assessment-v1",
      name: "Diagnóstico de Colaboración Nodo",
      version: 1,
      isActive: true,
    },
  });

  for (const dim of DIMENSIONS) {
    const dimension = dimensionByKey.get(dim.key)!;
    for (const q of QUESTIONS[dim.key]) {
      await prisma.question.upsert({
        where: { assessmentId_code: { assessmentId: assessment.id, code: q.code } },
        update: {
          text: q.text,
          reverseScored: !!q.reverseScored,
          sortOrder: q.sortOrder,
          dimensionId: dimension.id,
        },
        create: {
          assessmentId: assessment.id,
          dimensionId: dimension.id,
          code: q.code,
          text: q.text,
          reverseScored: !!q.reverseScored,
          sortOrder: q.sortOrder,
        },
      });
    }
  }

  console.log(`Seeded ${DIMENSIONS.length} dimensions and 30 questions for assessment "${assessment.name}".`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

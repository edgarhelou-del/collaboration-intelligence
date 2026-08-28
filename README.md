# Nodo — Collaboration Intelligence

Un diagnóstico de 30 preguntas que mide la capacidad de colaboración de una
organización a través de 10 dimensiones (confianza, seguridad psicológica,
flujo de información, compartir conocimiento, colaboración transversal,
calidad de las conversaciones, toma de decisiones, autonomía, aprendizaje
colectivo y adaptabilidad). SaaS multi-tenant: cada organización se aísla
por dominio corporativo.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- PostgreSQL + Prisma
- Autenticación propia (JWT en cookie httpOnly + bcrypt), sin dependencias externas

## Desarrollo local

```bash
cp .env.example .env   # y completa DATABASE_URL / JWT_SECRET
npm install
npm run db:push        # crea las tablas a partir de prisma/schema.prisma
npm run db:seed        # carga las 10 dimensiones y 30 preguntas
npm run dev
```

Flujo para probarlo de punta a punta:

1. `/register` — crea una organización + su admin (el email debe coincidir con el dominio indicado).
2. Desde `/dashboard`, "Lanzar diagnóstico" crea una sesión activa.
3. `/join` — cualquier persona con un email del mismo dominio se une como participante.
4. `/assessment` — responde las 30 preguntas (autoguardado por pregunta, se puede continuar después).
5. Al llegar a 5 respuestas completas (configurable en `/settings`), `/results/[sessionId]` muestra el score general, por dimensión, fortalezas, oportunidades y fricciones.

## Notas de arquitectura

- **Multi-tenant**: todo dato de negocio cuelga de `organizationId`; cada
  query de API se filtra por la organización de la sesión autenticada.
- **Privacidad**: los scores agregados (`Score`) son la única tabla que leen
  las vistas de admin — nunca `Response` directamente — y solo se calculan
  cuando una sesión alcanza `minResponsesForResults` (por defecto 5).
- **Analítica futura**: `AssessmentSession` y `Score` están versionados por
  sesión para poder comparar una organización consigo misma en el tiempo, y
  el modelo está listo para un futuro `BenchmarkCohort` agregado entre
  organizaciones.
- **Email**: forgot-password e invitaciones generan tokens/enlaces pero no
  envían correo real todavía (se loguean en consola) — falta conectar un
  proveedor transaccional.
- **Identidad visual**: los tokens de `tailwind.config.ts` son un placeholder
  (crema/índigo/coral, Inter + Fraunces) a la espera de la tarjeta de
  referencia para adaptarlos.

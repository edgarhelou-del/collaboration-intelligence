import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-24">
      <p className="mb-6 text-sm font-medium uppercase tracking-widest text-indigo">Nodo · Collaboration Intelligence</p>
      <h1 className="font-serif text-4xl leading-tight text-ink sm:text-6xl">
        La colaboración no solo encuentra mejores respuestas.
        <br />
        Descubre qué preguntas deberías estar haciendo.
      </h1>
      <p className="mt-8 max-w-xl text-lg text-ink/70">
        Un diagnóstico de 30 preguntas que hace visible algo normalmente invisible: cómo fluye la
        confianza, el conocimiento y las decisiones dentro de tu organización.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <Link href="/register" className="btn-primary">
          Crear mi organización
        </Link>
        <Link href="/login" className="btn-secondary">
          Iniciar sesión
        </Link>
      </div>
      <p className="mt-16 text-sm text-ink/40">
        Toma ~10 minutos. Los resultados se presentan como una fotografía de percepción, no como un
        veredicto.
      </p>
    </main>
  );
}

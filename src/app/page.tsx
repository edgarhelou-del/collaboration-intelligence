import Link from "next/link";
import { Logo } from "@/components/Logo";
import { NetworkMotif } from "@/components/NetworkMotif";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <NetworkMotif className="pointer-events-none absolute -right-24 top-0 h-[130%] w-auto max-w-none opacity-80 sm:-right-10" />

      <div className="relative mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-16">
        <Logo />

        <div className="flex flex-1 flex-col justify-center py-16">
          <span className="mb-8 h-px w-16 bg-gold" />
          <h1 className="max-w-2xl font-serif text-4xl leading-tight text-paper sm:text-6xl">
            La colaboración no solo encuentra mejores respuestas.
            <br />
            Descubre qué preguntas deberías estar haciendo.
          </h1>
          <p className="mt-8 max-w-xl text-lg text-paper/60">
            Un diagnóstico de 30 preguntas que hace visible algo normalmente invisible: cómo fluye la
            confianza, el conocimiento y las decisiones dentro de tu organización.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/login" className="btn-primary">
              Iniciar sesión
            </Link>
            <Link href="/register" className="btn-secondary">
              Crear organización
            </Link>
          </div>
          <p className="mt-6 text-sm text-paper/50">
            ¿Tu organización ya existe?{" "}
            <Link href="/join" className="text-gold">
              Únete a tu equipo
            </Link>
          </p>
        </div>

        <p className="text-sm uppercase tracking-widest text-paper/30">
          Toma ~10 minutos · una fotografía de percepción, no un veredicto
        </p>
      </div>
    </main>
  );
}

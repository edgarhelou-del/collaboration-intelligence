"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthShell, ErrorText, useFormSubmit } from "@/components/AuthForm";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  const { submit, error, loading } = useFormSubmit("/api/auth/login", () => {
    const next = searchParams.get("next") ?? "/dashboard";
    router.push(next);
    router.refresh();
  });

  return (
    <AuthShell title="Inicia sesión" subtitle="Entra a tu espacio de organización.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit({ email, password, rememberMe });
        }}
      >
        <ErrorText error={error} />
        <div>
          <label className="mb-1 block text-sm text-paper/70">Email</label>
          <input
            className="input"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@empresa.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-paper/70">Contraseña</label>
          <input
            className="input"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-paper/70">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-line"
            />
            Recordarme
          </label>
          <Link href="/forgot-password" className="text-gold">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Entrando…" : "Iniciar sesión"}
        </button>
        <p className="text-center text-sm text-paper/60">
          ¿No tienes organización?{" "}
          <Link href="/register" className="text-gold">
            Créala aquí
          </Link>
        </p>
        <p className="text-center text-sm text-paper/60">
          ¿Te unes a tu equipo?{" "}
          <Link href="/join" className="text-gold">
            Regístrate con tu email corporativo
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

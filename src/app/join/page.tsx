"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, ErrorText, useFormSubmit } from "@/components/AuthForm";

export default function JoinPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const { submit, error, loading } = useFormSubmit("/api/auth/join", () => {
    router.push("/assessment");
    router.refresh();
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <AuthShell title="Únete a tu organización" subtitle="Usa tu email corporativo para que te conectemos con tu equipo.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(form);
        }}
      >
        <ErrorText error={error} />
        <div>
          <label className="mb-1 block text-sm text-ink/70">Tu nombre</label>
          <input className="input" required value={form.name} onChange={(e) => update("name", e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Email corporativo</label>
          <input
            className="input"
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="tu@empresa.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Contraseña</label>
          <input
            className="input"
            required
            type="password"
            minLength={8}
            value={form.password}
            onChange={(e) => update("password", e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Confirmar contraseña</label>
          <input
            className="input"
            required
            type="password"
            minLength={8}
            value={form.confirmPassword}
            onChange={(e) => update("confirmPassword", e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading}>
          {loading ? "Creando cuenta…" : "Unirme"}
        </button>
        <p className="text-center text-sm text-ink/60">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="text-indigo">
            Inicia sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

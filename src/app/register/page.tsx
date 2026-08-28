"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthShell, ErrorText, useFormSubmit } from "@/components/AuthForm";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    organizationName: "",
    domain: "",
    adminName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { submit, error, loading } = useFormSubmit("/api/auth/register", () => {
    router.push("/dashboard");
    router.refresh();
  });

  function update<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  return (
    <AuthShell title="Crea tu organización" subtitle="Un espacio propio, aislado, para tu equipo.">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit(form);
        }}
      >
        <ErrorText error={error} />
        <div>
          <label className="mb-1 block text-sm text-ink/70">Nombre de la empresa</label>
          <input
            className="input"
            required
            value={form.organizationName}
            onChange={(e) => update("organizationName", e.target.value)}
            placeholder="Acme"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Dominio corporativo</label>
          <input
            className="input"
            required
            value={form.domain}
            onChange={(e) => update("domain", e.target.value)}
            placeholder="acme.com"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Tu nombre</label>
          <input
            className="input"
            required
            value={form.adminName}
            onChange={(e) => update("adminName", e.target.value)}
            placeholder="María Pérez"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Email corporativo</label>
          <input
            className="input"
            required
            type="email"
            value={form.email}
            onChange={(e) => update("email", e.target.value)}
            placeholder="maria@acme.com"
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
          {loading ? "Creando…" : "Crear organización"}
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

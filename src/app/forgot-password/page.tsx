"use client";

import { useState } from "react";
import { AuthShell, useFormSubmit } from "@/components/AuthForm";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const { submit, loading } = useFormSubmit("/api/auth/forgot-password", () => setSent(true));

  return (
    <AuthShell title="Recuperar contraseña" subtitle="Te enviaremos instrucciones a tu email.">
      {sent ? (
        <p className="rounded-xl bg-indigo-light px-4 py-3 text-sm text-indigo">
          Si el email existe en nuestro sistema, recibirás instrucciones en breve.
        </p>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            submit({ email });
          }}
        >
          <div>
            <label className="mb-1 block text-sm text-ink/70">Email</label>
            <input
              className="input"
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@empresa.com"
            />
          </div>
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? "Enviando…" : "Enviar instrucciones"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}

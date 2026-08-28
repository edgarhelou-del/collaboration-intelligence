"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, ErrorText, useFormSubmit } from "@/components/AuthForm";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { submit, error, loading } = useFormSubmit("/api/auth/reset-password", () => {
    router.push("/login");
  });

  return (
    <AuthShell title="Elige una nueva contraseña">
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          submit({ token, password, confirmPassword });
        }}
      >
        <ErrorText error={error} />
        <div>
          <label className="mb-1 block text-sm text-ink/70">Nueva contraseña</label>
          <input
            className="input"
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-ink/70">Confirmar contraseña</label>
          <input
            className="input"
            required
            type="password"
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
        <button type="submit" className="btn-primary w-full" disabled={loading || !token}>
          {loading ? "Guardando…" : "Guardar contraseña"}
        </button>
      </form>
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

"use client";

import { useState } from "react";
import { signIn } from "@/lib/auth-client";

export default function StaffSignInForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    const { error } = await signIn.email({
      email,
      password,
      callbackURL: "/staff",
    });
    setPending(false);
    if (error) {
      setError(error.message ?? "Αποτυχία σύνδεσης");
      return;
    }
    window.location.href = "/staff";
  }

  return (
    <form onSubmit={onSubmit} className="card stack-md">
      <div className="field">
        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label>Κωδικός</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
        />
      </div>
      {error && <div className="notice notice--error">{error}</div>}
      <button className="btn btn--primary btn--block" disabled={pending}>
        {pending ? "Σύνδεση…" : "Σύνδεση"}
      </button>
    </form>
  );
}

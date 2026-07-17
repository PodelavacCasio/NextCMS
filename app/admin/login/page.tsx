"use client";

import { useActionState } from "react";
import { login } from "../actions";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <div className="login-wrap">
      <div className="login-box">
        <span className="kicker">Administrace</span>
        <h1>Přihlášení</h1>
        <p className="sub">Pro správu webu zadejte heslo správce.</p>
        <form action={formAction} className="form">
          {state?.error && <div className="notice error">{state.error}</div>}
          <div className="field">
            <label htmlFor="password">Heslo</label>
            <input id="password" name="password" type="password" required autoFocus />
          </div>
          <button className="btn accent" type="submit" disabled={pending}>
            {pending ? "Přihlašuji…" : "Přihlásit se"}
          </button>
        </form>
      </div>
    </div>
  );
}

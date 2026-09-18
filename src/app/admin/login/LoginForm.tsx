'use client';

import { useActionState } from 'react';
import { loginAction, type ActionState } from '../actions';

const initial: ActionState = {};

export function LoginForm() {
  const [state, submit, pending] = useActionState(loginAction, initial);

  return (
    <form action={submit} className="mt-8 rounded-2xl border border-line bg-surface p-6">
      <label htmlFor="password" className="block text-sm font-medium">
        Password admin
      </label>
      <input
        id="password"
        name="password"
        type="password"
        autoComplete="current-password"
        autoFocus
        required
        className="mt-2 w-full rounded-xl border border-line bg-page px-4 py-3 text-sm outline-none transition-colors focus:border-brand"
      />

      {state.error && (
        <p role="alert" className="mt-3 text-sm font-medium text-accent">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-5 w-full rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? 'Memeriksa...' : 'Masuk'}
      </button>
    </form>
  );
}

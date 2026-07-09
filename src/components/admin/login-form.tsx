"use client";

import { useActionState } from "react";
import { loginAdminAction, type LoginState } from "@/app/admin/login/actions";

type LoginFormProps = {
  nextPath: string;
};

const initialState: LoginState = {
  message: null,
  email: "",
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, isPending] = useActionState(
    loginAdminAction,
    initialState,
  );

  return (
    <form
      action={formAction}
      className="mx-auto w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-5"
    >
      <input type="hidden" name="next" value={nextPath} />
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="mt-1 text-sm text-zinc-600">
          Entre para gerenciar pedidos e cardapio.
        </p>
      </div>

      <label className="mt-4 block space-y-1 text-sm">
        <span className="font-medium">Email</span>
        <input
          name="email"
          type="email"
          defaultValue={state.email}
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      <label className="mt-4 block space-y-1 text-sm">
        <span className="font-medium">Senha</span>
        <input
          name="password"
          type="password"
          required
          className="w-full rounded-md border border-zinc-300 px-3 py-2"
        />
      </label>

      {state.message ? (
        <p className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className={`w-full rounded-md bg-zinc-950 px-4 py-3 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400 ${
          state.message ? "mt-3" : "mt-4"
        }`}
      >
        {isPending ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

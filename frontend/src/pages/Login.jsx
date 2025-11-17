import { useState } from "react";

export default function Login() {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");

  function submit() {
    alert("Login teste");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black">

      <div className="w-full max-w-md bg-gray-900/70 backdrop-blur-xl border border-gray-700 p-10 rounded-2xl shadow-xl">

        <h1 className="text-4xl font-bold text-center text-white mb-8">
          Painel MCD
        </h1>

        <div className="flex flex-col gap-6">

          <input
            type="text"
            placeholder="Usuário"
            onChange={(e) => setUser(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white placeholder-gray-400 transition"
          />

          <input
            type="password"
            placeholder="Senha"
            onChange={(e) => setPass(e.target.value)}
            className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 focus:border-blue-500 outline-none text-white placeholder-gray-400 transition"
          />

          <button
            onClick={submit}
            className="w-full p-4 bg-blue-600 hover:bg-blue-700 rounded-xl text-white font-semibold text-lg transition"
          >
            Entrar
          </button>

        </div>

      </div>
    </div>
  );
}

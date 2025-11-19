import React, { useEffect, useState } from "react";

export default function TelaGeral() {
  const [dados, setDados] = useState([]);
  const [colunas, setColunas] = useState([]);
  const [filtros, setFiltros] = useState({ loja: "", regional: "", mes: "", ano: "" });

  const carregar = async () => {
    const params = new URLSearchParams();
    Object.entries(filtros).forEach(([k, v]) => { if (v) params.append(k, v); });

    const resp = await fetch(`/api/geral?${params.toString()}`);
    const json = await resp.json();
    setDados(json.dados || []);
    setColunas(json.colunas || []);
  };

  useEffect(() => { carregar(); }, []);

  const atualizarFiltro = (campo, valor) => {
    setFiltros(prev => ({ ...prev, [campo]: valor }));
  };

  const aplicarFiltros = () => carregar();

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Visão Geral</h1>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white shadow rounded-xl text-center">
          <p className="text-gray-500 text-sm">Total Registros</p>
          <p className="text-2xl font-bold">{dados.length}</p>
        </div>
        <div className="p-4 bg-white shadow rounded-xl text-center">
          <p className="text-gray-500 text-sm">Pendências</p>
          <p className="text-2xl font-bold">{dados.filter(d => ["micro", "fq"].includes(String(d.pendencia).toLowerCase())).length}</p>
        </div>
        <div className="p-4 bg-white shadow rounded-xl text-center">
          <p className="text-gray-500 text-sm">Lojas</p>
          <p className="text-2xl font-bold">{new Set(dados.map(d => d.sigla_loja)).size}</p>
        </div>
        <div className="p-4 bg-white shadow rounded-xl text-center">
          <p className="text-gray-500 text-sm">Regionais</p>
          <p className="text-2xl font-bold">{new Set(dados.map(d => d.regional)).size}</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <input className="border p-2 rounded" placeholder="Loja"
          value={filtros.loja} onChange={e => atualizarFiltro("loja", e.target.value)} />

        <input className="border p-2 rounded" placeholder="Regional"
          value={filtros.regional} onChange={e => atualizarFiltro("regional", e.target.value)} />

        <input className="border p-2 rounded" placeholder="Mês"
          value={filtros.mes} onChange={e => atualizarFiltro("mes", e.target.value)} />

        <input className="border p-2 rounded" placeholder="Ano"
          value={filtros.ano} onChange={e => atualizarFiltro("ano", e.target.value)} />
      </div>

      <button onClick={aplicarFiltros} className="px-4 py-2 bg-blue-600 text-white rounded">
        Aplicar Filtros
      </button>

      {/* Tabela */}
      <div className="overflow-auto border rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              {colunas.map(col => <th key={col} className="p-2 border-b text-left">{col}</th>)}
            </tr>
          </thead>
          <tbody>
            {dados.map((linha, i) => (
              <tr key={i} className="hover:bg-gray-50">
                {colunas.map(col => (
                  <td key={col} className="p-2 border-b">{linha[col]}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


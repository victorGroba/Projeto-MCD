import React, { useMemo, useState } from "react";
import { Search, X, Check } from "lucide-react";

export default function ExcelFilter({ column, table }) {
  const columnFilterValue = column.getFilterValue();
  
  // Pega todos os valores únicos dessa coluna para montar a lista
  const uniqueValues = useMemo(() => {
    const values = Array.from(column.getFacetedUniqueValues().keys()).sort();
    return values.filter(v => v !== null && v !== undefined && v !== "");
  }, [column.getFacetedUniqueValues()]);

  // Estado local para a busca DENTRO do menu de filtro
  const [search, setSearch] = useState("");

  // Lista filtrada pelo input de busca visual
  const filteredOptions = uniqueValues.filter((value) =>
    String(value).toLowerCase().includes(search.toLowerCase())
  );

  // Verifica se um valor está selecionado
  const isSelected = (value) => {
    if (!columnFilterValue) return true; // Se não tem filtro, tudo está "selecionado"
    return columnFilterValue.includes(value);
  };

  // Função para marcar/desmarcar um item
  const toggleValue = (value) => {
    let newFilter;
    if (!columnFilterValue) {
      // Se não tinha filtro, ao clicar em um, desmarca todos os outros? 
      // Comportamento Excel: Começa com tudo. Se eu clico em um, eu quero SÓ aquele ou tirar aquele?
      // Vamos fazer: Se null, assume todos. Ao clicar, cria array com todos MENOS o clicado (se tirar) ou SÓ o clicado.
      // Simplificação: Se null, converte para array com todos antes de modificar.
      newFilter = uniqueValues.filter(v => v !== value);
    } else {
      if (columnFilterValue.includes(value)) {
        newFilter = columnFilterValue.filter((v) => v !== value);
      } else {
        newFilter = [...columnFilterValue, value];
      }
    }
    
    // Se selecionou tudo ou nada, limpa o filtro (volta a null)
    if (newFilter.length === uniqueValues.length || newFilter.length === 0) {
      column.setFilterValue(undefined);
    } else {
      column.setFilterValue(newFilter);
    }
  };

  const handleSelectAll = () => column.setFilterValue(undefined);
  const handleClear = () => column.setFilterValue([]); // Array vazio = nenhum resultado

  return (
    <div className="p-3 bg-slate-800 border border-slate-700 rounded-lg shadow-xl w-64 flex flex-col gap-2">
      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-2 top-2.5 text-slate-400" size={14} />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar..."
          className="w-full bg-slate-900 text-white text-sm pl-8 pr-2 py-2 rounded border border-slate-700 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Botões de Ação Rápida */}
      <div className="flex gap-2 text-xs">
        <button onClick={handleSelectAll} className="text-blue-400 hover:underline">Selecionar Tudo</button>
        <span className="text-slate-600">|</span>
        <button onClick={handleClear} className="text-blue-400 hover:underline">Limpar</button>
      </div>

      {/* Lista de Checkboxes com Scroll */}
      <div className="max-h-48 overflow-y-auto border border-slate-700 rounded bg-slate-900 p-1 flex flex-col gap-1">
        {filteredOptions.length === 0 ? (
          <div className="text-slate-500 text-xs p-2 text-center">Nada encontrado</div>
        ) : (
          filteredOptions.map((value) => (
            <label
              key={value}
              className="flex items-center gap-2 px-2 py-1.5 hover:bg-slate-800 rounded cursor-pointer text-sm text-slate-300"
            >
              <input
                type="checkbox"
                checked={isSelected(value)}
                onChange={() => toggleValue(value)}
                className="rounded border-slate-600 bg-slate-800 text-blue-600 focus:ring-0"
              />
              <span className="truncate">{value}</span>
            </label>
          ))
        )}
      </div>
    </div>
  );
}
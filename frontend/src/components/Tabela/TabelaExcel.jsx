import React, { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getFacetedUniqueValues,
  flexRender,
} from "@tanstack/react-table";
import { ArrowUpDown, Filter, ChevronDown } from "lucide-react";
import { Popover, Transition } from "@headlessui/react"; // Opcional: para o menu dropdown ficar bonito. Se não tiver headlessui, podemos usar um div simples com state.
// Vou usar div simples com state para não te obrigar a instalar mais libs.

import ExcelFilter from "./ExcelFilter";

// Função simples de filtro "includes" para array (multi-select)
const arrIncludesFilter = (row, columnId, filterValue) => {
  if (!filterValue || filterValue.length === 0) return false; // Se filtro existe mas vazio, não mostra nada
  const cellValue = row.getValue(columnId);
  return filterValue.includes(cellValue);
};

export default function TabelaExcel({ data, columns }) {
  const [columnFilters, setColumnFilters] = useState([]);
  const [sorting, setSorting] = useState([]);

  // Configuração da Tabela
  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      sorting,
    },
    onColumnFiltersChange: setColumnFilters,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // Aplica os filtros
    getSortedRowModel: getSortedRowModel(),     // Aplica ordenação
    getFacetedUniqueValues: getFacetedUniqueValues(), // Necessário para listar as opções no filtro
    filterFns: {
      arrIncludes: arrIncludesFilter, // Registra nossa função customizada
    },
  });

  return (
    <div className="w-full overflow-hidden rounded-lg border border-slate-700 shadow-lg bg-slate-900">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-slate-300">
          <thead className="text-xs uppercase bg-slate-800 text-slate-300 border-b border-slate-700">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <th key={header.id} className="px-4 py-3 font-semibold relative group">
                      <div className="flex items-center justify-between gap-2">
                        {/* Texto do Cabeçalho com Ordenação */}
                        <div
                          className="flex items-center gap-2 cursor-pointer select-none hover:text-white"
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {{
                            asc: <ArrowUpDown size={14} className="text-blue-400 rotate-180" />,
                            desc: <ArrowUpDown size={14} className="text-blue-400" />,
                          }[header.column.getIsSorted()] ?? <ArrowUpDown size={14} className="text-slate-600 opacity-0 group-hover:opacity-50" />}
                        </div>

                        {/* Botão de Filtro (Menu) */}
                        {header.column.getCanFilter() && (
                          <FilterMenu header={header} table={table} />
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody className="divide-y divide-slate-800">
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                  Nenhum registro encontrado.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-800/50 transition-colors">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-4 py-3 whitespace-nowrap">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Rodapé com contagem */}
      <div className="px-4 py-3 bg-slate-800 border-t border-slate-700 text-xs text-slate-400 flex justify-between">
        <span>Mostrando {table.getRowModel().rows.length} registros</span>
        <span>Total: {data.length}</span>
      </div>
    </div>
  );
}

// Componente auxiliar para abrir/fechar o menu de filtro
function FilterMenu({ header, table }) {
  const [isOpen, setIsOpen] = useState(false);
  const isFiltered = header.column.getFilterValue();

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded hover:bg-slate-700 ${isFiltered ? "text-blue-400" : "text-slate-500"}`}
      >
        <Filter size={14} fill={isFiltered ? "currentColor" : "none"} />
      </button>

      {/* Menu Dropdown Simples */}
      {isOpen && (
        <>
          {/* Clica fora para fechar */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 z-20">
            <ExcelFilter column={header.column} table={table} />
          </div>
        </>
      )}
    </div>
  );
}
import React, { useEffect, useState } from "react";
import { Line, Bar } from "react-chartjs-2";
import { api } from "../api/api";
import { ArrowLeft, RefreshCw, BarChart2, Target, AlertTriangle, List, UserX, Users, ChevronDown, ChevronUp, Filter, X, Download, CalendarDays, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";

// --- PLUGIN PARA VALORES E PORCENTAGEM (gráficos não-stacked) ---
const drawValuesPlugin = {
  id: "drawValues",
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    // Não aplicar em gráficos stacked (conformidade mensal e regional)
    if (chart.options?._isStackedConformidade) return;

    const isStatusChart = chart.data.labels && chart.data.labels.length === 4 &&
      chart.data.labels[0] === "Programado" &&
      chart.data.labels[1] === "Insatisfatório" &&
      chart.data.labels[2] === "Satisfatório" &&
      chart.data.labels[3] === "Pendente";

    // Tenta encontrar os datasets de Satisfatório e Insatisfatório para calcular o total realizado
    const dsSat = chart.data.datasets.find(d => d.label === "Satisfatório");
    const dsInsat = chart.data.datasets.find(d => d.label === "Insatisfatório");

    chart.data.datasets.forEach((dataset, i) => {
      const meta = chart.getDatasetMeta(i);
      if (meta.hidden) return;

      let totalRegion = 0;
      if (isStatusChart) {
        totalRegion = dataset.data.reduce((acc, val) => acc + (Number(val) || 0), 0);
      }

      meta.data.forEach((element, index) => {
        const value = dataset.data[index];

        // Só desenha se tiver valor > 0
        if (value !== null && value !== undefined && value > 0) {
          ctx.save();
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px sans-serif";
          ctx.textAlign = "center";
          ctx.textBaseline = "bottom";

          let text = value.toString();

          // Lógica de % para gráficos de Status
          if (isStatusChart) {
            if (totalRegion > 0) {
              const pct = ((value / totalRegion) * 100).toFixed(1).replace('.', ',');

              ctx.fillText(value.toString(), element.x, element.y - 14);

              ctx.font = "bold 9px sans-serif";
              ctx.fillStyle = "#cbd5e1";
              ctx.fillText(`(${pct}%)`, element.x, element.y - 2);

              ctx.restore();
              return;
            }
          }
          // Lógica de % apenas para as barras de resultado (Sat/Insat) legadas
          else if ((dataset.label === "Satisfatório" || dataset.label === "Insatisfatório") && dsSat && dsInsat) {
            const valSat = dsSat.data[index] || 0;
            const valInsat = dsInsat.data[index] || 0;
            const totalRealizado = valSat + valInsat;

            if (totalRealizado > 0) {
              const pct = ((value / totalRealizado) * 100).toFixed(0);
              text = `${value} (${pct}%)`;
            }
          }

          ctx.fillText(text, element.x, element.y - 3);
          ctx.restore();
        }
      });
    });
  },
};

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Legend,
  drawValuesPlugin,
  ChartDataLabels
);

const ORDEM_MESES = [
  "janeiro", "fevereiro", "março", "abril", "maio", "junho",
  "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"
];

// --- Componente de seção retrátil ---
function CollapsibleSection({ title, icon, badge, defaultOpen = true, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="mb-10">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between bg-slate-900 px-6 py-4 rounded-xl border border-slate-800 shadow-xl cursor-pointer hover:border-slate-600 transition-all select-none group"
      >
        <div className="flex items-center gap-3">
          {icon}
          <h2 className="text-lg font-semibold text-slate-200">{title}</h2>
          {badge && (
            <span className="ml-2 text-xs text-slate-500 bg-slate-800 px-3 py-1 rounded-full">
              {badge}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 group-hover:text-slate-400 transition-colors">
            {isOpen ? "Minimizar" : "Expandir"}
          </span>
          {isOpen ? (
            <ChevronUp className="text-slate-400 group-hover:text-white transition-colors" size={20} />
          ) : (
            <ChevronDown className="text-slate-400 group-hover:text-white transition-colors" size={20} />
          )}
        </div>
      </div>
      <div
        className={`overflow-hidden transition-all duration-500 ease-in-out ${
          isOpen ? "max-h-[3000px] opacity-100 mt-0" : "max-h-0 opacity-0"
        }`}
      >
        <div className="bg-slate-900 px-6 pb-6 pt-2 rounded-b-xl border border-t-0 border-slate-800 shadow-xl -mt-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// ======================================================================
// DOSSIÊ DE CONFORMIDADE — paleta e componentes
// Paleta de status validada para daltonismo sobre a superfície slate-900:
// pior par adjacente ΔE 11,4 (protan) e 19,7 (visão normal).
// A distinção nunca fica só na cor — posição na pilha, rótulo direto e
// legenda carregam a mesma informação.
// ======================================================================
const VIZ = {
  ok: "#34d399",
  abaixo: "#e05252",
  recoleta: "#4d9bf0",
  pendente: "#f0b429",
  semNota: "#7c8899",
  surface: "#0f172a",
  grid: "#1e293b",
  ink: "#e2e8f0",
  inkMuted: "#94a3b8",
  inkFaint: "#64748b",
};

const FONTE_VIZ = "system-ui, -apple-system, 'Segoe UI', sans-serif";

const MESES_CURTOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
                      "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const fmtInt = (n) => new Intl.NumberFormat("pt-BR").format(Math.round(n || 0));
const fmtPct = (n, casas = 1) =>
  `${(Number(n) || 0).toFixed(casas).replace(".", ",")}%`;

const PARTICULAS_NOME = new Set(["de", "da", "do", "das", "dos", "e"]);

// "PAULO HENRIQUE DOS SANTOS" -> "Paulo Santos" (eixo legível; o tooltip traz o nome completo)
function nomeCurto(nome) {
  const partes = String(nome).trim().toLowerCase().split(/\s+/).filter((p) => p && !PARTICULAS_NOME.has(p));
  const titulo = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  if (!partes.length) return String(nome);
  if (partes.length === 1) return titulo(partes[0]);
  return `${titulo(partes[0])} ${titulo(partes[partes.length - 1])}`;
}

// Rótulo direto na ponta de cada barra — um por barra, nunca por segmento.
// `_topLabels` é um mapa { nomeDoStack: [rótulo por categoria] }, para que um
// gráfico com duas barras lado a lado (coleta e recoleta) rotule cada uma.
const stackTopLabelPlugin = {
  id: "stackTopLabel",
  afterDatasetsDraw(chart) {
    const mapa = chart.options?._topLabels;
    if (!mapa) return;
    const { ctx } = chart;
    const horizontal = chart.options?.indexAxis === "y";

    Object.entries(mapa).forEach(([stack, rotulos]) => {
      if (!Array.isArray(rotulos)) return;

      chart.data.labels.forEach((_, i) => {
        const item = rotulos[i];
        if (item == null) return;

        let ponta = null;
        let coord = null;
        chart.data.datasets.forEach((ds, di) => {
          if ((ds.stack ?? ds.label) !== stack) return;
          const meta = chart.getDatasetMeta(di);
          if (meta.hidden) return;
          const el = meta.data[i];
          if (!el || !((Number(ds.data[i]) || 0) > 0)) return;
          if (horizontal) {
            ponta = ponta === null ? el.x : Math.max(ponta, el.x);
            coord = el.y;
          } else {
            ponta = ponta === null ? el.y : Math.min(ponta, el.y);
            coord = el.x;
          }
        });
        if (ponta === null) return;

        const principal = typeof item === "string" ? item : item.principal;
        const secundario = typeof item === "string" ? null : item.secundario;

        ctx.save();
        ctx.textBaseline = horizontal ? "middle" : "bottom";
        ctx.textAlign = horizontal ? "left" : "center";
        const x = horizontal ? ponta + 12 : coord;
        const y = horizontal ? coord : ponta - 9;

        ctx.fillStyle = VIZ.ink;
        ctx.font = `600 12px ${FONTE_VIZ}`;
        ctx.fillText(principal, x, y);

        // O denominador impede que uma proporção sobre poucos casos
        // pareça equivalente a uma sobre centenas
        if (secundario) {
          const larg = ctx.measureText(principal).width;
          ctx.fillStyle = VIZ.inkFaint;
          ctx.font = `400 11px ${FONTE_VIZ}`;
          ctx.fillText(secundario, x + larg + 6, y);
        }
        ctx.restore();
      });
    });
  },
};

// --- Controle segmentado (troca a série exibida) ---
function SegmentedControl({ value, onChange, options }) {
  return (
    <div className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-800/70 border border-slate-700/60">
      {options.map((op) => (
        <button
          key={op.id}
          onClick={() => onChange(op.id)}
          className={`px-3 py-1.5 rounded-[6px] text-xs font-medium transition-colors ${
            value === op.id
              ? "bg-slate-700 text-slate-100"
              : "text-slate-400 hover:text-slate-200"
          }`}
        >
          {op.label}
        </button>
      ))}
    </div>
  );
}

// --- Legenda (sempre presente quando há 2+ séries) ---
function LegendaViz({ itens }) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
      {itens.map((it) => (
        <span key={it.label} className="inline-flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-[3px] shrink-0"
            style={{ background: it.cor }}
          />
          <span className="text-xs text-slate-400">{it.label}</span>
          {it.valor != null && (
            <span className="text-xs font-semibold text-slate-200 tabular-nums">
              {fmtInt(it.valor)}
            </span>
          )}
        </span>
      ))}
    </div>
  );
}

// --- Barra de proporção fina (part-to-whole de uma linha só) ---
function BarraProporcao({ partes, className = "" }) {
  const total = partes.reduce((a, p) => a + p.valor, 0) || 1;
  return (
    <div className={`flex w-full h-1.5 rounded-full overflow-hidden gap-[2px] ${className}`}>
      {partes.map((p) => (
        <div
          key={p.label}
          style={{ width: `${(p.valor / total) * 100}%`, background: p.cor }}
          title={`${p.label}: ${fmtInt(p.valor)}`}
        />
      ))}
    </div>
  );
}

// --- Cabeçalho estatístico: a métrica é o número, não um gráfico ---
function ResumoConformidade({ ok, abaixo, semNota, rotulo }) {
  const base = ok + abaixo;
  const pct = base > 0 ? (ok / base) * 100 : 0;
  return (
    <div className="flex flex-col lg:flex-row lg:items-end gap-5 lg:gap-10">
      <div className="shrink-0">
        <p className="text-[40px] leading-none font-semibold text-slate-50 tabular-nums">
          {fmtPct(pct)}
        </p>
        <p className="text-xs text-slate-400 mt-1.5">com nota 100%</p>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 mb-2">
          {fmtInt(base + semNota)} {rotulo}
        </p>
        <BarraProporcao
          partes={[
            { label: "Nota 100%", valor: ok, cor: VIZ.ok },
            { label: "Abaixo de 100%", valor: abaixo, cor: VIZ.abaixo },
            ...(semNota > 0 ? [{ label: "Sem nota", valor: semNota, cor: VIZ.semNota }] : []),
          ]}
        />
        <div className="mt-3">
          <LegendaViz
            itens={[
              { label: "Nota 100%", cor: VIZ.ok, valor: ok },
              { label: "Abaixo de 100%", cor: VIZ.abaixo, valor: abaixo },
              ...(semNota > 0 ? [{ label: "Sem nota", cor: VIZ.semNota, valor: semNota }] : []),
            ]}
          />
        </div>
      </div>
    </div>
  );
}

// --- Janela de dossiê (abre ao clicar numa coluna) ---
function DossieModal({ dossie, onClose }) {
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!dossie) return null;

  const { titulo, subtitulo, registros = [], colunas, modo = "conformidade" } = dossie;

  const qtdOk = registros.filter((r) => r.status === "100").length;
  const qtdAbaixo = registros.filter((r) => r.status === "abaixo").length;
  const qtdSem = registros.filter((r) => r.status === "sem_nota").length;

  const linhas = filtro === "todos" ? registros : registros.filter((r) => r.status === filtro);

  const cols = colunas || [
    { key: "sigla", label: "Sigla" },
    { key: "regional", label: "Regional" },
    { key: "mes", label: "Mês" },
    { key: "data", label: "Data" },
    { key: "tipo", label: "Tipo" },
    { key: "nota", label: "Nota" },
    { key: "pendencia", label: "Pendência" },
    { key: "gm", label: "Gerente" },
  ];

  const exportarCsv = () => {
    const sep = ";";
    const linhasCsv = [
      cols.map((c) => c.label).join(sep),
      ...linhas.map((l) =>
        cols.map((c) => `"${String(l[c.key] ?? "").replace(/"/g, '""')}"`).join(sep)
      ),
    ].join("\n");
    const blob = new Blob(["﻿" + linhasCsv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dossie-${String(titulo).toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtros = [
    { id: "todos", label: "Todas", qtd: registros.length, cor: null },
    { id: "100", label: "Nota 100%", qtd: qtdOk, cor: VIZ.ok },
    { id: "abaixo", label: "Abaixo de 100%", qtd: qtdAbaixo, cor: VIZ.abaixo },
    ...(qtdSem > 0 ? [{ id: "sem_nota", label: "Sem nota", qtd: qtdSem, cor: VIZ.semNota }] : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-slate-50 truncate">{titulo}</h3>
            {subtitulo && <p className="text-sm text-slate-500 mt-1">{subtitulo}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumo */}
        {modo === "conformidade" && (
          <div className="px-7 pb-5">
            <ResumoConformidade
              ok={qtdOk}
              abaixo={qtdAbaixo}
              semNota={qtdSem}
              rotulo="coletas no recorte"
            />
          </div>
        )}

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2 px-7 pb-4 border-b border-slate-800">
          {modo === "conformidade" &&
            filtros.map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltro(f.id)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                  filtro === f.id
                    ? "bg-slate-800 text-slate-100 border-slate-600"
                    : "bg-transparent text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700"
                }`}
              >
                {f.cor && (
                  <span className="w-2 h-2 rounded-[2px]" style={{ background: f.cor }} />
                )}
                {f.label}
                <span className="tabular-nums text-slate-500">{fmtInt(f.qtd)}</span>
              </button>
            ))}
          <button
            onClick={exportarCsv}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>

        {/* Tabela */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800">
                {cols.map((c) => (
                  <th
                    key={c.key}
                    className="text-left font-medium text-[11px] uppercase tracking-wider text-slate-500 py-3 px-3 first:pl-7 last:pr-7 whitespace-nowrap"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={cols.length} className="py-12 text-center text-slate-600">
                    Nenhum registro para este filtro.
                  </td>
                </tr>
              )}
              {linhas.map((l, i) => (
                <tr key={i} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                  {cols.map((c) => (
                    <td
                      key={c.key}
                      className="py-2.5 px-3 first:pl-7 last:pr-7 align-top text-slate-300"
                    >
                      {c.key === "nota" && modo === "conformidade" ? (
                        <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{
                              background:
                                l.status === "100" ? VIZ.ok
                                : l.status === "abaixo" ? VIZ.abaixo
                                : VIZ.semNota,
                            }}
                          />
                          <span className="tabular-nums">{l[c.key] || "—"}</span>
                        </span>
                      ) : (
                        l[c.key] || "—"
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// --- Sub-modal: datas exatas de recoletas / visitas de uma loja ---
function SubModalDatas({ info, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!info) return null;
  const { titulo, subtitulo, itens = [] } = info;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md max-h-[70vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-800">
          <div className="min-w-0">
            <h4 className="text-base font-semibold text-slate-50">{titulo}</h4>
            {subtitulo && <p className="text-xs text-slate-500 mt-0.5">{subtitulo}</p>}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 -mr-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={16} />
          </button>
        </div>
        <ul className="flex-1 overflow-auto px-6 py-3">
          {itens.length === 0 && (
            <li className="py-6 text-center text-sm text-slate-600">Nenhuma data registrada.</li>
          )}
          {itens.map((it, i) => (
            <li
              key={`${it.data}-${i}`}
              className="flex items-center justify-between gap-4 py-2.5 border-b border-slate-800/60 last:border-0"
            >
              <span className="inline-flex items-center gap-2.5">
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={{ background: it.cor || VIZ.recoleta }}
                />
                <span className="text-sm text-slate-200 tabular-nums">{it.data}</span>
              </span>
              {it.rotulo && <span className="text-xs text-slate-500">{it.rotulo}</span>}
            </li>
          ))}
        </ul>
        <div className="px-6 py-3 border-t border-slate-800 text-xs text-slate-500">
          {fmtInt(itens.length)} {itens.length === 1 ? "registro" : "registros"}
        </div>
      </div>
    </div>
  );
}

// --- Modal de detalhamento das recoletas do período (ranking por loja) ---
function ModalRecoletas({ dados, onClose, onVerDatas }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!dados) return null;
  const { periodo, semestre, linhas = [] } = dados;

  const totalRecoletas = linhas.reduce((a, l) => a + l.qtd, 0);

  const exportarCsv = () => {
    const sep = ";";
    const cab = ["Sigla", "Regional", "Mês", "Qtd. Recoletas no Mês", "Total de Visitas"].join(sep);
    const corpo = linhas
      .map((l) => [l.sigla, l.regional, l.periodo, l.qtd, l.totalVisitas].join(sep))
      .join("\n");
    const blob = new Blob(["﻿" + cab + "\n" + corpo], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recoletas-${String(periodo).toLowerCase().replace(/[^a-z0-9]+/gi, "-")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 px-7 pt-6 pb-5">
          <div className="min-w-0">
            <h3 className="text-xl font-semibold text-slate-50">Recoletas · {periodo}</h3>
            <p className="text-sm text-slate-500 mt-1">
              Lojas com maior incidência no topo · total de visitas acumulado no {semestre}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 -mr-1 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-wrap items-end gap-8 px-7 pb-5">
          <div>
            <p className="text-[32px] leading-none font-semibold text-slate-50 tabular-nums">
              {fmtInt(totalRecoletas)}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">recoletas no período</p>
          </div>
          <div>
            <p className="text-[32px] leading-none font-semibold text-slate-50 tabular-nums">
              {fmtInt(linhas.length)}
            </p>
            <p className="text-xs text-slate-400 mt-1.5">lojas envolvidas</p>
          </div>
          <button
            onClick={exportarCsv}
            className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 border border-slate-700 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Download size={13} /> Exportar CSV
          </button>
        </div>

        <div className="flex-1 overflow-auto border-t border-slate-800">
          <table className="w-full text-[13px]">
            <thead className="sticky top-0 bg-slate-900 z-10">
              <tr className="border-b border-slate-800">
                {["Sigla", "Regional", "Mês"].map((h) => (
                  <th key={h} className="text-left font-medium text-[11px] uppercase tracking-wider text-slate-500 py-3 px-3 first:pl-7 whitespace-nowrap">
                    {h}
                  </th>
                ))}
                <th className="text-right font-medium text-[11px] uppercase tracking-wider text-slate-500 py-3 px-3 whitespace-nowrap">
                  Qtd. Recoletas no Mês
                </th>
                <th className="text-right font-medium text-[11px] uppercase tracking-wider text-slate-500 py-3 px-3 pr-7 whitespace-nowrap">
                  Total de Visitas
                </th>
              </tr>
            </thead>
            <tbody>
              {linhas.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-600">
                    Nenhuma recoleta neste período.
                  </td>
                </tr>
              )}
              {linhas.map((l) => (
                <tr key={l.sigla} className="border-b border-slate-800/60 hover:bg-slate-800/40 transition-colors">
                  <td className="py-2.5 px-3 pl-7 font-medium text-slate-100">{l.sigla}</td>
                  <td className="py-2.5 px-3 text-slate-400">{l.regional || "—"}</td>
                  <td className="py-2.5 px-3 text-slate-400">{l.periodo}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={() => onVerDatas({
                        titulo: `${l.sigla} · recoletas em ${l.periodo}`,
                        subtitulo: "Datas em que houve recoleta",
                        itens: l.datasRecoletas.map((d) => ({ data: d, cor: VIZ.recoleta })),
                      })}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md tabular-nums font-semibold text-slate-100 hover:bg-slate-700/60 transition-colors"
                      title="Ver as datas das recoletas"
                    >
                      {l.qtd}
                      <CalendarDays size={12} className="text-slate-500" />
                    </button>
                  </td>
                  <td className="py-2.5 px-3 pr-7 text-right">
                    <button
                      onClick={() => onVerDatas({
                        titulo: `${l.sigla} · visitas no ${semestre}`,
                        subtitulo: "Coletas e recoletas acumuladas no semestre",
                        itens: l.datasVisitas,
                      })}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md tabular-nums text-slate-300 hover:bg-slate-700/60 transition-colors"
                      title="Ver as datas de todas as visitas do semestre"
                    >
                      {l.totalVisitas}
                      <CalendarDays size={12} className="text-slate-500" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function TelaGraficos() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(""); // Filtro mês para regional backroom
  const [selectedMonthGelo, setSelectedMonthGelo] = useState(""); // Filtro mês para regional gelo pool
  const [dossie, setDossie] = useState(null); // Janela de detalhe (dossiê de conformidade)
  const [periodoModo, setPeriodoModo] = useState("mensal");  // seletor global: "mensal" | "semestral"
  const [gmPeriodo, setGmPeriodo] = useState(null);          // período exibido no painel por gerente
  const [modalRecoleta, setModalRecoleta] = useState(null);  // ranking de lojas por recoleta
  const [subDatas, setSubDatas] = useState(null);            // datas exatas de uma loja

  const fetchData = () => {
    setLoading(true);
    api.get("/api/graficos-data")
      .then((res) => {
        setData(res.data);
        // Define mês padrão como o primeiro mês disponível
        if (res.data?.backroom_regional?.meses?.length > 0 && !selectedMonth) {
          setSelectedMonth(res.data.backroom_regional.meses[0]);
        }
        if (res.data?.gelopool_regional?.meses?.length > 0 && !selectedMonthGelo) {
          setSelectedMonthGelo(res.data.gelopool_regional.meses[0]);
        }
      })
      .catch((err) => console.error("Erro ao carregar gráficos:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  if (loading && !data) return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white">
      <div className="flex flex-col items-center gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-500"></div>
        <p className="text-slate-400 font-medium">Carregando dados do servidor...</p>
      </div>
    </div>
  );

  // --- 1. Programado vs Realizado ---
  const buildComparisonChart = (apiData) => {
    if (!apiData) return { labels: [], datasets: [] };
    return {
      labels: apiData.labels,
      datasets: [
        { label: "Programado", data: apiData.programado, backgroundColor: "#8b5cf6", borderRadius: 4 },
        { label: "Realizado", data: apiData.realizado, backgroundColor: "#10b981", borderRadius: 4 }
      ]
    };
  };

  // --- 2. Status por Regional (4 Barras) ---
  const buildStatusChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };

    const regionais = apiData.labels || []; // ["RSOU", "BRA", "SAO1", "SAO2"]
    const totais = apiData.valores["Total"] || [];
    const oks = apiData.valores["OK"] || [];
    const noks = apiData.valores["NOK"] || [];
    const pendentes = apiData.valores["Pendentes"] || Array(totais.length).fill(0);

    // Categorias no eixo X
    const categorias = ["Programado", "Insatisfatório", "Satisfatório", "Pendente"];

    // Cores distintas para cada regional
    const coresRegionais = ["#3b82f6", "#dc2626", "#65a30d", "#7c3aed", "#f59e0b", "#06b6d4"];

    // Cada regional vira um dataset com 4 valores (um para cada categoria)
    const datasets = regionais.map((regional, idx) => ({
      label: regional,
      data: [
        totais[idx] || 0,      // Programado
        noks[idx] || 0,        // Insatisfatório
        oks[idx] || 0,         // Satisfatório
        pendentes[idx] || 0    // Pendente
      ],
      backgroundColor: coresRegionais[idx % coresRegionais.length],
      borderRadius: 3,
      barPercentage: 0.85,
      categoryPercentage: 0.85
    }));

    return { labels: categorias, datasets };
  };

  // --- 3. Gráficos Legados (Evolução, Top Pendências) ---
  const buildLegacyChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };
    const labels = apiData.labels || [];
    let keys = Object.keys(apiData.valores);

    // Ordena meses se necessário
    if (keys.some(k => ORDEM_MESES.includes(k.toLowerCase().trim()))) {
      keys.sort((a, b) => {
        const idxA = ORDEM_MESES.indexOf(a.toLowerCase().trim());
        const idxB = ORDEM_MESES.indexOf(b.toLowerCase().trim());
        return (idxA === -1 ? 999 : idxA) - (idxB === -1 ? 999 : idxB);
      });
    }

    const excelColors = [
      "#4285F4", // azul (janeiro)
      "#C53929", // vermelho escuro (fevereiro)
      "#9CCC65", // verde claro (março)
      "#7E57C2", // roxo (abril)
      "#26A69A", // turquesa (maio)
      "#FF9800", // laranja (junho)
      "#5E35B1", // indigo
      "#EF5350", // vermelho claro
      "#8BC34A", // lime
      "#AB47BC", // roxo claro
      "#00ACC1", // cyan
      "#FFA726"  // laranja claro
    ];
    const datasets = keys.map((key, index) => ({
      label: key,
      data: apiData.valores[key],
      backgroundColor: excelColors[index % excelColors.length],
      borderColor: excelColors[index % excelColors.length],
      borderWidth: 1,
      borderRadius: 4,
    }));

    return { labels, datasets };
  };

  // --- 4. Gráficos Top Pendências ---
  const buildPendenciasTopChart = (apiData) => {
    if (!apiData || !apiData.valores) return { labels: [], datasets: [] };

    const labels = apiData.labels || [];
    const keys = Object.keys(apiData.valores);
    const excelColors = [
      "#3b82f6", "#f97316", "#94a3b8", "#eab308", "#22c55e",
      "#ef4444", "#a855f7", "#ec4899", "#84cc16", "#06b6d4"
    ];
    const datasets = keys.map((key, index) => ({
      label: key,
      data: apiData.valores[key],
      backgroundColor: excelColors[index % excelColors.length],
      borderColor: excelColors[index % excelColors.length],
      borderWidth: 1,
      borderRadius: 4,
    }));

    return { labels, datasets };
  };

  // Renderiza seções de detalhes (Máquina de Gelo, etc)
  const renderTopicSection = (topicName) => {
    const listaGraficos = data?.detalhes_parametros?.[topicName];
    if (!listaGraficos || listaGraficos.length === 0) return null;

    return (
      <CollapsibleSection
        title={topicName}
        icon={<BarChart2 className="text-blue-400" size={22} />}
        defaultOpen={false}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
          {listaGraficos.map((grafico, idx) => (
            <div key={idx} className="bg-slate-800 rounded-lg p-5 shadow-lg border border-slate-700 hover:border-slate-600 transition-colors">
              <h3 className="text-lg font-bold text-center mb-4 text-slate-200">{grafico.titulo}</h3>
              <div className="h-64 relative">
                <Bar
                  data={{
                    labels: grafico.labels,
                    datasets: [
                      { label: "OK", data: grafico.ok, backgroundColor: "#22c55e", borderRadius: 4 },
                      { label: "NOK", data: grafico.nok, backgroundColor: "#ef4444", borderRadius: 4 }
                    ]
                  }}
                  options={commonOptions}
                />
              </div>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    );
  };

  // Tooltip padrão dos gráficos: passar o mouse mostra a categoria inteira
  // (todas as séries daquele ponto), não apenas a fatia sob o cursor.
  const tooltipPadrao = {
    backgroundColor: "#1e293b",
    titleColor: "#e2e8f0",
    bodyColor: "#cbd5e1",
    titleFont: { size: 13, weight: "600" },
    bodyFont: { size: 12 },
    padding: 12,
    cornerRadius: 8,
    borderColor: "#334155",
    borderWidth: 1,
    usePointStyle: true,
    boxWidth: 8,
    boxHeight: 8,
    boxPadding: 5,
  };

  const commonOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { labels: { color: "#cbd5e1", usePointStyle: true }, position: 'bottom' },
      tooltip: tooltipPadrao,
      datalabels: { display: false } // Desabilita globalmente, ativa apenas onde necessário
    },
    scales: {
      x: { ticks: { color: "#94a3b8" }, grid: { display: false } },
      y: { ticks: { color: "#94a3b8" }, grid: { color: "#334155" }, beginAtZero: true }
    }
  };

  const statusOptions = {
    ...commonOptions,
    layout: { padding: { top: 25 } },
    plugins: {
      ...commonOptions.plugins,
      legend: { position: 'top', labels: { color: "#cbd5e1" } },
      tooltip: {
        ...commonOptions.plugins.tooltip,
        callbacks: {
          label: function (context) {
            const dataset = context.dataset;
            const value = dataset.data[context.dataIndex];
            const total = dataset.data.reduce((acc, val) => acc + (Number(val) || 0), 0);
            if (total > 0 && value > 0) {
              const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
              return `${dataset.label}: ${value} (${pct}%)`;
            }
            return `${dataset.label}: ${value}`;
          }
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO CONFORMIDADE MENSAL - STACKED (padrão da foto)
  // Verde (OK) embaixo, Vermelho (NOK) em cima, mesma coluna
  // ====================================================================
  const buildStackedMensalData = () => {
    if (!data?.backroom_mensal?.labels?.length) return null;
    const { labels, ok, nok, ok_pct, nok_pct } = data.backroom_mensal;
    return {
      labels,
      datasets: [
        {
          label: "OK (Conforme)",
          data: ok,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        },
        {
          label: "NOK (Não Conforme)",
          data: nok,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        }
      ]
    };
  };

  const stackedMensalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const idx = context.dataIndex;
            const value = context.raw;
            const okVal = data.backroom_mensal.ok[idx] || 0;
            const nokVal = data.backroom_mensal.nok[idx] || 0;
            const total = okVal + nokVal;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 11 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          const idx = context.dataIndex;
          const okVal = data.backroom_mensal.ok[idx] || 0;
          const nokVal = data.backroom_mensal.nok[idx] || 0;
          const total = okVal + nokVal;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO CONFORMIDADE POR REGIONAL - STACKED com filtro de mês
  // ====================================================================
  const buildRegionalData = () => {
    if (!data?.backroom_regional?.regionais?.length || !selectedMonth) return null;
    const { regionais, dados } = data.backroom_regional;
    const mesData = dados[selectedMonth];
    if (!mesData) return null;

    const okValues = regionais.map(r => mesData[r]?.ok || 0);
    const nokValues = regionais.map(r => mesData[r]?.nok || 0);

    return {
      labels: regionais,
      datasets: [
        {
          label: "OK (Conforme)",
          data: okValues,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
        {
          label: "NOK (Não Conforme)",
          data: nokValues,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        }
      ]
    };
  };

  const stackedRegionalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#cbd5e1", font: { size: 13, weight: 'bold' } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            if (!selectedMonth || !data?.backroom_regional?.dados) return '';
            const regional = data.backroom_regional.regionais[context.dataIndex];
            const mesData = data.backroom_regional.dados[selectedMonth];
            if (!mesData || !mesData[regional]) return '';
            const info = mesData[regional];
            const total = info.ok + info.nok;
            const value = context.raw;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 12 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          if (!selectedMonth || !data?.backroom_regional?.dados) return '';
          const regional = data.backroom_regional.regionais[context.dataIndex];
          const mesData = data.backroom_regional.dados[selectedMonth];
          if (!mesData || !mesData[regional]) return '';
          const info = mesData[regional];
          const total = info.ok + info.nok;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO GELO POOL CONFORMIDADE MENSAL - STACKED
  // ====================================================================
  const buildStackedGeloMensalData = () => {
    if (!data?.gelopool_mensal?.labels?.length) return null;
    const { labels, ok, nok } = data.gelopool_mensal;
    return {
      labels,
      datasets: [
        {
          label: "OK (Conforme)",
          data: ok,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        },
        {
          label: "NOK (Não Conforme)",
          data: nok,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.65,
          categoryPercentage: 0.8,
        }
      ]
    };
  };

  const stackedGeloMensalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#94a3b8", font: { size: 11 } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            const idx = context.dataIndex;
            const value = context.raw;
            const okVal = data.gelopool_mensal.ok[idx] || 0;
            const nokVal = data.gelopool_mensal.nok[idx] || 0;
            const total = okVal + nokVal;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 11 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          const idx = context.dataIndex;
          const okVal = data.gelopool_mensal.ok[idx] || 0;
          const nokVal = data.gelopool_mensal.nok[idx] || 0;
          const total = okVal + nokVal;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
    }
  };

  // ====================================================================
  // GRÁFICO GELO POOL CONFORMIDADE POR REGIONAL - STACKED com filtro mês
  // ====================================================================
  const buildGeloRegionalData = () => {
    if (!data?.gelopool_regional?.regionais?.length || !selectedMonthGelo) return null;
    const { regionais, dados } = data.gelopool_regional;
    const mesData = dados[selectedMonthGelo];
    if (!mesData) return null;

    const okValues = regionais.map(r => mesData[r]?.ok || 0);
    const nokValues = regionais.map(r => mesData[r]?.nok || 0);

    return {
      labels: regionais,
      datasets: [
        {
          label: "OK (Conforme)",
          data: okValues,
          backgroundColor: "#22c55e",
          borderColor: "#16a34a",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        },
        {
          label: "NOK (Não Conforme)",
          data: nokValues,
          backgroundColor: "#ef4444",
          borderColor: "#dc2626",
          borderWidth: 1,
          barPercentage: 0.6,
          categoryPercentage: 0.7,
        }
      ]
    };
  };

  const stackedGeloRegionalOptions = {
    maintainAspectRatio: false,
    responsive: true,
    interaction: { mode: 'index', intersect: false },
    _isStackedConformidade: true,
    layout: { padding: { top: 30 } },
    scales: {
      x: {
        stacked: true,
        ticks: { color: "#cbd5e1", font: { size: 13, weight: 'bold' } },
        grid: { display: false }
      },
      y: {
        stacked: true,
        ticks: {
          color: "#94a3b8",
          beginAtZero: true,
          callback: (v) => Number.isInteger(v) ? v : null
        },
        grid: { color: "#334155" },
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: "#cbd5e1",
          usePointStyle: true,
          font: { size: 12, weight: 'bold' },
          padding: 20
        }
      },
      tooltip: {
        backgroundColor: "#1e293b",
        titleColor: "#f1f5f9",
        bodyColor: "#cbd5e1",
        padding: 12,
        borderColor: "#334155",
        borderWidth: 1,
        callbacks: {
          label: function (context) {
            if (!selectedMonthGelo || !data?.gelopool_regional?.dados) return '';
            const regional = data.gelopool_regional.regionais[context.dataIndex];
            const mesData = data.gelopool_regional.dados[selectedMonthGelo];
            if (!mesData || !mesData[regional]) return '';
            const info = mesData[regional];
            const total = info.ok + info.nok;
            const value = context.raw;
            const pct = total > 0 ? ((value / total) * 100).toFixed(1).replace('.', ',') : '0';
            return `${context.dataset.label}: ${value} de ${total} (${pct}%)`;
          }
        }
      },
      datalabels: {
        display: true,
        color: '#ffffff',
        font: { weight: 'bold', size: 12 },
        anchor: 'center',
        align: 'center',
        formatter: (value, context) => {
          if (!value || value === 0) return '';
          if (!selectedMonthGelo || !data?.gelopool_regional?.dados) return '';
          const regional = data.gelopool_regional.regionais[context.dataIndex];
          const mesData = data.gelopool_regional.dados[selectedMonthGelo];
          if (!mesData || !mesData[regional]) return '';
          const info = mesData[regional];
          const total = info.ok + info.nok;
          if (total === 0) return '';
          const pct = ((value / total) * 100).toFixed(1).replace('.', ',');
          return `${pct}%`;
        }
      }
    }
  };

  // ====================================================================
  // BASE DO DOSSIÊ (registros usados pelas janelas de detalhe)
  // ====================================================================
  const conf = data?.conformidade;
  const registrosConf = conf?.registros || [];
  const _soma = (arr) => (arr || []).reduce((a, b) => a + (Number(b) || 0), 0);

  // --- Opções compartilhadas dos dois gráficos ---
  const _opcoesViz = ({ horizontal, escala, rotulos, nomesCompletos, aoClicar }) => {
    const eixoValor = {
      stacked: true,
      beginAtZero: true,
      border: { display: false },
      grid: { color: VIZ.grid, drawTicks: false },
      ticks: {
        color: VIZ.inkFaint,
        font: { family: FONTE_VIZ, size: 11 },
        padding: 8,
        ...(escala === "pct" ? { stepSize: 25 } : {}),
        callback: (v) => (escala === "pct" ? `${v}%` : Number.isInteger(v) ? v : null),
      },
      ...(escala === "pct" ? { max: 100 } : {}),

    };
    const eixoCategoria = {
      stacked: true,
      border: { display: false },
      grid: { display: false },
      ticks: {
        color: VIZ.inkMuted,
        font: { family: FONTE_VIZ, size: 12 },
        padding: 8,
        autoSkip: false,
      },
    };

    return {
      maintainAspectRatio: false,
      responsive: true,
      indexAxis: horizontal ? "y" : "x",
      _isStackedConformidade: true,
      _topLabels: rotulos,
      layout: { padding: horizontal ? { right: 96, left: 4 } : { top: 26, right: 4 } },
      interaction: { mode: "index", intersect: false },
      onHover: (evt, elements) => {
        if (evt?.native?.target) {
          evt.native.target.style.cursor = elements.length ? "pointer" : "default";
        }
      },
      onClick: (evt, elements, chart) => {
        // O tooltip usa mode "index", então elements[0] é sempre o 1º dataset da
        // categoria. Para saber em qual barra o clique caiu (coleta ou recoleta,
        // por exemplo), consulta o elemento exatamente sob o cursor.
        const exatos = chart.getElementsAtEventForMode(
          evt.native || evt, "nearest", { intersect: true }, true
        );
        const alvo = exatos?.[0] || elements?.[0];
        if (!alvo) return;
        aoClicar(chart.data.datasets[alvo.datasetIndex], alvo.index);
      },
      plugins: {
        legend: { display: false }, // legenda em HTML, acima do gráfico
        datalabels: { display: false },
        tooltip: {
          backgroundColor: "#1e293b",
          titleColor: VIZ.ink,
          bodyColor: VIZ.inkMuted,
          footerColor: VIZ.inkFaint,
          titleFont: { family: FONTE_VIZ, size: 13, weight: "600" },
          bodyFont: { family: FONTE_VIZ, size: 12 },
          footerFont: { family: FONTE_VIZ, size: 11, weight: "400" },
          padding: 12,
          cornerRadius: 8,
          borderColor: "#334155",
          borderWidth: 1,
          displayColors: true,
          boxWidth: 8,
          boxHeight: 8,
          boxPadding: 5,
          usePointStyle: true,
          // esconde as séries zeradas do mês/gerente — só ruído no tooltip
          filter: (item) => (Number(item.dataset._abs?.[item.dataIndex]) || 0) > 0,
          callbacks: {
            title: (itens) =>
              nomesCompletos ? nomesCompletos[itens?.[0]?.dataIndex] : itens?.[0]?.label,
            label: (ctx) => {
              const abs = ctx.dataset._abs?.[ctx.dataIndex] ?? ctx.raw;
              const total = ctx.chart.data.datasets.reduce(
                (a, ds) => a + (Number(ds._abs?.[ctx.dataIndex]) || 0),
                0
              );
              const pct = total > 0 ? (abs / total) * 100 : 0;
              return ` ${ctx.dataset.label}: ${fmtInt(abs)} (${fmtPct(pct)})`;
            },
            footer: (itens) => {
              const i = itens?.[0]?.dataIndex;
              if (i == null) return "";
              const dss = itens[0].chart.data.datasets;
              const somaDe = (st) =>
                Number(dss.find((d) => d._status === st)?._abs?.[i]) || 0;
              const total = dss.reduce((a, d) => a + (Number(d._abs?.[i]) || 0), 0);
              const base = somaDe("100") + somaDe("abaixo");
              return [
                base > 0
                  ? `Total ${fmtInt(total)} · ${fmtPct((somaDe("100") / base) * 100)} com nota 100%`
                  : `Total ${fmtInt(total)}`,
                "Clique para abrir o dossiê",
              ];
            },
          },
        },
      },
      scales: horizontal
        ? { x: eixoValor, y: eixoCategoria }
        : { x: eixoCategoria, y: eixoValor },
    };
  };

  // ====================================================================
  // COLETA x RECOLETA — gráfico unificado e painel por gerente
  // ====================================================================
  const cr = data?.coleta_recoleta;
  const labelsPeriodo = cr?.labels?.[periodoModo] || [];
  const seriePeriodo = cr?.series?.[periodoModo] || {};

  // Semestre a que um rótulo de período pertence (o modal acumula por semestre)
  const semestreDoPeriodo = (rotulo) => {
    if (String(rotulo).includes("semestre")) return rotulo;
    const i = MESES_CURTOS.indexOf(rotulo);
    return i < 0 ? "1º semestre" : i < 6 ? "1º semestre" : "2º semestre";
  };

  const buildColetaRecoletaChart = () => {
    if (!labelsPeriodo.length) return null;
    const barra = {
      borderColor: VIZ.surface,
      borderWidth: (ctx) => ((Number(ctx.dataset.data[ctx.dataIndex]) || 0) > 0 ? 2 : 0),
      borderRadius: 3,
      borderSkipped: false,
      barPercentage: 0.86,
      categoryPercentage: 0.68,
      maxBarThickness: 72, // com poucas categorias (semestre) a barra viraria um bloco
    };
    return {
      labels: labelsPeriodo,
      datasets: [
        // Barra 1 — Coleta (1ª visita): proporção aprovado x reprovado
        { ...barra, label: "Aprovado (100%)", data: seriePeriodo.aprovado || [],
          backgroundColor: VIZ.ok, stack: "coleta", _tipoBarra: "coleta" },
        { ...barra, label: "Reprovado", data: seriePeriodo.reprovado || [],
          backgroundColor: VIZ.abaixo, stack: "coleta", _tipoBarra: "coleta" },
        // Barra 2 — Recoleta: só o quantitativo, sem divisão por resultado
        { ...barra, label: "Recoletas", data: seriePeriodo.recoleta || [],
          backgroundColor: VIZ.recoleta, stack: "recoleta", _tipoBarra: "recoleta" },
      ],
    };
  };

  // Total de 1ªs coletas do período — o percentual de cada resultado vai
  // dentro da própria faixa, logo abaixo
  const totalColetaNoPeriodo = (i) =>
    (seriePeriodo.aprovado?.[i] || 0) + (seriePeriodo.reprovado?.[i] || 0);

  // Rótulo por barra: quantidade no topo das duas (coleta e recoleta)
  const rotulosColetaRecoleta = {
    coleta: labelsPeriodo.map((_, i) => {
      const total = totalColetaNoPeriodo(i);
      return total > 0 ? fmtInt(total) : null;
    }),
    recoleta: labelsPeriodo.map((_, i) => {
      const v = seriePeriodo.recoleta?.[i] || 0;
      return v > 0 ? fmtInt(v) : null;
    }),
  };

  // --- Ranking de lojas por recoleta, para o modal de detalhamento ---
  const montarRankingRecoletas = (rotuloPeriodo) => {
    const semestre = semestreDoPeriodo(rotuloPeriodo);
    const noPeriodo = (r) =>
      String(rotuloPeriodo).includes("semestre") ? r.semestre === rotuloPeriodo : r.mes === rotuloPeriodo;

    const porLoja = new Map();
    registrosConf
      .filter((r) => r.grupo === "Recoleta" && noPeriodo(r))
      .forEach((r) => {
        if (!porLoja.has(r.sigla)) {
          porLoja.set(r.sigla, { sigla: r.sigla, regional: r.regional, periodo: rotuloPeriodo, datasRecoletas: [] });
        }
        porLoja.get(r.sigla).datasRecoletas.push(r);
      });

    // Total de visitas: coletas + recoletas acumuladas no semestre
    const visitasSemestre = new Map();
    registrosConf
      .filter((r) => r.semestre === semestre)
      .forEach((r) => {
        if (!visitasSemestre.has(r.sigla)) visitasSemestre.set(r.sigla, []);
        visitasSemestre.get(r.sigla).push(r);
      });

    const porData = (a, b) => String(a.data_iso).localeCompare(String(b.data_iso));

    const linhas = [...porLoja.values()].map((l) => {
      const visitas = (visitasSemestre.get(l.sigla) || []).slice().sort(porData);
      return {
        sigla: l.sigla,
        regional: l.regional,
        periodo: l.periodo,
        qtd: l.datasRecoletas.length,
        datasRecoletas: l.datasRecoletas.slice().sort(porData).map((r) => r.data),
        totalVisitas: visitas.length,
        datasVisitas: visitas.map((r) => ({
          data: r.data,
          rotulo: r.grupo === "Recoleta" ? `Recoleta · ${r.visita}ª visita` : "Coleta · 1ª visita",
          cor: r.grupo === "Recoleta" ? VIZ.recoleta : VIZ.ok,
        })),
      };
    });

    // Rank decrescente pela quantidade de recoletas do período
    linhas.sort((a, b) => b.qtd - a.qtd || b.totalVisitas - a.totalVisitas || a.sigla.localeCompare(b.sigla));
    return { periodo: rotuloPeriodo, semestre, linhas };
  };

  const opcoesColetaRecoleta = _opcoesViz({
    horizontal: false,
    escala: "valor",
    rotulos: rotulosColetaRecoleta,
    aoClicar: (dataset, index) => {
      const periodo = labelsPeriodo[index];
      if (dataset._tipoBarra === "recoleta") {
        setModalRecoleta(montarRankingRecoletas(periodo));
        return;
      }
      // barra de coleta abre o dossiê das 1ªs visitas do período
      const noPeriodo = (r) =>
        String(periodo).includes("semestre") ? r.semestre === periodo : r.mes === periodo;
      setDossie({
        titulo: `Coleta · ${periodo}`,
        subtitulo: "1ª visita — aprovado (nota 100%) x reprovado",
        registros: registrosConf.filter((r) => r.grupo === "Coleta" && noPeriodo(r)),
      });
    },
  });

  // Percentual dentro de cada faixa da barra de coleta. Só na coleta: a de
  // recoleta é um total único, sem divisão por resultado.
  opcoesColetaRecoleta.plugins.datalabels = {
    display: (ctx) => {
      if (ctx.dataset.stack !== "coleta") return false;
      const valor = Number(ctx.dataset.data[ctx.dataIndex]) || 0;
      const total = totalColetaNoPeriodo(ctx.dataIndex);
      if (!(valor > 0 && total > 0)) return false;
      // Mede a faixa em pixels: proporção não basta, porque num mês de volume
      // baixo até 79% da barra pode ser uma faixa fina demais para o texto.
      const marca = ctx.chart.getDatasetMeta(ctx.datasetIndex)?.data?.[ctx.dataIndex];
      const altura = marca ? Math.abs((marca.base ?? marca.y) - marca.y) : 0;
      return altura >= 20;
    },
    color: "#0b1220",
    font: { family: FONTE_VIZ, weight: "600", size: 12 },
    anchor: "center",
    align: "center",
    formatter: (valor, ctx) => {
      const total = totalColetaNoPeriodo(ctx.dataIndex);
      return total > 0 ? `${Math.round((valor / total) * 100)}%` : "";
    },
  };

  // ====================================================================
  // COLETAS POR ESTADO (UF)
  // Complementa a visão por Regional: o mapeamento Estado→Regional não é 1:1
  // (SP se divide entre SAO1 e SAO2), então as duas leituras não se substituem.
  // ====================================================================
  const estadosOrdenados = (() => {
    if (!registrosConf.length) return [];
    const porUf = new Map();
    registrosConf.forEach((r) => {
      const uf = (r.estado || "").trim().toUpperCase();
      if (!uf || uf === "NAN" || uf === "NONE") return;
      if (!porUf.has(uf)) porUf.set(uf, { uf, coleta: 0, recoleta: 0, total: 0 });
      const linha = porUf.get(uf);
      if (r.grupo === "Recoleta") linha.recoleta += 1;
      else linha.coleta += 1;
      linha.total += 1;
    });
    return [...porUf.values()].sort((a, b) => b.total - a.total || a.uf.localeCompare(b.uf));
  })();

  const buildEstadoChart = () => {
    if (!estadosOrdenados.length) return null;
    const barra = {
      borderColor: VIZ.surface,
      borderWidth: (ctx) => ((Number(ctx.dataset.data[ctx.dataIndex]) || 0) > 0 ? 2 : 0),
      borderRadius: 3,
      borderSkipped: false,
      barPercentage: 0.72,
      categoryPercentage: 0.86,
      maxBarThickness: 18,
      stack: "uf",
    };
    return {
      labels: estadosOrdenados.map((l) => l.uf),
      datasets: [
        { ...barra, label: "Coleta", data: estadosOrdenados.map((l) => l.coleta),
          _abs: estadosOrdenados.map((l) => l.coleta), _grupoUf: "Coleta", backgroundColor: VIZ.ok },
        { ...barra, label: "Recoleta", data: estadosOrdenados.map((l) => l.recoleta),
          _abs: estadosOrdenados.map((l) => l.recoleta), _grupoUf: "Recoleta", backgroundColor: VIZ.recoleta },
      ],
    };
  };

  const rotulosEstado = { uf: estadosOrdenados.map((l) => fmtInt(l.total)) };

  const opcoesEstado = _opcoesViz({
    horizontal: true,
    escala: "valor",
    rotulos: rotulosEstado,
    aoClicar: (dataset, index) => {
      const linha = estadosOrdenados[index];
      if (!linha) return;
      const grupo = dataset._grupoUf;
      setDossie({
        titulo: `${linha.uf} · ${grupo.toLowerCase()}s`,
        subtitulo: `${fmtInt(linha.total)} coletas no estado em 2026`,
        registros: registrosConf.filter(
          (r) => (r.estado || "").trim().toUpperCase() === linha.uf &&
                 (grupo === "Recoleta" ? r.grupo === "Recoleta" : r.grupo !== "Recoleta")
        ),
      });
    },
  });

  // ====================================================================
  // PAINEL UNIFICADO POR GERENTE DE MERCADO (3 métricas lado a lado)
  // ====================================================================
  const gmLabels = cr?.gerentes?.labels || [];
  const periodosGm = labelsPeriodo;
  const gmPeriodoAtual = periodosGm.includes(gmPeriodo) ? gmPeriodo : periodosGm[periodosGm.length - 1];
  const painelGm = cr?.gerentes?.[periodoModo]?.[gmPeriodoAtual];

  const METRICAS_GM = [
    { chave: "reprovacoes", label: "Reprovações na 1ª coleta", cor: VIZ.abaixo },
    { chave: "recoletas", label: "Recoletas no período", cor: VIZ.recoleta },
    { chave: "pendentes", label: "Pendências no fechamento", cor: VIZ.pendente },
  ];

  // Ordena pelo saldo de pendências: é o que exige ação
  const gmOrdem = (() => {
    if (!painelGm || !gmLabels.length) return [];
    return gmLabels
      .map((nome, i) => ({
        nome, i,
        reprovacoes: painelGm.reprovacoes?.[i] || 0,
        recoletas: painelGm.recoletas?.[i] || 0,
        pendentes: painelGm.pendentes?.[i] || 0,
      }))
      .filter((l) => l.reprovacoes + l.recoletas + l.pendentes > 0)
      .sort((a, b) => b.pendentes - a.pendentes || b.reprovacoes - a.reprovacoes);
  })();

  const buildPainelGmChart = () => {
    if (!gmOrdem.length) return null;
    return {
      labels: gmOrdem.map((l) => nomeCurto(l.nome)),
      datasets: METRICAS_GM.map((m) => ({
        label: m.label,
        data: gmOrdem.map((l) => l[m.chave]),
        _abs: gmOrdem.map((l) => l[m.chave]),
        _metrica: m.chave,
        backgroundColor: m.cor,
        borderColor: VIZ.surface,
        borderWidth: (ctx) => ((Number(ctx.dataset.data[ctx.dataIndex]) || 0) > 0 ? 2 : 0),
        borderRadius: 3,
        borderSkipped: false,
        barPercentage: 0.9,
        categoryPercentage: 0.74,
        maxBarThickness: 16,
        stack: m.chave, // stacks distintos = 3 barras agrupadas
      })),
    };
  };

  const rotulosPainelGm = Object.fromEntries(
    METRICAS_GM.map((m) => [
      m.chave,
      gmOrdem.map((l) => (l[m.chave] > 0 ? fmtInt(l[m.chave]) : null)),
    ])
  );

  const opcoesPainelGm = _opcoesViz({
    horizontal: true,
    escala: "valor",
    rotulos: rotulosPainelGm,
    nomesCompletos: gmOrdem.map((l) => l.nome),
    aoClicar: (dataset, index) => {
      const linha = gmOrdem[index];
      if (!linha) return;
      const periodo = gmPeriodoAtual;
      const noPeriodo = (r) =>
        String(periodo).includes("semestre") ? r.semestre === periodo : r.mes === periodo;

      if (dataset._metrica === "pendentes") {
        const detalhe = painelGm?.pendentes_detalhe?.[linha.nome] || [];
        setDossie({
          modo: "pendencias",
          titulo: linha.nome,
          subtitulo: `${detalhe.length} pendência(s) em aberto no fechamento de ${periodo}`,
          registros: detalhe,
          colunas: [
            { key: "sigla", label: "Sigla" },
            { key: "abertura", label: "Aberta em" },
            { key: "dias_em_aberto", label: "Dias em aberto" },
            { key: "visitas", label: "Visitas no ciclo" },
          ],
        });
        return;
      }

      if (dataset._metrica === "recoletas") {
        const base = montarRankingRecoletas(periodo);
        const daCarteira = new Set(
          registrosConf.filter((r) => r.gm === linha.nome).map((r) => r.sigla)
        );
        setModalRecoleta({
          ...base,
          periodo: `${periodo} · ${nomeCurto(linha.nome)}`,
          linhas: base.linhas.filter((l) => daCarteira.has(l.sigla)),
        });
        return;
      }

      setDossie({
        titulo: linha.nome,
        subtitulo: `Reprovações na 1ª coleta — ${periodo}`,
        registros: registrosConf.filter(
          (r) => r.gm === linha.nome && r.grupo === "Coleta" && r.status === "abaixo" && noPeriodo(r)
        ),
      });
    },
  });

  const totaisPainelGm = gmOrdem.reduce(
    (a, l) => ({
      reprovacoes: a.reprovacoes + l.reprovacoes,
      recoletas: a.recoletas + l.recoletas,
      pendentes: a.pendentes + l.pendentes,
    }),
    { reprovacoes: 0, recoletas: 0, pendentes: 0 }
  );

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate("/home")} className="p-3 bg-slate-800 rounded-xl hover:bg-slate-700 border border-slate-700 transition">
              <ArrowLeft size={20} className="text-slate-300" />
            </button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white">Painel de Indicadores</h1>
              <p className="text-slate-400 text-sm">Monitoramento de Qualidade & Conformidade</p>
            </div>
          </div>
          <button onClick={fetchData} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg shadow-lg transition flex items-center gap-2 font-semibold">
            <RefreshCw size={18} /> Atualizar Dados
          </button>
        </div>

        {/* --- 1. GRÁFICO PROGRAMADO VS REALIZADO --- */}
        <CollapsibleSection
          title="Cronograma Mensal: Programado vs Realizado (2026)"
          icon={<Target className="text-purple-500" size={22} />}
        >
          <div className="h-80 mt-4">
            <Bar
              data={buildComparisonChart(data?.programado_realizado)}
              options={{
                ...commonOptions,
                scales: {
                  ...commonOptions.scales,
                  x: { ...commonOptions.scales.x, stacked: false },
                  y: { ...commonOptions.scales.y, stacked: false }
                }
              }}
            />
          </div>
        </CollapsibleSection>

        {/* --- 2. COLETA E RECOLETA (gráfico unificado) --- */}
        {labelsPeriodo.length > 0 && (
          <CollapsibleSection
            title="Coleta e Recoleta (2026)"
            icon={<List className="text-slate-400" size={20} />}
          >
            <div className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SegmentedControl
                  value={periodoModo}
                  onChange={setPeriodoModo}
                  options={[
                    { id: "mensal", label: "Mensal" },
                    { id: "semestral", label: "Semestre" },
                  ]}
                />
                <LegendaViz
                  itens={[
                    { label: "Aprovado (100%)", cor: VIZ.ok },
                    { label: "Reprovado", cor: VIZ.abaixo },
                    { label: "Recoletas", cor: VIZ.recoleta },
                  ]}
                />
              </div>

              <div className="flex flex-wrap items-end gap-8 mt-7">
                <div>
                  <p className="text-[32px] leading-none font-semibold text-slate-50 tabular-nums">
                    {fmtPct(
                      (_soma(seriePeriodo.aprovado) + _soma(seriePeriodo.reprovado)) > 0
                        ? (_soma(seriePeriodo.aprovado) /
                            (_soma(seriePeriodo.aprovado) + _soma(seriePeriodo.reprovado))) * 100
                        : 0
                    )}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">aprovadas na 1ª coleta</p>
                </div>
                <div>
                  <p className="text-[32px] leading-none font-semibold text-slate-50 tabular-nums">
                    {fmtInt(_soma(seriePeriodo.reprovado))}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">reprovações na 1ª coleta</p>
                </div>
                <div>
                  <p className="text-[32px] leading-none font-semibold text-slate-50 tabular-nums">
                    {fmtInt(_soma(seriePeriodo.recoleta))}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">recoletas realizadas</p>
                </div>
              </div>

              <div className="h-[340px] mt-8">
                <Bar
                  data={buildColetaRecoletaChart()}
                  options={opcoesColetaRecoleta}
                  plugins={[stackTopLabelPlugin]}
                />
              </div>

              <p className="text-xs text-slate-600 mt-4">
                Acima de cada barra, a quantidade; dentro da barra de coleta, o percentual de
                aprovadas e reprovadas na 1ª visita. A recoleta traz apenas o quantitativo.
                Clique na barra de recoleta para ver o ranking de lojas, ou na de coleta para o
                dossiê das primeiras visitas.
              </p>
            </div>
          </CollapsibleSection>
        )}

        {/* --- 2b. PAINEL UNIFICADO POR GERENTE DE MERCADO --- */}
        {gmOrdem.length > 0 && (
          <CollapsibleSection
            title="Painel por Gerente de Mercado (2026)"
            icon={<Users className="text-slate-400" size={20} />}
          >
            <div className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SegmentedControl
                  value={gmPeriodoAtual}
                  onChange={setGmPeriodo}
                  options={periodosGm.map((p) => ({
                    id: p,
                    label: String(p).replace(" semestre", "º sem").replace("ºº", "º"),
                  }))}
                />
                <LegendaViz itens={METRICAS_GM.map((m) => ({ label: m.label, cor: m.cor }))} />
              </div>

              <div className="flex flex-wrap items-end gap-8 mt-7">
                {METRICAS_GM.map((m) => (
                  <div key={m.chave}>
                    <p className="text-[32px] leading-none font-semibold text-slate-50 tabular-nums">
                      {fmtInt(totaisPainelGm[m.chave])}
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5">{m.label.toLowerCase()}</p>
                  </div>
                ))}
              </div>

              <div className="mt-8" style={{ height: gmOrdem.length * 62 + 48 }}>
                <Bar
                  data={buildPainelGmChart()}
                  options={opcoesPainelGm}
                  plugins={[stackTopLabelPlugin]}
                />
              </div>

              <p className="text-xs text-slate-600 mt-4">
                Ordenado pelo saldo de pendências em aberto no fechamento de {gmPeriodoAtual}. As
                recoletas mostram o esforço do mês, que o saldo final sozinho não revela. Clique em
                qualquer barra para abrir o detalhe.
              </p>
            </div>
          </CollapsibleSection>
        )}


        {/* --- 3. EVOLUÇÃO ANUAL DE PENDÊNCIAS --- */}
        <CollapsibleSection
          title="Evolução Anual de Pendências"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-80 mt-4">
            <Line data={buildLegacyChart(data?.restaurante_anual)} options={commonOptions} />
          </div>
        </CollapsibleSection>

        {/* --- 4. PENDÊNCIAS POR REGIONAL --- */}
        <CollapsibleSection
          title="Pendências por Regional"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-96 mt-4">
            <Bar data={buildLegacyChart(data?.restaurante_regional)} options={commonOptions} />
          </div>
        </CollapsibleSection>

        {/* --- 4b. COLETAS POR ESTADO (UF) --- */}
        {estadosOrdenados.length > 0 && (
          <CollapsibleSection
            title="Coletas por Estado (2026)"
            icon={<MapPin className="text-slate-400" size={20} />}
          >
            <div className="pt-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-[32px] leading-none font-semibold text-slate-50 tabular-nums">
                    {fmtInt(estadosOrdenados.length)}
                  </p>
                  <p className="text-xs text-slate-400 mt-1.5">estados com coleta</p>
                </div>
                <LegendaViz
                  itens={[
                    { label: "Coleta", cor: VIZ.ok },
                    { label: "Recoleta", cor: VIZ.recoleta },
                  ]}
                />
              </div>

              <div className="mt-8" style={{ height: estadosOrdenados.length * 30 + 48 }}>
                <Bar
                  data={buildEstadoChart()}
                  options={opcoesEstado}
                  plugins={[stackTopLabelPlugin]}
                />
              </div>

              <p className="text-xs text-slate-600 mt-4">
                Complementa a visão por Regional — o mapeamento Estado→Regional não é 1:1
                (SP se divide entre SAO1 e SAO2). Clique numa barra para abrir o dossiê.
              </p>
            </div>
          </CollapsibleSection>
        )}

        {/* --- CONFORMIDADE MENSAL (STACKED - Padrão da foto) --- */}
        {data?.backroom_mensal?.labels?.length > 0 && (
          <CollapsibleSection
            title="Back Room — Conformidade Mensal (2026)"
            icon={<BarChart2 className="text-emerald-400" size={22} />}
            badge='Valores "NA" excluídos do cálculo'
          >
            <div className="h-96 mt-4">
              <Bar
                data={buildStackedMensalData()}
                options={stackedMensalOptions}
              />
            </div>
            {/* Resumo em cards abaixo do gráfico */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {data.backroom_mensal.labels.map((mes, i) => {
                const ok = data.backroom_mensal.ok[i];
                const nok = data.backroom_mensal.nok[i];
                const total = ok + nok;
                const pctOk = total > 0 ? ((ok / total) * 100).toFixed(1) : '0';
                return (
                  <div key={mes} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-sm font-semibold text-slate-300 mb-1">{mes}</p>
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <span className="text-green-400 font-bold">{ok} OK</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-red-400 font-bold">{nok} NOK</span>
                    </div>
                    <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pctOk}%`,
                          background: `linear-gradient(90deg, #22c55e, #4ade80)`
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* --- CONFORMIDADE POR REGIONAL (STACKED + Filtro mês) --- */}
        {data?.backroom_regional?.regionais?.length > 0 && (
          <CollapsibleSection
            title="Back Room — Conformidade por Regional (2026)"
            icon={<BarChart2 className="text-amber-400" size={22} />}
            badge="Filtro por mês"
          >
            {/* Filtro de mês */}
            <div className="flex items-center gap-3 mt-4 mb-6">
              <Filter className="text-slate-400" size={18} />
              <span className="text-sm text-slate-400 font-medium">Mês:</span>
              <div className="flex flex-wrap gap-2">
                {data.backroom_regional.meses.map(mes => (
                  <button
                    key={mes}
                    onClick={() => setSelectedMonth(mes)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                      selectedMonth === mes
                        ? "bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {mes}
                  </button>
                ))}
              </div>
            </div>

            {/* Gráfico Regional */}
            {selectedMonth && buildRegionalData() && (
              <>
                <div className="h-96">
                  <Bar
                    data={buildRegionalData()}
                    options={stackedRegionalOptions}
                  />
                </div>
                {/* Cards por regional */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {data.backroom_regional.regionais.map((reg) => {
                    const mesData = data.backroom_regional.dados[selectedMonth];
                    if (!mesData || !mesData[reg]) return null;
                    const info = mesData[reg];
                    const total = info.ok + info.nok;
                    const pctOk = total > 0 ? info.ok_pct : 0;
                    return (
                      <div key={reg} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                        <p className="text-sm font-bold text-slate-200 mb-1">{reg}</p>
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <span className="text-green-400 font-bold">{info.ok} OK</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-red-400 font-bold">{info.nok} NOK</span>
                        </div>
                        <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pctOk}%`,
                              background: `linear-gradient(90deg, #22c55e, #4ade80)`
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CollapsibleSection>
        )}

        {/* --- GELO POOL CONFORMIDADE MENSAL (STACKED) --- */}
        {data?.gelopool_mensal?.labels?.length > 0 && (
          <CollapsibleSection
            title="Gelo Pool — Conformidade Mensal (2026)"
            icon={<BarChart2 className="text-cyan-400" size={22} />}
            badge='Valores "NA" excluídos do cálculo'
          >
            <div className="h-96 mt-4">
              <Bar
                data={buildStackedGeloMensalData()}
                options={stackedGeloMensalOptions}
              />
            </div>
            {/* Resumo em cards abaixo do gráfico */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              {data.gelopool_mensal.labels.map((mes, i) => {
                const ok = data.gelopool_mensal.ok[i];
                const nok = data.gelopool_mensal.nok[i];
                const total = ok + nok;
                const pctOk = total > 0 ? ((ok / total) * 100).toFixed(1) : '0';
                return (
                  <div key={mes} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                    <p className="text-sm font-semibold text-slate-300 mb-1">{mes}</p>
                    <div className="flex items-center justify-center gap-3 text-xs">
                      <span className="text-green-400 font-bold">{ok} OK</span>
                      <span className="text-slate-600">|</span>
                      <span className="text-red-400 font-bold">{nok} NOK</span>
                    </div>
                    <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pctOk}%`,
                          background: `linear-gradient(90deg, #22c55e, #4ade80)`
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                  </div>
                );
              })}
            </div>
          </CollapsibleSection>
        )}

        {/* --- GELO POOL CONFORMIDADE POR REGIONAL (STACKED + Filtro mês) --- */}
        {data?.gelopool_regional?.regionais?.length > 0 && (
          <CollapsibleSection
            title="Gelo Pool — Conformidade por Regional (2026)"
            icon={<BarChart2 className="text-teal-400" size={22} />}
            badge="Filtro por mês"
          >
            {/* Filtro de mês */}
            <div className="flex items-center gap-3 mt-4 mb-6">
              <Filter className="text-slate-400" size={18} />
              <span className="text-sm text-slate-400 font-medium">Mês:</span>
              <div className="flex flex-wrap gap-2">
                {data.gelopool_regional.meses.map(mes => (
                  <button
                    key={mes}
                    onClick={() => setSelectedMonthGelo(mes)}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 border ${
                      selectedMonthGelo === mes
                        ? "bg-teal-600 border-teal-500 text-white shadow-lg shadow-teal-500/20"
                        : "bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    }`}
                  >
                    {mes}
                  </button>
                ))}
              </div>
            </div>

            {/* Gráfico Regional Gelo Pool */}
            {selectedMonthGelo && buildGeloRegionalData() && (
              <>
                <div className="h-96">
                  <Bar
                    data={buildGeloRegionalData()}
                    options={stackedGeloRegionalOptions}
                  />
                </div>
                {/* Cards por regional */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  {data.gelopool_regional.regionais.map((reg) => {
                    const mesData = data.gelopool_regional.dados[selectedMonthGelo];
                    if (!mesData || !mesData[reg]) return null;
                    const info = mesData[reg];
                    const total = info.ok + info.nok;
                    const pctOk = total > 0 ? info.ok_pct : 0;
                    return (
                      <div key={reg} className="bg-slate-800/60 rounded-lg p-3 border border-slate-700/50 text-center">
                        <p className="text-sm font-bold text-slate-200 mb-1">{reg}</p>
                        <div className="flex items-center justify-center gap-3 text-xs">
                          <span className="text-green-400 font-bold">{info.ok} OK</span>
                          <span className="text-slate-600">|</span>
                          <span className="text-red-400 font-bold">{info.nok} NOK</span>
                        </div>
                        <div className="mt-1.5 w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pctOk}%`,
                              background: `linear-gradient(90deg, #22c55e, #4ade80)`
                            }}
                          />
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">{pctOk}% conforme</p>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </CollapsibleSection>
        )}

        {/* BACK ROOM (STATUS POR REGIONAL) */}
        <CollapsibleSection
          title="Back Room (Status por Regional)"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-96 mt-4">
            <Bar
              data={buildStatusChart(data?.backroom)}
              options={statusOptions}
            />
          </div>
        </CollapsibleSection>

        {/* GELO (STATUS POR REGIONAL) */}
        <CollapsibleSection
          title="Gelo (Status por Regional)"
          icon={<BarChart2 className="text-blue-400" size={22} />}
        >
          <div className="h-96 mt-4">
            <Bar
              data={buildStatusChart(data?.gelo)}
              options={statusOptions}
            />
          </div>
        </CollapsibleSection>

        {/* PENDÊNCIAS DE GELO (Máquina de Gelo, Bin da torre, Bin Mc Café) */}
        {data?.pendencias_gelo?.labels?.length > 0 && (
          <CollapsibleSection
            title="Pendências de Gelo por Regional"
            icon={<AlertTriangle className="text-yellow-400" size={22} />}
          >
            <div className="h-96 mt-4">
              <Bar
                data={buildPendenciasTopChart(data?.pendencias_gelo)}
                options={{
                  ...commonOptions,
                  scales: {
                    ...commonOptions.scales,
                    x: { ...commonOptions.scales.x, stacked: false },
                    y: { ...commonOptions.scales.y, stacked: false, ticks: { ...commonOptions.scales.y.ticks, stepSize: 1 } }
                  }
                }}
              />
            </div>
          </CollapsibleSection>
        )}



        {/* --- SEÇÕES DETALHADAS --- */}
        {renderTopicSection("Back Room")}
        {renderTopicSection("Gelo Pool")}
        {renderTopicSection("Máquina de Gelo")}
        {renderTopicSection("Bin Café")}
        {renderTopicSection("Bin Bebidas")}

      </div>

      {/* Ranking de lojas por recoleta + datas exatas */}
      <ModalRecoletas
        dados={modalRecoleta}
        onClose={() => setModalRecoleta(null)}
        onVerDatas={setSubDatas}
      />
      <SubModalDatas info={subDatas} onClose={() => setSubDatas(null)} />

      {/* Janela de dossiê (abre ao clicar numa coluna) */}
      <DossieModal
        key={dossie ? `${dossie.titulo}|${dossie.subtitulo}` : "vazio"}
        dossie={dossie}
        onClose={() => setDossie(null)}
      />
    </div>
  );
}
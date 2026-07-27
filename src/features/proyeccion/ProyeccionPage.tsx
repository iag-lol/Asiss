import { ChangeEvent, ClipboardEvent, useEffect, useMemo, useState } from 'react';
import { Icon } from '../../shared/components/common/Icon';
import { showErrorToast } from '../../shared/state/toastStore';
import { fetchFlota, FLOTA_TABLE } from './service';
import {
  findColumnKeyRegex,
  formatDateToDDMMYYYY,
  formatExcelTime,
  normalizePpu,
  parseDateString,
  parseExcelFile,
  removeAccents,
} from './excel';
import {
  BusTipo,
  ExcelRow,
  FlotaBus,
  FlotaFilters,
  OtroFsRow,
  RtgVencidaRow,
} from './types';

type Tipo = 'RIGIDO' | 'ARTICULADO';

interface Category {
  key: string;
  label: string;
  color: string;
}

const CATEGORIES: Category[] = [
  { key: 'vidrio', label: 'VIDRIO', color: '#fdf3eb' },
  { key: 'torniquete', label: 'TORNIQUETE', color: '#fdf3eb' },
  { key: 'rtg', label: 'RTG', color: '#fdf3eb' },
  { key: 'sonda', label: 'SONDA', color: '#fdf3eb' },
  { key: 'camaras', label: 'CAMARAS', color: '#fdf3eb' },
  { key: 'cargaElectricos', label: 'CARGA DE BUSES ELECTRICOS', color: '#fdf3eb' },
  { key: 'adminol', label: 'ADMINOL', color: '#fdf3eb' },
  { key: 'capacitacion', label: 'CAPACITACION', color: '#fdf3eb' },
  { key: 'fueraServicioOtros', label: 'FUERA DE SERVICIOS (OTROS)', color: '#f9c59f' },
  { key: 'fueraServicioReserva', label: 'FUERA DE SERVICIO FLOTA RESERVA (OTROS)', color: '#fdf3eb' },
  { key: 'operativosLibres', label: 'OPERATIVOS LIBRES', color: '#fdf3eb' },
];

type CountsByTipo = Record<Tipo, Record<string, number>>;

const K = {
  rtg: 'asiss:proyeccion:rtg',
  otros: 'asiss:proyeccion:otros-fs',
  image: 'asiss:proyeccion:image',
  po: 'asiss:proyeccion:po',
  counts: 'asiss:proyeccion:counts',
  pannes: 'asiss:proyeccion:pannes',
};

const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const stored = window.localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
};

const emptyCounts = (): CountsByTipo => ({
  RIGIDO: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.key]: 0 }), {}),
  ARTICULADO: CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.key]: 0 }), {}),
});

const EMPTY_FILTERS: FlotaFilters = { terminal: '', zona: '', servicio: '', estado: '', oper: '', search: '' };

const distinct = (rows: FlotaBus[], field: keyof FlotaBus): string[] =>
  Array.from(new Set(rows.map((r) => String(r[field] || '').trim()).filter(Boolean))).sort((a, b) =>
    a.localeCompare(b, 'es'),
  );

export const ProyeccionPage = () => {
  const [flota, setFlota] = useState<FlotaBus[]>([]);
  const [flotaError, setFlotaError] = useState<string | null>(null);
  const [flotaLoading, setFlotaLoading] = useState(true);
  const [filters, setFilters] = useState<FlotaFilters>(EMPTY_FILTERS);

  const [otData, setOtData] = useState<ExcelRow[]>([]);
  const [rtgData, setRtgData] = useState<ExcelRow[]>(() => readJson<ExcelRow[]>(K.rtg, []));
  const [otrosFsData, setOtrosFsData] = useState<ExcelRow[]>(() => readJson<ExcelRow[]>(K.otros, []));
  const [pastedImage, setPastedImage] = useState<string | null>(() => {
    try {
      return window.localStorage.getItem(K.image) || null;
    } catch {
      return null;
    }
  });
  const [manualPannes, setManualPannes] = useState<Record<string, string>>(() =>
    readJson<Record<string, string>>(K.pannes, {}),
  );
  const [manualCounts, setManualCounts] = useState<CountsByTipo>(() => {
    const stored = readJson<CountsByTipo | null>(K.counts, null);
    return stored ?? emptyCounts();
  });
  const [po, setPo] = useState<Record<Tipo, number>>(() => {
    const stored = readJson<Record<Tipo, number> | null>(K.po, null);
    if (stored && (stored.RIGIDO !== 0 || stored.ARTICULADO !== 0)) return stored;
    return { RIGIDO: 182, ARTICULADO: 60 };
  });

  /* ------------------------------ Carga de flota ------------------------------ */
  useEffect(() => {
    let active = true;
    fetchFlota().then((result) => {
      if (!active) return;
      setFlota(result.rows);
      setFlotaError(result.error);
      setFlotaLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  /* ------------------------------ Persistencia ------------------------------ */
  useEffect(() => {
    try {
      window.localStorage.setItem(K.rtg, JSON.stringify(rtgData));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [rtgData]);
  useEffect(() => {
    try {
      window.localStorage.setItem(K.otros, JSON.stringify(otrosFsData));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [otrosFsData]);
  useEffect(() => {
    try {
      if (pastedImage) window.localStorage.setItem(K.image, pastedImage);
      else window.localStorage.removeItem(K.image);
    } catch {
      /* almacenamiento no disponible */
    }
  }, [pastedImage]);
  useEffect(() => {
    try {
      window.localStorage.setItem(K.po, JSON.stringify(po));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [po]);
  useEffect(() => {
    try {
      window.localStorage.setItem(K.counts, JSON.stringify(manualCounts));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [manualCounts]);
  useEffect(() => {
    try {
      window.localStorage.setItem(K.pannes, JSON.stringify(manualPannes));
    } catch {
      /* almacenamiento no disponible */
    }
  }, [manualPannes]);

  /* ------------------------------ Filtros ------------------------------ */
  const rows = useMemo(() => {
    const search = removeAccents(filters.search).toLowerCase().trim();
    return flota.filter((bus) => {
      if (filters.terminal && bus.terminal !== filters.terminal) return false;
      if (filters.zona && bus.zona !== filters.zona) return false;
      if (filters.servicio && bus.servicio !== filters.servicio) return false;
      if (filters.estado && bus.estado !== filters.estado) return false;
      if (filters.oper && bus.oper !== filters.oper) return false;
      if (search) {
        const haystack = removeAccents(
          `${bus.cod} ${bus.ppu} ${bus.terminal} ${bus.zona} ${bus.servicio} ${bus.modelo} ${bus.estado}`,
        ).toLowerCase();
        if (!haystack.includes(search)) return false;
      }
      return true;
    });
  }, [flota, filters]);

  /* ------------------------------ OT ------------------------------ */
  const fueraServicioOT = useMemo(() => {
    const counts: Record<Tipo, number> = { RIGIDO: 0, ARTICULADO: 0 };
    const otBusSet = new Set<string>();
    otData.forEach((row) => {
      const ppu = normalizePpu(row['PPU'] || row['Patente'] || row['Patente Bus'] || row['ppu'] || '');
      const cod = String(row['Código'] || row['N° Interno Bus'] || row['Nro interno'] || row['N° interno'] || '').trim();
      if (ppu) otBusSet.add(ppu);
      if (cod) otBusSet.add(cod);
    });
    rows.forEach((bus) => {
      const busPpu = normalizePpu(bus.ppu);
      const busCod = String(bus.cod || '').trim();
      if ((busPpu && otBusSet.has(busPpu)) || (busCod && otBusSet.has(busCod))) {
        if (bus.tipo === 'RIGIDO') counts.RIGIDO += 1;
        else if (bus.tipo === 'ARTICULADO') counts.ARTICULADO += 1;
      }
    });
    return counts;
  }, [otData, rows]);

  /* ------------------------------ RTG vencidas ------------------------------ */
  const rtgVencidas = useMemo<RtgVencidaRow[]>(() => {
    if (!rtgData.length || !rows.length) return [];
    const results: RtgVencidaRow[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const headers = Object.keys(rtgData[0] || {});
    const keyEmision =
      findColumnKeyRegex(headers, /emisi[oó]n.*rtg/i) || findColumnKeyRegex(headers, /emisi[oó]n/i) || headers[3];
    const keyVencimiento =
      findColumnKeyRegex(headers, /vencimiento.*rtg|vence.*rtg/i) ||
      findColumnKeyRegex(headers, /vencimiento/i) ||
      headers[4];
    const keyDias = findColumnKeyRegex(headers, /d[ií]as.*vencimiento/i) || findColumnKeyRegex(headers, /d[ií]as/i);

    rtgData.forEach((row) => {
      const ppuRaw = normalizePpu(row['Patente Bus'] || row['Patente'] || row['PPU'] || '');
      const codRaw = String(row['N° Interno Bus'] || row['Código'] || '').trim();
      const matchedBus = rows.find((b) => {
        const bPpu = normalizePpu(b.ppu);
        const bCod = String(b.cod || '').trim();
        return (bPpu && bPpu === ppuRaw) || (bCod && bCod === codRaw);
      });
      if (!matchedBus) return;

      const fechaEmision = formatDateToDDMMYYYY(keyEmision ? row[keyEmision] : null);
      const fechaVencimiento = formatDateToDDMMYYYY(keyVencimiento ? row[keyVencimiento] : null);
      const rawDias = keyDias ? row[keyDias] : null;

      let liveDays = 0;
      let usedFileDays = false;
      if (rawDias !== null && rawDias !== undefined && rawDias !== '') {
        liveDays = parseInt(String(rawDias), 10);
        usedFileDays = !Number.isNaN(liveDays);
      }
      if (!usedFileDays) {
        const vDate = parseDateString(fechaVencimiento);
        if (vDate) {
          liveDays = Math.round((vDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        } else {
          liveDays = parseInt(String(row['Dias Para Vencimiento RTG'] || row['Días Para Vencimiento RTG'] || '0'), 10) || 0;
        }
      }

      if (liveDays < 0) {
        results.push({
          interno: matchedBus.cod,
          patente: matchedBus.ppu,
          taller: matchedBus.terminal || 'No asignado',
          tipo: matchedBus.tipo,
          fechaEmision,
          fechaVencimiento,
          dias: liveDays,
        });
      }
    });
    return results;
  }, [rtgData, rows]);

  const rtgAutoCount = useMemo(() => {
    const counts: Record<Tipo, number> = { RIGIDO: 0, ARTICULADO: 0 };
    rtgVencidas.forEach((b) => {
      if (b.tipo === 'RIGIDO') counts.RIGIDO += 1;
      if (b.tipo === 'ARTICULADO') counts.ARTICULADO += 1;
    });
    return counts;
  }, [rtgVencidas]);

  // Limpia TIPO PANNE de buses que ya no aparecen vencidos.
  useEffect(() => {
    setManualPannes((prev) => {
      const next = { ...prev };
      let changed = false;
      Object.keys(next).forEach((key) => {
        if (!rtgVencidas.some((b) => String(b.interno) === key)) {
          delete next[key];
          changed = true;
        }
      });
      return changed ? next : prev;
    });
  }, [rtgVencidas]);

  /* ------------------------------ OTROS FS ------------------------------ */
  const otrosFsList = useMemo<OtroFsRow[]>(
    () =>
      otrosFsData
        .map((row) => {
          const keys = Object.keys(row);
          const getVal = (exactNames: string[], regex?: RegExp): unknown => {
            const lowerNames = exactNames.map((n) => removeAccents(n).toLowerCase().trim());
            let key = keys.find((k) => lowerNames.includes(removeAccents(k).toLowerCase().trim()));
            if (key && row[key] !== undefined && row[key] !== '') return row[key];
            if (regex) {
              key = keys.find((k) => regex.test(removeAccents(k).toLowerCase()));
              if (key && row[key] !== undefined && row[key] !== '') return row[key];
            }
            for (const name of lowerNames) {
              key = keys.find((k) => removeAccents(k).toLowerCase().includes(name));
              if (key && row[key] !== undefined && row[key] !== '') return row[key];
            }
            return '';
          };

          const interno = String(
            getVal(
              ['código', 'codigo', 'interno', 'n° interno bus', 'nro interno', 'n° interno', 'cod', 'numero interno', 'cod.', 'cod. bus'],
              /c[oó]digo|interno|cod/i,
            ) || '',
          );
          const ppu = String(getVal(['ppu', 'patente', 'placa'], /ppu|patente/i) || '');
          const fechaRaw = getVal(['fecha', 'fecha falla', 'fecha panne'], /fecha/i);
          const horaRaw = getVal(['hora', 'hora falla', 'hora panne'], /hora/i);
          const observacion = String(getVal(['observación', 'observacion', 'observaciones'], /observaci[oó]n|observaciones/i) || '');

          const fecha = formatDateToDDMMYYYY(fechaRaw);
          const hora = formatExcelTime(horaRaw);

          const matchedBus = rows.find(
            (b) =>
              (interno && String(b.cod).trim() === String(interno).trim()) ||
              (ppu && normalizePpu(b.ppu) === normalizePpu(ppu)),
          );
          const tipo: BusTipo = matchedBus ? matchedBus.tipo : 'N/A';

          return { interno, ppu, tipo, fecha: fecha || String(fechaRaw ?? ''), hora, observacion };
        })
        .filter((x) => x.interno || x.ppu),
    [otrosFsData, rows],
  );

  /* ------------------------------ Cálculos ------------------------------ */
  const stats = useMemo(() => {
    const build = (tipo: Tipo) => {
      const flotaTotal = rows.filter((r) => r.tipo === tipo).length;
      const sumManual = CATEGORIES.reduce((sum, cat) => {
        if (cat.key === 'rtg') return sum + rtgAutoCount[tipo];
        return sum + (Number(manualCounts[tipo][cat.key]) || 0);
      }, 0);
      const totalDisponibles = flotaTotal - fueraServicioOT[tipo] - sumManual;
      const diferencia = totalDisponibles - po[tipo];
      return { flotaTotal, totalDisponibles, diferencia };
    };
    return { RIGIDO: build('RIGIDO'), ARTICULADO: build('ARTICULADO') };
  }, [rows, manualCounts, rtgAutoCount, fueraServicioOT, po]);

  /* ------------------------------ Handlers ------------------------------ */
  const handleUpload =
    (setter: (rows: ExcelRow[]) => void, label: string) => async (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      event.target.value = '';
      if (!file) return;
      try {
        setter(await parseExcelFile(file));
      } catch (err) {
        showErrorToast(`Error cargando ${label}`, err instanceof Error ? err.message : 'Inténtalo nuevamente.');
      }
    };

  const handlePaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        if (!blob) continue;
        const reader = new FileReader();
        reader.onload = (ev) => setPastedImage(typeof ev.target?.result === 'string' ? ev.target.result : null);
        reader.readAsDataURL(blob);
        break;
      }
    }
  };

  const handleManualCountChange = (tipo: Tipo, key: string, value: string) =>
    setManualCounts((prev) => ({ ...prev, [tipo]: { ...prev[tipo], [key]: parseInt(value, 10) || 0 } }));

  const clearAll = () => {
    setRtgData([]);
    setOtrosFsData([]);
    setManualPannes({});
    setPastedImage(null);
    try {
      [K.rtg, K.otros, K.image, K.pannes].forEach((key) => window.localStorage.removeItem(key));
    } catch {
      /* almacenamiento no disponible */
    }
  };

  /* ------------------------------ Sub-render: tabla resumen ------------------------------ */
  const renderTableBlock = (title: string, tipo: Tipo) => {
    const { flotaTotal, totalDisponibles, diferencia } = stats[tipo];
    const cell = { width: '100px', padding: 0, textAlign: 'center', alignContent: 'center', fontSize: '15px' } as const;
    return (
      <div style={{ marginBottom: '10px', border: '1px solid #000', fontFamily: 'sans-serif', fontSize: '11px' }}>
        <div style={{ display: 'flex', backgroundColor: '#1a365d', color: '#fff', fontWeight: 'bold' }}>
          <div style={{ flex: 1, padding: '4px', borderRight: '1px solid #000', textAlign: 'center', alignContent: 'center' }}>
            {title}
          </div>
          <div style={{ width: '100px', padding: '4px', textAlign: 'center', backgroundColor: '#3182ce' }}>
            <div style={{ fontSize: '9px', marginBottom: '2px', color: '#e2e8f0' }}>EL ROBLE</div>
            <div>US6</div>
          </div>
        </div>

        <div style={{ display: 'flex', borderTop: '1px solid #000', backgroundColor: '#e2e8f0', fontWeight: 'bold' }}>
          <div style={{ flex: 1, padding: '2px 4px', borderRight: '1px solid #000' }}>
            FLOTA {tipo === 'RIGIDO' ? 'TOTAL' : 'ARTICULADOS'}
          </div>
          <div style={cell}>{flotaTotal}</div>
        </div>

        <div style={{ display: 'flex', borderTop: '1px solid #000', backgroundColor: '#fff' }}>
          <div style={{ flex: 1, padding: '2px 4px', borderRight: '1px solid #000' }}>FUERA DE SERVICIO (OT)</div>
          <div style={{ ...cell, fontWeight: 'bold' }}>{fueraServicioOT[tipo]}</div>
        </div>

        {CATEGORIES.map((cat) => {
          const isRtg = cat.key === 'rtg';
          const value = isRtg ? rtgAutoCount[tipo] : manualCounts[tipo][cat.key] ?? 0;
          return (
            <div key={cat.key} style={{ display: 'flex', borderTop: '1px solid #000', backgroundColor: cat.color }}>
              <div style={{ flex: 1, padding: '2px 4px', borderRight: '1px solid #000', display: 'flex', alignItems: 'center' }}>
                {cat.label}
              </div>
              <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isRtg ? (
                  <div style={{ width: '100%', textAlign: 'center', padding: '4px', fontSize: '15px', fontWeight: 'bold' }}>
                    {value}
                  </div>
                ) : (
                  <input
                    type="number"
                    min="0"
                    value={value}
                    onChange={(e) => handleManualCountChange(tipo, cat.key, e.target.value)}
                    style={{ width: '100%', height: '100%', border: 'none', textAlign: 'center', background: 'transparent', outline: 'none', padding: '4px 0', fontSize: '15px', fontWeight: 'bold' }}
                  />
                )}
              </div>
            </div>
          );
        })}

        <div style={{ display: 'flex', borderTop: '1px solid #000', backgroundColor: '#90cdf4', fontWeight: 'bold' }}>
          <div style={{ flex: 1, padding: '2px 4px', borderRight: '1px solid #000' }}>TOTAL DISPONIBLES</div>
          <div style={cell}>{totalDisponibles}</div>
        </div>

        <div style={{ display: 'flex', borderTop: '1px solid #000', backgroundColor: '#fff' }}>
          <div style={{ flex: 1, padding: '2px 4px', borderRight: '1px solid #000', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
            PO
          </div>
          <div style={{ width: '100px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <input
              type="number"
              value={po[tipo]}
              onChange={(e) => setPo((prev) => ({ ...prev, [tipo]: parseInt(e.target.value, 10) || 0 }))}
              style={{ width: '100%', height: '100%', border: 'none', textAlign: 'center', fontWeight: 'bold', outline: 'none', padding: '4px 0', fontSize: '15px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', borderTop: '1px solid #000', backgroundColor: diferencia >= 0 ? '#c6f6d5' : '#fed7d7', fontWeight: 'bold' }}>
          <div style={{ flex: 1, padding: '2px 4px', borderRight: '1px solid #000' }}>Diferencia P.O</div>
          <div style={{ ...cell, color: diferencia >= 0 ? '#2f855a' : '#c53030' }}>{diferencia}</div>
        </div>
      </div>
    );
  };

  const th = { padding: '4px', border: '1px solid #cbd5e0', textAlign: 'center' } as const;
  const td = { padding: '4px', border: '1px solid #e2e8f0', textAlign: 'center' } as const;

  const flotaBanner = (() => {
    if (flotaLoading) return { tone: 'info', text: 'Cargando flota desde Supabase…' };
    if (flotaError) return { tone: 'error', text: flotaError };
    if (!flota.length) return { tone: 'warn', text: `La tabla «${FLOTA_TABLE}» está vacía. Los conteos aparecerán al poblarla.` };
    return null;
  })();

  return (
    <div className="space-y-4">
      <style>{`
        .proy-no-spin input[type=number]::-webkit-inner-spin-button,
        .proy-no-spin input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        .proy-no-spin input[type=number] { -moz-appearance: textfield; }
      `}</style>

      {/* Encabezado */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700">
            <Icon name="bar-chart" size={20} />
          </span>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Proyección</h1>
            <p className="mt-0.5 text-sm text-slate-500">Análisis de flota operativa (OT y RTG)</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="btn btn-secondary cursor-pointer">
            <Icon name="file" size={16} />
            Subir Excel OT
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload(setOtData, 'OT')} />
          </label>
          <label className="btn btn-primary cursor-pointer">
            <Icon name="upload" size={16} />
            Subir Excel RTG
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload(setRtgData, 'RTG')} />
          </label>
          <label className="btn btn-primary cursor-pointer" style={{ backgroundColor: '#ed8936', borderColor: '#dd6b20' }}>
            <Icon name="upload" size={16} />
            OTROS FS
            <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleUpload(setOtrosFsData, 'OTROS FS')} />
          </label>
          {(rtgData.length > 0 || otrosFsData.length > 0) && (
            <button type="button" onClick={clearAll} className="btn" style={{ background: '#e53e3e', color: '#fff' }}>
              <Icon name="trash" size={16} />
              Limpiar
            </button>
          )}
        </div>
      </div>

      {flotaBanner && (
        <div
          className={`rounded-xl border px-4 py-3 text-sm ${
            flotaBanner.tone === 'error'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : flotaBanner.tone === 'warn'
              ? 'border-amber-200 bg-amber-50 text-amber-800'
              : 'border-sky-200 bg-sky-50 text-sky-800'
          }`}
        >
          {flotaBanner.text}
        </div>
      )}

      {/* Barra de filtros */}
      <div className="card p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {([
            ['terminal', 'Terminal'],
            ['zona', 'Zona'],
            ['servicio', 'Servicio'],
            ['estado', 'Estado'],
            ['oper', 'Operatividad'],
          ] as Array<[keyof FlotaBus & keyof FlotaFilters, string]>).map(([field, label]) => (
            <label key={field} className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
              {label}
              <select
                className="select"
                value={filters[field]}
                onChange={(e) => setFilters((prev) => ({ ...prev, [field]: e.target.value }))}
              >
                <option value="">Todos</option>
                {distinct(flota, field).map((value) => (
                  <option key={value} value={value}>
                    {value}
                  </option>
                ))}
              </select>
            </label>
          ))}
          <label className="flex flex-col gap-1 text-xs font-semibold text-slate-500">
            Búsqueda
            <input
              className="input"
              placeholder="Cód, PPU, modelo…"
              value={filters.search}
              onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
            />
          </label>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
          <span>
            {rows.length} de {flota.length} buses en el análisis
            {' · '}
            {rows.filter((r) => r.tipo === 'RIGIDO').length} rígidos / {rows.filter((r) => r.tipo === 'ARTICULADO').length} articulados
          </span>
          {(filters.terminal || filters.zona || filters.servicio || filters.estado || filters.oper || filters.search) && (
            <button type="button" className="font-semibold text-sky-700 hover:underline" onClick={() => setFilters(EMPTY_FILTERS)}>
              Limpiar filtros
            </button>
          )}
        </div>
      </div>

      {/* Distribución principal */}
      <div className="proy-no-spin flex flex-wrap items-stretch gap-5">
        <div style={{ width: '350px', flexShrink: 0 }}>
          {renderTableBlock('CONTROL DE FLOTA RIGIDO', 'RIGIDO')}
          {renderTableBlock('CONTROL FLOTA ARTICULADO', 'ARTICULADO')}
        </div>

        <div style={{ flex: 1, minWidth: '400px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* RTG vencidas */}
          <div className="card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-3 py-2">
              <h3 className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Icon name="info" size={14} className="text-sky-600" />
                Buses con RTG Vencida
              </h3>
              <span className="badge badge-danger">{rtgVencidas.length} registros</span>
            </div>
            <div style={{ overflowX: 'auto', maxHeight: '400px', overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'sans-serif' }}>
                <thead style={{ backgroundColor: '#3182ce', color: '#fff', position: 'sticky', top: 0 }}>
                  <tr>
                    {['N° Interno', 'Patente', 'Taller', 'TIPO', 'Emisión RTG', 'Vencimiento RTG', 'Dias', 'TIPO PANNE'].map((h) => (
                      <th key={h} style={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rtgVencidas.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: '10px', textAlign: 'center', color: '#718096' }}>
                        No hay datos de RTG o no hay buses vencidos en la flota. Sube el Excel de RTG para analizar.
                      </td>
                    </tr>
                  ) : (
                    rtgVencidas.map((b, idx) => (
                      <tr key={`${b.interno}-${idx}`} style={{ backgroundColor: '#fff' }}>
                        <td style={td}>{b.interno}</td>
                        <td style={td}>{b.patente}</td>
                        <td style={td}>{b.taller}</td>
                        <td style={td}>{b.tipo}</td>
                        <td style={td}>{b.fechaEmision}</td>
                        <td style={{ ...td, backgroundColor: '#fc8181', color: '#fff', fontWeight: 'bold' }}>{b.fechaVencimiento}</td>
                        <td style={td}>{b.dias}</td>
                        <td style={{ ...td, padding: 0 }}>
                          <input
                            type="text"
                            value={manualPannes[b.interno] ?? ''}
                            onChange={(e) => setManualPannes((prev) => ({ ...prev, [b.interno]: e.target.value }))}
                            placeholder="RTG"
                            style={{ width: '100%', border: 'none', background: 'transparent', textAlign: 'center', outline: 'none', padding: '4px', fontSize: '10px' }}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* DETALLE DE OTROS */}
          <div>
            <div style={{ backgroundColor: '#1a365d', color: '#fff', padding: '6px', fontWeight: 'bold', fontSize: '12px', borderTopLeftRadius: '4px', borderTopRightRadius: '4px' }}>
              DETALLE DE OTROS
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '10px', fontFamily: 'sans-serif' }}>
                <thead style={{ backgroundColor: '#ed8936', color: '#fff' }}>
                  <tr>
                    {['PPU', 'TIPO', 'FECHA', 'HORA', 'OBSERVACION'].map((h) => (
                      <th key={h} style={th}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {otrosFsList.length === 0 ? (
                    <tr>
                      <td colSpan={5} style={{ padding: '10px', textAlign: 'center', color: '#718096' }}>
                        No hay datos de otros fuera de servicio. Sube el Excel OTROS FS para analizarlos.
                      </td>
                    </tr>
                  ) : (
                    otrosFsList.map((b, idx) => (
                      <tr key={`${b.ppu}-${idx}`} style={{ backgroundColor: '#fff' }}>
                        <td style={td}>{b.ppu}</td>
                        <td style={{ ...td, fontWeight: 'bold' }}>{b.tipo}</td>
                        <td style={td}>{b.fecha}</td>
                        <td style={td}>{b.hora}</td>
                        <td style={{ ...td, textAlign: 'left' }}>{b.observacion}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Área para pegar imagen */}
          <div
            onPaste={handlePaste}
            tabIndex={0}
            title="Haz clic aquí y presiona Cmd+V o Ctrl+V para pegar una imagen"
            style={{
              flex: 1,
              minHeight: '160px',
              border: '2px dashed #cbd5e0',
              borderRadius: '8px',
              backgroundColor: pastedImage ? '#fff' : '#f7fafc',
              cursor: 'pointer',
              overflow: 'hidden',
              position: 'relative',
              outline: 'none',
            }}
          >
            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {pastedImage ? (
                <img src={pastedImage} alt="Turno pegado" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
              ) : (
                <div style={{ color: '#a0aec0', fontWeight: 'bold', fontSize: '24px', textAlign: 'center', opacity: 0.35, userSelect: 'none', padding: '20px' }}>
                  NO SE REGISTRAN OS EN TURNO
                </div>
              )}
            </div>
            {pastedImage && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setPastedImage(null);
                }}
                style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(229,62,62,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '30px', height: '30px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useMemo } from 'react';
import { BSPPData } from '../../types';
import { exportToPdf } from '../../services/pdfExport';
import { 
  Scale, 
  Download, 
  TrendingDown, 
  TrendingUp, 
  BarChart2, 
  Calendar, 
  Layers, 
  Info,
  CheckCircle2
} from 'lucide-react';

interface BSPPPanelProps {
  bsppList: BSPPData[];
}

export const BSPPPanel: React.FC<BSPPPanelProps> = ({ bsppList }) => {
  const [selectedBahanIndex, setSelectedBahanIndex] = useState<number>(0);
  const [filterJenis, setFilterJenis] = useState<string>('all');
  const [filterFrom, setFilterFrom] = useState<string>('');
  const [filterTo, setFilterTo] = useState<string>('');
  const [granularity, setGranularity] = useState<'bulan' | 'entri'>('bulan');

  const currentData = bsppList[selectedBahanIndex] || bsppList[0];

  const formatNumber = (n: number): string => {
    return Number(n).toLocaleString('id-ID', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    });
  };

  const formatPercent = (n: number): string => {
    return Number(n).toLocaleString('id-ID', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatTanggalIndo = (dateStr: string): string => {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const s = d.toLocaleDateString('id-ID', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
    return s.charAt(0).toUpperCase() + s.slice(1);
  };

  // Filter entries
  const filteredEntries = useMemo(() => {
    if (!currentData || !currentData.entries) return [];

    return currentData.entries.filter(e => {
      if (filterJenis !== 'all' && e.jenis !== filterJenis) return false;
      if (filterFrom && new Date(e.tanggal).getTime() < new Date(filterFrom).getTime()) return false;
      if (filterTo && new Date(e.tanggal).getTime() > new Date(filterTo + 'T23:59:59Z').getTime()) return false;
      return true;
    });
  }, [currentData, filterJenis, filterFrom, filterTo]);

  // Aggregate weighted statistics (Standard formulas from GAS)
  const stats = useMemo(() => {
    let sumLabel = 0;
    let sumTimbang = 0;
    let lebih = 0;
    let kurang = 0;
    let tanpa = 0;

    filteredEntries.forEach(e => {
      sumLabel += e.labelNetto || 0;
      sumTimbang += e.timbangUlang || 0;
      if (e.status.includes('Lebih')) lebih++;
      else if (e.status.includes('Kurang')) kurang++;
      else tanpa++;
    });

    const totalSelisihKg = sumLabel - sumTimbang;
    const totalSelisihPersen = sumLabel > 0 ? (totalSelisihKg / sumLabel) * 100 : 0;

    return {
      count: filteredEntries.length,
      sumLabel,
      sumTimbang,
      totalSelisihKg,
      totalSelisihPersen,
      lebih,
      kurang,
      tanpa
    };
  }, [filteredEntries]);

  // Monthly breakdown for Bar Chart
  const monthlyData = useMemo(() => {
    const monthsMap: { [month: string]: { label: string; lebihKg: number; kurangKg: number; sumSelisihKg: number; sumLabel: number } } = {};
    
    // Sort chronological
    const sorted = [...filteredEntries].sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

    sorted.forEach(e => {
      const d = new Date(e.tanggal);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

      if (!monthsMap[key]) {
        monthsMap[key] = { label, lebihKg: 0, kurangKg: 0, sumSelisihKg: 0, sumLabel: 0 };
      }

      if (e.status.includes('Lebih')) {
        monthsMap[key].lebihKg += Math.abs(e.selisihKg);
      } else if (e.status.includes('Kurang')) {
        monthsMap[key].kurangKg += Math.abs(e.selisihKg);
      }

      monthsMap[key].sumSelisihKg += (e.labelNetto - e.timbangUlang);
      monthsMap[key].sumLabel += e.labelNetto;
    });

    return Object.keys(monthsMap).sort().map(key => ({
      key,
      ...monthsMap[key],
      pct: monthsMap[key].sumLabel > 0 ? (monthsMap[key].sumSelisihKg / monthsMap[key].sumLabel) * 100 : 0
    }));
  }, [filteredEntries]);

  // Max value for bar scaling
  const maxMonthlyKg = useMemo(() => {
    let max = 10;
    monthlyData.forEach(m => {
      if (m.lebihKg > max) max = m.lebihKg;
      if (m.kurangKg > max) max = m.kurangKg;
    });
    return max * 1.15;
  }, [monthlyData]);

  // Export PDF
  const handleExportPdf = () => {
    const head = ['Tanggal', 'Jenis', 'Label Netto (Kg)', 'Timbang Ulang (Kg)', 'Selisih (Kg)', 'Selisih (%)', 'Status'];
    const body = filteredEntries.map(e => [
      formatTanggalIndo(e.tanggal),
      e.jenis,
      formatNumber(e.labelNetto),
      formatNumber(e.timbangUlang),
      formatNumber(e.selisihKg),
      `${formatPercent(e.selisihPersen)}%`,
      e.status
    ]);

    exportToPdf({
      title: `Rekap BSPP (Bukti Selisih Persediaan) - ${currentData.nama}`,
      infoLines: [
        `Komoditas: ${currentData.nama} | Jenis: ${filterJenis === 'all' ? 'Semua Jenis' : filterJenis}`,
        `Periode: ${filterFrom || 'Awal'} s/d ${filterTo || 'Sekarang'} | Jumlah Data: ${stats.count} transaksi`,
        `Akumulasi Selisih Bobot: ${formatNumber(stats.totalSelisihKg)} Kg | Rata-rata Selisih: ${formatPercent(stats.totalSelisihPersen)}%`,
        `Frekuensi Status: ${stats.lebih} Lebih / ${stats.kurang} Kurang / ${stats.tanpa} Tanpa Selisih`
      ],
      head,
      body,
      fileName: `BSPP_${currentData.nama.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-5 sm:p-6 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-blue-700 uppercase tracking-wider mb-1">
            <Scale className="w-4 h-4" />
            <span>Audit Bukti Selisih Persediaan</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            BSPP &amp; Rekap Timbang Ulang ({currentData.nama})
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Perbandingan akurasi berat menurut label karung vendor vs timbang ulang gudang penerimaan
          </p>
        </div>

        <button
          onClick={handleExportPdf}
          disabled={filteredEntries.length === 0}
          className="flex items-center gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 transition-colors shrink-0"
        >
          <Download className="w-4 h-4" />
          <span>Export PDF BSPP</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="p-4 sm:p-5 bg-slate-50/70 border-b border-slate-200 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Bahan BSPP */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Komoditas BSPP
            </label>
            <select
              value={selectedBahanIndex}
              onChange={e => {
                setSelectedBahanIndex(Number(e.target.value));
                setFilterJenis('all');
              }}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {bsppList.map((b, idx) => (
                <option key={b.nama} value={idx}>
                  {b.nama}
                </option>
              ))}
            </select>
          </div>

          {/* Jenis */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Jenis
            </label>
            <select
              value={filterJenis}
              onChange={e => setFilterJenis(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Semua Jenis</option>
              {currentData.jenisList.map(j => (
                <option key={j} value={j}>
                  {j}
                </option>
              ))}
            </select>
          </div>

          {/* Tanggal Dari */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
            />
          </div>

          {/* Tanggal Sampai */}
          <div>
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
              className="w-full text-xs sm:text-sm bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-700"
            />
          </div>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-0.5">
              Jumlah Data
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {stats.count} <span className="text-xs font-normal text-slate-500">transaksi</span>
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-0.5">
              Selisih Bobot
            </span>
            <span className="text-xl sm:text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {formatNumber(stats.totalSelisihKg)} <span className="text-xs font-normal text-slate-500">Kg</span>
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-0.5">
              Rata-rata Selisih (%)
            </span>
            <span className="text-xl sm:text-2xl font-bold text-blue-700 font-mono tabular-nums">
              {formatPercent(stats.totalSelisihPersen)}%
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-semibold uppercase text-slate-500 block mb-0.5">
              Lebih / Kurang / Pas
            </span>
            <div className="text-base sm:text-lg font-bold font-mono tabular-nums flex items-center gap-1.5 mt-0.5">
              <span className="text-emerald-700">{stats.lebih} L</span>
              <span className="text-slate-300">/</span>
              <span className="text-rose-700">{stats.kurang} K</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-600">{stats.tanpa} P</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Chart 1 & Chart 2 (Native SVG Charts - 0 latency, mobile & desktop optimized) */}
      <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-2 gap-5 border-b border-slate-200">
        {/* Chart 1: Monthly Selisih (%) Line/Trend Chart */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Tren Selisih % Rata-rata per Bulan
              </h3>
            </div>
            <span className="text-[11px] text-slate-500 font-mono">Rumus Berbobot</span>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              Tidak ada data periode terpilih
            </div>
          ) : (
            <div className="h-48 flex flex-col justify-end space-y-2">
              <div className="flex items-end justify-between h-36 gap-2 pt-4 px-2 border-b border-slate-200">
                {monthlyData.map(m => {
                  const barH = Math.min(100, Math.max(10, Math.abs(m.pct) * 120));
                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group relative">
                      {/* Tooltip on hover */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-full mb-1 text-[10px] font-mono bg-slate-900 text-white px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-20 shadow-sm">
                        {m.label}: {formatPercent(m.pct)}%
                      </div>
                      <span className="text-[10px] font-mono font-bold text-blue-700">
                        {formatPercent(m.pct)}%
                      </span>
                      <div
                        style={{ height: `${barH}%` }}
                        className="w-full max-w-[28px] rounded-t-md bg-blue-600 group-hover:bg-blue-700 transition-all"
                      ></div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between px-2 text-[10.5px] font-semibold text-slate-600">
                {monthlyData.map(m => (
                  <span key={m.key} className="flex-1 text-center truncate">
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Chart 2: Perbandingan Lebih vs Kurang (Kg) Bar Chart */}
        <div className="p-4 rounded-xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Volume BSPP Lebih vs Kurang (Kg)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-emerald-600"></span> Lebih
              </span>
              <span className="flex items-center gap-1 text-rose-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-xs bg-rose-600"></span> Kurang
              </span>
            </div>
          </div>

          {monthlyData.length === 0 ? (
            <div className="h-44 flex items-center justify-center text-xs text-slate-400">
              Tidak ada data periode terpilih
            </div>
          ) : (
            <div className="h-48 flex flex-col justify-end space-y-2">
              <div className="flex items-end justify-between h-36 gap-3 pt-4 px-2 border-b border-slate-200">
                {monthlyData.map(m => {
                  const hLebih = Math.min(100, (m.lebihKg / maxMonthlyKg) * 100);
                  const hKurang = Math.min(100, (m.kurangKg / maxMonthlyKg) * 100);

                  return (
                    <div key={m.key} className="flex-1 flex flex-col items-center gap-1 group relative">
                      <div className="flex items-end justify-center gap-1 w-full h-full">
                        <div
                          style={{ height: `${Math.max(6, hLebih)}%` }}
                          className="w-1/2 max-w-[14px] rounded-t-sm bg-emerald-600 hover:bg-emerald-700 transition-all"
                          title={`BSPP Lebih: ${formatNumber(m.lebihKg)} Kg`}
                        ></div>
                        <div
                          style={{ height: `${Math.max(6, hKurang)}%` }}
                          className="w-1/2 max-w-[14px] rounded-t-sm bg-rose-600 hover:bg-rose-700 transition-all"
                          title={`BSPP Kurang: ${formatNumber(m.kurangKg)} Kg`}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between px-2 text-[10.5px] font-semibold text-slate-600">
                {monthlyData.map(m => (
                  <span key={m.key} className="flex-1 text-center truncate">
                    {m.label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Table Data */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-[11.5px] font-semibold text-slate-600 uppercase tracking-wider">
              <th className="py-3 px-4">Tanggal</th>
              <th className="py-3 px-4">Jenis</th>
              <th className="py-3 px-4 text-right">Label Netto (Kg)</th>
              <th className="py-3 px-4 text-right">Timbang Ulang (Kg)</th>
              <th className="py-3 px-4 text-right">Selisih (Kg)</th>
              <th className="py-3 px-4 text-right">Selisih (%)</th>
              <th className="py-3 px-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs sm:text-sm">
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400">
                  Tidak ada data BSPP yang cocok dengan filter.
                </td>
              </tr>
            ) : (
              filteredEntries.map((e, index) => {
                const isLebih = e.status.includes('Lebih');
                const isKurang = e.status.includes('Kurang');

                return (
                  <tr key={index} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                      {formatTanggalIndo(e.tanggal)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap font-semibold text-slate-900">
                      {e.jenis}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums text-slate-700">
                      {formatNumber(e.labelNetto)}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums text-slate-700">
                      {formatNumber(e.timbangUlang)}
                    </td>
                    <td className={`py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-bold ${
                      isLebih ? 'text-emerald-700' : (isKurang ? 'text-rose-700' : 'text-slate-600')
                    }`}>
                      {formatNumber(e.selisihKg)}
                    </td>
                    <td className={`py-3 px-4 whitespace-nowrap text-right font-mono tabular-nums font-semibold ${
                      isLebih ? 'text-emerald-700' : (isKurang ? 'text-rose-700' : 'text-slate-600')
                    }`}>
                      {formatPercent(e.selisihPersen)}%
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-flex items-center text-xs font-semibold ${
                        isLebih ? 'text-emerald-700' : (isKurang ? 'text-rose-700' : 'text-slate-600')
                      }`}>
                        {e.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

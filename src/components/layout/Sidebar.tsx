import React from 'react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Layers, 
  Scale, 
  BarChart3, 
  Database, 
  ExternalLink, 
  ShieldCheck, 
  Factory,
  Radio
} from 'lucide-react';
import { UserSession } from '../../types';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  session: UserSession;
  onOpenMigration: () => void;
  onOpenSwitchApp: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  session,
  onOpenMigration,
  onOpenSwitchApp
}) => {
  const menuItems = [
    {
      id: 'ringkasan',
      label: 'Ringkasan Stok',
      desc: '4 Bahan Baku Utama',
      icon: LayoutDashboard
    },
    {
      id: 'mutasi',
      label: 'Mutasi Terbaru',
      desc: 'Lintas Komoditas & Filter',
      icon: ArrowLeftRight
    },
    {
      id: 'kode',
      label: 'Saldo Kode / Grade',
      desc: 'Live & Snapshot Tanggal',
      icon: Layers
    },
    {
      id: 'bspp',
      label: 'BSPP & Selisih',
      desc: 'Cengkeh & Rajang II',
      icon: Scale
    },
    {
      id: 'analisa',
      label: 'Analisa & Ringkasan',
      desc: 'Pergerakan & Validasi',
      icon: BarChart3
    }
  ];

  return (
    <aside className="w-64 xl:w-72 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
            <Factory className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-white tracking-tight truncate">
              PT BATU KARANG
            </h2>
            <p className="text-xs text-slate-400 font-medium truncate">
              Divisi Produksi I (PP1)
            </p>
          </div>
        </div>

        {/* User Role Card in Sidebar */}
        <div className="mt-4 p-3 bg-slate-800/60 rounded-xl border border-slate-700/60">
          <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
            <span className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
              <span>Akses Aktif</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live
            </span>
          </div>
          <div className="text-sm font-semibold text-white truncate">
            {session.nama}
          </div>
          <div className="text-[12px] text-blue-300 font-medium">
            {session.role}
          </div>
        </div>
      </div>

      {/* Navigation List */}
      <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
          Modul Operasional
        </div>

        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/70'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <div className="min-w-0">
                <div className="text-xs font-semibold truncate leading-tight">
                  {item.label}
                </div>
                <div className={`text-[10.5px] truncate ${isActive ? 'text-blue-100' : 'text-slate-500'}`}>
                  {item.desc}
                </div>
              </div>
            </button>
          );
        })}

        <div className="pt-4 px-3 pb-2 text-[10.5px] font-bold text-slate-500 uppercase tracking-wider">
          Infrastruktur & Integrasi
        </div>

        {/* GAS Headless Config Tab */}
        <button
          onClick={onOpenMigration}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all"
        >
          <Database className="w-5 h-5 text-indigo-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight text-indigo-200">
              Headless GAS Center
            </div>
            <div className="text-[10.5px] text-slate-500 truncate">
              REST JSON API &amp; Test URL
            </div>
          </div>
        </button>

        {/* Switch App Board */}
        <button
          onClick={onOpenSwitchApp}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-slate-400 hover:text-slate-100 hover:bg-slate-800/70 transition-all"
        >
          <ExternalLink className="w-5 h-5 text-emerald-400 shrink-0" />
          <div className="min-w-0">
            <div className="text-xs font-semibold truncate leading-tight text-emerald-200">
              Switch Board Susut
            </div>
            <div className="text-[10.5px] text-slate-500 truncate">
              Blend, Cengkeh, Tembakau
            </div>
          </div>
        </button>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-[11px] text-slate-500 space-y-1">
        <div className="flex items-center justify-between">
          <span>Backend GAS:</span>
          <span className="text-slate-400 font-mono text-[10px]">Headless REST</span>
        </div>
        <div className="flex items-center justify-between">
          <span>Telegram Bot:</span>
          <span className="text-emerald-400 font-mono text-[10px] flex items-center gap-1">
            <Radio className="w-2.5 h-2.5" /> Polling 1m
          </span>
        </div>
        <div className="pt-2 text-[10px] text-slate-600 text-center border-t border-slate-800/60">
          Divisi Produksi I · Lalu Mahendra
        </div>
      </div>
    </aside>
  );
};

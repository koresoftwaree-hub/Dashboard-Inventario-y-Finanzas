"use client";

import { useState, useEffect } from "react";
import { TrendingUp, Package, DollarSign, AlertTriangle } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../firebase";
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

export default function DashboardPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [movimientos, setMovimientos] = useState<any[]>([]);
  const [stats, setStats] = useState({ capitalTotal: 0, productosActivos: 0, stockCritico: 0 });

  useEffect(() => {
    const unsubProds = onSnapshot(collection(db, "productos"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(lista);
      const capital = lista.reduce((acc, p) => acc + (Number(p.stock) * Number(p.precio)), 0);
      const criticos = lista.filter(p => Number(p.stock) <= Number(p.stockMinimo)).length;
      setStats({ capitalTotal: capital, productosActivos: lista.length, stockCritico: criticos });
    });

    const unsubMovs = onSnapshot(collection(db, "movimientos"), (snapshot) => {
      const lista = snapshot.docs.map(doc => doc.data());
      lista.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      
      const formateada = lista.slice(-30).map(data => ({
        fecha: new Date(data.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        cantidad: Number(data.cantidad),
        tipo: data.tipo
      }));
      setMovimientos(formateada);
    });

    return () => { unsubProds(); unsubMovs(); };
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Inteligencia de datos en tiempo real.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><DollarSign size={16}/> Capital Inmovilizado</p>
          <p className="text-3xl font-heading font-bold text-white">${stats.capitalTotal.toLocaleString('es-AR')}</p>
        </div>
        <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-4 flex items-center gap-2"><Package size={16}/> Productos Activos</p>
          <p className="text-3xl font-heading font-bold text-white">{stats.productosActivos}</p>
        </div>
        <div className={`bg-card border p-6 rounded-xl shadow-sm ${stats.stockCritico > 0 ? 'border-destructive/50 bg-destructive/10' : 'border-border'}`}>
          <p className={`text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2 ${stats.stockCritico > 0 ? 'text-destructive' : 'text-muted-foreground'}`}><AlertTriangle size={16}/> Alertas de Stock</p>
          <p className="text-3xl font-heading font-bold text-white">{stats.stockCritico}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 min-h-[400px]">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6 flex items-center gap-2">
            <TrendingUp size={16} className="text-primary" /> Tendencia de Actividad
          </h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={movimientos}>
                <defs>
                  <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0A5A8C" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#0A5A8C" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
                <XAxis dataKey="fecha" stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6B7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#121212', border: '1px solid #2A2A2A', borderRadius: '8px' }} itemStyle={{ color: '#FFFFFF', fontSize: '12px' }}/>
                <Area type="monotone" dataKey="cantidad" stroke="#0A5A8C" strokeWidth={2} fillOpacity={1} fill="url(#colorPrimary)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 flex flex-col">
          <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-6">Actividad Reciente</h3>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2">
            {movimientos.length === 0 ? (
              <p className="text-muted-foreground text-sm text-center mt-10">Sin registros.</p>
            ) : (
              movimientos.slice().reverse().map((m, i) => (
                <div key={i} className="flex justify-between items-center border-b border-border/50 pb-3">
                  <div>
                    <p className="text-xs font-bold text-white uppercase tracking-tight">{m.tipo}</p>
                    <p className="text-[10px] text-muted-foreground">{m.fecha}</p>
                  </div>
                  <span className={`text-sm font-mono font-bold ${m.tipo === 'Entrada' ? 'text-emerald-500' : 'text-destructive'}`}>
                    {m.tipo === 'Entrada' ? '+' : '-'}{m.cantidad}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
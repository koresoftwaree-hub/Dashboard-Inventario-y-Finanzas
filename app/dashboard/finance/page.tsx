"use client";

import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownRight, Activity } from "lucide-react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../../../firebase";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancePage() {
  const [finanzas, setFinanzas] = useState({ ingresos: 0, egresos: 0, margen: 0 });
  const [grafico, setGrafico] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, "movimientos"), (snapshot) => {
      const lista = snapshot.docs.map(doc => doc.data());
      
      // Filtramos para obtener dinero real
      const ventas = lista.filter(m => m.tipo === 'Salida' && m.motivo === 'Venta');
      const compras = lista.filter(m => m.tipo === 'Entrada' && m.motivo === 'Compra a Proveedor');

      // Calculamos totales usando el precio histórico guardado
      const totalIngresos = ventas.reduce((acc, m) => acc + (Number(m.cantidad) * (Number(m.precioHistorico) || 0)), 0);
      const totalEgresos = compras.reduce((acc, m) => acc + (Number(m.cantidad) * (Number(m.precioHistorico) || 0)), 0);
      
      const ganancia = totalIngresos - totalEgresos;
      const porcentajeMargen = totalIngresos > 0 ? ((ganancia / totalIngresos) * 100).toFixed(1) : 0;

      setFinanzas({ ingresos: totalIngresos, egresos: totalEgresos, margen: Number(porcentajeMargen) });

      // Preparamos datos para el gráfico comparativo
      setGrafico([
        { name: 'Gastos', valor: totalEgresos, fill: '#DC2626' },
        { name: 'Facturación', valor: totalIngresos, fill: '#10B981' }
      ]);
    });

    return () => unsub();
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      <div>
        <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Finanzas</h1>
        <p className="text-muted-foreground mt-1">Rendimiento, facturación y control de costos.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border p-6 rounded-xl border-l-4 border-l-emerald-500 shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground text-sm mb-4 font-bold uppercase tracking-widest"><Wallet size={18}/> Ingresos (Ventas)</div>
          <div className="text-3xl font-heading font-bold text-white">${finanzas.ingresos.toLocaleString('es-AR')}</div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl border-l-4 border-l-destructive shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground text-sm mb-4 font-bold uppercase tracking-widest"><ArrowDownRight size={18}/> Costos (Compras)</div>
          <div className="text-3xl font-heading font-bold text-white">${finanzas.egresos.toLocaleString('es-AR')}</div>
        </div>

        <div className="bg-card border border-border p-6 rounded-xl border-l-4 border-l-primary shadow-sm">
          <div className="flex items-center gap-3 text-muted-foreground text-sm mb-4 font-bold uppercase tracking-widest"><Activity size={18}/> Margen Bruto</div>
          <div className="text-3xl font-heading font-bold text-white">{finanzas.margen}%</div>
          <div className="mt-2 text-xs text-muted-foreground">Rentabilidad general</div>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-8 min-h-[400px]">
        <h3 className="text-white font-bold text-sm uppercase tracking-widest mb-8 flex items-center gap-2">
           Balance Operativo Real
        </h3>
        <div className="h-[300px] w-full md:w-2/3 lg:w-1/2 mx-auto">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={grafico}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1A1A1A" vertical={false} />
              <XAxis dataKey="name" stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#6B7280" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
              <Tooltip cursor={{fill: '#1A1A1A'}} contentStyle={{ backgroundColor: '#121212', border: '1px solid #2A2A2A', borderRadius: '8px', color: '#fff' }} />
              <Bar dataKey="valor" radius={[4, 4, 0, 0]} barSize={60} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}
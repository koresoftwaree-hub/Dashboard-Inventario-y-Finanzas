"use client";

import { useState, useEffect } from "react";
import { Plus, Search, Filter, ArrowUpDown, X, ArrowUpRight, ArrowDownRight, Activity, Trash2, Save } from "lucide-react";
import { collection, addDoc, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore"; 
import { db } from "../../../firebase"; 

export default function InventoryPage() {
  const [productos, setProductos] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nuevoProd, setNuevoProd] = useState({ nombre: "", categoria: "Insumos", stock: "", stockMinimo: "", precio: "" });

  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [movimiento, setMovimiento] = useState({ tipo: "Entrada", cantidad: "", motivo: "Compra a Proveedor" });
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState({ nombre: "", stockMinimo: "", precio: "" });

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, "productos"), (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProductos(lista);
      if (selectedProduct) {
        const actualizado = lista.find(p => p.id === selectedProduct.id);
        if (actualizado) {
          setSelectedProduct(actualizado);
          if (!editMode) setEditData({ nombre: actualizado.nombre, stockMinimo: actualizado.stockMinimo, precio: actualizado.precio });
        }
      }
    });
    return () => unsubscribe();
  }, [selectedProduct, editMode]);

  const guardarProducto = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, "productos"), {
        nombre: nuevoProd.nombre,
        categoria: nuevoProd.categoria,
        stock: Number(nuevoProd.stock),
        stockMinimo: Number(nuevoProd.stockMinimo),
        precio: Number(nuevoProd.precio),
        fechaCreacion: new Date().toISOString()
      });
      setIsModalOpen(false);
      setNuevoProd({ nombre: "", categoria: "Insumos", stock: "", stockMinimo: "", precio: "" });
    } catch (error) { alert("Error de conexión al guardar."); }
  };

  const registrarMovimiento = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct || !movimiento.cantidad) return;
    const cant = Number(movimiento.cantidad);
    
    if (movimiento.tipo === "Salida" && cant > selectedProduct.stock) {
      return alert("Stock insuficiente.");
    }

    try {
      const nuevoStock = movimiento.tipo === "Entrada" ? selectedProduct.stock + cant : selectedProduct.stock - cant;
      
      // 1. Actualiza Inventario
      await updateDoc(doc(db, "productos", selectedProduct.id), { stock: nuevoStock });
      
      // 2. Alimenta Finanzas (Guardamos el precio histórico)
      await addDoc(collection(db, "movimientos"), {
        productoId: selectedProduct.id,
        productoNombre: selectedProduct.nombre,
        tipo: movimiento.tipo,
        cantidad: cant,
        motivo: movimiento.motivo,
        precioHistorico: selectedProduct.precio, // <--- CLAVE PARA FINANZAS
        fecha: new Date().toISOString()
      });

      setMovimiento({ ...movimiento, cantidad: "" });
    } catch (error) { alert("Error al registrar movimiento."); }
  };

  const actualizarProducto = async () => {
    if (!selectedProduct) return;
    try {
      await updateDoc(doc(db, "productos", selectedProduct.id), {
        nombre: editData.nombre,
        stockMinimo: Number(editData.stockMinimo),
        precio: Number(editData.precio)
      });
      setEditMode(false);
      setSelectedProduct(null); 
    } catch (e) { alert("Error al actualizar"); }
  };

  const borrarProducto = async () => {
    if (!selectedProduct) return;
    if (confirm(`¿Borrar definitivamente ${selectedProduct.nombre}?`)) {
      try {
        await deleteDoc(doc(db, "productos", selectedProduct.id));
        setSelectedProduct(null); 
      } catch (e) { alert("Error al borrar"); }
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-bold text-white tracking-tight">Inventario</h1>
          <p className="text-muted-foreground mt-1">Gestión de stock y trazabilidad.</p>
        </div>
        <button onClick={() => { setNuevoProd({ nombre: "", categoria: "Insumos", stock: "", stockMinimo: "", precio: "" }); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-primary/20 transition-all active:scale-95">
          <Plus size={18} /> Nuevo Producto
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground font-medium border-b border-border">
            <tr>
              <th className="px-6 py-4">Producto <ArrowUpDown size={14} className="inline ml-1"/></th>
              <th className="px-6 py-4">Categoría</th>
              <th className="px-6 py-4">Stock Actual</th>
              <th className="px-6 py-4">Precio (Venta)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {productos.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-12 text-center text-muted-foreground font-medium">El inventario está vacío.</td></tr>
            ) : (
              productos.map((prod) => {
                const stockBajo = prod.stock <= (prod.stockMinimo || 5);
                return (
                  <tr key={prod.id} onClick={() => { setSelectedProduct(prod); setEditMode(false); }} className="hover:bg-muted/30 transition-colors group cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white group-hover:text-primary transition-colors">{prod.nombre}</div>
                      <div className="text-[10px] text-muted-foreground font-mono uppercase tracking-wider">ID-{prod.id.slice(0,6)}</div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{prod.categoria}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-bold ${stockBajo ? 'bg-destructive/10 text-destructive border border-destructive/20' : 'bg-primary/10 text-primary'}`}>
                        {stockBajo ? `⚠️ ${prod.stock} (Mín: ${prod.stockMinimo})` : `${prod.stock} un.`}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-white font-mono">${prod.precio}</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center p-6 border-b border-border">
              <h2 className="text-xl font-heading font-bold text-white">Nuevo Artículo</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-white"><X size={20} /></button>
            </div>
            <form onSubmit={guardarProducto} className="p-6 space-y-4">
              <div>
                <label htmlFor="nuevo-nombre" className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Nombre</label>
                <input id="nuevo-nombre" required type="text" value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="nuevo-stock" className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Stock Inicial</label>
                  <input id="nuevo-stock" required type="number" min="0" value={nuevoProd.stock} onChange={e => setNuevoProd({...nuevoProd, stock: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                </div>
                <div>
                  <label htmlFor="nuevo-minimo" className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Stock Mínimo</label>
                  <input id="nuevo-minimo" required type="number" min="0" value={nuevoProd.stockMinimo} onChange={e => setNuevoProd({...nuevoProd, stockMinimo: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label htmlFor="nuevo-precio" className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Precio Venta ($)</label>
                <input id="nuevo-precio" required type="number" min="0" value={nuevoProd.precio} onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
              </div>
              <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3.5 rounded-xl shadow-lg mt-4 active:scale-95 transition-all">CREAR PRODUCTO</button>
            </form>
          </div>
        </div>
      )}

      {selectedProduct && (
        <>
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[40]" onClick={() => setSelectedProduct(null)} />
          <div className="fixed inset-y-0 right-0 w-full md:w-[400px] bg-card border-l border-border shadow-2xl z-[50] flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-border flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-heading font-bold text-white">{editMode ? "Editar Artículo" : selectedProduct.nombre}</h2>
                {!editMode && <p className="text-sm text-muted-foreground font-mono mt-1">Stock Actual: {selectedProduct.stock} un.</p>}
              </div>
              <button onClick={() => { setSelectedProduct(null); setEditMode(false); }} className="text-muted-foreground hover:text-white bg-background p-2 rounded-lg border border-border"><X size={18} /></button>
            </div>

            <div className="p-6 flex-1 overflow-y-auto flex flex-col">
              {editMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Nombre</label>
                    <input type="text" value={editData.nombre} onChange={e => setEditData({...editData, nombre: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Stock Mínimo</label>
                      <input type="number" value={editData.stockMinimo} onChange={e => setEditData({...editData, stockMinimo: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-muted-foreground uppercase mb-1 block">Precio ($)</label>
                      <input type="number" value={editData.precio} onChange={e => setEditData({...editData, precio: e.target.value})} className="w-full bg-background border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary" />
                    </div>
                  </div>
                  <div className="pt-4 space-y-2">
                    <button onClick={actualizarProducto} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-bold transition-all"><Save size={18}/> GUARDAR CAMBIOS</button>
                    <button onClick={() => setEditMode(false)} className="w-full text-muted-foreground hover:text-white py-2 font-medium transition-colors">CANCELAR</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="bg-background border border-border p-5 rounded-xl mb-6">
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2"><Activity size={16} className="text-primary"/> Registrar Movimiento</h3>
                    <form onSubmit={registrarMovimiento} className="space-y-4">
                      <div className="grid grid-cols-2 gap-2 p-1 bg-card border border-border rounded-lg mb-4">
                        <button type="button" onClick={() => setMovimiento({...movimiento, tipo: "Entrada", motivo: "Compra a Proveedor"})} className={`py-2 text-sm font-bold rounded-md flex items-center justify-center gap-1 transition-all ${movimiento.tipo === 'Entrada' ? 'bg-emerald-500/10 text-emerald-500' : 'text-muted-foreground hover:text-white'}`}><ArrowUpRight size={16}/> ENTRADA</button>
                        <button type="button" onClick={() => setMovimiento({...movimiento, tipo: "Salida", motivo: "Venta"})} className={`py-2 text-sm font-bold rounded-md flex items-center justify-center gap-1 transition-all ${movimiento.tipo === 'Salida' ? 'bg-destructive/10 text-destructive' : 'text-muted-foreground hover:text-white'}`}><ArrowDownRight size={16}/> SALIDA</button>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Motivo</label>
                        <select value={movimiento.motivo} onChange={e => setMovimiento({...movimiento, motivo: e.target.value})} className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary">
                          {movimiento.tipo === "Entrada" ? (
                            <><option>Compra a Proveedor</option><option>Ajuste Positivo</option><option>Devolución de Cliente</option></>
                          ) : (
                            <><option>Venta</option><option>Merma / Desperdicio</option><option>Ajuste Negativo</option></>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-muted-foreground uppercase block mb-1">Cantidad</label>
                        <input required type="number" min="1" value={movimiento.cantidad} onChange={e => setMovimiento({...movimiento, cantidad: e.target.value})} className="w-full bg-card border border-border rounded-xl px-4 py-3 text-white outline-none focus:border-primary font-mono text-lg" placeholder="0" />
                      </div>
                      <button type="submit" className={`w-full font-bold py-3.5 rounded-xl transition-all mt-2 active:scale-95 ${movimiento.tipo === 'Entrada' ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-destructive hover:bg-destructive/90 text-white'}`}>
                        CONFIRMAR {movimiento.tipo.toUpperCase()}
                      </button>
                    </form>
                  </div>
                  <div className="mt-auto pt-6 border-t border-border space-y-3">
                    <button onClick={() => setEditMode(true)} className="w-full bg-secondary hover:bg-secondary/80 text-white py-3 rounded-xl font-medium transition-colors">EDITAR PRODUCTO</button>
                    <button onClick={borrarProducto} className="w-full text-destructive/60 hover:text-destructive py-3 rounded-xl flex items-center justify-center gap-2 transition-colors text-sm font-bold"><Trash2 size={16} /> BORRAR</button>
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
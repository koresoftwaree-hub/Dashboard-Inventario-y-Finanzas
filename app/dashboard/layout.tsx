"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Package, PieChart, Settings, LogOut } from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const menu = [
    { name: "Inicio", path: "/dashboard", icon: <LayoutDashboard size={20} /> },
    { name: "Inventario", path: "/dashboard/inventory", icon: <Package size={20} /> },
    { name: "Finanzas", path: "/dashboard/finance", icon: <PieChart size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar Profesional */}
      <aside className="w-64 bg-card border-r border-border flex flex-col hidden md:flex">
        <div className="h-20 flex items-center px-8 border-b border-border">
          <h1 className="text-2xl font-heading font-bold text-white tracking-tighter flex items-end">
            kore<span className="text-primary text-3xl leading-[0.6]">.</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          {menu.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link key={item.path} href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
                  isActive ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-white hover:bg-muted/50"
                }`}
              >
                {item.icon}
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-border space-y-2">
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-muted-foreground hover:text-white hover:bg-muted/50 transition-all font-medium">
            <Settings size={20} /> Configuración
          </button>
          <button className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-all font-medium">
            <LogOut size={20} /> Salir
          </button>
        </div>
      </aside>

      {/* Contenido Principal */}
      <main className="flex-1 overflow-y-auto p-8 bg-background">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
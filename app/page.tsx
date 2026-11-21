
"use client";

import { useState } from "react";

const modules = [
  { name: "CCTV", icon: "📹", desc: "Camera planning" },
  { name: "Alarm System", icon: "🚨", desc: "Security planning" },
  { name: "Network", icon: "🌐", desc: "Network topology" },
  { name: "Sound System", icon: "🔊", desc: "Audio planning" },
  { name: "Smart Home", icon: "🏠", desc: "Home automation" },
  { name: "Solar System", icon: "☀️", desc: "PV calculations" },
  { name: "UPS Calculator", icon: "🔋", desc: "Backup calculations" },
  { name: "Quotation", icon: "📄", desc: "Create quotations" },
];

export default function Home() {
  const [selected, setSelected] = useState("Dashboard");

  return (
    <main className="min-h-screen bg-slate-950 text-white p-5 md:p-10">
      <header className="flex flex-wrap justify-between items-center gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-cyan-400">PlanYar</h1>
          <p className="text-slate-400 mt-1">Engineering Project Planner</p>
        </div>
        <span className="rounded-full bg-slate-800 px-4 py-2 text-sm">
          Version 1.0 MVP
        </span>
      </header>

      <section className="mb-8 rounded-2xl border border-slate-700 bg-slate-900 p-6">
        <p className="text-cyan-400 text-sm mb-2">WELCOME TO PLANYAR</p>
        <h2 className="text-2xl md:text-4xl font-bold">
          Plan smarter. Build better.
        </h2>
        <p className="text-slate-400 mt-3">
          Manage your engineering projects in one workspace.
        </p>
      </section>

      <div className="flex flex-wrap gap-2 mb-6">
        {["Dashboard", "Projects", "Products", "Settings"].map((item) => (
          <button
            key={item}
            onClick={() => setSelected(item)}
            className={`rounded-lg px-4 py-2 ${
              selected === item
                ? "bg-cyan-500 text-slate-950"
                : "bg-slate-800 text-white"
            }`}
          >
            {item}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-semibold mb-4">{selected}</h2>

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {modules.map((item) => (
          <button
            key={item.name}
            onClick={() => setSelected(item.name)}
            className="text-left rounded-xl border border-slate-700 bg-slate-900 p-5 hover:border-cyan-400 transition"
          >
            <div className="text-3xl mb-4">{item.icon}</div>
            <h3 className="font-bold">{item.name}</h3>
            <p className="text-sm text-slate-400 mt-2">{item.desc}</p>
          </button>
        ))}
      </section>

      <footer className="text-center text-slate-500 text-sm mt-12">
        PlanYar © 2026 — Engineering made easier.
      </footer>
    </main>
  );
}

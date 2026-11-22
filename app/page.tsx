"use client";

import { useMemo, useState } from "react";

type Project = { id: number; name: string; client: string; system: string; status: string };
type Module = { name: string; icon: string; desc: string };

const modules: Module[] = [
  { name: "CCTV", icon: "📹", desc: "Camera layout and coverage planning" },
  { name: "Alarm System", icon: "🚨", desc: "Sensors, zones and security planning" },
  { name: "Network", icon: "🌐", desc: "Network topology and equipment" },
  { name: "Sound System", icon: "🔊", desc: "Speaker layout and audio planning" },
  { name: "Smart Home", icon: "🏠", desc: "Home automation planning" },
  { name: "Solar System", icon: "☀️", desc: "PV array and energy estimates" },
  { name: "UPS Calculator", icon: "🔋", desc: "Backup time and battery estimates" },
  { name: "Quotation", icon: "📄", desc: "Bill of quantities and quotations" },
];

const navItems = ["Dashboard", "Projects", "Products", "Calculators", "Settings"];

function Field({ label, value, onChange, unit, min = 0, max, step = 1 }: {
  label: string; value: number; onChange: (value: number) => void; unit?: string; min?: number; max?: number; step?: number;
}) {
  return <label className="block text-sm text-slate-300">{label}
    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-3">
      <input className="w-full border-0 bg-transparent px-0 py-3 text-white outline-none" type="number" min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(Math.max(min, Number(e.target.value) || 0))} />
      {unit && <span className="text-xs text-slate-500">{unit}</span>}
    </div>
  </label>;
}

export default function Home() {
  const [section, setSection] = useState("Dashboard");
  const [activeModule, setActiveModule] = useState("CCTV");
  const [projects, setProjects] = useState<Project[]>([
    { id: 1, name: "Sample CCTV Project", client: "Demo Client", system: "CCTV", status: "Planning" },
  ]);
  const [projectName, setProjectName] = useState("");
  const [client, setClient] = useState("");
  const [system, setSystem] = useState("CCTV");
  const [loadKw, setLoadKw] = useState(5);
  const [backupHours, setBackupHours] = useState(2);
  const [voltage, setVoltage] = useState(51.2);
  const [efficiency, setEfficiency] = useState(90);
  const [panelW, setPanelW] = useState(630);
  const [dailyKwh, setDailyKwh] = useState(25);
  const [sunHours, setSunHours] = useState(5);
  const [losses, setLosses] = useState(80);
  const [quoteItems, setQuoteItems] = useState<{ name: string; qty: number; price: number }[]>([]);
  const [productName, setProductName] = useState("");
  const [productPrice, setProductPrice] = useState(0);

  const ups = useMemo(() => {
    const energy = loadKw * backupHours;
    const batteryKwh = energy / (efficiency / 100);
    const capacityAh = (batteryKwh * 1000) / voltage;
    return { energy, batteryKwh, capacityAh };
  }, [loadKw, backupHours, voltage, efficiency]);

  const solar = useMemo(() => {
    const arrayKw = dailyKwh / (sunHours * (losses / 100));
    return { arrayKw, panelCount: Math.ceil((arrayKw * 1000) / panelW) };
  }, [dailyKwh, sunHours, losses, panelW]);

  const total = quoteItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) return;
    setProjects((current) => [{ id: Date.now(), name: projectName.trim(), client: client.trim() || "Not specified", system, status: "Planning" }, ...current]);
    setProjectName(""); setClient(""); setSection("Projects");
  }

  function addQuoteItem(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || productPrice <= 0) return;
    setQuoteItems((current) => [...current, { name: productName.trim(), qty: 1, price: productPrice }]);
    setProductName(""); setProductPrice(0);
  }

  const panel = "rounded-2xl border border-slate-800 bg-slate-900/90 p-5 shadow-lg shadow-black/10";
  const button = "rounded-xl bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300";
  const secondary = "rounded-xl border border-slate-700 bg-slate-800 px-4 py-2.5 text-slate-200 hover:border-cyan-400";

  return (
    <main className="min-h-screen bg-[#070d1a] px-4 py-5 text-white md:px-8 md:py-8">
      <div className="mx-auto max-w-7xl">
        <header className="mb-7 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-400 text-2xl font-black text-slate-950">P</div>
            <div><h1 className="text-3xl font-black tracking-tight text-cyan-300">PlanYar</h1><p className="text-sm text-slate-400">Engineering Project Planner</p></div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-800 bg-emerald-950/50 px-4 py-2 text-sm text-emerald-300"><span className="h-2 w-2 rounded-full bg-emerald-400" /> MVP workspace</div>
        </header>

        <section className="mb-6 overflow-hidden rounded-3xl border border-cyan-900/60 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/60 p-6 md:p-9">
          <p className="mb-2 text-xs font-bold uppercase tracking-[.25em] text-cyan-300">Engineering workspace</p>
          <h2 className="max-w-2xl text-3xl font-bold md:text-4xl">Plan smarter. Build better.</h2>
          <p className="mt-3 max-w-2xl text-slate-300">Organize technical projects, estimate energy requirements and prepare your project quotation in one place.</p>
          <div className="mt-6 flex flex-wrap gap-3"><button className={button} onClick={() => setSection("Projects")}>Open projects</button><button className={secondary} onClick={() => setSection("Calculators")}>Open calculators</button></div>
        </section>

        <nav className="mb-7 flex gap-2 overflow-x-auto pb-2">
          {navItems.map((item) => <button key={item} onClick={() => setSection(item)} className={`shrink-0 rounded-xl px-4 py-2.5 text-sm font-semibold ${section === item ? "bg-cyan-400 text-slate-950" : "bg-slate-900 text-slate-300 hover:bg-slate-800"}`}>{item}</button>)}
        </nav>

        {section === "Dashboard" && <>
          <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            {[["Projects", projects.length], ["System modules", modules.length], ["Quotation items", quoteItems.length], ["Quote total", `$${total.toFixed(2)}`]].map(([label, value]) => <div className={panel} key={String(label)}><p className="text-sm text-slate-400">{label}</p><p className="mt-2 text-2xl font-bold text-cyan-300">{value}</p></div>)}
          </div>
          <h3 className="mb-4 text-xl font-bold">Engineering modules</h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {modules.map((item) => <button key={item.name} onClick={() => { setActiveModule(item.name); setSection(item.name === "UPS Calculator" || item.name === "Solar System" ? "Calculators" : item.name === "Quotation" ? "Products" : "Projects"); }} className={`${panel} text-left transition hover:-translate-y-1 hover:border-cyan-500`}><div className="mb-4 text-3xl">{item.icon}</div><h4 className="font-bold">{item.name}</h4><p className="mt-2 text-sm text-slate-400">{item.desc}</p><p className="mt-4 text-xs font-semibold text-cyan-300">Open module →</p></button>)}
          </div>
        </>}

        {section === "Projects" && <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <form onSubmit={addProject} className={panel}>
            <h3 className="mb-4 text-xl font-bold">Create a project</h3>
            <label className="mb-4 block text-sm text-slate-300">Project name<input required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Erbil Office Security" className="mt-2 w-full" /></label>
            <label className="mb-4 block text-sm text-slate-300">Client / site<input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or location" className="mt-2 w-full" /></label>
            <label className="mb-5 block text-sm text-slate-300">Main system<select value={system} onChange={(e) => setSystem(e.target.value)} className="mt-2 w-full">{modules.map((m) => <option key={m.name}>{m.name}</option>)}</select></label>
            <button className={button} type="submit">+ Create project</button>
          </form>
          <div className={panel}><h3 className="mb-4 text-xl font-bold">Project list <span className="text-sm font-normal text-slate-500">({projects.length})</span></h3>
            <div className="space-y-3">{projects.map((p) => <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-semibold">{p.name}</h4><p className="mt-1 text-sm text-slate-400">{p.client} · {p.system}</p></div><span className="rounded-full bg-amber-950 px-3 py-1 text-xs text-amber-300">{p.status}</span></div></div>)}</div>
          </div>
        </div>}

        {section === "Calculators" && <div className="grid gap-5 lg:grid-cols-2">
          <section className={panel}><div className="mb-5 flex items-center gap-3"><span className="text-3xl">🔋</span><div><h3 className="text-xl font-bold">UPS battery estimator</h3><p className="text-sm text-slate-400">Preliminary energy and battery capacity</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Load" value={loadKw} onChange={setLoadKw} unit="kW" step={0.1}/><Field label="Backup time" value={backupHours} onChange={setBackupHours} unit="hours" step={0.5}/><Field label="Battery voltage" value={voltage} onChange={setVoltage} unit="V" step={0.1}/><Field label="UPS efficiency" value={efficiency} onChange={setEfficiency} unit="%" min={1} max={100}/></div>
            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">{[["Load energy", ups.energy.toFixed(2)+" kWh"],["Battery energy", ups.batteryKwh.toFixed(2)+" kWh"],["Estimated capacity", Math.ceil(ups.capacityAh)+" Ah"]].map(([k,v])=><div key={k} className="rounded-xl bg-slate-950 p-4"><p className="text-xs text-slate-400">{k}</p><p className="mt-2 text-xl font-bold text-cyan-300">{v}</p></div>)}</div>
            <p className="mt-4 text-xs leading-5 text-amber-300/80">Estimate only. Final UPS and battery selection must use the manufacturer's constant-power discharge tables, DC limits, power factor and design margin.</p>
          </section>
          <section className={panel}><div className="mb-5 flex items-center gap-3"><span className="text-3xl">☀️</span><div><h3 className="text-xl font-bold">Solar PV estimator</h3><p className="text-sm text-slate-400">Daily energy to approximate PV array size</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2"><Field label="Daily energy" value={dailyKwh} onChange={setDailyKwh} unit="kWh/day" step={0.5}/><Field label="Peak sun hours" value={sunHours} onChange={setSunHours} unit="h/day" step={0.5}/><Field label="Panel rating" value={panelW} onChange={setPanelW} unit="W" step={5}/><Field label="Performance factor" value={losses} onChange={setLosses} unit="%" min={1} max={100}/></div>
            <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-slate-950 p-4"><p className="text-xs text-slate-400">Estimated PV size</p><p className="mt-2 text-2xl font-bold text-cyan-300">{solar.arrayKw.toFixed(2)} kW</p></div><div className="rounded-xl bg-slate-950 p-4"><p className="text-xs text-slate-400">Panel quantity</p><p className="mt-2 text-2xl font-bold text-cyan-300">{solar.panelCount}</p></div></div>
            <p className="mt-4 text-xs leading-5 text-amber-300/80">Estimate only. Confirm seasonal irradiation, orientation, shading, inverter limits and battery strategy before design approval.</p>
          </section>
        </div>}

        {section === "Products" && <div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]">
          <form onSubmit={addQuoteItem} className={panel}><h3 className="mb-4 text-xl font-bold">Add quotation item</h3><label className="mb-4 block text-sm text-slate-300">Product / service<input required value={productName} onChange={(e) => setProductName(e.target.value)} placeholder="e.g. 8-channel NVR" className="mt-2 w-full"/></label><Field label="Unit price" value={productPrice} onChange={setProductPrice} unit="USD" step={0.01}/><button className={`${button} mt-5`} type="submit">Add item</button></form>
          <div className={panel}><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-bold">Quotation draft</h3><span className="text-lg font-bold text-cyan-300">${total.toFixed(2)}</span></div>{quoteItems.length === 0 ? <p className="text-sm text-slate-400">No items yet. Add products or services to start a quotation.</p> : <div className="space-y-3">{quoteItems.map((item, i) => <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-slate-400">Qty {item.qty} · ${item.price.toFixed(2)} each</p></div><div className="flex items-center gap-3"><strong>${(item.qty * item.price).toFixed(2)}</strong><button className="text-sm text-rose-300" onClick={() => setQuoteItems((current) => current.filter((_, index) => index !== i))}>Remove</button></div></div>)}</div>}<p className="mt-4 text-xs text-slate-500">Draft data is currently held in this browser session. Database saving and PDF export are planned for the next phase.</p></div>
        </div>}

        {section === "Settings" && <div className={panel}><h3 className="mb-3 text-xl font-bold">Workspace settings</h3><p className="text-slate-300">PlanYar MVP · English interface · USD quotation currency</p><p className="mt-3 text-sm text-slate-400">Next phase: Kurdish Sorani, Arabic and English language switching, user accounts, team permissions and persistent PostgreSQL storage.</p></div>}

        {![...navItems, "Dashboard"].includes(section) && <div className={panel}><p className="text-sm text-cyan-300">Selected engineering module</p><h3 className="mt-2 text-2xl font-bold">{section}</h3><p className="mt-3 text-slate-400">The module workspace is being prepared. Project-based 2D/3D drawing, device placement, topology and technical schedules will be added in staged releases.</p><button className={`${secondary} mt-5`} onClick={() => setSection("Dashboard")}>Back to dashboard</button></div>}

        <footer className="mt-10 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">PlanYar © 2026 · Engineering made easier · MVP build</footer>
      </div>
    </main>
  );
}

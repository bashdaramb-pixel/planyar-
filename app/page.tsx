"use client";

import { useEffect, useMemo, useState } from "react";

type Project = { id: number; name: string; client: string; system: string; status: string };
type Module = { name: string; icon: string; desc: string };
type PlacedDevice = { id: number; kind: string; x: number; y: number };
type CatalogProduct = { id: number; sku: string | null; name: string; category: string; brand: string; model: string; unit_price: string | number; currency: string; datasheet_url: string; image_url: string };

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

const navItems = ["Dashboard", "2D Design Studio", "Projects", "Products", "Calculators", "Settings"];

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
  const [studioTool, setStudioTool] = useState("Camera");
  const [placedDevices, setPlacedDevices] = useState<PlacedDevice[]>([]);
  const [nextDeviceId, setNextDeviceId] = useState(1);
  const [studioLoaded, setStudioLoaded] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectError, setProjectError] = useState("");
  const [catalog, setCatalog] = useState<CatalogProduct[]>([]);
  const [catalogError, setCatalogError] = useState("");
  const [catalogBusy, setCatalogBusy] = useState(false);
  const [catalogName, setCatalogName] = useState("");
  const [catalogSku, setCatalogSku] = useState("");
  const [catalogCategory, setCatalogCategory] = useState("CCTV");
  const [catalogBrand, setCatalogBrand] = useState("");
  const [catalogModel, setCatalogModel] = useState("");
  const [catalogPrice, setCatalogPrice] = useState(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("planyar-2d-studio-v1");
      if (saved) {
        const parsed = JSON.parse(saved) as { devices?: PlacedDevice[]; nextDeviceId?: number };
        if (Array.isArray(parsed.devices)) setPlacedDevices(parsed.devices);
        if (typeof parsed.nextDeviceId === "number" && parsed.nextDeviceId > 0) setNextDeviceId(parsed.nextDeviceId);
      }
    } catch {
      // Ignore damaged or unavailable local workspace data and start with an empty plan.
    }
    setStudioLoaded(true);
  }, []);

  useEffect(() => {
    if (!studioLoaded) return;
    try {
      window.localStorage.setItem("planyar-2d-studio-v1", JSON.stringify({ devices: placedDevices, nextDeviceId }));
    } catch {
      // The drawing remains usable if browser storage is unavailable or full.
    }
  }, [placedDevices, nextDeviceId, studioLoaded]);

  useEffect(() => {
    fetch("/api/projects")
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load projects.");
        setProjects(data.projects);
      })
      .catch((error) => setProjectError(error.message || "Could not load projects."))
      .finally(() => setProjectsLoading(false));
  }, []);
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
    const batteryKwh = efficiency > 0 ? energy / (efficiency / 100) : 0;
    const capacityAh = voltage > 0 ? (batteryKwh * 1000) / voltage : 0;
    return { energy, batteryKwh, capacityAh };
  }, [loadKw, backupHours, voltage, efficiency]);

  const solar = useMemo(() => {
    const validSolarInputs = sunHours > 0 && losses > 0 && panelW > 0;
    const arrayKw = validSolarInputs ? dailyKwh / (sunHours * (losses / 100)) : 0;
    const panelCount = validSolarInputs ? Math.ceil((arrayKw * 1000) / panelW) : 0;
    return { arrayKw, panelCount };
  }, [dailyKwh, sunHours, losses, panelW]);

  const total = quoteItems.reduce((sum, item) => sum + item.qty * item.price, 0);

  function placeStudioDevice(event: React.MouseEvent<SVGSVGElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = Math.max(24, Math.min(876, ((event.clientX - bounds.left) / bounds.width) * 900));
    const y = Math.max(24, Math.min(496, ((event.clientY - bounds.top) / bounds.height) * 520));
    setPlacedDevices((items) => [...items, { id: nextDeviceId, kind: studioTool, x, y }]);
    setNextDeviceId((id) => id + 1);
  }

  async function addProject(e: React.FormEvent) {
    e.preventDefault();
    if (!projectName.trim()) return;
    setProjectError("");
    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim(), client: client.trim() || "Not specified", system }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save project.");
      setProjects((current) => [data.project, ...current]);
      setProjectName(""); setClient(""); setSection("Projects");
    } catch (error) {
      setProjectError(error instanceof Error ? error.message : "Could not save project.");
    }
  }

  function addQuoteItem(e: React.FormEvent) {
    e.preventDefault();
    if (!productName.trim() || productPrice <= 0) return;
    setQuoteItems((current) => [...current, { name: productName.trim(), qty: 1, price: productPrice }]);
    setProductName(""); setProductPrice(0);
  }

  async function saveCatalogProduct(e: React.FormEvent) {
    e.preventDefault();
    setCatalogBusy(true); setCatalogError("");
    try {
      const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        name: catalogName, sku: catalogSku, category: catalogCategory, brand: catalogBrand, model: catalogModel, unit_price: catalogPrice, currency: "USD"
      }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save product.");
      setCatalog((items) => [data.products[0], ...items.filter((item) => item.id !== data.products[0].id)]);
      setCatalogName(""); setCatalogSku(""); setCatalogBrand(""); setCatalogModel(""); setCatalogPrice(0);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "Could not save product.");
    } finally { setCatalogBusy(false); }
  }

  async function importProductCsv(file?: File) {
    if (!file) return;
    setCatalogBusy(true); setCatalogError("");
    try {
      const text = await file.text();
      const lines = text.replace(/^\\uFEFF/, "").split(/\\r?\\n/).filter((line) => line.trim());
      if (lines.length < 2) throw new Error("CSV must include a header row and at least one product.");
      const parseRow = (line: string) => {
        const cells: string[] = []; let value = ""; let quoted = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"' && line[i + 1] === '"' && quoted) { value += '"'; i++; }
          else if (ch === '"') quoted = !quoted;
          else if (ch === "," && !quoted) { cells.push(value.trim()); value = ""; }
          else value += ch;
        }
        cells.push(value.trim()); return cells;
      };
      const headers = parseRow(lines[0]).map((h) => h.toLowerCase().trim().replace(/[ -]+/g, "_"));
      const rows = lines.slice(1).map(parseRow).map((cells) => Object.fromEntries(headers.map((h, i) => [h, cells[i] || ""])))
        .filter((row) => String(row.name || row.product_name || "").trim())
        .map((row) => ({ name: row.name || row.product_name, sku: row.sku, category: row.category, brand: row.brand, model: row.model, unit_price: Number(row.unit_price || row.price || 0), currency: row.currency || "USD", datasheet_url: row.datasheet_url, image_url: row.image_url }));
      if (!rows.length) throw new Error("No product rows with a name were found.");
      const response = await fetch("/api/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ products: rows }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "CSV import failed.");
      const refreshed = await fetch("/api/products").then((res) => res.json());
      setCatalog(refreshed.products || []);
      setCatalogError(`Imported or updated ${data.imported} product(s).`);
    } catch (error) {
      setCatalogError(error instanceof Error ? error.message : "CSV import failed.");
    } finally { setCatalogBusy(false); }
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

        {section === "2D Design Studio" && <section className={panel}>
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <div><p className="text-xs font-bold uppercase tracking-[.2em] text-cyan-300">PlanYar workspace</p><h3 className="mt-1 text-2xl font-bold">2D Design Studio</h3><p className="mt-1 text-sm text-slate-400">Choose a device, then tap the drawing area to place it</p></div>
            <div className="flex flex-wrap gap-2">
              {["Camera", "Wi-Fi AP", "Motion Sensor", "Door"].map((tool) => <button key={tool} type="button" onClick={() => setStudioTool(tool)} className={studioTool === tool ? button : secondary}>{tool}</button>)}
            </div>
          </div>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400"><span>Selected tool: <strong className="text-cyan-300">{studioTool}</strong></span><span>{placedDevices.length} placed device(s) · {studioLoaded ? "Auto-saved on this device" : "Loading saved plan…"}</span></div>
          <div className="overflow-hidden rounded-2xl border border-slate-700 bg-[#080f1d]">
            <svg viewBox="0 0 900 520" role="img" aria-label="Interactive 2D floor plan. Tap to place the selected device." onClick={placeStudioDevice} className="block h-auto w-full touch-manipulation" style={{ cursor: "crosshair" }}>
              <defs><pattern id="plan-grid" width="24" height="24" patternUnits="userSpaceOnUse"><path d="M 24 0 L 0 0 0 24" fill="none" stroke="#233247" strokeWidth="1"/></pattern></defs>
              <rect width="900" height="520" fill="url(#plan-grid)"/>
              <rect x="110" y="75" width="680" height="370" fill="#0d1b2b" fillOpacity=".7" stroke="#94a3b8" strokeWidth="8"/>
              <path d="M 450 75 V 245 M 110 260 H 450 M 450 245 H 790" stroke="#64748b" strokeWidth="7" fill="none"/>
              <path d="M 450 245 A 70 70 0 0 1 520 315" stroke="#64748b" strokeWidth="2" fill="none" strokeDasharray="5 5"/>
              <text x="280" y="165" fill="#94a3b8" fontSize="18" textAnchor="middle">ROOM 01</text>
              <text x="620" y="165" fill="#94a3b8" fontSize="18" textAnchor="middle">ROOM 02</text>
              <text x="280" y="355" fill="#94a3b8" fontSize="18" textAnchor="middle">ROOM 03</text>
              <text x="620" y="355" fill="#94a3b8" fontSize="18" textAnchor="middle">ROOM 04</text>
              {placedDevices.map((device) => <g key={device.id} transform={`translate(${device.x} ${device.y})`} pointerEvents="none">
                <circle r="17" fill={device.kind === "Camera" ? "#083344" : device.kind === "Wi-Fi AP" ? "#312e81" : device.kind === "Door" ? "#713f12" : "#14532d"} stroke={device.kind === "Camera" ? "#22d3ee" : device.kind === "Wi-Fi AP" ? "#a5b4fc" : device.kind === "Door" ? "#fbbf24" : "#86efac"} strokeWidth="2"/>
                <text y="5" textAnchor="middle" fontSize="15" fill="white">{device.kind === "Camera" ? "C" : device.kind === "Wi-Fi AP" ? "W" : device.kind === "Door" ? "D" : "M"}</text>
                <text y="31" textAnchor="middle" fontSize="10" fill="#e2e8f0">{device.kind} #{device.id}</text>
              </g>)}
              <text x="450" y="500" fill="#64748b" fontSize="12" textAnchor="middle">TAP ANYWHERE INSIDE THE PLAN TO PLACE A DEVICE</text>
            </svg>
          </div>
          <div className="mt-4 flex flex-wrap gap-2"><button type="button" className={secondary} onClick={() => setPlacedDevices((items) => items.slice(0, -1))} disabled={placedDevices.length === 0}>Undo last</button><button type="button" className={secondary} onClick={() => setPlacedDevices([])} disabled={placedDevices.length === 0}>Clear devices</button></div>
          <p className="mt-3 text-xs leading-5 text-amber-300/80">Your device layout is automatically saved in this browser on this device. It is not yet linked to a project or synced to the cloud. Scale calibration, PDF/DWG import, wall editing, cable routing and coverage calculations are future steps.</p>
        </section>}

        {section === "Projects" && <div className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <form onSubmit={addProject} className={panel}>
            <h3 className="mb-4 text-xl font-bold">Create a project</h3>
            <label className="mb-4 block text-sm text-slate-300">Project name<input required value={projectName} onChange={(e) => setProjectName(e.target.value)} placeholder="e.g. Erbil Office Security" className="mt-2 w-full" /></label>
            <label className="mb-4 block text-sm text-slate-300">Client / site<input value={client} onChange={(e) => setClient(e.target.value)} placeholder="Client or location" className="mt-2 w-full" /></label>
            <label className="mb-5 block text-sm text-slate-300">Main system<select value={system} onChange={(e) => setSystem(e.target.value)} className="mt-2 w-full">{modules.map((m) => <option key={m.name}>{m.name}</option>)}</select></label>
            <button className={button} type="submit">+ Create project</button>
          </form>
          <div className={panel}><h3 className="mb-4 text-xl font-bold">Project list <span className="text-sm font-normal text-slate-500">({projects.length})</span></h3>
            {projectError && <p role="alert" className="mb-3 rounded-lg bg-rose-950/60 p-3 text-sm text-rose-300">{projectError}</p>}
            {projectsLoading ? <p className="text-sm text-slate-400">Loading projects…</p> : projects.length === 0 ? <p className="text-sm text-slate-400">No projects saved yet. Create your first project.</p> : <div className="space-y-3">{projects.map((p) => <div key={p.id} className="rounded-xl border border-slate-800 bg-slate-950/70 p-4"><div className="flex flex-wrap items-start justify-between gap-2"><div><h4 className="font-semibold">{p.name}</h4><p className="mt-1 text-sm text-slate-400">{p.client} · {p.system}</p></div><span className="rounded-full bg-amber-950 px-3 py-1 text-xs text-amber-300">{p.status}</span></div></div>)}</div>}
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

        {section === "Products" && <div className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <form onSubmit={saveCatalogProduct} className={panel}>
              <div className="mb-4"><p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Product intelligence</p><h3 className="mt-1 text-xl font-bold">Add to product catalog</h3><p className="mt-1 text-sm text-slate-400">Save technical products for reuse in future project quotations.</p></div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm text-slate-300 sm:col-span-2">Product name<input required value={catalogName} onChange={(e) => setCatalogName(e.target.value)} className="mt-2 w-full" placeholder="e.g. 8MP IP Turret Camera"/></label>
                <label className="text-sm text-slate-300">SKU<input value={catalogSku} onChange={(e) => setCatalogSku(e.target.value)} className="mt-2 w-full" placeholder="Optional unique code"/></label>
                <label className="text-sm text-slate-300">Category<select value={catalogCategory} onChange={(e) => setCatalogCategory(e.target.value)} className="mt-2 w-full">{["CCTV","Alarm System","Network","Sound System","Smart Home","Solar","UPS","Battery","Accessories","Other"].map((v) => <option key={v}>{v}</option>)}</select></label>
                <label className="text-sm text-slate-300">Brand<input value={catalogBrand} onChange={(e) => setCatalogBrand(e.target.value)} className="mt-2 w-full" placeholder="Brand"/></label>
                <label className="text-sm text-slate-300">Model<input value={catalogModel} onChange={(e) => setCatalogModel(e.target.value)} className="mt-2 w-full" placeholder="Model number"/></label>
                <div className="sm:col-span-2"><Field label="Unit price" value={catalogPrice} onChange={setCatalogPrice} unit="USD" step={0.01}/></div>
              </div>
              <button disabled={catalogBusy} className={`${button} mt-4 disabled:opacity-50`} type="submit">{catalogBusy ? "Saving…" : "Save product"}</button>
            </form>
            <div className={panel}>
              <p className="text-xs font-bold uppercase tracking-widest text-cyan-300">Bulk import</p><h3 className="mt-1 text-xl font-bold">Import product CSV</h3>
              <p className="mt-2 text-sm text-slate-400">Upload a CSV file with columns such as name, sku, category, brand, model, unit_price, currency, datasheet_url and image_url.</p>
              <label className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-cyan-700 bg-slate-950/70 p-7 text-center hover:border-cyan-400">
                <span className="text-3xl">📥</span><span className="mt-2 font-semibold text-cyan-200">Choose CSV file</span><span className="mt-1 text-xs text-slate-500">Up to 500 products per import</span>
                <input className="mt-3 max-w-full text-xs" type="file" accept=".csv,text/csv" disabled={catalogBusy} onChange={(e) => { void importProductCsv(e.target.files?.[0]); e.currentTarget.value = ""; }}/>
              </label>
              <p className="mt-3 text-xs text-slate-500">Matching SKU values update existing catalog records. Keep your source spreadsheet as the master copy.</p>
            </div>
          </div>
          {catalogError && <p role="status" className="rounded-xl border border-cyan-900 bg-cyan-950/40 p-3 text-sm text-cyan-200">{catalogError}</p>}
          <section className={panel}>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><div><h3 className="text-xl font-bold">Product library</h3><p className="text-sm text-slate-400">{catalog.length} saved product(s)</p></div><button type="button" className={secondary} onClick={() => fetch("/api/products").then((r) => r.json()).then((d) => setCatalog(d.products || []))}>Refresh</button></div>
            {catalog.length === 0 ? <p className="text-sm text-slate-400">No products yet. Add one manually or import your CSV product list.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="text-xs uppercase text-slate-500"><tr><th className="p-3">Product</th><th className="p-3">SKU</th><th className="p-3">Category</th><th className="p-3">Brand / Model</th><th className="p-3 text-right">Price</th><th className="p-3">Quote</th></tr></thead><tbody>{catalog.map((product) => <tr key={product.id} className="border-t border-slate-800"><td className="p-3 font-medium">{product.name}</td><td className="p-3 text-slate-400">{product.sku || "—"}</td><td className="p-3 text-slate-400">{product.category}</td><td className="p-3 text-slate-400">{[product.brand, product.model].filter(Boolean).join(" / ") || "—"}</td><td className="p-3 text-right tabular-nums">{product.currency} {Number(product.unit_price).toFixed(2)}</td><td className="p-3"><button type="button" className="text-cyan-300 hover:text-cyan-100" onClick={() => setQuoteItems((items) => [...items, { name: product.name, qty: 1, price: Number(product.unit_price) }])}>Add</button></td></tr>)}</tbody></table></div>}
          </section>
          <div className={panel}><div className="mb-4 flex items-center justify-between"><h3 className="text-xl font-bold">Quotation draft</h3><span className="text-lg font-bold text-cyan-300">${total.toFixed(2)}</span></div>{quoteItems.length === 0 ? <p className="text-sm text-slate-400">No items yet. Add products from the library or create a custom line.</p> : <div className="space-y-3">{quoteItems.map((item, i) => <div key={i} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950 p-3"><div><p className="font-medium">{item.name}</p><p className="text-xs text-slate-400">Qty {item.qty} · ${item.price.toFixed(2)} each</p></div><div className="flex items-center gap-3"><strong>${(item.qty * item.price).toFixed(2)}</strong><button className="text-sm text-rose-300" onClick={() => setQuoteItems((current) => current.filter((_, index) => index !== i))}>Remove</button></div></div>)}</div>}<p className="mt-4 text-xs text-slate-500">Quotation lines are still session-only; saving quotations and PDF generation are a later phase.</p></div>
        </div>}

        {section === "Settings" && <div className={panel}><h3 className="mb-3 text-xl font-bold">Workspace settings</h3><p className="text-slate-300">PlanYar MVP · English interface · USD quotation currency</p><p className="mt-3 text-sm text-slate-400">Next phase: Kurdish Sorani, Arabic and English language switching, user accounts, team permissions and persistent PostgreSQL storage.</p></div>}

        {![...navItems, "Dashboard"].includes(section) && <div className={panel}><p className="text-sm text-cyan-300">Selected engineering module</p><h3 className="mt-2 text-2xl font-bold">{section}</h3><p className="mt-3 text-slate-400">The module workspace is being prepared. Project-based 2D/3D drawing, device placement, topology and technical schedules will be added in staged releases.</p><button className={`${secondary} mt-5`} onClick={() => setSection("Dashboard")}>Back to dashboard</button></div>}

        <footer className="mt-10 border-t border-slate-800 pt-5 text-center text-xs text-slate-500">PlanYar © 2026 · Engineering made easier · MVP build</footer>
      </div>
    </main>
  );
}

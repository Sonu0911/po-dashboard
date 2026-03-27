import { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import axios from "axios";

const API = "http://localhost:5000/api";
const BRAND_COLORS = {
  boohoo: "#FF3CAC",
  PrettyLittleThing: "#FF7F00",
  Coast: "#00C6FF"
};

// ── AUTH SCREEN ──────────────────────────────────────────────────────────────
function LoginScreen({ onLogin }) {
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [error, setError] = useState("");

  const handleLogin = () => {
    if (user === "admin" && pass === "admin123") {
      localStorage.setItem("po_auth", "true");
      onLogin();
    } else {
      setError("Wrong username or password!");
    }
  };

  return (
    <div style={{
      minHeight: "100vh", background: "#080809", display: "flex",
      alignItems: "center", justifyContent: "center", fontFamily: "sans-serif"
    }}>
      <div style={{
        background: "rgba(255,255,255,0.03)", border: "1px solid #1a1a1a",
        borderRadius: 16, padding: "48px 40px", width: 360
      }}>
        <div style={{ fontSize: 28, fontWeight: 800, color: "#FF3CAC", marginBottom: 8 }}>PO Command</div>
        <div style={{ fontSize: 13, color: "#555", marginBottom: 32 }}>Purchase Order Intelligence</div>

        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Username</div>
          <input
            value={user}
            onChange={e => setUser(e.target.value)}
            placeholder="admin"
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #222",
              borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none"
            }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Password</div>
          <input
            type="password"
            value={pass}
            onChange={e => setPass(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleLogin()}
            placeholder="••••••••"
            style={{
              width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid #222",
              borderRadius: 8, padding: "10px 14px", color: "#fff", fontSize: 13, outline: "none"
            }}
          />
        </div>

        {error && <div style={{ fontSize: 12, color: "#FF3B30", marginBottom: 16 }}>{error}</div>}

        <button onClick={handleLogin} style={{
          width: "100%", background: "#FF3CAC", border: "none", borderRadius: 8,
          padding: "12px", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer"
        }}>
          Login
        </button>

        <div style={{ fontSize: 11, color: "#333", marginTop: 16, textAlign: "center" }}>
          Username: admin · Password: admin123
        </div>
      </div>
    </div>
  );
}

// ── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem("po_auth"));
  const [pos, setPos] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filterBrand, setFilterBrand] = useState("All");
  const [activeTab, setActiveTab] = useState("overview");
  const [selected, setSelected] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadMsg, setUploadMsg] = useState("");
  const [poLines, setPoLines] = useState({});

  useEffect(() => {
    if (isLoggedIn) fetchData();
  }, [filterBrand, isLoggedIn]);

  const fetchData = async () => {
    const params = filterBrand !== "All" ? `?brand=${filterBrand}` : "";
    const [posRes, sumRes] = await Promise.all([
      axios.get(`${API}/pos${params}`),
      axios.get(`${API}/summary`)
    ]);
    setPos(posRes.data);
    setSummary(sumRes.data);
  };

  const fetchLines = async (poId) => {
    if (poLines[poId]) return;
    try {
      const res = await axios.get(`${API}/pos/${poId}/lines`);
      setPoLines(prev => ({ ...prev, [poId]: res.data }));
    } catch (e) {
      console.log("Lines fetch error", e);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    setUploadMsg("");
    const formData = new FormData();
    formData.append("pdf", file);
    try {
      await axios.post(`${API}/upload`, formData);
      setUploadMsg("✅ PO successfully upload hua!");
      fetchData();
    } catch (err) {
      setUploadMsg("❌ Error: " + (err.response?.data?.error || "Upload failed"));
    }
    setUploading(false);
    e.target.value = "";
  };

  // ── EXCEL EXPORT ────────────────────────────────────────────────────────────
  const exportToExcel = () => {
    const headers = ["PO Number", "Brand", "Supplier", "Buyer", "Currency", "Total Units", "Total Net", "GBP Value", "PPU", "Ex Factory Date", "Delivery Date", "Freight", "Incoterms", "Category"];
    const rows = pos.map(p => [
      p.po_number, p.brand, p.supplier, p.buyer, p.currency,
      p.total_units, p.total_net, p.gbp_value, p.ppu,
      new Date(p.ex_factory_date).toLocaleDateString("en-GB"),
      new Date(p.delivery_date).toLocaleDateString("en-GB"),
      p.freight, p.incoterms, p.category
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `PO_Export_${new Date().toLocaleDateString("en-GB").replace(/\//g, "-")}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    localStorage.removeItem("po_auth");
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) return <LoginScreen onLogin={() => setIsLoggedIn(true)} />;

  const brands = ["All", "boohoo", "PrettyLittleThing", "Coast"];
  const totalGBP = pos.reduce((s, p) => s + parseFloat(p.gbp_value || 0), 0);
  const totalUnits = pos.reduce((s, p) => s + parseInt(p.total_units || 0), 0);

  const brandChartData = summary?.byBrand?.map(b => ({
    brand: b.brand,
    value: parseFloat(b.gbp_value),
    units: parseInt(b.units)
  })) || [];

  const categoryData = [
    { name: "Dresses", value: pos.filter(p => p.category === "Dresses").reduce((s, p) => s + parseInt(p.total_units), 0) },
    { name: "Tops", value: pos.filter(p => p.category === "Tops").reduce((s, p) => s + parseInt(p.total_units), 0) },
  ];

  const daysUntil = (d) => Math.ceil((new Date(d) - new Date()) / 86400000);
  const getStatus = (days) => days < 0
    ? { label: "Overdue", color: "#FF3B30" }
    : days <= 30
      ? { label: "On Track", color: "#30D158" }
      : { label: "Ahead", color: "#00C6FF" };

  return (
    <div style={{ minHeight: "100vh", background: "#080809", color: "#fff", fontFamily: "sans-serif", display: "flex" }}>
      <style>{`* { box-sizing: border-box; } ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-thumb { background: #333; } input::placeholder { color: #444; }`}</style>

      {/* ── SIDEBAR ── */}
      <div style={{ width: 210, borderRight: "1px solid #1a1a1a", padding: "24px 12px", display: "flex", flexDirection: "column", minHeight: "100vh" }}>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4, color: "#FF3CAC" }}>PO Command</div>
        <div style={{ fontSize: 10, color: "#333", marginBottom: 28 }}>Purchase Order Intelligence</div>

        {/* Nav Tabs */}
        {["overview", "orders", "analytics", "timeline"].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} style={{
            width: "100%", background: activeTab === tab ? "rgba(255,60,172,0.12)" : "transparent",
            border: "none", color: activeTab === tab ? "#FF3CAC" : "#555",
            borderRadius: 8, padding: "10px 12px", cursor: "pointer",
            fontSize: 13, fontWeight: 600, marginBottom: 4, textAlign: "left", textTransform: "capitalize"
          }}>{tab}</button>
        ))}

        {/* Brand Filter */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Filter Brand</div>
          {brands.map(b => (
            <button key={b} onClick={() => setFilterBrand(b)} style={{
              width: "100%", background: "transparent", border: "none",
              color: filterBrand === b ? (BRAND_COLORS[b] || "#fff") : "#444",
              borderRadius: 6, padding: "6px 8px", cursor: "pointer",
              fontSize: 12, fontWeight: filterBrand === b ? 700 : 400, textAlign: "left"
            }}>
              {b !== "All" && <span style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: BRAND_COLORS[b], marginRight: 6 }} />}
              {b}
            </button>
          ))}
        </div>

        {/* PDF Upload */}
        <div style={{ marginTop: 24 }}>
          <div style={{ fontSize: 10, color: "#333", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Upload PO PDF</div>
          <label style={{
            display: "block", background: "rgba(255,60,172,0.08)", border: "1px dashed rgba(255,60,172,0.3)",
            borderRadius: 8, padding: "12px", cursor: "pointer", fontSize: 11,
            color: uploading ? "#888" : "#FF3CAC", textAlign: "center", transition: "all 0.2s"
          }}>
            {uploading ? "⏳ Uploading..." : "📄 Upload PDF"}
            <input type="file" accept=".pdf" onChange={handleUpload} style={{ display: "none" }} disabled={uploading} />
          </label>
          {uploadMsg && (
            <div style={{ fontSize: 11, marginTop: 8, color: uploadMsg.includes("✅") ? "#30D158" : "#FF3B30", lineHeight: 1.4 }}>
              {uploadMsg}
            </div>
          )}
        </div>

        {/* Export Button */}
        <div style={{ marginTop: 16 }}>
          <button onClick={exportToExcel} style={{
            width: "100%", background: "rgba(0,198,255,0.08)", border: "1px solid rgba(0,198,255,0.2)",
            borderRadius: 8, padding: "10px", cursor: "pointer", fontSize: 11,
            color: "#00C6FF", fontWeight: 600
          }}>
            📥 Export CSV
          </button>
        </div>

        {/* Logout */}
        <div style={{ marginTop: "auto", paddingTop: 24 }}>
          <button onClick={handleLogout} style={{
            width: "100%", background: "transparent", border: "1px solid #1a1a1a",
            borderRadius: 8, padding: "8px", cursor: "pointer", fontSize: 11, color: "#444"
          }}>
            Logout
          </button>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div style={{ flex: 1, padding: "32px 40px", overflowY: "auto", maxHeight: "100vh" }}>

        {/* OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>Business Overview</div>
            <div style={{ fontSize: 13, color: "#555", marginBottom: 24 }}>
              Live FX Rate: 1 USD = £{summary?.fxRate?.toFixed(3) || "0.790"} · {pos.length} orders
            </div>

            {/* Stat Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              {[
                { label: "Total GBP Value", value: `£${totalGBP.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`, color: "#FF3CAC" },
                { label: "Total Units", value: totalUnits.toLocaleString(), color: "#FF7F00" },
                { label: "Active Orders", value: pos.length, color: "#00C6FF" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "20px 24px" }}>
                  <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>{label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color }}>{value}</div>
                </div>
              ))}
            </div>

            {/* Charts */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", marginBottom: 16 }}>Value by Brand (GBP)</div>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={brandChartData}>
                    <XAxis dataKey="brand" tick={{ fill: "#555", fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#444", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `£${(v / 1000).toFixed(1)}k`} />
                    <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} formatter={v => [`£${parseFloat(v).toLocaleString()}`, "Value"]} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {brandChartData.map((e, i) => <Cell key={i} fill={BRAND_COLORS[e.brand] || "#888"} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "20px" }}>
                <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", marginBottom: 16 }}>Units by Category</div>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={4} dataKey="value">
                      {categoryData.map((_, i) => <Cell key={i} fill={["#FF3CAC", "#FF7F00"][i]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 12, color: "#888" }} />
                    <Tooltip contentStyle={{ background: "#1a1a1f", border: "1px solid #333", borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {activeTab === "orders" && (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Purchase Orders</div>
            {pos.map(po => {
              const days = daysUntil(po.delivery_date);
              const st = getStatus(days);
              const accent = BRAND_COLORS[po.brand] || "#fff";
              const isSelected = selected?.id === po.id;
              const lines = poLines[po.id] || [];

              return (
                <div key={po.id}
                  onClick={() => {
                    setSelected(isSelected ? null : po);
                    if (!isSelected) fetchLines(po.id);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.02)", border: `1px solid ${isSelected ? accent : "#1a1a1a"}`,
                    borderRadius: 12, padding: "20px 24px", marginBottom: 12, cursor: "pointer",
                    transition: "border-color 0.2s"
                  }}>

                  {/* PO Header */}
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                    <div>
                      <div style={{ fontSize: 12, color: accent, fontWeight: 700, marginBottom: 4 }}>{po.brand}</div>
                      <div style={{ fontSize: 15, fontWeight: 700 }}>{po.supplier}</div>
                    </div>
                    <div style={{ background: st.color + "22", color: st.color, border: `1px solid ${st.color}44`, borderRadius: 20, padding: "4px 12px", fontSize: 11, fontWeight: 700, height: "fit-content" }}>
                      {st.label} · {Math.abs(days)}d
                    </div>
                  </div>

                  {/* PO Quick Info */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
                    {[
                      ["PO#", po.po_number],
                      ["Units", po.total_units],
                      ["GBP Value", `£${parseFloat(po.gbp_value).toLocaleString()}`],
                      ["Delivery", new Date(po.delivery_date).toLocaleDateString("en-GB")]
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase" }}>{k}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ccc", marginTop: 2 }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Expanded Detail */}
                  {isSelected && (
                    <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid #1a1a1a" }}>
                      {/* Full Details Grid */}
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginBottom: 20 }}>
                        {[
                          ["Currency", po.currency],
                          ["PPU", `£${po.ppu}`],
                          ["Freight", po.freight],
                          ["Port", po.port],
                          ["Incoterms", po.incoterms],
                          ["Buyer", po.buyer],
                          ["Ex-Factory", new Date(po.ex_factory_date).toLocaleDateString("en-GB")],
                          ["Book By", new Date(po.book_by_date).toLocaleDateString("en-GB")],
                          ["Fabrication", po.fabrication]
                        ].map(([k, v]) => (
                          <div key={k} style={{ background: "rgba(255,255,255,0.03)", borderRadius: 8, padding: "10px 12px" }}>
                            <div style={{ fontSize: 10, color: "#555", textTransform: "uppercase" }}>{k}</div>
                            <div style={{ fontSize: 12, fontWeight: 600, color: "#ccc", marginTop: 2 }}>{v}</div>
                          </div>
                        ))}
                      </div>

                      {/* Size Breakdown */}
                      <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", marginBottom: 10 }}>Size Breakdown</div>
                      {lines.length > 0 ? (
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {lines.map((line, i) => (
                            <div key={i} style={{ background: accent + "18", border: `1px solid ${accent}33`, borderRadius: 8, padding: "8px 14px", textAlign: "center" }}>
                              <div style={{ fontSize: 10, color: "#666" }}>Size {line.size}</div>
                              <div style={{ fontSize: 15, fontWeight: 800, color: accent }}>{line.qty}</div>
                              <div style={{ fontSize: 9, color: "#444" }}>units</div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: 12, color: "#444" }}>Size data available after PDF upload</div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === "analytics" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 24, fontWeight: 800 }}>Analytics</div>
              <button onClick={exportToExcel} style={{
                background: "rgba(0,198,255,0.1)", border: "1px solid rgba(0,198,255,0.3)",
                borderRadius: 8, padding: "8px 16px", cursor: "pointer", fontSize: 12, color: "#00C6FF", fontWeight: 600
              }}>
                📥 Export CSV
              </button>
            </div>

            <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "24px", marginBottom: 20 }}>
              <div style={{ fontSize: 11, color: "#555", textTransform: "uppercase", marginBottom: 16 }}>Brand Comparison</div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #1a1a1a" }}>
                    {["Brand", "Supplier", "PO Number", "Units", "Currency", "GBP Value", "Delivery"].map(h => (
                      <th key={h} style={{ textAlign: "left", padding: "10px 12px", fontSize: 10, color: "#555", textTransform: "uppercase" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pos.map((p, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #0f0f0f" }}>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: BRAND_COLORS[p.brand] || "#fff" }}>{p.brand}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#888" }}>{p.supplier}</td>
                      <td style={{ padding: "12px", fontSize: 11, color: "#555", fontFamily: "monospace" }}>{p.po_number}</td>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#ccc" }}>{p.total_units}</td>
                      <td style={{ padding: "12px" }}>
                        <span style={{ background: p.currency === "USD" ? "rgba(255,127,0,0.15)" : "rgba(0,198,255,0.15)", color: p.currency === "USD" ? "#FF7F00" : "#00C6FF", borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700 }}>
                          {p.currency}
                        </span>
                      </td>
                      <td style={{ padding: "12px", fontSize: 13, fontWeight: 700, color: "#fff" }}>£{parseFloat(p.gbp_value).toLocaleString()}</td>
                      <td style={{ padding: "12px", fontSize: 12, color: "#888" }}>{new Date(p.delivery_date).toLocaleDateString("en-GB")}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ borderTop: "1px solid #333" }}>
                    <td colSpan={3} style={{ padding: "12px", fontSize: 12, color: "#555", fontWeight: 700 }}>TOTAL</td>
                    <td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: "#FF3CAC" }}>{totalUnits}</td>
                    <td />
                    <td style={{ padding: "12px", fontSize: 14, fontWeight: 800, color: "#FF3CAC" }}>£{totalGBP.toLocaleString("en-GB", { maximumFractionDigits: 0 })}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>

            <div style={{ background: "rgba(255,127,0,0.06)", border: "1px solid rgba(255,127,0,0.2)", borderRadius: 12, padding: "16px 20px", fontSize: 12, color: "#888" }}>
              <span style={{ color: "#FF7F00", fontWeight: 700 }}>FX Note: </span>
              PrettyLittleThing PO is in USD. Converted at live rate: 1 USD = £{summary?.fxRate?.toFixed(3) || "0.790"}
            </div>
          </div>
        )}

        {/* TIMELINE TAB */}
        {activeTab === "timeline" && (
          <div>
            <div style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>Delivery Timeline</div>
            {pos.map((po, i) => {
              const accent = BRAND_COLORS[po.brand] || "#fff";
              const days = daysUntil(po.delivery_date);
              const st = getStatus(days);
              return (
                <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid #1a1a1a", borderRadius: 12, padding: "22px 28px", marginBottom: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                    <div>
                      <span style={{ fontSize: 13, color: accent, fontWeight: 700, marginRight: 12 }}>{po.brand}</span>
                      <span style={{ fontSize: 12, color: "#555" }}>PO# {po.po_number}</span>
                    </div>
                    <span style={{ background: st.color + "20", color: st.color, border: `1px solid ${st.color}44`, borderRadius: 20, padding: "3px 12px", fontSize: 11, fontWeight: 700 }}>
                      {st.label} · {Math.abs(days)}d
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div style={{ position: "relative", height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 6, marginBottom: 16 }}>
                    <div style={{ position: "absolute", left: "10%", right: "5%", top: 0, bottom: 0, background: `linear-gradient(90deg, ${accent}66, ${accent})`, borderRadius: 6 }} />
                  </div>

                  {/* Timeline Dates */}
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    {[
                      ["Order Placed", po.order_placed_date],
                      ["Book By", po.book_by_date],
                      ["Ex-Factory", po.ex_factory_date],
                      ["Delivery", po.delivery_date],
                    ].map(([label, date]) => (
                      <div key={label}>
                        <div style={{ fontSize: 10, color: "#444" }}>{label}</div>
                        <div style={{ fontSize: 12, color: "#888", fontWeight: 600, marginTop: 3 }}>
                          {new Date(date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
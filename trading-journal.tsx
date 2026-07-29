import { useState, useEffect } from "react";

const STORAGE_KEY = "xauusd-journal-trades";

const initialForm = {
  date: new Date().toISOString().slice(0, 10),
  time: "",
  direction: "BUY",
  session: "New York",
  entryPrice: "",
  stopLoss: "",
  takeProfit: "",
  lots: "",
  result: "WIN",
  pnl: "",
  rr: "",
  biaisH1: "Bullish",
  setupM15: "",
  entreeM5: "",
  notes: "",
  emotion: "Neutre",
};

const SESSIONS = ["London", "New York", "Asian", "London/NY Overlap"];
const EMOTIONS = ["Neutre", "Confiant", "Stressé", "FOMO", "Discipliné", "Hésitant"];
const BIAIS = ["Bullish", "Bearish", "Neutre"];
const SETUPS_M15 = ["Order Block (OB)", "Supply & Demand", "Liquidités", "POC", "Inducement", "Autre"];
const ENTREES_M5 = ["Order Block (OB)", "Fair Value Gap (FVG)", "CHOCH", "Liquidity Sweep", "VWAP", "Autre"];

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: "#0f0f0f",
      border: `1px solid ${color || "#222"}`,
      borderRadius: 8,
      padding: "14px 18px",
      minWidth: 110,
      flex: 1,
    }}>
      <div style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>
      <div style={{ color: color || "#f0f0f0", fontSize: 22, fontWeight: 700, fontFamily: "monospace" }}>{value}</div>
      {sub && <div style={{ color: "#444", fontSize: 10, marginTop: 2 }}>{sub}</div>}
    </div>
  );
}

function Badge({ text }) {
  const colors = {
    BUY: { bg: "#0d2b1a", text: "#2ecc71", border: "#1a4a2a" },
    SELL: { bg: "#2b0d0d", text: "#e74c3c", border: "#4a1a1a" },
    WIN: { bg: "#0d2b1a", text: "#2ecc71", border: "#1a4a2a" },
    LOSS: { bg: "#2b0d0d", text: "#e74c3c", border: "#4a1a1a" },
    BE: { bg: "#1a1a0d", text: "#f1c40f", border: "#3a3a1a" },
    Bullish: { bg: "#0d2b1a", text: "#2ecc71", border: "#1a4a2a" },
    Bearish: { bg: "#2b0d0d", text: "#e74c3c", border: "#4a1a1a" },
    Neutre: { bg: "#1a1a1a", text: "#888", border: "#2a2a2a" },
  };
  const c = colors[text] || { bg: "#1a1a2b", text: "#aaa", border: "#2a2a3b" };
  return (
    <span style={{
      background: c.bg, color: c.text, border: `1px solid ${c.border}`,
      borderRadius: 4, padding: "2px 8px", fontSize: 11, fontWeight: 700, letterSpacing: 0.5
    }}>{text}</span>
  );
}

function Modal({ show, onClose, children }) {
  if (!show) return null;
  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
      zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: "#0a0a0a", border: "1px solid #222", borderRadius: 12,
        padding: 24, width: "100%", maxWidth: 560, maxHeight: "90vh", overflowY: "auto"
      }}>
        {children}
      </div>
    </div>
  );
}

function Input({ label, type = "text", value, onChange, placeholder, options, style }) {
  const base = {
    background: "#0f0f0f", border: "1px solid #222", borderRadius: 6,
    color: "#e0e0e0", padding: "8px 10px", fontSize: 13, width: "100%",
    outline: "none", fontFamily: "inherit", boxSizing: "border-box", ...style
  };
  return (
    <div style={{ marginBottom: 12 }}>
      {label && <div style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{label}</div>}
      {options ? (
        <select value={value} onChange={e => onChange(e.target.value)} style={base}>
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={base} />
      )}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      color: "#c8a84b", fontSize: 9, textTransform: "uppercase", letterSpacing: 2,
      marginBottom: 10, marginTop: 4, paddingBottom: 6, borderBottom: "1px solid #161616"
    }}>{children}</div>
  );
}

export default function TradingJournal() {
  const [trades, setTrades] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [editId, setEditId] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [tab, setTab] = useState("journal");

  useEffect(() => {
    (async () => {
      try {
        const r = await window.storage.get(STORAGE_KEY);
        if (r?.value) setTrades(JSON.parse(r.value));
      } catch {}
    })();
  }, []);

  const save = async (newTrades) => {
    setTrades(newTrades);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(newTrades)); } catch {}
  };

  const handleSubmit = async () => {
    if (!form.entryPrice) return;
    if (editId !== null) {
      await save(trades.map(t => t.id === editId ? { ...form, id: editId } : t));
      setEditId(null);
    } else {
      await save([{ ...form, id: Date.now() }, ...trades]);
    }
    setForm(initialForm);
    setShowForm(false);
  };

  const handleEdit = (trade) => {
    setForm({ ...initialForm, ...trade });
    setEditId(trade.id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    await save(trades.filter(t => t.id !== id));
    setDeleteConfirm(null);
  };

  const f = (key) => (val) => setForm(p => ({ ...p, [key]: val }));

  const wins = trades.filter(t => t.result === "WIN");
  const losses = trades.filter(t => t.result === "LOSS");
  const bes = trades.filter(t => t.result === "BE");
  const totalPnl = trades.reduce((acc, t) => acc + parseFloat(t.pnl || 0), 0);
  const winRate = trades.length ? Math.round((wins.length / trades.length) * 100) : 0;
  const avgRR = trades.filter(t => t.rr).length
    ? (trades.filter(t => t.rr).reduce((a, t) => a + parseFloat(t.rr), 0) / trades.filter(t => t.rr).length).toFixed(2)
    : "—";
  const bestTrade = trades.reduce((best, t) => parseFloat(t.pnl || 0) > parseFloat(best?.pnl || -Infinity) ? t : best, null);
  const worstTrade = trades.reduce((worst, t) => parseFloat(t.pnl || 0) < parseFloat(worst?.pnl || Infinity) ? t : worst, null);
  const sessionStats = SESSIONS.map(s => ({
    name: s,
    count: trades.filter(t => t.session === s).length,
    wins: trades.filter(t => t.session === s && t.result === "WIN").length,
  }));

  const filtered = filter === "ALL" ? trades : trades.filter(t => t.result === filter);
  const pnlColor = (v) => parseFloat(v) > 0 ? "#2ecc71" : parseFloat(v) < 0 ? "#e74c3c" : "#888";

  return (
    <div style={{ minHeight: "100vh", background: "#050505", color: "#e0e0e0", fontFamily: "'Inter', -apple-system, sans-serif", paddingBottom: 60 }}>

      {/* Header */}
      <div style={{
        borderBottom: "1px solid #111", padding: "18px 20px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, background: "#050505", zIndex: 100
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ color: "#c8a84b", fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>XAU/USD</span>
            <span style={{ color: "#333", fontSize: 16 }}>|</span>
            <span style={{ color: "#555", fontSize: 13 }}>Journal</span>
          </div>
          <div style={{ color: "#333", fontSize: 10, marginTop: 1 }}>{trades.length} trade{trades.length !== 1 ? "s" : ""} enregistré{trades.length !== 1 ? "s" : ""}</div>
        </div>
        <button onClick={() => { setForm(initialForm); setEditId(null); setShowForm(true); }} style={{
          background: "#c8a84b", color: "#000", border: "none", borderRadius: 7,
          padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer"
        }}>+ Nouveau trade</button>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #111", padding: "0 20px" }}>
        {[["journal", "Journal"], ["stats", "Statistiques"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: "none", border: "none", color: tab === key ? "#c8a84b" : "#444",
            borderBottom: tab === key ? "2px solid #c8a84b" : "2px solid transparent",
            padding: "12px 16px 10px", fontSize: 13, fontWeight: tab === key ? 700 : 400,
            cursor: "pointer", marginBottom: -1
          }}>{label}</button>
        ))}
      </div>

      {tab === "journal" && (
        <div style={{ padding: "0 16px" }}>
          {/* Quick stats */}
          <div style={{ display: "flex", gap: 8, padding: "16px 0", overflowX: "auto" }}>
            <StatCard label="Total P&L" value={`${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}$`} color={totalPnl >= 0 ? "#2ecc71" : "#e74c3c"} />
            <StatCard label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? "#2ecc71" : "#e74c3c"} />
            <StatCard label="Trades" value={trades.length} sub={`${wins.length}W / ${losses.length}L`} />
            <StatCard label="Moy. R:R" value={avgRR} color="#c8a84b" />
          </div>

          {/* Filters */}
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["ALL", "WIN", "LOSS", "BE"].map(f_ => (
              <button key={f_} onClick={() => setFilter(f_)} style={{
                background: filter === f_ ? "#1a1a1a" : "none",
                border: `1px solid ${filter === f_ ? "#333" : "#1a1a1a"}`,
                color: filter === f_ ? "#e0e0e0" : "#555",
                borderRadius: 5, padding: "5px 12px", fontSize: 11, cursor: "pointer", fontWeight: 600
              }}>{f_}</button>
            ))}
          </div>

          {/* Trade list */}
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 13 }}>
              Aucun trade enregistré.<br />
              <span style={{ fontSize: 11 }}>Ajoute ton premier trade avec le bouton en haut.</span>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {filtered.map(trade => (
                <div key={trade.id} style={{
                  background: "#0a0a0a", border: "1px solid #161616", borderRadius: 10, padding: "14px 16px"
                }}>
                  {/* Top row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                      <Badge text={trade.direction} />
                      <Badge text={trade.result} />
                      {trade.biaisH1 && <Badge text={trade.biaisH1} />}
                      <span style={{ color: "#333", fontSize: 11 }}>{trade.session}</span>
                    </div>
                    <div style={{ color: pnlColor(trade.pnl), fontWeight: 700, fontFamily: "monospace", fontSize: 15 }}>
                      {trade.pnl ? `${parseFloat(trade.pnl) >= 0 ? "+" : ""}${parseFloat(trade.pnl).toFixed(0)}$` : "—"}
                    </div>
                  </div>

                  {/* Prices */}
                  <div style={{ display: "flex", gap: 16, marginTop: 10, flexWrap: "wrap" }}>
                    <div>
                      <div style={{ color: "#333", fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>Entrée</div>
                      <div style={{ fontFamily: "monospace", fontSize: 13 }}>{trade.entryPrice || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "#333", fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>SL</div>
                      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#e74c3c" }}>{trade.stopLoss || "—"}</div>
                    </div>
                    <div>
                      <div style={{ color: "#333", fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>TP</div>
                      <div style={{ fontFamily: "monospace", fontSize: 13, color: "#2ecc71" }}>{trade.takeProfit || "—"}</div>
                    </div>
                    {trade.rr && (
                      <div>
                        <div style={{ color: "#333", fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>R:R</div>
                        <div style={{ fontFamily: "monospace", fontSize: 13, color: "#c8a84b" }}>1:{trade.rr}</div>
                      </div>
                    )}
                    {trade.lots && (
                      <div>
                        <div style={{ color: "#333", fontSize: 9, textTransform: "uppercase", marginBottom: 2 }}>Lots</div>
                        <div style={{ fontFamily: "monospace", fontSize: 13 }}>{trade.lots}</div>
                      </div>
                    )}
                  </div>

                  {/* Setup tags */}
                  {(trade.setupM15 || trade.entreeM5) && (
                    <div style={{ display: "flex", gap: 6, marginTop: 8, flexWrap: "wrap" }}>
                      {trade.setupM15 && (
                        <span style={{ background: "#0d1a2b", color: "#5b9bd5", border: "1px solid #1a2a3b", borderRadius: 4, padding: "2px 7px", fontSize: 10 }}>
                          M15 · {trade.setupM15}
                        </span>
                      )}
                      {trade.entreeM5 && (
                        <span style={{ background: "#1a0d2b", color: "#a97bd5", border: "1px solid #2a1a3b", borderRadius: 4, padding: "2px 7px", fontSize: 10 }}>
                          M5 · {trade.entreeM5}
                        </span>
                      )}
                    </div>
                  )}

                  {trade.notes && (
                    <div style={{ color: "#444", fontSize: 11, marginTop: 8, borderTop: "1px solid #111", paddingTop: 8, lineHeight: 1.5 }}>
                      {trade.notes}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 10 }}>
                    <div style={{ color: "#2a2a2a", fontSize: 10 }}>
                      {trade.date}{trade.time && ` · ${trade.time}`}
                      {trade.emotion && trade.emotion !== "Neutre" && ` · ${trade.emotion}`}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button onClick={() => handleEdit(trade)} style={{
                        background: "none", border: "1px solid #1e1e1e", color: "#555",
                        borderRadius: 5, padding: "4px 10px", fontSize: 10, cursor: "pointer"
                      }}>Modifier</button>
                      <button onClick={() => setDeleteConfirm(trade.id)} style={{
                        background: "none", border: "1px solid #1e1e1e", color: "#5a1a1a",
                        borderRadius: 5, padding: "4px 10px", fontSize: 10, cursor: "pointer"
                      }}>Supprimer</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === "stats" && (
        <div style={{ padding: "16px" }}>
          {trades.length === 0 ? (
            <div style={{ textAlign: "center", color: "#333", padding: "60px 0", fontSize: 13 }}>
              Pas encore de données.<br /><span style={{ fontSize: 11 }}>Ajoute des trades pour voir tes stats.</span>
            </div>
          ) : (
            <>
              <div style={{ color: "#333", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Bilan global</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <StatCard label="P&L Total" value={`${totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(0)}$`} color={totalPnl >= 0 ? "#2ecc71" : "#e74c3c"} />
                <StatCard label="Win Rate" value={`${winRate}%`} color={winRate >= 50 ? "#2ecc71" : "#e74c3c"} />
                <StatCard label="R:R Moyen" value={avgRR} color="#c8a84b" />
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 24 }}>
                <StatCard label="Total" value={trades.length} />
                <StatCard label="Wins" value={wins.length} color="#2ecc71" />
                <StatCard label="Losses" value={losses.length} color="#e74c3c" />
                <StatCard label="BE" value={bes.length} color="#f1c40f" />
              </div>

              {bestTrade && (
                <div style={{ marginBottom: 20 }}>
                  <div style={{ color: "#333", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Extrêmes</div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <div style={{ flex: 1, background: "#0a1a0f", border: "1px solid #1a3a1a", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ color: "#2ecc71", fontSize: 10, marginBottom: 4 }}>MEILLEUR TRADE</div>
                      <div style={{ color: "#2ecc71", fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>+{parseFloat(bestTrade.pnl || 0).toFixed(0)}$</div>
                      <div style={{ color: "#1a4a1a", fontSize: 10 }}>{bestTrade.date}</div>
                    </div>
                    <div style={{ flex: 1, background: "#1a0a0a", border: "1px solid #3a1a1a", borderRadius: 8, padding: "12px 14px" }}>
                      <div style={{ color: "#e74c3c", fontSize: 10, marginBottom: 4 }}>PIRE TRADE</div>
                      <div style={{ color: "#e74c3c", fontFamily: "monospace", fontSize: 16, fontWeight: 700 }}>{parseFloat(worstTrade?.pnl || 0).toFixed(0)}$</div>
                      <div style={{ color: "#4a1a1a", fontSize: 10 }}>{worstTrade?.date}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Par session */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ color: "#333", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Par session</div>
                {sessionStats.filter(s => s.count > 0).map(s => (
                  <div key={s.name} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "10px 14px", background: "#0a0a0a", border: "1px solid #111",
                    borderRadius: 8, marginBottom: 6
                  }}>
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{s.name}</div>
                      <div style={{ color: "#444", fontSize: 10 }}>{s.count} trade{s.count > 1 ? "s" : ""}</div>
                    </div>
                    <div style={{ color: "#c8a84b", fontWeight: 700, fontFamily: "monospace" }}>
                      {Math.round((s.wins / s.count) * 100)}% WR
                    </div>
                  </div>
                ))}
              </div>

              {/* Par setup M15 */}
              {(() => {
                const map = {};
                trades.forEach(t => {
                  if (!t.setupM15) return;
                  if (!map[t.setupM15]) map[t.setupM15] = { total: 0, wins: 0 };
                  map[t.setupM15].total++;
                  if (t.result === "WIN") map[t.setupM15].wins++;
                });
                const entries = Object.entries(map);
                if (!entries.length) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ color: "#333", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Setup M15</div>
                    {entries.map(([setup, data]) => (
                      <div key={setup} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 14px", background: "#0a0a0a", border: "1px solid #111",
                        borderRadius: 8, marginBottom: 6
                      }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#5b9bd5" }}>{setup}</div>
                          <div style={{ color: "#444", fontSize: 10 }}>{data.total} trade{data.total > 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ color: "#c8a84b", fontWeight: 700, fontFamily: "monospace" }}>
                          {Math.round((data.wins / data.total) * 100)}% WR
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Par entrée M5 */}
              {(() => {
                const map = {};
                trades.forEach(t => {
                  if (!t.entreeM5) return;
                  if (!map[t.entreeM5]) map[t.entreeM5] = { total: 0, wins: 0 };
                  map[t.entreeM5].total++;
                  if (t.result === "WIN") map[t.entreeM5].wins++;
                });
                const entries = Object.entries(map);
                if (!entries.length) return null;
                return (
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ color: "#333", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>Entrée M5</div>
                    {entries.map(([setup, data]) => (
                      <div key={setup} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 14px", background: "#0a0a0a", border: "1px solid #111",
                        borderRadius: 8, marginBottom: 6
                      }}>
                        <div>
                          <div style={{ fontSize: 12, color: "#a97bd5" }}>{setup}</div>
                          <div style={{ color: "#444", fontSize: 10 }}>{data.total} trade{data.total > 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ color: "#c8a84b", fontWeight: 700, fontFamily: "monospace" }}>
                          {Math.round((data.wins / data.total) * 100)}% WR
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Émotions */}
              {(() => {
                const map = {};
                trades.forEach(t => {
                  if (!map[t.emotion]) map[t.emotion] = { total: 0, wins: 0 };
                  map[t.emotion].total++;
                  if (t.result === "WIN") map[t.emotion].wins++;
                });
                const entries = Object.entries(map).filter(([, v]) => v.total > 0);
                if (!entries.length) return null;
                return (
                  <div>
                    <div style={{ color: "#333", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 10 }}>État émotionnel</div>
                    {entries.map(([emotion, data]) => (
                      <div key={emotion} style={{
                        display: "flex", justifyContent: "space-between", alignItems: "center",
                        padding: "10px 14px", background: "#0a0a0a", border: "1px solid #111",
                        borderRadius: 8, marginBottom: 6
                      }}>
                        <div>
                          <div style={{ fontSize: 12 }}>{emotion}</div>
                          <div style={{ color: "#444", fontSize: 10 }}>{data.total} trade{data.total > 1 ? "s" : ""}</div>
                        </div>
                        <div style={{ color: "#c8a84b", fontWeight: 700, fontFamily: "monospace" }}>
                          {Math.round((data.wins / data.total) * 100)}% WR
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      <Modal show={showForm} onClose={() => { setShowForm(false); setEditId(null); }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 18, color: "#c8a84b" }}>
          {editId ? "Modifier le trade" : "Nouveau trade XAU/USD"}
        </div>

        <SectionLabel>Infos générales</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Date" type="date" value={form.date} onChange={f("date")} />
          <Input label="Heure" type="time" value={form.time} onChange={f("time")} />
          <Input label="Direction" value={form.direction} onChange={f("direction")} options={["BUY", "SELL"]} />
          <Input label="Session" value={form.session} onChange={f("session")} options={SESSIONS} />
        </div>

        <SectionLabel>Analyse multi-timeframe</SectionLabel>
        <Input label="Biais H1" value={form.biaisH1} onChange={f("biaisH1")} options={BIAIS} />
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Setup M15" value={form.setupM15} onChange={f("setupM15")} options={["", ...SETUPS_M15]} />
          <Input label="Entrée M5" value={form.entreeM5} onChange={f("entreeM5")} options={["", ...ENTREES_M5]} />
        </div>

        <SectionLabel>Prix & gestion</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 12px" }}>
          <Input label="Prix d'entrée" value={form.entryPrice} onChange={f("entryPrice")} placeholder="ex: 2320.50" />
          <Input label="Lots" value={form.lots} onChange={f("lots")} placeholder="ex: 0.10" />
          <Input label="Stop Loss" value={form.stopLoss} onChange={f("stopLoss")} placeholder="ex: 2310.00" style={{ color: "#e74c3c" }} />
          <Input label="Take Profit" value={form.takeProfit} onChange={f("takeProfit")} placeholder="ex: 2340.00" style={{ color: "#2ecc71" }} />
        </div>

        <SectionLabel>Résultat</SectionLabel>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0 12px" }}>
          <Input label="Résultat" value={form.result} onChange={f("result")} options={["WIN", "LOSS", "BE"]} />
          <Input label="P&L ($)" value={form.pnl} onChange={f("pnl")} placeholder="ex: +120" />
          <Input label="R:R obtenu" value={form.rr} onChange={f("rr")} placeholder="ex: 2.5" />
        </div>

        <SectionLabel>Psychologie</SectionLabel>
        <Input label="État émotionnel" value={form.emotion} onChange={f("emotion")} options={EMOTIONS} />

        <div style={{ marginBottom: 12 }}>
          <div style={{ color: "#555", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Notes</div>
          <textarea
            value={form.notes}
            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
            placeholder="Contexte, erreurs, leçons..."
            rows={3}
            style={{
              background: "#0f0f0f", border: "1px solid #222", borderRadius: 6,
              color: "#e0e0e0", padding: "8px 10px", fontSize: 12, width: "100%",
              outline: "none", fontFamily: "inherit", resize: "vertical", boxSizing: "border-box"
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 4 }}>
          <button onClick={() => { setShowForm(false); setEditId(null); }} style={{
            background: "none", border: "1px solid #222", color: "#555",
            borderRadius: 6, padding: "9px 16px", fontSize: 13, cursor: "pointer"
          }}>Annuler</button>
          <button onClick={handleSubmit} style={{
            background: "#c8a84b", color: "#000", border: "none",
            borderRadius: 6, padding: "9px 18px", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>{editId ? "Sauvegarder" : "Ajouter"}</button>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal show={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, color: "#e74c3c" }}>Supprimer ce trade ?</div>
        <div style={{ color: "#555", fontSize: 13, marginBottom: 20 }}>Cette action est irréversible.</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button onClick={() => setDeleteConfirm(null)} style={{
            background: "none", border: "1px solid #222", color: "#555",
            borderRadius: 6, padding: "9px 16px", fontSize: 13, cursor: "pointer"
          }}>Annuler</button>
          <button onClick={() => handleDelete(deleteConfirm)} style={{
            background: "#2b0d0d", color: "#e74c3c", border: "1px solid #4a1a1a",
            borderRadius: 6, padding: "9px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer"
          }}>Supprimer</button>
        </div>
      </Modal>
    </div>
  );
}

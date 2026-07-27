/**
 * CHAOS GRID — API Client
 * Connects your HTML frontend to the Python backend.
 * Place this file at: chaos-grid/static/api.js
 * Then add to index.html before </body>:  <script src="static/api.js"></script>
 */

// ══════════════════════════════════════════
//  ⚙️  ONE LINE TO CHANGE AFTER DEPLOYMENT
//  Replace with your Hugging Face backend URL
// ══════════════════════════════════════════
const API_BASE = "https://vaishnavikadwad-chaos-grid-api.hf.space";

// ── Session: stores the logged-in user in the browser ──
const Session = {
  get()        { const r = localStorage.getItem("cg_user"); return r ? JSON.parse(r) : null; },
  set(user)    { localStorage.setItem("cg_user", JSON.stringify(user)); },
  clear()      { localStorage.removeItem("cg_user"); }
};

// ── Base HTTP helper ──
async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.detail || "API error");
  return data;
}

// ── User API ──
const UserAPI = {
  async create(name, phone) {
    const user = await apiFetch("/users/create", {
      method: "POST",
      body: JSON.stringify({ name, phone }),
    });
    Session.set(user);
    return user;
  },
  async get(userId)    { return apiFetch(`/users/${userId}`); },
  async leaderboard()  { return apiFetch("/users/leaderboard/top"); },
};

// ── OTP API ──
const OTPAPI = {
  async send(phone) {
    return apiFetch(`/otp/send?phone=${encodeURIComponent(phone)}`, { method: "POST" });
  },
  async verify(phone, otp) {
    const user = Session.get();
    if (!user) throw new Error("Not logged in");
    const result = await apiFetch("/otp/verify", {
      method: "POST",
      body: JSON.stringify({ phone, otp, user_id: user.id }),
    });
    if (result.verified) Session.set({ ...user, verified: true });
    return result;
  },
};

// ── Raids API ──
const RaidsAPI = {
  async list(filters = {}) {
    const p = new URLSearchParams(filters).toString();
    return apiFetch(`/raids${p ? "?" + p : ""}`);
  },
  async get(raidId)      { return apiFetch(`/raids/${raidId}`); },
  async stats()          { return apiFetch("/raids/stats/summary"); },
  async create(data) {
    const user = Session.get();
    if (!user) throw new Error("Not logged in");
    return apiFetch("/raids/create", {
      method: "POST",
      body: JSON.stringify({ ...data, created_by: user.id }),
    });
  },
  async join(raidId) {
    const user = Session.get();
    if (!user) throw new Error("Not logged in");
    return apiFetch(`/raids/${raidId}/join`, {
      method: "POST",
      body: JSON.stringify({ user_id: user.id }),
    });
  },
};

// ── WebSocket: real-time updates ──
class RealtimeClient {
  constructor() { this.ws = null; this.handlers = {}; }
  connect() {
    const url = API_BASE.replace("https", "wss") + "/ws";
    this.ws = new WebSocket(url);
    this.ws.onopen    = () => console.log("[CHAOS GRID] ✅ Real-time connected");
    this.ws.onmessage = (e) => {
      const msg = JSON.parse(e.data);
      if (this.handlers[msg.type]) this.handlers[msg.type](msg);
    };
    this.ws.onclose   = () => setTimeout(() => this.connect(), 3000);
  }
  on(type, fn) { this.handlers[type] = fn; return this; }
}
const Realtime = new RealtimeClient();

// ── Boot: runs when page loads ──
document.addEventListener("DOMContentLoaded", async () => {

  // Connect WebSocket for real-time
  Realtime.connect();

  // When a new raid is filed by anyone → refresh map + list
  Realtime.on("new_raid", (msg) => {
    if (typeof renderMap   === "function") renderMap();
    if (typeof renderSiege === "function") renderSiege();
    if (typeof toast       === "function") toast(`📡 New report: ${msg.raid.name}`);
  });

  // When a raid gets more verifications → refresh
  Realtime.on("raid_updated", (msg) => {
    if (msg.raid.status === "critical")
      if (typeof toast === "function") toast(`⚡ ESCALATED: ${msg.raid.name}`);
    if (typeof renderMap   === "function") renderMap();
    if (typeof renderSiege === "function") renderSiege();
  });

  // Load real raids from backend into your existing STATE
  try {
    const raids = await RaidsAPI.list();
    if (window.STATE && raids.length > 0) {
      window.STATE.raids = raids.map(r => ({
        id: r.id, name: r.name, icon: r.icon || "⚠",
        loc: r.location, district: r.district,
        category: r.category, description: r.description,
        status: r.status, raiders: r.raiders_count,
        max: r.max_raiders, days: r.days_unresolved,
        lat: r.lat, lng: r.lng, cls: r.status,
      }));
      if (typeof renderMap    === "function") renderMap();
      if (typeof renderSiege  === "function") renderSiege();
      if (typeof renderLedger === "function") renderLedger();
    }

    // Load dashboard stats
    const stats = await RaidsAPI.stats();
    if (window.STATE) window.STATE.totalComplaints = stats.total_complaints;

    // Load leaderboard
    const lb = await UserAPI.leaderboard();
    if (window.LB_DATA && lb.length > 0) {
      window.LB_DATA = lb.map((u, i) => ({
        name: u.name, xp: u.xp, raids: u.raids_joined, me: i === 0,
      }));
    }

  } catch (err) {
    // Backend offline → silently use existing mock data
    console.warn("[CHAOS GRID] Backend offline — using demo data.", err.message);
  }

  // Override joinRaid() so clicks actually save to the database
  if (typeof window.joinRaid === "function") {
    const _orig = window.joinRaid;
    window.joinRaid = async (raidId) => {
      try {
        const result = await RaidsAPI.join(raidId);
        if (window.STATE && result.raid) {
          const idx = window.STATE.raids.findIndex(r => r.id === raidId);
          if (idx !== -1) {
            window.STATE.raids[idx].raiders = result.raid.raiders_count;
            window.STATE.raids[idx].status  = result.raid.status;
          }
          window.STATE.user.xp    += result.xp_awarded;
          window.STATE.user.raids += 1;
        }
        _orig(raidId);
      } catch (err) {
        if (err.message.includes("Already joined"))
          if (typeof toast === "function") toast("⚠ Already verified this raid!");
        else _orig(raidId);
      }
    };
  }
});

// Expose on window for debugging
window.CG = { UserAPI, OTPAPI, RaidsAPI, Realtime, Session };

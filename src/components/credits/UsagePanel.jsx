/* UsagePanel — Phase 4. Rich Usage panel, reachable mula sa Settings credits card.
   - Guest (walang login): guest quota display (100/day)
   - Signed-in: per-day usage bars (huling 7 araw) + per-model breakdown
   Ang "signed-in" ay tinutukoy sa settings.accountEmail (Phase 3 OTP login). */
import { useMemo } from "react";
import { RefreshCw, Zap, User } from "lucide-react";
import { useCredits } from "../../state/CreditsContext.jsx";
import { useSettings } from "../../state/SettingsContext.jsx";
import "./credits.css";

function fmtDayLabel(dayStr) {
  // "2026-10-18" → "Oct 18"
  try {
    const [y, m, d] = dayStr.split("-").map(Number);
    return new Date(y, m - 1, d).toLocaleDateString("en-PH", {
      month: "short",
      day: "numeric",
    });
  } catch {
    return dayStr;
  }
}

export default function UsagePanel() {
  const {
    balance,
    usage,
    syncing,
    fetchBalance,
    guestUsed,
    guestLeft,
    guestQuota,
    welcomeClaimed,
    welcomeCredits,
  } = useCredits();
  const { settings } = useSettings();
  const signedIn = !!(settings.accountEmail || "").trim();

  const last7 = useMemo(() => {
    const days = (usage && usage.days) || {};
    const out = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const p = (n) => String(n).padStart(2, "0");
      const key = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      out.push({ key, label: i === 0 ? "Ngayon" : fmtDayLabel(key), total: days[key]?.total || 0 });
    }
    return out;
  }, [usage]);

  const perModel = useMemo(() => {
    const days = (usage && usage.days) || {};
    const agg = {};
    for (const k of Object.keys(days)) {
      const models = days[k]?.models || {};
      for (const m of Object.keys(models)) agg[m] = (agg[m] || 0) + models[m];
    }
    return Object.entries(agg)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [usage]);

  const maxDay = Math.max(1, ...last7.map((d) => d.total));

  return (
    <div className="jd-detail">
      {/* Balance card */}
      <div className="jd-card">
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>Kasalukuyang balance</div>
            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {balance === null ? "—" : balance.toLocaleString()}
              <span style={{ fontSize: 13, fontWeight: 400, color: "var(--muted)", marginLeft: 6 }}>
                credits
              </span>
            </div>
          </div>
          <button
            type="button"
            className="jd-icon-btn"
            onClick={() => fetchBalance()}
            disabled={syncing}
            aria-label="I-refresh ang balance"
            title="I-refresh ang balance"
          >
            <RefreshCw size={18} className={syncing ? "jd-spin" : ""} />
          </button>
        </div>
        {!welcomeClaimed ? (
          <p className="jd-usage-note">
            <Zap size={13} style={{ verticalAlign: -2, marginRight: 4 }} />
            May {welcomeCredits} welcome credits ka pang puwedeng i-claim (one-time).
          </p>
        ) : null}
      </div>

      {/* Guest quota */}
      <div className="jd-card">
        <h3>
          <User size={15} style={{ verticalAlign: -2, marginRight: 6 }} />
          Guest quota
        </h3>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
          <span style={{ color: "var(--muted)" }}>Nagamit ngayong araw</span>
          <strong>
            {guestUsed} / {guestQuota}
          </strong>
        </div>
        <div className="jd-usage-bar" role="progressbar" aria-valuenow={guestUsed} aria-valuemax={guestQuota}>
          <div
            className="jd-usage-bar__fill"
            style={{ width: `${Math.min(100, (guestUsed / guestQuota) * 100)}%` }}
          />
        </div>
        <p className="jd-usage-note">
          {signedIn
            ? `Naka-login ka — may ${guestLeft} pang guest message ngayong araw.`
            : `${guestLeft} pang libreng message ngayong araw. Mag-login para sa mas mataas na limit.`}
        </p>
      </div>

      {/* Per-day bars */}
      <div className="jd-card">
        <h3>Usage — huling 7 araw</h3>
        {last7.every((d) => d.total === 0) ? (
          <p>Wala pang na-log na usage ngayong linggo.</p>
        ) : (
          last7.map((d) => (
            <div className="jd-usage-day" key={d.key}>
              <span className="jd-usage-day__label">{d.label}</span>
              <div className="jd-usage-bar" style={{ margin: 0 }}>
                <div
                  className="jd-usage-bar__fill"
                  style={{ width: `${Math.round((d.total / maxDay) * 100)}%` }}
                />
              </div>
              <span className="jd-usage-day__val">{d.total.toLocaleString()}</span>
            </div>
          ))
        )}
      </div>

      {/* Per-model */}
      <div className="jd-card">
        <h3>Per model</h3>
        {perModel.length === 0 ? (
          <p>Wala pang per-model usage na naka-log.</p>
        ) : (
          perModel.map((m) => (
            <div className="jd-usage-model" key={m.name}>
              <span className="jd-usage-model__name" title={m.name}>
                {m.name}
              </span>
              <span className="jd-usage-model__val">{m.total.toLocaleString()} credits</span>
            </div>
          ))
        )}
        <p className="jd-usage-note">
          Estimate lang ang local usage; ang server ang source of truth kapag naka-login.
        </p>
      </div>
    </div>
  );
}

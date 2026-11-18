import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import "./ui.css";

const UiContext = createContext(null);

/** Toast notifications + promise-based confirm dialog (replaces window.alert / window.confirm). */
export function UiProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null);
  const nextId = useRef(0);

  const toast = useCallback((message, type = "success") => {
    const id = ++nextId.current;
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const confirm = useCallback(
    (opts) => new Promise((resolve) => setDialog({ ...opts, resolve })),
    [],
  );

  const close = (result) => {
    dialog?.resolve(result);
    setDialog(null);
  };

  return (
    <UiContext.Provider value={{ toast, confirm }}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast-${t.type}`}>
            <span className="toast-icon">{t.type === "error" ? "⚠️" : t.type === "info" ? "ℹ️" : "✅"}</span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>
      {dialog && (
        <div className="dialog-backdrop" onClick={() => close(false)}>
          <div className="dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            <h3>{dialog.title}</h3>
            <p>{dialog.message}</p>
            <div className="dialog-actions">
              <button className="btn-ghost" onClick={() => close(false)}>Cancel</button>
              <button className={dialog.danger ? "btn-danger" : "btn-primary"} onClick={() => close(true)} autoFocus>
                {dialog.confirmLabel || "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </UiContext.Provider>
  );
}

export const useUi = () => useContext(UiContext);

const STATUS = {
  open: { label: "Voting open", cls: "chip-open" },
  upcoming: { label: "Upcoming", cls: "chip-upcoming" },
  closed: { label: "Closed", cls: "chip-closed" },
  invalid: { label: "Invalid date", cls: "chip-invalid" },
};
export function StatusChip({ status }) {
  const s = STATUS[status] || STATUS.invalid;
  return <span className={`status-chip ${s.cls}`}>{status === "open" && <span className="pulse-dot" />}{s.label}</span>;
}

export function LiveBadge() {
  return <span className="live-badge"><span className="pulse-dot" />LIVE</span>;
}

export function SearchBox({ value, onChange, placeholder }) {
  return (
    <div className="search-box">
      <span aria-hidden>🔍</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
      {value && <button className="search-clear" onClick={() => onChange("")} aria-label="Clear search">✕</button>}
    </div>
  );
}

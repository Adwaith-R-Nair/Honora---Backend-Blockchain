import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "./useAuth";

const WS_URL = "ws://localhost:8000/ws";

export default function CrossCasePopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState([]);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    function connect() {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("[WS] Connected to AI service");
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "CROSS_CASE_ALERT") {
            setAlerts((prev) => [{ ...data, id: Date.now() }, ...prev]);
          }
        } catch (err) {
          console.warn("[WS] Parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("[WS] Disconnected. Reconnecting in 5s...");
        reconnectRef.current = setTimeout(connect, 5000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    return () => {
      clearTimeout(reconnectRef.current);
      wsRef.current?.close();
    };
  }, [user]);

  const dismissAlert = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (alerts.length === 0) return null;

  return (
    <div style={styles.container}>
      {alerts.map((alert) => (
        <div key={alert.id} style={styles.popup}>
          <div style={styles.header}>
            <span style={styles.badge}>CROSS-CASE LINK</span>
            <button onClick={() => dismissAlert(alert.id)} style={styles.close}>&times;</button>
          </div>
          <p style={styles.message}>{alert.message}</p>
          <div style={styles.source}>
            Source: <strong>{alert.sourceCaseName}</strong>
            {alert.department && <span style={styles.dept}>{alert.department}</span>}
          </div>
          {alert.linkedCases?.length > 0 && (
            <div style={styles.linkedList}>
              {alert.linkedCases.map((linked, i) => {
                const handleClick = () => {
                  const role = (user?.role || "police").toLowerCase();
                  const evId = linked.evidenceId || linked.id;
                  if (evId) {
                    dismissAlert(alert.id);
                    navigate(`/dashboard/${role}/case/${evId}`);
                  }
                };
                return (
                  <div
                    key={i}
                    style={{ ...styles.linkedItem, cursor: linked.evidenceId ? 'pointer' : 'default' }}
                    onClick={handleClick}
                  >
                    <span style={styles.linkedName}>{linked.caseName}</span>
                    <span style={styles.linkedScore}>
                      {((linked.similarityScore || 0) * 100).toFixed(0)}% similar
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    bottom: "24px",
    right: "24px",
    zIndex: 10000,
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    maxWidth: "420px",
  },
  popup: {
    background: "rgba(26, 26, 46, 0.97)",
    border: "1px solid rgba(212, 175, 55, 0.5)",
    borderRadius: "12px",
    padding: "16px",
    boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
    animation: "fadeUp 0.3s ease",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  badge: {
    background: "linear-gradient(135deg, #d4af37, #b8960c)",
    color: "#1a1a2e",
    padding: "3px 10px",
    borderRadius: "4px",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.5px",
  },
  close: {
    background: "none",
    border: "none",
    color: "#888",
    fontSize: "20px",
    cursor: "pointer",
    lineHeight: 1,
  },
  message: {
    color: "#e0e0e0",
    fontSize: "13px",
    margin: "0 0 8px 0",
    lineHeight: 1.4,
  },
  source: {
    fontSize: "12px",
    color: "#aaa",
    marginBottom: "8px",
  },
  dept: {
    marginLeft: "8px",
    background: "rgba(212, 175, 55, 0.15)",
    padding: "2px 8px",
    borderRadius: "4px",
    color: "#d4af37",
    fontSize: "11px",
  },
  linkedList: {
    borderTop: "1px solid rgba(255,255,255,0.08)",
    paddingTop: "8px",
  },
  linkedItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "4px 0",
    fontSize: "12px",
  },
  linkedName: {
    color: "#ccc",
  },
  linkedScore: {
    color: "#d4af37",
    fontWeight: 600,
  },
};

"use client";

import { useState, useEffect } from "react";
import AppShell from "@/components/AppShell";
import { useToast } from "@/components/Toast";
import { chatsApi } from "@/lib/api";
import MetaConfigForm from "@/components/MetaConfigForm";

interface ChatMessage {
  id: number;
  lead_id: number;
  channel: string;
  sender_type: "customer" | "ai" | "agent";
  sender_id: string;
  message_text: string;
  created_at: string;
}

interface ChatThread {
  id: number;
  name: string;
  identifier: string;
  channel: string;
  last_message: string;
  unread: boolean;
  avatar: string;
  updated_at: string;
}

export default function InstagramDirect() {
  const { showToast } = useToast();
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [activeThreadId, setActiveThreadId] = useState<number | null>(null);
  const [history, setHistory] = useState<ChatMessage[]>([]);
  const [replyText, setReplyText] = useState("");
  const [autoPilot, setAutoPilot] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  // Load threads
  const loadThreads = async (initial = false) => {
    try {
      const data = await chatsApi.getThreads();
      const igThreads = data.filter((t) => t.channel === "instagram");
      setThreads(igThreads);
      if (initial && igThreads.length > 0) {
        setActiveThreadId(igThreads[0].id);
      }
    } catch (err) {
      console.error("Error loading Instagram threads:", err);
    } finally {
      if (initial) setLoading(false);
    }
  };

  // Load chat history
  const loadHistory = async (leadId: number) => {
    try {
      const data = await chatsApi.getHistory(leadId);
      setHistory(data);
    } catch (err) {
      console.error("Error loading Instagram history:", err);
    }
  };

  // Load autopilot configurations
  const loadConfig = async () => {
    try {
      const data = await chatsApi.getConfig();
      setAutoPilot(data.autopilot_enabled);
    } catch (err) {
      console.error("Error loading Meta config:", err);
    }
  };

  // Poll threads and active history
  useEffect(() => {
    loadThreads(true);
    loadConfig();

    const threadsInterval = setInterval(() => {
      loadThreads(false);
    }, 5000);

    return () => clearInterval(threadsInterval);
  }, []);

  useEffect(() => {
    if (activeThreadId !== null) {
      loadHistory(activeThreadId);
      const historyInterval = setInterval(() => {
        loadHistory(activeThreadId);
      }, 4000);
      return () => clearInterval(historyInterval);
    } else {
      setHistory([]);
    }
  }, [activeThreadId]);

  // Toggle AI Autopilot
  const handleToggleAutopilot = async () => {
    const nextVal = !autoPilot;
    setAutoPilot(nextVal);
    try {
      await chatsApi.toggleAutopilot(nextVal);
      showToast({
        type: "success",
        message: `AI Autopilot state set to: ${nextVal ? "ENABLED" : "DISABLED"}`,
      });
    } catch (err) {
      showToast({ type: "error", message: "Failed to update autopilot state." });
      setAutoPilot(!nextVal);
    }
  };

  // Send Instagram DM
  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || activeThreadId === null) return;

    const currentText = replyText;
    setReplyText("");

    try {
      await chatsApi.sendMessage({
        lead_id: activeThreadId,
        channel: "instagram",
        message_text: currentText,
      });

      // Reload history and threads
      await loadHistory(activeThreadId);
      await loadThreads(false);
      showToast({ type: "success", message: "Instagram Direct message successfully dispatched!" });
    } catch (err: any) {
      showToast({ type: "error", message: err.message || "Failed to dispatch message." });
      setReplyText(currentText);
    }
  };

  const activeThread = threads.find((t) => t.id === activeThreadId);

  return (
    <AppShell title="Instagram DM">
      <div style={{ display: "flex", flexDirection: "column", gap: 24, maxWidth: 1040, margin: "0 auto", paddingBottom: 40 }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <span>📸</span> Instagram Direct messaging
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Monitor customer Instagram direct messages, manage active chats, and configure Gemini AI autopilots.
            </p>
          </div>

          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <button
              onClick={() => setShowConfig(!showConfig)}
              className="btn btn-outline"
              style={{ padding: "8px 16px", borderRadius: 8, fontSize: 13, fontWeight: 700 }}
            >
              {showConfig ? "📸 Back to Chat" : "⚙️ Meta Settings"}
            </button>

            <div style={{ display: "flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.05)", padding: "8px 16px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)" }}>
              <span className="text-xs font-bold text-gray-300">🤖 AI Autopilot:</span>
              <button
                onClick={handleToggleAutopilot}
                style={{
                  background: autoPilot ? "#7C3AED" : "rgba(255,255,255,0.15)",
                  color: "white",
                  border: "none",
                  padding: "4px 12px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "background 0.2s",
                }}
              >
                {autoPilot ? "ACTIVE" : "STANDBY"}
              </button>
            </div>
          </div>
        </div>

        {showConfig ? (
          <div>
            <MetaConfigForm />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2.5fr", gap: 20, height: 600, background: "rgba(255,255,255,0.03)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.08)", overflow: "hidden", boxShadow: "0 4px 20px rgba(0,0,0,0.2)" }}>
            
            {/* Left panel: Threads */}
            <div style={{ borderRight: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", background: "rgba(0,0,0,0.2)" }}>
              <div style={{ padding: "16px", borderBottom: "1px solid rgba(255,255,255,0.08)", fontWeight: 800, fontSize: 14, color: "white" }}>
                📩 Live Chats ({threads.length})
              </div>

              {loading ? (
                <div className="flex-1 flex justify-center items-center">
                  <div className="spinner"></div>
                </div>
              ) : threads.length === 0 ? (
                <div className="flex-1 flex flex-col justify-center items-center p-4 text-center">
                  <span className="text-3xl mb-2">📸</span>
                  <span className="text-xs text-gray-400">No active Instagram threads found. Configure credentials and link your page.</span>
                </div>
              ) : (
                <div style={{ flex: 1, overflowY: "auto" }}>
                  {threads.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => setActiveThreadId(t.id)}
                      style={{
                        padding: "14px 16px",
                        borderBottom: "1px solid rgba(255,255,255,0.05)",
                        cursor: "pointer",
                        background: activeThreadId === t.id ? "rgba(124, 58, 237, 0.15)" : "transparent",
                        transition: "all 0.2s",
                        display: "flex",
                        gap: 12,
                        alignItems: "center",
                      }}
                    >
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "rgba(124, 58, 237, 0.1)", border: "1.5px solid rgba(124, 58, 237, 0.3)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16 }}>📸</div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "white" }}>{t.name}</span>
                          {t.unread && <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#7C3AED" }} />}
                        </div>
                        <div style={{ fontSize: 11, color: t.unread ? "white" : "#9CA3AF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 2, fontWeight: t.unread ? 700 : 500 }}>
                          {t.last_message}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right panel: Messages */}
            <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "rgba(0,0,0,0.1)" }}>
              {activeThread ? (
                <>
                  <div style={{ padding: "14px 20px", borderBottom: "1px solid rgba(255,255,255,0.08)", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(0,0,0,0.2)" }}>
                    <div>
                      <span style={{ fontWeight: 800, fontSize: 15, color: "white" }}>{activeThread.name}</span>
                      <span style={{ fontSize: 12, color: "#9CA3AF", marginLeft: 8 }}>@{activeThread.identifier}</span>
                    </div>
                    <span className="badge badge-teal text-xs">Instagram DM</span>
                  </div>

                  {/* Messages body */}
                  <div style={{ flex: 1, padding: 20, overflowY: "auto", display: "flex", flexDirection: "column", gap: 12, background: "rgba(0,0,0,0.15)" }}>
                    {history.map((m, idx) => (
                      <div
                        key={idx}
                        style={{
                          maxWidth: "75%",
                          padding: "10px 14px",
                          borderRadius: 16,
                          fontSize: 13,
                          alignSelf: m.sender_type === "customer" ? "flex-start" : "flex-end",
                          background:
                            m.sender_type === "customer"
                              ? "rgba(255,255,255,0.08)"
                              : m.sender_type === "ai"
                              ? "linear-gradient(135deg, rgba(124, 58, 237, 0.1) 0%, rgba(124, 58, 237, 0.05) 100%)"
                              : "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)",
                          color: "white",
                          border: m.sender_type === "ai" ? "1px solid rgba(124, 58, 237, 0.3)" : "none",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                          lineHeight: 1.4,
                        }}
                      >
                        {m.sender_type === "ai" && (
                          <div style={{ fontSize: 9, fontWeight: 800, textTransform: "uppercase", marginBottom: 4, letterSpacing: "0.03em", color: "#DDD6FE" }}>
                            🤖 TripPilot AI Co-Pilot
                          </div>
                        )}
                        <div>{m.message_text}</div>
                        <div style={{ fontSize: 8, opacity: 0.6, marginTop: 4, textAlign: "right" }}>
                          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Composer */}
                  <form onSubmit={handleSendReply} style={{ padding: "14px 20px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: 10, alignItems: "center", background: "rgba(0,0,0,0.2)" }}>
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      placeholder={`Type Instagram DM response to @${activeThread.identifier}...`}
                      style={{ flex: 1, padding: "10px 16px", borderRadius: 24, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.05)", color: "white", fontSize: 13 }}
                    />
                    <button
                      type="submit"
                      style={{ background: "linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)", color: "white", border: "none", padding: "10px 20px", borderRadius: 24, fontSize: 13, fontWeight: 700, cursor: "pointer", boxShadow: "0 2px 6px rgba(124, 58, 237, 0.3)" }}
                    >
                      Send DM
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col justify-center items-center text-gray-400 p-4">
                  <span className="text-4xl mb-2">📸</span>
                  <span className="text-sm">Select an Instagram chat thread to start messaging</span>
                </div>
              )}
            </div>

          </div>
        )}

      </div>
    </AppShell>
  );
}

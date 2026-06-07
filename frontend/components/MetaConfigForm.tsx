"use client";
import React, { useState, useEffect } from "react";
import { chatsApi } from "@/lib/api";

export default function MetaConfigForm() {
  const [config, setConfig] = useState({
    meta_access_token: "",
    meta_verify_token: "",
    whatsapp_phone_number_id: "",
    instagram_page_id: "",
    autopilot_enabled: false,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:8000/webhooks/meta");

  useEffect(() => {
    // Detect public/ngrok host if running in browser
    if (typeof window !== "undefined") {
      const origin = window.location.origin;
      if (origin.includes("localhost") || origin.includes("127.0.0.1")) {
        setWebhookUrl("http://localhost:8000/webhooks/meta");
      } else {
        setWebhookUrl(`${origin}/api/webhooks/meta`); // Or fallback to mapping port
      }
    }

    async function loadConfig() {
      try {
        const data = await chatsApi.getConfig();
        setConfig({
          meta_access_token: data.meta_access_token || "",
          meta_verify_token: data.meta_verify_token || "",
          whatsapp_phone_number_id: data.whatsapp_phone_number_id || "",
          instagram_page_id: data.instagram_page_id || "",
          autopilot_enabled: data.autopilot_enabled || false,
        });
      } catch (err: any) {
        console.error("Failed to load Meta configuration settings:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);
    try {
      await chatsApi.saveConfig({
        meta_access_token: config.meta_access_token,
        meta_verify_token: config.meta_verify_token,
        whatsapp_phone_number_id: config.whatsapp_phone_number_id,
        instagram_page_id: config.instagram_page_id,
      });
      setStatusMsg({ type: "success", text: "Meta credentials updated successfully!" });
    } catch (err: any) {
      setStatusMsg({ type: "error", text: err.message || "Failed to update configuration settings." });
    } finally {
      setSaving(false);
    }
  };

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    alert(`${label} copied to clipboard!`);
  };

  if (loading) {
    return (
      <div className="card glass-card p-6 flex flex-col justify-center items-center h-48">
        <div className="spinner mb-2"></div>
        <span className="text-sm text-gray-400">Loading Meta credentials...</span>
      </div>
    );
  }

  return (
    <div className="card glass-card p-6 w-full max-w-2xl mx-auto shadow-xl border border-white/10 rounded-xl" style={{ backdropFilter: "blur(20px)" }}>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <span>⚙️</span> Meta API Real-Time Integration
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Configure credentials to connect TripPilot directly to the Meta Graph API.
          </p>
        </div>
        <span className="badge badge-teal text-xs">Production Ready</span>
      </div>

      {statusMsg && (
        <div className={`p-3 rounded-lg mb-4 text-sm ${statusMsg.type === "success" ? "bg-teal-500/10 text-teal-300 border border-teal-500/20" : "bg-red-500/10 text-red-300 border border-red-500/20"}`}>
          {statusMsg.text}
        </div>
      )}

      {/* Webhook details for developer portal */}
      <div className="bg-white/5 border border-white/5 p-4 rounded-lg mb-6">
        <h3 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
          <span>🔗</span> Meta Webhook Configuration Details
        </h3>
        <p className="text-xs text-gray-300 mb-3 leading-relaxed">
          Copy these values and paste them into your App dashboard inside the <strong>Meta Developer Console</strong> under the <em>Webhooks</em> setup.
        </p>

        <div className="space-y-2">
          <div className="flex items-center justify-between bg-black/30 p-2 rounded border border-white/5">
            <div className="overflow-hidden mr-2">
              <span className="block text-[10px] text-gray-400 font-mono uppercase">Callback URL</span>
              <span className="text-xs font-mono text-teal-300 truncate block">{webhookUrl}</span>
            </div>
            <button
              onClick={() => handleCopy(webhookUrl, "Callback URL")}
              className="btn btn-sm btn-teal py-1 px-3 text-[11px]"
              type="button"
            >
              Copy
            </button>
          </div>

          <div className="flex items-center justify-between bg-black/30 p-2 rounded border border-white/5">
            <div className="overflow-hidden mr-2">
              <span className="block text-[10px] text-gray-400 font-mono uppercase">Verify Token</span>
              <span className="text-xs font-mono text-teal-300 truncate block">{config.meta_verify_token || "(Save a verify token below first)"}</span>
            </div>
            <button
              onClick={() => handleCopy(config.meta_verify_token, "Verify Token")}
              className="btn btn-sm btn-teal py-1 px-3 text-[11px]"
              disabled={!config.meta_verify_token}
              type="button"
            >
              Copy
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="label text-xs text-gray-300 font-semibold mb-1 block">Meta Graph Access Token (Permanent Page Access Token)</label>
          <div className="relative">
            <input
              type={showToken ? "text" : "password"}
              name="meta_access_token"
              value={config.meta_access_token}
              onChange={handleChange}
              placeholder="EAAG..."
              className="input w-full pr-12 text-sm bg-black/20 border-white/10 text-white"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-white"
            >
              {showToken ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1">
            <label className="label text-xs text-gray-300 font-semibold mb-1 block">Webhook Verify Token</label>
            <input
              type="text"
              name="meta_verify_token"
              value={config.meta_verify_token}
              onChange={handleChange}
              placeholder="e.g. my_secret_verify_token"
              className="input w-full text-sm bg-black/20 border-white/10 text-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="label text-xs text-gray-300 font-semibold mb-1 block">WhatsApp Phone ID</label>
            <input
              type="text"
              name="whatsapp_phone_number_id"
              value={config.whatsapp_phone_number_id}
              onChange={handleChange}
              placeholder="e.g. 109848392817283"
              className="input w-full text-sm bg-black/20 border-white/10 text-white"
            />
          </div>

          <div className="md:col-span-1">
            <label className="label text-xs text-gray-300 font-semibold mb-1 block">Instagram Page ID</label>
            <input
              type="text"
              name="instagram_page_id"
              value={config.instagram_page_id}
              onChange={handleChange}
              placeholder="e.g. 17841400293817382"
              className="input w-full text-sm bg-black/20 border-white/10 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          <button
            type="submit"
            className="btn btn-teal px-6 py-2 text-sm font-semibold rounded-lg"
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "Save Meta Config"}
          </button>
        </div>
      </form>
    </div>
  );
}

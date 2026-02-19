"use client";

import { useState, useTransition } from "react";
import { Gift, Plus, RefreshCw, Zap, CheckCircle, XCircle, Clock, Loader2, AlertCircle } from "lucide-react";
import { syncGiftCodes, addManualCode, redeemCodeForPlayer, redeemAllForPlayer } from "@/app/actions/giftcodes";

interface GiftCodeData {
  id: string;
  code: string;
  source: string | null;
  status: string;
  discoveredAt: string;
  redemptions: Array<{
    id: string;
    status: string;
    message: string | null;
    playerFidId: string;
    redeemedAt: string;
  }>;
}

interface PlayerFidData {
  id: string;
  fid: string;
  nickname: string | null;
}

const STATUS_STYLES: Record<string, { icon: any; color: string; bg: string }> = {
  ACTIVE: { icon: Clock, color: "text-green-400", bg: "bg-green-500/10" },
  EXPIRED: { icon: XCircle, color: "text-zinc-500", bg: "bg-zinc-500/10" },
  INVALID: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-500/10" },
  SUCCESS: { icon: CheckCircle, color: "text-green-400", bg: "bg-green-500/10" },
  USED: { icon: CheckCircle, color: "text-blue-400", bg: "bg-blue-500/10" },
  FAILED: { icon: XCircle, color: "text-red-400", bg: "bg-red-500/10" },
};

export function GiftCodeManager({
  codes: initialCodes,
  userFids,
  isAdmin,
}: {
  codes: GiftCodeData[];
  userFids: PlayerFidData[];
  isAdmin: boolean;
}) {
  const [codes] = useState(initialCodes);
  const [newCode, setNewCode] = useState("");
  const [isPending, startTransition] = useTransition();
  const [syncing, setSyncing] = useState(false);
  const [redeemingAll, setRedeemingAll] = useState(false);
  const [redeemingCode, setRedeemingCode] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [selectedFid, setSelectedFid] = useState(userFids[0]?.id || "");

  const handleSync = async () => {
    setSyncing(true);
    setMessage("");
    const result = await syncGiftCodes();
    setSyncing(false);
    if (result.error) setMessage(`Error: ${result.error}`);
    else setMessage(`Synced! ${result.newCodes} new codes found.`);
  };

  const handleAddCode = async () => {
    if (!newCode.trim()) return;
    setMessage("");
    startTransition(async () => {
      const result = await addManualCode(newCode.trim());
      if (result.error) setMessage(`Error: ${result.error}`);
      else { setMessage("Code added!"); setNewCode(""); }
    });
  };

  const handleRedeem = async (codeId: string) => {
    if (!selectedFid) { setMessage("Link a FID first in Player Lookup"); return; }
    setRedeemingCode(codeId);
    setMessage("");
    const result = await redeemCodeForPlayer(codeId, selectedFid);
    setRedeemingCode(null);
    setMessage(result.success ? `Redeemed: ${result.message}` : `Failed: ${result.error || result.message}`);
  };

  const handleRedeemAll = async () => {
    if (!selectedFid) { setMessage("Link a FID first in Player Lookup"); return; }
    setRedeemingAll(true);
    setMessage("");
    const result = await redeemAllForPlayer(selectedFid);
    setRedeemingAll(false);
    if (result.error) setMessage(`Error: ${result.error}`);
    else setMessage(`Done! Redeemed: ${result.redeemed}, Failed: ${result.failed}, Skipped: ${result.skipped}`);
  };

  const activeCodes = codes.filter((c) => c.status === "ACTIVE");
  const inactiveCodes = codes.filter((c) => c.status !== "ACTIVE");

  const getRedemptionStatus = (code: GiftCodeData) => {
    if (!selectedFid) return null;
    return code.redemptions.find((r) => r.playerFidId === selectedFid);
  };

  return (
    <div className="space-y-6">
      {/* No FIDs warning */}
      {userFids.length === 0 && (
        <div className="glass-panel rounded-2xl p-4 border border-amber-500/30 bg-amber-500/5">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
            <p className="text-amber-400 text-sm">
              Link your game FID first in <a href="/dashboard/tools/player-lookup" className="underline font-bold">Player Lookup</a> to redeem gift codes.
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="glass-panel rounded-2xl p-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* FID Selector */}
          {userFids.length > 0 && (
            <select
              value={selectedFid}
              onChange={(e) => setSelectedFid(e.target.value)}
              className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500/50"
            >
              {userFids.map((f) => (
                <option key={f.id} value={f.id}>{f.nickname || f.fid}</option>
              ))}
            </select>
          )}

          <button
            onClick={handleSync}
            disabled={syncing}
            className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {syncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4 text-purple-400" />}
            Sync Codes
          </button>

          {userFids.length > 0 && activeCodes.length > 0 && (
            <button
              onClick={handleRedeemAll}
              disabled={redeemingAll}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg text-sm font-bold hover:from-purple-400 hover:to-pink-500 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {redeemingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
              Redeem All
            </button>
          )}
        </div>

        {/* Add Manual Code (Admin) */}
        {isAdmin && (
          <div className="flex gap-2">
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCode()}
              placeholder="Add gift code manually..."
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-purple-500/50"
            />
            <button
              onClick={handleAddCode}
              disabled={isPending || !newCode.trim()}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        )}

        {message && (
          <p className={`text-sm ${message.startsWith("Error") || message.startsWith("Failed") ? "text-red-400" : "text-green-400"}`}>
            {message}
          </p>
        )}
      </div>

      {/* Active Codes */}
      {activeCodes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
            Active Codes ({activeCodes.length})
          </h3>
          {activeCodes.map((code) => {
            const redemption = getRedemptionStatus(code);
            return (
              <div key={code.id} className="glass-panel rounded-xl p-4 flex items-center gap-4">
                <Gift className="h-5 w-5 text-purple-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-mono font-bold text-sm truncate">{code.code}</p>
                  <p className="text-[10px] text-zinc-500">
                    {code.source === "api" ? "Auto-discovered" : "Manual"} • {new Date(code.discoveredAt).toLocaleDateString()}
                  </p>
                </div>
                {redemption ? (
                  <div className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold ${STATUS_STYLES[redemption.status]?.bg || "bg-zinc-500/10"} ${STATUS_STYLES[redemption.status]?.color || "text-zinc-400"}`}>
                    {(() => { const Icon = STATUS_STYLES[redemption.status]?.icon || Clock; return <Icon className="h-3 w-3" />; })()}
                    {redemption.status}
                  </div>
                ) : userFids.length > 0 ? (
                  <button
                    onClick={() => handleRedeem(code.id)}
                    disabled={redeemingCode === code.id || redeemingAll}
                    className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs font-bold text-purple-400 hover:bg-purple-500/30 transition-all flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {redeemingCode === code.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                    Redeem
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Inactive Codes */}
      {inactiveCodes.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest px-1">
            Expired / Invalid ({inactiveCodes.length})
          </h3>
          {inactiveCodes.map((code) => (
            <div key={code.id} className="glass-panel rounded-xl p-4 flex items-center gap-4 opacity-50">
              <Gift className="h-5 w-5 text-zinc-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-mono text-sm text-zinc-500 truncate">{code.code}</p>
              </div>
              <span className="text-xs text-zinc-600">{code.status}</span>
            </div>
          ))}
        </div>
      )}

      {codes.length === 0 && (
        <div className="glass-panel rounded-2xl p-12 text-center">
          <Gift className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
          <p className="text-zinc-400 text-lg font-bold mb-2">No gift codes yet</p>
          <p className="text-zinc-500 text-sm">Click &quot;Sync Codes&quot; to fetch the latest codes from the community API.</p>
        </div>
      )}
    </div>
  );
}

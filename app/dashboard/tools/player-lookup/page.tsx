"use client";

import { useState } from "react";
import { Search, Link2, Unlink, Flame, Globe, User, Loader2, CheckCircle } from "lucide-react";
import { lookupPlayerByFid, linkPlayerFid, getLinkedFids, unlinkPlayerFid } from "@/app/actions/player";

// Client-side furnace level mapping for display
const FURNACE_LEVELS: Record<number, string> = {};
for (let i = 1; i <= 30; i++) FURNACE_LEVELS[i] = `Furnace ${i}`;
for (let fc = 1; fc <= 14; fc++) {
  for (let sub = 1; sub <= 4; sub++) {
    const raw = 30 + (fc - 1) * 4 + sub;
    FURNACE_LEVELS[raw] = `FC ${fc}-${sub}`;
  }
}
function getLevelName(lv: number) { return FURNACE_LEVELS[lv] || `Level ${lv}`; }

interface PlayerResult {
  nickname: string;
  furnaceLv: number;
  furnaceLevelName: string;
  kid: string;
  avatarUrl: string;
}

export default function PlayerLookupPage() {
  const [fid, setFid] = useState("");
  const [loading, setLoading] = useState(false);
  const [linking, setLinking] = useState(false);
  const [player, setPlayer] = useState<PlayerResult | null>(null);
  const [error, setError] = useState("");
  const [linked, setLinked] = useState(false);
  const [linkMsg, setLinkMsg] = useState("");

  const handleSearch = async () => {
    if (!fid.trim()) return;
    setLoading(true);
    setError("");
    setPlayer(null);
    setLinked(false);
    setLinkMsg("");

    const result = await lookupPlayerByFid(fid.trim());
    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else if (result.player) {
      setPlayer(result.player);
    }
  };

  const handleLink = async () => {
    if (!fid.trim()) return;
    setLinking(true);
    setLinkMsg("");

    const result = await linkPlayerFid(fid.trim());
    setLinking(false);

    if (result.error) {
      setLinkMsg(result.error);
    } else {
      setLinked(true);
      setLinkMsg("FID linked to your profile!");
    }
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
            <Search className="h-5 w-5 text-cyan-400" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Player Lookup</h1>
        </div>
        <p className="text-zinc-400 text-sm">
          Search any Whiteout Survival player by their Furnace ID (FID)
        </p>
      </header>

      {/* Search Box */}
      <div className="glass-panel rounded-2xl p-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={fid}
            onChange={(e) => setFid(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter Furnace ID (e.g. 123456789)"
            className="flex-1 bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all"
          />
          <button
            onClick={handleSearch}
            disabled={loading || !fid.trim()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl font-semibold hover:from-cyan-400 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            Search
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-panel rounded-2xl p-4 border border-red-500/30 bg-red-500/10">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Results */}
      {player && (
        <div className="glass-panel rounded-2xl p-6 space-y-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-white/10 flex items-center justify-center shrink-0 overflow-hidden">
              {player.avatarUrl ? (
                <img src={player.avatarUrl} alt="" className="w-full h-full object-cover rounded-2xl" />
              ) : (
                <User className="h-10 w-10 text-cyan-400" />
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-3">
              <h2 className="text-2xl font-bold">{player.nickname}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                  <Flame className="h-4 w-4 text-orange-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">Furnace</p>
                    <p className="text-sm font-bold text-orange-400">{getLevelName(player.furnaceLv)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                  <Globe className="h-4 w-4 text-blue-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">Kingdom</p>
                    <p className="text-sm font-bold text-blue-400">#{player.kid}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 bg-black/20 rounded-lg px-3 py-2">
                  <Search className="h-4 w-4 text-cyan-400" />
                  <div>
                    <p className="text-[10px] uppercase tracking-widest text-zinc-500">FID</p>
                    <p className="text-sm font-bold text-cyan-400">{fid}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Link Button */}
          <div className="flex items-center gap-3 pt-2 border-t border-white/10">
            <button
              onClick={handleLink}
              disabled={linking || linked}
              className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm font-medium hover:bg-white/10 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {linking ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : linked ? (
                <CheckCircle className="h-4 w-4 text-green-400" />
              ) : (
                <Link2 className="h-4 w-4 text-cyan-400" />
              )}
              {linked ? "Linked!" : "Link to My Profile"}
            </button>
            {linkMsg && (
              <p className={`text-sm ${linked ? "text-green-400" : "text-red-400"}`}>{linkMsg}</p>
            )}
          </div>
        </div>
      )}

      {/* Help */}
      <div className="glass-panel rounded-2xl p-6">
        <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-3">How to find your FID</h3>
        <ol className="text-zinc-400 text-sm space-y-2 list-decimal list-inside">
          <li>Open Whiteout Survival on your device</li>
          <li>Tap your avatar/profile picture (top-left corner)</li>
          <li>Your FID is shown below your name (e.g. 12345678)</li>
          <li>Copy the number and paste it in the search box above</li>
        </ol>
      </div>
    </div>
  );
}

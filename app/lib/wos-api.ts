import crypto from "crypto";

const WOS_API_SECRET = "tB87#kPtkxqOS2";
const PRIMARY_API = "https://wos-giftcode-api.centurygame.com";
const FALLBACK_API = "https://gof-report-api-formal.centurygame.com";

// Furnace level mapping (raw game levels 31-84 → display names)
export const FURNACE_LEVELS: Record<number, string> = {
  1: "Furnace 1", 2: "Furnace 2", 3: "Furnace 3", 4: "Furnace 4", 5: "Furnace 5",
  6: "Furnace 6", 7: "Furnace 7", 8: "Furnace 8", 9: "Furnace 9", 10: "Furnace 10",
  11: "Furnace 11", 12: "Furnace 12", 13: "Furnace 13", 14: "Furnace 14", 15: "Furnace 15",
  16: "Furnace 16", 17: "Furnace 17", 18: "Furnace 18", 19: "Furnace 19", 20: "Furnace 20",
  21: "Furnace 21", 22: "Furnace 22", 23: "Furnace 23", 24: "Furnace 24", 25: "Furnace 25",
  26: "Furnace 26", 27: "Furnace 27", 28: "Furnace 28", 29: "Furnace 29", 30: "Furnace 30",
  31: "FC 1-1", 32: "FC 1-2", 33: "FC 1-3", 34: "FC 1-4",
  35: "FC 2-1", 36: "FC 2-2", 37: "FC 2-3", 38: "FC 2-4",
  39: "FC 3-1", 40: "FC 3-2", 41: "FC 3-3", 42: "FC 3-4",
  43: "FC 4-1", 44: "FC 4-2", 45: "FC 4-3", 46: "FC 4-4",
  47: "FC 5-1", 48: "FC 5-2", 49: "FC 5-3", 50: "FC 5-4",
  51: "FC 6-1", 52: "FC 6-2", 53: "FC 6-3", 54: "FC 6-4",
  55: "FC 7-1", 56: "FC 7-2", 57: "FC 7-3", 58: "FC 7-4",
  59: "FC 8-1", 60: "FC 8-2", 61: "FC 8-3", 62: "FC 8-4",
  63: "FC 9-1", 64: "FC 9-2", 65: "FC 9-3", 66: "FC 9-4",
  67: "FC 10-1", 68: "FC 10-2", 69: "FC 10-3", 70: "FC 10-4",
  71: "FC 11-1", 72: "FC 11-2", 73: "FC 11-3", 74: "FC 11-4",
  75: "FC 12-1", 76: "FC 12-2", 77: "FC 12-3", 78: "FC 12-4",
  79: "FC 13-1", 80: "FC 13-2", 81: "FC 13-3", 82: "FC 13-4",
  83: "FC 14-1", 84: "FC 14-2",
};

export function getFurnaceLevelName(rawLevel: number): string {
  return FURNACE_LEVELS[rawLevel] || `Level ${rawLevel}`;
}

/**
 * Generate simple sign for player lookup endpoint
 * sign = MD5("fid={fid}&time={time}" + secret)
 */
function generatePlayerSign(fid: string): { sign: string; time: string } {
  const time = Date.now().toString();
  const raw = `fid=${fid}&time=${time}${WOS_API_SECRET}`;
  const sign = crypto.createHash("md5").update(raw).digest("hex");
  return { sign, time };
}

/**
 * Generate complex sign for gift code operations
 * Sort keys alphabetically, join as key=value&, append secret, MD5
 */
export function generateSign(params: Record<string, string>): string {
  const sorted = Object.keys(params).sort();
  const raw = sorted.map((k) => `${k}=${params[k]}`).join("&") + WOS_API_SECRET;
  return crypto.createHash("md5").update(raw).digest("hex");
}

export interface PlayerInfo {
  nickname: string;
  furnaceLv: number;
  furnaceLevelName: string;
  kid: string;
  avatarUrl: string;
  stoveLv: number;
}

/**
 * Lookup a player by their FID using the WOS game API
 */
export async function lookupPlayer(fid: string): Promise<PlayerInfo | null> {
  const apis = [PRIMARY_API, FALLBACK_API];

  for (const baseUrl of apis) {
    try {
      const { sign, time } = generatePlayerSign(fid);
      const formData = new URLSearchParams();
      formData.append("fid", fid);
      formData.append("time", time);
      formData.append("sign", sign);

      const res = await fetch(`${baseUrl}/api/player`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: formData.toString(),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) continue;

      const json = await res.json();
      if (json.code !== 0 || !json.data) continue;

      const data = json.data;
      return {
        nickname: data.nickname || "Unknown",
        furnaceLv: data.stove_lv || data.furnace_lv || 1,
        furnaceLevelName: getFurnaceLevelName(data.stove_lv || data.furnace_lv || 1),
        kid: data.kid || "Unknown",
        avatarUrl: data.stove_lv_content || data.avatar_image || "",
        stoveLv: data.stove_lv || 1,
      };
    } catch {
      continue;
    }
  }

  return null;
}

/**
 * Fetch captcha image for gift code redemption
 */
export async function fetchCaptcha(fid: string): Promise<{ img: string; sign_data: Record<string, string> } | null> {
  try {
    const time = Date.now().toString();
    const params: Record<string, string> = { fid, time };
    const sign = generateSign(params);

    const formData = new URLSearchParams();
    formData.append("fid", fid);
    formData.append("time", time);
    formData.append("sign", sign);

    const res = await fetch(`${PRIMARY_API}/api/captcha`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return null;

    const json = await res.json();
    if (json.code !== 0 || !json.data?.img) return null;

    return { img: json.data.img, sign_data: { fid, time } };
  } catch {
    return null;
  }
}

export interface RedemptionResult {
  success: boolean;
  status: string;
  message: string;
  errCode?: number;
}

// Gift code error code mapping (from bot)
const GIFT_CODE_ERRORS: Record<number, { status: string; message: string }> = {
  0: { status: "SUCCESS", message: "Gift code redeemed successfully" },
  40014: { status: "USED", message: "Gift code already used" },
  40007: { status: "INVALID", message: "Invalid gift code" },
  20000: { status: "CAPTCHA_WRONG", message: "Wrong captcha answer" },
  40008: { status: "EXPIRED", message: "Gift code has expired" },
  40004: { status: "TIMEOUT", message: "Redemption timeout" },
  40011: { status: "LIMIT", message: "Redemption limit reached" },
};

/**
 * Redeem a gift code for a specific player
 */
export async function redeemGiftCode(
  fid: string,
  code: string,
  captchaAnswer: string
): Promise<RedemptionResult> {
  try {
    const time = Date.now().toString();
    const params: Record<string, string> = {
      fid,
      cdk: code,
      time,
      captcha: captchaAnswer,
    };
    const sign = generateSign(params);

    const formData = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => formData.append(k, v));
    formData.append("sign", sign);

    const res = await fetch(`${PRIMARY_API}/api/gift_code`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      return { success: false, status: "FAILED", message: "API request failed" };
    }

    const json = await res.json();
    const errCode = json.code ?? json.err_code ?? -1;
    const errInfo = GIFT_CODE_ERRORS[errCode];

    if (errInfo) {
      return { success: errCode === 0, status: errInfo.status, message: errInfo.message, errCode };
    }

    return {
      success: false,
      status: "UNKNOWN",
      message: json.msg || `Unknown error (code: ${errCode})`,
      errCode,
    };
  } catch (error) {
    return { success: false, status: "FAILED", message: "Network error" };
  }
}

/**
 * Fetch available gift codes from community API
 */
export async function fetchAvailableCodes(): Promise<string[]> {
  try {
    const res = await fetch("http://gift-code-api.whiteout-bot.com/giftcode_api.php", {
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) return [];

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (Array.isArray(json)) return json.filter((c: string) => typeof c === "string" && c.length > 0);
      if (json.codes && Array.isArray(json.codes)) return json.codes;
      if (json.data && Array.isArray(json.data)) return json.data;
    } catch {
      // Try line-by-line format
      return text.split("\n").map((l: string) => l.trim()).filter((l: string) => l.length > 3);
    }

    return [];
  } catch {
    return [];
  }
}

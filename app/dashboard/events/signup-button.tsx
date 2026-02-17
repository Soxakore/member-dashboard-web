"use client";

import { toggleAttendance } from "@/app/actions/events";
import { useState } from "react";
import { Loader2, Check, UserPlus, UserMinus } from "lucide-react";

interface Props {
    eventId: string;
    isAttending: boolean;
    isPast: boolean;
}

export function EventSignupButton({ eventId, isAttending, isPast }: Props) {
    const [loading, setLoading] = useState(false);

    async function handleClick() {
        setLoading(true);
        await toggleAttendance(eventId);
        setLoading(false);
    }

    if (isPast) {
        return (
            <button disabled className="px-4 py-2 rounded-lg bg-zinc-800 text-zinc-500 text-sm font-bold cursor-not-allowed">
                Completed
            </button>
        )
    }

    return (
        <button
            onClick={handleClick}
            disabled={loading}
            className={`px-4 py-2 rounded-lg font-bold text-sm transition-all flex items-center gap-2 ${isAttending
                    ? "bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20"
                    : "bg-[#2b8cee] text-white hover:bg-[#2b8cee]/90 shadow-lg shadow-[#2b8cee]/20"
                }`}
        >
            {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : isAttending ? (
                <>
                    <UserMinus className="h-4 w-4" /> Leave
                </>
            ) : (
                <>
                    <UserPlus className="h-4 w-4" /> Join
                </>
            )}
        </button>
    );
}

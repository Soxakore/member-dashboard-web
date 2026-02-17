"use client";

import { useState } from "react";

export function ProfileForm({ user }: { user: any }) {
    return (
        <div className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Username</label>
                <input
                    type="text"
                    value={user.username || ""}
                    disabled
                    className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-zinc-500 cursor-not-allowed"
                />
            </div>
            <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Role</label>
                <div className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-2 text-zinc-500">
                    {user.role}
                </div>
            </div>
            <p className="text-xs text-zinc-600 mt-4">For security reasons, profile editing is disabled in this view.</p>
        </div>
    );
}

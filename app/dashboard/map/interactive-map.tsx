"use client";

import { createMapLocation, deleteMapLocation } from "@/app/actions/map";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    MapPin, Trash2, X, Plus, Minus, Move, MousePointer2,
    Home, Castle, AlertTriangle, Shield, Flag, Box, Undo2, Redo2,
    Save, LayoutGrid, Download, Copy, Check, Palette, List,
    Eye, EyeOff, Edit3, Rotate3D, ChevronDown, ChevronUp, Cuboid
} from "lucide-react";

interface Location {
    id: string;
    x: number;
    y: number;
    label: string | null;
    type: string;
    description: string | null;
    createdById: string;
    createdBy: {
        username: string | null;
        role: string;
    };
    team?: string;
}

interface Props {
    locations: Location[];
    currentUser: any;
}

interface HistoryEntry {
    locations: Location[];
    description: string;
}

interface Team {
    name: string;
    color: string;
}

// Constants
const TILE_WIDTH = 100;
const TILE_HEIGHT = 50;
const TOP_TILE_SIZE = 40;
const GRID_SIZE = 50;

const DEFAULT_TEAMS: Team[] = [
    { name: "Main", color: "#3b82f6" },
    { name: "Defense", color: "#ef4444" },
    { name: "Farm", color: "#10b981" },
];

const TYPE_COLORS: Record<string, string> = {
    HQ: "#f59e0b",
    CITY: "#3b82f6",
    TRAP: "#ef4444",
    FARM: "#10b981",
    BANNER: "#8b5cf6",
    OBSTACLE: "#6b7280",
};

const TYPE_HEIGHTS: Record<string, number> = {
    HQ: 60,
    CITY: 40,
    TRAP: 30,
    FARM: 20,
    BANNER: 50,
    OBSTACLE: 15,
};

function hexToRgb(hex: string) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
}

function darkenHex(hex: string, amount: number): string {
    const { r, g, b } = hexToRgb(hex);
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    return `rgb(${clamp(r + amount)},${clamp(g + amount)},${clamp(b + amount)})`;
}

export function InteractiveMap({ locations: initialLocations, currentUser }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Core State
    const [locations, setLocations] = useState<Location[]>(initialLocations);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [selectedTool, setSelectedTool] = useState<string | null>("SELECT");
    const [hoveredCell, setHoveredCell] = useState<{ x: number; y: number } | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // View State
    const [viewMode, setViewMode] = useState<"ISO" | "TOP" | "3D">("ISO");
    const [rotation, setRotation] = useState(0);
    const [showLabels, setShowLabels] = useState(true);
    const [showGrid, setShowGrid] = useState(true);

    // Teams
    const [teams, setTeams] = useState<Team[]>(DEFAULT_TEAMS);
    const [showTeamPanel, setShowTeamPanel] = useState(false);
    const [newTeamName, setNewTeamName] = useState("");
    const [newTeamColor, setNewTeamColor] = useState("#38bdf8");

    // City List
    const [showCityList, setShowCityList] = useState(false);
    const [citySort, setCitySort] = useState<"name" | "type" | "team">("name");

    // Undo/Redo
    const [history, setHistory] = useState<HistoryEntry[]>([{ locations: initialLocations, description: "Initial" }]);
    const [historyIndex, setHistoryIndex] = useState(0);

    // Edit Mode
    const [editingLabel, setEditingLabel] = useState<string | null>(null);
    const [editLabelValue, setEditLabelValue] = useState("");

    // Clipboard
    const [copied, setCopied] = useState(false);

    // Canvas sizing
    useEffect(() => {
        const resize = () => {
            if (canvasRef.current && containerRef.current) {
                const { width, height } = containerRef.current.getBoundingClientRect();
                canvasRef.current.width = width * window.devicePixelRatio;
                canvasRef.current.height = height * window.devicePixelRatio;
                canvasRef.current.style.width = width + "px";
                canvasRef.current.style.height = height + "px";
            }
        };
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    // Center map on init
    useEffect(() => {
        if (containerRef.current) {
            const { width, height } = containerRef.current.getBoundingClientRect();
            setOffset({ x: width / 2, y: height / 4 });
        }
    }, [viewMode]);

    // History helpers
    const pushHistory = useCallback((newLocations: Location[], desc: string) => {
        setHistory(prev => {
            const trimmed = prev.slice(0, historyIndex + 1);
            return [...trimmed, { locations: newLocations, description: desc }];
        });
        setHistoryIndex(prev => prev + 1);
    }, [historyIndex]);

    const undo = useCallback(() => {
        if (historyIndex > 0) {
            const newIndex = historyIndex - 1;
            setHistoryIndex(newIndex);
            setLocations(history[newIndex].locations);
        }
    }, [historyIndex, history]);

    const redo = useCallback(() => {
        if (historyIndex < history.length - 1) {
            const newIndex = historyIndex + 1;
            setHistoryIndex(newIndex);
            setLocations(history[newIndex].locations);
        }
    }, [historyIndex, history]);

    // Keyboard shortcuts
    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (editingLabel) return; // don't capture when editing

            if ((e.metaKey || e.ctrlKey) && e.key === "z" && !e.shiftKey) {
                e.preventDefault();
                undo();
            } else if ((e.metaKey || e.ctrlKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
                e.preventDefault();
                redo();
            } else if (e.key === "Delete" || e.key === "Backspace") {
                if (selectedLocationId) {
                    e.preventDefault();
                    handleDelete();
                }
            } else if (e.key === "Escape") {
                setSelectedLocationId(null);
                setSelectedTool("SELECT");
            } else if (selectedLocationId && ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
                moveSelected(e.key);
            }
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [undo, redo, selectedLocationId, editingLabel]);

    const moveSelected = (key: string) => {
        if (!selectedLocationId) return;
        setLocations(prev => {
            const updated = prev.map(l => {
                if (l.id !== selectedLocationId) return l;
                let { x, y } = l;
                if (key === "ArrowUp") y--;
                if (key === "ArrowDown") y++;
                if (key === "ArrowLeft") x--;
                if (key === "ArrowRight") x++;
                x = Math.max(0, Math.min(GRID_SIZE - 1, x));
                y = Math.max(0, Math.min(GRID_SIZE - 1, y));
                return { ...l, x, y };
            });
            pushHistory(updated, "Move structure");
            return updated;
        });
    };

    // Coordinate systems
    const rotatePoint = (x: number, y: number) => {
        switch (rotation) {
            case 90: return { x: y, y: GRID_SIZE - x };
            case 180: return { x: GRID_SIZE - x, y: GRID_SIZE - y };
            case 270: return { x: GRID_SIZE - y, y: x };
            default: return { x, y };
        }
    };

    const unrotatePoint = (rx: number, ry: number) => {
        switch (rotation) {
            case 90: return { x: GRID_SIZE - ry, y: rx };
            case 180: return { x: GRID_SIZE - rx, y: GRID_SIZE - ry };
            case 270: return { x: ry, y: GRID_SIZE - rx };
            default: return { x: rx, y: ry };
        }
    };

    const toScreen = (gridX: number, gridY: number) => {
        const { x, y } = rotatePoint(gridX, gridY);
        if (viewMode === "TOP") {
            return { x: (x - GRID_SIZE / 2) * TOP_TILE_SIZE, y: (y - GRID_SIZE / 2) * TOP_TILE_SIZE };
        }
        // ISO and 3D use same projection
        return { x: (x - y) * TILE_WIDTH / 2, y: (x + y) * TILE_HEIGHT / 2 };
    };

    const toGrid = (screenX: number, screenY: number) => {
        const dpr = window.devicePixelRatio || 1;
        const adjX = screenX - offset.x;
        const adjY = screenY - offset.y;
        let rx = 0, ry = 0;
        if (viewMode === "TOP") {
            rx = Math.floor(adjX / (TOP_TILE_SIZE * scale) + GRID_SIZE / 2);
            ry = Math.floor(adjY / (TOP_TILE_SIZE * scale) + GRID_SIZE / 2);
        } else {
            const scaledTW = TILE_WIDTH * scale;
            const scaledTH = TILE_HEIGHT * scale;
            rx = Math.floor((adjX / (scaledTW / 2) + adjY / (scaledTH / 2)) / 2);
            ry = Math.floor((adjY / (scaledTH / 2) - adjX / (scaledTW / 2)) / 2);
        }
        return unrotatePoint(rx, ry);
    };

    // 3D rendering helpers
    const draw3DBuilding = (ctx: CanvasRenderingContext2D, type: string, sx: number, sy: number, color: string, isSelected: boolean, label: string | null) => {
        const height = (TYPE_HEIGHTS[type] || 30) * 1.5;
        const centerY = sy + TILE_HEIGHT / 2;
        const halfW = TILE_WIDTH / 3;
        const halfH = TILE_HEIGHT / 3;

        // Ground shadow
        ctx.fillStyle = "rgba(0,0,0,0.5)";
        ctx.beginPath();
        ctx.ellipse(sx, centerY + 5, halfW * 1.2, halfH * 1.2, 0, 0, Math.PI * 2);
        ctx.fill();

        // Selection glow
        if (isSelected) {
            ctx.shadowColor = "#facc15";
            ctx.shadowBlur = 20;
            ctx.fillStyle = "rgba(250, 204, 21, 0.3)";
            ctx.beginPath();
            ctx.ellipse(sx, centerY, halfW * 1.5, halfH * 1.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }

        // Left face (darkest)
        ctx.fillStyle = darkenHex(color, -60);
        ctx.beginPath();
        ctx.moveTo(sx - halfW, centerY - height + halfH);
        ctx.lineTo(sx - halfW, centerY + halfH);
        ctx.lineTo(sx, centerY + TILE_HEIGHT / 1.5);
        ctx.lineTo(sx, centerY - height + TILE_HEIGHT / 1.5);
        ctx.closePath();
        ctx.fill();

        // Right face (dark)
        ctx.fillStyle = darkenHex(color, -30);
        ctx.beginPath();
        ctx.moveTo(sx + halfW, centerY - height + halfH);
        ctx.lineTo(sx + halfW, centerY + halfH);
        ctx.lineTo(sx, centerY + TILE_HEIGHT / 1.5);
        ctx.lineTo(sx, centerY - height + TILE_HEIGHT / 1.5);
        ctx.closePath();
        ctx.fill();

        // Top face (brightest)
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.moveTo(sx, centerY - height);
        ctx.lineTo(sx + halfW, centerY - height + halfH);
        ctx.lineTo(sx, centerY - height + TILE_HEIGHT / 1.5);
        ctx.lineTo(sx - halfW, centerY - height + halfH);
        ctx.closePath();
        ctx.fill();

        // Edge highlights
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx, centerY - height);
        ctx.lineTo(sx + halfW, centerY - height + halfH);
        ctx.moveTo(sx, centerY - height);
        ctx.lineTo(sx - halfW, centerY - height + halfH);
        ctx.stroke();

        // Roof detail for HQ
        if (type === "HQ") {
            const roofH = 15;
            ctx.fillStyle = darkenHex(color, 30);
            ctx.beginPath();
            ctx.moveTo(sx, centerY - height - roofH);
            ctx.lineTo(sx + halfW * 0.6, centerY - height + halfH * 0.3);
            ctx.lineTo(sx, centerY - height + TILE_HEIGHT / 2.5);
            ctx.lineTo(sx - halfW * 0.6, centerY - height + halfH * 0.3);
            ctx.closePath();
            ctx.fill();
        }

        // Flag pole for BANNER
        if (type === "BANNER") {
            ctx.strokeStyle = "#fff";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(sx, centerY - height);
            ctx.lineTo(sx, centerY - height - 25);
            ctx.stroke();
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.moveTo(sx, centerY - height - 25);
            ctx.lineTo(sx + 12, centerY - height - 20);
            ctx.lineTo(sx, centerY - height - 15);
            ctx.fill();
        }

        // Label
        if (label && showLabels) {
            ctx.fillStyle = "rgba(0,0,0,0.7)";
            ctx.font = "bold 10px sans-serif";
            ctx.textAlign = "center";
            const tw = ctx.measureText(label).width + 8;
            const lx = sx;
            const ly = centerY - height - (type === "BANNER" ? 35 : 10);
            ctx.fillRect(lx - tw / 2, ly - 8, tw, 14);
            ctx.fillStyle = "#fff";
            ctx.fillText(label, lx, ly + 2);
        }
    };

    // Draw loop
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const dpr = window.devicePixelRatio || 1;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.scale(dpr, dpr);
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        // Grid
        if (showGrid) {
            ctx.lineWidth = 0.5;
            ctx.strokeStyle = viewMode === "3D" ? "rgba(56, 189, 248, 0.08)" : "rgba(255, 255, 255, 0.08)";
            ctx.beginPath();

            if (viewMode === "TOP") {
                const startX = (-GRID_SIZE / 2) * TOP_TILE_SIZE;
                const startY = (-GRID_SIZE / 2) * TOP_TILE_SIZE;
                const size = GRID_SIZE * TOP_TILE_SIZE;
                for (let i = 0; i <= GRID_SIZE; i++) {
                    ctx.moveTo(startX + i * TOP_TILE_SIZE, startY);
                    ctx.lineTo(startX + i * TOP_TILE_SIZE, startY + size);
                    ctx.moveTo(startX, startY + i * TOP_TILE_SIZE);
                    ctx.lineTo(startX + size, startY + i * TOP_TILE_SIZE);
                }
            } else {
                for (let x = 0; x <= GRID_SIZE; x++) {
                    const s = toScreen(x, 0);
                    const e = toScreen(x, GRID_SIZE);
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(e.x, e.y);
                }
                for (let y = 0; y <= GRID_SIZE; y++) {
                    const s = toScreen(0, y);
                    const e = toScreen(GRID_SIZE, y);
                    ctx.moveTo(s.x, s.y);
                    ctx.lineTo(e.x, e.y);
                }
            }
            ctx.stroke();

            // 3D ground plane gradient
            if (viewMode === "3D") {
                const c0 = toScreen(0, 0);
                const c1 = toScreen(GRID_SIZE, 0);
                const c2 = toScreen(GRID_SIZE, GRID_SIZE);
                const c3 = toScreen(0, GRID_SIZE);
                ctx.fillStyle = "rgba(15, 23, 42, 0.3)";
                ctx.beginPath();
                ctx.moveTo(c0.x, c0.y);
                ctx.lineTo(c1.x, c1.y);
                ctx.lineTo(c2.x, c2.y);
                ctx.lineTo(c3.x, c3.y);
                ctx.closePath();
                ctx.fill();
            }
        }

        // Hover cursor
        if (hoveredCell && hoveredCell.x >= 0 && hoveredCell.x < GRID_SIZE && hoveredCell.y >= 0 && hoveredCell.y < GRID_SIZE) {
            const pos = toScreen(hoveredCell.x, hoveredCell.y);
            const isPlacement = selectedTool && selectedTool !== "SELECT" && selectedTool !== "PAN";
            ctx.fillStyle = isPlacement ? "rgba(59, 130, 246, 0.4)" : "rgba(255, 255, 255, 0.15)";
            ctx.beginPath();
            if (viewMode === "TOP") {
                ctx.rect(pos.x, pos.y, TOP_TILE_SIZE, TOP_TILE_SIZE);
            } else {
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
                ctx.lineTo(pos.x, pos.y + TILE_HEIGHT);
                ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
            }
            ctx.closePath();
            ctx.fill();
        }

        // Buildings - sorted by depth
        const sorted = [...locations]
            .map((l) => {
                const s = toScreen(l.x, l.y);
                return { ...l, sx: s.x, sy: s.y };
            })
            .sort((a, b) => a.sy - b.sy);

        sorted.forEach((loc) => {
            const team = teams.find((t) => t.name === loc.team);
            const color = team?.color || TYPE_COLORS[loc.type] || "#9ca3af";
            const isSelected = loc.id === selectedLocationId;

            if (viewMode === "TOP") {
                // Top-down squares
                ctx.fillStyle = isSelected ? "#facc15" : color;
                ctx.fillRect(loc.sx + 2, loc.sy + 2, TOP_TILE_SIZE - 4, TOP_TILE_SIZE - 4);
                ctx.strokeStyle = isSelected ? "#facc15" : "rgba(255,255,255,0.2)";
                ctx.lineWidth = 1;
                ctx.strokeRect(loc.sx + 2, loc.sy + 2, TOP_TILE_SIZE - 4, TOP_TILE_SIZE - 4);
                if (showLabels && loc.label) {
                    ctx.fillStyle = "#fff";
                    ctx.font = "8px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText(loc.label.slice(0, 6), loc.sx + TOP_TILE_SIZE / 2, loc.sy + TOP_TILE_SIZE / 2 + 3);
                }
            } else if (viewMode === "3D") {
                draw3DBuilding(ctx, loc.type, loc.sx, loc.sy, color, isSelected, loc.label);
            } else {
                // ISO buildings (original style with improvements)
                const centerY = loc.sy + TILE_HEIGHT / 2;
                const height = TYPE_HEIGHTS[loc.type] || 30;

                // Selection
                if (isSelected) {
                    ctx.fillStyle = "rgba(250, 204, 21, 0.3)";
                    ctx.beginPath();
                    ctx.ellipse(loc.sx, centerY, TILE_WIDTH / 1.8, TILE_HEIGHT / 1.8, 0, 0, Math.PI * 2);
                    ctx.fill();
                }

                // Shadow
                ctx.fillStyle = "rgba(0,0,0,0.4)";
                ctx.beginPath();
                ctx.ellipse(loc.sx, centerY, TILE_WIDTH / 2.5, TILE_HEIGHT / 2.5, 0, 0, Math.PI * 2);
                ctx.fill();

                // Top face
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(loc.sx, centerY - height);
                ctx.lineTo(loc.sx + TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
                ctx.lineTo(loc.sx, centerY - height + TILE_HEIGHT / 1.5);
                ctx.lineTo(loc.sx - TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
                ctx.closePath();
                ctx.fill();
                ctx.strokeStyle = "rgba(255,255,255,0.3)";
                ctx.lineWidth = 0.5;
                ctx.stroke();

                // Right face
                ctx.fillStyle = darkenHex(color, -20);
                ctx.beginPath();
                ctx.moveTo(loc.sx + TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
                ctx.lineTo(loc.sx + TILE_WIDTH / 3, centerY + TILE_HEIGHT / 3);
                ctx.lineTo(loc.sx, centerY + TILE_HEIGHT / 1.5);
                ctx.lineTo(loc.sx, centerY - height + TILE_HEIGHT / 1.5);
                ctx.closePath();
                ctx.fill();

                // Left face
                ctx.fillStyle = darkenHex(color, -40);
                ctx.beginPath();
                ctx.moveTo(loc.sx - TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
                ctx.lineTo(loc.sx - TILE_WIDTH / 3, centerY + TILE_HEIGHT / 3);
                ctx.lineTo(loc.sx, centerY + TILE_HEIGHT / 1.5);
                ctx.lineTo(loc.sx, centerY - height + TILE_HEIGHT / 1.5);
                ctx.closePath();
                ctx.fill();

                // Label
                if (showLabels && loc.label) {
                    ctx.fillStyle = "rgba(0,0,0,0.7)";
                    ctx.font = "bold 10px sans-serif";
                    ctx.textAlign = "center";
                    const tw = ctx.measureText(loc.label).width + 8;
                    ctx.fillRect(loc.sx - tw / 2, centerY - height - 16, tw, 14);
                    ctx.fillStyle = "#fff";
                    ctx.fillText(loc.label, loc.sx, centerY - height - 6);
                }
            }
        });

        ctx.restore();
    }, [offset, scale, hoveredCell, locations, selectedTool, selectedLocationId, viewMode, rotation, showLabels, showGrid, teams]);

    // Animation loop
    useEffect(() => {
        let id: number;
        const render = () => { draw(); id = requestAnimationFrame(render); };
        render();
        return () => cancelAnimationFrame(id);
    }, [draw]);

    // Mouse handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (selectedTool === "PAN" || e.button === 1 || e.button === 2) {
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else {
            const rect = canvasRef.current!.getBoundingClientRect();
            handleGridClick(toGrid(e.clientX - rect.left, e.clientY - rect.top));
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        if (isDragging) {
            setOffset((p) => ({ x: p.x + e.clientX - lastMousePos.x, y: p.y + e.clientY - lastMousePos.y }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else {
            setHoveredCell(toGrid(e.clientX - rect.left, e.clientY - rect.top));
        }
    };

    const handleMouseUp = () => setIsDragging(false);

    const handleWheel = (e: React.WheelEvent) => {
        setScale((s) => Math.max(0.2, Math.min(3, s - e.deltaY * 0.001)));
    };

    const handleGridClick = async (pos: { x: number; y: number }) => {
        if (pos.x < 0 || pos.x >= GRID_SIZE || pos.y < 0 || pos.y >= GRID_SIZE) return;
        const existing = locations.find((l) => l.x === pos.x && l.y === pos.y);

        if (selectedTool === "SELECT" || !selectedTool) {
            setSelectedLocationId(existing?.id || null);
            setEditingLabel(null);
            return;
        }

        if (selectedTool === "PAN") return;

        // Placement
        if (existing) return;

        const tempId = "temp-" + Date.now();
        const newLoc: Location = {
            id: tempId,
            x: pos.x,
            y: pos.y,
            type: selectedTool,
            label: selectedTool,
            description: "",
            createdById: currentUser.id,
            createdBy: { username: currentUser.username, role: currentUser.role },
        };

        const updated = [...locations, newLoc];
        setLocations(updated);
        pushHistory(updated, `Place ${selectedTool}`);
        setIsSaving(true);

        try {
            const fd = new FormData();
            fd.append("x", pos.x.toString());
            fd.append("y", pos.y.toString());
            fd.append("type", selectedTool);
            fd.append("label", selectedTool);
            fd.append("description", "");
            await createMapLocation(fd);
        } catch {
            setLocations((prev) => prev.filter((l) => l.id !== tempId));
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedLocationId) return;
        const id = selectedLocationId;
        const updated = locations.filter((l) => l.id !== id);
        setLocations(updated);
        pushHistory(updated, "Delete structure");
        setSelectedLocationId(null);
        await deleteMapLocation(id);
    };

    // Label editing
    const startEditLabel = () => {
        if (!selectedLocationId) return;
        const loc = locations.find((l) => l.id === selectedLocationId);
        if (!loc) return;
        setEditingLabel(selectedLocationId);
        setEditLabelValue(loc.label || "");
    };

    const saveLabel = () => {
        if (!editingLabel) return;
        const updated = locations.map((l) => (l.id === editingLabel ? { ...l, label: editLabelValue || null } : l));
        setLocations(updated);
        pushHistory(updated, "Edit label");
        setEditingLabel(null);
    };

    // Team assignment
    const assignTeam = (locId: string, teamName: string) => {
        const updated = locations.map((l) => (l.id === locId ? { ...l, team: teamName || undefined } : l));
        setLocations(updated);
        pushHistory(updated, `Assign team ${teamName}`);
    };

    const addTeam = () => {
        if (!newTeamName.trim()) return;
        setTeams((prev) => [...prev, { name: newTeamName.trim(), color: newTeamColor }]);
        setNewTeamName("");
    };

    // Export PNG
    const exportPng = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement("a");
        link.download = "tactical-map.png";
        link.href = canvas.toDataURL("image/png");
        link.click();
    };

    // Export code
    const exportCode = () => {
        const data = {
            locations: locations.map((l) => ({ x: l.x, y: l.y, type: l.type, label: l.label, team: l.team })),
            teams,
        };
        const code = btoa(JSON.stringify(data));
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Sorted city list
    const sortedCities = [...locations].sort((a, b) => {
        if (citySort === "name") return (a.label || "").localeCompare(b.label || "");
        if (citySort === "type") return a.type.localeCompare(b.type);
        if (citySort === "team") return (a.team || "").localeCompare(b.team || "");
        return 0;
    });

    const selectedLoc = locations.find((l) => l.id === selectedLocationId);

    return (
        <div className="flex h-full w-full overflow-hidden">
            {/* Left Toolbar */}
            <div className="w-16 md:w-56 bg-zinc-900/80 backdrop-blur border-r border-white/10 flex flex-col z-10 shrink-0">
                {/* Tools */}
                <div className="p-2 md:p-3 border-b border-white/10">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 hidden md:block">Tools</p>
                    <div className="flex flex-wrap gap-1">
                        <ToolBtn active={selectedTool === "SELECT"} onClick={() => setSelectedTool("SELECT")} icon={MousePointer2} tip="Select" />
                        <ToolBtn active={selectedTool === "PAN"} onClick={() => setSelectedTool("PAN")} icon={Move} tip="Pan" />
                    </div>
                </div>

                {/* Structures */}
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1 mb-1 hidden md:block">Structures</p>
                    {[
                        { type: "HQ", icon: Home, label: "Headquarters", color: "text-amber-400" },
                        { type: "CITY", icon: Castle, label: "Player City", color: "text-blue-400" },
                        { type: "FARM", icon: Box, label: "Farm / Node", color: "text-green-400" },
                        { type: "BANNER", icon: Flag, label: "Banner", color: "text-purple-400" },
                        { type: "TRAP", icon: AlertTriangle, label: "Bear Trap", color: "text-red-400" },
                        { type: "OBSTACLE", icon: Shield, label: "Obstacle", color: "text-zinc-400" },
                    ].map(({ type, icon: Icon, label, color }) => (
                        <button
                            key={type}
                            onClick={() => setSelectedTool(type)}
                            className={`w-full flex items-center gap-2 p-2 rounded-lg transition-all text-left ${
                                selectedTool === type
                                    ? "bg-blue-600/20 border border-blue-500/40 text-white"
                                    : "hover:bg-white/5 text-zinc-400"
                            }`}
                        >
                            <div className={`p-1 rounded bg-black/40 ${color}`}><Icon className="h-4 w-4" /></div>
                            <span className="text-xs font-medium hidden md:block">{label}</span>
                        </button>
                    ))}
                </div>

                {/* Selected Info / Actions */}
                <div className="p-2 md:p-3 border-t border-white/10 bg-black/20 space-y-2">
                    {selectedLoc ? (
                        <>
                            <div className="text-xs text-white">
                                <span className="font-bold">{selectedLoc.label || selectedLoc.type}</span>
                                <span className="block text-zinc-500 text-[10px]">({selectedLoc.x}, {selectedLoc.y}) by {selectedLoc.createdBy.username}</span>
                            </div>
                            {editingLabel === selectedLocationId ? (
                                <div className="flex gap-1">
                                    <input
                                        value={editLabelValue}
                                        onChange={(e) => setEditLabelValue(e.target.value)}
                                        onKeyDown={(e) => e.key === "Enter" && saveLabel()}
                                        autoFocus
                                        className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-[#38bdf8]/50"
                                    />
                                    <button onClick={saveLabel} className="p-1 bg-blue-600 rounded text-white"><Check className="h-3 w-3" /></button>
                                </div>
                            ) : (
                                <button onClick={startEditLabel} className="w-full flex items-center gap-1 text-[10px] text-zinc-400 hover:text-white p-1 rounded hover:bg-white/5">
                                    <Edit3 className="h-3 w-3" /> <span className="hidden md:inline">Edit Label</span>
                                </button>
                            )}
                            {/* Team assign */}
                            <select
                                value={selectedLoc.team || ""}
                                onChange={(e) => assignTeam(selectedLocationId!, e.target.value)}
                                className="w-full bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white focus:outline-none"
                            >
                                <option value="">No Team</option>
                                {teams.map((t) => <option key={t.name} value={t.name}>{t.name}</option>)}
                            </select>
                            <button onClick={handleDelete} className="w-full flex items-center justify-center gap-1 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white p-1.5 rounded text-xs transition-colors">
                                <Trash2 className="h-3 w-3" /> <span className="hidden md:inline">Delete</span>
                            </button>
                        </>
                    ) : (
                        <p className="text-zinc-600 text-[10px] text-center hidden md:block">Select a structure to edit</p>
                    )}
                </div>
            </div>

            {/* Canvas */}
            <div className="flex-1 relative overflow-hidden cursor-crosshair" ref={containerRef}
                 style={{ background: viewMode === "3D"
                     ? "linear-gradient(180deg, #0c1929 0%, #1a1040 50%, #0f172a 100%)"
                     : "linear-gradient(to bottom right, #1e1b4b, #0f172a)" }}>
                <canvas
                    ref={canvasRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onContextMenu={(e) => e.preventDefault()}
                    className="touch-none"
                />

                {/* Top-right controls */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="bg-zinc-900/90 backdrop-blur border border-white/10 rounded-lg p-1 flex flex-col shadow-xl">
                        <OverlayBtn onClick={() => setViewMode("ISO")} active={viewMode === "ISO"} icon={LayoutGrid} tip="Isometric" />
                        <OverlayBtn onClick={() => setViewMode("TOP")} active={viewMode === "TOP"} icon={Eye} tip="Top-Down" />
                        <OverlayBtn onClick={() => setViewMode("3D")} active={viewMode === "3D"} icon={Cuboid} tip="3D View" />
                        <div className="h-px bg-white/10 my-1" />
                        <OverlayBtn onClick={() => setRotation((r) => (r + 90) % 360)} icon={Rotate3D} tip={`Rotate (${rotation}°)`} />
                        <OverlayBtn onClick={() => setShowLabels((v) => !v)} active={showLabels} icon={showLabels ? Eye : EyeOff} tip="Labels" />
                        <OverlayBtn onClick={() => setShowGrid((v) => !v)} active={showGrid} icon={LayoutGrid} tip="Grid" />
                        <div className="h-px bg-white/10 my-1" />
                        <OverlayBtn onClick={() => setScale((s) => Math.min(3, s + 0.2))} icon={Plus} tip="Zoom In" />
                        <OverlayBtn onClick={() => setScale((s) => Math.max(0.2, s - 0.2))} icon={Minus} tip="Zoom Out" />
                    </div>

                    {/* Action buttons */}
                    <div className="bg-zinc-900/90 backdrop-blur border border-white/10 rounded-lg p-1 flex flex-col shadow-xl">
                        <OverlayBtn onClick={undo} icon={Undo2} tip="Undo" disabled={historyIndex <= 0} />
                        <OverlayBtn onClick={redo} icon={Redo2} tip="Redo" disabled={historyIndex >= history.length - 1} />
                        <div className="h-px bg-white/10 my-1" />
                        <OverlayBtn onClick={exportPng} icon={Download} tip="Export PNG" />
                        <OverlayBtn onClick={exportCode} icon={copied ? Check : Copy} tip={copied ? "Copied!" : "Copy Code"} />
                    </div>
                </div>

                {/* Bottom-right: city list + teams toggle */}
                <div className="absolute bottom-4 right-4 flex gap-2">
                    <button onClick={() => setShowCityList((v) => !v)} className="bg-zinc-900/90 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 shadow-xl">
                        <List className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Structures</span> <span className="text-zinc-600">{locations.length}</span>
                    </button>
                    <button onClick={() => setShowTeamPanel((v) => !v)} className="bg-zinc-900/90 backdrop-blur border border-white/10 rounded-lg px-3 py-2 text-xs text-zinc-400 hover:text-white flex items-center gap-1.5 shadow-xl">
                        <Palette className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Teams</span>
                    </button>
                </div>

                {/* Status bar */}
                <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur px-3 py-1.5 rounded text-[10px] text-zinc-400 font-mono flex items-center gap-3">
                    {hoveredCell ? `X:${hoveredCell.x} Y:${hoveredCell.y}` : "---"}
                    <span className="text-zinc-600">|</span>
                    <span>{viewMode}</span>
                    <span className="text-zinc-600">|</span>
                    <span>ROT:{rotation}°</span>
                    <span className="text-zinc-600">|</span>
                    <span>{Math.round(scale * 100)}%</span>
                    {isSaving && <span className="text-blue-400 animate-pulse ml-2">SAVING</span>}
                </div>

                {/* City List Panel */}
                {showCityList && (
                    <div className="absolute top-4 left-4 w-72 max-h-[60vh] bg-zinc-900/95 backdrop-blur border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <List className="h-4 w-4 text-[#38bdf8]" /> Structures ({locations.length})
                            </h3>
                            <button onClick={() => setShowCityList(false)} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="px-3 py-2 border-b border-white/10 flex gap-1">
                            {(["name", "type", "team"] as const).map((s) => (
                                <button key={s} onClick={() => setCitySort(s)}
                                    className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${citySort === s ? "bg-[#38bdf8]/20 text-[#38bdf8]" : "text-zinc-500 hover:text-white"}`}>
                                    {s}
                                </button>
                            ))}
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {sortedCities.map((loc) => {
                                const team = teams.find((t) => t.name === loc.team);
                                return (
                                    <button
                                        key={loc.id}
                                        onClick={() => { setSelectedLocationId(loc.id); setShowCityList(false); }}
                                        className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-colors ${
                                            selectedLocationId === loc.id ? "bg-[#38bdf8]/10 border border-[#38bdf8]/20" : "hover:bg-white/5"
                                        }`}
                                    >
                                        <div className="w-3 h-3 rounded-sm shrink-0" style={{ background: team?.color || TYPE_COLORS[loc.type] || "#666" }} />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs text-white truncate">{loc.label || loc.type}</p>
                                            <p className="text-[10px] text-zinc-500">{loc.type} &bull; ({loc.x},{loc.y}){loc.team ? ` &bull; ${loc.team}` : ""}</p>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Team Panel */}
                {showTeamPanel && (
                    <div className="absolute top-4 left-4 w-64 bg-zinc-900/95 backdrop-blur border border-white/10 rounded-xl shadow-2xl overflow-hidden">
                        <div className="p-3 border-b border-white/10 flex items-center justify-between">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Palette className="h-4 w-4 text-[#38bdf8]" /> Teams
                            </h3>
                            <button onClick={() => setShowTeamPanel(false)} className="text-zinc-500 hover:text-white"><X className="h-4 w-4" /></button>
                        </div>
                        <div className="p-3 space-y-2">
                            {teams.map((t) => (
                                <div key={t.name} className="flex items-center gap-2 p-2 rounded-lg bg-white/5">
                                    <div className="w-4 h-4 rounded" style={{ background: t.color }} />
                                    <span className="text-xs text-white flex-1">{t.name}</span>
                                    <span className="text-[10px] text-zinc-500">{locations.filter((l) => l.team === t.name).length}</span>
                                </div>
                            ))}
                            <div className="flex gap-1 mt-2">
                                <input
                                    value={newTeamName}
                                    onChange={(e) => setNewTeamName(e.target.value)}
                                    placeholder="Team name"
                                    className="flex-1 bg-black/50 border border-white/10 rounded px-2 py-1 text-xs text-white placeholder-zinc-600 focus:outline-none"
                                    onKeyDown={(e) => e.key === "Enter" && addTeam()}
                                />
                                <input type="color" value={newTeamColor} onChange={(e) => setNewTeamColor(e.target.value)} className="w-8 h-7 rounded border-0 bg-transparent cursor-pointer" />
                                <button onClick={addTeam} className="p-1 bg-blue-600 rounded text-white"><Plus className="h-3 w-3" /></button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ToolBtn({ active, onClick, icon: Icon, tip }: { active?: boolean; onClick: () => void; icon: any; tip: string }) {
    return (
        <button onClick={onClick} title={tip}
            className={`p-2 rounded transition-colors ${active ? "bg-blue-600 text-white" : "text-zinc-400 hover:bg-white/10 hover:text-white"}`}>
            <Icon className="h-4 w-4" />
        </button>
    );
}

function OverlayBtn({ onClick, icon: Icon, tip, active, disabled }: { onClick: () => void; icon: any; tip: string; active?: boolean; disabled?: boolean }) {
    return (
        <button onClick={onClick} title={tip} disabled={disabled}
            className={`p-2 rounded transition-colors relative group ${
                disabled ? "opacity-30 cursor-not-allowed" : active ? "bg-blue-600/30 text-[#38bdf8]" : "text-zinc-400 hover:bg-white/10 hover:text-white"
            }`}>
            <Icon className="h-4 w-4" />
            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-black/90 px-2 py-1 text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none">
                {tip}
            </span>
        </button>
    );
}

"use client";

import { createMapLocation, deleteMapLocation } from "@/app/actions/map";
import { useState, useRef, useEffect, useCallback } from "react";
import {
    MapPin, Trash2, X, Plus, Minus, Move, MousePointer2,
    Home, Castle, AlertTriangle, Shield, Flag, Box, Undo2, Redo2,
    Save, LayoutGrid
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
}

interface Props {
    locations: Location[];
    currentUser: any;
}

// Isometric Constants
const TILE_WIDTH = 100;
const TILE_HEIGHT = 50; // 2:1 ratio for standard isometric
const TOP_TILE_SIZE = 40; // Size for top-down view
const GRID_SIZE = 50; // 50x50 grid

export function InteractiveMap({ locations: initialLocations, currentUser }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // State
    const [locations, setLocations] = useState<Location[]>(initialLocations);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [selectedTool, setSelectedTool] = useState<string | null>(null);
    const [hoveredCell, setHoveredCell] = useState<{ x: number, y: number } | null>(null);
    const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // View State
    const [viewMode, setViewMode] = useState<'ISO' | 'TOP'>('ISO');
    const [rotation, setRotation] = useState(0); // 0, 90, 180, 270

    // Initial Center
    useEffect(() => {
        if (containerRef.current) {
            centerMap();
        }
    }, [viewMode, rotation]);

    const centerMap = () => {
        if (!containerRef.current) return;
        const { width, height } = containerRef.current.getBoundingClientRect();
        setOffset({ x: width / 2, y: height / 4 });
    };

    // --- COORDINATE SYSTEMS ---

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

    // Grid -> Screen
    const toScreen = (gridX: number, gridY: number) => {
        const { x, y } = rotatePoint(gridX, gridY);

        if (viewMode === 'TOP') {
            return {
                x: (x - GRID_SIZE / 2) * TOP_TILE_SIZE,
                y: (y - GRID_SIZE / 2) * TOP_TILE_SIZE
            };
        } else {
            // Isometric
            return {
                x: (x - y) * TILE_WIDTH / 2,
                y: (x + y) * TILE_HEIGHT / 2
            };
        }
    };

    // Screen -> Grid
    const toGrid = (screenX: number, screenY: number) => {
        const adjX = screenX - offset.x;
        const adjY = screenY - offset.y;

        const scaledTW = (viewMode === 'TOP' ? TOP_TILE_SIZE : TILE_WIDTH) * scale;
        const scaledTH = (viewMode === 'TOP' ? TOP_TILE_SIZE : TILE_HEIGHT) * scale;

        let rx = 0, ry = 0;

        if (viewMode === 'TOP') {
            rx = Math.floor(adjX / (TOP_TILE_SIZE * scale) + GRID_SIZE / 2);
            ry = Math.floor(adjY / (TOP_TILE_SIZE * scale) + GRID_SIZE / 2);
        } else {
            // Iso Inverse
            rx = Math.floor((adjX / (scaledTW / 2) + adjY / (scaledTH / 2)) / 2);
            ry = Math.floor((adjY / (scaledTH / 2) - adjX / (scaledTW / 2)) / 2);
        }

        return unrotatePoint(rx, ry);
    };

    // Draw Loop
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.save();
        // Global Transform
        ctx.translate(offset.x, offset.y);
        ctx.scale(scale, scale);

        // 1. Draw Grid
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
        ctx.beginPath();

        if (viewMode === 'TOP') {
            // Simple Square Grid - Draw Rotated Space to match visual orientation
            const startX = -GRID_SIZE / 2 * TOP_TILE_SIZE;
            const startY = -GRID_SIZE / 2 * TOP_TILE_SIZE;
            const size = GRID_SIZE * TOP_TILE_SIZE;

            for (let i = 0; i <= GRID_SIZE; i++) {
                // Vertical
                ctx.moveTo(startX + i * TOP_TILE_SIZE, startY);
                ctx.lineTo(startX + i * TOP_TILE_SIZE, startY + size);
                // Horizontal
                ctx.moveTo(startX, startY + i * TOP_TILE_SIZE);
                ctx.lineTo(startX + size, startY + i * TOP_TILE_SIZE);
            }

        } else {
            // ISO Grid
            for (let x = 0; x <= GRID_SIZE; x++) {
                const start = toScreen(x, 0);
                const end = toScreen(x, GRID_SIZE);
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
            }
            for (let y = 0; y <= GRID_SIZE; y++) {
                const start = toScreen(0, y);
                const end = toScreen(GRID_SIZE, y);
                ctx.moveTo(start.x, start.y);
                ctx.lineTo(end.x, end.y);
            }
        }
        ctx.stroke();

        // 2. Draw Hover Cursor
        if (hoveredCell && hoveredCell.x >= 0 && hoveredCell.x < GRID_SIZE && hoveredCell.y >= 0 && hoveredCell.y < GRID_SIZE) {
            const pos = toScreen(hoveredCell.x, hoveredCell.y);

            ctx.fillStyle = selectedTool && selectedTool !== 'SELECT' && selectedTool !== 'PAN'
                ? "rgba(59, 130, 246, 0.5)" // Blue for placement
                : "rgba(255, 255, 255, 0.2)"; // White for select

            ctx.beginPath();

            if (viewMode === 'TOP') {
                ctx.rect(pos.x, pos.y, TOP_TILE_SIZE, TOP_TILE_SIZE);
            } else {
                ctx.moveTo(pos.x, pos.y);
                ctx.lineTo(pos.x + TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
                ctx.lineTo(pos.x, pos.y + TILE_HEIGHT);
                ctx.lineTo(pos.x - TILE_WIDTH / 2, pos.y + TILE_HEIGHT / 2);
            }
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = selectedTool && selectedTool !== 'SELECT' && selectedTool !== 'PAN' ? "#3b82f6" : "#ffffff";
            ctx.stroke();
        }

        // 3. Draw Buildings
        // Sort by screened Y for depth! 
        const sortedLocs = [...locations].map(l => {
            const s = toScreen(l.x, l.y);
            return { ...l, screenX: s.x, screenY: s.y };
        }).sort((a, b) => a.screenY - b.screenY);

        sortedLocs.forEach(loc => {
            // Selection Highlight
            if (loc.id === selectedLocationId) {
                ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
                ctx.beginPath();
                if (viewMode === 'TOP') {
                    ctx.rect(loc.screenX, loc.screenY, TOP_TILE_SIZE, TOP_TILE_SIZE);
                } else {
                    ctx.ellipse(loc.screenX, loc.screenY + TILE_HEIGHT / 2, TILE_WIDTH / 1.8, TILE_HEIGHT / 1.8, 0, 0, 2 * Math.PI);
                }
                ctx.fill();
            }

            renderBuilding(ctx, loc.type, loc.screenX, loc.screenY);
        });

        ctx.restore();
    }, [offset, scale, hoveredCell, locations, selectedTool, selectedLocationId, viewMode, rotation]);

    // Building Renderer Helper
    const renderBuilding = (ctx: CanvasRenderingContext2D, type: string, x: number, y: number) => {
        let color = "#9ca3af";
        let height = 40;

        switch (type) {
            case 'HQ': color = "#f59e0b"; height = 60; break;
            case 'CITY': color = "#3b82f6"; height = 40; break;
            case 'TRAP': color = "#ef4444"; height = 30; break;
            case 'FARM': color = "#10b981"; height = 20; break;
            case 'BANNER': color = "#8b5cf6"; height = 50; break;
        }

        if (viewMode === 'TOP') {
            // Top Down = Simple Square
            ctx.fillStyle = color;
            ctx.fillRect(x + 2, y + 2, TOP_TILE_SIZE - 4, TOP_TILE_SIZE - 4);

            // Icon or Marker
            ctx.fillStyle = "rgba(0,0,0,0.2)";
            ctx.font = "10px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(type[0], x + TOP_TILE_SIZE / 2, y + TOP_TILE_SIZE / 2 + 3);
            return;
        }

        // ISOMETRIC RENDER
        const centerY = y + TILE_HEIGHT / 2;

        // Shadow
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.beginPath();
        ctx.ellipse(x, centerY, TILE_WIDTH / 2.5, TILE_HEIGHT / 2.5, 0, 0, 2 * Math.PI);
        ctx.fill();

        // Building Body
        ctx.fillStyle = color;
        // Top Face
        ctx.beginPath();
        ctx.moveTo(x, centerY - height);
        ctx.lineTo(x + TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
        ctx.lineTo(x, centerY - height + TILE_HEIGHT / 1.5);
        ctx.lineTo(x - TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.3)";
        ctx.stroke();

        // Right Face
        ctx.fillStyle = adjustColor(color, -20);
        ctx.beginPath();
        ctx.moveTo(x + TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
        ctx.lineTo(x + TILE_WIDTH / 3, centerY + TILE_HEIGHT / 3);
        ctx.lineTo(x, centerY + TILE_HEIGHT / 1.5);
        ctx.lineTo(x, centerY - height + TILE_HEIGHT / 1.5);
        ctx.closePath();
        ctx.fill();

        // Left Face
        ctx.fillStyle = adjustColor(color, -40);
        ctx.beginPath();
        ctx.moveTo(x - TILE_WIDTH / 3, centerY - height + TILE_HEIGHT / 3);
        ctx.lineTo(x - TILE_WIDTH / 3, centerY + TILE_HEIGHT / 3);
        ctx.lineTo(x, centerY + TILE_HEIGHT / 1.5);
        ctx.lineTo(x, centerY - height + TILE_HEIGHT / 1.5);
        ctx.closePath();
        ctx.fill();
    };

    // Helper to darken colors for primitive shading
    const adjustColor = (color: string, amount: number) => {
        return color; // Simplified for now
    };

    useEffect(() => {
        let animationFrameId: number;

        const render = () => {
            draw();
            animationFrameId = requestAnimationFrame(render);
        };
        render();

        return () => cancelAnimationFrame(animationFrameId);
    }, [draw]);


    // Event Handlers
    const handleMouseDown = (e: React.MouseEvent) => {
        if (selectedTool === 'PAN' || e.button === 1 || e.button === 2) {
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else {
            const rect = canvasRef.current!.getBoundingClientRect();
            const gridPos = toGrid(e.clientX - rect.left, e.clientY - rect.top);
            handleGridClick(gridPos.x, gridPos.y);
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();

        if (isDragging) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
            setLastMousePos({ x: e.clientX, y: e.clientY });
        } else {
            // Update hover
            const gridPos = toGrid(e.clientX - rect.left, e.clientY - rect.top);
            setHoveredCell(gridPos);
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        const newScale = Math.max(0.2, Math.min(3, scale - e.deltaY * 0.001));
        setScale(newScale);
    };

    const handleGridClick = async (x: number, y: number) => {
        // Bounds check
        if (x < 0 || x > GRID_SIZE || y < 0 || y > GRID_SIZE) return;

        // Check if Occupied
        const existing = locations.find(l => l.x === x && l.y === y);

        if (selectedTool === 'SELECT' || !selectedTool) {
            if (existing) {
                setSelectedLocationId(existing.id);
            } else {
                setSelectedLocationId(null);
            }
            return;
        }

        // Placement
        if (selectedTool && selectedTool !== 'PAN' && selectedTool !== 'SELECT') {
            if (existing) {
                alert("Space occupied!");
                return;
            }

            // Create Optimistic
            const tempId = "temp-" + Date.now();
            const newLoc: Location = {
                id: tempId,
                x, y,
                type: selectedTool,
                label: "New " + selectedTool,
                description: "",
                createdById: currentUser.id,
                createdBy: { username: currentUser.username, role: currentUser.role }
            };

            setLocations(prev => [...prev, newLoc]);
            setIsSaving(true);

            try {
                // Server Action
                const formData = new FormData();
                formData.append("x", x.toString());
                formData.append("y", y.toString());
                formData.append("type", selectedTool);
                formData.append("label", "New Placement");
                formData.append("description", "Planned structure");

                await createMapLocation(formData);
            } catch (e) {
                console.error(e);
                setLocations(prev => prev.filter(l => l.id !== tempId));
                alert("Failed to save placement");
            } finally {
                setIsSaving(false);
            }
        }
    };

    const handleDelete = async () => {
        if (!selectedLocationId) return;
        if (!confirm("Delete selected structure?")) return;

        const id = selectedLocationId;
        setLocations(prev => prev.filter(l => l.id !== id));
        setSelectedLocationId(null);
        await deleteMapLocation(id);
    };

    const rotateMap = () => {
        setRotation(prev => (prev + 90) % 360);
    };


    return (
        <div className="flex h-full w-full bg-[#1a1b26] overflow-hidden">
            {/* Sidebar Controls */}
            <div className="w-20 md:w-64 bg-zinc-900 border-r border-white/10 flex flex-col z-10 shrink-0">
                <div className="p-4 border-b border-white/10">
                    <h2 className="font-bold text-white hidden md:block">Toolbox</h2>
                    <div className="flex gap-2 mt-2">
                        <button
                            onClick={() => setSelectedTool('SELECT')}
                            className={`p-2 rounded hover:bg-white/10 ${selectedTool === 'SELECT' ? 'bg-blue-600' : 'text-zinc-400'}`}
                            title="Select"
                        >
                            <MousePointer2 className="h-5 w-5" />
                        </button>
                        <button
                            onClick={() => setSelectedTool('PAN')}
                            className={`p-2 rounded hover:bg-white/10 ${selectedTool === 'PAN' ? 'bg-blue-600' : 'text-zinc-400'}`}
                            title="Pan"
                        >
                            <Move className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    <p className="text-xs font-bold text-zinc-500 uppercase px-2 mb-2 hidden md:block">Structures</p>

                    <ToolButton
                        active={selectedTool === 'HQ'}
                        onClick={() => setSelectedTool('HQ')}
                        icon={Home}
                        label="Headquarters"
                        color="text-amber-400"
                    />
                    <ToolButton
                        active={selectedTool === 'CITY'}
                        onClick={() => setSelectedTool('CITY')}
                        icon={Castle}
                        label="Player City"
                        color="text-blue-400"
                    />
                    <ToolButton
                        active={selectedTool === 'FARM'}
                        onClick={() => setSelectedTool('FARM')}
                        icon={Box}
                        label="Farm / Node"
                        color="text-green-400"
                    />
                    <ToolButton
                        active={selectedTool === 'BANNER'}
                        onClick={() => setSelectedTool('BANNER')}
                        icon={Flag}
                        label="Banner"
                        color="text-purple-400"
                    />
                    <ToolButton
                        active={selectedTool === 'TRAP'}
                        onClick={() => setSelectedTool('TRAP')}
                        icon={AlertTriangle}
                        label="Bear Trap"
                        color="text-red-400"
                    />
                </div>

                <div className="p-4 border-t border-white/10 bg-black/20">

                    {selectedLocationId ? (
                        <div className="space-y-4">
                            <div className="text-white text-sm">
                                <span className="font-bold">Selected:</span> <br />
                                <span className="text-xs text-zinc-400">ID: {selectedLocationId.slice(0, 8)}</span>
                            </div>
                            <button
                                onClick={handleDelete}
                                className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white p-2 rounded transition-colors"
                            >
                                <Trash2 className="h-4 w-4" /> <span className="hidden md:inline">Delete</span>
                            </button>
                        </div>
                    ) : (
                        <div className="text-zinc-500 text-xs text-center hidden md:block">
                            Select an object to edit
                        </div>
                    )}
                </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative bg-[#0f1115] overflow-hidden cursor-crosshair" ref={containerRef}>
                <canvas
                    ref={canvasRef}
                    width={2000}
                    height={1500}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onWheel={handleWheel}
                    onContextMenu={(e) => e.preventDefault()}
                    className="touch-none"
                    style={{ background: 'linear-gradient(to bottom right, #1e1b4b, #0f172a)' }}
                />

                {/* Overlay UI (Zoom & Camera Controls) */}
                <div className="absolute top-4 right-4 flex flex-col gap-2">
                    <div className="bg-zinc-900 border border-white/10 rounded-lg p-1 flex flex-col shadow-xl">
                        <button onClick={rotateMap} className="p-2 hover:bg-white/10 text-white rounded relative group">
                            <Redo2 className="h-4 w-4" />
                            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">Rotate 90°</span>
                        </button>
                        <button onClick={() => setViewMode(v => v === 'ISO' ? 'TOP' : 'ISO')} className="p-2 hover:bg-white/10 text-white rounded relative group">
                            <LayoutGrid className="h-4 w-4" />
                            <span className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-black px-2 py-1 text-xs rounded opacity-0 group-hover:opacity-100 whitespace-nowrap">
                                {viewMode === 'ISO' ? 'Top View' : 'Iso View'}
                            </span>
                        </button>

                        <div className="h-px bg-white/10 my-1" />

                        <button onClick={() => setScale(s => Math.min(3, s + 0.2))} className="p-2 hover:bg-white/10 text-white rounded"><Plus className="h-4 w-4" /></button>
                        <button onClick={() => setScale(s => Math.max(0.2, s - 0.2))} className="p-2 hover:bg-white/10 text-white rounded"><Minus className="h-4 w-4" /></button>
                    </div>
                </div>

                <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur px-3 py-1 rounded text-xs text-zinc-400 font-mono">
                    {hoveredCell ? `GRID: X:${hoveredCell.x} Y:${hoveredCell.y}` : "OUT OF BOUNDS"}
                    {isSaving && <span className="ml-2 text-blue-400 animate-pulse">SAVING...</span>}
                    <span className="ml-4 text-zinc-500">ROT: {rotation}° | VIEW: {viewMode}</span>
                </div>
            </div>
        </div>
    );
}

function ToolButton({ active, onClick, icon: Icon, label, color }: any) {
    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${active ? 'bg-blue-600/20 border border-blue-500/50 text-white' : 'hover:bg-white/5 text-zinc-400 hover:text-white'
                }`}
        >
            <div className={`p-1.5 rounded bg-black/40 ${color}`}>
                <Icon className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium hidden md:block">{label}</span>
        </button>
    );
}

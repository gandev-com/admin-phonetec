"use client";

import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Public handle ────────────────────────────────────────────────────────────

export interface SignaturePadHandle {
  toFile: (filename?: string) => File | null;
  toDataUrl: () => string | null;
  isEmpty: () => boolean;
  clear: () => void;
}

// ─── Internal types ───────────────────────────────────────────────────────────

interface Point {
  x: number;
  y: number;
  pressure: number;
}

interface Stroke {
  points: Point[];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface SignaturePadProps {
  className?: string;
  height?: number;
  disabled?: boolean;
  onChange?: (isEmpty: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const SignaturePad = forwardRef<SignaturePadHandle, SignaturePadProps>(
  function SignaturePad({ className, height = 180, disabled = false, onChange }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const strokesRef = useRef<Stroke[]>([]);
    const currentStrokeRef = useRef<Point[]>([]);
    const isDrawingRef = useRef(false);
    const [empty, setEmpty] = useState(true);

    // ── Redraw all stored strokes ──────────────────────────────────────────────

    const redraw = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      for (const stroke of strokesRef.current) {
        drawStroke(ctx, stroke);
      }
    }, []);

    // ── DPR-aware resize ───────────────────────────────────────────────────────

    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      function resize() {
        if (!canvas) return;
        const dpr = window.devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * dpr);
        canvas.height = Math.floor(rect.height * dpr);
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
          redraw();
        }
      }

      const ro = new ResizeObserver(resize);
      ro.observe(canvas);
      resize();
      return () => ro.disconnect();
    }, [redraw]);

    // ── Pointer helpers ────────────────────────────────────────────────────────

    function getPoint(e: React.PointerEvent<HTMLCanvasElement>): Point {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        // Normalize pressure: stylus gives 0-1, mouse/finger defaults to 0.5
        pressure: e.pressure > 0 ? e.pressure : 0.5,
      };
    }

    function handlePointerDown(e: React.PointerEvent<HTMLCanvasElement>) {
      if (disabled) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      isDrawingRef.current = true;
      currentStrokeRef.current = [getPoint(e)];
    }

    function handlePointerMove(e: React.PointerEvent<HTMLCanvasElement>) {
      if (!isDrawingRef.current || disabled) return;
      const point = getPoint(e);
      currentStrokeRef.current.push(point);

      // Incremental draw for responsiveness
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      const pts = currentStrokeRef.current;
      if (pts.length < 2) return;
      const seg: Stroke = { points: pts.slice(-2) };
      drawStroke(ctx, seg);
    }

    function handlePointerUp() {
      if (!isDrawingRef.current) return;
      isDrawingRef.current = false;
      if (currentStrokeRef.current.length >= 2) {
        strokesRef.current.push({ points: [...currentStrokeRef.current] });
        setEmpty(false);
        onChange?.(false);
      } else if (currentStrokeRef.current.length === 1) {
        // Single tap — draw a dot
        const p = currentStrokeRef.current[0];
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext("2d");
        if (ctx) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
          ctx.fillStyle = "#111827";
          ctx.fill();
        }
        strokesRef.current.push({ points: [p, { ...p, x: p.x + 0.1 }] });
        setEmpty(false);
        onChange?.(false);
      }
      currentStrokeRef.current = [];
    }

    function handleClear() {
      strokesRef.current = [];
      currentStrokeRef.current = [];
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        const dpr = window.devicePixelRatio || 1;
        ctx?.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);
      }
      setEmpty(true);
      onChange?.(true);
    }

    function handleUndo() {
      strokesRef.current.pop();
      const isEmpty = strokesRef.current.length === 0;
      setEmpty(isEmpty);
      onChange?.(isEmpty);
      redraw();
    }

    // ── Export signature as File ───────────────────────────────────────────────

    function toFile(filename = "firma.png"): File | null {
      const canvas = canvasRef.current;
      if (!canvas || strokesRef.current.length === 0) return null;

      const rect = canvas.getBoundingClientRect();
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.floor(rect.width);
      exportCanvas.height = Math.floor(rect.height);
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

      for (const stroke of strokesRef.current) {
        drawStroke(ctx, stroke);
      }

      const dataURL = exportCanvas.toDataURL("image/png");
      const [header, data] = dataURL.split(",");
      const mime = header.match(/:(.*?);/)![1];
      const binary = atob(data);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return new File([bytes], filename, { type: mime });
    }

    // ── Export signature as data URL ─────────────────────────────────────────

    function toDataUrl(): string | null {
      const canvas = canvasRef.current;
      if (!canvas || strokesRef.current.length === 0) return null;

      const rect = canvas.getBoundingClientRect();
      const exportCanvas = document.createElement("canvas");
      exportCanvas.width = Math.floor(rect.width);
      exportCanvas.height = Math.floor(rect.height);
      const ctx = exportCanvas.getContext("2d");
      if (!ctx) return null;

      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);
      for (const stroke of strokesRef.current) {
        drawStroke(ctx, stroke);
      }
      return exportCanvas.toDataURL("image/png");
    }

    // ── Exposed handle ─────────────────────────────────────────────────────────

    useImperativeHandle(ref, () => ({
      toFile,
      toDataUrl,
      isEmpty: () => strokesRef.current.length === 0,
      clear: handleClear,
    }));

    return (
      <div className={cn("space-y-2", className)}>
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border-2 border-dashed transition-colors",
            disabled
              ? "border-border bg-muted/30 opacity-60"
              : "border-border bg-white hover:border-primary/40 focus-within:border-primary/60",
          )}
        >
          <canvas
            ref={canvasRef}
            style={{ height, display: "block", width: "100%" }}
            className={cn("touch-none", disabled ? "cursor-not-allowed" : "cursor-crosshair")}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
            onPointerCancel={handlePointerUp}
          />
          {empty && !disabled && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <p className="select-none text-sm text-muted-foreground">
                Firme aquí con el lápiz o el dedo
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={empty || disabled}
            onClick={handleUndo}
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Deshacer
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={empty || disabled}
            onClick={handleClear}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </Button>
        </div>
      </div>
    );
  },
);

// ─── Draw helper (shared between incremental and full redraw) ─────────────────

function drawStroke(ctx: CanvasRenderingContext2D, stroke: Stroke) {
  const { points } = stroke;
  if (points.length < 2) return;

  ctx.strokeStyle = "#111827";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];
    // Vary line width with stylus pressure (1.5–4px range)
    ctx.lineWidth = 1.5 + p0.pressure * 2.5;
    ctx.beginPath();
    ctx.moveTo(p0.x, p0.y);
    ctx.lineTo(p1.x, p1.y);
    ctx.stroke();
  }
}

import { useEffect, useRef } from 'react';
import { useTheme } from '@/context/ThemeContext';

type Point = { x: number; y: number };

const CITIES = [
  { name: 'London',    lat: 51.5,  lon: -0.1,   hub: true  },
  { name: 'New York',  lat: 40.7,  lon: -74.0              },
  { name: 'Toronto',   lat: 43.7,  lon: -79.4              },
  { name: 'São Paulo', lat: -23.5, lon: -46.6              },
  { name: 'Paris',     lat: 48.8,  lon: 2.3                },
  { name: 'Berlin',    lat: 52.5,  lon: 13.4               },
  { name: 'Lagos',     lat: 6.5,   lon: 3.4                },
  { name: 'Dubai',     lat: 25.2,  lon: 55.3               },
  { name: 'Mumbai',    lat: 19.1,  lon: 72.9               },
  { name: 'Singapore', lat: 1.3,   lon: 103.8              },
  { name: 'Tokyo',     lat: 35.7,  lon: 139.7              },
  { name: 'Sydney',    lat: -33.9, lon: 151.2              },
];

function project(lat: number, lon: number, cx: number, cy: number, R: number): Point {
  return {
    x: cx + (lon / 165) * R,
    y: cy - (lat / 72)  * R,
  };
}

function controlPoint(a: Point, b: Point): Point {
  const mx   = (a.x + b.x) / 2;
  const my   = (a.y + b.y) / 2;
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return { x: mx, y: my - dist * 0.28 };
}

function bezier(t: number, p0: Point, p1: Point, p2: Point): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme }  = useTheme();
  const rafRef    = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    const [h, s, l] = isDark ? [185, 100, 50] : [185, 100, 38];
    const p   = (a: number) => `hsla(${h},${s}%,${l}%,${a})`;
    const grid = isDark ? 'rgba(255,255,255,0.038)' : 'rgba(0,0,0,0.048)';
    const arc  = isDark ? 'rgba(255,255,255,0.065)' : 'rgba(0,0,0,0.055)';

    const dpr = window.devicePixelRatio || 1;

    function resize() {
      if (!canvas) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      canvas.width  = W * dpr;
      canvas.height = H * dpr;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const londonIdx = CITIES.findIndex(c => c.hub);

    const packets = CITIES
      .map((_, i) =>
        CITIES[i].hub
          ? null
          : { i, t: Math.random(), speed: 0.0013 + Math.random() * 0.0009, fwd: Math.random() < 0.5 }
      )
      .filter(Boolean) as { i: number; t: number; speed: number; fwd: boolean }[];

    function draw() {
      if (!ctx || !canvas) return;

      const W  = canvas.offsetWidth;
      const H  = canvas.offsetHeight;
      const cx = W / 2;
      const cy = H / 2;
      const R  = Math.min(W, H) * 0.38;

      ctx.clearRect(0, 0, W, H);

      const pts    = CITIES.map(c => project(c.lat, c.lon, cx, cy, R));
      const london = pts[londonIdx];

      // Globe outline
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = grid;
      ctx.lineWidth   = 1;
      ctx.stroke();

      // Latitude grid lines
      ctx.lineWidth   = 0.5;
      ctx.strokeStyle = grid;
      for (const lat of [-60, -30, 30, 60]) {
        const y  = cy - (lat / 72) * R;
        const dx = Math.sqrt(Math.max(0, R * R - (y - cy) ** 2));
        ctx.beginPath();
        ctx.moveTo(cx - dx, y);
        ctx.lineTo(cx + dx, y);
        ctx.stroke();
      }

      // Longitude grid lines
      for (const lon of [-120, -60, 0, 60, 120]) {
        const x  = cx + (lon / 165) * R;
        const dy = Math.sqrt(Math.max(0, R * R - (x - cx) ** 2));
        ctx.beginPath();
        ctx.moveTo(x, cy - dy);
        ctx.lineTo(x, cy + dy);
        ctx.stroke();
      }

      // Connection arcs from London
      pts.forEach((pt, i) => {
        if (i === londonIdx) return;
        const cp = controlPoint(london, pt);
        ctx.beginPath();
        ctx.moveTo(london.x, london.y);
        ctx.quadraticCurveTo(cp.x, cp.y, pt.x, pt.y);
        ctx.strokeStyle = arc;
        ctx.lineWidth   = 0.85;
        ctx.stroke();
      });

      // City nodes
      const now = performance.now();
      pts.forEach((pt, i) => {
        const isHub = CITIES[i].hub;

        if (isHub) {
          const pulse = 9 + 3 * Math.sin(now / 700);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pulse, 0, Math.PI * 2);
          ctx.strokeStyle = p(0.35 + 0.15 * Math.sin(now / 700));
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHub ? 5 : 2.5, 0, Math.PI * 2);
        ctx.fillStyle = isHub ? p(1) : p(0.55);
        ctx.fill();
      });

      // Traveling packets
      packets.forEach(pk => {
        const pt  = pts[pk.i];
        const cp  = controlPoint(london, pt);
        const t   = pk.fwd ? pk.t : 1 - pk.t;
        const pos = bezier(t, london, cp, pt);

        // Glow halo
        const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 7);
        grd.addColorStop(0, p(0.75));
        grd.addColorStop(1, p(0));
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = p(1);
        ctx.fill();

        pk.t += pk.speed;
        if (pk.t >= 1) { pk.t = 0; pk.fwd = !pk.fwd; }
      });

      rafRef.current = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [theme]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full pointer-events-none"
    />
  );
}

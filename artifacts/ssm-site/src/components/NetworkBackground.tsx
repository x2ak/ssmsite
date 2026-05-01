import { useRef, useEffect } from 'react';

interface NetNode {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const NODE_COUNT = 52;
const BASE_SPEED = 0.35;
const ACTIVE_SPEED = 1.1;
const BASE_DIST = 130;
const ACTIVE_DIST = 195;
const LERP = 0.038;

// Resolve --primary CSS var to [r, g, b] via an off-screen canvas
function resolvePrimary(): [number, number, number] {
  const hsl = `hsl(${getComputedStyle(document.documentElement).getPropertyValue('--primary').trim()})`;
  const cvs = document.createElement('canvas');
  cvs.width = cvs.height = 1;
  const c = cvs.getContext('2d')!;
  c.fillStyle = hsl;
  c.fillRect(0, 0, 1, 1);
  const d = c.getImageData(0, 0, 1, 1).data;
  return [d[0], d[1], d[2]];
}

export function NetworkBackground({ active = false }: { active?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const activeRef = useRef(active);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let nodes: NetNode[] = [];
    let rafId: number;
    let level = 0;
    let color: [number, number, number] = [0, 178, 194];
    let lastTheme = '';

    function init() {
      nodes = Array.from({ length: NODE_COUNT }, () => {
        const a = Math.random() * Math.PI * 2;
        const s = BASE_SPEED * (0.5 + Math.random() * 0.8);
        return {
          x: Math.random() * canvas!.width,
          y: Math.random() * canvas!.height,
          vx: Math.cos(a) * s,
          vy: Math.sin(a) * s,
        };
      });
    }

    function resize() {
      canvas!.width = window.innerWidth;
      canvas!.height = window.innerHeight;
      init();
    }

    function frame() {
      const w = canvas!.width;
      const h = canvas!.height;

      const theme = document.documentElement.getAttribute('data-theme') || 'light';
      if (theme !== lastTheme) {
        lastTheme = theme;
        color = resolvePrimary();
      }

      level += ((activeRef.current ? 1 : 0) - level) * LERP;

      const speed = 1 + level * (ACTIVE_SPEED / BASE_SPEED - 1);
      const maxDist = BASE_DIST + level * (ACTIVE_DIST - BASE_DIST);
      const [r, g, b] = color;

      ctx!.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx * speed;
        n.y += n.vy * speed;
        if (n.x <= 0 || n.x >= w) { n.vx *= -1; n.x = Math.max(0, Math.min(w, n.x)); }
        if (n.y <= 0 || n.y >= h) { n.vy *= -1; n.y = Math.max(0, Math.min(h, n.y)); }
      }

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist >= maxDist) continue;
          const proximity = 1 - dist / maxDist;
          const alpha = proximity * (0.12 + level * 0.42);
          ctx!.beginPath();
          ctx!.moveTo(nodes[i].x, nodes[i].y);
          ctx!.lineTo(nodes[j].x, nodes[j].y);
          ctx!.strokeStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
          ctx!.lineWidth = 0.8 + level * 0.6;
          ctx!.stroke();
        }
      }

      for (const n of nodes) {
        const alpha = 0.25 + level * 0.45;
        const radius = 1.8 + level * 1.2;
        ctx!.beginPath();
        ctx!.arc(n.x, n.y, radius, 0, Math.PI * 2);
        ctx!.fillStyle = `rgba(${r},${g},${b},${alpha.toFixed(3)})`;
        ctx!.fill();
      }

      rafId = requestAnimationFrame(frame);
    }

    window.addEventListener('resize', resize);
    resize();
    frame();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0"
      aria-hidden="true"
    />
  );
}

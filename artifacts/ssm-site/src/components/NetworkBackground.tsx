import { useEffect, useRef } from 'react';
import { feature } from 'topojson-client';
import type { Topology, Objects } from 'topojson-specification';
import { useTheme } from '@/context/ThemeContext';

type Point = { x: number; y: number };

// ISO 3166-1 numeric codes for European countries
const EU_IDS = new Set([
  8,   // Albania
  20,  // Andorra
  40,  // Austria
  56,  // Belgium
  70,  // Bosnia
  100, // Bulgaria
  112, // Belarus
  191, // Croatia
  196, // Cyprus
  203, // Czech Republic
  208, // Denmark
  233, // Estonia
  246, // Finland
  250, // France
  276, // Germany
  300, // Greece
  348, // Hungary
  352, // Iceland
  372, // Ireland
  380, // Italy
  428, // Latvia
  438, // Liechtenstein
  440, // Lithuania
  442, // Luxembourg
  470, // Malta
  492, // Monaco
  498, // Moldova
  499, // Montenegro
  528, // Netherlands
  578, // Norway
  616, // Poland
  620, // Portugal
  642, // Romania
  643, // Russia (western portion clips naturally)
  674, // San Marino
  688, // Serbia
  703, // Slovakia
  705, // Slovenia
  724, // Spain
  752, // Sweden
  756, // Switzerland
  792, // Turkey (western portion)
  804, // Ukraine
  807, // North Macedonia
  826, // United Kingdom
]);

// European cities for network overlay — London is hub
const CITIES = [
  { name: 'London',    lat: 51.5,  lon: -0.12, hub: true },
  { name: 'Paris',     lat: 48.85, lon:  2.35           },
  { name: 'Berlin',    lat: 52.52, lon: 13.41           },
  { name: 'Madrid',    lat: 40.42, lon: -3.70           },
  { name: 'Rome',      lat: 41.90, lon: 12.50           },
  { name: 'Amsterdam', lat: 52.37, lon:  4.90           },
  { name: 'Warsaw',    lat: 52.23, lon: 21.01           },
  { name: 'Vienna',    lat: 48.21, lon: 16.37           },
  { name: 'Stockholm', lat: 59.33, lon: 18.07           },
  { name: 'Lisbon',    lat: 38.72, lon: -9.14           },
  { name: 'Dublin',    lat: 53.33, lon: -6.25           },
];

// Europe bounding box
const LON_MIN = -14, LON_MAX = 42;
const LAT_MIN =  34, LAT_MAX = 72;

function mercY(lat: number) {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

const MX_MIN = (LON_MIN * Math.PI) / 180;
const MX_MAX = (LON_MAX * Math.PI) / 180;
const MY_MIN = mercY(LAT_MIN);
const MY_MAX = mercY(LAT_MAX);

function project(lon: number, lat: number, W: number, H: number, pad = 0.04): Point {
  const mx = (lon * Math.PI) / 180;
  const my = mercY(lat);

  const usableW = W * (1 - 2 * pad);
  const usableH = H * (1 - 2 * pad);

  const scaleX = usableW / (MX_MAX - MX_MIN);
  const scaleY = usableH / (MY_MAX - MY_MIN);
  const scale  = Math.min(scaleX, scaleY);

  const mxCen = (MX_MIN + MX_MAX) / 2;
  const myCen = (MY_MIN + MY_MAX) / 2;

  return {
    x:  (mx - mxCen) * scale + W / 2,
    y: -(my - myCen) * scale + H / 2,
  };
}

function drawGeometry(
  ctx: CanvasRenderingContext2D,
  geometry: GeoJSON.Geometry,
  W: number,
  H: number,
) {
  function ring(coords: number[][]) {
    coords.forEach(([lon, lat], i) => {
      const { x, y } = project(lon, lat, W, H);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.closePath();
  }

  if (geometry.type === 'Polygon') {
    geometry.coordinates.forEach(ring);
  } else if (geometry.type === 'MultiPolygon') {
    geometry.coordinates.forEach(poly => poly.forEach(ring));
  }
}

function bezier(t: number, p0: Point, p1: Point, p2: Point): Point {
  const u = 1 - t;
  return {
    x: u * u * p0.x + 2 * u * t * p1.x + t * t * p2.x,
    y: u * u * p0.y + 2 * u * t * p1.y + t * t * p2.y,
  };
}

function ctrlPt(a: Point, b: Point): Point {
  const dist = Math.hypot(b.x - a.x, b.y - a.y);
  return {
    x: (a.x + b.x) / 2,
    y: (a.y + b.y) / 2 - dist * 0.22,
  };
}

export function NetworkBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { theme } = useTheme();
  const rafRef    = useRef<number>(0);
  const geoRef    = useRef<GeoJSON.Feature[]>([]);

  // Fetch and decode world-atlas topojson once
  useEffect(() => {
    (async () => {
      try {
        const topo = await fetch(
          'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json'
        ).then(r => r.json()) as Topology<Objects>;

        const collection = feature(topo, topo.objects.countries) as GeoJSON.FeatureCollection;
        geoRef.current   = collection.features.filter(f => EU_IDS.has(Number(f.id)));
      } catch (e) {
        console.warn('Map data unavailable:', e);
      }
    })();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isDark = theme === 'dark';
    const [h, s, l] = isDark ? [185, 100, 50] : [185, 100, 38];
    const p = (a: number) => `hsla(${h},${s}%,${l}%,${a})`;
    const bgRgb = isDark ? '10,10,10' : '247,247,247';

    const landFill   = isDark ? 'rgba(255,255,255,0.022)' : 'rgba(0,0,0,0.025)';
    const borderColor = isDark ? 'rgba(255,255,255,0.13)'  : 'rgba(0,0,0,0.16)';
    const arcColor   = isDark ? 'rgba(255,255,255,0.09)'  : 'rgba(0,0,0,0.08)';

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
          : { i, t: Math.random(), speed: 0.0012 + Math.random() * 0.0009, fwd: Math.random() < 0.5 }
      )
      .filter(Boolean) as { i: number; t: number; speed: number; fwd: boolean }[];

    function draw() {
      if (!ctx || !canvas) return;
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      // Country outlines — clip to safe zone; CLIP_TOP must match fadeH so borders
      // never appear inside the gradient fade region
      const CLIP_TOP = 160;
      const CLIP_BOT = 60;
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, CLIP_TOP, W, H - CLIP_TOP - CLIP_BOT);
      ctx.clip();
      geoRef.current.forEach(f => {
        if (!f.geometry) return;
        ctx.beginPath();
        drawGeometry(ctx, f.geometry, W, H);
        ctx.fillStyle   = landFill;
        ctx.fill();
        ctx.strokeStyle = borderColor;
        ctx.lineWidth   = 0.6;
        ctx.stroke();
      });
      ctx.restore();

      // City positions
      const pts    = CITIES.map(c => project(c.lon, c.lat, W, H));
      const london = pts[londonIdx];

      // Connection arcs from London
      pts.forEach((pt, i) => {
        if (i === londonIdx) return;
        const cp = ctrlPt(london, pt);
        ctx.beginPath();
        ctx.moveTo(london.x, london.y);
        ctx.quadraticCurveTo(cp.x, cp.y, pt.x, pt.y);
        ctx.strokeStyle = arcColor;
        ctx.lineWidth   = 0.9;
        ctx.stroke();
      });

      // City nodes
      const now = performance.now();
      pts.forEach((pt, i) => {
        const isHub = CITIES[i].hub;
        if (isHub) {
          const pr = 10 + 3 * Math.sin(now / 700);
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pr, 0, Math.PI * 2);
          ctx.strokeStyle = p(0.3 + 0.15 * Math.sin(now / 700));
          ctx.lineWidth   = 1.5;
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, isHub ? 5.5 : 2.8, 0, Math.PI * 2);
        ctx.fillStyle = isHub ? p(1) : p(0.65);
        ctx.fill();
      });

      // Traveling packets
      packets.forEach(pk => {
        const pt  = pts[pk.i];
        const cp  = ctrlPt(london, pt);
        const t   = pk.fwd ? pk.t : 1 - pk.t;
        const pos = bezier(t, london, cp, pt);

        const grd = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 7);
        grd.addColorStop(0, p(0.8));
        grd.addColorStop(1, p(0));
        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 7, 0, Math.PI * 2);
        ctx.fillStyle = grd;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(pos.x, pos.y, 2.2, 0, Math.PI * 2);
        ctx.fillStyle = p(1);
        ctx.fill();

        pk.t += pk.speed;
        if (pk.t >= 1) { pk.t = 0; pk.fwd = !pk.fwd; }
      });

      // Fade edges so country borders never create hard lines against the page
      const fadeH = 160;
      const topFade = ctx.createLinearGradient(0, 0, 0, fadeH);
      topFade.addColorStop(0, `rgba(${bgRgb},1)`);
      topFade.addColorStop(1, `rgba(${bgRgb},0)`);
      ctx.fillStyle = topFade;
      ctx.fillRect(0, 0, W, fadeH);

      const botFade = ctx.createLinearGradient(0, H - fadeH, 0, H);
      botFade.addColorStop(0, `rgba(${bgRgb},0)`);
      botFade.addColorStop(1, `rgba(${bgRgb},1)`);
      ctx.fillStyle = botFade;
      ctx.fillRect(0, H - fadeH, W, fadeH);

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

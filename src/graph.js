/**
 * Interactive HTML5 Canvas Spectral Graveyard & Call-Graph Renderer.
 */

const SEVERITY_COLORS = {
  eldritch: { stroke: '#ff3864', glow: 'rgba(255, 56, 100, 0.45)', fill: '#220b15', badge: 'ELDRITCH' },
  poltergeist: { stroke: '#ff8c42', glow: 'rgba(255, 140, 66, 0.40)', fill: '#23150b', badge: 'POLTERGEIST' },
  sanctified: { stroke: '#4ef2b8', glow: 'rgba(78, 242, 184, 0.35)', fill: '#0b211a', badge: 'SANCTIFIED' }
};

export class GraveyardGraph {
  /**
   * @param {HTMLCanvasElement} canvas
   * @param {(nodeId: string | null) => void} onSelect
   */
  constructor(canvas, onSelect) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.onSelect = onSelect;
    this.nodes = [];
    this.edges = [];
    this.selectedId = null;
    this.hoveredId = null;
    this.time = 0;
    this.embers = Array.from({ length: 28 }, (_, i) => ({
      x: (i * 97) % 1000,
      y: (i * 53) % 600,
      r: 1.2 + (i % 3) * 0.9,
      speed: 0.25 + (i % 5) * 0.12,
      alpha: 0.18 + (i % 4) * 0.1
    }));

    this.bindEvents();
    this.animate = this.animate.bind(this);
    this.rafId = requestAnimationFrame(this.animate);
  }

  bindEvents() {
    this.canvas.addEventListener('mousemove', (e) => {
      const pt = this.getCanvasPoint(e);
      const hit = this.hitTest(pt.x, pt.y);
      const nextHover = hit ? hit.id : null;
      if (nextHover !== this.hoveredId) {
        this.hoveredId = nextHover;
        this.canvas.style.cursor = nextHover ? 'pointer' : 'default';
      }
    });

    this.canvas.addEventListener('click', (e) => {
      const pt = this.getCanvasPoint(e);
      const hit = this.hitTest(pt.x, pt.y);
      this.selectedId = hit ? hit.id : null;
      this.onSelect(this.selectedId);
    });
  }

  getCanvasPoint(e) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  }

  setData(graph) {
    this.edges = graph.edges || [];
    const rawNodes = graph.nodes || [];
    const rect = this.canvas.getBoundingClientRect();
    const w = Math.max(rect.width || 680, 480);
    const h = Math.max(rect.height || 380, 320);

    // Arrange tombstones in layered graveyard rows ordered by out-degree (roots on top)
    const sorted = [...rawNodes].sort((a, b) => (b.outDegree - a.outDegree) || (a.startLine - b.startLine));
    const cols = Math.max(1, Math.min(3, Math.ceil(Math.sqrt(sorted.length))));
    const rows = Math.max(1, Math.ceil(sorted.length / cols));
    const cardW = 166;
    const cardH = 82;
    const padX = Math.max(18, (w - cols * cardW) / (cols + 1));
    const padY = Math.max(22, (h - rows * cardH) / (rows + 1));

    this.nodes = sorted.map((n, idx) => {
      const col = idx % cols;
      const row = Math.floor(idx / cols);
      const x = padX + col * (cardW + padX);
      const y = padY + row * (cardH + padY);
      return { ...n, x, y, w: cardW, h: cardH };
    });

    if (this.nodes.length > 0 && !this.nodes.some((n) => n.id === this.selectedId)) {
      this.selectedId = this.nodes[0].id;
    } else if (this.nodes.length === 0) {
      this.selectedId = null;
    }
  }

  hitTest(x, y) {
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const n = this.nodes[i];
      if (x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
        return n;
      }
    }
    return null;
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    const targetW = Math.max(300, Math.floor(rect.width * dpr));
    const targetH = Math.max(240, Math.floor(rect.height * dpr));
    if (this.canvas.width !== targetW || this.canvas.height !== targetH) {
      this.canvas.width = targetW;
      this.canvas.height = targetH;
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (this.nodes.length) {
        this.setData({ nodes: this.nodes, edges: this.edges });
      }
    }
  }

  drawTombstone(node) {
    const ctx = this.ctx;
    const theme = SEVERITY_COLORS[node.severity] || SEVERITY_COLORS.sanctified;
    const isSelected = node.id === this.selectedId;
    const isHovered = node.id === this.hoveredId;
    const pulse = node.severity === 'eldritch' ? 0.5 + 0.5 * Math.sin(this.time * 0.06) : 0;

    ctx.save();
    ctx.shadowColor = theme.stroke;
    ctx.shadowBlur = isSelected ? 22 : isHovered ? 16 : 8 + pulse * 8;

    // Arch-topped tombstone path
    const { x, y, w, h } = node;
    const archR = 22;
    ctx.beginPath();
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + archR);
    ctx.quadraticCurveTo(x, y, x + archR, y);
    ctx.lineTo(x + w - archR, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + archR);
    ctx.lineTo(x + w, y + h);
    ctx.closePath();

    ctx.fillStyle = theme.fill;
    ctx.fill();
    ctx.lineWidth = isSelected ? 2.6 : 1.5;
    ctx.strokeStyle = isSelected ? '#ffffff' : theme.stroke;
    ctx.stroke();
    ctx.restore();

    // Tombstone typography
    ctx.save();
    ctx.fillStyle = theme.stroke;
    ctx.font = 'bold 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(theme.badge, x + 12, y + 19);

    ctx.fillStyle = '#f5f0ff';
    ctx.font = 'bold 12.5px ui-monospace, SFMono-Regular, Menlo, monospace';
    const label = node.id.length > 14 ? node.id.slice(0, 13) + '…' : node.id;
    ctx.fillText(`${label}()`, x + 12, y + 40);

    ctx.fillStyle = '#b8adc9';
    ctx.font = '11px ui-monospace, SFMono-Regular, Menlo, monospace';
    ctx.fillText(`CC ${node.complexity} · Depth ${node.maxNesting}`, x + 12, y + 59);
    ctx.fillStyle = '#8b7fa3';
    ctx.fillText(`L${node.startLine}–${node.endLine} (${node.loc}L)`, x + 12, y + 73);
    ctx.restore();
  }

  drawEdges() {
    const ctx = this.ctx;
    const byId = new Map(this.nodes.map((n) => [n.id, n]));

    for (const edge of this.edges) {
      const from = byId.get(edge.from);
      const to = byId.get(edge.to);
      if (!from || !to) continue;

      const active = this.selectedId === edge.from || this.selectedId === edge.to;
      const sx = from.x + from.w / 2;
      const sy = from.y + from.h;
      const tx = to.x + to.w / 2;
      const ty = to.y;
      const ctrlY = (sy + ty) / 2 + (sx === tx ? 24 : 0);

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.quadraticCurveTo((sx + tx) / 2 + 26, ctrlY, tx, ty);
      ctx.strokeStyle = active ? '#c77dff' : 'rgba(155, 128, 214, 0.35)';
      ctx.lineWidth = active ? 2.2 : 1.3;
      if (active) {
        ctx.setLineDash([6, 4]);
        ctx.lineDashOffset = -this.time * 0.45;
      }
      ctx.stroke();

      // Arrowhead
      ctx.setLineDash([]);
      ctx.fillStyle = active ? '#e0aaff' : 'rgba(155, 128, 214, 0.5)';
      ctx.beginPath();
      ctx.arc(tx, ty, active ? 4 : 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  animate() {
    this.time++;
    this.resizeCanvas();
    const ctx = this.ctx;
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width || 680;
    const h = rect.height || 380;

    // Twilight mist backdrop
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#090612');
    grad.addColorStop(1, '#140c24');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle graveyard ground horizon
    ctx.fillStyle = 'rgba(78, 242, 184, 0.04)';
    ctx.fillRect(0, h - 34, w, 34);

    // Floating ectoplasm embers
    for (const ember of this.embers) {
      ember.y -= ember.speed;
      if (ember.y < -5) {
        ember.y = h + 5;
        ember.x = (ember.x + 137) % Math.max(w, 200);
      }
      ctx.fillStyle = `rgba(199, 125, 255, ${ember.alpha})`;
      ctx.beginPath();
      ctx.arc(ember.x % Math.max(w, 200), ember.y, ember.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (this.nodes.length === 0) {
      ctx.fillStyle = '#9d8fb8';
      ctx.font = '14px ui-monospace, SFMono-Regular, Menlo, monospace';
      ctx.textAlign = 'center';
      ctx.fillText('No named functions buried here yet. Paste code or choose a specimen.', w / 2, h / 2);
      ctx.textAlign = 'start';
    } else {
      this.drawEdges();
      for (const node of this.nodes) {
        this.drawTombstone(node);
      }
    }

    this.rafId = requestAnimationFrame(this.animate);
  }
}

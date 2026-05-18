import { createCanvas } from '@napi-rs/canvas';
import { writeFileSync, mkdirSync } from 'fs';

mkdirSync('store-assets', { recursive: true });

// Colors
const dark = {
  bg: '#0d1117', text: '#e6edf3', border: '#30363d',
  link: '#58a6ff', codeBg: '#161b22', muted: '#8b949e',
  accent: '#238636',
};
const light = {
  bg: '#ffffff', text: '#24292f', border: '#d0d7de',
  link: '#0969da', codeBg: '#f6f8fa', muted: '#656d76',
  accent: '#0969da',
};

function drawScreenshot1() {
  // Three-panel layout with file explorer, content, and right panel
  const w = 1280, h = 800;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const c = dark;

  // Background
  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, w, h);

  // Left panel (file explorer + outline)
  ctx.fillStyle = c.codeBg;
  ctx.fillRect(0, 0, 240, h);
  ctx.fillStyle = c.border;
  ctx.fillRect(240, 0, 1, h);

  // Left panel header
  ctx.fillStyle = c.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('EXPLORER', 16, 28);

  // Toolbar buttons
  ctx.fillStyle = c.border;
  ctx.fillRect(16, 38, 24, 18);
  ctx.fillRect(44, 38, 24, 18);
  ctx.fillRect(72, 38, 24, 18);
  ctx.fillStyle = c.text;
  ctx.font = '11px sans-serif';
  ctx.fillText('↑', 24, 51);
  ctx.fillText('↻', 52, 51);
  ctx.fillText('⌂', 80, 51);

  // Path
  ctx.fillStyle = c.muted;
  ctx.font = '10px sans-serif';
  ctx.fillText('.../openmark/test-files', 102, 51);

  // File tree
  const files = [
    { name: '📁 docs', indent: 0 },
    { name: '📁 src', indent: 0 },
    { name: '📁 test-files', indent: 0, expanded: true },
    { name: '📄 basic.md', indent: 1, active: true },
    { name: '📄 math.md', indent: 1 },
    { name: '📄 mermaid.md', indent: 1 },
    { name: '📄 README.md', indent: 0 },
  ];
  let y = 75;
  for (const f of files) {
    if (f.active) {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(8, y - 12, 224, 20);
    }
    ctx.fillStyle = f.active ? c.link : c.text;
    ctx.font = '12px sans-serif';
    ctx.fillText(f.name, 16 + f.indent * 16, y);
    y += 24;
  }

  // Split handle
  ctx.fillStyle = c.border;
  ctx.fillRect(0, 280, 240, 1);

  // Outline section
  ctx.fillStyle = c.muted;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('OUTLINE', 16, 300);

  const headings = ['OpenMark Test Document', '  Text Formatting', '  Lists', '  Code Block', '  Table', '  Image'];
  y = 320;
  for (const h2 of headings) {
    ctx.fillStyle = h2.startsWith('  ') ? c.muted : c.text;
    ctx.font = '11px sans-serif';
    ctx.fillText(h2.trim(), h2.startsWith('  ') ? 28 : 16, y);
    y += 20;
  }

  // Center panel - rendered markdown
  ctx.fillStyle = c.text;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('OpenMark Test Document', 280, 60);

  ctx.fillStyle = c.border;
  ctx.fillRect(280, 72, 680, 1);

  ctx.fillStyle = c.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Text Formatting', 280, 110);

  ctx.font = '14px sans-serif';
  ctx.fillText('This is bold, italic, and inline code. Here\'s a link.', 280, 140);

  // Code block
  ctx.fillStyle = c.codeBg;
  roundRect(ctx, 280, 160, 500, 100, 6);
  ctx.fill();
  ctx.fillStyle = '#7ee787';
  ctx.font = '13px monospace';
  ctx.fillText('function greet(name) {', 300, 185);
  ctx.fillStyle = c.text;
  ctx.fillText('  return `Hello, ${name}!`;', 300, 205);
  ctx.fillStyle = '#7ee787';
  ctx.fillText('}', 300, 225);
  ctx.fillStyle = '#79c0ff';
  ctx.fillText('console.log(greet("World"));', 300, 245);

  // Table
  ctx.fillStyle = c.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Table', 280, 300);

  ctx.fillStyle = c.border;
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1;
  // Table grid
  const tx = 280, ty = 315, tw = 500, th = 100;
  ctx.strokeRect(tx, ty, tw, th);
  ctx.strokeRect(tx, ty, tw, 25);
  ctx.strokeRect(tx, ty, 170, th);
  ctx.strokeRect(tx + 170, ty, 100, th);

  ctx.fillStyle = c.codeBg;
  ctx.fillRect(tx + 1, ty + 1, tw - 2, 24);

  ctx.fillStyle = c.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.fillText('Feature', tx + 10, ty + 17);
  ctx.fillText('Status', tx + 180, ty + 17);
  ctx.fillText('Notes', tx + 280, ty + 17);

  ctx.font = '12px sans-serif';
  ctx.fillText('Syntax Highlighting', tx + 10, ty + 42);
  ctx.fillText('✅', tx + 190, ty + 42);
  ctx.fillText('180+ languages', tx + 280, ty + 42);
  ctx.fillText('Mermaid Diagrams', tx + 10, ty + 67);
  ctx.fillText('✅', tx + 190, ty + 67);
  ctx.fillText('flowcharts, sequence', tx + 280, ty + 67);
  ctx.fillText('KaTeX Math', tx + 10, ty + 92);
  ctx.fillText('✅', tx + 190, ty + 92);
  ctx.fillText('inline & block', tx + 280, ty + 92);

  // Mermaid diagram placeholder
  ctx.fillStyle = c.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('Flowchart', 280, 460);

  // Simple flowchart boxes
  ctx.strokeStyle = c.link;
  ctx.lineWidth = 2;
  roundRect(ctx, 420, 480, 100, 36, 4);
  ctx.stroke();
  ctx.fillStyle = c.text;
  ctx.font = '12px sans-serif';
  ctx.fillText('Start', 452, 502);

  ctx.strokeStyle = c.link;
  roundRect(ctx, 400, 540, 140, 36, 4);
  ctx.stroke();
  ctx.fillText('Is it working?', 425, 562);

  // Arrows
  ctx.beginPath();
  ctx.moveTo(470, 516);
  ctx.lineTo(470, 540);
  ctx.stroke();

  ctx.strokeStyle = '#238636';
  roundRect(ctx, 310, 600, 80, 36, 4);
  ctx.stroke();
  ctx.fillStyle = '#7ee787';
  ctx.fillText('Great!', 332, 622);

  ctx.strokeStyle = '#f85149';
  roundRect(ctx, 540, 600, 80, 36, 4);
  ctx.stroke();
  ctx.fillStyle = '#f85149';
  ctx.fillText('Debug', 562, 622);

  // Right panel
  ctx.fillStyle = c.border;
  ctx.fillRect(960, 0, 1, h);
  ctx.fillStyle = c.codeBg;
  ctx.fillRect(961, 0, 319, h);

  // Tab bar
  ctx.fillStyle = c.border;
  ctx.fillRect(961, 30, 319, 1);
  const tabs = ['Chat', 'Settings', 'Actions', 'Collab'];
  let tabX = 975;
  for (let i = 0; i < tabs.length; i++) {
    ctx.fillStyle = i === 0 ? c.link : c.muted;
    ctx.font = '11px sans-serif';
    ctx.fillText(tabs[i], tabX, 20);
    if (i === 0) {
      ctx.fillStyle = c.link;
      ctx.fillRect(tabX - 4, 28, ctx.measureText(tabs[i]).width + 8, 2);
    }
    tabX += 70;
  }

  // Chat messages
  ctx.fillStyle = c.link;
  roundRect(ctx, 1050, 50, 200, 40, 8);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '11px sans-serif';
  ctx.fillText('What is this document about?', 1062, 74);

  ctx.fillStyle = '#1f2937';
  roundRect(ctx, 975, 100, 220, 60, 8);
  ctx.fill();
  ctx.fillStyle = c.text;
  ctx.font = '11px sans-serif';
  ctx.fillText('This is a test document for the', 987, 120);
  ctx.fillText('OpenMark extension, showcasing', 987, 135);
  ctx.fillText('markdown rendering features.', 987, 150);

  // Chat input
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 1;
  roundRect(ctx, 975, h - 60, 220, 36, 4);
  ctx.stroke();
  ctx.fillStyle = c.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText('Ask about this document...', 987, h - 38);

  // Send button
  ctx.fillStyle = c.link;
  roundRect(ctx, 1205, h - 60, 55, 36, 4);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '12px sans-serif';
  ctx.fillText('Send', 1218, h - 38);

  // Toggle buttons on right edge
  ctx.fillStyle = c.codeBg;
  ctx.strokeStyle = c.border;
  roundRect(ctx, w - 20, h / 2 - 30, 20, 24, 3);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = c.text;
  ctx.font = '12px sans-serif';
  ctx.fillText('☰', w - 16, h / 2 - 14);

  roundRect(ctx, w - 20, h / 2 + 5, 20, 24, 3);
  ctx.fill();
  ctx.fillStyle = c.link;
  ctx.fillText('✎', w - 16, h / 2 + 21);

  // URL bar
  ctx.fillStyle = '#1c2128';
  roundRect(ctx, 100, 0, w - 100, 32, 0);
  ctx.fill();
  ctx.fillStyle = c.muted;
  ctx.font = '12px sans-serif';
  ctx.fillText('file:///projects/test-files/basic.md', 120, 20);

  writeFileSync('store-assets/screenshot-1.png', canvas.toBuffer('image/png'));
  console.log('Generated screenshot-1.png (1280x800) — Three-panel layout with chat');
}

function drawScreenshot2() {
  // Editor mode with live preview
  const w = 1280, h = 800;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const c = dark;

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, w, h);

  // Left panel (outline only, no explorer for this view)
  ctx.fillStyle = c.codeBg;
  ctx.fillRect(0, 0, 200, h);
  ctx.fillStyle = c.border;
  ctx.fillRect(200, 0, 1, h);

  ctx.fillStyle = c.muted;
  ctx.font = 'bold 10px sans-serif';
  ctx.fillText('OUTLINE', 16, 28);

  const headings = ['LaTeX Math Test', '  Inline Math', '  Block Math', '  Matrix', '  Mixed Content'];
  let y = 48;
  for (const h2 of headings) {
    ctx.fillStyle = h2.startsWith('  ') ? c.muted : c.text;
    ctx.font = '11px sans-serif';
    ctx.fillText(h2.trim(), h2.startsWith('  ') ? 28 : 16, y);
    y += 20;
  }

  // Center - top: preview
  ctx.fillStyle = c.text;
  ctx.font = 'bold 24px sans-serif';
  ctx.fillText('LaTeX Math Test', 240, 55);
  ctx.fillStyle = c.border;
  ctx.fillRect(240, 65, 560, 1);

  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Inline Math', 240, 100);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = c.text;
  ctx.fillText('The quadratic formula is ', 240, 130);
  ctx.fillStyle = c.link;
  ctx.font = 'italic 14px serif';
  ctx.fillText('x = (-b ± √(b²-4ac)) / 2a', 420, 130);

  ctx.fillStyle = c.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Block Math', 240, 175);

  // Math block
  ctx.fillStyle = c.text;
  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.fillText('∫₋∞^∞ e^(-x²) dx = √π', 500, 220);
  ctx.textAlign = 'left';

  ctx.font = '20px serif';
  ctx.textAlign = 'center';
  ctx.fillText('∑(n=1,∞) 1/n² = π²/6', 500, 270);
  ctx.textAlign = 'left';

  // Split handle
  ctx.fillStyle = c.link;
  ctx.fillRect(201, h * 0.55, 759, 4);

  // Center - bottom: editor
  ctx.fillStyle = '#0a0e14';
  ctx.fillRect(201, h * 0.55 + 4, 759, h * 0.45);

  // Editor toolbar
  ctx.fillStyle = c.codeBg;
  ctx.fillRect(201, h * 0.55 + 4, 759, 28);
  ctx.fillStyle = c.link;
  roundRect(ctx, 212, h * 0.55 + 9, 44, 18, 3);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = '11px sans-serif';
  ctx.fillText('Save', 223, h * 0.55 + 22);

  // Editor content
  ctx.fillStyle = c.muted;
  ctx.font = '12px monospace';
  const editorLines = [
    '# LaTeX Math Test',
    '',
    '## Inline Math',
    '',
    'The quadratic formula is $x = \\frac{-b \\pm',
    '\\sqrt{b^2 - 4ac}}{2a}$ and Euler\'s identity',
    'is $e^{i\\pi} + 1 = 0$.',
    '',
    '## Block Math',
    '',
    '$$',
    '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}',
    '$$',
  ];
  y = h * 0.55 + 50;
  for (const line of editorLines) {
    ctx.fillStyle = line.startsWith('#') ? c.link : line.startsWith('$') ? '#d2a8ff' : c.text;
    ctx.fillText(line, 220, y);
    y += 18;
  }

  // Right panel - Settings tab
  ctx.fillStyle = c.border;
  ctx.fillRect(960, 0, 1, h);
  ctx.fillStyle = c.codeBg;
  ctx.fillRect(961, 0, 319, h);

  ctx.fillStyle = c.border;
  ctx.fillRect(961, 30, 319, 1);
  const tabs = ['Chat', 'Settings', 'Actions', 'Collab'];
  let tabX = 975;
  for (let i = 0; i < tabs.length; i++) {
    ctx.fillStyle = i === 1 ? c.link : c.muted;
    ctx.font = '11px sans-serif';
    ctx.fillText(tabs[i], tabX, 20);
    if (i === 1) {
      ctx.fillStyle = c.link;
      ctx.fillRect(tabX - 4, 28, ctx.measureText(tabs[i]).width + 8, 2);
    }
    tabX += 70;
  }

  // Settings content
  const settings = [
    { label: 'Theme', value: 'Dark' },
    { label: 'Font Family', value: 'System Default' },
    { label: 'Font Size: 16', value: null },
    { label: 'Line Height: 1.6', value: null },
    { label: 'Max Width: 900', value: null },
  ];
  y = 55;
  for (const s of settings) {
    ctx.fillStyle = c.muted;
    ctx.font = '11px sans-serif';
    ctx.fillText(s.label, 980, y);
    if (s.value) {
      ctx.fillStyle = c.border;
      roundRect(ctx, 980, y + 5, 240, 22, 3);
      ctx.stroke();
      ctx.fillStyle = c.text;
      ctx.font = '11px sans-serif';
      ctx.fillText(s.value, 990, y + 20);
    } else {
      ctx.fillStyle = c.border;
      ctx.fillRect(980, y + 8, 240, 4);
      ctx.fillStyle = c.link;
      ctx.beginPath();
      ctx.arc(980 + 120, y + 10, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    y += 50;
  }

  // Toggles
  const toggles = [
    { label: 'Table of Contents', on: true },
    { label: 'Mermaid Diagrams', on: true },
    { label: 'LaTeX Math', on: true },
  ];
  for (const t of toggles) {
    ctx.fillStyle = c.muted;
    ctx.font = '11px sans-serif';
    ctx.fillText(t.label, 980, y);
    ctx.fillStyle = t.on ? c.accent : c.border;
    roundRect(ctx, 1190, y - 10, 30, 16, 8);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(t.on ? 1212 : 1198, y - 2, 5, 0, Math.PI * 2);
    ctx.fill();
    y += 35;
  }

  writeFileSync('store-assets/screenshot-2.png', canvas.toBuffer('image/png'));
  console.log('Generated screenshot-2.png (1280x800) — Editor mode with settings');
}

function drawScreenshot3() {
  // Mermaid diagrams showcase
  const w = 1280, h = 800;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');
  const c = light;

  ctx.fillStyle = c.bg;
  ctx.fillRect(0, 0, w, h);

  // Simple layout - just content area (light theme)
  ctx.fillStyle = c.text;
  ctx.font = 'bold 28px sans-serif';
  ctx.fillText('Mermaid Diagrams', 80, 55);
  ctx.fillStyle = c.border;
  ctx.fillRect(80, 68, 1120, 1);

  // Flowchart
  ctx.fillStyle = c.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Flowchart', 80, 110);

  ctx.strokeStyle = c.link;
  ctx.lineWidth = 2;
  // Start
  roundRect(ctx, 200, 130, 80, 30, 15);
  ctx.stroke();
  ctx.fillStyle = c.text;
  ctx.font = '11px sans-serif';
  ctx.fillText('Start', 225, 149);
  // Arrow
  ctx.beginPath(); ctx.moveTo(240, 160); ctx.lineTo(240, 180); ctx.stroke();
  // Decision
  ctx.beginPath(); ctx.moveTo(240, 180); ctx.lineTo(300, 210); ctx.lineTo(240, 240); ctx.lineTo(180, 210); ctx.closePath(); ctx.stroke();
  ctx.fillText('Working?', 213, 214);
  // Yes
  ctx.beginPath(); ctx.moveTo(180, 210); ctx.lineTo(120, 210); ctx.lineTo(120, 270); ctx.stroke();
  roundRect(ctx, 80, 270, 80, 30, 4); ctx.stroke();
  ctx.fillStyle = '#1a7f37'; ctx.fillText('Great!', 105, 289); ctx.fillStyle = c.text;
  // No
  ctx.beginPath(); ctx.moveTo(300, 210); ctx.lineTo(360, 210); ctx.lineTo(360, 270); ctx.stroke();
  ctx.strokeStyle = '#cf222e';
  roundRect(ctx, 320, 270, 80, 30, 4); ctx.stroke();
  ctx.fillStyle = '#cf222e'; ctx.fillText('Debug', 345, 289); ctx.fillStyle = c.text;

  // Sequence diagram
  ctx.strokeStyle = c.link;
  ctx.fillStyle = c.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Sequence Diagram', 500, 110);

  // Participants
  ctx.font = 'bold 11px sans-serif';
  const parts = ['User', 'Browser', 'Extension', 'Renderer'];
  const px = [540, 640, 740, 840];
  for (let i = 0; i < parts.length; i++) {
    ctx.fillStyle = c.codeBg;
    ctx.strokeStyle = c.border;
    roundRect(ctx, px[i] - 25, 125, 70, 22, 3);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = c.text;
    ctx.fillText(parts[i], px[i] - 15, 140);
    // Lifeline
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(px[i] + 10, 147); ctx.lineTo(px[i] + 10, 300); ctx.stroke();
    ctx.setLineDash([]);
  }

  // Messages
  ctx.strokeStyle = c.link;
  ctx.lineWidth = 1.5;
  const msgs = [
    { from: 0, to: 1, y: 165, label: 'Open .md file' },
    { from: 1, to: 2, y: 190, label: 'Content script injected' },
    { from: 2, to: 3, y: 215, label: 'Parse markdown' },
    { from: 3, to: 2, y: 240, label: 'HTML output' },
    { from: 2, to: 1, y: 265, label: 'Replace DOM' },
  ];
  for (const m of msgs) {
    ctx.beginPath();
    ctx.moveTo(px[m.from] + 10, m.y);
    ctx.lineTo(px[m.to] + 10, m.y);
    ctx.stroke();
    ctx.fillStyle = c.text;
    ctx.font = '10px sans-serif';
    const mid = (px[m.from] + px[m.to]) / 2;
    ctx.fillText(m.label, mid - 20, m.y - 5);
  }

  // Pie chart
  ctx.fillStyle = c.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Bundle Size', 80, 370);

  const slices = [
    { pct: 0.38, color: '#0969da', label: 'highlight.js' },
    { pct: 0.48, color: '#8250df', label: 'KaTeX' },
    { pct: 0.10, color: '#1a7f37', label: 'markdown-it' },
    { pct: 0.04, color: '#cf222e', label: 'core' },
  ];
  let angle = -Math.PI / 2;
  const cx = 220, cy = 500, r = 80;
  for (const s of slices) {
    const endAngle = angle + s.pct * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, angle, endAngle);
    ctx.closePath();
    ctx.fillStyle = s.color;
    ctx.fill();
    angle = endAngle;
  }
  // Legend
  let ly = 430;
  for (const s of slices) {
    ctx.fillStyle = s.color;
    ctx.fillRect(330, ly, 12, 12);
    ctx.fillStyle = c.text;
    ctx.font = '11px sans-serif';
    ctx.fillText(`${s.label} (${Math.round(s.pct * 100)}%)`, 348, ly + 10);
    ly += 22;
  }

  // Gantt chart
  ctx.fillStyle = c.text;
  ctx.font = 'bold 18px sans-serif';
  ctx.fillText('Gantt Chart', 500, 370);

  const tasks = [
    { name: 'Markdown parsing', start: 0, dur: 3, color: '#1a7f37' },
    { name: 'Syntax highlighting', start: 1.5, dur: 2, color: '#1a7f37' },
    { name: 'Mermaid support', start: 3, dur: 1.5, color: '#1a7f37' },
    { name: 'Dark theme', start: 4, dur: 0.7, color: '#8250df' },
    { name: 'Auto refresh', start: 4.5, dur: 0.5, color: '#8250df' },
    { name: 'Security fixes', start: 5, dur: 1, color: '#cf222e' },
  ];
  const gx = 650, gy = 395, gw = 500, barH = 20;
  let ty = gy;
  for (const t of tasks) {
    ctx.fillStyle = c.text;
    ctx.font = '10px sans-serif';
    ctx.fillText(t.name, 510, ty + 14);
    ctx.fillStyle = t.color;
    const bx = gx + (t.start / 6) * gw;
    const bw = (t.dur / 6) * gw;
    roundRect(ctx, bx, ty + 2, bw, barH - 4, 3);
    ctx.fill();
    ty += barH + 4;
  }

  // Light theme badge
  ctx.fillStyle = c.codeBg;
  ctx.strokeStyle = c.border;
  roundRect(ctx, w - 140, h - 40, 120, 28, 4);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = c.text;
  ctx.font = '12px sans-serif';
  ctx.fillText('Light Theme', w - 120, h - 22);

  writeFileSync('store-assets/screenshot-3.png', canvas.toBuffer('image/png'));
  console.log('Generated screenshot-3.png (1280x800) — Mermaid diagrams (light theme)');
}

function drawPromo() {
  // Small promo tile 440x280
  const w = 440, h = 280;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Gradient background
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0d1117');
  grad.addColorStop(1, '#161b22');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 32px sans-serif';
  ctx.fillText('OpenMark', 30, 50);

  ctx.fillStyle = '#8b949e';
  ctx.font = '14px sans-serif';
  ctx.fillText('Markdown Viewer Extension', 30, 75);

  // Feature icons
  const features = ['✨ Syntax Highlighting', '📊 Mermaid Diagrams', '📐 LaTeX Math', '🤖 AI Chat'];
  let fy = 110;
  for (const f of features) {
    ctx.fillStyle = '#e6edf3';
    ctx.font = '13px sans-serif';
    ctx.fillText(f, 40, fy);
    fy += 28;
  }

  // Code snippet decoration
  ctx.fillStyle = '#161b22';
  roundRect(ctx, 250, 100, 170, 140, 6);
  ctx.fill();
  ctx.strokeStyle = '#30363d';
  roundRect(ctx, 250, 100, 170, 140, 6);
  ctx.stroke();

  ctx.font = '10px monospace';
  ctx.fillStyle = '#7ee787';
  ctx.fillText('# Hello World', 264, 122);
  ctx.fillStyle = '#e6edf3';
  ctx.fillText('Rendered **beautifully**', 264, 140);
  ctx.fillStyle = '#79c0ff';
  ctx.fillText('```javascript', 264, 162);
  ctx.fillStyle = '#e6edf3';
  ctx.fillText('const x = 42;', 264, 178);
  ctx.fillStyle = '#79c0ff';
  ctx.fillText('```', 264, 194);
  ctx.fillStyle = '#d2a8ff';
  ctx.fillText('$E = mc^2$', 264, 216);

  // Badge
  ctx.fillStyle = '#238636';
  roundRect(ctx, 30, h - 45, 120, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 11px sans-serif';
  ctx.fillText('Free & Open Source', 44, h - 28);

  writeFileSync('store-assets/small-promo-440x280.png', canvas.toBuffer('image/png'));
  console.log('Generated small-promo-440x280.png');
}

function drawMarquee() {
  // Marquee promo 1400x560
  const w = 1400, h = 560;
  const canvas = createCanvas(w, h);
  const ctx = canvas.getContext('2d');

  // Gradient
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, '#0d1117');
  grad.addColorStop(0.5, '#161b22');
  grad.addColorStop(1, '#0d1117');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // Title
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('OpenMark', w / 2, 70);

  ctx.fillStyle = '#8b949e';
  ctx.font = '20px sans-serif';
  ctx.fillText('Open-Source Markdown Viewer for Chrome', w / 2, 105);
  ctx.textAlign = 'left';

  // Feature cards
  const cards = [
    { x: 80, title: '📝 Render', desc: 'Beautiful markdown\nwith syntax highlighting' },
    { x: 330, title: '📊 Diagrams', desc: 'Mermaid flowcharts,\nsequence, Gantt, pie' },
    { x: 580, title: '📐 Math', desc: 'LaTeX equations\nvia KaTeX' },
    { x: 830, title: '📁 Explorer', desc: 'Browse local files\nand folders' },
    { x: 1080, title: '🤖 AI Chat', desc: 'Ask questions about\nyour document' },
  ];

  for (const card of cards) {
    ctx.fillStyle = '#1c2128';
    ctx.strokeStyle = '#30363d';
    roundRect(ctx, card.x, 140, 220, 120, 8);
    ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#e6edf3';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(card.title, card.x + 16, 172);

    ctx.fillStyle = '#8b949e';
    ctx.font = '13px sans-serif';
    const lines = card.desc.split('\n');
    let cy = 198;
    for (const l of lines) {
      ctx.fillText(l, card.x + 16, cy);
      cy += 18;
    }
  }

  // Bottom feature list
  ctx.fillStyle = '#58a6ff';
  ctx.font = '14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Three-panel layout  •  Live editor  •  Export HTML/PDF  •  Dark & Light themes  •  Auto-refresh  •  Bookmarks', w / 2, 310);

  // Mini screenshot preview
  ctx.fillStyle = '#1c2128';
  ctx.strokeStyle = '#30363d';
  roundRect(ctx, 200, 340, 1000, 180, 8);
  ctx.fill(); ctx.stroke();

  // Mini three-panel preview
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(210, 350, 180, 160);
  ctx.fillStyle = '#30363d';
  ctx.fillRect(390, 350, 1, 160);
  ctx.fillRect(810, 350, 1, 160);

  // Mini content
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('EXPLORER', 220, 368);
  ctx.fillStyle = '#8b949e';
  ctx.font = '9px sans-serif';
  ctx.fillText('📁 docs', 220, 385);
  ctx.fillText('📁 src', 220, 398);
  ctx.fillText('📄 README.md', 220, 411);
  ctx.fillText('OUTLINE', 220, 440);
  ctx.fillText('Getting Started', 220, 455);
  ctx.fillText('Features', 220, 468);

  // Center content
  ctx.fillStyle = '#e6edf3';
  ctx.font = 'bold 14px sans-serif';
  ctx.fillText('# OpenMark', 410, 375);
  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#8b949e';
  ctx.fillText('Render markdown beautifully in your browser', 410, 395);
  ctx.fillStyle = '#161b22';
  roundRect(ctx, 410, 405, 380, 50, 4);
  ctx.fill();
  ctx.fillStyle = '#7ee787';
  ctx.font = '9px monospace';
  ctx.fillText('const greeting = "Hello, World!";', 420, 422);
  ctx.fillText('console.log(greeting);', 420, 438);

  // Right panel
  ctx.fillStyle = '#0d1117';
  ctx.fillRect(811, 350, 389, 160);
  ctx.fillStyle = '#58a6ff';
  ctx.font = '9px sans-serif';
  ctx.fillText('Chat  Settings  Actions  Collab', 825, 365);
  ctx.fillStyle = '#58a6ff';
  ctx.fillRect(825, 368, 22, 1);

  // Badge
  ctx.fillStyle = '#238636';
  ctx.textAlign = 'center';
  roundRect(ctx, w / 2 - 70, h - 45, 140, 30, 15);
  ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Free & Open Source', w / 2, h - 26);

  writeFileSync('store-assets/marquee-promo-1400x560.png', canvas.toBuffer('image/png'));
  console.log('Generated marquee-promo-1400x560.png');
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

drawScreenshot1();
drawScreenshot2();
drawScreenshot3();
drawPromo();
drawMarquee();
console.log('\nAll store assets generated in store-assets/');

const captions = {
  hero: 'AIonOS helps NX move from watching operations to orchestrating them across warehouse, yard, network, pricing, and last mile.',
  warehouse: 'Warehouse vision turns video into engineering insight: throughput, congestion, labor pressure, and safety risk in one operating view.',
  yard: 'Yard vision lets AI agents detect queue buildup, idle docks, long waits, and security anomalies before they create customer-visible failure.',
  twin: 'The agentic twin does more than display disruption. It recalculates routes and protects inventory so service stays within tolerance.',
  pricing: 'Dynamic pricing reads capacity in real time, discounting when space is open and protecting yield when fill rises.',
  pod: 'At the last mile, the POD validator checks recipient, place, and geo confidence so delivery proof becomes auditable.',
  close: 'The pilot ask is simple: instrument one flow, prove the operational lift, and scale from evidence.'
};

let selectedNarrationVoice = null;
let narrationEnabled = true;

function detectNarrative(id) {
  const scripted = captions[id];
  if (scripted) return scripted;

  const section = document.getElementById(id);
  if (!section) return captions.hero;
  const heading = section.querySelector('h1, h2')?.textContent?.trim() || '';
  const paragraph = section.querySelector('p')?.textContent?.trim() || '';
  return [heading, paragraph].filter(Boolean).join('. ') || captions.hero;
}

function scoreBritishMaleVoice(voice) {
  const name = (voice.name || '').toLowerCase();
  const lang = (voice.lang || '').toLowerCase();
  let score = 0;
  if (lang.startsWith('en-gb')) score += 5;
  if (lang.startsWith('en')) score += 1;
  if (name.includes('male') || name.includes('man')) score += 3;
  if (name.includes('daniel') || name.includes('thomas') || name.includes('david')) score += 2;
  if (name.includes('uk') || name.includes('british') || name.includes('england')) score += 2;
  return score;
}

function selectNarrationVoice() {
  const synth = window.speechSynthesis;
  if (!synth) return null;
  const voices = synth.getVoices();
  if (!voices.length) return null;

  const ranked = [...voices].sort((a, b) => scoreBritishMaleVoice(b) - scoreBritishMaleVoice(a));
  return ranked[0] || null;
}

function ensureNarrationVoice() {
  if (selectedNarrationVoice) return;
  selectedNarrationVoice = selectNarrationVoice();
}

function speakNarrative(id) {
  if (!narrationEnabled || !('speechSynthesis' in window) || !('SpeechSynthesisUtterance' in window)) return;
  ensureNarrationVoice();

  const text = detectNarrative(id);
  if (!text) return;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = selectedNarrationVoice?.lang || 'en-GB';
  utterance.voice = selectedNarrationVoice || null;
  utterance.pitch = 0.92;
  utterance.rate = 0.95;

  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}

function updateCaptionAndNarration(id) {
  document.getElementById('captionText').textContent = detectNarrative(id);
  speakNarrative(id);
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      const id = entry.target.id;
      updateCaptionAndNarration(id);
    }
  });
}, { threshold: 0.3 });

document.querySelectorAll('.reveal').forEach((el) => observer.observe(el));

if ('speechSynthesis' in window) {
  window.speechSynthesis.onvoiceschanged = () => {
    selectedNarrationVoice = selectNarrationVoice();
  };
  selectedNarrationVoice = selectNarrationVoice();
}

const tourBtn = document.getElementById('tourBtn');
let tourTimer = null;

tourBtn.addEventListener('click', () => {
  const sections = ['hero', 'warehouse', 'yard', 'twin', 'pricing', 'pod', 'close'];
  let index = 0;
  narrationEnabled = true;
  clearInterval(tourTimer);
  document.getElementById(sections[0]).scrollIntoView({ behavior: 'smooth', block: 'start' });
  updateCaptionAndNarration(sections[0]);
  tourBtn.textContent = 'Guided tour playing';
  tourTimer = setInterval(() => {
    index += 1;
    if (index >= sections.length) {
      clearInterval(tourTimer);
      tourBtn.textContent = 'Play guided tour';
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      return;
    }
    const sectionId = sections[index];
    document.getElementById(sectionId).scrollIntoView({ behavior: 'smooth', block: 'start' });
    updateCaptionAndNarration(sectionId);
  }, 9000);
});

function drawAxes(ctx, width, height, padding, yTicks, xTicks = []) {
  ctx.strokeStyle = 'rgba(255,255,255,0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, padding / 2);
  ctx.lineTo(padding, height - padding);
  ctx.lineTo(width - padding / 2, height - padding);
  ctx.stroke();

  ctx.fillStyle = 'rgba(180,198,234,0.85)';
  ctx.font = '12px Inter';
  ctx.textAlign = 'right';
  yTicks.forEach(({ value, y, label }) => {
    ctx.strokeStyle = 'rgba(255,255,255,0.07)';
    ctx.beginPath();
    ctx.moveTo(padding, y);
    ctx.lineTo(width - padding / 2, y);
    ctx.stroke();
    ctx.fillText(label ?? value, padding - 10, y + 4);
  });
  ctx.textAlign = 'center';
  xTicks.forEach(({ x, label }) => ctx.fillText(label, x, height - padding + 22));
}

function drawLineChart(canvas, series, options = {}) {
  const ctx = canvas.getContext('2d');
  const { labels = [], color = '#8dd400', fill = true, secondary = null, maxY = null } = options;
  const width = canvas.width, height = canvas.height, pad = 48;
  ctx.clearRect(0, 0, width, height);
  const maxVal = maxY || Math.max(...series, ...(secondary || [0]));
  const minVal = 0;
  const yTicks = Array.from({ length: 5 }, (_, i) => {
    const value = minVal + ((maxVal - minVal) * i) / 4;
    return { value: Math.round(value), label: Math.round(value), y: height - pad - ((height - pad * 1.5) * i) / 4 };
  });
  const xTicks = labels.map((label, i) => ({ x: pad + (i / Math.max(labels.length - 1, 1)) * (width - pad * 1.5), label }));
  drawAxes(ctx, width, height, pad, yTicks, xTicks);

  const drawSeries = (arr, stroke, area) => {
    ctx.beginPath();
    arr.forEach((value, i) => {
      const x = pad + (i / Math.max(arr.length - 1, 1)) * (width - pad * 1.5);
      const y = height - pad - ((value - minVal) / Math.max(maxVal - minVal, 1)) * (height - pad * 1.5);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = stroke;
    ctx.lineWidth = 3;
    ctx.stroke();
    if (area) {
      ctx.lineTo(width - pad / 2, height - pad);
      ctx.lineTo(pad, height - pad);
      ctx.closePath();
      ctx.fillStyle = area;
      ctx.fill();
    }
  };

  if (secondary) drawSeries(secondary, '#5ba6ff', 'rgba(91,166,255,0.08)');
  drawSeries(series, color, fill ? 'rgba(141,212,0,0.12)' : null);
}

function animateNumber(el, finalValue, suffix = '', decimals = 0) {
  const end = Number(finalValue);
  const duration = 1200;
  const start = performance.now();
  const step = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const value = end * (1 - Math.pow(1 - progress, 3));
    el.textContent = value.toFixed(decimals) + suffix;
    if (progress < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

Promise.all([
  fetch('assets/data/throughput_summary.json').then(r => r.json()),
  fetch('assets/data/yard_activity_summary.json').then(r => r.json()),
  fetch('assets/data/scenario_before.json').then(r => r.json()),
  fetch('assets/data/scenario_after.json').then(r => r.json()),
]).then(([warehouse, yard, before, after]) => {
  initWarehouse(warehouse);
  initYard(yard);
  initTwin(before, after);
  initPricing();
});

function initWarehouse(data) {
  const values = Object.values(data.throughput_by_minute).map(Number);
  const labels = ['0', '70', '140', '210', '280', '350'];
  const selected = [0, 70, 140, 210, 280, 350].map(i => values[i]);
  drawLineChart(document.getElementById('warehouseChart'), selected, { labels, color: '#8dd400', fill: true, maxY: Math.max(...selected) + 40 });

  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const peakIndex = values.indexOf(Math.max(...values));
  animateNumber(document.getElementById('warehouseObjects'), data.total_objects, '', 0);
  animateNumber(document.getElementById('warehouseAvg'), avg, ' obj/min', 1);
  document.getElementById('warehousePeak').textContent = `min ${peakIndex}`;
}

function initYard(data) {
  const values = Object.values(data.vehicles_by_minute).map(Number);
  const queue = values.map(v => Math.round(v * 0.8 + 4));
  drawLineChart(document.getElementById('yardChart'), values, {
    labels: ['1m', '2m', '3m', '4m', '5m'],
    color: '#ffb24b',
    secondary: queue,
    fill: false,
    maxY: Math.max(...queue) + 6,
  });
  animateNumber(document.getElementById('yardVehicles'), data.total_vehicles, '', 0);
}

function initPricing() {
  const fill = 88;
  const rate = fill < 60 ? 160 : fill <= 85 ? 200 : 250;
  document.getElementById('pricingFill').textContent = `${fill}%`;
  document.getElementById('pricingRate').textContent = `$${rate}/ton`;
  document.getElementById('meterBar').style.width = `${fill}%`;

  const x = [20, 40, 60, 75, 85, 95];
  const y = [160, 160, 200, 200, 200, 250];
  drawLineChart(document.getElementById('pricingChart'), y, {
    labels: x.map(v => `${v}%`),
    color: '#5ba6ff',
    fill: false,
    maxY: 280,
  });
}

function initTwin(before, after) {
  const cityPos = {
    Delhi: [255, 165],
    Mumbai: [215, 380],
    Bangalore: [285, 470],
    Hyderabad: [320, 380],
    Kolkata: [520, 305],
  };
  const svg = document.getElementById('twinSvg');
  const buttons = document.querySelectorAll('.toggle-btn');
  const chartCanvas = document.getElementById('twinChart');

  function routeLine(from, to, color, width = 3, dash = false) {
    const [x1, y1] = cityPos[from];
    const [x2, y2] = cityPos[to];
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1); line.setAttribute('y1', y1);
    line.setAttribute('x2', x2); line.setAttribute('y2', y2);
    line.setAttribute('stroke', color);
    line.setAttribute('stroke-width', width);
    line.setAttribute('stroke-linecap', 'round');
    line.setAttribute('opacity', '0.85');
    if (dash) line.setAttribute('stroke-dasharray', '10 8');
    return line;
  }

  function cityNode(name) {
    const [x, y] = cityPos[name];
    const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x); circle.setAttribute('cy', y); circle.setAttribute('r', 10);
    circle.setAttribute('fill', '#8dd400'); circle.setAttribute('stroke', 'rgba(255,255,255,0.6)');
    circle.setAttribute('stroke-width', '2');
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x + 14); text.setAttribute('y', y + 5);
    text.setAttribute('fill', '#edf4ff'); text.setAttribute('font-size', '18'); text.setAttribute('font-family', 'Inter');
    text.textContent = name;
    g.append(circle, text);
    return g;
  }

  function render(mode) {
    svg.innerHTML = '';
    const dataset = mode === 'before' ? before : after;
    const riskColor = mode === 'before' ? '#ff6f7c' : '#5ba6ff';

    dataset.trucks.forEach(truck => {
      svg.appendChild(routeLine(
        before.warehouses.find(w => w.id === truck.origin || w.location === truck.origin)?.location || truck.origin,
        before.warehouses.find(w => w.id === truck.destination || w.location === truck.destination)?.location || truck.destination,
        truck.status === 'On-Time' ? 'rgba(255,255,255,0.18)' : riskColor,
        truck.status === 'On-Time' ? 2 : 4,
        truck.status !== 'On-Time'
      ));
    });

    Object.keys(cityPos).forEach(name => svg.appendChild(cityNode(name)));

    const disruptions = dataset.trucks.filter(t => t.status !== 'On-Time').length;
    document.getElementById('twinDisruptions').textContent = `${disruptions} ${mode === 'before' ? 'delayed' : 'rerouted'}`;
    document.getElementById('twinInventory').textContent = mode === 'before' ? 'Risk building at Mumbai/Kolkata' : 'Within target bands';
    document.getElementById('twinCommentary').textContent = dataset.commentary.static;

    const line = mode === 'before' ? [72, 69, 64, 61, 58] : [58, 71, 83, 89, 94];
    drawLineChart(chartCanvas, line, {
      labels: ['t0', 't1', 't2', 't3', 't4'],
      color: mode === 'before' ? '#ff6f7c' : '#8dd400',
      fill: false,
      maxY: 100,
    });
  }

  buttons.forEach(btn => btn.addEventListener('click', () => {
    buttons.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    render(btn.dataset.mode);
  }));

  render('before');
}

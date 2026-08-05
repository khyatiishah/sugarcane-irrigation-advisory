// ===========================================================
// Irrigation Advisory System for Sugarcane Crop - Shared JS
// ===========================================================

document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initScrollProgress();
  initBackToTop();
  initCounters();
  initAccordions();
  initRangeSliders();
  initSensorTrendChart();
  initContactForm();

  if (typeof AOS !== 'undefined') {
    AOS.init({ duration: 700, once: true, offset: 60, easing: 'ease-out-cubic' });
  }
});

// ---------- Navigation: active link + mobile toggle + scrolled header ----------
function initNav() {
  const current = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('nav ul li a').forEach(link => {
    if (link.getAttribute('href') === current) link.classList.add('active');
  });

  const toggle = document.getElementById('nav-toggle');
  const nav = document.getElementById('site-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      toggle.classList.toggle('open');
      nav.classList.toggle('open');
    });
    nav.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
      toggle.classList.remove('open');
      nav.classList.remove('open');
    }));
  }

  const header = document.querySelector('header');
  if (header) {
    window.addEventListener('scroll', () => {
      header.classList.toggle('scrolled', window.scrollY > 30);
    });
  }
}

// ---------- Top scroll progress bar ----------
function initScrollProgress() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const scrolled = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    bar.style.width = scrolled + '%';
  });
}

// ---------- Back-to-top button ----------
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 500);
  });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

// ---------- Animated stat counters (triggers when scrolled into view) ----------
function initCounters() {
  const counters = document.querySelectorAll('[data-count]');
  if (!counters.length) return;

  const animate = (el) => {
    const target = parseFloat(el.dataset.count);
    const decimals = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
    const suffix = el.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const value = target * eased;
      el.textContent = value.toFixed(decimals) + suffix;
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });

  counters.forEach(c => observer.observe(c));
}

// ---------- Accordion (About / Sensors pages) ----------
function initAccordions() {
  document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
      const item = header.closest('.accordion-item');
      const body = item.querySelector('.accordion-body');
      const isOpen = item.classList.contains('open');
      item.parentElement.querySelectorAll('.accordion-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.accordion-body').style.maxHeight = null;
      });
      if (!isOpen) {
        item.classList.add('open');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });
}

// ---------- Range slider live value display ----------
function initRangeSliders() {
  document.querySelectorAll('input[type="range"][data-display]').forEach(slider => {
    const displayEl = document.getElementById(slider.dataset.display);
    const unit = slider.dataset.unit || '';
    const update = () => { displayEl.textContent = slider.value + unit; };
    update();
    slider.addEventListener('input', update);
  });
}

// ---------- Simulated live sensor readout + trend chart (Home / Sensors pages) ----------
function updateSimulatedReadings(soilEl, tempEl, humEl) {
  const soil = (20 + Math.random() * 45).toFixed(1);
  const temp = (24 + Math.random() * 12).toFixed(1);
  const hum = (40 + Math.random() * 40).toFixed(1);
  soilEl.textContent = soil + '%';
  tempEl.textContent = temp + '°C';
  humEl.textContent = hum + '%';
  return { soil: parseFloat(soil), temp: parseFloat(temp), hum: parseFloat(hum) };
}

let trendChart = null;
function initSensorTrendChart() {
  const soilEl = document.getElementById('live-soil');
  const tempEl = document.getElementById('live-temp');
  const humEl = document.getElementById('live-humidity');
  const canvas = document.getElementById('sensor-trend-chart');

  if (!soilEl || !tempEl || !humEl) return;

  const initial = updateSimulatedReadings(soilEl, tempEl, humEl);
  const maxPoints = 12;
  const labels = [];
  const soilData = [];
  for (let i = maxPoints; i > 0; i--) { labels.push('-' + i * 5 + 's'); soilData.push(null); }
  labels.push('now');
  soilData.push(initial.soil);

  if (canvas && typeof Chart === 'undefined') {
    canvas.closest('.chart-card').innerHTML =
      '<p class="helper-text" style="text-align:center;">Live chart unavailable — Chart.js did not load (check your internet connection or ad-blocker).</p>';
  }

  if (canvas && typeof Chart !== 'undefined') {
    trendChart = new Chart(canvas.getContext('2d'), {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'Soil Moisture (%)',
          data: soilData,
          borderColor: '#2d6a4f',
          backgroundColor: 'rgba(82,183,136,0.15)',
          tension: 0.35,
          fill: true,
          pointRadius: 2,
          pointBackgroundColor: '#2d6a4f',
        }]
      },
      options: {
        animation: { duration: 400 },
        plugins: { legend: { display: false } },
        scales: {
          y: { min: 0, max: 100, ticks: { callback: v => v + '%' } },
          x: { ticks: { maxRotation: 0 } }
        }
      }
    });
  }

  setInterval(() => {
    const reading = updateSimulatedReadings(soilEl, tempEl, humEl);
    if (trendChart) {
      trendChart.data.labels.push('now');
      trendChart.data.labels.shift();
      trendChart.data.datasets[0].data.push(reading.soil);
      trendChart.data.datasets[0].data.shift();
      trendChart.update();
    }
  }, 4000);
}

// ---------- Contact form (front-end only, no backend configured) ----------
function initContactForm() {
  const contactForm = document.getElementById('contact-form');
  if (!contactForm) return;
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const msg = document.getElementById('contact-status');
    msg.textContent = 'Thank you! Your message has been recorded (demo form — connect a backend or form service such as Formspree to receive real submissions).';
    msg.style.display = 'block';
    contactForm.reset();
  });
}

// ---------- AI Advisory engine (advisory.html) ----------
// Uses a trained neural network (see ai_model.js + model_weights.js) —
// a scikit-learn MLPClassifier (8 -> 16 -> 8 -> 4) trained offline on a
// synthetic sugarcane irrigation dataset, ~94.6% held-out test accuracy.
// The JS forward pass in ai_model.js reproduces that trained model exactly.
let gaugeChart = null;

function runAdvisory(event) {
  event.preventDefault();

  const soilMoisture = parseFloat(document.getElementById('soilMoisture').value);
  const temperature = parseFloat(document.getElementById('temperature').value);
  const humidity = parseFloat(document.getElementById('humidity').value);
  const rainForecast = document.getElementById('rainForecast').value === 'yes' ? 1 : 0;
  const growthStage = document.getElementById('growthStage').value;

  const resultBox = document.getElementById('result-box');

  if (isNaN(soilMoisture) || isNaN(temperature) || isNaN(humidity)) {
    resultBox.className = 'alert show';
    resultBox.innerHTML = '<h3>Input Error</h3><p>Please enter valid numeric values for soil moisture, temperature, and humidity.</p>';
    return;
  }

  if (typeof predictIrrigation !== 'function') {
    resultBox.className = 'alert show';
    resultBox.innerHTML = '<h3>Model Not Loaded</h3><p>The AI model files (<code>model_weights.js</code> and <code>ai_model.js</code>) did not load. If you are viewing this on a hosted site, make sure both files were uploaded alongside the HTML/CSS/JS files and that the &lt;script&gt; tags in advisory.html point to the correct paths. Check your browser console (F12) for a 404 on either file.</p>';
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }

  let prediction;
  try {
    prediction = predictIrrigation(soilMoisture, temperature, humidity, rainForecast, growthStage);
  } catch (err) {
    resultBox.className = 'alert show';
    resultBox.innerHTML = `<h3>Something Went Wrong</h3><p>The model threw an error: ${err.message}. Check the browser console for details.</p>`;
    resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    console.error('predictIrrigation failed:', err);
    return;
  }

  const thresholds = {
    germination: { low: 65, high: 80 },
    tillering:   { low: 60, high: 75 },
    grand_growth:{ low: 70, high: 85 },
    maturity:    { low: 45, high: 60 }
  };
  const t = thresholds[growthStage] || thresholds.tillering;

  const labelMap = {
    irrigate_now:       { verdict: 'Irrigation Recommended', cssClass: 'warn' },
    hold_waterlogging:  { verdict: 'Hold Irrigation — Risk of Waterlogging', cssClass: 'warn' },
    delay_rain:         { verdict: 'No Irrigation Needed — Rain Expected', cssClass: 'ok' },
    optimal:            { verdict: 'Soil Moisture Optimal', cssClass: 'ok' },
  };

  const { verdict, cssClass } = labelMap[prediction.label];
  let litersPerHa = 0;
  let notes = '';

  if (prediction.label === 'irrigate_now') {
    const deficit = Math.max(1, t.low - soilMoisture);
    litersPerHa = Math.round(deficit * 450);
    notes = `The model classified current conditions as requiring irrigation for the ${growthStage.replace('_',' ')} stage. `;
    if (temperature > 33) notes += 'High temperature increases crop water demand. ';
    if (humidity < 40) notes += 'Low humidity accelerates evapotranspiration.';
  } else if (prediction.label === 'hold_waterlogging') {
    notes = `Soil moisture is high relative to what the ${growthStage.replace('_',' ')} stage needs. Excess water risks root damage and nutrient loss — allow soil to drain before the next irrigation.`;
  } else if (prediction.label === 'delay_rain') {
    notes = 'Rain is forecast within 24 hours and soil moisture is already adequate. Delaying irrigation avoids waterlogging and nutrient leaching.';
  } else {
    notes = `Soil moisture is well matched to the ${growthStage.replace('_',' ')} stage. Continue routine sensor monitoring.`;
  }

  const confidencePct = (prediction.confidence * 100).toFixed(1);
  const sortedProbs = Object.entries(prediction.probabilities).sort((a, b) => b[1] - a[1]);

  resultBox.className = cssClass;
  resultBox.innerHTML = `
    <h3>${verdict}</h3>
    <div class="confidence-wrap">
      <div class="gauge-canvas-wrap">
        <canvas id="confidence-gauge" width="110" height="110"></canvas>
        <div class="gauge-label">${confidencePct}%<small>confidence</small></div>
      </div>
      <div class="prob-bars" id="prob-bars"></div>
    </div>
    <p>${notes}</p>
    ${litersPerHa > 0 ? `<p><strong>Estimated irrigation requirement:</strong> ~${litersPerHa.toLocaleString()} liters/hectare</p>` : ''}
    <p class="helper-text">Inputs: soil moisture ${soilMoisture}%, temperature ${temperature}°C, humidity ${humidity}%, growth stage: ${growthStage.replace('_',' ')}, rain forecast: ${rainForecast ? 'yes' : 'no'}.</p>
  `;
  resultBox.classList.remove('show');
  requestAnimationFrame(() => resultBox.classList.add('show'));

  // Probability bars (animated width)
  const probBarsEl = document.getElementById('prob-bars');
  probBarsEl.innerHTML = sortedProbs.map(([label, p]) => `
    <div class="prob-bar-row">
      <div class="prob-label">${label.replace('_',' ')}</div>
      <div class="prob-bar-track"><div class="prob-bar-fill" data-target="${(p*100).toFixed(1)}"></div></div>
      <div class="prob-pct">${(p*100).toFixed(1)}%</div>
    </div>
  `).join('');
  requestAnimationFrame(() => {
    probBarsEl.querySelectorAll('.prob-bar-fill').forEach(el => {
      el.style.width = el.dataset.target + '%';
    });
  });

  // Confidence gauge (doughnut)
  if (typeof Chart !== 'undefined') {
    if (gaugeChart) gaugeChart.destroy();
    const gaugeColor = cssClass === 'ok' ? '#2d6a4f' : (cssClass === 'warn' ? '#f4a623' : '#e63946');
    gaugeChart = new Chart(document.getElementById('confidence-gauge').getContext('2d'), {
      type: 'doughnut',
      data: {
        datasets: [{
          data: [prediction.confidence * 100, 100 - prediction.confidence * 100],
          backgroundColor: [gaugeColor, '#e7f1ea'],
          borderWidth: 0,
        }]
      },
      options: {
        cutout: '75%',
        plugins: { tooltip: { enabled: false }, legend: { display: false } },
        animation: { animateRotate: true, duration: 900 },
      }
    });
  }

  resultBox.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

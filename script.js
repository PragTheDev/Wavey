const fileInput = document.getElementById("fileInput");
const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const barModeBtn = document.getElementById("barMode");
const waveModeBtn = document.getElementById("waveMode");
const circleModeBtn = document.getElementById("circleMode");
const spectrumModeBtn = document.getElementById("spectrumMode");

const minimalThemeBtn = document.getElementById("minimalTheme");
const neonThemeBtn = document.getElementById("neonTheme");
const retroThemeBtn = document.getElementById("retroTheme");
const rainbowThemeBtn = document.getElementById("rainbowTheme");

const particlesToggleBtn = document.getElementById("particlesToggle");
const backgroundToggleBtn = document.getElementById("backgroundToggle");
const fullscreenBtn = document.getElementById("fullscreenBtn");

const playPauseBtn = document.getElementById("playPauseBtn");
const playIcon = document.querySelector(".play-icon");
const pauseIcon = document.querySelector(".pause-icon");
const trackName = document.getElementById("trackName");
const progressFill = document.getElementById("progressFill");
const currentTimeEl = document.getElementById("currentTime");
const durationEl = document.getElementById("duration");
const volumeSlider = document.getElementById("volumeSlider");
const progressBar = document.querySelector(".progress-bar");

canvas.width = window.innerWidth;
canvas.height = 300;

let currentMode = "bars";
let currentTheme = "minimal";
let particlesEnabled = false;
let backgroundEnabled = false;
let isFullscreen = false;
let animationId;
let particles = [];

const themes = {
  minimal: {
    primary: [255, 255, 255],
    secondary: [200, 200, 200],
    accent: [150, 150, 150],
    background: [0, 0, 0],
  },
  neon: {
    primary: [0, 255, 255],
    secondary: [255, 0, 255],
    accent: [255, 255, 0],
    background: [10, 0, 20],
  },
  retro: {
    primary: [255, 100, 150],
    secondary: [100, 200, 255],
    accent: [255, 200, 100],
    background: [20, 10, 30],
  },
  rainbow: {
    primary: [255, 0, 0],
    secondary: [0, 255, 0],
    accent: [0, 0, 255],
    background: [5, 5, 5],
  },
};

class Particle {
  constructor(x, y, amplitude) {
    this.x = x;
    this.y = y;
    this.vx = (Math.random() - 0.5) * 4;
    this.vy = (Math.random() - 0.5) * 4;
    this.life = 1.0;
    this.decay = 0.005 + Math.random() * 0.01;
    this.size = 2 + (amplitude / 255) * 6;
    this.baseSize = this.size;
    this.amplitude = amplitude;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.life -= this.decay;
    this.size = this.baseSize * this.life;
    this.vy += 0.1;
  }

  draw(ctx, theme) {
    if (this.life <= 0) return;

    const [r, g, b] = theme.primary;
    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${this.life})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
    ctx.fill();

    ctx.shadowColor = `rgb(${r}, ${g}, ${b})`;
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  isDead() {
    return this.life <= 0;
  }
}

barModeBtn.addEventListener("click", () => {
  setActiveMode("bars", barModeBtn);
});

waveModeBtn.addEventListener("click", () => {
  setActiveMode("waves", waveModeBtn);
});

circleModeBtn.addEventListener("click", () => {
  setActiveMode("circle", circleModeBtn);
});

spectrumModeBtn.addEventListener("click", () => {
  setActiveMode("spectrum", spectrumModeBtn);
});

minimalThemeBtn.addEventListener("click", () => {
  setActiveTheme("minimal", minimalThemeBtn);
});

neonThemeBtn.addEventListener("click", () => {
  setActiveTheme("neon", neonThemeBtn);
});

retroThemeBtn.addEventListener("click", () => {
  setActiveTheme("retro", retroThemeBtn);
});

rainbowThemeBtn.addEventListener("click", () => {
  setActiveTheme("rainbow", rainbowThemeBtn);
});

particlesToggleBtn.addEventListener("click", () => {
  particlesEnabled = !particlesEnabled;
  particlesToggleBtn.classList.toggle("active", particlesEnabled);
  if (!particlesEnabled) {
    particles = [];
  }
});

backgroundToggleBtn.addEventListener("click", () => {
  backgroundEnabled = !backgroundEnabled;
  backgroundToggleBtn.classList.toggle("active", backgroundEnabled);
});

fullscreenBtn.addEventListener("click", () => {
  toggleFullscreen();
});

function setActiveMode(mode, btn) {
  currentMode = mode;
  document
    .querySelectorAll(".viz-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function setActiveTheme(theme, btn) {
  currentTheme = theme;
  document
    .querySelectorAll(".theme-btn")
    .forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
}

function toggleFullscreen() {
  if (!isFullscreen) {
    if (document.documentElement.requestFullscreen) {
      document.documentElement.requestFullscreen();
    } else if (document.documentElement.webkitRequestFullscreen) {
      document.documentElement.webkitRequestFullscreen();
    } else if (document.documentElement.msRequestFullscreen) {
      document.documentElement.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
}

document.addEventListener("fullscreenchange", handleFullscreenChange);
document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
document.addEventListener("msfullscreenchange", handleFullscreenChange);

function handleFullscreenChange() {
  const isCurrentlyFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.msFullscreenElement;

  if (isCurrentlyFullscreen) {
    isFullscreen = true;
    fullscreenBtn.classList.add("active");
    document.body.classList.add("fullscreen-mode");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    document.querySelector(".header").style.display = "none";
    document.querySelector(".upload-section").style.display = "none";
    document.querySelector(".footer").style.display = "none";
    document.querySelector(".visualizer-controls").style.display = "none";
    document.querySelector(".audio-controls").style.display = "none";
  } else {
    isFullscreen = false;
    fullscreenBtn.classList.remove("active");
    document.body.classList.remove("fullscreen-mode");
    canvas.width = window.innerWidth;
    canvas.height = 300;

    document.querySelector(".header").style.display = "block";
    document.querySelector(".upload-section").style.display = "block";
    document.querySelector(".footer").style.display = "block";
    document.querySelector(".visualizer-controls").style.display = "flex";
    document.querySelector(".audio-controls").style.display = "block";
  }
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && isFullscreen) {
    toggleFullscreen();
  }
});

playPauseBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
  } else {
    audio.pause();
  }
});

audio.addEventListener("play", () => {
  playIcon.style.display = "none";
  pauseIcon.style.display = "block";
});

audio.addEventListener("pause", () => {
  playIcon.style.display = "block";
  pauseIcon.style.display = "none";
});

audio.addEventListener("loadedmetadata", () => {
  durationEl.textContent = formatTime(audio.duration);
});

audio.addEventListener("timeupdate", () => {
  const progress = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = `${progress}%`;
  currentTimeEl.textContent = formatTime(audio.currentTime);
});

progressBar.addEventListener("click", (e) => {
  const rect = progressBar.getBoundingClientRect();
  const clickX = e.clientX - rect.left;
  const width = rect.width;
  const newTime = (clickX / width) * audio.duration;
  audio.currentTime = newTime;
});

volumeSlider.addEventListener("input", (e) => {
  audio.volume = e.target.value / 100;
});

function formatTime(seconds) {
  if (isNaN(seconds)) return "0:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

fileInput.addEventListener("change", function () {
  const files = this.files;
  if (files.length === 0) return;

  const file = files[0];
  const fileURL = URL.createObjectURL(file);
  audio.src = fileURL;
  audio.volume = volumeSlider.value / 100;

  trackName.textContent = file.name.replace(/\.[^/.]+$/, "");

  audio.load();
  audio.play();

  visualize(audio);
});

function visualize(audioElement) {
  const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  const source = audioCtx.createMediaElementSource(audioElement);
  const analyser = audioCtx.createAnalyser();

  source.connect(analyser);
  analyser.connect(audioCtx.destination);

  analyser.fftSize = 256;
  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  function draw() {
    animationId = requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    const theme = themes[currentTheme];
    const [r, g, b] = theme.background;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (backgroundEnabled) {
      drawBackgroundPattern(dataArray, theme);
    }

    if (currentMode === "bars") {
      drawBars(dataArray, bufferLength, theme);
    } else if (currentMode === "waves") {
      drawWaves(dataArray, bufferLength, theme);
    } else if (currentMode === "circle") {
      drawCircle(dataArray, bufferLength, theme);
    } else if (currentMode === "spectrum") {
      drawSpectrum(dataArray, bufferLength, theme);
    }

    if (particlesEnabled) {
      updateParticles(dataArray, theme);
      drawParticles(theme);
    }
  }

  function drawBackgroundPattern(dataArray, theme) {
    const time = Date.now() * 0.001;
    const avgAmplitude =
      dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;

    ctx.strokeStyle = `rgba(${theme.primary[0]}, ${theme.primary[1]}, ${
      theme.primary[2]
    }, ${0.1 + (avgAmplitude / 255) * 0.2})`;
    ctx.lineWidth = 1;

    const gridSize = 50 + Math.sin(time) * 10;

    for (let x = 0; x < canvas.width; x += gridSize) {
      for (let y = 0; y < canvas.height; y += gridSize) {
        const amplitude =
          dataArray[Math.floor((x / canvas.width) * bufferLength)] || 0;
        const pulse = (amplitude / 255) * 10;

        ctx.beginPath();
        ctx.arc(x, y, 2 + pulse, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }

    for (let i = 0; i < 10; i++) {
      const amplitude = dataArray[i * 12] || 0;
      const alpha = (amplitude / 255) * 0.3;

      ctx.strokeStyle = `rgba(${theme.secondary[0]}, ${theme.secondary[1]}, ${theme.secondary[2]}, ${alpha})`;
      ctx.lineWidth = 1 + (amplitude / 255) * 3;

      const offset = (time * 50 + i * 100) % (canvas.width + 200);
      ctx.beginPath();
      ctx.moveTo(offset - 200, 0);
      ctx.lineTo(offset, canvas.height);
      ctx.stroke();
    }
  }

  function updateParticles(dataArray, theme) {
    particles = particles.filter((p) => !p.isDead());

    const bassLevel =
      dataArray.slice(0, 8).reduce((sum, val) => sum + val, 0) / 8;

    if (bassLevel > 100 && Math.random() < 0.3) {
      const numParticles = Math.floor((bassLevel / 255) * 5) + 1;

      for (let i = 0; i < numParticles; i++) {
        particles.push(
          new Particle(
            Math.random() * canvas.width,
            canvas.height + 10,
            bassLevel
          )
        );
      }
    }

    particles.forEach((particle) => particle.update());
  }

  function drawParticles(theme) {
    particles.forEach((particle) => particle.draw(ctx, theme));
  }

  function drawBars(dataArray, bufferLength, theme) {
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];

      let color;
      if (currentTheme === "rainbow") {
        const hue = (i / bufferLength) * 360;
        color = `hsl(${hue}, 70%, ${50 + (barHeight / 255) * 30}%)`;
      } else {
        const intensity = barHeight / 255;
        const [r, g, b] = theme.primary;
        color = `rgba(${r}, ${g}, ${b}, ${0.6 + intensity * 0.4})`;
      }

      ctx.fillStyle = color;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      if (barHeight > 128) {
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
        ctx.shadowBlur = 0;
      }

      x += barWidth + 1;
    }
  }

  function drawWaves(dataArray, bufferLength, theme) {
    analyser.getByteTimeDomainData(dataArray);

    const [r, g, b] = theme.primary;

    ctx.lineWidth = 2;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.8)`;
    ctx.beginPath();

    const sliceWidth = canvas.width / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = (v * canvas.height) / 2;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    analyser.getByteFrequencyData(dataArray);

    const avgAmplitude =
      dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;

    if (avgAmplitude > 10) {
      const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        0,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width / 2
      );
      gradient.addColorStop(
        0,
        `rgba(${r}, ${g}, ${b}, ${(avgAmplitude / 255) * 0.1})`
      );
      gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    const [sr, sg, sb] = theme.secondary;
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, 0.4)`;
    ctx.beginPath();

    const points = [];
    for (let i = 0; i < bufferLength; i += 2) {
      const amplitude = dataArray[i];
      const x = (i / bufferLength) * canvas.width;
      const y = canvas.height / 2 + (amplitude - 128) * 0.8;
      points.push({ x, y });
    }

    if (points.length > 2) {
      ctx.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < points.length - 1; i++) {
        const cpx = (points[i].x + points[i + 1].x) / 2;
        const cpy = (points[i].y + points[i + 1].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, cpx, cpy);
      }
    }

    ctx.stroke();

    ctx.globalAlpha = 0.3;
    for (let i = 0; i < bufferLength; i += 8) {
      const amplitude = dataArray[i];
      if (amplitude > 20) {
        const x = (i / bufferLength) * canvas.width;
        const height = (amplitude / 255) * (canvas.height * 0.4);

        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${amplitude / 510})`;
        ctx.fillRect(x, canvas.height - height, 2, height);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawCircle(dataArray, bufferLength, theme) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const maxRadius = Math.min(centerX, centerY) * 0.8;

    const bassRange = dataArray.slice(0, 8);
    const midRange = dataArray.slice(8, 32);
    const trebleRange = dataArray.slice(32, 64);

    const bassLevel =
      bassRange.reduce((sum, val) => sum + val, 0) / bassRange.length;
    const midLevel =
      midRange.reduce((sum, val) => sum + val, 0) / midRange.length;
    const trebleLevel =
      trebleRange.reduce((sum, val) => sum + val, 0) / trebleRange.length;
    const overallLevel =
      dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;

    const numLayers = 8;

    for (let layer = 0; layer < numLayers; layer++) {
      const baseRadius = (maxRadius / numLayers) * (layer + 1);

      let amplitude;
      if (layer < 3) {
        amplitude = bassLevel;
      } else if (layer < 6) {
        amplitude = midLevel;
      } else {
        amplitude = trebleLevel;
      }

      const pulseAmount = (amplitude / 255) * 20;
      const currentRadius = baseRadius + pulseAmount;

      let strokeColor;
      if (currentTheme === "rainbow") {
        const hue = (layer / numLayers) * 360;
        strokeColor = `hsla(${hue}, 70%, 60%, ${
          0.1 + layer * 0.05 + (amplitude / 255) * 0.6
        })`;
      } else {
        const [r, g, b] = theme.primary;
        const baseOpacity = 0.1 + layer * 0.05;
        const amplitudeOpacity = (amplitude / 255) * 0.6;
        const totalOpacity = Math.min(baseOpacity + amplitudeOpacity, 0.8);
        strokeColor = `rgba(${r}, ${g}, ${b}, ${totalOpacity})`;
      }

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2 + (amplitude / 255) * 3;
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
      ctx.stroke();

      if (amplitude > 100) {
        if (currentTheme === "rainbow") {
          const hue = (layer / numLayers) * 360;
          ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${(amplitude / 255) * 0.1})`;
        } else {
          const [r, g, b] = theme.primary;
          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${(amplitude / 255) * 0.1})`;
        }
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }

    const coreRadius = 15 + (overallLevel / 255) * 25;

    const [r, g, b] = theme.accent;
    const coreGradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      coreRadius
    );
    coreGradient.addColorStop(
      0,
      `rgba(${r}, ${g}, ${b}, ${(overallLevel / 255) * 0.6})`
    );
    coreGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`);

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, 2 * Math.PI);
    ctx.fill();

    if (overallLevel > 80) {
      const emphasisRadius = maxRadius + 15 + (overallLevel / 255) * 15;
      const [sr, sg, sb] = theme.secondary;
      ctx.strokeStyle = `rgba(${sr}, ${sg}, ${sb}, ${
        (overallLevel / 255) * 0.4
      })`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, emphasisRadius, 0, 2 * Math.PI);
      ctx.stroke();
    }
  }

  function drawSpectrum(dataArray, bufferLength, theme) {
    const perspective = 0.7;
    const baseY = canvas.height * 0.8;
    const maxHeight = canvas.height * 0.6;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "rgba(16, 16, 16, 0.9)");
    bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawFloorGrid(theme);

    for (let i = 0; i < bufferLength; i++) {
      const frequency = dataArray[i];
      const barHeight = (frequency / 255) * maxHeight;

      const depth = (i / bufferLength) * perspective;
      const scaleFactor = 1 - depth * 0.8;
      const barWidth = (canvas.width / bufferLength) * 3 * scaleFactor;

      const x = (i / bufferLength) * canvas.width;
      const y = baseY - barHeight * scaleFactor;
      const adjustedHeight = barHeight * scaleFactor;

      const hue = 240 + (i / bufferLength) * 120;
      const saturation = 80;
      const lightness = 30 + (frequency / 255) * 50;

      const gradient = ctx.createLinearGradient(x, y, x, y + adjustedHeight);
      gradient.addColorStop(
        0,
        `hsla(${hue}, ${saturation}%, ${lightness + 20}%, 0.9)`
      );
      gradient.addColorStop(
        1,
        `hsla(${hue}, ${saturation}%, ${lightness}%, 0.6)`
      );

      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth, adjustedHeight);

      if (adjustedHeight > 10) {
        const reflectionGradient = ctx.createLinearGradient(
          x,
          baseY,
          x,
          baseY + adjustedHeight * 0.3
        );
        reflectionGradient.addColorStop(
          0,
          `hsla(${hue}, ${saturation}%, ${lightness}%, 0.3)`
        );
        reflectionGradient.addColorStop(
          1,
          `hsla(${hue}, ${saturation}%, ${lightness}%, 0)`
        );

        ctx.fillStyle = reflectionGradient;
        ctx.fillRect(x, baseY, barWidth, adjustedHeight * 0.3);
      }

      if (frequency > 128) {
        ctx.shadowColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
        ctx.shadowBlur = 20;
        ctx.fillStyle = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.8)`;
        ctx.fillRect(x, y, barWidth, adjustedHeight);
        ctx.shadowBlur = 0;
      }
    }

    drawSpectrumParticles(dataArray, theme);
  }

  function drawFloorGrid(theme) {
    const [r, g, b] = theme.secondary;
    ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.2)`;
    ctx.lineWidth = 1;

    const gridSize = 40;
    const baseY = canvas.height * 0.8;

    for (let i = 0; i < 5; i++) {
      const y = baseY + i * gridSize * 0.3;
      const perspective = i * 0.1;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    for (let i = 0; i <= canvas.width; i += gridSize) {
      ctx.beginPath();
      ctx.moveTo(i, baseY);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }
  }

  function drawSpectrumParticles(dataArray, theme) {
    const time = Date.now() * 0.003;

    for (let i = 0; i < dataArray.length; i += 15) {
      const amplitude = dataArray[i];
      if (amplitude > 100) {
        const x =
          (i / dataArray.length) * canvas.width + Math.sin(time + i) * 30;
        const y = canvas.height * 0.2 + Math.cos(time + i) * 50;
        const size = (amplitude / 255) * 4 + 1;

        let color;
        if (currentTheme === "rainbow") {
          const hue = 240 + (i / dataArray.length) * 120;
          color = `hsla(${hue}, 70%, 60%, ${amplitude / 255})`;
        } else {
          const [r, g, b] = theme.primary;
          color = `rgba(${r}, ${g}, ${b}, ${amplitude / 255})`;
        }

        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = color;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  draw();
}

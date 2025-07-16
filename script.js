const fileInput = document.getElementById("fileInput");
const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const barModeBtn = document.getElementById("barMode");
const waveModeBtn = document.getElementById("waveMode");
const circleModeBtn = document.getElementById("circleMode");
const spectrumModeBtn = document.getElementById("spectrumMode");

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
let animationId;

barModeBtn.addEventListener("click", () => {
  currentMode = "bars";
  barModeBtn.classList.add("active");
  waveModeBtn.classList.remove("active");
  circleModeBtn.classList.remove("active");
  spectrumModeBtn.classList.remove("active");
});

waveModeBtn.addEventListener("click", () => {
  currentMode = "waves";
  waveModeBtn.classList.add("active");
  barModeBtn.classList.remove("active");
  circleModeBtn.classList.remove("active");
  spectrumModeBtn.classList.remove("active");
});

circleModeBtn.addEventListener("click", () => {
  currentMode = "circle";
  circleModeBtn.classList.add("active");
  barModeBtn.classList.remove("active");
  waveModeBtn.classList.remove("active");
  spectrumModeBtn.classList.remove("active");
});

spectrumModeBtn.addEventListener("click", () => {
  currentMode = "spectrum";
  spectrumModeBtn.classList.add("active");
  barModeBtn.classList.remove("active");
  waveModeBtn.classList.remove("active");
  circleModeBtn.classList.remove("active");
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

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (currentMode === "bars") {
      drawBars(dataArray, bufferLength);
    } else if (currentMode === "waves") {
      drawWaves(dataArray, bufferLength);
    } else if (currentMode === "circle") {
      drawCircle(dataArray, bufferLength);
    } else if (currentMode === "spectrum") {
      drawSpectrum(dataArray, bufferLength);
    }
  }

  function drawBars(dataArray, bufferLength) {
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let barHeight;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
      barHeight = dataArray[i];

      const r = barHeight + 25;
      const g = 250 - barHeight;
      const b = 50;

      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);

      x += barWidth + 1;
    }
  }

  function drawWaves(dataArray, bufferLength) {
    ctx.lineWidth = 3;
    ctx.strokeStyle = "#9333ea";
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

    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();

    ctx.strokeStyle = "#4f46e5";
    ctx.beginPath();
    x = 0;

    for (let i = 0; i < bufferLength; i++) {
      const v = dataArray[i] / 128.0;
      const y = canvas.height / 2 + (v * canvas.height) / 4;

      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      x += sliceWidth;
    }

    ctx.stroke();

    drawParticles(dataArray, bufferLength);
  }

  function drawParticles(dataArray, bufferLength) {
    for (let i = 0; i < bufferLength; i += 10) {
      const amplitude = dataArray[i];
      if (amplitude > 50) {
        const x = (i / bufferLength) * canvas.width;
        const y = canvas.height / 2;
        const radius = (amplitude / 255) * 8;

        ctx.beginPath();
        ctx.arc(x, y, radius, 0, 2 * Math.PI);
        ctx.fillStyle = `rgba(147, 51, 234, ${amplitude / 255})`;
        ctx.fill();
      }
    }
  }

  function drawCircle(dataArray, bufferLength) {
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) * 0.6;

    ctx.strokeStyle = "rgba(147, 51, 234, 0.3)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.stroke();

    for (let i = 0; i < bufferLength; i++) {
      const barHeight = dataArray[i] * 0.8;
      const angle = (i / bufferLength) * 2 * Math.PI;

      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      const x2 = centerX + Math.cos(angle) * (radius + barHeight * 0.5);
      const y2 = centerY + Math.sin(angle) * (radius + barHeight * 0.5);

      const hue = (i / bufferLength) * 360;
      const saturation = 70;
      const lightness = 40 + (barHeight / 255) * 40;

      ctx.strokeStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    const avgFrequency =
      dataArray.reduce((sum, val) => sum + val, 0) / bufferLength;
    const innerRadius = (avgFrequency / 255) * 40 + 20;

    const gradient = ctx.createRadialGradient(
      centerX,
      centerY,
      0,
      centerX,
      centerY,
      innerRadius
    );
    gradient.addColorStop(0, `rgba(147, 51, 234, ${avgFrequency / 255})`);
    gradient.addColorStop(1, "rgba(147, 51, 234, 0)");

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerRadius, 0, 2 * Math.PI);
    ctx.fill();

    drawRotatingElements(dataArray, centerX, centerY, radius);
  }

  function drawRotatingElements(dataArray, centerX, centerY, baseRadius) {
    const time = Date.now() * 0.001;

    for (let i = 0; i < dataArray.length; i += 8) {
      const amplitude = dataArray[i];
      if (amplitude > 30) {
        const angle = (i / dataArray.length) * 2 * Math.PI + time;
        const distance = baseRadius * 0.7;

        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        const size = (amplitude / 255) * 6 + 2;

        ctx.fillStyle = `rgba(79, 70, 229, ${amplitude / 255})`;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }

  function drawSpectrum(dataArray, bufferLength) {
    const perspective = 0.7;
    const baseY = canvas.height * 0.8;
    const maxHeight = canvas.height * 0.6;

    const bgGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    bgGradient.addColorStop(0, "rgba(16, 16, 16, 0.9)");
    bgGradient.addColorStop(1, "rgba(0, 0, 0, 0.9)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    drawFloorGrid();

    for (let i = 0; i < bufferLength; i++) {
      const frequency = dataArray[i];
      const barHeight = (frequency / 255) * maxHeight;

      const depth = (i / bufferLength) * perspective;
      const scaleFactor = 1 - depth * 0.8;
      const barWidth = (canvas.width / bufferLength) * 3 * scaleFactor;

      const x = (i / bufferLength) * canvas.width;
      const y = baseY - barHeight * scaleFactor;
      const adjustedHeight = barHeight * scaleFactor;

      const hue = 240 + (i / bufferLength) * 120; // Blue to red
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

    drawSpectrumParticles(dataArray);
  }

  function drawFloorGrid() {
    ctx.strokeStyle = "rgba(147, 51, 234, 0.2)";
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

  function drawSpectrumParticles(dataArray) {
    const time = Date.now() * 0.003;

    for (let i = 0; i < dataArray.length; i += 15) {
      const amplitude = dataArray[i];
      if (amplitude > 100) {
        const x =
          (i / dataArray.length) * canvas.width + Math.sin(time + i) * 30;
        const y = canvas.height * 0.2 + Math.cos(time + i) * 50;
        const size = (amplitude / 255) * 4 + 1;

        const hue = 240 + (i / dataArray.length) * 120;
        ctx.fillStyle = `hsla(${hue}, 70%, 60%, ${amplitude / 255})`;

        ctx.beginPath();
        ctx.arc(x, y, size, 0, 2 * Math.PI);
        ctx.fill();

        ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
        ctx.shadowBlur = 10;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }
  }

  draw();
}

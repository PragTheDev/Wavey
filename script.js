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
   
    analyser.getByteTimeDomainData(dataArray);


    ctx.lineWidth = 2;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
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
        `rgba(255, 255, 255, ${(avgAmplitude / 255) * 0.1})`
      );
      gradient.addColorStop(1, "rgba(255, 255, 255, 0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }


    ctx.lineWidth = 1.5;
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
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

        ctx.fillStyle = `rgba(255, 255, 255, ${amplitude / 510})`;
        ctx.fillRect(x, canvas.height - height, 2, height);
      }
    }
    ctx.globalAlpha = 1;
  }


  function drawCircle(dataArray, bufferLength) {
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

 
      const baseOpacity = 0.1 + layer * 0.05;
      const amplitudeOpacity = (amplitude / 255) * 0.6;
      const totalOpacity = Math.min(baseOpacity + amplitudeOpacity, 0.8);

   
      ctx.strokeStyle = `rgba(255, 255, 255, ${totalOpacity})`;
      ctx.lineWidth = 2 + (amplitude / 255) * 3; 
      ctx.beginPath();
      ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
      ctx.stroke();

     
      if (amplitude > 100) {
        ctx.fillStyle = `rgba(255, 255, 255, ${(amplitude / 255) * 0.1})`;
        ctx.beginPath();
        ctx.arc(centerX, centerY, currentRadius, 0, 2 * Math.PI);
        ctx.fill();
      }
    }


    const coreRadius = 15 + (overallLevel / 255) * 25;

  
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
      `rgba(255, 255, 255, ${(overallLevel / 255) * 0.6})`
    );
    coreGradient.addColorStop(1, "rgba(255, 255, 255, 0)");

    ctx.fillStyle = coreGradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, coreRadius, 0, 2 * Math.PI);
    ctx.fill();

    // Outer emphasis ring for very high energy
    if (overallLevel > 80) {
      const emphasisRadius = maxRadius + 15 + (overallLevel / 255) * 15;
      ctx.strokeStyle = `rgba(255, 255, 255, ${(overallLevel / 255) * 0.4})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(centerX, centerY, emphasisRadius, 0, 2 * Math.PI);
      ctx.stroke();
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

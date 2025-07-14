const fileInput = document.getElementById("fileInput");
const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");
const barModeBtn = document.getElementById("barMode");
const waveModeBtn = document.getElementById("waveMode");

canvas.width = window.innerWidth;
canvas.height = 300;

let currentMode = "bars";
let animationId;

// Mode switching
barModeBtn.addEventListener("click", () => {
  currentMode = "bars";
  barModeBtn.classList.add("active");
  waveModeBtn.classList.remove("active");
});

waveModeBtn.addEventListener("click", () => {
  currentMode = "waves";
  waveModeBtn.classList.add("active");
  barModeBtn.classList.remove("active");
});

fileInput.addEventListener("change", function () {
  const files = this.files;
  if (files.length === 0) return;

  const fileURL = URL.createObjectURL(files[0]);
  audio.src = fileURL;
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
    } else {
      drawWaves(dataArray, bufferLength);
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

    // Add a second wave with different color and offset
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

    // Add particles effect for wave mode
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

  draw();
}

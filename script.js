const fileInput = document.getElementById("fileInput");
const audio = document.getElementById("audio");
const canvas = document.getElementById("visualizer");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = 300;

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
    requestAnimationFrame(draw);

    analyser.getByteFrequencyData(dataArray);

    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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

  draw();
}

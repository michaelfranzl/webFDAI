const fdai = document.createElement('web-fdai');

fdai.addEventListener('ready', () => {
  fdai.roll = 330 / 360 * 2 * Math.PI;
  fdai.pitch = 14 / 360 * 2 * Math.PI;
  fdai.yaw = 34 / 360 * 2 * Math.PI;
  fdai.render();

  const t0 = performance.now();

  setInterval(() => {
    const t = performance.now();
    const d = (t - t0) % 15000;

    if (d >= 0 && d < 5000) fdai.roll += 0.008
    else if (d >= 5000 && d < 10000) fdai.yaw += 0.008
    else if (d >= 10000 && d < 15000) fdai.pitch += 0.008
    else {
      fdai.roll += 0.002;
      fdai.pitch += 0.003;
      fdai.yaw += 0.005;
    }

    fdai.rollRate = Math.sin(fdai.roll);
    fdai.pitchRate = Math.sin(fdai.pitch);
    fdai.yawRate = Math.sin(fdai.yaw);

    fdai.rollError = Math.cos(fdai.roll);
    fdai.pitchError = Math.cos(fdai.pitch);
    fdai.yawError = Math.cos(fdai.yaw);

    fdai.render();
  }, 30);
});

document.body.appendChild(fdai);

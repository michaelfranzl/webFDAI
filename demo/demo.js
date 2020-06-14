const fdai = document.createElement('web-fdai');

fdai.addEventListener('ready', () => {
  setInterval(() => {
    fdai.roll += 0.002;
    fdai.pitch += 0.008;
    fdai.yaw += 0.004;

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

function showCTA() {
  player.pause();
  ctaFrame.style.display = "flex";
  ctaFrame.innerHTML = `
    <iframe src="${window.CTA_URL}" allowfullscreen></iframe>
  `;
}

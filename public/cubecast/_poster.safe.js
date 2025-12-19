/* === SAFE POSTER + VIDEO WIRING (NO MODULES) === */
(function () {
  try {
    var videos = document.querySelectorAll("video");

    videos.forEach(function (video) {
      var src = video.getAttribute("src");
      if (!src) return;

      var poster = src
        .replace("/videos/", "/thumbs/")
        .replace(/\.mp4$/, ".jpg");

      video.setAttribute("poster", poster);

      video.addEventListener("play", function () {
        video.classList.add("is-playing");
      });
    });
  } catch (e) {
    console.error("[cubecast poster wiring failed]", e);
  }
})();

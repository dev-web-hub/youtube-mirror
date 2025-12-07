function cubeLog(eventType, product = "") {
  const session =
    localStorage.getItem("cube_session") ||
    (() => {
      const id = crypto.randomUUID();
      localStorage.setItem("cube_session", id);
      return id;
    })();

  fetch("/log", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: eventType,
      product: product,
      session: session
    })
  }).catch(() => {});
}

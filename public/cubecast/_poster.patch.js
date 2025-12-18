// === POSTER ATTACHMENT (no black flash, per-video thumbs) ===
function posterFor(src){
  return src.replace('/videos/', '/thumbs/').replace(/\.mp4$/, '.jpg');
}

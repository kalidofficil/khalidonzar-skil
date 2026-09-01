// Static server with HTTP Range support, which the scroll-linked scenes need.
//
// `python3 -m http.server` ignores the Range header and answers 200 with the
// whole file. Chromium then reports `video.seekable` as an empty range and
// silently refuses every currentTime assignment — so the journey still swaps
// scenes on scroll, but no scene ever scrubs. It looks like a broken site and
// is not one. GitHub Pages, Netlify, Vercel and Cloudflare all serve ranges.
//
//   node scripts/serve.js [port]      → http://localhost:8000

const http = require("http"), fs = require("fs"), path = require("path"), url = require("url");

const ROOT = path.resolve(__dirname, "..");
const PORT = Number(process.argv[2]) || 8000;
const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript",
  ".mp4": "video/mp4", ".webm": "video/webm", ".jpg": "image/jpeg", ".png": "image/png",
  ".svg": "image/svg+xml", ".woff2": "font/woff2", ".vtt": "text/vtt",
  ".xml": "application/xml", ".txt": "text/plain", ".json": "application/json"
};

http.createServer(function (req, res) {
  var rel = decodeURIComponent(url.parse(req.url).pathname);
  var file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, "index.html");
  if (!fs.existsSync(file)) { res.writeHead(404); return res.end("Not found"); }

  var size = fs.statSync(file).size;
  var type = MIME[path.extname(file)] || "application/octet-stream";
  var range = req.headers.range;

  if (range) {
    var m = /bytes=(\d*)-(\d*)/.exec(range) || [];
    var start = m[1] ? parseInt(m[1], 10) : 0;
    var end = m[2] ? parseInt(m[2], 10) : size - 1;
    if (start >= size || end >= size) {
      res.writeHead(416, { "Content-Range": "bytes */" + size });
      return res.end();
    }
    res.writeHead(206, {
      "Content-Range": "bytes " + start + "-" + end + "/" + size,
      "Accept-Ranges": "bytes", "Content-Length": end - start + 1, "Content-Type": type
    });
    fs.createReadStream(file, { start: start, end: end }).pipe(res);
  } else {
    res.writeHead(200, { "Content-Length": size, "Content-Type": type, "Accept-Ranges": "bytes" });
    fs.createReadStream(file).pipe(res);
  }
}).listen(PORT, function () {
  console.log("Khalid Ounzar portfolio → http://localhost:" + PORT);
});


/*
 * Memory Allocation Simulator
 * Local HTTP Server
 * Team 3 - HAYTHAM
 */

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");

const PORT = 3000;
const HOST = "127.0.0.1";
const PUBLIC_DIR = path.join(__dirname, "public");

const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
    const requestPath = (req.url || "/").split("?")[0];

    let decodedPath;

    try {
        decodedPath = decodeURIComponent(requestPath);
    } catch {
        res.writeHead(400);
        res.end("Bad Request");
        return;
    }

    const relativePath =
        decodedPath === "/" ? "index.html" : decodedPath;

    const filePath = path.resolve(
        PUBLIC_DIR,
        "." + path.sep + relativePath.replace(/^[/\\]+/, "")
    );

    const relative = path.relative(PUBLIC_DIR, filePath);

    if (
        relative === ".." ||
        relative.startsWith(".." + path.sep) ||
        path.isAbsolute(relative)
    ) {
        res.writeHead(403);
        res.end("Forbidden");
        return;
    }

    if (!["GET", "HEAD"].includes(req.method)) {
        res.writeHead(405, { Allow: "GET, HEAD" });
        res.end("Method Not Allowed");
        return;
    }

    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404);
            res.end("Not Found");
            return;
        }

        const contentType =
            mimeTypes[path.extname(filePath).toLowerCase()] ||
            "application/octet-stream";

        res.writeHead(200, {
            "Content-Type": contentType,
            "X-Content-Type-Options": "nosniff"
        });

        if (req.method === "HEAD") {
            res.end();
            return;
        }

        const stream = fs.createReadStream(filePath);
        stream.on("error", () => res.destroy());
        stream.pipe(res);
    });
});

server.listen(PORT, HOST, () => {
    console.log(
        `Memory Simulator running at http://${HOST}:${PORT}`
    );
});

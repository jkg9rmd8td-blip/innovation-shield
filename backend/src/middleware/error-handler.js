function isV2Request(req) {
  const p = req.originalUrl || req.url || "";
  return p.startsWith("/api/v2") || p.startsWith("/api/");
}

export function notFound(req, res) {
  if (isV2Request(req)) {
    return res.status(404).json({
      error: { code: "NOT_FOUND", message: "Resource not found", details: null },
    });
  }

  return res.status(404).json({ error: "NOT_FOUND" });
}

export function errorHandler(err, req, res, _next) {
  console.error(err);
  const status = err.statusCode || 500;
  const code = err.code || "INTERNAL_ERROR";
  const message = err.message || "Unexpected error";
  const details = err.details || null;

  if (isV2Request(req)) {
    return res.status(status).json({
      error: { code, message, details },
    });
  }

  return res.status(status).json({ error: code, message });
}

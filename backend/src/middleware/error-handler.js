export function notFound(_req, res) {
  res.status(404).json({ error: "NOT_FOUND" });
}

export function errorHandler(err, _req, res, _next) {
  console.error(err);
  const status = err.statusCode || 500;
  res.status(status).json({
    error: err.code || "INTERNAL_ERROR",
    message: err.message || "Unexpected error"
  });
}

export function ok(res, data, meta = {}) {
  return res.json({ data, meta });
}

export function created(res, data, meta = {}) {
  return res.status(201).json({ data, meta });
}

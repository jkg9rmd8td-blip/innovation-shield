export function composeMiddleware(middlewares = []) {
  return async (ctx, finalHandler) => {
    let idx = -1;

    async function dispatch(i) {
      if (i <= idx) throw new Error("next() called multiple times");
      idx = i;
      const fn = i === middlewares.length ? finalHandler : middlewares[i];
      if (!fn) return undefined;
      return fn(ctx, () => dispatch(i + 1));
    }

    return dispatch(0);
  };
}

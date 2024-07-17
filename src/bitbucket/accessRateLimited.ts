const rateLimitMillis = 50;
let lastRequest: number | null = null;

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function accessRateLimited<T>(ident: string, fct: () => Promise<T>): Promise<T> {
  const now = new Date().getTime();
  const diffToNow = now - (lastRequest ?? now);
  if (lastRequest !== null && diffToNow < rateLimitMillis) {
    //console.log("sleeping", {diffToNow, request: ident})
    await sleep(diffToNow);
    return accessRateLimited(ident, fct);
  } else {
    console.log("done", ident);
    lastRequest = now;
    return fct();
  }
}

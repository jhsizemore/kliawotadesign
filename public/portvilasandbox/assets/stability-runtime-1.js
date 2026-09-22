// Runtime guards kept separate from the preserved upstream bundle.
export async function deadline(promise, ms, message) {
  let timer;
  try {
    return await Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error(message)), ms);
    })]);
  } finally { clearTimeout(timer); }
}

export async function loadMap(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) throw new Error('The packaged map could not be loaded.');
    return await response.json();
  } finally { clearTimeout(timer); }
}

export function openStorage() {
  return new Promise((resolve, reject) => {
    let settled = false;
    const request = indexedDB.open('port-vila-sandbox', 1);
    const fail = (error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      reject(error);
    };
    const timer = setTimeout(() => fail(new Error('Browser storage took too long to open.')), 4000);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('scenarios')) request.result.createObjectStore('scenarios');
    };
    request.onsuccess = () => {
      if (settled) { request.result.close(); return; }
      settled = true;
      clearTimeout(timer);
      request.result.onversionchange = () => request.result.close();
      resolve(request.result);
    };
    request.onerror = () => fail(request.error);
    request.onblocked = () => fail(new Error('Browser storage is busy in another tab.'));
  });
}

export function startRenderLoop(city, render, failed) {
  let stopped = false;
  let downgraded = false;
  const stop = () => {
    if (stopped) return;
    stopped = true;
    city.renderer.setAnimationLoop(null);
  };
  const recover = (error) => {
    if (stopped) return;
    console.warn('Port Vila renderer stopped', error);
    stop();
    failed();
  };
  const frame = () => {
    if (stopped) return;
    try { render(); }
    catch (error) {
      if (!downgraded) {
        downgraded = true;
        try {
          city.finish = undefined;
          city.setQuality('low');
          render();
          return;
        } catch (retryError) { recover(retryError); }
      } else recover(error);
    }
  };
  // Validate the first frame before dismissing the loader.
  try { render(); }
  catch (error) {
    city.finish = undefined;
    city.setQuality('low');
    downgraded = true;
    render();
  }
  city.canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    recover(new Error('Graphics context lost'));
  });
  city.renderer.onDeviceLost = () => recover(new Error('Graphics device lost'));
  window.addEventListener('pagehide', stop, { once: true });
  window.addEventListener('pageshow', (event) => {
    if (event.persisted && stopped) {
      stopped = false;
      city.lastFrame = performance.now();
      city.renderer.setAnimationLoop(frame);
    }
  });
  city.renderer.setAnimationLoop(frame);
}

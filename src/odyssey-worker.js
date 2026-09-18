/* Keep the original site worker and its unrelated asset routes intact. */
import site from './index.js';
import { handleSync } from './odyssey-sync.mjs';
export { OdysseyArtWorkspace } from './odyssey-sync.mjs';
export default {
  async fetch(request, env, ctx) {
    const response = await handleSync(request, env);
    return response || site.fetch(request, env, ctx);
  }
};

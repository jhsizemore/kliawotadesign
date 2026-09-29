/* Keep the original site worker and its unrelated asset routes intact. */
import site from './index.js';
import { handleSync } from './odyssey-sync.mjs';
import { routePlacements } from './odyssey-placement.mjs';
import { routeContact } from './odyssey-contact.mjs';
import { routeSubscriptions } from './odyssey-subscriptions.mjs';
export { OdysseyArtWorkspace } from './odyssey-sync.mjs';
export default {
  async fetch(request, env, ctx) {
    const response = await routeSubscriptions(request, env) || await routeContact(request, env) || await routePlacements(request, env) || await handleSync(request, env);
    return response || site.fetch(request, env, ctx);
  }
};

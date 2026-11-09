import { clientsClaim, setCacheNameDetails } from 'workbox-core';
import { PrecacheController, PrecacheRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { NavigationRoute, registerRoute } from 'workbox-routing';
import { RangeRequestsPlugin } from 'workbox-range-requests';

// Scope-specific names keep this game's cache separate from other GitHub Pages apps.
setCacheNameDetails({ prefix: 'mizhu-bump-2048', suffix: self.registration.scope });
const precache = new PrecacheController({ plugins: [new RangeRequestsPlugin()] });
precache.precache(self.__WB_MANIFEST);
registerRoute(new PrecacheRoute(precache));

const scopePath = new URL(self.registration.scope).pathname;
const escapedPath = scopePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
registerRoute(new NavigationRoute(precache.createHandlerBoundToURL('index.html'), {
  allowlist: [new RegExp(`^${escapedPath}`)],
}));

cleanupOutdatedCaches();
clientsClaim();
// Keep updates waiting until the player explicitly chooses to reload.
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

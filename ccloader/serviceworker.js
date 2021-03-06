self.importScripts(
	'/ccloader/js/lib/jszip.min.js',
	'/ccloader/js/packed.js',
);

// eslint-disable-next-line no-undef
const packedManger = new PackedManager();
const packedMods = [];


self.addEventListener('install', () => {
	self.skipWaiting();
});

self.addEventListener('activate', () => {
	self.clients.claim();
});

self.addEventListener('message', (event) => {
	packedMods.splice(0);
	packedMods.push(...event.data);

	event.waitUntil((async () => {
		const keys = await caches.keys();
		await Promise.all(keys.map(name => caches.delete(name)));
	})());
});

self.addEventListener('fetch', (event) => {
	/** @type {Request} */
	const request = event.request;
	const path = new URL(request.url).pathname;

	if (request.headers.has('X-Cmd')) {
		try {
			switch (request.headers.get('X-Cmd')) {
			case 'getFiles':
				event.respondWith((async () => new Response(JSON.stringify(
					await packedManger.getFiles(path)),
				{status: 200}))());
				break;
			case 'isDirectory':
				event.respondWith((async () => new Response(JSON.stringify(
					await packedManger.isDirectory(path)),
				{status: 200}))());
				break;
			}
		} catch (e) {
			console.error('An error occured while inspecting a packed mod', e);
		}
	}

	if (path.startsWith('/assets/mods/') && packedMods.includes(packedManger.packedName(path))) {
		//console.log('Handling fetch event for', packedManger.packedName(path), '(', packedManger._zipPath(path), '): ', packedManger._assetPath(path));

		event.respondWith(packedManger.get(path));
	}
});

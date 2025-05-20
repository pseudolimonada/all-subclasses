const CACHE_NAME = 'image-gallery-cache-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/classes/Barbarian.png',
  '/classes/Cleric.png',
  '/classes/Druid.png',
  '/classes/Fighter.png',
  '/classes/Monk.png',
  '/classes/Paladin.png',
  '/classes/Ranger.png',
  '/classes/Rogue.png',
  '/classes/Sorcerer.png',
  '/classes/Warlock.png',
  '/classes/Wizard.png',
  '/subclasses/Aberrant Sorcerer.png',
  '/subclasses/Abjurer Wizard.png',
  '/subclasses/Ancients Paladin.png',
  '/subclasses/Arcane Trickster Rogue.png',
  '/subclasses/Archfey Warlock.png',
  '/subclasses/Assassin Rogue.png',
  '/subclasses/Battle Master Fighter.png',
  '/subclasses/Beast Master Ranger.png',
  '/subclasses/Berserker Barbarian.png',
  '/subclasses/Celestial Warlock.png',
  '/subclasses/Champion Fighter.png',
  '/subclasses/Clockwork Sorcerer.png',
  '/subclasses/Dance Bard.png',
  '/subclasses/Devotion Paladin.png',
  '/subclasses/Diviner Wizard.png',
  '/subclasses/Draconic Sorcerer.png',
  '/subclasses/Eldritch Knight Fighter.png',
  '/subclasses/Elements Monk.png',
  '/subclasses/Evoker Wizard.png',
  '/subclasses/Fey Wanderer Ranger.png',
  '/subclasses/Fiend Warlock.png',
  '/subclasses/Glamour Bard.png',
  '/subclasses/Gloom Stalker Ranger.png',
  '/subclasses/Glory Paladin.png',
  '/subclasses/Great Old One Warlock.png',
  '/subclasses/Hunter Ranger.png',
  '/subclasses/Illusionist Wizard.png',
  '/subclasses/Land Druid.png',
  '/subclasses/Life Cleric.png',
  '/subclasses/Light Cleric.png',
  '/subclasses/Lore Bard.png',
  '/subclasses/Mercy Monk.png',
  '/subclasses/Moon Druid.png',
  '/subclasses/Open Hand Monk.png',
  '/subclasses/Psi Warrior Fighter.png',
  '/subclasses/Sea Druid.png',
  '/subclasses/Shadow Monk.png',
  '/subclasses/Soulknife Rogue.png',
  '/subclasses/Stars Druid.png',
  '/subclasses/Thief Rogue.png',
  '/subclasses/Trickery Cleric.png',
  '/subclasses/Valor Bard.png',
  '/subclasses/Vengeance Paladin.png',
  '/subclasses/War Cleric.png',
  '/subclasses/Wild Heart Barbarian.png',
  '/subclasses/Wild Magic Sorcerer.png',
  '/subclasses/World Tree Barbarian.png',
  '/subclasses/Zealot Barbarian.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // Cache images with a cache-first strategy
  if (event.request.url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          // Return cached response if found
          if (response) {
            return response;
          }
          
          // Otherwise fetch from network and cache
          return fetch(event.request).then(
            response => {
              // Check if we received a valid response
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }
              
              // Clone the response as it can only be consumed once
              const responseToCache = response.clone();
              
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
                });
                
              return response;
            }
          );
        })
    );
  } else {
    // Use network-first for other resources
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  }
});

// Clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

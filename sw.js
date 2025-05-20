const CACHE_NAME = 'dnd-classes-cache-v1.0.7';

// Ordered list of resources to cache with prioritization
const urlsToCache = [
  '/',
  '/index.html',
  '/style.css',
  '/script.js',
  '/image-offsets.json',
  
  // Main classes in order of appearance
  '/classes/Barbarian.png',
  '/classes/Bard.png',
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
  
  // Barbarian subclasses (first class)
  '/subclasses/Berserker Barbarian.png',
  '/subclasses/Wild Heart Barbarian.png',
  '/subclasses/World Tree Barbarian.png',
  '/subclasses/Zealot Barbarian.png',
  
  // Bard subclasses (second class)
  '/subclasses/Dance Bard.png',
  '/subclasses/Glamour Bard.png',
  '/subclasses/Lore Bard.png',
  '/subclasses/Valor Bard.png',
  
  // Remaining subclasses in order
  '/subclasses/Life Cleric.png',
  '/subclasses/Light Cleric.png',
  '/subclasses/Trickery Cleric.png',
  '/subclasses/War Cleric.png',
  
  '/subclasses/Land Druid.png',
  '/subclasses/Moon Druid.png',
  '/subclasses/Sea Druid.png',
  '/subclasses/Stars Druid.png',
  
  '/subclasses/Battle Master Fighter.png',
  '/subclasses/Champion Fighter.png',
  '/subclasses/Eldritch Knight Fighter.png',
  '/subclasses/Psi Warrior Fighter.png',
  
  '/subclasses/Mercy Monk.png',
  '/subclasses/Shadow Monk.png',
  '/subclasses/Elements Monk.png',
  '/subclasses/Open Hand Monk.png',
  
  '/subclasses/Devotion Paladin.png',
  '/subclasses/Glory Paladin.png',
  '/subclasses/Ancients Paladin.png',
  '/subclasses/Vengeance Paladin.png',
  
  '/subclasses/Beast Master Ranger.png',
  '/subclasses/Fey Wanderer Ranger.png',
  '/subclasses/Gloom Stalker Ranger.png',
  '/subclasses/Hunter Ranger.png',
  
  '/subclasses/Arcane Trickster Rogue.png',
  '/subclasses/Assassin Rogue.png',
  '/subclasses/Soulknife Rogue.png',
  '/subclasses/Thief Rogue.png',
  
  '/subclasses/Aberrant Sorcerer.png',
  '/subclasses/Clockwork Sorcerer.png',
  '/subclasses/Draconic Sorcerer.png',
  '/subclasses/Wild Magic Sorcerer.png',
  
  '/subclasses/Archfey Warlock.png',
  '/subclasses/Celestial Warlock.png',
  '/subclasses/Fiend Warlock.png',
  '/subclasses/Great Old One Warlock.png',
  
  '/subclasses/Abjurer Wizard.png',
  '/subclasses/Diviner Wizard.png',
  '/subclasses/Evoker Wizard.png',
  '/subclasses/Illusionist Wizard.png'
];

// Install event: cache resources in order of priority
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        return self.skipWaiting();
      })
  );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event: serve from cache first, then network
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request).then(
          response => {
            // Don't cache responses that aren't successful or aren't GET requests
            if (!response || response.status !== 200 || response.type !== 'basic' || 
                event.request.method !== 'GET') {
              return response;
            }

            // Clone response since it's a stream and can only be consumed once
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
});

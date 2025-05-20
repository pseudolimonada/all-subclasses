document.addEventListener("DOMContentLoaded", function() {
	// Hardcoded data for classes and their subclass descriptions.
	const classesData = {
		"Barbarian": ["Path of the Berserker", "Path of the Wild Heart", "Path of the World Tree", "Path of the Zealot"],
		"Bard": ["College of Dance", "College of Glamour", "College of Lore", "College of Valor"],
		"Cleric": ["Life Domain", "Light Domain", "Trickery Domain", "War Domain"],
		"Druid": ["Circle of the Land", "Circle of the Moon", "Circle of the Sea", "Circle of the Stars"],
		"Fighter": ["Battle Master", "Champion", "Eldritch Knight", "Psi Warrior"],
		"Monk": ["Warrior of Mercy", "Warrior of Shadow", "Warrior of the Elements", "Warrior of the Open Hand"],
		"Paladin": ["Oath of Devotion", "Oath of Glory", "Oath of the Ancients", "Oath of Vengeance"],
		"Ranger": ["Beast Master", "Fey Wanderer", "Gloom Stalker", "Hunter"],
		"Rogue": ["Arcane Trickster", "Assassin", "Soulknife", "Thief"],
		"Sorcerer": ["Aberrant Sorcery", "Clockwork Sorcery", "Draconic Sorcery", "Wild Magic Sorcery"],
		"Warlock": ["Archfey Patron", "Celestial Patron", "Fiend Patron", "Great Old One Patron"],
		"Wizard": ["Abjurer", "Diviner", "Evoker", "Illusionist"]
	};
	
	// Mapping of subclass display names to image filenames
	const subclassImageMap = {
		// Barbarian subclasses
		"Path of the Berserker": "Berserker Barbarian.png",
		"Path of the Wild Heart": "Wild Heart Barbarian.png",
		"Path of the World Tree": "World Tree Barbarian.png",
		"Path of the Zealot": "Zealot Barbarian.png",
		
		// Bard subclasses
		"College of Dance": "Dance Bard.png",
		"College of Glamour": "Glamour Bard.png",
		"College of Lore": "Lore Bard.png",
		"College of Valor": "Valor Bard.png",
		
		// Cleric subclasses
		"Life Domain": "Life Cleric.png",
		"Light Domain": "Light Cleric.png",
		"Trickery Domain": "Trickery Cleric.png",
		"War Domain": "War Cleric.png",
		
		// Druid subclasses
		"Circle of the Land": "Land Druid.png",
		"Circle of the Moon": "Moon Druid.png",
		"Circle of the Sea": "Sea Druid.png",
		"Circle of the Stars": "Stars Druid.png",
		
		// Fighter subclasses
		"Battle Master": "Battle Master Fighter.png",
		"Champion": "Champion Fighter.png",
		"Eldritch Knight": "Eldritch Knight Fighter.png",
		"Psi Warrior": "Psi Warrior Fighter.png",
		
		// Monk subclasses
		"Warrior of Mercy": "Mercy Monk.png",
		"Warrior of Shadow": "Shadow Monk.png",
		"Warrior of the Elements": "Elements Monk.png",
		"Warrior of the Open Hand": "Open Hand Monk.png",
		
		// Paladin subclasses
		"Oath of Devotion": "Devotion Paladin.png",
		"Oath of Glory": "Glory Paladin.png",
		"Oath of the Ancients": "Ancients Paladin.png",
		"Oath of Vengeance": "Vengeance Paladin.png",
		
		// Ranger subclasses
		"Beast Master": "Beast Master Ranger.png",
		"Fey Wanderer": "Fey Wanderer Ranger.png",
		"Gloom Stalker": "Gloom Stalker Ranger.png",
		"Hunter": "Hunter Ranger.png",
		
		// Rogue subclasses
		"Arcane Trickster": "Arcane Trickster Rogue.png",
		"Assassin": "Assassin Rogue.png",
		"Soulknife": "Soulknife Rogue.png",
		"Thief": "Thief Rogue.png",
		
		// Sorcerer subclasses
		"Aberrant Sorcery": "Aberrant Sorcerer.png",
		"Clockwork Sorcery": "Clockwork Sorcerer.png",
		"Draconic Sorcery": "Draconic Sorcerer.png",
		"Wild Magic Sorcery": "Wild Magic Sorcerer.png",
		
		// Warlock subclasses
		"Archfey Patron": "Archfey Warlock.png",
		"Celestial Patron": "Celestial Warlock.png",
		"Fiend Patron": "Fiend Warlock.png",
		"Great Old One Patron": "Great Old One Warlock.png",
		
		// Wizard subclasses
		"Abjurer": "Abjurer Wizard.png",
		"Diviner": "Diviner Wizard.png",
		"Evoker": "Evoker Wizard.png",
		"Illusionist": "Illusionist Wizard.png"
	};
	
	// Get subclass image path based on subclass name
	function getSubclassImagePath(subclass) {
		const filename = subclassImageMap[subclass];
		if (filename) {
			return `subclasses/${filename}`;
		}
		console.error(`No image mapping found for subclass: ${subclass}`);
		return null;
	}
	
	let currentClassIndex = 0;
	let currentSubclassIndex = 0;
	let isTransitioning = false;
	let pendingCleanup = [];
	let imageOffsets = {}; // Will store the image offset configuration

	// Load the image offset configuration
	fetch('image-offsets.json')
		.then(response => response.json())
		.then(data => {
			imageOffsets = data;
			console.log("Loaded image offset configuration");
		})
		.catch(error => {
			console.warn("Could not load image offset configuration:", error);
		});

	function getImageOffset(filename) {
		// Extract the filename without extension
		const basename = filename.replace(/\.[^/.]+$/, "");
		
		// Check if we have an offset for this image
		if (imageOffsets[basename] !== undefined) {
			return imageOffsets[basename];
		}
		
		// No specific offset found, return 0 (no adjustment)
		return 0;
	}

	function createViewer() {
		const container = document.createElement('div');
		container.className = 'viewer-container';

		// Add title for main window
		const mainTitle = document.createElement('h1');
		mainTitle.className = 'main-title';
		mainTitle.textContent = 'Classes';
		container.appendChild(mainTitle);

		const classViewer = document.createElement('div');
		classViewer.className = 'class-viewer';

		const prevBtn = document.createElement('button');
		prevBtn.className = 'nav-arrow nav-prev';
		const prevSpan = document.createElement('span');
		prevSpan.innerHTML = '❮';
		prevBtn.appendChild(prevSpan);
		prevBtn.onclick = showPrevClass;

		const nextBtn = document.createElement('button');
		nextBtn.className = 'nav-arrow nav-next';
		const nextSpan = document.createElement('span');
		nextSpan.innerHTML = '❯';
		nextBtn.appendChild(nextSpan);
		nextBtn.onclick = showNextClass;

		container.appendChild(prevBtn);
		container.appendChild(classViewer);
		container.appendChild(nextBtn);

		const subclassContainer = document.createElement('div');
		subclassContainer.className = 'subclass-container';

		document.body.appendChild(container);
		document.body.appendChild(subclassContainer);

		return { classViewer, subclassContainer };
	}

	const { classViewer, subclassContainer } = createViewer();
	const classes = Object.keys(classesData);

	function createClassItem(className, isActive = false) {
		const item = document.createElement('div');
		item.className = `class-item ${isActive ? 'active' : ''}`;
		
		const img = document.createElement('img');
		img.src = `classes/${className}.png`;
		img.alt = className;
		
		const caption = document.createElement('div');
		caption.className = 'class-caption';
		caption.textContent = className;
		
		item.appendChild(img);
		item.appendChild(caption);
		
		item.addEventListener('click', () => showSubclasses(className));
		
		return item;
	}

	function createPreviewItem(className, direction) {
		const item = document.createElement('div');
		item.className = `preview-item ${direction}`;
		
		const img = document.createElement('img');
		img.src = `classes/${className}.png`;
		img.alt = `Preview of ${className}`;
		
		item.appendChild(img);
		return item;
	}

	function cleanupPendingTransitions() {
		pendingCleanup.forEach(timeout => clearTimeout(timeout));
		pendingCleanup = [];
		const staleItems = document.querySelectorAll('.class-item:not(.active)');
		staleItems.forEach(item => item.remove());
	}

	function showClass(index, direction = 'right') {
		if (isTransitioning) {
			cleanupPendingTransitions();
		}
		
		isTransitioning = true;
		
		// Get current item before clearing
		const currentItem = classViewer.querySelector('.class-item.active');
		
		// Add slide-out class to current item if it exists
		if (currentItem) {
			currentItem.classList.add(`slide-${direction === 'right' ? 'left' : 'right'}`);
			currentItem.classList.remove('active');
			
			// Delay removing current item to allow for animation
			const removeCurrentItem = setTimeout(() => {
				currentItem.remove();
			}, 500); // Slightly longer to ensure smooth transition
			pendingCleanup.push(removeCurrentItem);
		}
		
		// Add previews
		const prevIndex = (index - 1 + classes.length) % classes.length;
		const nextIndex = (index + 1) % classes.length;
		
		// Clear any existing preview items
		const existingPreviews = classViewer.querySelectorAll('.preview-item');
		existingPreviews.forEach(preview => preview.remove());
		
		classViewer.appendChild(createPreviewItem(classes[prevIndex], 'left'));
		classViewer.appendChild(createPreviewItem(classes[nextIndex], 'right'));
		
		// Create new item but don't make it active right away
		const newItem = createClassItem(classes[index], false);
		newItem.classList.add(`slide-${direction}`);
		classViewer.appendChild(newItem);
		
		// Force reflow before starting animation
		newItem.offsetHeight;
		
		// Use requestAnimationFrame for smoother transition timing
		requestAnimationFrame(() => {
			requestAnimationFrame(() => {
				newItem.classList.remove(`slide-${direction}`);
				newItem.classList.add('active');
			});
		});
		
		const transitionEnd = setTimeout(() => {
			isTransitioning = false;
		}, 800);
		pendingCleanup.push(transitionEnd);
	}

	function showPrevClass() {
		if (!isTransitioning) {
			currentClassIndex = (currentClassIndex - 1 + classes.length) % classes.length;
			showClass(currentClassIndex, 'left');
		}
	}

	function showNextClass() {
		if (!isTransitioning) {
			currentClassIndex = (currentClassIndex + 1) % classes.length;
			showClass(currentClassIndex, 'right');
		}
	}

	function showSubclasses(className) {
		const subclasses = classesData[className];
		currentSubclassIndex = 0;
		
		// Make sure to remove the hidden class that gets added when closing
		subclassContainer.classList.remove('hidden');
		
		// Reset container before showing
		subclassContainer.innerHTML = '';
		
		// Add title for subclass window
		const subclassTitle = document.createElement('h1');
		subclassTitle.className = 'subclass-title';
		subclassTitle.textContent = `${className} Subclasses`;
		subclassContainer.appendChild(subclassTitle);
		
		const viewer = document.createElement('div');
		viewer.className = 'subclass-viewer';
		
		const prevBtn = document.createElement('button');
		prevBtn.className = 'nav-arrow nav-prev';
		const prevSpan = document.createElement('span');
		prevSpan.innerHTML = '❮';
		prevBtn.appendChild(prevSpan);
		
		const nextBtn = document.createElement('button');
		nextBtn.className = 'nav-arrow nav-next';
		const nextSpan = document.createElement('span');
		nextSpan.innerHTML = '❯';
		nextBtn.appendChild(nextSpan);
		
		const closeBtn = document.createElement('button');
		closeBtn.className = 'close-button';
		const closeSpan = document.createElement('span');
		closeSpan.innerHTML = '×';
		closeBtn.appendChild(closeSpan);
		
		function showSubclass(index, direction = 'right') {
			if (isTransitioning) {
				cleanupPendingTransitions();
			}
			
			isTransitioning = true;
			const viewer = document.querySelector('.subclass-viewer');
			
			// Store current item references before any DOM changes
			const currentItem = viewer.querySelector('.class-item.active');
			const subclasses = classesData[classes[currentClassIndex]];
			
			// Create new item first but don't add to DOM yet
			const subclass = subclasses[index];
			const item = document.createElement('div');
			item.className = 'class-item'; // Start without active class
			
			// Create image container
			const imageContainer = document.createElement('div');
			imageContainer.className = 'image-container';
			
			const img = document.createElement('img');
			
			// Use the mapping function to get the image path
			const imagePath = getSubclassImagePath(subclass);
			if (imagePath) {
				img.src = imagePath;
				img.onerror = () => {
					console.error(`Failed to load image: ${imagePath}`);
					// Try fallback options if the mapped filename doesn't work
					const fallbacks = formatSubclassFilename(subclass, classes[currentClassIndex]);
					let fallbackIndex = 0;
					
					function tryFallback() {
						if (fallbackIndex >= fallbacks.length) {
							console.error("All image loading attempts failed for: " + subclass);
							return;
						}
						
						const fallbackPath = `subclasses/${fallbacks[fallbackIndex]}`;
						console.log(`Trying fallback: ${fallbackPath}`);
						img.src = fallbackPath;
						fallbackIndex++;
					}
					
					img.onerror = tryFallback;
					tryFallback();
				};
				
				img.onload = () => {
					// Apply appropriate offset when the image is loaded
					const offset = getImageOffset(img.src.split('/').pop());
					if (offset !== 0) {
						img.style.transform = `translateX(${offset}%)`;
					}
				};
			} else {
				console.error(`No image path found for subclass: ${subclass}`);
			}
			
			const caption = document.createElement('div');
			caption.className = 'class-caption';
			caption.textContent = subclass;
			
			// Change append order to use container
			imageContainer.appendChild(img);
			imageContainer.appendChild(caption);
			item.appendChild(imageContainer);
			
			// Add slide class before appending to DOM
			item.classList.add(`slide-${direction}`);
			
			// Handle the exit animation for the current item
			if (currentItem) {
				// Start exit animation
				currentItem.classList.add(`slide-${direction === 'right' ? 'left' : 'right'}`);
				currentItem.classList.remove('active');
				
				// Add new item after starting current item animation
				viewer.appendChild(item);
				
				// Schedule removal with the same timing as in showClass
				const removeCurrentItem = setTimeout(() => {
					currentItem.remove();
				}, 500);
				pendingCleanup.push(removeCurrentItem);
			} else {
				// No current item, just add the new one
				viewer.appendChild(item);
			}
			
			// Force reflow
			item.offsetHeight;
			
			// Use two RAF calls for smoother animation timing
			requestAnimationFrame(() => {
				requestAnimationFrame(() => {
					// Add active class to trigger transition
					item.classList.remove(`slide-${direction}`);
					item.classList.add('active');
				});
			});
			
			const transitionEnd = setTimeout(() => {
				isTransitioning = false;
			}, 800);
			pendingCleanup.push(transitionEnd);
		}
		
		prevBtn.onclick = () => {
			if (!isTransitioning) { // Add the same check as in showPrevClass/showNextClass
				currentSubclassIndex = (currentSubclassIndex - 1 + subclasses.length) % subclasses.length;
				showSubclass(currentSubclassIndex, 'left');
			}
		};
		
		nextBtn.onclick = () => {
			if (!isTransitioning) { // Add the same check as in showPrevClass/showNextClass
				currentSubclassIndex = (currentSubclassIndex + 1) % subclasses.length;
				showSubclass(currentSubclassIndex, 'right');
			}
		};
		
		closeBtn.onclick = function(event) {
			// Prevent event bubbling
			event.stopPropagation();
			event.preventDefault();
			
			console.log("Close button clicked");
			
			// Force cleanup regardless of transition state
			cleanupPendingTransitions();
			isTransitioning = false;
			
			// Remove the active class to hide the container
			subclassContainer.classList.remove('active');
			
			// Additional class to ensure the container gets hidden
			// We'll remove this class in showSubclasses
			subclassContainer.classList.add('hidden');
			
			// Reset state and clean up any content immediately
			const viewer = document.querySelector('.subclass-viewer');
			if (viewer) {
				// Clear the content after a very short delay
				setTimeout(() => {
					viewer.innerHTML = '';
					console.log("Viewer content cleared");
				}, 50);
			}
			
			console.log("Subclass container close sequence completed");
		};
		
		subclassContainer.appendChild(prevBtn);
		subclassContainer.appendChild(viewer);
		subclassContainer.appendChild(nextBtn);
		subclassContainer.appendChild(closeBtn);
		
		showSubclass(0);
		
		// Make sure the active class is added after hidden is removed
		// Use a slight delay to ensure proper transition
		setTimeout(() => {
			subclassContainer.classList.add('active');
		}, 10);
	}

	// Initialize with first class
	showClass(0);
});

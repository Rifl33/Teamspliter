document.addEventListener('DOMContentLoaded', () => {
    const profilesGrid = document.querySelector('.profiles-grid');
    const profileSearch = document.getElementById('profileSearch');
    const exportProfilesBtn = document.getElementById('exportProfiles');
    const importProfilesBtn = document.getElementById('importProfilesBtn');
    const importProfilesInput = document.getElementById('importProfiles');
    const newProfileForm = document.getElementById('newProfileForm');
    const saveDataBtn = document.getElementById('saveDataBtn');
    const loadDataBtn = document.getElementById('loadDataBtn');
    const loadDataInput = document.getElementById('loadDataInput');

    let savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || {};
    let selectedPlayers = [];

    console.log('Initial saved profiles:', savedProfiles);

    if (!profilesGrid) {
        console.error('Could not find profiles grid element!');
    }

    // Test function to add a sample profile
    function addTestProfile() {
        savedProfiles = {
            "Test Player": {
                offense: 8,
                defense: 7
            }
        };
        localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
        renderProfiles();
    }

    // If there are no profiles, add a test one
    if (Object.keys(savedProfiles).length === 0) {
        addTestProfile();
    }

    // Render profiles
    function renderProfiles(searchTerm = '') {
        const filteredProfiles = Object.entries(savedProfiles)
            .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()));

        console.log('Rendering profiles:', filteredProfiles);

        profilesGrid.innerHTML = filteredProfiles
            .map(([name, profile]) => `
                <div class="profile-detail-card">
                    <div class="profile-header">
                        <h3>${name}</h3>
                        <div class="profile-actions">
                            <button onclick="editProfile('${name}')" class="secondary-btn">Edit</button>
                            <button onclick="deleteProfile('${name}')" class="delete-btn">Delete</button>
                        </div>
                    </div>
                    <div class="profile-stats">
                        <div class="stat-item">
                            <div class="stat-label">Offense</div>
                            <div class="stat-value">${profile.offense}</div>
                        </div>
                        <div class="stat-item">
                            <div class="stat-label">Defense</div>
                            <div class="stat-value">${profile.defense}</div>
                        </div>
                    </div>
                    <div class="game-actions">
                        <label class="checkbox-wrapper">
                            <input type="checkbox" 
                                class="player-select"
                                data-player="${name}"
                                ${selectedPlayers.includes(name) ? 'checked' : ''}>
                            Select for Game
                        </label>
                        <button onclick="addToCurrentGame('${name}')" class="primary-btn">Add to Current Game</button>
                    </div>
                </div>
            `).join('');

        // Add event listeners to checkboxes after rendering
        document.querySelectorAll('.player-select').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const playerName = e.target.dataset.player;
                console.log('Checkbox changed for:', playerName); // Debug
                if (e.target.checked) {
                    if (!selectedPlayers.includes(playerName)) {
                        selectedPlayers.push(playerName);
                        console.log('Added player:', playerName);
                    }
                } else {
                    const index = selectedPlayers.indexOf(playerName);
                    if (index > -1) {
                        selectedPlayers.splice(index, 1);
                        console.log('Removed player:', playerName);
                    }
                }
                localStorage.setItem('selectedPlayers', JSON.stringify(selectedPlayers)); // Persist selection
                updateGenerateButton();
            });
        });
        
        updateStats();
        updateGenerateButton();
    }

    // Update statistics
    function updateStats() {
        const profiles = Object.values(savedProfiles);
        const totalProfiles = profiles.length;
        const avgOffense = profiles.reduce((sum, p) => sum + p.offense, 0) / totalProfiles || 0;
        const avgDefense = profiles.reduce((sum, p) => sum + p.defense, 0) / totalProfiles || 0;

        document.getElementById('totalProfiles').textContent = totalProfiles;
        document.getElementById('avgOffense').textContent = avgOffense.toFixed(1);
        document.getElementById('avgDefense').textContent = avgDefense.toFixed(1);
    }

    // Search functionality
    profileSearch.addEventListener('input', (e) => {
        renderProfiles(e.target.value);
    });

    // Add new profile
    newProfileForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('profileName').value;
        const offense = parseInt(document.getElementById('profileOffense').value);
        const defense = parseInt(document.getElementById('profileDefense').value);

        if (savedProfiles[name] && !confirm(`Profile "${name}" already exists. Do you want to update it?`)) {
            return;
        }

        savedProfiles[name] = { offense, defense };
        localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
        renderProfiles();
        newProfileForm.reset();
        showNotification(`Profile ${name} has been ${savedProfiles[name] ? 'updated' : 'created'}!`);
    });

    // Edit profile
    window.editProfile = (name) => {
        const profile = savedProfiles[name];
        const newOffense = prompt('Enter new offense rating (1-10):', profile.offense);
        const newDefense = prompt('Enter new defense rating (1-10):', profile.defense);

        if (newOffense !== null && newDefense !== null) {
            const offense = parseInt(newOffense);
            const defense = parseInt(newDefense);

            if (offense >= 1 && offense <= 10 && defense >= 1 && defense <= 10) {
                savedProfiles[name] = { offense, defense };
                localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
                renderProfiles();
                showNotification(`Profile ${name} has been updated!`);
            } else {
                alert('Please enter valid ratings between 1 and 10');
            }
        }
    };

    // Delete profile
    window.deleteProfile = (name) => {
        if (confirm(`Are you sure you want to delete ${name}'s profile?`)) {
            delete savedProfiles[name];
            localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
            renderProfiles();
            showNotification(`Profile ${name} has been deleted!`);
        }
    };

    // Add to current game
    window.addToCurrentGame = (name) => {
        const profile = savedProfiles[name];
        const activeGamePlayers = JSON.parse(localStorage.getItem('activeGamePlayers') || '[]');
        
        if (activeGamePlayers.some(player => player.name === name)) {
            alert('This player is already in the current game!');
            return;
        }
        
        activeGamePlayers.push({
            name,
            offense: profile.offense,
            defense: profile.defense
        });
        
        localStorage.setItem('activeGamePlayers', JSON.stringify(activeGamePlayers));
        
        const card = document.querySelector(`[data-profile="${name}"]`);
        if (card) {
            card.classList.add('added');
            setTimeout(() => card.classList.remove('added'), 300);
        }
        
        showNotification(`${name} added to current game!`);
    };

    // Export/Import functionality
    exportProfilesBtn.addEventListener('click', () => {
        const dataStr = JSON.stringify(savedProfiles, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'team-balancer-profiles.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    });

    importProfilesBtn.addEventListener('click', () => {
        importProfilesInput.click();
    });

    importProfilesInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedProfiles = JSON.parse(e.target.result);
                    savedProfiles = { ...savedProfiles, ...importedProfiles };
                    localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
                    renderProfiles();
                    showNotification('Profiles imported successfully!');
                } catch (error) {
                    alert('Invalid profile file format');
                }
            };
            reader.readAsText(file);
        }
    });

    // Notification system
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
            setTimeout(() => {
                notification.classList.remove('show');
                setTimeout(() => notification.remove(), 300);
            }, 2000);
        }, 100);
    }

    // Update generate button state
    function updateGenerateButton() {
        const generateBtn = document.getElementById('generateGameBtn');
        const selectedCount = document.getElementById('selectedCount');
        console.log('Selected players:', selectedPlayers); // Debug log
        selectedCount.textContent = selectedPlayers.length;
        generateBtn.disabled = selectedPlayers.length < 2;
    }

    // Generate game and redirect
    const generateGameBtn = document.getElementById('generateGameBtn');
    console.log('Generate button found:', generateGameBtn); // Debug log

    generateGameBtn.addEventListener('click', () => {
        console.log('Generate button clicked'); // Debug log
        console.log('Selected players:', selectedPlayers); // Debug log

        if (selectedPlayers.length < 2) {
            alert('Please select at least 2 players');
            return;
        }

        // Create player objects from selected players
        const gamePlayers = selectedPlayers.map(name => ({
            name,
            offense: savedProfiles[name].offense,
            defense: savedProfiles[name].defense
        }));

        console.log('Game players created:', gamePlayers); // Debug log

        // Save to localStorage
        localStorage.setItem('activeGamePlayers', JSON.stringify(gamePlayers));
        localStorage.setItem('generateTeamsOnLoad', 'true');

        // Show notification before redirect
        showNotification('Generating teams...');

        // Add a small delay before redirect to ensure data is saved
        setTimeout(() => {
            // Redirect to index.html
            window.location.href = 'index.html';
        }, 100);
    });

    // Save all game data
    saveDataBtn.addEventListener('click', () => {
        GameData.saveGameData();
        showNotification('All game data saved to file!');
    });

    // Load data button click
    loadDataBtn.addEventListener('click', () => {
        loadDataInput.click();
    });

    // Handle file selection for loading data
    loadDataInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (file) {
            const success = await GameData.loadGameData(file);
            if (success) {
                savedProfiles = JSON.parse(localStorage.getItem('savedProfiles') || '{}');
                renderProfiles();
                showNotification('Game data loaded successfully!');
            } else {
                alert('Error loading game data');
            }
        }
    });

    // Initialize with immediate render
    setTimeout(() => {
        renderProfiles();
        console.log('Profiles rendered after timeout');
    }, 100);

    // Load selected players from localStorage
    function loadSelectedPlayers() {
        selectedPlayers = JSON.parse(localStorage.getItem('selectedPlayers') || '[]');
        console.log('Loaded selected players:', selectedPlayers);
    }

    // Call this when the page loads
    loadSelectedPlayers();
}); 
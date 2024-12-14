document.addEventListener('DOMContentLoaded', () => {
    const playerForm = document.getElementById('playerForm');
    const playersContainer = document.querySelector('.players-container');
    const savedProfilesContainer = document.querySelector('.saved-profiles-container');
    const generateTeamsBtn = document.getElementById('generateTeams');
    const teamsGrid = document.querySelector('.teams-grid');
    const saveProfileCheckbox = document.getElementById('saveProfile');
    const profilesGrid = document.querySelector('.profiles-grid');
    const profileSearch = document.getElementById('profileSearch');
    const exportProfilesBtn = document.getElementById('exportProfiles');
    const importProfilesBtn = document.getElementById('importProfilesBtn');
    const importProfilesInput = document.getElementById('importProfiles');

    window.players = [];
    let savedProfiles = {};

    // Load saved profiles data
    function loadSavedProfilesData() {
        savedProfiles = JSON.parse(localStorage.getItem('savedProfiles')) || {};
        window.players = JSON.parse(localStorage.getItem('activeGamePlayers')) || [];
        updatePlayersList();
    }

    // Save current game state
    function saveGameState() {
        localStorage.setItem('activeGamePlayers', JSON.stringify(window.players));
    }

    // Load saved profiles on startup
    function loadSavedProfiles() {
        savedProfilesContainer.innerHTML = Object.entries(savedProfiles)
            .map(([name, profile]) => `
                <div class="profile-card">
                    <span>${name}</span>
                    <span class="stats">O: ${profile.offense} D: ${profile.defense}</span>
                    <div class="profile-actions">
                        <button onclick="addProfileToGame('${name}')" class="add-btn">Add to Game</button>
                        <button onclick="deleteProfile('${name}')" class="delete-btn">Delete</button>
                    </div>
                </div>
            `).join('');
    }

    // Add profile to current game
    window.addProfileToGame = (name) => {
        loadSavedProfilesData(); // Ensure we have the latest profiles data
        const profile = savedProfiles[name];
        
        if (!profile) {
            alert('Profile not found!');
            return;
        }

        // Check if player is already in the game
        if (window.players.some(player => player.name === name)) {
            alert('This player is already in the current game!');
            return;
        }
        
        // Add player to the current game
        window.players.push({
            name: name,
            offense: profile.offense,
            defense: profile.defense
        });
        
        updatePlayersList();
        
        // Show notification
        showNotification(`${name} added to game!`);
    };

    // Add notification system
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

    // Delete saved profile
    window.deleteProfile = (name) => {
        if (confirm(`Are you sure you want to delete ${name}'s profile?`)) {
            delete savedProfiles[name];
            localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
            renderProfiles();
            loadSavedProfiles();
        }
    };

    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = e.target[0].value;
        const offense = parseInt(e.target[1].value);
        const defense = parseInt(e.target[2].value);
        const shouldSave = saveProfileCheckbox.checked;

        const playerData = { name, offense, defense };

        // Save profile if checkbox is checked
        if (shouldSave) {
            savedProfiles[name] = {
                offense,
                defense
            };
            localStorage.setItem('savedProfiles', JSON.stringify(savedProfiles));
            loadSavedProfiles();
        }

        window.players.push(playerData);
        updatePlayersList();
        saveGameState();
        playerForm.reset();
        saveProfileCheckbox.checked = false;
    });

    window.updatePlayersList = function() {
        playersContainer.innerHTML = window.players.map((player, index) => `
            <div class="player-card">
                <span>${player.name}</span>
                <span>O: ${player.offense} D: ${player.defense}</span>
                <button onclick="removePlayer(${index})" class="remove-btn">×</button>
            </div>
        `).join('');
    }

    window.removePlayer = (index) => {
        window.players.splice(index, 1);
        updatePlayersList();
        saveGameState();
    };

    generateTeamsBtn.addEventListener('click', () => {
        if (window.players.length < 2) {
            alert('Please add at least 2 players');
            return;
        }
        const teams = balanceTeams(window.players);
        displayTeams(teams);
    });

    function balanceTeams(players) {
        // Create multiple team combinations and pick the most balanced one
        let bestTeams = null;
        let bestBalance = Infinity;
        
        // Try multiple random combinations
        for (let i = 0; i < 10; i++) {
            const shuffled = [...players].sort(() => Math.random() - 0.5);
            const mid = Math.ceil(shuffled.length / 2);
            const team1 = shuffled.slice(0, mid);
            const team2 = shuffled.slice(mid);
            
            const team1Stats = calculateTeamStats(team1);
            const team2Stats = calculateTeamStats(team2);
            
            const balance = Math.abs(team1Stats.total - team2Stats.total) +
                           Math.abs(team1Stats.offense - team2Stats.offense) +
                           Math.abs(team1Stats.defense - team2Stats.defense);
            
            if (balance < bestBalance) {
                bestBalance = balance;
                bestTeams = [team1, team2];
            }
        }
        
        return bestTeams;
    }

    function calculateTeamStats(team) {
        return team.reduce((stats, player) => ({
            offense: stats.offense + player.offense,
            defense: stats.defense + player.defense,
            total: stats.total + player.offense + player.defense
        }), { offense: 0, defense: 0, total: 0 });
    }

    function displayTeams(teams) {
        teamsGrid.innerHTML = teams.map((team, index) => `
            <div class="team-card">
                <h3>Team ${index + 1}</h3>
                <div class="team-stats">
                    <div class="stat-item">
                        <div class="stat-label">Total Offense</div>
                        <div class="stat-value">${team.reduce((sum, p) => sum + p.offense, 0)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Total Defense</div>
                        <div class="stat-value">${team.reduce((sum, p) => sum + p.defense, 0)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Avg Offense</div>
                        <div class="stat-value">${(team.reduce((sum, p) => sum + p.offense, 0) / team.length).toFixed(1)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Avg Defense</div>
                        <div class="stat-value">${(team.reduce((sum, p) => sum + p.defense, 0) / team.length).toFixed(1)}</div>
                    </div>
                </div>
                ${team.map(player => `
                    <div class="team-player">
                        <span>${player.name}</span>
                        <span>O: ${player.offense} D: ${player.defense}</span>
                    </div>
                `).join('')}
            </div>
        `).join('');
    }

    // Profile Search
    profileSearch.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        renderProfiles(searchTerm);
    });

    // Export Profiles
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

    // Import Profiles
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
                    loadSavedProfiles();
                } catch (error) {
                    alert('Invalid profile file format');
                }
            };
            reader.readAsText(file);
        }
    });

    // Render profiles in the profiles section
    function renderProfiles(searchTerm = '') {
        const filteredProfiles = Object.entries(savedProfiles)
            .filter(([name]) => name.toLowerCase().includes(searchTerm));

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
                    <button onclick="addProfileToGame('${name}')" class="primary-btn">Add to Game</button>
                </div>
            `).join('');
    }

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
                loadSavedProfiles();
            } else {
                alert('Please enter valid ratings between 1 and 10');
            }
        }
    };

    // Initialize
    loadSavedProfilesData();
    loadSavedProfiles();

    // Tab Navigation
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.dataset.tab;
            
            // Remove active class from all tabs and contents
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            // Add active class to clicked tab and corresponding content
            btn.classList.add('active');
            const content = document.getElementById(tabId);
            if (content) {
                content.classList.add('active');
            }

            // Refresh the profiles grid when switching to profiles tab
            if (tabId === 'profiles') {
                renderProfiles();
            }
        });
    });

    // Add randomize teams functionality
    const randomizeTeamsBtn = document.getElementById('randomizeTeams');
    randomizeTeamsBtn.addEventListener('click', () => {
        if (window.players.length < 2) {
            alert('Please add at least 2 players');
            return;
        }
        const shuffled = [...window.players].sort(() => Math.random() - 0.5);
        const team1 = shuffled.slice(0, Math.ceil(shuffled.length / 2));
        const team2 = shuffled.slice(Math.ceil(shuffled.length / 2));
        displayTeams([team1, team2]);
    });

    // Load any players added from profiles page
    function loadCurrentGamePlayers() {
        const currentGamePlayers = JSON.parse(localStorage.getItem('activeGamePlayers') || '[]');
        window.players = currentGamePlayers;
        updatePlayersList();
        // Clear the current game players after loading
        localStorage.setItem('activeGamePlayers', '[]');
    }

    // Load current game players when page loads
    loadCurrentGamePlayers();

    // Check if we should generate teams on load
    const shouldGenerateTeams = localStorage.getItem('generateTeamsOnLoad') === 'true';
    console.log('Should generate teams:', shouldGenerateTeams); // Debug log
    console.log('Current players:', window.players); // Debug log

    if (shouldGenerateTeams) {
        localStorage.removeItem('generateTeamsOnLoad');
        setTimeout(() => {
            if (window.players.length >= 2) {
                console.log('Generating teams for players:', window.players); // Debug log
                const teams = balanceTeams(window.players);
                displayTeams(teams);
                showNotification('Teams generated from selected profiles!');
            }
        }, 100);
    }
}); 
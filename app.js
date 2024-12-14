// Cookie management
const Cookies = {
    set: function(name, value, days = 365) {
        const d = new Date();
        d.setTime(d.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = `${name}=${JSON.stringify(value)};expires=${d.toUTCString()};path=/`;
    },
    
    get: function(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) {
            try {
                return JSON.parse(parts.pop().split(';').shift());
            } catch {
                return null;
            }
        }
        return null;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let profiles = Cookies.get('profiles') || {};
    let selectedPlayers = [];
    let currentTeams = null;

    // DOM Elements
    const profileView = document.getElementById('profileView');
    const gameView = document.getElementById('gameView');
    const newGameBtn = document.getElementById('newGameBtn');
    const profilesGrid = document.querySelector('.profiles-grid');
    const generateTeamsBtn = document.getElementById('generateTeamsBtn');
    const teamsGrid = document.querySelector('.teams-grid');
    const playerForm = document.getElementById('playerForm');
    const profileSearch = document.getElementById('profileSearch');
    const profilesList = document.querySelector('.profiles-list');
    const toggleProfileFormBtn = document.getElementById('toggleProfileForm');
    const profileFormContainer = document.getElementById('profileFormContainer');

    // Theme Management
    const themeToggle = document.getElementById('themeToggle');
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    function setTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
        Cookies.set('theme', theme);
        themeToggle.innerHTML = `<span class="material-icons">${theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>`;
    }

    // Initialize theme
    const savedTheme = Cookies.get('theme');
    if (savedTheme) {
        setTheme(savedTheme);
    } else if (prefersDarkScheme.matches) {
        setTheme('dark');
    }

    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        setTheme(currentTheme === 'dark' ? 'light' : 'dark');
    });

    // Listen for system theme changes
    prefersDarkScheme.addEventListener('change', (e) => {
        if (!Cookies.get('theme')) {
            setTheme(e.matches ? 'dark' : 'light');
        }
    });

    // View Management
    function showView(viewId) {
        document.querySelectorAll('.view-section').forEach(section => {
            section.style.display = 'none';
            section.classList.remove('active');
        });
        document.getElementById(viewId).style.display = 'block';
        document.getElementById(viewId).classList.add('active');
        newGameBtn.style.display = viewId === 'gameView' ? 'block' : 'none';
        console.log('Showing view:', viewId); // Debug
    }

    // Profile Management
    function renderProfiles(searchTerm = '') {
        const filteredProfiles = Object.entries(profiles)
            .filter(([name]) => name.toLowerCase().includes(searchTerm.toLowerCase()));

        profilesGrid.innerHTML = filteredProfiles
            .map(([name, profile]) => `
                <div class="profile-card">
                    <div class="profile-info">
                        <h3>${name}</h3>
                        <div class="stats">O: ${profile.offense} D: ${profile.defense}</div>
                    </div>
                    <div class="profile-actions">
                        <input type="checkbox" 
                            class="player-select"
                            data-name="${name}"
                            ${selectedPlayers.includes(name) ? 'checked' : ''}>
                        <label>Select for Game</label>
                    </div>
                </div>
            `).join('');

        // Add event listeners to checkboxes
        document.querySelectorAll('.player-select').forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const name = e.target.dataset.name;
                console.log('Checkbox changed:', name, e.target.checked); // Debug
                if (e.target.checked) {
                    if (!selectedPlayers.includes(name)) {
                        selectedPlayers.push(name);
                        console.log('Added player:', name); // Debug
                    }
                } else {
                    const index = selectedPlayers.indexOf(name);
                    if (index > -1) {
                        selectedPlayers.splice(index, 1);
                        console.log('Removed player:', name); // Debug
                    }
                }
                updateGenerateButton();
                console.log('Selected players:', selectedPlayers); // Debug
            });
        });

        updateStats();
        updateGenerateButton();
    }

    // Update statistics
    function updateStats() {
        const profilesArray = Object.values(profiles);
        document.getElementById('totalProfiles').textContent = profilesArray.length;
        
        if (profilesArray.length > 0) {
            const avgOffense = profilesArray.reduce((sum, p) => sum + p.offense, 0) / profilesArray.length;
            const avgDefense = profilesArray.reduce((sum, p) => sum + p.defense, 0) / profilesArray.length;
            document.getElementById('avgOffense').textContent = avgOffense.toFixed(1);
            document.getElementById('avgDefense').textContent = avgDefense.toFixed(1);
        }
    }

    // Update generate button state
    function updateGenerateButton() {
        const count = selectedPlayers.length;
        document.getElementById('selectedCount').textContent = count;
        generateTeamsBtn.disabled = count < 2;
        // Add visual feedback
        if (count < 2) {
            generateTeamsBtn.classList.add('disabled');
        } else {
            generateTeamsBtn.classList.remove('disabled');
        }
    }

    // Advanced Team Balancing Algorithm
    function balanceTeams(players) {
        if (!players || players.length < 2) {
            throw new Error('Need at least 2 players to generate teams');
        }

        // Calculate weighted team stats
        function getTeamStats(team) {
            if (!Array.isArray(team) || team.length === 0) {
                return { offense: 0, defense: 0, total: 0, avgOffense: 0, avgDefense: 0 };
            }
            const stats = {
                offense: team.reduce((sum, p) => sum + p.offense, 0),
                defense: team.reduce((sum, p) => sum + p.defense, 0)
            };
            stats.total = stats.offense + stats.defense;
            stats.avgOffense = stats.offense / team.length;
            stats.avgDefense = stats.defense / team.length;
            return stats;
        }

        // Calculate team balance score (lower is better)
        function getTeamBalanceScore(team1, team2) {
            const stats1 = getTeamStats(team1);
            const stats2 = getTeamStats(team2);

            // Calculate various differences
            const offenseDiff = Math.abs(stats1.avgOffense - stats2.avgOffense);
            const defenseDiff = Math.abs(stats1.avgDefense - stats2.avgDefense);
            const totalDiff = Math.abs(stats1.total - stats2.total);
            const balanceDiff1 = Math.abs(stats1.offense - stats1.defense);
            const balanceDiff2 = Math.abs(stats2.offense - stats2.defense);

            // Weighted score calculation
            return (offenseDiff * 0.3) +      // 30% weight to offense difference
                   (defenseDiff * 0.3) +      // 30% weight to defense difference
                   (totalDiff * 0.2) +        // 20% weight to total skill difference
                   (balanceDiff1 * 0.1) +     // 10% weight to team 1 internal balance
                   (balanceDiff2 * 0.1);      // 10% weight to team 2 internal balance
        }

        // Generate multiple team combinations and find the best one
        let bestTeams = null;
        let bestScore = Infinity;
        const attempts = 1000; // Increase for better results

        for (let i = 0; i < attempts; i++) {
            // Create random team distribution
            const shuffled = [...players].sort(() => Math.random() - 0.5);
            const mid = Math.ceil(shuffled.length / 2);
            const team1 = shuffled.slice(0, mid);
            const team2 = shuffled.slice(mid);

            // Calculate score for this distribution
            const score = getTeamBalanceScore(team1, team2);

            // Update best teams if this distribution is better
            if (score < bestScore) {
                bestScore = score;
                bestTeams = [team1, team2];
            }
        }

        // Final optimization pass
        if (bestTeams) {
            let [team1, team2] = bestTeams;
            let improved = true;
            let iterations = 0;
            const maxIterations = 100;

            while (improved && iterations < maxIterations) {
                improved = false;
                iterations++;

                const currentScore = getTeamBalanceScore(team1, team2);

                // Try swapping each pair of players
                for (let i = 0; i < team1.length && !improved; i++) {
                    for (let j = 0; j < team2.length && !improved; j++) {
                        // Try swap
                        const temp1 = team1[i];
                        const temp2 = team2[j];
                        team1[i] = temp2;
                        team2[j] = temp1;

                        const newScore = getTeamBalanceScore(team1, team2);

                        if (newScore < currentScore) {
                            improved = true;
                            console.log('Improved balance:', newScore);
                        } else {
                            // Revert swap
                            team1[i] = temp1;
                            team2[j] = temp2;
                        }
                    }
                }
            }

            // Log final team stats
            console.log('Final Teams:', {
                team1: getTeamStats(team1),
                team2: getTeamStats(team2),
                score: getTeamBalanceScore(team1, team2)
            });

            return [team1, team2];
        }

        throw new Error('Failed to generate balanced teams');
    }

    function displayTeams(teams) {
        console.log('DisplayTeams called with:', teams);
        if (!teamsGrid) {
            console.error('teamsGrid element not found');
            return;
        }

        // Ensure teams is an array and each team is an array
        if (!Array.isArray(teams) || !teams.every(Array.isArray)) {
            console.error('Invalid teams format:', teams);
            throw new Error('Invalid teams format');
        }

        teamsGrid.innerHTML = teams.map((team, index) => `
            <div class="team-card">
                <h3>Team ${index + 1}</h3>
                <div class="team-stats">
                    <div class="stat-item">
                        <div class="stat-label">Players</div>
                        <div class="stat-value">${team.length}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Total Offense</div>
                        <div class="stat-value">${team.reduce((sum, p) => sum + (p.offense || 0), 0)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Total Defense</div>
                        <div class="stat-value">${team.reduce((sum, p) => sum + (p.defense || 0), 0)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Avg Offense</div>
                        <div class="stat-value">${(team.reduce((sum, p) => sum + (p.offense || 0), 0) / team.length).toFixed(1)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Avg Defense</div>
                        <div class="stat-value">${(team.reduce((sum, p) => sum + (p.defense || 0), 0) / team.length).toFixed(1)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Balance</div>
                        <div class="stat-value">${Math.abs(
                            team.reduce((sum, p) => sum + (p.offense || 0), 0) - 
                            team.reduce((sum, p) => sum + (p.defense || 0), 0)
                        )}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Total Rating</div>
                        <div class="stat-value">${(team.reduce((sum, p) => sum + (p.offense || 0) + (p.defense || 0), 0)).toFixed(1)}</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-label">Avg Rating</div>
                        <div class="stat-value">${(team.reduce((sum, p) => sum + (p.offense || 0) + (p.defense || 0), 0) / team.length).toFixed(1)}</div>
                    </div>
                </div>
                <div class="team-players">
                    ${team.map(player => `
                        <div class="team-player">
                            <span>${player.name}</span>
                            <span>O: ${player.offense} D: ${player.defense}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `).join('');
        console.log('Teams HTML generated:', teamsGrid.innerHTML);
    }

    // Profile Management
    function renderProfilesList() {
        profilesList.innerHTML = Object.entries(profiles)
            .map(([name, profile]) => `
                <div class="profile-item" id="profile-${name}">
                    <div class="profile-item-info">
                        <strong>${name}</strong>
                        <span class="stats">O: ${profile.offense} D: ${profile.defense}</span>
                    </div>
                    <div class="profile-item-actions">
                        <button onclick="editProfileInline('${name}')" class="secondary-btn">Edit</button>
                        <button onclick="window.deleteProfile('${name}')" class="delete-btn">Delete</button>
                    </div>
                </div>
            `).join('');
    }

    // Inline profile editing
    window.editProfileInline = (name) => {
        const profile = profiles[name];
        const profileElement = document.getElementById(`profile-${name}`);
        
        profileElement.classList.add('edit-mode');
        profileElement.innerHTML = `
            <form class="edit-form" onsubmit="saveProfileEdit(event, '${name}')">
                <input type="number" value="${profile.offense}" min="1" max="10" required>
                <input type="number" value="${profile.defense}" min="1" max="10" required>
                <button type="submit" class="primary-btn">Save</button>
                <button type="button" onclick="cancelEdit('${name}')" class="secondary-btn">Cancel</button>
            </form>
        `;
    };

    window.saveProfileEdit = (event, name) => {
        event.preventDefault();
        const form = event.target;
        const offense = parseInt(form[0].value);
        const defense = parseInt(form[1].value);

        profiles[name] = { offense, defense };
        Cookies.set('profiles', profiles);
        renderProfilesList();
        renderProfiles(); // Update selection view
    };

    window.cancelEdit = (name) => {
        renderProfilesList();
    };

    // Toggle profile form
    toggleProfileFormBtn.addEventListener('click', () => {
        const isHidden = profileFormContainer.style.display === 'none';
        profileFormContainer.style.display = isHidden ? 'block' : 'none';
        toggleProfileFormBtn.textContent = isHidden ? 'Cancel' : 'Add New';
    });

    // Event Listeners
    playerForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = e.target[0].value;
        const offense = parseInt(e.target[1].value);
        const defense = parseInt(e.target[2].value);

        if (name && !isNaN(offense) && !isNaN(defense)) {
            profiles[name] = { offense, defense };
            Cookies.set('profiles', profiles);
            renderProfiles();
            renderProfilesList();
            e.target.reset();
            profileFormContainer.style.display = 'none';
            toggleProfileFormBtn.textContent = 'Add New';
        }
    });

    profileSearch.addEventListener('input', (e) => {
        renderProfiles(e.target.value);
    });

    // Generate Teams Event Listener
    generateTeamsBtn.addEventListener('click', () => {
        console.log('Generate Teams clicked');
        console.log('Selected Players:', selectedPlayers);

        if (selectedPlayers.length < 2) {
            alert('Please select at least 2 players');
            return;
        }

        try {
            const players = selectedPlayers.map(name => {
                const profile = profiles[name];
                if (!profile) {
                    throw new Error(`Profile not found for player: ${name}`);
                }
                return {
                    name,
                    offense: parseInt(profile.offense) || 0,
                    defense: parseInt(profile.defense) || 0
                };
            });

            console.log('Players for teams:', players);

            const teams = balanceTeams(players);
            console.log('Generated teams:', teams);

            if (!teams || !Array.isArray(teams) || teams.length !== 2) {
                throw new Error('Invalid teams generated');
            }

            currentTeams = teams;
            console.log('About to display teams');
            displayTeams(teams);
            console.log('Teams displayed, switching view');
            showView('gameView');
        } catch (error) {
            console.error('Error generating teams:', error.message);
            alert(`Error: ${error.message}. Please try again.`);
        }
    });

    newGameBtn.addEventListener('click', () => {
        selectedPlayers = [];
        currentTeams = null;
        showView('profileView');
        renderProfiles();
    });

    // Profile Management
    window.deleteProfile = (name) => {
        if (confirm(`Are you sure you want to delete ${name}?`)) {
            delete profiles[name];
            // Remove from selected players if present
            const index = selectedPlayers.indexOf(name);
            if (index > -1) {
                selectedPlayers.splice(index, 1);
            }
            // Update storage and UI
            Cookies.set('profiles', profiles);
            renderProfiles();
            renderProfilesList();
            updateStats();
            updateGenerateButton();
        }
    };

    // Initialize
    renderProfiles();
    renderProfilesList();
}); 
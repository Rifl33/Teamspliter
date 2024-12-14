// Game data management
const GameData = {
    // Save data to file
    saveToFile: function(data, filename) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || 'team-balancer-data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    // Load data from file
    loadFromFile: function(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    resolve(data);
                } catch (error) {
                    reject('Invalid file format');
                }
            };
            reader.onerror = () => reject('Error reading file');
            reader.readAsText(file);
        });
    },

    // Save all game data
    saveGameData: function() {
        try {
            const gameData = {
                profiles: JSON.parse(localStorage.getItem('savedProfiles') || '{}'),
                activePlayers: JSON.parse(localStorage.getItem('activeGamePlayers') || '[]'),
                gameHistory: JSON.parse(localStorage.getItem('gameHistory') || '[]')
            };
            this.saveToFile(gameData, 'team-balancer-data.json');
            return true;
        } catch (error) {
            console.error('Error saving game data:', error);
            return false;
        }
    },

    // Load all game data
    loadGameData: async function(file) {
        try {
            const data = await this.loadFromFile(file);
            if (data.profiles) localStorage.setItem('savedProfiles', JSON.stringify(data.profiles));
            if (data.activePlayers) localStorage.setItem('activeGamePlayers', JSON.stringify(data.activePlayers));
            if (data.gameHistory) localStorage.setItem('gameHistory', JSON.stringify(data.gameHistory));
            return true;
        } catch (error) {
            console.error('Error loading game data:', error);
            return false;
        }
    }
}; 
document.addEventListener('DOMContentLoaded', () => {
    // Check for players added from profiles page
    function loadCurrentGamePlayers() {
        const activeGamePlayers = JSON.parse(localStorage.getItem('activeGamePlayers') || '[]');
        if (activeGamePlayers.length > 0) {
            console.log('Loading active players:', activeGamePlayers); // Debug
            // Add players to the game
            activeGamePlayers.forEach(player => {
                if (!window.players.some(p => p.name === player.name)) {
                    window.players.push(player);
                }
            });
            
            // Ensure updatePlayersList exists
            if (typeof window.updatePlayersList === 'function') {
                window.updatePlayersList();
            } else {
                console.error('updatePlayersList not found');
            }
        }
    }

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

    // Make players array globally accessible
    window.players = window.players || [];
    
    // Initialize
    loadCurrentGamePlayers();
}); 
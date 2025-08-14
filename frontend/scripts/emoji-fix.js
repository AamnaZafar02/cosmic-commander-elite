// Enhanced Emoji Fix for Game Engine v1.0.6
// This file contains the corrected emoji rendering with multiple fallback methods
// UPDATED: Fixed syntax errors, improved emoji rendering for all enemy types

function renderEnemiesFixed(ctx, enemies) {
    enemies.forEach(enemy => {
        ctx.save();
        const centerX = enemy.x + enemy.width / 2;
        const centerY = enemy.y + enemy.height / 2;
        ctx.translate(centerX, centerY);
        
        // Handle rotation for obstacle enemies
        if (enemy.type === 'obstacle_enemy' && enemy.rotation !== undefined) {
            ctx.rotate(enemy.rotation);
            enemy.rotation += enemy.rotationSpeed || 0.02;
        }
        
        // Reset shadow effects
        ctx.shadowBlur = 0;
        ctx.shadowColor = 'transparent';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Try multiple methods to render emojis properly with better fallbacks
        if (enemy.type === 'alien_small') {
            // Method 1: Using Unicode alien with multiple font fallbacks
            ctx.font = `bold ${enemy.width + 12}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", Arial, sans-serif`;
            ctx.fillStyle = '#33ff33';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            // Draw the unicode alien with outline for better visibility
            ctx.strokeText('👽', 0, 0);
            ctx.fillText('👽', 0, 0);
            
            // Method 2: Always draw a simple alien shape regardless of emoji support
            // Draw a simple alien shape
            ctx.beginPath();
            ctx.fillStyle = '#33ff33';
            ctx.ellipse(0, -5, enemy.width/3, enemy.width/4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(-5, -5, 3, 5, Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(5, -5, 3, 5, -Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Small mouth
            ctx.beginPath();
            ctx.fillStyle = '#000000';
            ctx.ellipse(0, 3, 3, 1, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect for aliens
            ctx.shadowColor = '#33ff33';
            ctx.shadowBlur = 10;
        } 
        else if (enemy.type === 'alien_fast') {
            // Fast alien - similar approach with different color
            ctx.font = `bold ${enemy.width + 12}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", Arial, sans-serif`;
            ctx.fillStyle = '#ff4444';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            // Try the alien emoji first
            ctx.strokeText('👾', 0, 0);
            ctx.fillText('👾', 0, 0);
            
            // Fallback shape with red color
            ctx.beginPath();
            ctx.fillStyle = '#ff4444';
            ctx.ellipse(0, -5, enemy.width/3, enemy.width/4, 0, 0, Math.PI * 2);
            ctx.fill();
            
            // Eyes
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.ellipse(-5, -5, 3, 5, Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(5, -5, 3, 5, -Math.PI/4, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect for fast aliens
            ctx.shadowColor = '#ff4444';
            ctx.shadowBlur = 10;
        } 
        else if (enemy.type === 'obstacle_enemy') {
            // Obstacle enemy - comet/asteroid
            ctx.font = `bold ${enemy.width + 10}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "EmojiOne Color", Arial, sans-serif`;
            ctx.fillStyle = '#ffaa00';
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            
            // Try comet emoji first
            ctx.strokeText('☄️', 0, 0);
            ctx.fillText('☄️', 0, 0);
            
            // Fallback to a drawn asteroid if emoji doesn't work
            ctx.fillStyle = '#d0a060';
            ctx.beginPath();
            ctx.arc(0, 0, enemy.width/2.5, 0, Math.PI * 2);
            ctx.fill();
            
            // Add crater details
            ctx.fillStyle = '#a07040';
            ctx.beginPath();
            ctx.arc(-5, -2, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.arc(4, 3, 2, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow effect for obstacles
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur = 10;
        }
        
        ctx.restore();
    });
}

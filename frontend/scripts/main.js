// Main page functionality
document.addEventListener('DOMContentLoaded', () => {
    // Add smooth scrolling for navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // Add particle effects on hover for feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('mouseenter', function() {
            createParticles(this);
        });
    });

    // Initialize parallax stars
    initParallaxStars();
});

function createParticles(element) {
    const rect = element.getBoundingClientRect();
    const particles = [];
    
    for (let i = 0; i < 5; i++) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: absolute;
            width: 4px;
            height: 4px;
            background: var(--primary-color);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1000;
            left: ${rect.left + Math.random() * rect.width}px;
            top: ${rect.top + Math.random() * rect.height}px;
            animation: particleFloat 2s ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        particles.push(particle);
        
        setTimeout(() => {
            particle.remove();
        }, 2000);
    }
}

function initParallaxStars() {
    let ticking = false;
    
    function updateParallax() {
        const scrolled = window.pageYOffset;
        const parallax1 = document.querySelector('.stars');
        const parallax2 = document.querySelector('.stars2');
        const parallax3 = document.querySelector('.stars3');
        
        if (parallax1) parallax1.style.transform = `translateY(${scrolled * 0.5}px)`;
        if (parallax2) parallax2.style.transform = `translateY(${scrolled * 0.3}px)`;
        if (parallax3) parallax3.style.transform = `translateY(${scrolled * 0.1}px)`;
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateParallax);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Add particle animation CSS
const particleStyles = document.createElement('style');
particleStyles.textContent = `
    @keyframes particleFloat {
        0% {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
        100% {
            opacity: 0;
            transform: translateY(-50px) scale(0);
        }
    }
`;
document.head.appendChild(particleStyles);

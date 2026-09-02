// Interactive Particle Constellation Engine for ImpactBridge
// Represents the interconnected open innovation network (Academia, Communities, Industry, Challenges)
const ParticleConstellation = {
    canvas: null,
    ctx: null,
    particles: [],
    mouse: { x: null, y: null, radius: 160 },
    animationId: null,

    nodeTypes: [
        { color: '#3b82f6', label: 'Academia', size: 2.8 },    // University / Student
        { color: '#10b981', label: 'Community', size: 2.8 },   // NGO / Citizen
        { color: '#f59e0b', label: 'Industry', size: 2.8 },    // CSR Donors
        { color: '#a855f7', label: 'Challenge', size: 3.2 }    // Societal Problem
    ],

    init() {
        this.canvas = document.getElementById('particleCanvas');
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        this.resize();

        window.addEventListener('resize', () => this.resize());
        window.addEventListener('mousemove', (e) => {
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });
        window.addEventListener('mouseleave', () => {
            this.mouse.x = null;
            this.mouse.y = null;
        });

        this.createParticles();
        this.animate();
    },

    resize() {
        if (!this.canvas) return;
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    },

    createParticles() {
        this.particles = [];
        // Determine number of particles based on screen width
        const count = Math.min(65, Math.floor(window.innerWidth / 24));

        for (let i = 0; i < count; i++) {
            const type = this.nodeTypes[Math.floor(Math.random() * this.nodeTypes.length)];
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * 0.6,
                vy: (Math.random() - 0.5) * 0.6,
                radius: type.size + Math.random() * 0.8,
                color: type.color,
                baseX: 0,
                baseY: 0,
                pulse: Math.random() * Math.PI * 2
            });
        }
    },

    animate() {
        if (!this.ctx || !this.canvas) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        const particles = this.particles;
        const len = particles.length;

        for (let i = 0; i < len; i++) {
            const p = particles[i];

            // Movement
            p.x += p.vx;
            p.y += p.vy;
            p.pulse += 0.03;

            // Bounce on boundary
            if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
            if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;

            // Mouse proximity interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - p.x;
                const dy = this.mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.mouse.radius) {
                    const angle = Math.atan2(dy, dx);
                    const force = (this.mouse.radius - dist) / this.mouse.radius;
                    p.x -= Math.cos(angle) * force * 1.5;
                    p.y -= Math.sin(angle) * force * 1.5;

                    // Draw beam to mouse
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(96, 165, 250, ${0.4 * (1 - dist / this.mouse.radius)})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(this.mouse.x, this.mouse.y);
                    this.ctx.stroke();
                }
            }

            // Draw connections between close nodes
            for (let j = i + 1; j < len; j++) {
                const p2 = particles[j];
                const dx = p.x - p2.x;
                const dy = p.y - p2.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < 130) {
                    const alpha = (1 - dist / 130) * 0.22;
                    this.ctx.beginPath();
                    this.ctx.strokeStyle = `rgba(148, 163, 184, ${alpha})`;
                    this.ctx.lineWidth = 0.75;
                    this.ctx.moveTo(p.x, p.y);
                    this.ctx.lineTo(p2.x, p2.y);
                    this.ctx.stroke();
                }
            }

            // Draw Node Particle
            const pulseFactor = 0.8 + 0.2 * Math.sin(p.pulse);
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.radius * pulseFactor, 0, Math.PI * 2);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 8;
            this.ctx.shadowColor = p.color;
            this.ctx.fill();
            this.ctx.shadowBlur = 0; // Reset
        }

        this.animationId = requestAnimationFrame(() => this.animate());
    }
};

document.addEventListener("DOMContentLoaded", () => {
    ParticleConstellation.init();
});

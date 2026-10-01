/**
 * Floating Rose & Blossom Petals Canvas Animation
 * Gentle drifting physics with reduced-motion support and celebration burst.
 */

class PetalSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.petals = [];
    this.petalCount = 38;
    this.animationFrame = null;
    this.isRunning = false;
    this.prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.colors = [
      'rgba(212, 175, 55, 0.75)',  // champagne gold
      'rgba(234, 200, 117, 0.85)', // radiant pale gold
      'rgba(168, 62, 94, 0.70)',   // royal velvet wine
      'rgba(196, 126, 154, 0.70)', // dusky mauve plum
      'rgba(247, 224, 168, 0.65)'  // gold stardust shimmer
    ];

    this.resize = this.resize.bind(this);
    this.animate = this.animate.bind(this);
    
    window.addEventListener('resize', this.resize);
    this.resize();
    this.initPetals();
    this.start();
  }

  resize() {
    this.width = this.canvas.width = window.innerWidth;
    this.height = this.canvas.height = window.innerHeight;
  }

  createPetal(overrideY = null) {
    const size = Math.random() * 12 + 10;
    return {
      x: Math.random() * this.width,
      y: overrideY !== null ? overrideY : Math.random() * this.height,
      size: size,
      aspectRatio: Math.random() * 0.4 + 0.6,
      speedY: Math.random() * 0.7 + 0.5,
      speedX: Math.random() * 0.4 - 0.2,
      swayFrequency: Math.random() * 0.02 + 0.01,
      swayAmplitude: Math.random() * 1.5 + 0.8,
      angle: Math.random() * 360,
      angularSpeed: (Math.random() * 0.8 - 0.4) * 0.05,
      color: this.colors[Math.floor(Math.random() * this.colors.length)],
      opacity: Math.random() * 0.5 + 0.4,
      time: Math.random() * 100
    };
  }

  initPetals() {
    this.petals = [];
    const count = this.prefersReducedMotion ? 12 : this.petalCount;
    for (let i = 0; i < count; i++) {
      this.petals.push(this.createPetal());
    }
  }

  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.animate();
  }

  stop() {
    this.isRunning = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
  }

  // Triggered when envelope is opened for celebration effect
  triggerCelebrationBurst(count = 35) {
    if (this.prefersReducedMotion) return;
    for (let i = 0; i < count; i++) {
      const p = this.createPetal(-20);
      p.speedY = Math.random() * 2.2 + 1.2;
      p.swayAmplitude = Math.random() * 3 + 1.5;
      this.petals.push(p);
    }
  }

  drawPetal(p) {
    this.ctx.save();
    this.ctx.translate(p.x, p.y);
    this.ctx.rotate((p.angle * Math.PI) / 180);
    this.ctx.scale(1, p.aspectRatio);

    this.ctx.beginPath();
    this.ctx.moveTo(0, 0);
    // Draw organic tear/petal curve
    this.ctx.bezierCurveTo(
      p.size * 0.6, -p.size * 0.8,
      p.size, p.size * 0.4,
      0, p.size
    );
    this.ctx.bezierCurveTo(
      -p.size, p.size * 0.4,
      -p.size * 0.6, -p.size * 0.8,
      0, 0
    );

    this.ctx.fillStyle = p.color;
    this.ctx.globalAlpha = p.opacity;
    this.ctx.shadowColor = 'rgba(212, 161, 161, 0.2)';
    this.ctx.shadowBlur = 4;
    this.ctx.fill();
    this.ctx.restore();
  }

  animate() {
    if (!this.isRunning) return;

    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.petals.length; i++) {
      const p = this.petals[i];

      if (!this.prefersReducedMotion) {
        p.time += p.swayFrequency;
        p.x += Math.sin(p.time) * p.swayAmplitude + p.speedX;
        p.y += p.speedY;
        p.angle += p.angularSpeed;

        // Reset if bottom or sides exceeded
        if (p.y > this.height + 30) {
          p.y = -20;
          p.x = Math.random() * this.width;
        }
        if (p.x < -30) p.x = this.width + 20;
        if (p.x > this.width + 30) p.x = -20;
      }

      this.drawPetal(p);
    }

    this.animationFrame = requestAnimationFrame(this.animate);
  }
}

window.PetalSystem = PetalSystem;

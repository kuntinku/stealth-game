// nightfall: keyboard + mouse input, WASD move, Shift sneak, E whistle lure.
export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.mouse = { x: 0, y: 0 };
    this.whistle = 0;            // frames the whistle edge stays set
    addEventListener('keydown', (e) => {
      if (!e.repeat) {
        this.keys.add(e.code);
        if (e.code === 'KeyE') this.whistle = 6;
      }
      if (['ArrowUp', 'ArrowDown', 'Space'].includes(e.code)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    canvas.addEventListener('mousemove', (e) => {
      const r = canvas.getBoundingClientRect();
      this.mouse.x = e.clientX - r.left;
      this.mouse.y = e.clientY - r.top;
    });
  }
  has(code) { return this.keys.has(code); }
  takeWhistle() { if (this.whistle > 0) { this.whistle--; return true; } return false; }
}

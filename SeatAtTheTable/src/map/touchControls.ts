import type { Point } from '../config/types';

// LEGAL: Fraction of the stick's radius treated as "not pushing", so a resting thumb doesn't creep.
export const STICK_DEADZONE = 0.18;

// LEGAL: Thumb offset from the stick's centre → movement in [-1, 1] per axis, magnitude ≤ 1.
// LEGAL: Past the dead zone the push is rescaled to start from zero, so speed has no jump.
export function stickVector(offsetX: number, offsetY: number, radius: number): Point {
  const distance = Math.hypot(offsetX, offsetY);
  const push = Math.min(1, distance / radius);
  if(push <= STICK_DEADZONE) return { x: 0, y: 0 };
  const strength = (push - STICK_DEADZONE) / (1 - STICK_DEADZONE);
  return { x: (offsetX / distance) * strength, y: (offsetY / distance) * strength };
}

export interface TouchStick {
  vector(): Point;
  release(): void;
}

// LEGAL: An on-screen thumbstick for touch screens. CSS shows it only on coarse pointers, so
// LEGAL: on a desktop it is never visible and vector() stays at rest.
export function mountTouchStick(container: HTMLElement): TouchStick {
  const base = document.createElement('div');
  base.className = 'touch-stick';
  base.setAttribute('aria-hidden', 'true');
  const knob = document.createElement('div');
  knob.className = 'touch-stick-knob';
  base.appendChild(knob);
  container.appendChild(base);

  let current: Point = { x: 0, y: 0 };
  let activePointer: number | null = null;

  function follow(event: PointerEvent): void {
    const rect = base.getBoundingClientRect();
    const radius = rect.width / 2;
    const offsetX = event.clientX - (rect.left + radius);
    const offsetY = event.clientY - (rect.top + radius);
    current = stickVector(offsetX, offsetY, radius);
    const shown = Math.min(1, Math.hypot(offsetX, offsetY) / radius);
    const angle = Math.atan2(offsetY, offsetX);
    knob.style.transform = `translate(${Math.cos(angle) * shown * radius * 0.6}px, ${Math.sin(angle) * shown * radius * 0.6}px)`;
  }
  function release(): void {
    activePointer = null;
    current = { x: 0, y: 0 };
    knob.style.transform = '';
  }

  base.addEventListener('pointerdown', function(event){
    event.preventDefault();
    activePointer = event.pointerId;
    base.setPointerCapture(event.pointerId);
    follow(event);
  });
  base.addEventListener('pointermove', function(event){ if(event.pointerId === activePointer) follow(event); });
  base.addEventListener('pointerup', release);
  base.addEventListener('pointercancel', release);

  return { vector: function(){ return current; }, release };
}

import type * as ThreeNamespace from 'three';
import { CLOTH_COLORS, HAIR_COLORS, SHOE_COLORS, WARDROBE, buildPerson, createPersonParts, type PersonLook } from '../map/personModel';

// LEGAL: The wardrobe in Arjun's flat, and the fitting room in every mall shop. Step through each
// LEGAL: slot, pick colours, and see the result on a turning preview before you save. The preview
// LEGAL: has its own small renderer while the wardrobe is open, so it never touches the map's.
type Slot = keyof typeof WARDROBE;
type ColourKey = 'hairColor' | 'topColor' | 'shirtColor' | 'pantsColor' | 'shoeColor';

// LEGAL: `options` narrows a slot to what's on offer (what you own at home, what's on the shelf in a
// LEGAL: shop); the current value is always kept in it so you can step back to what you had on.
export function cycleOption<S extends Slot>(slot: S, current: string, direction: 1 | -1, options: readonly string[] = WARDROBE[slot]): typeof WARDROBE[S][number] {
  const list = options.includes(current) ? options : [current, ...options];
  const index = Math.max(0, list.indexOf(current));
  return list[(index + direction + list.length) % list.length] as typeof WARDROBE[S][number];
}

const SLOT_LABELS: Record<Slot, string> = { top:'Top', hair:'Hair', hat:'Hat', extra:'Extra', shoes:'Shoes' };
// LEGAL: The top colour is named after what you're wearing, so it's clear what it changes.
const TOP_NAMES: Record<PersonLook['top'], string> = { longcoat:'Coat colour', jacket:'Jacket colour', hoodie:'Hoodie colour', suit:'Suit colour' };
const COLOUR_ROWS: Array<{ key: ColourKey; label: string; palette: readonly string[] }> = [
  { key:'hairColor', label:'Hair colour', palette:HAIR_COLORS },
  { key:'topColor', label:'Top colour', palette:CLOTH_COLORS },
  { key:'shirtColor', label:'Shirt colour', palette:CLOTH_COLORS },
  { key:'pantsColor', label:'Trousers', palette:CLOTH_COLORS },
  { key:'shoeColor', label:'Shoe colour', palette:SHOE_COLORS },
];

function words(value: string): string {
  return value === 'none' ? 'None' : value.replace(/^./, c => c.toUpperCase());
}

export interface WardrobeOptions {
  title: string;
  subtitle: string;
  // LEGAL: Which slots and colours show, and what each slot offers. Leave out for the full wardrobe.
  slots?: Slot[];
  colours?: ColourKey[];
  offer?: (slot: Slot) => readonly string[];
  // LEGAL: A line under each item, such as its price.
  note?: (slot: Slot, value: string) => string;
  // LEGAL: What walking out in this look costs; the save button shows it and is off when you can't pay.
  price?: (look: PersonLook) => number;
  canAfford?: (price: number) => boolean;
  footnote?: string;
}

export function openWardrobe(THREE: typeof ThreeNamespace, start: PersonLook, onSave: (look: PersonLook) => void, options: WardrobeOptions = { title:'Wardrobe', subtitle:'Upstairs at your garage' }): void {
  let look: PersonLook = { ...start };
  const slots = options.slots ?? (Object.keys(WARDROBE) as Slot[]);
  const colourRows = COLOUR_ROWS.filter(row => !options.colours || options.colours.includes(row.key));
  const overlay = document.createElement('div');
  overlay.className = 'wardrobe-overlay';
  overlay.id = 'wardrobe-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-label', options.title);
  overlay.innerHTML = `<div class="wardrobe-panel">
    <div class="wardrobe-head">${options.title} <span>${options.subtitle}</span></div>
    <div class="wardrobe-body">
      <canvas class="wardrobe-preview" width="240" height="300"></canvas>
      <div class="wardrobe-controls"></div>
    </div>
    ${options.footnote ? `<div class="wardrobe-footnote">${options.footnote}</div>` : ''}
    <div class="wardrobe-foot"><button class="wardrobe-cancel" type="button">Cancel</button><button class="wardrobe-save" type="button">Wear this</button></div>
  </div>`;
  document.body.appendChild(overlay);
  const controls = overlay.querySelector<HTMLDivElement>('.wardrobe-controls')!;
  const saveButton = overlay.querySelector<HTMLButtonElement>('.wardrobe-save')!;

  function renderControls(): void {
    controls.innerHTML = slots.map(slot => {
      const note = options.note?.(slot, look[slot]) ?? '';
      return `<div class="wardrobe-row">
        <span class="wardrobe-label">${SLOT_LABELS[slot]}</span>
        <button type="button" data-slot="${slot}" data-dir="-1" aria-label="Previous ${SLOT_LABELS[slot]}">◀</button>
        <span class="wardrobe-value" data-value="${slot}">${words(look[slot])}${note ? `<small>${note}</small>` : ''}</span>
        <button type="button" data-slot="${slot}" data-dir="1" aria-label="Next ${SLOT_LABELS[slot]}">▶</button>
      </div>`;
    }).join('')
      + colourRows.map(row => `<div class="wardrobe-row wardrobe-swatches"><span class="wardrobe-label">${row.key === 'topColor' ? TOP_NAMES[look.top] : row.label}</span>${row.palette.map(color =>
        `<button type="button" class="wardrobe-swatch${look[row.key] === color ? ' active' : ''}" data-colour="${row.key}" data-hex="${color}" style="background:${color}" aria-label="${row.label} ${color}"></button>`).join('')}</div>`).join('');
    const price = options.price?.(look) ?? 0;
    saveButton.textContent = price > 0 ? `Buy and wear · $${price.toLocaleString()}` : 'Wear this';
    saveButton.disabled = price > 0 && !!options.canAfford && !options.canAfford(price);
  }
  renderControls();

  // LEGAL: The preview: one person, slowly turning, rebuilt whenever the look changes.
  const canvas = overlay.querySelector<HTMLCanvasElement>('.wardrobe-preview')!;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias:true, alpha:true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xffffff, 0x334455, 2.2));
  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.position.set(40, 80, 90);
  scene.add(sun);
  const camera = new THREE.PerspectiveCamera(30, canvas.width / canvas.height, 1, 1000);
  camera.position.set(0, 26, 92);
  camera.lookAt(0, 19, 0);
  const parts = createPersonParts(THREE);
  let person = buildPerson(THREE, parts, look).root;
  scene.add(person);
  function rebuild(): void {
    const turn = person.rotation.y;
    scene.remove(person);
    person = buildPerson(THREE, parts, look).root;
    person.rotation.y = turn;
    scene.add(person);
  }
  let running = true;
  function frame(): void {
    if(!running) return;
    person.rotation.y += 0.012;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }
  frame();

  controls.addEventListener('click', function(event){
    const button = (event.target as HTMLElement).closest('button');
    if(!button) return;
    const slot = button.dataset.slot as Slot | undefined;
    if(slot){
      look = { ...look, [slot]:cycleOption(slot, look[slot], Number(button.dataset.dir) as 1 | -1, options.offer?.(slot)) };
    } else if(button.dataset.colour){
      look = { ...look, [button.dataset.colour]:button.dataset.hex };
    } else return;
    renderControls();
    rebuild();
  });

  function close(save: boolean): void {
    running = false;
    renderer.dispose();
    overlay.remove();
    document.removeEventListener('keydown', onKey, true);
    if(save) onSave(look);
  }
  function onKey(event: KeyboardEvent): void {
    if(event.key === 'Escape'){ event.stopPropagation(); close(false); }
  }
  document.addEventListener('keydown', onKey, true);
  overlay.querySelector('.wardrobe-cancel')!.addEventListener('click', () => close(false));
  saveButton.addEventListener('click', () => { if(!saveButton.disabled) close(true); });
}

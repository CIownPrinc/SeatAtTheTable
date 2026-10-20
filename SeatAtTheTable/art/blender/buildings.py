"""One model per building archetype, so a place looks like what it is.

The game fits each model to the place's footprint (width x height x depth) and recolours the
material named "paint" with the facade colour. Models stand on the ground at z=0, centred on x/y,
with their front facing +Y (the game turns them to face the street). Run with
`-- <output dir> <preview dir>`; set BUILDING=<name> to rebuild just one.
"""
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402


def mats():
    return {
        "paint": kit.material("paint", "#8a5a44", roughness=0.85),
        "trim": kit.material("trim", "#d8d2c4", roughness=0.7),
        "glass": kit.material("glass", "#26313f", roughness=0.12, metallic=0.5),
        "lit": kit.material("glass-lit", "#ffd98a", roughness=0.3, emission="#ffcf70", strength=0.6),
        "roof": kit.material("roof", "#3a3d44", roughness=0.9),
        "door": kit.material("door", "#3b2a20", roughness=0.6),
        "metal": kit.material("metal", "#7d838c", roughness=0.4, metallic=0.7),
        "awning": kit.material("awning", "#8f2f2f", roughness=0.8),
        "stone": kit.material("stone", "#c9c2b2", roughness=0.85),
        "dark": kit.material("dark", "#22252b", roughness=0.8),
    }


def window_grid(m, front_y, width, rows, cols, z0, z1, win_w, win_h, lit_every=5):
    """Windows on the front face, each a dark pane in a light frame. Some are lit."""
    for r in range(rows):
        z = z0 + (z1 - z0) * (r + 0.5) / rows
        for c in range(cols):
            x = -width / 2 + width * (c + 0.5) / cols
            kit.box(f"frame-{r}-{c}", (win_w + 1.0, 0.5, win_h + 1.0), (x, front_y + 0.15, z), m["trim"])
            pane = m["lit"] if (r * cols + c) % lit_every == 2 else m["glass"]
            kit.box(f"pane-{r}-{c}", (win_w, 0.6, win_h), (x, front_y + 0.3, z), pane)


def build(name, m):
    if name == "tenement":
        # Brick walk-up: four storeys, a stoop, cornice, fire escape and a rooftop water tank.
        w, d, h = 60, 46, 64
        kit.box("walls", (w, d, h), (0, 0, h / 2), m["paint"], bevel=0.4)
        kit.box("cornice", (w + 2, d + 2, 2.4), (0, 0, h + 0.4), m["trim"], bevel=0.3)
        window_grid(m, d / 2, w - 8, 4, 5, 12, h - 4, 6, 8)
        kit.box("door", (8, 0.8, 11), (0, d / 2 + 0.2, 5.5), m["door"])
        kit.box("stoop", (14, 6, 2.2), (0, d / 2 + 3, 1.1), m["stone"], bevel=0.3)
        for r in range(3):
            z = 22 + r * 13
            kit.box(f"escape-{r}", (16, 5, 0.6), (w / 2 - 12, d / 2 + 2.6, z), m["metal"])
            kit.box(f"escape-rail-{r}", (16, 0.4, 3.0), (w / 2 - 12, d / 2 + 5, z + 1.6), m["metal"])
        kit.cylinder("water-tank", 4.5, 9, (-14, -6, h + 7), m["door"], axis="Z", vertices=16)
        for x in (-17, -11):
            kit.box(f"tank-leg-{x}", (0.8, 0.8, 5), (x, -6, h + 2.5), m["metal"])
    elif name == "storefront":
        # Shop: big display windows, an awning, a sign band and a flat at the top.
        w, d, h = 58, 44, 34
        kit.box("walls", (w, d, h), (0, 0, h / 2), m["paint"], bevel=0.4)
        kit.box("shopfront", (w - 6, 0.8, 13), (0, d / 2 + 0.3, 8.5), m["glass"])
        for x in (-w / 2 + 3, w / 2 - 3, 0):
            kit.box(f"mullion-{x}", (1.4, 1.0, 14), (x, d / 2 + 0.4, 8.5), m["trim"])
        kit.box("sign-band", (w - 4, 1.2, 5), (0, d / 2 + 0.6, 18.5), m["dark"], bevel=0.2)
        awning = kit.tapered_box("awning", (w - 4, 1), (w - 4, 6), 1.2, (0, d / 2 + 0.5, 15.5), m["awning"], top_offset=(0, 2.5))
        awning.rotation_euler = (0.0, 0, 0)
        window_grid(m, d / 2, w - 10, 1, 4, 22, h - 3, 7, 7, lit_every=3)
        kit.box("parapet", (w + 1, d + 1, 2), (0, 0, h + 1), m["trim"], bevel=0.3)
    elif name == "showroom":
        # Car showroom: a glass box with a low solid back and a canopy over the forecourt.
        w, d, h = 70, 52, 26
        kit.box("back", (w, d * 0.45, h), (0, -d * 0.275, h / 2), m["paint"], bevel=0.4)
        kit.box("glass-hall", (w - 2, d * 0.55, h - 2), (0, d * 0.225, (h - 2) / 2), m["glass"])
        for x in (-w / 2 + 1, -w / 6, w / 6, w / 2 - 1):
            kit.box(f"fin-{x:.0f}", (1.2, d * 0.56, h - 1), (x, d * 0.225, (h - 1) / 2), m["metal"])
        kit.box("roof", (w + 2, d + 6, 2), (0, 2.5, h + 0.2), m["trim"], bevel=0.4)
        kit.box("sign", (w * 0.6, 1.2, 4.5), (0, d / 2 + 3, h - 3.5), m["dark"], bevel=0.3)
    elif name == "office":
        # Mid-rise office: horizontal window bands, a recessed glass lobby, rooftop plant.
        w, d, h = 64, 50, 90
        kit.box("core", (w, d, h), (0, 0, h / 2), m["paint"], bevel=0.5)
        for r in range(7):
            z = 16 + r * 10.5
            kit.box(f"band-{r}", (w + 0.4, d + 0.4, 5.2), (0, 0, z), m["glass"])
        kit.box("lobby", (w * 0.6, 1.0, 10), (0, d / 2 + 0.3, 5), m["glass"])
        kit.box("canopy", (w * 0.65, 6, 0.8), (0, d / 2 + 3, 11), m["trim"])
        kit.box("plant", (w * 0.4, d * 0.4, 6), (6, -4, h + 3), m["metal"], bevel=0.4)
    elif name == "tower":
        # Glass tower with two setbacks and a crown, the financial core's skyline.
        w, d = 54, 50
        kit.box("base", (w, d, 70), (0, 0, 35), m["glass"], bevel=0.4)
        kit.box("mid", (w * 0.8, d * 0.8, 60), (0, 0, 100), m["glass"], bevel=0.4)
        kit.box("top", (w * 0.6, d * 0.6, 40), (0, 0, 150), m["glass"], bevel=0.4)
        for z, s in ((70, 1.0), (130, 0.8), (170, 0.6)):
            kit.box(f"ledge-{z}", (w * s + 1.2, d * s + 1.2, 2.2), (0, 0, z), m["paint"], bevel=0.3)
        for x in (-1, 1):
            for y in (-1, 1):
                kit.box(f"pier-{x}-{y}", (2.4, 2.4, 70), (x * (w / 2 - 1), y * (d / 2 - 1), 35), m["paint"])
        kit.cylinder("spire", 1.2, 22, (0, 0, 181), m["metal"], axis="Z", vertices=10)
    elif name == "civic":
        # Civic hall: steps, a colonnade, a pediment and a dome.
        w, d, h = 76, 54, 34
        kit.box("steps", (w * 0.7, 10, 3), (0, d / 2 + 4, 1.5), m["stone"], bevel=0.3)
        kit.box("plinth", (w, d, 4), (0, 0, 2), m["stone"], bevel=0.3)
        kit.box("hall", (w - 8, d - 12, h), (0, -4, 4 + h / 2), m["paint"], bevel=0.4)
        for i in range(8):
            x = -w * 0.38 + i * (w * 0.76 / 7)
            kit.cylinder(f"column-{i}", 1.8, h - 2, (x, d / 2 - 4, 4 + (h - 2) / 2), m["stone"], axis="Z", vertices=14)
        kit.tapered_box("pediment", (w * 0.84, 10), (2, 10), 9, (0, d / 2 - 4, 4 + h), m["stone"], bevel=0.3)
        kit.cylinder("drum", 11, 8, (0, -6, 4 + h + 4), m["stone"], axis="Z", vertices=28)
        import bpy
        bpy.ops.mesh.primitive_uv_sphere_add(radius=11.5, segments=28, ring_count=14, location=(0, -6, 4 + h + 8))
        dome = bpy.context.active_object
        dome.name = "dome"
        dome.scale = (1, 1, 0.85)
        # Its own gilt: fully metallic paint reflects nothing in the game, which has no sky to reflect,
        # and rendered black.
        dome.data.materials.append(kit.material("dome", "#c9a227", roughness=0.35, metallic=0.3))
        bpy.ops.object.shade_smooth()
    elif name == "works":
        # Works and freight: sawtooth roof, a tall chimney, roller doors and a loading dock.
        w, d, h = 80, 56, 24
        kit.box("shed", (w, d, h), (0, 0, h / 2), m["paint"], bevel=0.3)
        for i in range(5):
            x = -w / 2 + w * (i + 0.5) / 5
            tooth = kit.tapered_box(f"saw-{i}", (w / 5, d), (1.0, d), 9, (x, 0, h), m["roof"], top_offset=(-w / 10 + 0.5, 0))
            kit.box(f"saw-glass-{i}", (0.6, d - 2, 7.5), (x - w / 10 + 0.8, 0, h + 4.2), m["glass"])
        for x in (-22, 0, 22):
            kit.box(f"roller-{x}", (14, 0.8, 14), (x, d / 2 + 0.3, 7), m["metal"])
        kit.box("dock", (w * 0.8, 6, 3), (0, d / 2 + 3, 1.5), m["stone"])
        kit.cylinder("chimney", 3.4, 48, (w / 2 - 8, -d / 2 + 8, 24), m["paint"], axis="Z", vertices=18)
        kit.cylinder("chimney-cap", 4.0, 2, (w / 2 - 8, -d / 2 + 8, 49), m["dark"], axis="Z", vertices=18)
    else:
        raise ValueError(name)


BUILDINGS = ["tenement", "storefront", "showroom", "office", "tower", "civic", "works"]

out_dir, preview_dir = kit.args()
only = os.environ.get("BUILDING")
for name in [b for b in BUILDINGS if not only or b == only]:
    kit.reset()
    kit._materials.clear()
    build(name, mats())
    if out_dir:
        kit.export(os.path.join(out_dir, f"{name}.glb"))
    if preview_dir:
        kit.preview(os.path.join(preview_dir, f"building-{name}.png"), target=(0, 0, 30), distance=190, height=110, angle=60)

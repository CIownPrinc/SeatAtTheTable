"""The everyday sedan: rounded body, sloped glasshouse, chrome hubs, real lights."""
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402

LENGTH, WIDTH = 34.0, 15.0
WHEEL_R, WHEEL_W = 3.3, 2.6

kit.reset()
paint = kit.material("paint", "#8a2f2f", roughness=0.32, metallic=0.35)
glass = kit.material("glass", "#1c2733", roughness=0.08, metallic=0.6)
trim = kit.material("trim", "#1b1d22", roughness=0.7)
tyre = kit.material("tyre", "#141414", roughness=0.9)
chrome = kit.material("chrome", "#c7cad1", roughness=0.18, metallic=0.95)
head = kit.material("headlight", "#fff4d6", roughness=0.2, emission="#ffe9b0", strength=1.4)
tail = kit.material("taillight", "#b8141c", roughness=0.3, emission="#ff2a2a", strength=1.0)

# Body: a long rounded slab with a lower, narrower nose and tail so it isn't a brick.
kit.tapered_box("body", (LENGTH, WIDTH), (LENGTH - 2.2, WIDTH - 0.8), 5.2, (0, 0, 2.4), paint, bevel=1.5, segments=3)
kit.tapered_box("hood", (10.5, WIDTH - 0.6), (9.0, WIDTH - 1.6), 0.9, (LENGTH * 0.29, 0, 7.4), paint, top_offset=(-0.6, 0), bevel=0.5)
kit.tapered_box("trunk", (6.5, WIDTH - 0.6), (5.6, WIDTH - 1.6), 0.9, (-LENGTH * 0.34, 0, 7.4), paint, bevel=0.5)

# Glasshouse: sloped front and rear screens, roof panel in body colour on top.
kit.tapered_box("cabin", (16.5, WIDTH - 1.6), (10.5, WIDTH - 3.4), 4.8, (-1.6, 0, 7.4), glass, top_offset=(-0.8, 0), bevel=0.7)
kit.tapered_box("roof", (10.8, WIDTH - 3.2), (10.0, WIDTH - 3.8), 0.7, (-2.4, 0, 12.0), paint, bevel=0.35)
for side in (-1, 1):
    kit.box(f"pillar-{side}", (0.9, 0.5, 4.4), (-1.9, side * (WIDTH / 2 - 1.15), 9.7), paint, bevel=0.2)

# Bumpers, wheels, lights.
for name, x in (("bumper-front", LENGTH / 2 - 0.2), ("bumper-rear", -LENGTH / 2 + 0.2)):
    kit.box(name, (1.6, WIDTH - 0.6, 2.0), (x, 0, 3.2), trim, bevel=0.6)
for x in (LENGTH * 0.31, -LENGTH * 0.31):
    for side in (-1, 1):
        kit.wheel(f"wheel-{x:+.0f}-{side}", WHEEL_R, WHEEL_W, (x, side * (WIDTH / 2 - 0.9), WHEEL_R), tyre, chrome)
for side in (-1, 1):
    kit.box(f"headlight-{side}", (0.6, 3.2, 1.3), (LENGTH / 2 - 0.1, side * (WIDTH / 2 - 2.6), 5.6), head, bevel=0.3)
    kit.box(f"taillight-{side}", (0.6, 3.4, 1.2), (-LENGTH / 2 + 0.1, side * (WIDTH / 2 - 2.5), 5.8), tail, bevel=0.3)
kit.box("grille", (0.5, 6.0, 1.4), (LENGTH / 2 + 0.05, 0, 4.8), trim, bevel=0.2)

glb, image = kit.args()
# Export first: the preview adds a ground plane and lights that must not end up in the model.
if glb:
    kit.export(glb)
if image:
    kit.preview(image)

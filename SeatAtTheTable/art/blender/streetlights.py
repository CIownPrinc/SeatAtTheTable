"""Streetlights and the traffic-signal frames, at the sizes src/map/streetFurniture.ts places them.

Three's +X is Blender's +X, three's +Y is Blender's +Z, and three's +Z is Blender's -Y. Parts are
named by material: 'iron' and 'glass' for the lamp post (the game lights the glass at night with its
shared bulb material), 'signal' for the signal frame (its lamps stay in the game's code, since they
move and change colour). Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402


def tube(name, a, b, r, mat, vertices=10):
    a, b = Vector(a), Vector(b)
    obj = kit.cylinder(name, r, (b - a).length, tuple((a + b) / 2), mat, axis="Z", vertices=vertices)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = (b - a).to_track_quat("Z", "Y")
    return obj


def lamp_post(m):
    iron, glass = m["iron"], m["glass"]
    # A slim modern post: a low base, a tapering pole and a fine arm (the user found the old cast-iron
    # column, at twice this girth, cumbersome).
    kit.cylinder("plinth", 1.4, 1.4, (0, 0, 0.7), iron, axis="Z", vertices=12, bevel=0.2)
    bpy.ops.mesh.primitive_cone_add(radius1=0.85, radius2=0.5, depth=32, vertices=10, location=(0, 0, 17.4))
    bpy.context.active_object.data.materials.append(iron)
    kit.cylinder("cap", 0.6, 0.6, (0, 0, 33.5), iron, axis="Z", vertices=10)
    # The arm curves up and out over the road, along +X, to the lantern.
    points = [(math.sin(t) * 12, 0, 31 + (1 - math.cos(t)) * 2.4 + t * 0.6) for t in [i / 6 * math.pi / 2 for i in range(7)]]
    for i in range(len(points) - 1):
        tube(f"arm-{i}", points[i], points[i + 1], 0.32, iron)
    end = points[-1]
    # A flat LED head rather than a lantern: a shallow housing with the glass on its underside.
    kit.box("head", (6.0, 2.6, 0.9), (end[0] + 1.6, 0, end[2] - 0.2), iron, bevel=0.3)
    kit.box("lens", (5.0, 2.0, 0.3), (end[0] + 1.6, 0, end[2] - 0.75), glass, bevel=0.1)


def signal_frame(m):
    s = m["signal"]
    kit.cylinder("plinth", 2.2, 2.0, (0, 0, 1.0), s, axis="Z", vertices=12, bevel=0.3)
    bpy.ops.mesh.primitive_cone_add(radius1=1.4, radius2=1.0, depth=30, vertices=12, location=(0, 0, 15))
    bpy.context.active_object.data.materials.append(s)
    # Arms over each street: west (three -X) and south (three +Z, Blender -Y).
    tube("arm-west", (0, 0, 29), (-22, 0, 29), 0.9, s)
    tube("arm-south", (0, 0, 27), (0, -22, 27), 0.9, s)
    tube("brace-west", (0, 0, 25), (-8, 0, 29), 0.4, s)
    tube("brace-south", (0, 0, 23), (0, -8, 27), 0.4, s)

    def head(cx, cy, cz, faces_x):
        """A housing with a backplate and a hooded visor over each lamp slot. The north-south head
        looks along three's +Z (Blender -Y); the east-west one along three's +X."""
        if faces_x:
            kit.box("housing", (5, 7, 18), (cx, cy, cz), s, bevel=0.4)
            kit.box("backplate", (0.6, 11, 22), (cx - 2.8, cy, cz), s)
            for dz in (5, 0, -5):
                kit.box("visor", (3, 5.4, 0.5), (cx + 4, cy, cz + dz + 2.3), s)
        else:
            kit.box("housing", (7, 5, 18), (cx, cy, cz), s, bevel=0.4)
            kit.box("backplate", (11, 0.6, 22), (cx, cy + 2.8, cz), s)
            for dz in (5, 0, -5):
                kit.box("visor", (5.4, 3, 0.5), (cx, cy - 4, cz + dz + 2.3), s)

    head(-22, 0, 24, False)
    head(0, -22, 22, True)


MODELS = {"lamp-post": lamp_post, "signal-frame": signal_frame}

out_dir, preview_dir = kit.args()
for name, build in MODELS.items():
    kit.reset()
    kit._materials.clear()
    build({
        "iron": kit.material("iron", "#2f333c", roughness=0.5, metallic=0.5),
        "glass": kit.material("glass", "#ffe6a0", roughness=0.3, emission="#ffd27a", strength=1.0),
        "signal": kit.material("signal", "#2a2d33", roughness=0.5, metallic=0.4),
    })
    if out_dir:
        kit.export(os.path.join(out_dir, f"{name}.glb"))
    if preview_dir:
        kit.preview(os.path.join(preview_dir, f"street-{name}.png"), target=(-4, -4, 20), distance=70, height=20, angle=-60)

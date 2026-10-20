"""Trees: a broadleaf for streets, parks and yards, and a pine for the forests.

World units, base at the origin, about 33 tall (the size the game's trees already are; the game
scales each one). Each tree is two parts, named by their material: 'bark' and 'leaves', which the
game swaps for its own materials so settling snow still finds them.
Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import math
import os
import random
import sys

import bpy
from mathutils import Vector

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402


def tube(name, a, b, r0, r1, mat):
    a, b = Vector(a), Vector(b)
    bpy.ops.mesh.primitive_cone_add(radius1=r0, radius2=r1, depth=(b - a).length, vertices=9, location=tuple((a + b) / 2))
    obj = bpy.context.active_object
    obj.name = name
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = (b - a).to_track_quat("Z", "Y")
    obj.data.materials.append(mat)
    return obj


def blob(name, radius, location, mat, squash=0.85, seed=0):
    bpy.ops.mesh.primitive_ico_sphere_add(radius=radius, subdivisions=2, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (1, 1, squash)
    rng = random.Random(seed)
    # Push the vertices in and out a little, so the canopy is lumpy rather than a ball.
    for v in obj.data.vertices:
        v.co *= 1 + (rng.random() - 0.5) * 0.22
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def broadleaf(bark, leaves):
    tube("trunk", (0, 0, 0), (0, 0, 16), 2.6, 1.6, bark)
    tube("branch-a", (0, 0, 12), (4.5, 1.5, 19), 1.2, 0.6, bark)
    tube("branch-b", (0, 0, 13), (-3.5, -2.5, 20), 1.1, 0.5, bark)
    for i, (x, y, z, r) in enumerate(((0, 0, 24, 9.5), (5, 2, 21, 7), (-4.5, -2.5, 21.5, 7.2), (1.5, -4.5, 22, 6.4), (-2, 4.5, 23, 6.8), (0.5, 0.5, 29, 6.2))):
        blob(f"canopy-{i}", r, (x, y, z), leaves, seed=i)


def pine(bark, leaves):
    tube("trunk", (0, 0, 0), (0, 0, 12), 1.9, 1.2, bark)
    # Tiers of drooping foliage, each a short wide cone, smaller toward the top.
    tiers = ((11.5, 7.0, 9.0), (9.5, 6.5, 14.5), (7.6, 6.0, 19.5), (5.6, 5.5, 24.2), (3.6, 5.0, 28.5))
    for i, (r, h, z) in enumerate(tiers):
        bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r * 0.18, depth=h, vertices=10, location=(0, 0, z))
        tier = bpy.context.active_object
        tier.name = f"tier-{i}"
        tier.rotation_euler = (0, 0, i * 0.4)
        tier.data.materials.append(leaves)
    bpy.ops.mesh.primitive_cone_add(radius1=1.6, radius2=0, depth=4.4, vertices=8, location=(0, 0, 32.6))
    bpy.context.active_object.data.materials.append(leaves)


TREES = {"broadleaf": broadleaf, "pine": pine}

out_dir, preview_dir = kit.args()
for name, build in TREES.items():
    kit.reset()
    kit._materials.clear()
    build(kit.material("bark", "#4a3624", roughness=0.9), kit.material("leaves", "#2f6a3d", roughness=0.95))
    if out_dir:
        kit.export(os.path.join(out_dir, f"{name}.glb"))
    if preview_dir:
        kit.preview(os.path.join(preview_dir, f"tree-{name}.png"), target=(0, 0, 16), distance=70, height=24, angle=50)

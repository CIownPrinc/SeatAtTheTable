"""The city's landmarks, one model each, at the sizes the game places them at.

World units, 10.5 to the metre. Each stands on the ground at the origin (the dome sits on top of
its hall: its origin is the hall's roof). Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import math
import os
import sys

import bpy
from mathutils import Vector

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402


def mats():
    return {
        "rust": kit.material("tank-red", "#7a3b32", roughness=0.8),
        "band": kit.material("tank-band", "#5a2a24", roughness=0.7, metallic=0.3),
        "steel": kit.material("leg-steel", "#3a3d47", roughness=0.6, metallic=0.5),
        "gold": kit.material("dome-gold", "#c9a227", roughness=0.28, metallic=0.75),
        "stone": kit.material("hall-stone", "#d8cfb8", roughness=0.8),
        # Not fully metallic: the game has no environment map, and pure chrome reflecting nothing
        # renders black.
        "chrome": kit.material("chrome", "#dfe5ea", roughness=0.18, metallic=0.55),
        "plaza": kit.material("plaza-granite", "#5b5a55", roughness=0.9),
        "paving": kit.material("plaza-paving", "#6a6862", roughness=0.85),
    }


def tube(name, a, b, radius, mat, vertices=8):
    a, b = Vector(a), Vector(b)
    obj = kit.cylinder(name, radius, (b - a).length, tuple((a + b) / 2), mat, axis="Z", vertices=vertices)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = (b - a).to_track_quat("Z", "Y")
    return obj


def smooth_sphere(name, radius, location, scale, mat, segments=40, rings=24):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=segments, ring_count=rings, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def build(name, m):
    if name == "water-tower":
        legs = [(-16, -16), (16, -16), (-16, 16), (16, 16)]
        for i, (x, y) in enumerate(legs):
            tube(f"leg-{i}", (x * 1.15, y * 1.15, 0), (x * 0.8, y * 0.8, 60), 2.2, m["steel"])
        # Cross bracing between neighbouring legs, two tiers.
        for z0, z1 in ((6, 30), (30, 56)):
            for i in range(4):
                (ax, ay), (bx, by) = legs[i], legs[[1, 3, 0, 2][i]]
                tube(f"brace-{z0}-{i}-a", (ax, ay, z0), (bx, by, z1), 0.6, m["steel"])
                tube(f"brace-{z0}-{i}-b", (bx, by, z0), (ax, ay, z1), 0.6, m["steel"])
        kit.cylinder("tank", 24, 30, (0, 0, 74), m["rust"], axis="Z", vertices=36)
        for z in (62, 71, 80, 88):
            kit.cylinder(f"band-{z}", 24.4, 1.2, (0, 0, z), m["band"], axis="Z", vertices=36)
        bpy.ops.mesh.primitive_cone_add(radius1=26, radius2=1.5, depth=14, vertices=36, location=(0, 0, 96))
        roof = bpy.context.active_object
        roof.name = "tank-roof"
        roof.data.materials.append(m["rust"])
        # The catwalk round the bottom of the tank, its rail, and the ladder up a leg.
        kit.cylinder("catwalk", 28, 0.8, (0, 0, 59), m["steel"], axis="Z", vertices=36)
        for i in range(24):
            a = i / 24 * math.pi * 2
            kit.box(f"rail-{i}", (0.4, 0.4, 5), (math.cos(a) * 27.6, math.sin(a) * 27.6, 61.5), m["steel"])
        kit.cylinder("rail-top", 27.6, 0.5, (0, 0, 64), m["steel"], axis="Z", vertices=36)
        for side in (-1, 1):
            tube(f"ladder-{side}", (18 + side * 1.2, 18, 0), (14 + side * 1.2, 14, 59), 0.3, m["steel"])
        for z in range(4, 58, 4):
            t = z / 59
            kit.box(f"rung-{z}", (2.4, 0.3, 0.3), (18 - 4 * t, 18 - 4 * t, z), m["steel"])
    elif name == "dome":
        # A drum of columns on the hall's roof, a ribbed gold dome and a lantern with its finial.
        kit.cylinder("drum", 26, 8, (0, 0, 4), m["stone"], axis="Z", vertices=32)
        for i in range(16):
            a = i / 16 * math.pi * 2
            kit.cylinder(f"column-{i}", 1.4, 8, (math.cos(a) * 27, math.sin(a) * 27, 4), m["stone"], axis="Z", vertices=10)
        kit.cylinder("drum-cornice", 28.5, 1.4, (0, 0, 8.7), m["stone"], axis="Z", vertices=32)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=25, segments=32, ring_count=16, location=(0, 0, 9))
        dome = bpy.context.active_object
        dome.name = "dome"
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.select_all(action="DESELECT")
        bpy.ops.object.mode_set(mode="OBJECT")
        for v in dome.data.vertices:
            v.select = v.co.z < -0.01
        bpy.ops.object.mode_set(mode="EDIT")
        bpy.ops.mesh.delete(type="VERT")
        bpy.ops.object.mode_set(mode="OBJECT")
        dome.data.materials.append(m["gold"])
        bpy.ops.object.shade_smooth()
        # Ribs running up the dome's surface, each in short straight runs that follow its curve.
        steps = [0.05, 0.38, 0.72, 1.05, 1.38]
        for i in range(12):
            a = i / 12 * math.pi * 2
            point = lambda e: (math.cos(a) * 25.7 * math.cos(e), math.sin(a) * 25.7 * math.cos(e), 9 + 25.7 * math.sin(e))
            for k in range(len(steps) - 1):
                tube(f"rib-{i}-{k}", point(steps[k]), point(steps[k + 1]), 0.75, m["stone"])
        kit.cylinder("lantern", 4, 6, (0, 0, 36), m["stone"], axis="Z", vertices=14)
        bpy.ops.mesh.primitive_cone_add(radius1=4.4, radius2=0, depth=9, vertices=14, location=(0, 0, 43.5))
        bpy.context.active_object.data.materials.append(m["gold"])
    elif name == "potato":
        # Polished stainless steel on a granite plaza, with the arch you walk under.
        kit.box("plaza", (120, 100, 3), (0, 0, 1.5), m["plaza"], bevel=0.6)
        for i in range(-5, 6):
            kit.box(f"paving-{i}", (118, 0.4, 0.2), (0, i * 9, 3.05), m["paving"])
        blob = smooth_sphere("bean", 26, (0, 0, 17.5), (1.35, 0.95, 0.62), m["chrome"])
        # Pinch the underside up into the omphalos, the hollow you look up into.
        for v in blob.data.vertices:
            r = math.hypot(v.co.x, v.co.y)
            if v.co.z < 0 and r < 16:
                v.co.z += (1 - r / 16) * 22
    else:
        raise ValueError(name)


LANDMARKS = ["water-tower", "dome", "potato"]

out_dir, preview_dir = kit.args()
only = os.environ.get("LANDMARK")
for name in [n for n in LANDMARKS if not only or n == only]:
    kit.reset()
    kit._materials.clear()
    build(name, mats())
    if out_dir:
        kit.export(os.path.join(out_dir, f"{name}.glb"))
    if preview_dir:
        kit.preview(os.path.join(preview_dir, f"landmark-{name}.png"), target=(0, 0, 30), distance=170, height=80, angle=50)

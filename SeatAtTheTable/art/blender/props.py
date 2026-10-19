"""Street furniture: what stands on the pavements between the buildings and the road.

World units, 10.5 to the metre (people are 22 tall). Each prop's front is +Y, like the buildings;
it stands on the ground at the origin. Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import os
import sys

import bpy

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402


def mats():
    return {
        "iron": kit.material("iron", "#2a2d33", roughness=0.5, metallic=0.6),
        "wood": kit.material("slat-wood", "#7a5232", roughness=0.8),
        "green": kit.material("park-green", "#2f5a3e", roughness=0.6, metallic=0.2),
        "red": kit.material("hydrant-red", "#b8282a", roughness=0.45, metallic=0.2),
        "chrome": kit.material("chrome", "#c7cad1", roughness=0.2, metallic=0.9),
        "blue": kit.material("mail-blue", "#1f4f9a", roughness=0.45, metallic=0.2),
        "glass": kit.material("shelter-glass", "#a8c8d8", roughness=0.05, metallic=0.1),
        "steel": kit.material("steel", "#8f949c", roughness=0.35, metallic=0.7),
        "ad": kit.material("shelter-ad", "#e8d8b0", roughness=0.5, emission="#f0e0b0", strength=0.6),
        "stone": kit.material("planter-stone", "#a39d90", roughness=0.9),
        "soil": kit.material("soil", "#4a3a2a", roughness=1.0),
        "leaf": kit.material("shrub", "#3a7a40", roughness=0.9),
        "white": kit.material("enamel-white", "#eceae4", roughness=0.4),
    }


def build(name, m):
    if name == "bench":
        # Cast-iron ends, wooden slats for the seat and the back.
        for x in (-8.2, 8.2):
            kit.box(f"end-{x}", (1.0, 5.0, 4.8), (x, 0, 2.4), m["iron"], bevel=0.3)
            kit.box(f"arm-{x}", (1.0, 4.6, 0.7), (x, 0.4, 7.0), m["iron"], bevel=0.25)
            kit.box(f"back-post-{x}", (0.8, 0.8, 5.6), (x, -2.2, 7.2), m["iron"], bevel=0.2)
        for i, y in enumerate((-1.6, -0.4, 0.8, 2.0)):
            kit.box(f"seat-slat-{i}", (18.0, 1.0, 0.5), (0, y, 4.9), m["wood"], bevel=0.15)
        for i, z in enumerate((6.6, 8.0, 9.4)):
            kit.box(f"back-slat-{i}", (18.0, 0.5, 1.0), (0, -2.4, z), m["wood"], bevel=0.15)
    elif name == "bin":
        kit.cylinder("bin-body", 3.0, 9.0, (0, 0, 4.5), m["green"], axis="Z", vertices=18, bevel=0.3)
        kit.cylinder("bin-lid", 3.3, 1.0, (0, 0, 9.4), m["iron"], axis="Z", vertices=18, bevel=0.3)
        kit.cylinder("bin-band", 3.1, 0.6, (0, 0, 6.5), m["iron"], axis="Z", vertices=18)
        kit.box("bin-slot", (2.6, 0.4, 1.2), (0, 3.0, 8.0), m["iron"])
    elif name == "hydrant":
        kit.cylinder("hydrant-body", 1.6, 6.0, (0, 0, 3.6), m["red"], axis="Z", vertices=14, bevel=0.2)
        kit.cylinder("hydrant-base", 2.2, 0.8, (0, 0, 0.4), m["red"], axis="Z", vertices=14)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1.7, segments=14, ring_count=8, location=(0, 0, 6.6))
        cap = bpy.context.active_object
        cap.name = "hydrant-cap"
        cap.scale = (1, 1, 0.7)
        cap.data.materials.append(m["red"])
        kit.cylinder("hydrant-nut", 0.5, 1.0, (0, 0, 7.9), m["chrome"], axis="Z", vertices=6)
        for side in (-1, 1):
            kit.cylinder(f"hydrant-nozzle-{side}", 0.7, 1.4, (side * 2.0, 0, 4.8), m["red"], axis="X", vertices=10)
        kit.cylinder("hydrant-front", 0.95, 1.4, (0, 2.0, 4.6), m["chrome"], axis="Y", vertices=10)
    elif name == "shelter":
        # A bus shelter: steel frame, a glass back and sides, a lit advert at one end and a bench.
        w, d, h = 36.0, 14.0, 25.0
        for x in (-w / 2, w / 2):
            for y in (-d / 2, d / 2):
                kit.box(f"post-{x}-{y}", (1.0, 1.0, h), (x, y, h / 2), m["steel"])
        kit.box("roof", (w + 2, d + 2, 1.2), (0, 0, h + 0.6), m["steel"], bevel=0.3)
        kit.box("back-glass", (w - 1, 0.4, h - 6), (0, -d / 2, (h - 6) / 2 + 3), m["glass"])
        kit.box("side-glass", (0.4, d - 1, h - 6), (-w / 2, 0, (h - 6) / 2 + 3), m["glass"])
        kit.box("advert", (0.8, d - 2, h - 8), (w / 2, 0, (h - 8) / 2 + 3), m["ad"])
        kit.box("shelter-seat", (w * 0.6, 3.5, 0.8), (-2, -d / 2 + 2.6, 5.0), m["steel"], bevel=0.2)
        kit.box("sign-post", (0.8, 0.8, 30), (w / 2 + 4, d / 2, 15), m["steel"])
        kit.box("sign-plate", (5.0, 0.4, 5.0), (w / 2 + 4, d / 2, 29), m["white"], bevel=0.2)
    elif name == "mailbox":
        kit.box("mail-legs", (4.6, 4.0, 3.0), (0, 0, 1.5), m["blue"])
        kit.box("mail-body", (5.0, 4.4, 8.0), (0, 0, 7.0), m["blue"], bevel=0.3)
        kit.cylinder("mail-top", 2.5, 5.0, (0, 0, 11.0), m["blue"], axis="X", vertices=18)
        kit.box("mail-flap", (3.6, 0.3, 1.2), (0, 2.25, 9.4), m["iron"])
        kit.box("mail-label", (2.6, 0.2, 1.6), (0, 2.25, 6.4), m["white"])
    elif name == "planter":
        kit.box("planter-box", (10.0, 10.0, 5.0), (0, 0, 2.5), m["stone"], bevel=0.4)
        kit.box("planter-soil", (8.6, 8.6, 0.4), (0, 0, 5.0), m["soil"])
        for i, (x, y, r) in enumerate(((-1.6, -1.2, 3.2), (1.8, 1.0, 3.6), (0.4, -0.2, 2.6))):
            bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=2, location=(x, y, 5.0 + r * 0.8))
            shrub = bpy.context.active_object
            shrub.name = f"shrub-{i}"
            shrub.data.materials.append(m["leaf"])
    else:
        raise ValueError(name)


PROPS = ["bench", "bin", "hydrant", "shelter", "mailbox", "planter"]

out_dir, preview_dir = kit.args()
only = os.environ.get("PROP")
for name in [p for p in PROPS if not only or p == only]:
    kit.reset()
    kit._materials.clear()
    build(name, mats())
    if out_dir:
        kit.export(os.path.join(out_dir, f"{name}.glb"))
    if preview_dir:
        kit.preview(os.path.join(preview_dir, f"prop-{name}.png"), target=(0, 0, 6), distance=48, height=26, angle=60)

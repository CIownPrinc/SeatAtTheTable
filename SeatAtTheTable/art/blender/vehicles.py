"""Every car class in the game, from one parametric builder.

Each class gets its own silhouette, not a repaint: the beater is dented and rusty, the muscle car
is all hood, the supercar is a wedge. The body colour is always the material named "paint", which
the game recolours per car. Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import os
import sys

import bpy
from mathutils import Vector

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402

BASE = "#8a2f2f"


def mats():
    return {
        "paint": kit.material("paint", BASE, roughness=0.32, metallic=0.35),
        "dull": kit.material("paint-dull", "#7d8a99", roughness=0.85, metallic=0.05),
        "glass": kit.material("glass", "#1c2733", roughness=0.08, metallic=0.6),
        "trim": kit.material("trim", "#1b1d22", roughness=0.7),
        "tyre": kit.material("tyre", "#141414", roughness=0.9),
        "chrome": kit.material("chrome", "#c7cad1", roughness=0.18, metallic=0.95),
        "head": kit.material("headlight", "#fff4d6", roughness=0.2, emission="#ffe9b0", strength=1.4),
        "tail": kit.material("taillight", "#b8141c", roughness=0.3, emission="#ff2a2a", strength=1.0),
        "rust": kit.material("rust", "#7a4a2a", roughness=0.95),
        "primer": kit.material("primer", "#8f9296", roughness=0.9),
        "white": kit.material("livery-white", "#eef0f2", roughness=0.4),
        "red": kit.material("beacon-red", "#ff2a2a", roughness=0.3, emission="#ff2020", strength=2.0),
        "blue": kit.material("beacon-blue", "#2a5bff", roughness=0.3, emission="#2050ff", strength=2.0),
        "taxi": kit.material("taxi-sign", "#ffd23a", roughness=0.4, emission="#ffc400", strength=0.9),
        "seat": kit.material("seat", "#3a2a24", roughness=0.8),
        "led": kit.material("led", "#e8f6ff", roughness=0.2, emission="#d8f0ff", strength=2.2),
    }


def wheels(m, xs, width, radius, track, hub=True, skip_hub=None):
    for x in xs:
        for side in (-1, 1):
            name = f"wheel-{x:+.0f}-{side}"
            loc = (x, side * track, radius)
            kit.cylinder(f"{name}-tyre", radius, width, loc, m["tyre"], vertices=24, bevel=radius * 0.18)
            if hub and (x, side) != skip_hub:
                kit.cylinder(f"{name}-hub", radius * 0.58, width * 0.3, (x, side * (track + width * 0.38), radius), m["chrome"], vertices=16, bevel=0.15)


def lights(m, length, width, z, rear_z=None, led=False):
    if led:
        kit.box("lightbar-front", (0.4, width - 3, 0.6), (length / 2, 0, z), m["led"], bevel=0.2)
        kit.box("lightbar-rear", (0.4, width - 3, 0.6), (-length / 2, 0, rear_z or z), m["tail"], bevel=0.2)
        return
    for side in (-1, 1):
        kit.box(f"headlight-{side}", (0.6, 3.0, 1.3), (length / 2 - 0.1, side * (width / 2 - 2.5), z), m["head"], bevel=0.3)
        kit.box(f"taillight-{side}", (0.6, 3.2, 1.2), (-length / 2 + 0.1, side * (width / 2 - 2.4), rear_z or z), m["tail"], bevel=0.3)


def saloon(m, length=34.0, width=15.0, body_h=5.2, cabin=(16.5, 10.5, 4.8, -1.6), hood=10.5, trunk=6.5, wheel_r=3.3, paint=None, bevel=1.5):
    """The common three-box car: body slab, hood, trunk, glasshouse and roof."""
    p = paint or m["paint"]
    kit.tapered_box("body", (length, width), (length - 2.2, width - 0.8), body_h, (0, 0, 2.4), p, bevel=bevel, segments=3)
    top = 2.4 + body_h
    if hood:
        kit.tapered_box("hood", (hood, width - 0.6), (hood - 1.5, width - 1.6), 0.9, (length / 2 - hood / 2 - 1.2, 0, top - 0.2), p, bevel=0.5)
    if trunk:
        kit.tapered_box("trunk", (trunk, width - 0.6), (trunk - 0.9, width - 1.6), 0.9, (-length / 2 + trunk / 2 + 1.2, 0, top - 0.2), p, bevel=0.5)
    bottom, upper, height, offset = cabin
    if height:
        kit.tapered_box("cabin", (bottom, width - 1.6), (upper, width - 3.4), height, (offset, 0, top - 0.2), m["glass"], top_offset=(-0.8, 0), bevel=0.7)
        kit.tapered_box("roof", (upper + 0.3, width - 3.2), (upper - 0.5, width - 3.8), 0.7, (offset - 0.8, 0, top - 0.2 + height), p, bevel=0.35)
    for name, x in (("bumper-front", length / 2 - 0.2), ("bumper-rear", -length / 2 + 0.2)):
        kit.box(name, (1.6, width - 0.6, 2.0), (x, 0, 3.2), m["trim"], bevel=0.6)
    return top


def tube(name, a, b, radius, mat, vertices=10):
    """A round tube from point a to point b: frame rails, forks, exhaust pipes."""
    a, b = Vector(a), Vector(b)
    obj = kit.cylinder(name, radius, (b - a).length, tuple((a + b) / 2), mat, axis="Z", vertices=vertices)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = (b - a).to_track_quat("Z", "Y")
    return obj


def bike_wheel(m, name, x, radius, width):
    kit.cylinder(f"{name}-tyre", radius, width, (x, 0, radius), m["tyre"], vertices=24, bevel=radius * 0.22)
    kit.cylinder(f"{name}-rim", radius * 0.72, width * 1.05, (x, 0, radius), m["chrome"], vertices=20)
    kit.cylinder(f"{name}-hub", radius * 0.22, width * 1.4, (x, 0, radius), m["trim"], vertices=12)


def chopper(m):
    """Long and low: raked-out forks to a thin front wheel, a fat rear tyre, a teardrop tank, a
    V-twin, twin pipes down the side and tall ape-hanger bars."""
    bike_wheel(m, "rear", -6.0, 2.5, 1.7)
    bike_wheel(m, "front", 7.2, 2.7, 0.8)
    tube("backbone", (-5.0, 0, 5.2), (3.6, 0, 6.8), 0.45, m["chrome"])
    tube("downtube", (3.6, 0, 6.8), (1.6, 0, 2.2), 0.45, m["chrome"])
    tube("cradle", (1.6, 0, 2.0), (-5.6, 0, 2.6), 0.4, m["chrome"])
    for side in (-1, 1):
        tube(f"fork-{side}", (4.0, side * 0.9, 8.8), (7.2, side * 0.9, 2.7), 0.38, m["chrome"])
        tube(f"riser-{side}", (4.2, side * 0.9, 8.6), (4.0, side * 1.6, 11.2), 0.25, m["chrome"])
        kit.cylinder(f"peg-{side}", 0.25, 1.4, (3.4, side * 2.0, 2.8), m["chrome"])
    tube("ape-bar", (4.0, -4.0, 11.4), (4.0, 4.0, 11.4), 0.25, m["chrome"])
    for side in (-1, 1):
        kit.cylinder(f"grip-{side}", 0.42, 1.4, (4.0, side * 3.4, 11.4), m["trim"])
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1.6, segments=18, ring_count=12, location=(1.6, 0, 7.1))
    tank = bpy.context.active_object
    tank.name = "tank"
    tank.scale = (1.75, 0.82, 0.72)
    tank.data.materials.append(m["paint"])
    bpy.ops.object.shade_smooth()
    kit.tapered_box("seat", (4.2, 2.4), (3.6, 1.8), 0.9, (-2.4, 0, 5.4), m["seat"], bevel=0.35)
    kit.tapered_box("fender-rear", (5.4, 2.0), (4.2, 1.8), 0.5, (-6.2, 0, 5.0), m["paint"], bevel=0.25)
    for i, tilt in enumerate((-0.45, 0.45)):
        cyl = kit.cylinder(f"cylinder-{i}", 0.85, 3.0, (0.2 + i * 1.1, 0, 4.2), m["chrome"], axis="Z", vertices=14, bevel=0.15)
        cyl.rotation_euler = (0, tilt, 0)
    kit.box("crankcase", (3.2, 1.8, 1.6), (0.6, 0, 2.6), m["trim"], bevel=0.3)
    for z in (2.2, 3.1):
        tube(f"pipe-{z}", (0.5, 1.4, z + 0.4), (-8.4, 1.4, z), 0.32, m["chrome"])
    kit.box("headlight", (0.8, 1.6, 1.6), (7.9, 0, 7.9), m["head"], bevel=0.5)
    kit.box("taillight", (0.5, 1.2, 0.6), (-8.6, 0, 5.3), m["tail"], bevel=0.2)


def sportbike(m):
    """A streetfighter: crouched, a sharp nose fairing with a screen, the tank and a short seat
    sweeping up into the tail, clip-on bars and mirrors, and the pipe tucked under the seat."""
    bike_wheel(m, "rear", -5.8, 2.4, 1.5)
    bike_wheel(m, "front", 6.6, 2.4, 1.0)
    kit.box("engine", (4.2, 2.2, 3.0), (0.4, 0, 3.8), m["trim"], bevel=0.4)
    tube("swingarm", (-1.6, 0.9, 3.4), (-5.8, 0.9, 2.4), 0.35, m["trim"])
    for side in (-1, 1):
        tube(f"fork-{side}", (5.1, side * 0.8, 7.6), (6.6, side * 0.8, 2.4), 0.36, m["chrome"])
        kit.cylinder(f"clip-on-{side}", 0.3, 1.8, (4.6, side * 1.5, 7.7), m["trim"])
        tube(f"mirror-stalk-{side}", (4.8, side * 1.6, 8.4), (4.6, side * 3.4, 9.2), 0.12, m["trim"])
        kit.box(f"mirror-{side}", (0.4, 1.2, 0.7), (4.6, side * 3.6, 9.3), m["trim"], bevel=0.15)
    kit.tapered_box("fairing", (5.6, 2.6), (3.4, 1.8), 3.2, (4.6, 0, 4.6), m["paint"], top_offset=(-0.8, 0), bevel=0.5)
    kit.tapered_box("screen", (1.8, 1.6), (1.0, 1.2), 1.6, (5.2, 0, 7.8), m["glass"], top_offset=(-0.6, 0), bevel=0.2)
    kit.tapered_box("tank", (4.6, 2.6), (3.6, 2.0), 1.6, (1.4, 0, 5.8), m["paint"], bevel=0.5)
    kit.tapered_box("seat", (3.6, 2.0), (3.2, 1.7), 0.6, (-2.2, 0, 6.2), m["seat"], bevel=0.25)
    tail = kit.tapered_box("tail", (4.2, 1.8), (2.4, 1.0), 1.3, (-5.4, 0, 6.3), m["paint"], top_offset=(-0.9, 0), bevel=0.4)
    tail.rotation_euler = (0, 0.18, 0)
    tube("exhaust", (-1.0, 0.6, 4.4), (-6.8, 0.6, 6.0), 0.5, m["chrome"])
    for side in (-1, 1):
        kit.box(f"headlight-{side}", (0.6, 0.8, 0.6), (7.4, side * 0.5, 6.0), m["head"], bevel=0.2)
    kit.box("taillight", (0.4, 1.0, 0.4), (-7.7, 0, 7.4), m["tail"], bevel=0.15)


def build(cls, m):
    if cls == "sedan":
        saloon(m)
        wheels(m, (10.5, -10.5), 2.6, 3.3, 6.6)
        lights(m, 34, 15, 5.6)
        kit.box("grille", (0.5, 6.0, 1.4), (17.05, 0, 4.8), m["trim"], bevel=0.2)
    elif cls == "beater":
        # Boxy, dull paint, a primer-grey door, rust along the sills, one hubcap gone, bumper hanging.
        saloon(m, length=30, width=14, body_h=5.4, cabin=(15, 12.5, 4.6, -1.0), hood=8.5, trunk=5.5, paint=m["paint"], bevel=0.9)
        kit.box("primer-door", (6.2, 0.5, 4.2), (1.5, 7.05, 5.0), m["primer"], bevel=0.3)
        for x in (-9, -2, 6):
            for side in (-1, 1):
                kit.box(f"rust-{x}-{side}", (2.6 + (x % 3), 0.4, 1.4), (x, side * 7.05, 3.0), m["rust"], bevel=0.2)
        kit.box("rust-hood", (3.0, 2.2, 0.3), (9.5, -2.5, 8.25), m["rust"], bevel=0.1)
        wheels(m, (9.2, -9.2), 2.4, 3.1, 6.1, skip_hub=(-9.2, 1))
        lights(m, 30, 14, 5.6)
        sag = kit.box("bumper-sag", (1.6, 6.0, 1.6), (-15.3, -3.5, 2.6), m["trim"], bevel=0.4)
        sag.rotation_euler = (0.18, 0, 0)
    elif cls == "wagon":
        saloon(m, length=33, width=15, body_h=5.2, cabin=(22, 20, 4.8, -3.6), hood=9.5, trunk=0, paint=m["paint"], bevel=1.2)
        for side in (-1, 1):
            kit.box(f"roof-rail-{side}", (19, 0.6, 0.6), (-4.4, side * 5.2, 13.3), m["chrome"], bevel=0.2)
        wheels(m, (10.2, -10.8), 2.5, 3.2, 6.6)
        lights(m, 33, 15, 5.6)
    elif cls == "muscle":
        saloon(m, length=35, width=16, body_h=4.6, cabin=(13.5, 8.0, 4.0, -3.4), hood=14, trunk=5.0, wheel_r=3.6, bevel=1.4)
        kit.box("scoop", (4.5, 3.2, 1.0), (8.5, 0, 8.3), m["trim"], bevel=0.4)
        # Twin stripes lying on the hood, roof and trunk, each just above its panel.
        for side in (-1, 1):
            for name, length, x, z in (("hood", 13.5, 9.6, 7.95), ("roof", 7.6, -4.2, 11.75), ("trunk", 4.6, -14.5, 7.95)):
                kit.box(f"stripe-{name}-{side}", (length, 1.1, 0.12), (x, side * 1.4, z), m["white"])
        wheels(m, (11.2,), 2.6, 3.4, 7.0)
        wheels(m, (-10.8,), 3.4, 3.7, 7.0)
        lights(m, 35, 16, 5.3)
        for side in (-1, 1):
            kit.cylinder(f"exhaust-{side}", 0.7, 2.4, (-17.8, side * 4.5, 2.4), m["chrome"], axis="X", vertices=12)
    elif cls == "suv":
        top = saloon(m, length=34, width=17, body_h=7.6, cabin=(21, 19.5, 6.2, -2.5), hood=9.5, trunk=0, bevel=1.6)
        for side in (-1, 1):
            kit.box(f"roof-rail-{side}", (16, 0.7, 0.8), (-3.3, side * 6.2, top + 6.6), m["trim"], bevel=0.2)
            kit.box(f"step-{side}", (14, 1.6, 0.6), (0, side * 8.9, 2.4), m["trim"], bevel=0.2)
        wheels(m, (10.8, -10.8), 3.0, 4.2, 7.4)
        lights(m, 34, 17, 7.6)
        kit.box("grille", (0.5, 8.0, 2.4), (17.05, 0, 6.6), m["chrome"], bevel=0.3)
    elif cls == "armored":
        top = saloon(m, length=35, width=19, body_h=8.4, cabin=(19, 18.5, 5.2, -3.0), hood=10, trunk=0, bevel=0.8)
        for side in (-1, 1):
            kit.box(f"plate-{side}", (26, 0.8, 4.4), (-1.0, side * 9.6, 6.4), m["trim"], bevel=0.3)
            kit.box(f"slit-{side}", (12, 0.4, 1.2), (-2.5, side * 9.0, top + 3.2), m["glass"], bevel=0.1)
        kit.box("bullbar", (1.2, 15, 4.0), (18.2, 0, 4.8), m["trim"], bevel=0.5)
        wheels(m, (11.2, -11.2), 3.4, 4.5, 8.4, hub=False)
        lights(m, 35, 19, 8.0)
    elif cls == "pickup":
        top = saloon(m, length=36, width=17, body_h=7.0, cabin=(11, 9.5, 5.8, 3.0), hood=10, trunk=0, bevel=1.3)
        kit.box("bed-floor", (14, 15, 0.6), (-10.2, 0, top + 0.2), m["trim"], bevel=0.2)
        for side in (-1, 1):
            kit.box(f"bed-side-{side}", (14.5, 0.8, 3.0), (-10.2, side * 7.7, top + 1.4), m["paint"], bevel=0.3)
        kit.box("tailgate", (0.8, 15.5, 3.0), (-17.5, 0, top + 1.4), m["paint"], bevel=0.3)
        wheels(m, (11.5, -11.0), 3.0, 4.0, 7.4)
        lights(m, 36, 17, 7.2)
    elif cls == "van":
        kit.tapered_box("body", (34, 17), (31, 16.2), 15, (0, 0, 2.4), m["paint"], top_offset=(-1.4, 0), bevel=1.6, segments=3)
        kit.tapered_box("windscreen", (0.6, 14.5), (0.6, 13.5), 5.5, (15.9, 0, 10.0), m["glass"], top_offset=(-1.6, 0), bevel=0.2)
        for side in (-1, 1):
            kit.box(f"cab-window-{side}", (5.0, 0.4, 4.0), (11.5, side * 8.45, 12.2), m["glass"], bevel=0.2)
            kit.box(f"side-door-line-{side}", (0.3, 0.3, 11), (2.0, side * 8.5, 9.0), m["trim"])
        kit.box("bumper-front", (1.6, 16.4, 2.0), (16.9, 0, 3.2), m["trim"], bevel=0.6)
        kit.box("bumper-rear", (1.6, 16.4, 2.0), (-16.9, 0, 3.2), m["trim"], bevel=0.6)
        wheels(m, (11.0, -11.0), 2.8, 3.6, 7.6)
        lights(m, 34, 17, 6.4, rear_z=8.0)
    elif cls in ("ev", "ev-luxury"):
        length = 33 if cls == "ev" else 37
        top = saloon(m, length=length, width=15.5, body_h=4.8, cabin=(length * 0.62, length * 0.36, 4.6, -1.2), hood=0, trunk=0, bevel=2.1)
        kit.tapered_box("nose", (8, 14.5), (5, 13.5), 1.2, (length / 2 - 4.6, 0, top - 0.5), m["paint"], bevel=0.9)
        if cls == "ev-luxury":
            for side in (-1, 1):
                kit.box(f"chrome-line-{side}", (length - 6, 0.3, 0.4), (-0.5, side * 7.8, 6.2), m["chrome"])
        for x in (length * 0.31, -length * 0.31):
            for side in (-1, 1):
                kit.cylinder(f"wheel-{x:+.0f}-{side}-tyre", 3.3, 2.5, (x, side * 6.8, 3.3), m["tyre"], vertices=24, bevel=0.6)
                kit.cylinder(f"wheel-{x:+.0f}-{side}-aero", 2.6, 0.6, (x, side * 8.15, 3.3), m["paint"], vertices=24, bevel=0.2)
        lights(m, length, 15.5, 5.6, led=True)
    elif cls == "ev-van":
        kit.tapered_box("body", (33, 17), (29, 16), 14, (0, 0, 2.4), m["paint"], top_offset=(-1.8, 0), bevel=2.6, segments=3)
        kit.tapered_box("windscreen", (0.6, 14.5), (0.6, 13.5), 6.0, (15.0, 0, 9.0), m["glass"], top_offset=(-2.5, 0), bevel=0.2)
        wheels(m, (10.8, -10.8), 2.8, 3.5, 7.6)
        lights(m, 33, 17, 6.0, led=True)
    elif cls == "supercar":
        kit.tapered_box("body", (34, 17), (30, 15.5), 4.2, (0, 0, 1.8), m["paint"], bevel=1.8, segments=3)
        kit.tapered_box("wedge", (14, 15.5), (6, 14.5), 1.6, (10.0, 0, 5.8), m["paint"], top_offset=(-3.5, 0), bevel=0.7)
        kit.tapered_box("cabin", (13, 13), (6.5, 10), 3.4, (-2.0, 0, 5.8), m["glass"], top_offset=(-1.8, 0), bevel=0.8)
        kit.tapered_box("engine-deck", (11, 15), (10, 14), 1.4, (-11.5, 0, 5.8), m["trim"], bevel=0.4)
        kit.box("wing", (3.0, 15.5, 0.5), (-16.0, 0, 9.4), m["trim"], bevel=0.2)
        for side in (-1, 1):
            kit.box(f"wing-strut-{side}", (1.0, 0.5, 2.4), (-15.6, side * 5.5, 8.0), m["trim"])
            kit.box(f"intake-{side}", (5, 0.5, 2.2), (-3.0, side * 8.6, 4.4), m["trim"], bevel=0.3)
        wheels(m, (10.8,), 2.6, 3.2, 7.4)
        wheels(m, (-10.6,), 3.4, 3.4, 7.4)
        lights(m, 34, 17, 4.6)
    elif cls == "roadster":
        saloon(m, length=31, width=15, body_h=4.6, cabin=(0, 0, 0, 0), hood=13, trunk=6, bevel=1.6)
        kit.tapered_box("windscreen", (0.6, 13), (0.6, 12.5), 3.4, (3.6, 0, 7.0), m["glass"], top_offset=(-1.4, 0), bevel=0.2)
        for side in (-1, 1):
            kit.box(f"seat-{side}", (4.0, 4.6, 3.2), (-2.5, side * 3.3, 7.6), m["seat"], bevel=0.8)
        kit.box("rollbar", (1.0, 12, 3.2), (-5.4, 0, 9.0), m["chrome"], bevel=0.4)
        wheels(m, (10.0, -10.0), 2.6, 3.2, 6.6)
        lights(m, 31, 15, 5.3)
    elif cls in ("police", "taxi"):
        top = saloon(m)
        wheels(m, (10.5, -10.5), 2.6, 3.3, 6.6)
        lights(m, 34, 15, 5.6)
        if cls == "police":
            for side in (-1, 1):
                kit.box(f"door-white-{side}", (12, 0.5, 4.4), (0, side * 7.4, 5.0), m["white"], bevel=0.3)
            kit.box("lightbar", (2.2, 9.0, 1.1), (-2.4, 0, top + 5.8), m["trim"], bevel=0.3)
            kit.box("beacon-red", (1.8, 3.6, 0.9), (-2.4, -2.4, top + 6.6), m["red"], bevel=0.3)
            kit.box("beacon-blue", (1.8, 3.6, 0.9), (-2.4, 2.4, top + 6.6), m["blue"], bevel=0.3)
        else:
            kit.box("taxi-sign", (2.6, 6.5, 1.9), (-2.4, 0, top + 6.2), m["taxi"], bevel=0.4)
            for side in (-1, 1):
                kit.box(f"checker-{side}", (22, 0.4, 0.9), (0, side * 7.45, 6.8), m["trim"])
    elif cls == "truck":
        kit.tapered_box("cab", (12, 17), (10.5, 16), 13, (18, 0, 3.4), m["paint"], top_offset=(-0.8, 0), bevel=1.4, segments=3)
        kit.tapered_box("windscreen", (0.6, 14.5), (0.6, 14), 5.0, (24.1, 0, 10.0), m["glass"], top_offset=(-0.8, 0), bevel=0.2)
        kit.box("chassis", (54, 12, 2.2), (0, 0, 3.6), m["trim"], bevel=0.3)
        kit.box("cargo", (38, 18, 17), (-7.5, 0, 13.6), m["white"], bevel=0.8)
        wheels(m, (19.0, -12.0, -20.0), 3.0, 4.2, 7.6, hub=False)
        lights(m, 49, 17, 6.2)
    elif cls == "tractor":
        kit.box("chassis", (20, 8, 4), (2, 0, 6.5), m["paint"], bevel=0.8)
        kit.tapered_box("hood", (11, 7.5), (10, 6.5), 4.0, (7.5, 0, 8.4), m["paint"], bevel=0.8)
        kit.tapered_box("cab", (8, 11), (8, 10), 9.0, (-4.0, 0, 8.4), m["glass"], bevel=0.4)
        kit.box("cab-roof", (9.5, 12, 0.8), (-4.0, 0, 17.6), m["paint"], bevel=0.3)
        kit.cylinder("exhaust", 0.6, 6, (10.0, 2.2, 14.0), m["trim"], axis="Z", vertices=10)
        for side in (-1, 1):
            kit.cylinder(f"wheel-rear-{side}-tyre", 6.5, 4.0, (-4.5, side * 7.5, 6.5), m["tyre"], vertices=26, bevel=1.0)
            kit.cylinder(f"wheel-front-{side}-tyre", 3.6, 2.6, (10.5, side * 5.6, 3.6), m["tyre"], vertices=22, bevel=0.6)
    elif cls == "garbage":
        # The city garbage truck: green cab and compactor body, bin lifter at the back, trash
        # bags spilling over the hopper.
        green = kit.material("garbage-green", "#2f6b3a", roughness=0.5, metallic=0.2)
        kit.tapered_box("cab", (12, 18), (11, 17), 12.5, (19.5, 0, 3.4), green, top_offset=(-0.6, 0), bevel=1.4, segments=3)
        kit.tapered_box("windscreen", (0.6, 15), (0.6, 14.5), 4.6, (25.6, 0, 10.6), m["glass"], top_offset=(-0.6, 0), bevel=0.2)
        kit.box("chassis", (54, 12, 2.2), (0, 0, 3.6), m["trim"], bevel=0.3)
        kit.tapered_box("body", (36, 19), (32, 18), 15.5, (-6.5, 0, 4.6), green, top_offset=(-1.5, 0), bevel=1.6, segments=3)
        kit.box("hopper", (8, 19, 9), (-26.5, 0, 9.5), m["chrome"], bevel=0.6)
        for side in (-1, 1):
            kit.box(f"stripe-{side}", (34, 0.4, 1.4), (-6.5, side * 9.6, 9.0), m["white"])
            kit.box(f"lifter-arm-{side}", (1.2, 1.2, 10), (-30.8, side * 6.5, 8.5), m["trim"], bevel=0.3)
        trash = [kit.material("trash-a", "#1c1c1c", roughness=0.4), kit.material("trash-b", "#3b4a2a", roughness=0.5), kit.material("trash-c", "#6b5a3a", roughness=0.9)]
        for x in (-18, -10, -2, 6):
            kit.box(f"rib-{x}", (0.9, 19.4, 15.0), (x, 0, 12.0), green, bevel=0.3)
        # Overflowing: bags piled on the roof and spilling out of the hopper, visible from above.
        bags = [(-25.5, -4.5, 14.8, 2.6), (-27.2, 2.0, 15.4, 2.9), (-24.4, 5.6, 14.6, 2.2), (-28.6, -1.0, 17.0, 2.0),
                (-19.0, -3.5, 21.4, 2.8), (-14.5, 3.0, 21.6, 3.1), (-9.0, -1.0, 21.2, 2.6), (-16.5, -0.5, 23.6, 2.2),
                (-4.0, 4.5, 21.0, 2.0), (-21.5, 5.0, 21.0, 2.1)]
        for i, (x, y, z, r) in enumerate(bags):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=10, ring_count=8, location=(x, y, z))
            bag = bpy.context.active_object
            bag.name = f"trash-{i}"
            bag.scale = (1.0, 0.85, 0.8)
            bag.data.materials.append(trash[i % 3])
        kit.box("bin", (3.4, 3.4, 4.6), (-31.8, 0, 6.0), kit.material("bin", "#1f4fa8", roughness=0.6), bevel=0.4)
        wheels(m, (20.5, -12.0, -20.0), 3.0, 4.2, 7.6, hub=False)
        lights(m, 51, 18, 6.2)
    elif cls == "helicopter":
        body = kit.material("heli-body", "#2c3a4a", roughness=0.35, metallic=0.4)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=9, segments=24, ring_count=16, location=(4, 0, 12))
        fuselage = bpy.context.active_object
        fuselage.name = "fuselage"
        fuselage.scale = (1.55, 0.9, 0.95)
        fuselage.data.materials.append(body)
        bpy.ops.object.shade_smooth()
        bpy.ops.mesh.primitive_uv_sphere_add(radius=6.6, segments=20, ring_count=12, location=(11.5, 0, 13.4))
        canopy = bpy.context.active_object
        canopy.name = "canopy"
        canopy.scale = (1.1, 0.95, 0.8)
        canopy.data.materials.append(m["glass"])
        bpy.ops.object.shade_smooth()
        boom = kit.cylinder("tail-boom", 1.6, 26, (-17, 0, 14.5), body, axis="X", vertices=14, bevel=0.3)
        boom.scale = (1, 1, 1)
        kit.box("tail-fin", (5.5, 0.8, 8.5), (-29.5, 0, 18.0), kit.material("tail-red", "#c43b2e", roughness=0.5), bevel=0.4)
        kit.cylinder("tail-rotor", 3.2, 0.4, (-29.5, 1.0, 18.0), m["trim"], axis="Y", vertices=14)
        for side in (-1, 1):
            kit.box(f"skid-{side}", (26, 1.1, 1.1), (3, side * 6.8, 1.0), m["trim"], bevel=0.4)
            for x in (-4, 10):
                kit.box(f"skid-strut-{side}-{x}", (0.9, 0.9, 6), (x, side * 5.8, 3.8), m["trim"])
        lights(m, 30, 10, 9.0)
        # The main rotor is one object named "rotor", pivoting at its hub, so the game can spin it.
        hub = kit.cylinder("rotor", 1.3, 3.0, (4, 0, 22.5), m["trim"], axis="Z", vertices=12)
        blades = [kit.box(f"blade-{a}", (54, 3.2, 0.5) if a == 0 else (3.2, 54, 0.5), (4, 0, 24.0), m["trim"], bevel=0.2) for a in (0, 1)]
        bpy.ops.object.select_all(action="DESELECT")
        for blade in blades:
            blade.select_set(True)
        hub.select_set(True)
        bpy.context.view_layer.objects.active = hub
        bpy.ops.object.join()
    elif cls == "chopper":
        chopper(m)
    elif cls == "sportbike":
        sportbike(m)
    else:
        raise ValueError(cls)


CLASSES = ["sedan", "beater", "wagon", "muscle", "suv", "armored", "pickup", "van", "ev", "ev-luxury", "ev-van", "supercar", "roadster", "police", "taxi", "truck", "tractor", "garbage", "helicopter", "chopper", "sportbike"]

out_dir, preview_dir = kit.args()
only = os.environ.get("VEHICLE")
for cls in [c for c in CLASSES if not only or c == only]:
    kit.reset()
    kit._materials.clear()
    build(cls, mats())
    if out_dir:
        kit.export(os.path.join(out_dir, f"{cls}.glb"))
    if preview_dir:
        kit.preview(os.path.join(preview_dir, f"vehicle-{cls}.png"), distance=78, height=36)

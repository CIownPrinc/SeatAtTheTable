"""Furniture for the rooms you walk around in (src/map/interiorLayout.ts, src/map/mallInterior.ts) and
the two 3D minigames (src/map/minigameScenes.ts).

Room furniture is in room units, the ones the layouts use (a person stands about 37 of them tall),
modelled in the game's frame (lib/frame.py): y up, front toward +z (toward the room's door), standing
on the floor at the origin. Sizes copied from the layouts; change one, change the other. Parts are
named by material, and the game recolours a few to suit each room ('wood', 'accent', 'stone',
'screen', 'counter', 'menu'). Parts named 'clear-...' are glass the game draws see-through. The minigame pieces are in the minigames' own units, tenths of a metre.
Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import math
import os
import sys

import bpy

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402
from frame import box, log, post, prism, rod  # noqa: E402


def m(name, color, roughness=0.7, metallic=0.0, emission=None, strength=1.0):
    return kit.material(name, color, roughness=roughness, metallic=metallic, emission=emission, strength=strength)


def wood():
    return m("wood", "#6b4a2c", 0.7)


def brass():
    return m("brass", "#c9b26b", 0.35, 0.6)


def ball(name, r, x, y, z, mat, squash=1.0, segments=12):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r, segments=segments, ring_count=max(6, segments // 2), location=(x, -z, y))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (1, 1, squash)
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def triangle(name, points, mat):
    """One double-sided triangle through three points in the game's frame."""
    from frame import at
    mesh = bpy.data.meshes.new(name)
    mesh.from_pydata([at(*p) for p in points], [], [(0, 1, 2), (0, 2, 1)])
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def ring(name, major, minor, x, y, z, mat, upright=False, segments=24):
    """A torus lying flat (or standing facing +z when `upright`)."""
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=segments, minor_segments=8,
                                     location=(x, -z, y), rotation=(math.pi / 2, 0, 0) if upright else (0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    bpy.ops.object.shade_smooth()
    return obj


def disc(name, r, h, x, y, z, mat, vertices=28, facing_z=False):
    """A cylinder h tall standing up, or h deep facing +z; (x, y, z) is its centre."""
    if facing_z:
        return log(name, r, h, x, y, z, mat, along="z", vertices=vertices)
    return post(name, r, h, x, y, z, mat, vertices=vertices)


# --- Counters, boards, storage ------------------------------------------------------------------------

def counter():
    """A shop counter 96 wide: a wood front with raised panels, a kick plinth, and a top."""
    w = wood()
    box("kick", 94, 3, 20, 0, 1.5, -0.5, m("kick", "#2a2018", 0.8))
    box("body", 96, 21, 22, 0, 13.5, 0, w)
    for i in range(4):
        x = -36 + i * 24
        box("panel", 20, 13, 0.8, x, 12.5, 11.3, w, bevel=0.3)
        box("panel-inset", 16, 9, 0.5, x, 12.5, 11.8, m("panel-shadow", "#4a3420", 0.8))
    box("top", 100, 3, 26, 0, 25.5, 0, m("top", "#e0d6bf", 0.45), bevel=0.6)
    box("shelf", 90, 1.2, 8, 0, 16, -8, w)


def notice_board():
    w = wood()
    for x in (-32, 32):
        box("post", 4, 70, 4, x, 35, 0, w, bevel=0.3)
    box("frame", 66, 42, 4, 0, 46, 0, w, bevel=0.4)
    box("cork", 60, 36, 1, 0, 46, 2.2, m("cork", "#a07a4a", 0.95))
    papers = ["#f1ead2", "#e8c46a", "#9ec3d6", "#f0a8a0", "#ffffff", "#c8e0a4"]
    for i, color in enumerate(papers):
        x, y = -20 + (i % 3) * 20, 54 - (i // 3) * 16
        box("paper", 13, 11 if i % 2 else 13, 0.3, x, y, 2.9, m(f"paper-{i}", color, 0.9), turn=0, roll=(i - 2.5) * 0.04)
        ball("pin", 0.9, x, y + 5, 3.3, m("pin", "#c0392b", 0.4), segments=6)
    box("ledge", 62, 1.2, 3, 0, 26.6, 2, w)


def safe():
    steel = m("safe", "#3a4048", 0.45, 0.6)
    box("body", 30, 32, 26, 0, 17, 0, steel, bevel=0.8)
    for x in (-12, 12):
        for z in (-10, 10):
            box("foot", 3, 1.2, 3, x, 0.6, z, m("foot", "#1a1c20", 0.6))
    box("door", 24, 26, 1, 0, 17, 13.2, m("safe-door", "#4c535c", 0.4, 0.6), bevel=0.4)
    disc("dial", 3, 1.6, 5, 20, 14.4, brass(), facing_z=True)
    disc("dial-ring", 3.8, 0.6, 5, 20, 13.9, m("dial-ring", "#d8d4c8", 0.4, 0.5), facing_z=True)
    box("handle", 1.2, 8, 1.6, -6, 17, 14.4, brass())
    for y in (8, 26):
        box("hinge", 1.6, 4, 2, -12.6, y, 13.2, m("foot", "#1a1c20"))


def vault_door():
    """The vault door on the back wall: its origin is the foot of the wall, the door's centre 40 up."""
    rim, door, accent = m("vault-rim", "#4a525c", 0.4, 0.7), m("vault-door", "#5c656f", 0.35, 0.7), m("accent", "#d4a017", 0.35, 0.6)
    disc("rim", 38, 6, 0, 40, 3, rim, vertices=40, facing_z=True)
    ring("rim-lip", 35, 1.4, 0, 40, 6.2, m("vault-rim", "#4a525c"), upright=True, segments=40)
    disc("door", 28, 4, 0, 40, 7, door, vertices=40, facing_z=True)
    for i in range(12):
        a = i / 12 * math.tau
        disc("bolt", 1.4, 2, math.cos(a) * 24, 40 + math.sin(a) * 24, 9.4, m("bolt", "#8a939c", 0.3, 0.8), vertices=10, facing_z=True)
    # The wheel: a hub and three spokes with knobs on the ends.
    disc("hub", 6, 4, 0, 40, 10, accent, vertices=20, facing_z=True)
    for i in range(3):
        a = i / 3 * math.pi
        dx, dy = math.cos(a) * 14, math.sin(a) * 14
        rod("spoke", 0.9, (-dx, 40 - dy, 11.5), (dx, 40 + dy, 11.5), accent, vertices=8)
        for s in (-1, 1):
            ball("knob", 1.6, s * dx, 40 + s * dy, 11.5, accent, segments=8)
    box("hinge", 6, 30, 6, 30, 40, 5, rim, bevel=0.5)
    disc("keypad", 2.4, 0.6, 22, 58, 9, m("keypad", "#000000", 0.4, emission="#30ff70", strength=0.8), vertices=4, facing_z=True)


def plan_table():
    w = m("plan-wood", "#3a3028", 0.75)
    box("top", 70, 3, 30, 0, 26.5, 0, w, bevel=0.4)
    for x in (-32, 32):
        for z in (-12, 12):
            box("leg", 3, 25, 3, x, 12.5, z, w)
    box("stretcher", 64, 2, 2, 0, 6, 0, w)
    box("blueprint", 60, 0.4, 22, 0, 28.2, 0, m("blueprint", "#3d6a9a", 0.8))
    for i in range(6):
        box("plan-line", 50 - i * 6, 0.2, 0.4, -2, 28.5, -8 + i * 3.2, m("plan-ink", "#d8e4f0", 0.6))
    # A desk lamp leaning over the plans.
    disc("lamp-base", 3, 1, 26, 28.5, -8, m("lamp", "#2a2d33", 0.5, 0.4), vertices=12)
    rod("lamp-arm", 0.5, (26, 29, -8), (20, 42, -4), m("lamp", "#2a2d33"))
    bpy.ops.mesh.primitive_cone_add(radius1=3.4, radius2=1.2, depth=4, vertices=14, location=(18, 4, 40))
    bpy.context.active_object.data.materials.append(m("lamp", "#2a2d33"))
    ball("bulb", 1.4, 18, 38.2, -4, m("bulb", "#000000", 0.3, emission="#fff0c0", strength=1.0), segments=8)


def wardrobe():
    w, gap = wood(), m("gap", "#2a1d12", 0.9)
    box("plinth", 50, 3, 20, 0, 1.5, 0, gap)
    box("carcass", 50, 66, 20, 0, 36, 0, w, bevel=0.3)
    box("crown", 54, 3, 22, 0, 70.5, 0, w, bevel=0.4)
    box("gap", 0.6, 62, 0.6, 0, 36, 10.1, gap)
    for s in (-1, 1):
        box("door-panel", 20, 26, 0.6, s * 12.3, 52, 10.3, w, bevel=0.3)
        box("door-panel", 20, 26, 0.6, s * 12.3, 22, 10.3, w, bevel=0.3)
        box("handle", 1.2, 8, 1.4, s * 2.8, 38, 11, brass())


def workbench():
    w = m("bench-wood", "#5c4a36", 0.8)
    top = m("bench-top", "#8a7458", 0.7)
    for x in (-33, 33):
        for z in (-10, 10):
            box("leg", 4, 28.5, 4, x, 14.25, z, w)
    box("shelf", 66, 2, 22, 0, 8, 0, w)
    box("top", 74, 3, 26, 0, 30, 0, top, bevel=0.4)
    for x in range(-34, 35, 4):
        box("block-seam", 0.3, 0.2, 26, x, 31.6, 0, m("seam", "#6a5a44", 0.8))
    # A vice on the front corner, a red toolbox, the pegboard behind with tools on it.
    box("vice", 6, 4, 6, 28, 33.5, 10, m("vice", "#3a5a8a", 0.5, 0.4))
    box("vice-jaw", 8, 3, 2, 28, 35, 13.5, m("vice", "#3a5a8a"))
    box("toolbox", 12, 8, 6, -20, 35.5, 0, m("toolbox", "#c0392b", 0.5, 0.3), bevel=0.3)
    box("toolbox-handle", 8, 1, 1, -20, 40.2, 0, m("steel", "#9aa0a8", 0.4, 0.7))
    box("pegboard", 70, 40, 2, 0, 54, -14, m("pegboard", "#4a3a2a", 0.9))
    steel = m("steel", "#9aa0a8", 0.4, 0.7)
    for i, (x, y, l) in enumerate(((-26, 60, 12), (-16, 62, 9), (-6, 58, 14), (8, 60, 10), (18, 62, 8), (28, 57, 12))):
        box("tool", 1.2, l, 0.8, x, y, -12.6, steel, roll=(i - 3) * 0.1)
    box("rag", 6, 2, 3, 12, 32.5, -6, m("rag", "#c8a040", 0.95))


def slot_machine():
    cab = m("cabinet", "#7a1f2a", 0.45, 0.3)
    box("base", 24, 18, 20, 0, 9, 0, cab, bevel=0.6)
    box("upper", 22, 26, 16, 0, 31, -2, cab, bevel=0.6)
    box("screen-frame", 18, 16, 1, 0, 33, 6.2, m("chrome", "#c7cad1", 0.25, 0.9))
    box("screen", 16, 14, 1, 0, 33, 6.6, m("screen", "#000000", 0.3, emission="#ffd23a", strength=1.0))
    box("ledge", 22, 2, 8, 0, 19, 8, m("ledge", "#2a1a12", 0.6), tilt=-0.2)
    for x in (-6, 0, 6):
        disc("button", 1.4, 0.8, x, 20.6, 9.5, m("button", "#000000", 0.4, emission="#ff5a5a", strength=0.9), vertices=10)
    box("tray", 12, 3, 4, 0, 5, 10.4, m("chrome", "#c7cad1"))
    box("topper", 26, 4, 22, 0, 46, -2, m("topper", "#c9a227", 0.35, 0.6), bevel=0.6)
    box("topper-light", 22, 2, 0.6, 0, 46, 9.2, m("topper-light", "#000000", 0.3, emission="#ffe08a", strength=1.0))
    # The lever on the right side, its knob up top.
    rod("lever", 0.6, (12.4, 22, 0), (13.6, 38, 0), m("chrome", "#c7cad1"))
    ball("lever-knob", 1.8, 13.6, 39, 0, m("lever-knob", "#c0392b", 0.4), segments=10)


def card_table():
    disc("pedestal", 5, 18, 0, 11, 0, m("pedestal", "#2a1d12", 0.7), vertices=16)
    disc("foot", 12, 2, 0, 1, 0, m("pedestal", "#2a1d12"), vertices=24)
    disc("rail", 26, 3, 0, 23.5, 0, m("rail", "#5a3a22", 0.55), vertices=40)
    ring("cushion", 24.5, 1.5, 0, 25.4, 0, m("cushion", "#2a1a12", 0.8), segments=40)
    disc("felt", 23.5, 1, 0, 25.3, 0, m("felt", "#1f6a3a", 0.95), vertices=40)
    # Chip stacks and a dealt hand.
    for i, (x, z, n) in enumerate(((-8, 12, 4), (-4, 14, 6), (8, 12, 3), (12, 5, 5))):
        for k in range(n):
            disc("chip", 1.6, 0.5, x, 26 + k * 0.5, z, m(f"chip-{i % 3}", ["#c0392b", "#2f4a9a", "#f0efe8"][i % 3], 0.5), vertices=12)
    for i in range(5):
        box("card", 2.6, 0.15, 3.6, -6 + i * 3, 26, -2, m("card", "#f4f2ea", 0.6), turn=(i - 2) * 0.1)
    box("shoe", 6, 3, 8, 0, 27.3, -16, m("shoe", "#3a2a1c", 0.6))


def war_table():
    w = wood()
    box("top", 110, 3, 44, 0, 26.5, 0, w, bevel=0.5)
    for x in (-50, 50):
        box("trestle", 4, 25, 36, x, 12.5, 0, w)
    box("stretcher", 96, 3, 3, 0, 8, 0, w)
    box("map", 100, 0.4, 36, 0, 28.2, 0, m("map", "#c8b88a", 0.9))
    # Streets inked across the map, and the pins for each crew.
    for i in range(5):
        box("street", 96, 0.2, 0.6, 0, 28.5, -14 + i * 7, m("ink", "#6a5a3a", 0.8))
        box("street", 0.6, 0.2, 32, -40 + i * 20, 28.5, 0, m("ink", "#6a5a3a"))
    for x, z, color in ((-20, -4, "#c0392b"), (18, 6, "#2f6b9a"), (-34, 10, "#c0392b"), (36, -10, "#d4a017"), (4, -12, "#2f6b9a")):
        post("marker", 1.6, 4, x, 30.5, z, m(f"marker-{color}", color, 0.5), vertices=10)
        ball("marker-top", 1.8, x, 33, z, m(f"marker-{color}", color), segments=8)


def office_desk():
    w = wood()
    box("top", 64, 2.4, 28, 0, 27, 0, w, bevel=0.4)
    box("pedestal", 18, 26, 26, 22, 13, 0, w)
    for i in range(3):
        box("drawer", 16, 7, 0.6, 22, 5 + i * 8.4, 13.2, w, bevel=0.2)
        box("pull", 5, 0.8, 0.8, 22, 6 + i * 8.4, 13.8, brass())
    box("modesty", 44, 18, 1.6, -9, 16, -12, w)
    box("leg", 2.4, 26, 26, -30, 13, 0, w)
    # The monitor, a keyboard, and the filing cabinet beside the desk.
    dark = m("plastic", "#20242a", 0.5)
    box("stand", 4, 4, 3, -10, 30, -6, dark)
    box("monitor", 18, 12, 1.6, -10, 38, -6, dark, bevel=0.3)
    box("screen", 16, 10, 0.4, -10, 38, -5.1, m("screen", "#000000", 0.3, emission="#5ad1ff", strength=0.9))
    box("keyboard", 14, 0.8, 5, -10, 28.6, 4, dark)
    box("mug", 2.4, 3, 2.4, 6, 29.7, 2, m("mug", "#f0efe8", 0.5))
    cab = m("cabinet-steel", "#5a5e66", 0.5, 0.4)
    box("cabinet", 18, 44, 22, 40, 22, -4, cab, bevel=0.3)
    for i in range(4):
        box("cabinet-drawer", 16, 9.5, 0.5, 40, 6 + i * 10.6, 7.2, cab)
        box("cabinet-pull", 5, 0.8, 0.8, 40, 8 + i * 10.6, 7.6, m("steel", "#9aa0a8", 0.4, 0.7))
    # The office chair, pushed in.
    seat = m("chair", "#2a2d33", 0.6)
    box("chair-seat", 14, 2.4, 14, -8, 16, 14, seat, bevel=0.5)
    box("chair-back", 14, 16, 2, -8, 26, 21, seat, bevel=0.5)
    post("chair-post", 1, 12, -8, 9, 14, m("steel", "#9aa0a8"), vertices=8)
    for i in range(5):
        a = i / 5 * math.tau
        box("chair-foot", 7, 1, 1.2, -8 + math.cos(a) * 3.5, 1.5, 14 + math.sin(a) * 3.5, seat, turn=-a)


def lockers():
    green, dark = m("locker", "#3e4a3a", 0.5, 0.4), m("locker-dark", "#262e24", 0.6, 0.3)
    for i, dx in enumerate((-26, 0, 26)):
        box("locker", 24, 44, 20, dx, 22, 0, green, bevel=0.3)
        box("door-line", 0.6, 40, 0.4, dx, 22, 10.2, dark)
        for k in range(4):
            box("vent", 10, 0.6, 0.4, dx - 5, 38 - k * 1.6, 10.2, dark)
        box("handle", 1, 5, 1.2, dx + 8, 22, 10.6, m("steel", "#9aa0a8", 0.4, 0.7))
        box("tag", 4, 2, 0.3, dx - 5, 30, 10.3, m("tag", "#e8e4d8", 0.6))


def potted_plant():
    bpy.ops.mesh.primitive_cone_add(radius1=6.5, radius2=8.5, depth=14, vertices=18, location=(0, 0, 7))
    bpy.context.active_object.data.materials.append(m("pot", "#8a5a3a", 0.8))
    ring("pot-rim", 8.4, 0.9, 0, 14, 0, m("pot", "#8a5a3a"))
    disc("soil", 7.8, 0.6, 0, 13.6, 0, m("soil", "#3a2a1a", 1.0), vertices=18)
    leaves = m("leaves", "#3c7a44", 0.85)
    for i, (x, y, z, r) in enumerate(((0, 26, 0, 8), (5, 22, 3, 6), (-5, 23, -2, 6.4), (2, 30, -3, 5), (-3, 20, 5, 5.4), (4, 25, -5, 5))):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=2, location=(x, -z, y))
        blob = bpy.context.active_object
        blob.data.materials.append(leaves)
        bpy.ops.object.shade_smooth()
    for i in range(6):
        a = i / 6 * math.tau
        box("frond", 1.6, 0.4, 12, math.cos(a) * 6, 18, math.sin(a) * 6, leaves, turn=-a + math.pi / 2, tilt=-0.5)


def tyre_stack():
    rubber, hub = m("tyre", "#1b1e23", 0.9), m("rim", "#8a8f98", 0.35, 0.7)
    for i in range(3):
        y = 3.2 + i * 6.6
        ring("tyre", 10.5, 3.3, 0, y, 0, rubber, segments=28)
        disc("rim", 7.4, 4.6, 0, y, 0, hub, vertices=20)
        for k in range(12):
            a = k / 12 * math.tau
            box("tread", 2, 6.4, 1.4, math.cos(a) * 13.6, y, math.sin(a) * 13.6, rubber, turn=-a)


def column():
    """A column 80 tall (the room's height): a base, a fluted shaft and a capital."""
    stone = m("stone", "#e2ddd0", 0.7)
    disc("base", 15, 3, 0, 1.5, 0, stone, vertices=28)
    disc("base-torus", 13.6, 2, 0, 4, 0, stone, vertices=28)
    disc("shaft", 12, 70, 0, 40, 0, stone, vertices=28)
    for i in range(16):
        a = i / 16 * math.tau
        box("flute", 1.2, 66, 0.8, math.cos(a) * 12.1, 40, math.sin(a) * 12.1, m("flute", "#cfc9bb", 0.8), turn=-a)
    disc("capital", 14, 3, 0, 76, 0, stone, vertices=28)
    box("abacus", 30, 2.4, 30, 0, 78.8, 0, stone)


def shop_shelf():
    """Open shelving along a wall, facing +x: 140 long (along z), 56 tall. The layout turns it round
    for the far wall."""
    w = wood()
    box("back", 3, 56, 140, -7, 28, 0, w)
    for z in (-70, 70):
        box("upright", 16, 56, 2, 0, 28, z, w)
    for level in range(3):
        y = 4 + level * 17
        box("shelf", 16, 2, 140, 0, y + 1, 0, w)
        box("price-strip", 0.4, 1.4, 140, 8, y + 0.8, 0, m("price-strip", "#f0efe8", 0.6))
        for i in range(7):
            z = -60 + i * 20
            colors = ["accent", "goods-green", "goods-red", "goods-blue", "goods-cream"]
            name = colors[(i + level * 2) % 5]
            hexes = {"accent": "#c98a2b", "goods-green": "#7c9a3a", "goods-red": "#c0392b", "goods-blue": "#3a6a9a", "goods-cream": "#e8dcc0"}
            if i % 3 == 0:
                for k in range(3):
                    post("can", 1.8, 7, -1, y + 2 + 3.5, z - 4 + k * 4, m(name, hexes[name], 0.5), vertices=10)
            else:
                box("goods", 10, 9 if i % 2 else 12, 13, 0, y + 2 + (4.5 if i % 2 else 6), z, m(name, hexes[name], 0.6))
    box("crown", 18, 3, 144, 0, 57.5, 0, w)


def tool_chest():
    red, steel = m("chest", "#a82a22", 0.45, 0.35), m("steel", "#9aa0a8", 0.4, 0.7)
    box("body", 24, 36, 20, 0, 21, 0, red, bevel=0.4)
    box("lid", 25, 3, 21, 0, 40.5, 0, red, bevel=0.4)
    for i in range(6):
        y = 7 + i * 5.6
        box("drawer-line", 22, 0.3, 0.3, 0, y + 2.6, 10.1, m("chest-dark", "#5a1612", 0.6))
        box("pull", 14, 0.8, 1, 0, y, 10.4, steel)
    for x in (-9, 9):
        for z in (-7, 7):
            disc("castor", 1.6, 1.4, x, 1.6, z, m("tyre", "#1b1e23", 0.9), vertices=10, facing_z=True)


def filing_cabinet():
    cab = m("cabinet-steel", "#4a4856", 0.5, 0.4)
    box("body", 26, 40, 26, 0, 20, 0, cab, bevel=0.3)
    for i in range(4):
        box("drawer", 24, 8.6, 0.5, 0, 5.5 + i * 9.8, 13.2, cab)
        box("pull", 6, 0.8, 1, 0, 7.5 + i * 9.8, 13.7, m("steel", "#9aa0a8", 0.4, 0.7))
        box("label", 5, 2, 0.3, 0, 4.4 + i * 9.8, 13.5, m("label", "#e8e4d8", 0.6))


# --- The mall --------------------------------------------------------------------------------------

def fountain():
    stone = m("fountain-stone", "#cfc9bb", 0.7)
    water = m("water", "#3a8ab0", 0.1, 0.1, emission="#1a4a6a", strength=0.6)
    disc("basin", 54, 10, 0, 5, 0, stone, vertices=48)
    ring("basin-lip", 52, 2.6, 0, 10.4, 0, stone, segments=48)
    disc("water", 48, 0.6, 0, 9.2, 0, water, vertices=48)
    disc("column", 7, 30, 0, 15, 0, stone, vertices=20)
    disc("bowl", 20, 4, 0, 32, 0, stone, vertices=32)
    ring("bowl-lip", 19, 1.4, 0, 34, 0, stone, segments=32)
    disc("bowl-water", 17, 0.4, 0, 33.8, 0, m("water-top", "#5ab0d8", 0.1, 0.1, emission="#2a6a8a", strength=0.7), vertices=32)
    disc("finial", 2.4, 8, 0, 38, 0, stone, vertices=12)
    ball("finial-top", 3, 0, 43, 0, stone, segments=12)
    # Jets falling from the bowl into the basin, as thin bright streams.
    jet = m("jet", "#bfe6f4", 0.1, emission="#7ac8e8", strength=0.8)
    for i in range(8):
        a = i / 8 * math.tau
        rod("jet", 0.6, (math.cos(a) * 19, 34, math.sin(a) * 19), (math.cos(a) * 30, 9.5, math.sin(a) * 30), jet, vertices=6)


def perfume_kiosk():
    pink, white = m("kiosk-trim", "#c98aa8", 0.5), m("kiosk", "#f4e6ee", 0.5)
    disc("counter", 30, 24, 0, 12, 0, white, vertices=36)
    disc("top", 32, 3, 0, 25.5, 0, pink, vertices=36)
    ring("kick", 29, 1.4, 0, 1.4, 0, pink, segments=36)
    for i in range(8):
        a = i / 8 * math.tau
        x, z = math.cos(a) * 20, math.sin(a) * 20
        color = ["#e8b4c8", "#b4d8e8", "#f0d890", "#c8e0b4"][i % 4]
        bottle = m(f"bottle-{i % 4}", color, 0.1, 0.1)
        box("bottle", 4, 6, 3, x, 30, z, bottle, bevel=0.6)
        disc("cap", 1, 2, x, 34, z, m("gold", "#d4a017", 0.3, 0.7), vertices=8)
    disc("pole", 3, 34, 0, 44, 0, pink, vertices=12)
    box("sign", 40, 16, 3, 0, 68, 0, pink, bevel=0.6)
    box("sign-face", 36, 12, 0.4, 0, 68, 1.7, m("sign-face", "#fff4f8", 0.4, emission="#f0c8d8", strength=0.5))


def ice_cream_cart():
    white, blue = m("cart", "#f0efe8", 0.5), m("cart-panel", "#5ab0d8", 0.5)
    box("body", 54, 22, 26, 0, 17, 0, white, bevel=1.0)
    box("panel", 50, 14, 0.6, 0, 17, 13.2, blue)
    for x in range(-20, 21, 10):
        box("stripe", 4, 14, 0.3, x, 17, 13.6, white)
    box("lid", 50, 1.6, 22, 0, 28.8, 0, m("lid", "#d6d0c0", 0.4, 0.4))
    for x in (-20, 20):
        disc("wheel", 6, 3, x, 6, 13, m("tyre", "#2a2a2a", 0.9), vertices=18, facing_z=True)
        disc("wheel", 6, 3, x, 6, -13, m("tyre", "#2a2a2a"), vertices=18, facing_z=True)
        disc("hubcap", 2.4, 3.4, x, 6, 13, m("chrome", "#c7cad1", 0.25, 0.9), vertices=12, facing_z=True)
    rod("handle", 0.8, (27, 22, -10), (34, 26, -10), m("chrome", "#c7cad1"))
    rod("handle", 0.8, (27, 22, 10), (34, 26, 10), m("chrome", "#c7cad1"))
    rod("handlebar", 0.8, (34, 26, -10), (34, 26, 10), m("chrome", "#c7cad1"))
    # The umbrella: a pole and a striped canopy of eight panels.
    post("umbrella-pole", 1.2, 46, 0, 51, 0, m("pole", "#d6d0c0", 0.5), vertices=8)
    for i in range(8):
        a0, a1 = i / 8 * math.tau, (i + 1) / 8 * math.tau
        panel = m("canopy-pink" if i % 2 else "canopy-white", "#e85a8a" if i % 2 else "#f8f4ec", 0.7)
        triangle("canopy", [(0, 80, 0), (math.cos(a0) * 33, 72, math.sin(a0) * 33), (math.cos(a1) * 33, 72, math.sin(a1) * 33)], panel)
    for i, color in enumerate(("#f0d0e0", "#f0e0a0", "#8a5a3a")):
        ball("scoop", 4, -12 + i * 12, 31.5, -4, m(f"scoop-{i}", color, 0.8), segments=10)
        bpy.ops.mesh.primitive_cone_add(radius1=0.4, radius2=3, depth=7, vertices=10, location=(-12 + i * 12, 4, 26.8))
        bpy.context.active_object.data.materials.append(m("cone", "#c99a5a", 0.8))


def food_counter():
    """A food-court counter against the left wall, facing +x: 26 deep, 100 long, its menu above."""
    c = m("counter", "#c0392b", 0.6)
    box("body", 26, 21, 100, 0, 13.5, 0, c, bevel=0.5)
    box("kick", 24, 3, 98, 0.5, 1.5, 0, m("kick", "#2a2018", 0.8))
    box("top", 30, 3, 104, 0, 25.5, 0, m("counter-top", "#f0ebe0", 0.4), bevel=0.5)
    box("sneeze-guard", 0.6, 10, 80, 4, 32, 0, m("clear-guard", "#bfe3f0", 0.05, 0.2))
    for z in range(-30, 31, 20):
        box("tray", 10, 2, 14, -4, 28, z, m("steel", "#9aa0a8", 0.4, 0.7))
        box("food", 8, 1.6, 12, -4, 29.4, z, m(f"food-{z % 3}", ["#d4a017", "#8a3a2a", "#5a8a3a"][(z // 20) % 3], 0.8))
    box("menu", 2, 22, 80, -27.5, 51, 0, m("menu", "#000000", 0.4, emission="#f0c060", strength=0.9))
    box("menu-frame", 1.6, 25, 84, -28.4, 51, 0, m("menu-frame", "#2a2d33", 0.5))
    for i in range(4):
        box("menu-line", 0.4, 1.2, 60, -26.4, 58 - i * 5, 0, m("menu-ink", "#3a2a1a", 0.6))


def food_table():
    disc("top", 16, 2, 0, 21, 0, m("table-top", "#f0ebe0", 0.4), vertices=28)
    disc("pole", 2.5, 19, 0, 10.5, 0, m("table-steel", "#5a5e66", 0.4, 0.6), vertices=12)
    disc("foot", 9, 1, 0, 0.5, 0, m("table-steel", "#5a5e66"), vertices=20)
    for dx, dz in ((-24, 0), (24, 0), (0, -24), (0, 24)):
        disc("stool", 5.4, 2.4, dx, 11, dz, m("stool", "#c0392b", 0.5), vertices=18)
        disc("stool-post", 1, 10, dx, 5, dz, m("table-steel", "#5a5e66"), vertices=8)
        disc("stool-foot", 4, 0.8, dx, 0.4, dz, m("table-steel", "#5a5e66"), vertices=14)
    box("tray", 10, 0.8, 7, 4, 22.4, 2, m("food-tray", "#c0392b", 0.5))
    box("cup", 2.4, 4, 2.4, -6, 24, -4, m("cup", "#f0efe8", 0.5))


def climbing_frame():
    red, blue, yellow = m("frame-red", "#c0392b", 0.5), m("deck-blue", "#2f6bb0", 0.5), m("frame-yellow", "#f0c040", 0.5)
    for dx in (-25, 25):
        for dz in (-25, 25):
            post("post", 2.2, 54, dx, 27, dz, red, vertices=12)
            ball("cap", 2.8, dx, 54.5, dz, yellow, segments=10)
    box("deck", 56, 4, 56, 0, 38, 0, blue, bevel=0.6)
    prism("roof", [(-30, 0), (30, 0), (0, 12)], 60, 0, 52, 0, yellow, along="x")
    for side in (-1, 1):
        box("rail", 50, 1.6, 1.6, 0, 46, side * 25, red)
    for y in range(6, 37, 6):
        box("rung", 1.4, 1.4, 22, -25, y, 0, yellow)
    rod("ladder-rail", 1, (-25, 0, -11), (-25, 40, -11), yellow)
    rod("ladder-rail", 1, (-25, 0, 11), (-25, 40, 11), yellow)
    # The slide off the east side, with its rails.
    ang = math.atan2(36, 54)
    length = math.hypot(36, 54)
    box("slide", length, 1.6, 16, 25 + 27, 20, 0, yellow, roll=-ang)
    for side in (-1, 1):
        box("slide-rail", length, 4, 1.4, 25 + 27, 22, side * 8.6, yellow, roll=-ang)


def ball_pit():
    blue = m("pit", "#2f6bb0", 0.5)
    box("wall", 94, 12, 4, 0, 6, -20, blue, bevel=0.8)
    box("wall", 94, 12, 4, 0, 6, 20, blue, bevel=0.8)
    box("wall", 4, 12, 44, -45, 6, 0, blue, bevel=0.8)
    box("wall", 4, 12, 44, 45, 6, 0, blue, bevel=0.8)
    colours = ["#e85a5a", "#f0c040", "#5ab0d8", "#5ad18a", "#c98aa8"]
    for i in range(70):
        x = -40 + (i % 14) * 6 + (i // 14 % 2) * 3
        z = -16 + (i // 14) * 7.5
        ball("ball", 3.2, x, 3 + (i % 3) * 1.8, z, m(f"ball-{i % 5}", colours[i % 5], 0.45), segments=8)


def mall_bench():
    w, iron = m("bench-wood", "#6a4a32", 0.7), m("bench-iron", "#3a3f4b", 0.5, 0.4)
    for x in (-26, 26):
        box("end", 3, 9, 12, x, 4.5, 0, iron, bevel=0.3)
    for i, z in enumerate((-4, 0, 4)):
        box("slat", 58, 1.2, 3, 0, 9.4, z, w, bevel=0.2)


def planter():
    box("box", 40, 14, 40, 0, 7, 0, m("planter", "#8a7a62", 0.85), bevel=0.6)
    box("rim", 42, 1.6, 42, 0, 14.4, 0, m("planter-rim", "#a8987e", 0.8))
    disc("soil", 18, 0.6, 0, 14, 0, m("soil", "#3a2a1a", 1.0), vertices=16)
    leaves = m("leaves", "#3c7a44", 0.85)
    for i, (x, y, z, r) in enumerate(((0, 28, 0, 14), (8, 22, 6, 10), (-8, 23, -5, 10.5), (6, 30, -7, 8), (-6, 21, 8, 9))):
        bpy.ops.mesh.primitive_ico_sphere_add(radius=r, subdivisions=2, location=(x, -z, y))
        bpy.context.active_object.data.materials.append(leaves)
        bpy.ops.object.shade_smooth()


# --- The minigames (tenths of a metre) -----------------------------------------------------------------

def hoop():
    """The court's basket: the rim is 30.5 up at the origin, the board behind it at z = -2, the pole at
    z = -14. The ball's flight is worked out against those numbers in minigameScenes.ts."""
    metal = m("metal", "#3a3d44", 0.5, 0.5)
    box("base-plate", 8, 0.6, 8, 0, 0.3, -14, metal)
    post("pole", 1, 36, 0, 18, -14, metal, vertices=14)
    box("pad", 2.6, 10, 2.6, 0, 5, -14, m("pad", "#2f4a9a", 0.7), bevel=0.4)
    box("arm", 1.4, 1.4, 12, 0, 34, -8, metal)
    rod("brace", 0.4, (0, 28, -14), (0, 34, -4), metal)
    box("board", 18, 10.5, 0.6, 0, 34, -2, m("board", "#f4f4f0", 0.35), bevel=0.15)
    box("board-frame", 18.4, 10.9, 0.4, 0, 34, -2.4, metal)
    orange = m("paint", "#d4693a", 0.6)
    for x, y, w, h in ((0, 35.3, 6, 0.3), (0, 31, 6, 0.3), (-2.85, 33.1, 0.3, 4.5), (2.85, 33.1, 0.3, 4.5)):
        box("square", w, h, 0.1, x, y, -1.65, orange)
    for x, y, w, h in ((0, 39.1, 17.6, 0.3), (0, 28.9, 17.6, 0.3), (-8.65, 34, 0.3, 10.5), (8.65, 34, 0.3, 10.5)):
        box("border", w, h, 0.1, x, y, -1.65, orange)
    box("rim-bracket", 1.4, 1, 2.4, 0, 30.3, -1.2, m("rim", "#d4693a", 0.4, 0.4))
    ring("rim", 2.3, 0.22, 0, 30.5, 0, m("rim", "#d4693a"), segments=32)
    # The net: cords from the rim down to a narrower ring.
    net = m("net", "#f0efe8", 0.9)
    for i in range(12):
        a = i / 12 * math.tau
        b = (i + 1.5) / 12 * math.tau
        rod("cord", 0.07, (math.cos(a) * 2.3, 30.4, math.sin(a) * 2.3), (math.cos(b) * 1.4, 26.1, math.sin(b) * 1.4), net, vertices=4)
        rod("cord", 0.07, (math.cos(a) * 2.3, 30.4, math.sin(a) * 2.3), (math.cos(a - 1.5 / 12 * math.tau) * 1.4, 26.1, math.sin(a - 1.5 / 12 * math.tau) * 1.4), net, vertices=4)
    ring("net-ring", 1.4, 0.07, 0, 26.1, 0, net, segments=16)


def chess_table():
    """The stone park table with the board inlaid: the board's squares are 6 across, its top at y = 0."""
    stone = m("stone", "#9a958a", 0.9)
    box("top", 64, 3, 64, 0, -1.5, 0, stone, bevel=0.6)
    bpy.ops.mesh.primitive_cone_add(radius1=8, radius2=6, depth=28, vertices=18, location=(0, 0, -16))
    bpy.context.active_object.data.materials.append(stone)
    box("foot", 22, 2, 22, 0, -29, 0, stone, bevel=0.4)
    light, dark = m("light", "#d8cfb8", 0.6), m("dark", "#5a4632", 0.6)
    for r in range(8):
        for c in range(8):
            box("square", 6, 0.4, 6, (c - 3.5) * 6, 0.2, (r - 3.5) * 6, light if (r + c) % 2 == 0 else dark)
    box("border", 50, 0.3, 50, 0, 0.05, 0, m("inlay", "#3a2a1a", 0.6))
    # A stone stool at each side.
    for z in (-44, 44):
        disc("stool", 9, 3, 0, -12.5, z, stone, vertices=18)
        bpy.ops.mesh.primitive_cone_add(radius1=6, radius2=4, depth=16, vertices=14, location=(0, -z, -22))
        bpy.context.active_object.data.materials.append(stone)


MODELS = {
    "counter": counter, "notice-board": notice_board, "safe": safe, "vault-door": vault_door, "plan-table": plan_table,
    "wardrobe": wardrobe, "workbench": workbench, "slot-machine": slot_machine, "card-table": card_table,
    "war-table": war_table, "office-desk": office_desk, "lockers": lockers, "potted-plant": potted_plant,
    "tyre-stack": tyre_stack, "column": column, "shop-shelf": shop_shelf, "tool-chest": tool_chest,
    "filing-cabinet": filing_cabinet,
    "fountain": fountain, "perfume-kiosk": perfume_kiosk, "ice-cream-cart": ice_cream_cart, "food-counter": food_counter,
    "food-table": food_table, "climbing-frame": climbing_frame, "ball-pit": ball_pit, "mall-bench": mall_bench, "planter": planter,
    "hoop": hoop, "chess-table": chess_table,
}


# --- Second batch: what gives each kind of place its own room (map/interiorPlans.ts) -------------------

def washer(door="#9cc4d8"):
    white = m("appliance", "#eceae4", 0.4, 0.1)
    box("body", 22, 30, 22, 0, 15, 0, white, bevel=0.8)
    box("panel", 22, 5, 2, 0, 27, 10.4, m("panel", "#cfd3d8", 0.4, 0.3))
    for x in (-6, -2, 2):
        disc("knob", 1.2, 1, x, 27, 11.6, m("knob", "#3a3d44", 0.4, 0.4), vertices=10, facing_z=True)
    ring("door-ring", 7.5, 1.4, 0, 13, 11.2, m("chrome", "#c7cad1", 0.25, 0.9), upright=True, segments=24)
    disc("door-glass", 6.6, 0.6, 0, 13, 11.2, m("clear-door", door, 0.1, 0.2), vertices=24, facing_z=True)


def dryer():
    washer(door="#3a3d44")


def folding_table():
    box("top", 70, 2, 22, 0, 27, 0, m("laminate", "#d8d2c4", 0.5))
    for x in (-32, 32):
        for z in (-9, 9):
            box("leg", 1.6, 26, 1.6, x, 13, z, m("steel", "#9aa0a8", 0.4, 0.7))
    for i, (x, color) in enumerate(((-24, "#7a2630"), (-8, "#2f4a6a"), (10, "#e8e4d8"), (26, "#3f5a3a"))):
        for k in range(3 - i % 2):
            box("folded", 12, 1.6, 10, x, 28.8 + k * 1.7, 0, m(f"cloth-{i}", color, 0.95))
    box("basket", 14, 8, 10, 30, 4, 0, m("basket", "#4a6a9a", 0.6))


def booth():
    """A diner booth: two benches either side of a table, across x, 60 wide and 48 deep."""
    uph = m("upholstery", "#a82a22", 0.5)
    frame = m("booth-frame", "#5a3a22", 0.6)
    for side in (-1, 1):
        box("seat", 56, 4, 12, 0, 14, side * 16, uph, bevel=1.0)
        box("seat-base", 56, 12, 12, 0, 6, side * 16, frame)
        box("back", 56, 22, 5, 0, 26, side * 22, uph, bevel=1.2)
    box("table-top", 50, 2, 18, 0, 24, 0, m("table-top", "#e8e2d2", 0.4), bevel=0.5)
    post("table-post", 1.6, 22, 0, 12, 0, m("steel", "#9aa0a8", 0.4, 0.7), vertices=10)
    box("ketchup", 1.6, 4, 1.6, -18, 27, 0, m("ketchup", "#c0392b", 0.4))
    box("napkins", 4, 3, 3, -14, 26.5, 0, m("napkins", "#f0efe8", 0.8))


def dining_set():
    w = wood()
    box("top", 30, 2, 30, 0, 24, 0, w, bevel=0.4)
    for x in (-13, 13):
        for z in (-13, 13):
            box("leg", 2, 23, 2, x, 11.5, z, w)
    for dx, dz, turn in ((0, 22, 0), (0, -22, math.pi), (22, 0, math.pi / 2), (-22, 0, -math.pi / 2)):
        box("chair-seat", 12, 2, 12, dx, 14, dz, w, turn=turn)
        bx, bz = dx + math.sin(turn) * 5.5, dz + math.cos(turn) * 5.5
        box("chair-back", 12, 12, 1.5, bx, 21, bz, w, turn=turn)
        for lx in (-5, 5):
            for lz in (-5, 5):
                box("chair-leg", 1.2, 13, 1.2, dx + lx, 6.5, dz + lz, w)
    box("plate", 8, 0.4, 8, 6, 25.2, 6, m("plate", "#f4f2ea", 0.4))
    box("glass", 2, 4, 2, -6, 27, -4, m("clear-tumbler", "#bfe3f0", 0.05, 0.1))


def drinks_fridge():
    box("body", 30, 64, 22, 0, 32, 0, m("fridge", "#2a2d33", 0.4, 0.4), bevel=0.6)
    box("glass", 26, 54, 0.6, 0, 33, 11.2, m("clear-fridge", "#cfe8f4", 0.05, 0.1, emission="#a8d8f0", strength=0.4))
    for level in range(4):
        y = 12 + level * 13
        box("shelf", 26, 0.6, 18, 0, y, 0, m("steel", "#9aa0a8", 0.4, 0.7))
        for i in range(6):
            color = ["#c0392b", "#2f8f6a", "#d4a017", "#3a6a9a", "#e8e4d8", "#7a2630"][(i + level) % 6]
            post("bottle", 1.6, 8, -10 + i * 4, y + 4.3, 2, m(f"can-{(i + level) % 6}", color, 0.4, 0.3), vertices=8)
    box("handle", 1, 20, 1.4, 11, 34, 12, m("chrome", "#c7cad1", 0.25, 0.9))
    box("header", 30, 6, 2, 0, 61, 11, m("fridge-header", "#c0392b", 0.4, emission="#c0392b", strength=0.4))


def pallet_rack():
    orange, beam = m("rack", "#d4692a", 0.5, 0.4), m("rack-beam", "#2f4a8a", 0.5, 0.4)
    for x in (-50, 0, 50):
        for z in (-12, 12):
            box("upright", 3, 72, 3, x, 36, z, orange)
    for y in (2, 26, 50):
        for z in (-12, 12):
            box("beam", 100, 3, 2, 0, y + 1.5, z, beam)
        for x in (-25, 25):
            box("pallet", 40, 2, 22, x, y + 4, 0, m("pallet", "#a0784a", 0.9))
            for i, (bx, bh) in enumerate(((-12, 12), (2, 16), (14, 10))):
                box("carton", 11, bh, 18, x + bx, y + 5 + bh / 2, 0, m("cardboard", "#a0784a", 0.9) if i != 1 else m("wrapped", "#c8d0d8", 0.3, 0.1))


def crate_stack():
    w = m("crate", "#8a6a42", 0.9)
    for i, (x, y, z, s) in enumerate(((0, 0, 0, 20), (21, 0, 2, 20), (10, 20, 1, 18))):
        box("crate", s, s, s, x - 10, y + s / 2, z, w, bevel=0.3)
        for d in (-s / 2 + 1.5, s / 2 - 1.5):
            box("slat", s + 0.4, 2, s + 0.4, x - 10, y + s / 2 + d, z, m("crate-dark", "#6a4a2c", 0.9))
    box("stencil", 8, 4, 0.2, -10, 10, 10.2, m("stencil", "#2a2a2a", 0.8))


def forklift():
    yellow, dark = m("forklift", "#e8b923", 0.5, 0.3), m("forklift-dark", "#2a2d33", 0.6, 0.4)
    box("body", 20, 14, 26, 0, 10, 0, yellow, bevel=1.0)
    box("counterweight", 20, 12, 8, 0, 9, -14, dark, bevel=0.6)
    box("seat", 10, 3, 8, 0, 18, -4, dark)
    for x in (-8, 8):
        box("cage-post", 1.4, 22, 1.4, x, 27, 6, dark)
        box("cage-post", 1.4, 22, 1.4, x, 27, -10, dark)
    box("roof", 20, 1.2, 18, 0, 38, -2, dark)
    for x in (-5, 5):
        box("mast", 2, 40, 2, x, 22, 14, dark)
        box("fork", 2.4, 1.2, 18, x, 3, 23, m("steel", "#9aa0a8", 0.4, 0.7))
    for x in (-10.5, 10.5):
        for z in (-9, 8):
            disc("wheel", 4, 3, x, 4, z, m("tyre", "#1b1e23", 0.9), vertices=14)


def car_lift():
    blue, steel = m("lift", "#2f5a9a", 0.5, 0.4), m("steel", "#9aa0a8", 0.4, 0.7)
    for x in (-34, 34):
        box("post", 6, 64, 6, x, 32, 0, blue, bevel=0.4)
        box("base", 12, 1, 12, x, 0.5, 0, steel)
        for z in (-1, 1):
            box("arm", 22, 1.6, 3, x - math.copysign(11, x), 10, z * 14, steel, turn=z * math.copysign(0.25, x))
    box("crossbar", 74, 3, 3, 0, 63, 0, blue)
    box("control", 4, 8, 3, 38, 40, 3, m("control", "#c0392b", 0.4))


def parts_shelf():
    steel = m("shelving", "#5a5e66", 0.5, 0.5)
    for x in (-28, 28):
        for z in (-8, 8):
            box("upright", 2, 60, 2, x, 30, z, steel)
    for level, y in enumerate((4, 22, 40, 58)):
        box("shelf", 58, 1.4, 18, 0, y, 0, steel)
        if level == 3:
            continue
        for i in range(4):
            if (i + level) % 3 == 0:
                ring("tyre", 6.5, 2.4, -20 + i * 13, y + 7.5, 0, m("tyre", "#1b1e23", 0.9), upright=True, segments=18)
            else:
                box("part-box", 10, 7 + (i % 2) * 3, 12, -20 + i * 13, y + 4.5 + (i % 2) * 1.5, 0, m(f"partbox-{(i + level) % 3}", ["#c0392b", "#2f4a8a", "#a0784a"][(i + level) % 3], 0.7))


def fireplace():
    stone = m("fieldstone", "#8a8478", 0.95)
    box("chimney-breast", 50, 80, 14, 0, 40, -2, stone)
    for y in range(4, 78, 7):
        box("course", 50.4, 0.6, 14.4, 0, y, -2, m("mortar", "#6a6458", 0.95))
    box("opening", 26, 20, 4, 0, 14, 4, m("soot", "#1a1714", 0.95))
    box("hearth", 56, 3, 14, 0, 1.5, 10, stone)
    box("mantel", 58, 3, 10, 0, 34, 6, wood())
    for i, (x, z) in enumerate(((-6, 4), (0, 5), (6, 4))):
        log("firelog", 1.6, 14, x * 0.6, 6 + i * 1.2, z, m("firelog", "#4a3624", 0.9), along="x", vertices=8)
    ball("flame", 4, 0, 10, 5, m("flame", "#000000", 0.4, emission="#ff8a2a", strength=1.5), squash=1.4)
    ball("flame", 2.6, -4, 9, 5, m("flame", "#000000"), squash=1.5)
    ball("flame", 2.6, 4, 9, 5, m("flame", "#000000"), squash=1.5)
    for x in (-18, 18):
        post("candlestick", 1, 6, x, 38.5, 6, brass(), vertices=8)


def display_case(item="#e8c24a"):
    w = wood()
    box("base", 60, 18, 24, 0, 9, 0, w, bevel=0.4)
    box("glass", 58, 10, 22, 0, 23, 0, m("clear-case", "#d8eef6", 0.05, 0.1, emission="#a8c8d8", strength=0.15))
    box("frame-top", 60, 1, 24, 0, 28.5, 0, m("chrome", "#c7cad1", 0.25, 0.9))
    box("felt", 56, 0.4, 20, 0, 18.4, 0, m("case-felt", "#2a1a3a", 0.95))
    for i in range(6):
        x = -22 + i * 9
        if i % 2:
            ring("ring-item", 1.6, 0.4, x, 19.4, -2, m("item", item, 0.25, 0.8), segments=12)
        else:
            ball("item", 1.6, x, 19.8, 3, m("item", item, 0.25, 0.8), segments=10)


def jar_wall():
    w = wood()
    box("back", 70, 60, 2, 0, 30, -6, w)
    for y in (6, 24, 42):
        box("shelf", 70, 1.6, 12, 0, y, 0, w)
        for i in range(8):
            color = ["#c98a2b", "#7c9a3a", "#8a2a2a", "#d6d0c0", "#3a5a8a", "#a06a3a"][(i * 2 + y) % 6]
            post("jar", 3, 9, -30 + i * 8.5, y + 5.6, 1, m(f"jar-{(i * 2 + y) % 6}", color, 0.2, 0.1), vertices=12)
            post("lid", 3.2, 1.4, -30 + i * 8.5, y + 10.6, 1, brass(), vertices=12)


def stage():
    box("platform", 90, 8, 50, 0, 4, 0, m("stage", "#2a2018", 0.7))
    box("lip", 90.6, 1, 50.6, 0, 8.4, 0, m("stage-edge", "#c9a227", 0.4, 0.5))
    box("curtain", 90, 70, 2, 0, 43, -25, m("curtain", "#6a1420", 0.95))
    for x in range(-42, 43, 6):
        box("fold", 2, 70, 1, x, 43, -23.8, m("curtain-fold", "#4a0e16", 0.95))
    post("mic-stand", 0.5, 24, 0, 20, 8, m("steel", "#9aa0a8", 0.4, 0.7), vertices=6)
    ball("mic", 1.2, 0, 32.4, 8, m("mic", "#2a2a2a", 0.5, 0.5), segments=8)
    for x in (-38, 38):
        box("speaker", 12, 24, 10, x, 20, 10, m("speaker", "#1b1d22", 0.6), bevel=0.4)
        disc("cone", 4, 0.6, x, 22, 15.2, m("cone", "#3a3d44", 0.5), vertices=16, facing_z=True)


def dj_booth():
    box("desk", 50, 24, 24, 0, 12, 0, m("dj-desk", "#16181d", 0.5, 0.3), bevel=0.6)
    box("led-strip", 50, 1.4, 0.4, 0, 18, 12.2, m("led", "#000000", 0.4, emission="#c040ff", strength=1.2))
    for x in (-14, 14):
        disc("turntable", 8, 1.2, x, 24.6, 0, m("platter", "#2a2d33", 0.4, 0.5), vertices=24)
        disc("record", 6.4, 1.4, x, 24.8, 0, m("record", "#0e0e10", 0.3), vertices=24)
    box("mixer", 10, 2, 14, 0, 25, 0, m("mixer", "#3a3d44", 0.4, 0.4))
    box("laptop", 12, 0.8, 9, 0, 26.4, -6, m("laptop", "#c7cad1", 0.3, 0.6))


def dartboard():
    """On the back wall: origin at the foot of the wall, the board 46 up."""
    disc("backing", 12, 2, 0, 46, 1, m("backing", "#1a1a1a", 0.9), vertices=28, facing_z=True)
    for i, (r, color) in enumerate(((9, "#1f6a3a"), (7.4, "#f0e8d0"), (5.8, "#b3261e"), (3.6, "#f0e8d0"), (1.6, "#1f6a3a"), (0.7, "#b3261e"))):
        disc(f"ring-{i}", r, 0.4 + i * 0.1, 0, 46, 2.2 + i * 0.1, m(f"dart-{color}", color, 0.8), vertices=28, facing_z=True)
    box("chalk", 30, 22, 1, 30, 40, 1, m("chalkboard", "#1f3a2a", 0.95))


def pool_table():
    felt = m("pool-felt", "#1f6a3a", 0.95)
    box("bed", 70, 4, 40, 0, 22, 0, felt)
    for side in (-1, 1):
        box("rail", 74, 4, 3, 0, 24, side * 21.5, m("pool-rail", "#5a3a22", 0.6))
        box("rail", 3, 4, 44, side * 36.5, 24, 0, m("pool-rail", "#5a3a22"))
    box("body", 66, 14, 36, 0, 13, 0, m("pool-body", "#4a2a18", 0.6))
    for x in (-30, 30):
        for z in (-16, 16):
            box("leg", 5, 8, 5, x, 4, z, m("pool-body", "#4a2a18"))
    for i in range(7):
        ball("ball", 1.2, 14 + (i % 3) * 2.2, 25.2, -2 + (i // 3) * 2.2 - (i % 3) * 1.1, m(f"pool-ball-{i % 4}", ["#d4a017", "#2f4a9a", "#c0392b", "#111111"][i % 4], 0.2), segments=10)
    ball("cue-ball", 1.2, -18, 25.2, 0, m("cue-ball", "#f4f2ea", 0.2), segments=10)
    rod("cue", 0.4, (-40, 26, 14), (-21, 25.6, 2), wood())


def staircase():
    """Stairs up to the next floor: 30 wide, rising toward the back wall from z = +36 to z = -36,
    80 up at the top landing. Where you stand to use them is in front, at z = +46."""
    w, rail = wood(), m("handrail", "#3a3d44", 0.5, 0.5)
    steps = 14
    for i in range(steps):
        z = 36 - (i + 0.5) * (72 / steps)
        y = (i + 1) * (80 / steps)
        box("tread", 30, 2, 72 / steps + 0.6, 0, y - 1, z, w)
        box("riser", 30, 80 / steps, 0.6, 0, y - 80 / steps / 2, z + 72 / steps / 2, m("riser", "#5a4632", 0.8))
    for x in (-15.5, 15.5):
        rod("stringer", 1.2, (x, 2, 36), (x, 80, -36), m("stringer", "#4a3828", 0.8))
        rod("handrail", 0.7, (x, 14, 36), (x, 92, -36), rail)
        for i in range(0, steps, 3):
            z = 36 - (i + 0.5) * (72 / steps)
            y = (i + 1) * (80 / steps)
            box("baluster", 0.6, 12, 0.6, x, y + 6, z, rail)
    box("landing", 30, 2, 12, 0, 79, -42, w)
    box("sign", 10, 4, 0.4, 18, 30, 30, m("sign-green", "#1f6a3a", 0.4, emission="#2fd36f", strength=0.4))


def escalator():
    """An escalator up to the next floor, rising toward the back wall over 90, 80 up."""
    glass, steel = m("clear-balustrade", "#cfe8f4", 0.05, 0.1), m("steel", "#9aa0a8", 0.4, 0.7)
    ang = math.atan2(80, 90)
    length = math.hypot(80, 90)
    box("truss", 30, 10, length, 0, 40 - 5, 0, m("truss", "#5c6470", 0.4, 0.5), tilt=ang)
    for i in range(22):
        t = (i + 0.5) / 22
        box("step", 24, 1, length / 22 - 0.4, 0, t * 80 + 0.5, 45 - t * 90, m("escalator-step", "#3a3d44", 0.4, 0.6))
    for x in (-14, 14):
        box("glass", 1, 14, length, x, 40 + 8, 0, glass, tilt=ang)
        box("handrail", 2, 1.6, length + 4, x, 40 + 15.5, 0, m("handrail-black", "#1a1a1a", 0.5), tilt=ang)
    for z, y in ((49, 0.5), (-49, 80.5)):
        box("landing-plate", 28, 1, 10, 0, y, z, steel)


def lift():
    """A lift on the back wall: origin at the foot of the wall."""
    steel = m("lift-door", "#9aa0a8", 0.35, 0.8)
    box("surround", 34, 56, 3, 0, 28, 1.5, m("lift-surround", "#5c6470", 0.4, 0.5))
    for x in (-7.6, 7.6):
        box("door", 15, 48, 1, x, 24, 3.4, steel)
    box("gap", 0.4, 48, 1.2, 0, 24, 3.6, m("gap-dark", "#1a1a1a", 0.6))
    box("indicator", 12, 4, 0.6, 0, 52, 3.4, m("indicator", "#000000", 0.4, emission="#ffb000", strength=1.0))
    box("call-panel", 3, 8, 0.6, 20, 26, 3.4, m("call-panel", "#3a3d44", 0.4, 0.4))
    disc("call-button", 0.8, 0.6, 20, 27, 3.9, m("call-light", "#000000", 0.4, emission="#ffffff", strength=0.8), vertices=10, facing_z=True)


def sofa():
    uph = m("upholstery", "#4a5a7a", 0.85)
    box("base", 60, 10, 22, 0, 6, 0, uph, bevel=1.2)
    box("back", 60, 18, 6, 0, 17, -8, uph, bevel=1.4)
    for x in (-29, 29):
        box("arm", 5, 14, 22, x, 11, 0, uph, bevel=1.4)
    for x in (-14, 14):
        box("cushion", 26, 4, 18, x, 13, 1, m("cushion", "#5a6a8a", 0.9), bevel=1.2)
    for x in (-27, 27):
        box("foot", 2, 2, 2, x, 0.5, 8, m("foot", "#1a1c20", 0.6))


def coffee_table():
    box("top", 36, 2, 20, 0, 11, 0, m("clear-tabletop", "#cfe8f4", 0.05, 0.1))
    box("frame", 34, 1, 18, 0, 9.5, 0, wood())
    for x in (-16, 16):
        for z in (-8, 8):
            box("leg", 1.6, 9, 1.6, x, 4.5, z, wood())
    box("magazine", 8, 0.4, 10, -6, 12.2, 1, m("magazine", "#c0392b", 0.6), turn=0.3)
    box("mug", 2.4, 3, 2.4, 8, 13.5, -2, m("mug", "#f0efe8", 0.5))


def bed():
    """A bed with its head against the back wall, foot toward the room (+z), 50 wide, 72 long."""
    w = wood()
    box("frame", 50, 8, 72, 0, 4, 0, w)
    box("headboard", 52, 28, 3, 0, 14, -36, w, bevel=0.5)
    box("mattress", 48, 6, 70, 0, 11, 0, m("mattress", "#f0ece0", 0.9), bevel=1.0)
    box("blanket", 49, 2, 46, 0, 14.5, 12, m("blanket", "#2f4a6a", 0.9), bevel=0.8)
    for x in (-12, 12):
        box("pillow", 18, 4, 10, x, 16, -28, m("pillow", "#ffffff", 0.9), bevel=1.5)
    box("nightstand", 12, 16, 12, 33, 8, -30, w, bevel=0.4)
    post("lamp-base", 2, 6, 33, 19, -30, brass(), vertices=10)
    bpy.ops.mesh.primitive_cone_add(radius1=4, radius2=2.6, depth=5, vertices=14, location=(33, 30, 24.5))
    bpy.context.active_object.data.materials.append(m("lampshade", "#f0e0b0", 0.8, emission="#ffd890", strength=0.4))


def kitchenette():
    w = m("cabinet", "#e8e4d8", 0.6)
    box("base", 80, 22, 22, 0, 11, 0, w, bevel=0.4)
    box("worktop", 82, 2, 24, 0, 23, 1, m("worktop", "#3a3d44", 0.4, 0.2))
    box("sink", 18, 1, 14, -20, 24.2, 1, m("steel", "#9aa0a8", 0.3, 0.8))
    post("tap", 0.6, 8, -20, 28, -8, m("chrome", "#c7cad1", 0.25, 0.9), vertices=8)
    for x in (14, 26):
        disc("hob", 4, 0.4, x, 24.2, 1, m("hob", "#1a1a1a", 0.6), vertices=16)
    box("upper", 80, 20, 12, 0, 52, -6, w, bevel=0.4)
    for x in range(-36, 40, 20):
        box("door-line", 0.4, 20, 0.4, x, 52, 0.2, m("cabinet-line", "#bdb6a4", 0.6))
        box("door-line", 0.4, 20, 0.4, x, 11, 11.2, m("cabinet-line", "#bdb6a4"))
    box("kettle", 4, 6, 4, 0, 27, 4, m("kettle", "#c0392b", 0.4, 0.3), bevel=0.8)


def tv_wall():
    """A big screen on the back wall: origin at the foot of the wall."""
    box("tv", 54, 32, 2, 0, 44, 1.5, m("tv-frame", "#1a1c20", 0.4, 0.3), bevel=0.4)
    box("picture", 50, 28, 0.4, 0, 44, 2.7, m("tv-picture", "#000000", 0.4, emission="#5a8ad1", strength=0.9))
    box("cabinet", 60, 14, 14, 0, 7, 8, wood(), bevel=0.4)
    box("console", 10, 3, 8, -14, 15.5, 8, m("console", "#2a2d33", 0.4))


def bench_row():
    steel, seat = m("steel", "#9aa0a8", 0.4, 0.7), m("bench-seat", "#3a6a9a", 0.5, 0.2)
    box("beam", 72, 2, 3, 0, 10, 0, steel)
    for x in (-30, 30):
        box("leg", 2, 10, 14, x, 5, 0, steel)
    for i in range(4):
        x = -27 + i * 18
        box("seat", 16, 1.6, 14, x, 12, 1, seat, bevel=0.6)
        box("back", 16, 12, 1.4, x, 19, -6, seat, bevel=0.6, tilt=-0.12)
        if i < 3:
            box("armrest", 1.4, 6, 10, x + 9, 15, 1, steel)


def departure_board():
    """Hung on the back wall: origin at the foot of the wall."""
    box("board", 92, 28, 3, 0, 56, 1.5, m("board-frame", "#16181d", 0.5, 0.3))
    for i in range(5):
        y = 66 - i * 5
        box("row", 84, 3, 0.4, 0, y, 3.2, m("board-row", "#000000", 0.4, emission="#ffb000", strength=0.8 if i % 2 == 0 else 0.5))
    box("clock", 12, 12, 2, 0, 76, 2, m("clock", "#f4f2ea", 0.4), bevel=2.0)


def ticket_booth():
    box("base", 40, 22, 36, 0, 11, 0, m("booth-wall", "#5c6470", 0.5, 0.3))
    box("glass", 40, 24, 36, 0, 34, 0, m("clear-booth", "#cfe8f4", 0.05, 0.1))
    box("roof", 44, 3, 40, 0, 47.5, 0, m("booth-roof", "#2f4a8a", 0.5, 0.3))
    box("sign", 30, 6, 1, 0, 44, 18.6, m("ticket-sign", "#000000", 0.4, emission="#ffd23a", strength=0.9))
    box("slot", 12, 1, 4, 0, 22.5, 18, m("steel", "#9aa0a8", 0.4, 0.7))


def newsroom_desk():
    w = m("desk-grey", "#6a6e74", 0.6, 0.3)
    box("top", 56, 2, 26, 0, 27, 0, w)
    for x in (-26, 26):
        box("leg", 2, 26, 24, x, 13, 0, w)
    box("monitor", 14, 12, 12, -10, 34, -5, m("crt", "#d8d2c4", 0.5), bevel=1.0)
    box("screen", 11, 8, 0.4, -10, 35, 1.1, m("crt-screen", "#000000", 0.4, emission="#7ad18a", strength=0.6))
    box("keyboard", 14, 0.8, 5, -10, 28.4, 5, m("keyboard", "#d8d2c4", 0.5))
    box("typewriter", 14, 5, 10, 14, 30.5, -2, m("typewriter", "#2a2d33", 0.5, 0.3), bevel=0.6)
    box("paper", 8, 6, 0.3, 14, 35, -4, m("paper", "#f4f2ea", 0.9), tilt=-0.3)
    for i in range(4):
        box("stack", 10, 1, 13, 22, 28.5 + i, 7, m("paper", "#f4f2ea"), turn=i * 0.08)
    box("chair", 14, 2.4, 14, -6, 16, 18, m("chair", "#2a2d33", 0.6), bevel=0.5)
    box("chair-back", 14, 16, 2, -6, 26, 24, m("chair", "#2a2d33"), bevel=0.5)
    post("chair-post", 1, 12, -6, 9, 18, m("steel", "#9aa0a8", 0.4, 0.7), vertices=8)


def cell():
    """A holding cell's front of bars on its own line, 60 wide, 72 high, a bench and a cot behind."""
    bars = m("bars", "#3a3d44", 0.4, 0.7)
    for x in range(-30, 31, 5):
        post("bar", 0.7, 72, x, 36, 0, bars, vertices=6)
    for y in (2, 36, 71):
        box("rail", 62, 2, 2, 0, y, 0, bars)
    box("door-lock", 4, 6, 3, 12, 34, 0, m("lock", "#2a2a2a", 0.5, 0.5))
    box("bench", 50, 3, 12, 0, 14, -22, m("cell-bench", "#7a7e86", 0.7, 0.3))
    for x in (-22, 22):
        box("bench-bracket", 2, 13, 10, x, 7, -24, bars)
    box("cot", 22, 6, 40, -18, 8, -10, m("cot", "#5a6a4a", 0.9))


def bar_stool():
    post("seat", 6, 2.4, 0, 21, 0, m("upholstery", "#a82a22", 0.5), vertices=18)
    post("column", 1.2, 20, 0, 10, 0, m("chrome", "#c7cad1", 0.25, 0.9), vertices=10)
    disc("foot", 5, 1, 0, 0.5, 0, m("chrome", "#c7cad1"), vertices=18)
    ring("footrest", 4.2, 0.4, 0, 8, 0, m("chrome", "#c7cad1"), segments=18)


def piano():
    black = m("piano", "#111114", 0.25, 0.2)
    box("body", 50, 42, 20, 0, 21, 0, black, bevel=0.8)
    box("keybed", 50, 3, 10, 0, 24, 14, black)
    box("keys", 46, 0.8, 7, 0, 26, 15.5, m("keys", "#f4f2ea", 0.4))
    for i in range(18):
        box("black-key", 1.2, 1, 4.5, -21 + i * 2.5, 26.8, 14.2, black)
    box("stool", 26, 2, 12, 0, 15, 30, black, bevel=0.6)
    for x in (-11, 11):
        box("stool-leg", 1.6, 14, 1.6, x, 7, 30, black)
    box("music", 16, 10, 0.4, 0, 34, 10.6, m("paper", "#f4f2ea", 0.9), tilt=0.3)


def phone_bank():
    w = m("trestle", "#5a4a36", 0.8)
    box("table", 80, 2, 22, 0, 27, 0, w)
    for x in (-36, 36):
        box("leg", 2, 26, 18, x, 13, 0, w)
    for i in range(4):
        x = -28 + i * 18
        box("phone", 7, 3, 8, x, 29.5, 2, m("phone", "#1a1a1a", 0.4), bevel=0.5)
        box("handset", 8, 1.4, 2, x, 31.6, 1, m("phone", "#1a1a1a"), bevel=0.4)
        box("tally", 6, 0.3, 8, x + 6, 28.2, 4, m("paper", "#f4f2ea", 0.9), turn=0.2)
    box("chalkboard", 80, 34, 2, 0, 52, -12, m("chalkboard", "#1f3a2a", 0.95))
    for i in range(5):
        box("odds", 60 - i * 6, 1.2, 0.3, -4, 62 - i * 6, -10.8, m("chalk", "#e8e4d8", 0.9))
    for x in (-24, 24):
        box("tv", 20, 14, 8, x, 76, -10, m("tv-frame", "#1a1c20", 0.4, 0.3))
        box("tv-picture", 17, 11, 0.4, x, 76, -5.8, m("tv-race", "#000000", 0.4, emission="#4ac06a", strength=0.8))


def velvet_rope():
    for x in (-30, 0, 30):
        post("post", 1.2, 20, x, 10, 0, brass(), vertices=12)
        disc("base", 4, 1, x, 0.5, 0, brass(), vertices=16)
        ball("top", 1.8, x, 21, 0, brass(), segments=10)
    for x0, x1 in ((-30, 0), (0, 30)):
        for k in range(8):
            t0, t1 = k / 8, (k + 1) / 8
            sag = lambda t: 18 - math.sin(t * math.pi) * 4
            rod("rope", 0.6, (x0 + (x1 - x0) * t0, sag(t0), 0), (x0 + (x1 - x0) * t1, sag(t1), 0), m("rope", "#8a1f2a", 0.8), vertices=6)


MODELS.update({
    "washer": washer, "dryer": dryer, "folding-table": folding_table, "booth": booth, "dining-set": dining_set,
    "drinks-fridge": drinks_fridge, "pallet-rack": pallet_rack, "crate-stack": crate_stack, "forklift": forklift,
    "car-lift": car_lift, "parts-shelf": parts_shelf, "fireplace": fireplace, "display-case": display_case,
    "jar-wall": jar_wall, "stage": stage, "dj-booth": dj_booth, "dartboard": dartboard, "pool-table": pool_table,
    "staircase": staircase, "escalator": escalator, "lift": lift, "sofa": sofa, "coffee-table": coffee_table, "bed": bed,
    "kitchenette": kitchenette, "tv-wall": tv_wall, "bench-row": bench_row, "departure-board": departure_board,
    "ticket-booth": ticket_booth, "newsroom-desk": newsroom_desk, "cell": cell, "bar-stool": bar_stool, "piano": piano,
    "phone-bank": phone_bank, "velvet-rope": velvet_rope,
})

out_dir, preview_dir = kit.args()
only = os.environ.get("ONLY", "")
for name, build in MODELS.items():
    if only and name not in only.split(","):
        continue
    kit.reset()
    kit._materials.clear()
    build()
    if out_dir:
        kit.export(os.path.join(out_dir, f"{name}.glb"))
    if preview_dir:
        small = name in ("hoop", "chess-table")
        kit.preview(os.path.join(preview_dir, f"furniture-{name}.png"), target=(0, 0, 30 if name == "hoop" else 20), distance=60 if small else 140, height=20 if small else 60, angle=-60)

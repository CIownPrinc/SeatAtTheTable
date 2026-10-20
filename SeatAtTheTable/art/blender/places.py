"""The countryside's buildings, the suburb's houses, the building-site pieces, the mall and the
one-of-a-kind places, at the sizes the game's code (src/map/) places them.

Modelled in the game's frame (lib/frame.py): y up, front toward +z, standing on the ground at the
origin, so the numbers match the code that used to build them. Parts are named by material; the
game draws each with its own material, recolouring a few per building ('siding', 'roof', 'door',
'walls', 'cladding', 'mailbox'), and any part whose name starts 'roof' is where snow settles.
Sizes copied from the code: change one, change the other.
Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import math
import os
import sys

import bpy

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
import kit  # noqa: E402
from frame import box, gable_roof, lattice, log, post, prism, rod, window  # noqa: E402


def m(name, color, roughness=0.8, metallic=0.0, emission=None, strength=1.0):
    return kit.material(name, color, roughness=roughness, metallic=metallic, emission=emission, strength=strength)


def glass():
    return m("glass", "#33475a", roughness=0.15, metallic=0.2, emission="#2a3a4a", strength=0.35)


def lit(name="lit-glass", color="#ffcf70"):
    return m(name, "#000000", roughness=0.4, emission=color, strength=0.9)


# --- The suburb's family house (map/suburb.ts HOUSE: 40 x 30, garage 20, lawn 30) -----------------

def house():
    siding, roof, trim = m("siding", "#d8c7a6", 0.85), m("roof", "#5a4a42", 0.9), m("trim", "#f4f2ea", 0.6)
    door, shutter, brick, stone = m("door", "#7a2630", 0.6), m("shutter", "#7a2630", 0.7), m("brick", "#7a4a3a", 0.95), m("stone", "#b8b0a0", 0.95)
    hx, w, d, wall_h = -10, 40, 30, 24
    front = d / 2
    box("foundation", w + 1, 2, d + 1, hx, 1, 0, stone)
    box("walls", w, wall_h - 2, d, hx, 2 + (wall_h - 2) / 2, 0, siding)
    for x in (hx - w / 2, hx + w / 2):
        for z in (-d / 2, d / 2):
            box("corner-board", 1.2, wall_h - 2, 1.2, x, 2 + (wall_h - 2) / 2, z, trim)
    box("frieze", w + 0.6, 1.2, d + 0.6, hx, wall_h - 0.6, 0, trim)
    gable_roof("roof", w, d, 15, hx, wall_h, 0, roof, siding)
    box("chimney", 5, 18, 5, hx - 11, wall_h + 9, -4.5, brick)
    box("chimney-cap", 6.2, 1, 6.2, hx - 11, wall_h + 18.5, -4.5, stone)
    # Front door with its frame, under a porch on posts, a step up to it.
    box("door-frame", 9, 14.6, 0.5, hx - 6, 2 + 7.1, front + 0.25, trim)
    box("door", 7, 13, 0.6, hx - 6, 2 + 6.5, front + 0.5, door)
    box("door-knob", 0.6, 0.6, 0.6, hx - 3.4, 8.4, front + 1.0, m("brass", "#c9a227", 0.3, 0.8))
    box("porch-deck", 16, 2, 8, hx - 6, 1, front + 4, stone)
    for x in (hx - 13, hx + 1):
        box("porch-post", 1.2, 14, 1.2, x, 9, front + 7.4, trim)
    box("roof-porch", 18, 1.2, 9.5, hx - 6, 16.4, front + 4.2, roof, tilt=0.18)
    # Front windows, one each side of the door, shuttered; one in each end wall.
    for x in (hx - 15, hx + 9):
        window(f"front-{x}", 8, 7, x, 12, front, glass(), trim, facing="z", shutter=shutter)
    window("west", 8, 7, hx - w / 2, 12, 0, glass(), trim, facing="-x")
    window("gable-west", 4, 4, hx - w / 2, wall_h + 5, 0, glass(), trim, facing="-x", sill=False)
    window("back", 8, 7, hx, 12, -front, glass(), trim, facing="-z")
    # The garage beside it, a shallow roof, a panelled door onto the driveway.
    gx, gw = w / 2, 20
    box("garage-walls", gw, 16, d - 4, gx, 2 + 8, 2, siding)
    box("garage-foundation", gw + 0.6, 2, d - 3.4, gx, 1, 2, stone)
    box("roof-garage", gw + 3, 1.4, d - 1, gx, 18.8, 2, roof, tilt=-0.05)
    box("garage-frame", gw - 3.4, 14.4, 0.5, gx, 1 + 7.2, front + 0.25, trim)
    box("garage-gap", gw - 5, 13, 0.4, gx, 7.5, front + 0.4, m("garage-gap", "#4a4a48", 0.9))
    for i in range(4):
        box("garage-door", gw - 5.4, 2.9, 0.5, gx, 2.6 + i * 3.25, front + 0.6, m("garage-door", "#e8e4d8", 0.6))
    # Picket fence along the front with gaps for the path and the drive, and the mailbox.
    lawn = 30
    fence_z = front + lawn - 1
    for x0, x1 in ((-(w + gw) / 2 - 6, hx - 9), (hx - 3, gx - gw / 2 - 2)):
        for rail_y in (2.6, 6.2):
            box("fence-rail", x1 - x0, 0.9, 0.5, (x0 + x1) / 2, rail_y, fence_z - 0.5, trim)
        x = x0 + 1.2
        while x < x1:
            box("picket", 1.3, 7, 0.5, x, 3.5, fence_z, trim)
            kit.tapered_box("picket-top", (1.3, 0.5), (0.15, 0.5), 1.4, (x, -fence_z, 7.0), trim)
            x += 3.2
    mx = gx + gw / 2 + 3
    box("mail-post", 1, 8.5, 1, mx, 4.25, fence_z + 1, m("post", "#3a3d44", 0.7))
    box("mailbox", 3, 2.6, 5, mx, 9.6, fence_z + 1, m("mailbox", "#2f4a6a", 0.5, 0.3))
    log("mailbox-top", 1.5, 5, mx, 10.9, fence_z + 1, m("mailbox", "#2f4a6a"), along="z", vertices=12)
    box("mail-flag", 0.3, 2.6, 0.8, mx + 1.7, 11.4, fence_z, m("flag", "#c0392b", 0.5))


# --- The countryside (map/countryBuildings.ts) -------------------------------------------------------

def farmhouse():
    walls, roof, trim = m("walls", "#ece6d6", 0.85), m("roof", "#4a3a34", 0.9), m("trim", "#f4f2ea", 0.6)
    w, d, h = 36, 26, 30
    box("foundation", w + 1, 2, d + 1, 0, 1, 0, m("stone", "#9a948a", 0.95))
    box("walls", w, h - 2, d, 0, 2 + (h - 2) / 2, 0, walls)
    # Clapboard: a shadow line every couple of units up the front and back.
    for y in range(4, h, 3):
        for z in (-d / 2 - 0.15, d / 2 + 0.15):
            box("clapboard", w, 0.35, 0.3, 0, y, z, trim)
    for x in (-w / 2, w / 2):
        for z in (-d / 2, d / 2):
            box("corner-board", 1.2, h - 2, 1.2, x, 2 + (h - 2) / 2, z, trim)
    gable_roof("roof", w, d, 14, 0, h, 0, roof, walls)
    box("chimney", 4, 14, 4, w * 0.3, h + 10, -d * 0.12, m("brick", "#7a4a3a", 0.95))
    # The porch across the front: deck, rail, posts and its own roof.
    deck = m("deck", "#8a7458", 0.85)
    box("porch-deck", w, 2, 10, 0, 1, d / 2 + 5, deck)
    for x in (-w / 2 + 1, -w / 6, w / 6, w / 2 - 1):
        box("porch-post", 1.4, 13, 1.4, x, 8.5, d / 2 + 9, trim)
    for x0, x1 in ((-w / 2 + 1, -4), (4, w / 2 - 1)):
        box("porch-rail", x1 - x0, 0.8, 0.8, (x0 + x1) / 2, 6, d / 2 + 9, trim)
        x = x0 + 1.5
        while x < x1:
            box("baluster", 0.5, 4, 0.5, x, 4, d / 2 + 9, trim)
            x += 2
    box("roof-porch", w + 2, 1.2, 12, 0, 15.6, d / 2 + 5.4, roof, tilt=0.2)
    box("door-frame", 7.6, 12.4, 0.5, 0, 2 + 6.2, d / 2 + 0.25, trim)
    box("door", 6, 11, 0.6, 0, 2 + 5.5, d / 2 + 0.5, m("door", "#3f5a3a", 0.6))
    for x in (-11, 11):
        for y in (9.5, 22):
            window(f"front-{x}-{y}", 6, 6, x, y, d / 2, glass(), trim, facing="z")
    for z in (-6, 6):
        window(f"side-{z}", 5, 6, w / 2, 22, z, glass(), trim, facing="x")


def barn():
    red, roof, trim, door = m("barn-red", "#9a2e26", 0.9), m("roof", "#3a3d44", 0.7, 0.3), m("trim", "#f4f2ea", 0.6), m("barn-door", "#7a221c", 0.9)
    w, d, h = 52, 36, 22
    box("foundation", w + 1, 1.6, d + 1, 0, 0.8, 0, m("stone", "#8a847a", 0.95))
    box("walls", w, h - 1.6, d, 0, 1.6 + (h - 1.6) / 2, 0, red)
    # Board-and-batten: thin battens down every wall.
    for x in range(-int(w / 2) + 2, int(w / 2), 3):
        for z in (-d / 2 - 0.2, d / 2 + 0.2):
            box("batten", 0.4, h - 1.6, 0.3, x, 1.6 + (h - 1.6) / 2, z, red)
    # The gambrel roof: steep lower slopes, shallow upper ones, over red gable ends.
    profile = [(-d / 2, 0), (d / 2, 0), (d / 2 - 4, 11), (0, 18), (-d / 2 + 4, 11)]
    prism("gable", profile, w, 0, h, 0, red)
    for (z0, y0), (z1, y1) in ((profile[0], profile[4]), (profile[4], profile[3]), (profile[3], profile[2]), (profile[2], profile[1])):
        ang = math.atan2(y1 - y0, z1 - z0)
        length = math.hypot(z1 - z0, y1 - y0) + 1.6
        box("roof-slab", w + 3, 1.2, length, 0, h + (y0 + y1) / 2 + 0.6, (z0 + z1) / 2, roof, tilt=-ang)
    box("roof-ridge", w + 3, 1.2, 2.2, 0, h + 18.6, 0, roof)
    # The big double doors on the gable end, framed white with cross braces, the hayloft door above.
    end = w / 2
    box("barn-doors", 0.6, 16, 18, end + 0.3, 8, 0, door)
    for z in (-9.3, 9.3, 0):
        box("door-trim", 0.8, 16.6, 1.4, end + 0.6, 8.3, z, trim)
    box("door-trim", 0.8, 1.4, 20, end + 0.6, 16.3, 0, trim)
    for side in (-1, 1):
        box("door-brace", 0.8, 1.2, 12.6, end + 0.7, 8, side * 4.6, trim, roll=0, tilt=side * 0.95)
    box("loft-door", 0.6, 6, 7, end + 0.3, h + 6, 0, door)
    box("loft-trim", 0.8, 7, 8.2, end + 0.4, h + 6, 0, trim)
    box("loft-beam", 6, 1, 1, end + 3, h + 12, 0, m("beam", "#4a3624", 0.9))
    # The cupola on the ridge.
    box("cupola", 6, 6, 6, 0, h + 21, 0, red)
    for s in (-1, 1):
        box("louvre", 0.4, 4, 4, s * 3.1, h + 21, 0, trim)
        box("louvre", 4, 4, 0.4, 0, h + 21, s * 3.1, trim)
    bpy.ops.mesh.primitive_cone_add(radius1=5, radius2=0.2, depth=5, vertices=4, location=(0, 0, h + 26.5), rotation=(0, 0, math.pi / 4))
    bpy.context.active_object.data.materials.append(roof)
    window("side", 5, 4, 0, 14, d / 2, glass(), trim, facing="z")


def silo():
    concrete, steel = m("concrete", "#c8c4b8", 0.9), m("roof", "#8f9296", 0.4, 0.6)
    r, h = 9, 44
    post("body", r, h, 0, h / 2, 0, concrete, vertices=28)
    for y in range(6, h, 6):
        post("hoop", r + 0.3, 0.6, 0, y, 0, m("band", "#8f9296", 0.5, 0.5), vertices=28)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r + 0.2, segments=28, ring_count=14, location=(0, 0, h))
    dome = bpy.context.active_object
    dome.data.materials.append(steel)
    # Keep only the top half of the sphere.
    import bmesh
    bm = bmesh.new()
    bm.from_mesh(dome.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.01], context="VERTS")
    bm.to_mesh(dome.data)
    bm.free()
    post("vent", 1.4, 3, 0, h + r + 1, 0, steel, vertices=10)
    # The ladder up the side inside its safety cage, and the chute.
    rail = m("ladder", "#5c5f66", 0.5, 0.6)
    for x in (-1.2, 1.2):
        box("ladder-rail", 0.4, h, 0.4, x, h / 2, r + 1.2, rail)
    for y in range(2, h, 2):
        box("rung", 2.4, 0.3, 0.3, 0, y, r + 1.2, rail)
    for y in range(12, h, 5):
        for a in range(7):
            t = math.pi * a / 6
            box("cage", 0.3, 0.3, 0.3, math.cos(t) * 2.4, y, r + 1.2 + math.sin(t) * 2.4, rail)
        rod("cage-hoop-l", 0.15, (-2.4, y, r + 1.2), (-1.7, y, r + 2.9), rail, vertices=4)
        rod("cage-hoop-r", 0.15, (2.4, y, r + 1.2), (1.7, y, r + 2.9), rail, vertices=4)
        rod("cage-hoop-f", 0.15, (-1.7, y, r + 2.9), (1.7, y, r + 2.9), rail, vertices=4)
    rod("chute", 0.9, (-r * 0.6, h - 4, -r * 0.6), (-r - 6, 6, -r - 6), m("band", "#8f9296"), vertices=10)


def shed():
    cladding, rib, roof = m("cladding", "#7c8288", 0.6, 0.4), m("rib", "#5c6268", 0.6, 0.4), m("roof", "#4b5051", 0.6, 0.4)
    w, d, h = 40, 30, 18
    box("slab", w + 2, 1, d + 2, 0, 0.5, 0, m("concrete", "#a7a59e", 0.95))
    box("walls", w, h - 1, d, 0, 1 + (h - 1) / 2, 0, cladding)
    for x in range(-int(w / 2) + 2, int(w / 2), 3):
        for z in (-d / 2 - 0.3, d / 2 + 0.3):
            box("rib", 0.8, h - 1, 0.6, x, 1 + (h - 1) / 2, z, rib)
    gable_roof("roof", w, d, 6, 0, h, 0, roof, cladding, overhang=1.0, eave=1.5, thick=0.8)
    # The roller door on the end, its box above, and a side door.
    end = w / 2
    box("door-box", 1.6, 2.4, 18, end + 0.8, 14.6, 0, rib)
    for y in range(1, 13, 1):
        box("roller", 0.5, 0.8, 16, end + 0.4, y + 0.6, 0, m("roller", "#9aa0a8", 0.5, 0.5))
    for z in (-8.5, 8.5):
        box("door-guide", 0.8, 13.4, 1, end + 0.5, 7.7, z, rib)
    box("side-door", 6, 11, 0.5, -10, 6.5, d / 2 + 0.7, m("door", "#3a3d44", 0.6))
    box("light", 1.6, 1, 1, -10, 13.6, d / 2 + 1.2, lit())


def tank():
    white, steel = m("tank", "#d8d4c8", 0.5, 0.3), m("roof", "#9a9ea6", 0.5, 0.5)
    r, h = 12, 22
    post("plinth", r + 2, 1.2, 0, 0.6, 0, m("concrete", "#a7a59e", 0.95), vertices=28)
    post("body", r, h, 0, 1.2 + h / 2, 0, white, vertices=32)
    for y in (6, 12, 18):
        post("seam", r + 0.15, 0.3, 0, 1.2 + y, 0, steel, vertices=32)
    bpy.ops.mesh.primitive_cone_add(radius1=r, radius2=r * 0.35, depth=4, vertices=32, location=(0, 0, 1.2 + h + 2))
    bpy.context.active_object.data.materials.append(steel)
    rail = m("rail", "#5c5f66", 0.5, 0.6)
    for a in range(16):
        t = a / 16 * math.tau
        post("rail-post", 0.25, 3, math.cos(t) * (r - 0.4), 1.2 + h + 3, math.sin(t) * (r - 0.4), rail, vertices=4)
    bpy.ops.mesh.primitive_torus_add(major_radius=r - 0.4, minor_radius=0.3, major_segments=32, minor_segments=4, location=(0, 0, 1.2 + h + 4.5))
    bpy.context.active_object.data.materials.append(rail)
    # A ladder up the side and a valve on its pipe at the foot.
    for z in (-1.2, 1.2):
        box("ladder-rail", 0.4, h + 4, 0.4, r + 1, 1.2 + (h + 4) / 2, z, rail)
    for y in range(3, h + 4, 2):
        box("rung", 0.3, 0.3, 2.4, r + 1, 1.2 + y, 0, rail)
    log("pipe", 0.9, 8, r + 3, 2.5, -5, rail, along="x")
    post("valve", 1.6, 0.4, r + 5, 4.4, -5, m("valve", "#c0392b", 0.5), vertices=12)


# --- Building sites (map/construction.ts) -------------------------------------------------------------

def site_cabin():
    """The site office: a portable cabin, 20 x 10 x 9, on blocks, with its door and steps."""
    shell, trim = m("cabin", "#d8d2c0", 0.7), m("cabin-trim", "#4a4f58", 0.6, 0.3)
    for x in (-8, 8):
        for z in (-3, 3):
            box("block", 2, 1, 2, x, 0.5, z, m("concrete", "#a7a59e", 0.95))
    box("body", 20, 8, 9, 0, 5, 0, shell)
    box("roof-cabin", 20.6, 0.8, 9.6, 0, 9.4, 0, trim)
    box("skirt", 20.2, 1, 9.2, 0, 1.4, 0, trim)
    for x in range(-9, 10, 3):
        box("corrugation", 0.3, 8, 0.2, x, 5, 4.6, shell)
    box("door", 3.4, 6.4, 0.4, 6, 4.6, 4.7, trim)
    for x in (-6, -1.5):
        window(f"win-{x}", 3.2, 2.6, x, 6, 4.5, glass(), trim, facing="z", sill=False)
    box("step", 4, 0.8, 2, 6, 1.2, 5.6, trim)
    box("step", 4, 0.8, 1.6, 6, 0.4, 7.2, trim)


def site_toilet():
    """The portable toilet, 5 x 10 x 5."""
    blue, white = m("toilet", "#2f6bb0", 0.5), m("toilet-roof", "#e8e8e4", 0.5)
    box("base", 5.2, 0.6, 5.2, 0, 0.3, 0, m("toilet-base", "#2a3a5a", 0.6))
    box("body", 5, 9, 5, 0, 5.1, 0, blue, bevel=0.3)
    box("roof", 5.6, 0.8, 5.6, 0, 10, 0, white, bevel=0.2)
    box("door", 3.6, 7.6, 0.3, 0, 4.8, 2.6, m("toilet-door", "#25589a", 0.5))
    box("vent", 0.8, 2.4, 0.8, -1.6, 11.2, -1.6, white)
    box("sign", 1.4, 0.8, 0.2, 0, 7.6, 2.8, m("toilet-sign", "#2fae5a", 0.4))
    box("handle", 0.3, 1.2, 0.4, 1.3, 4.6, 2.8, white)


def crane_mast():
    """One bay of the tower crane's mast: 5 x 14 x 5, standing on its base. The game stacks bays."""
    lattice("mast", 5, 14, 5, 0, 7, 0, m("crane", "#e8b923", 0.6, 0.3), chord=0.7, brace=0.25)


def crane_jib():
    """One bay of the jib: 10 long along three's -x from the origin, 4 deep, its top chord narrow.
    The game strings bays out to each site's reach."""
    yellow = m("crane", "#e8b923", 0.6, 0.3)
    for z in (-1.7, 1.7):
        box("chord", 10, 0.6, 0.6, -5, 0.3, z, yellow)
        rod("diag", 0.2, (0, 0.3, z), (-5, 3.7, 0), yellow, vertices=5)
        rod("diag", 0.2, (-5, 3.7, 0), (-10, 0.3, z), yellow, vertices=5)
    box("chord-top", 10, 0.6, 0.6, -5, 3.7, 0, yellow)
    box("strut", 0.4, 0.4, 3.4, 0, 0.3, 0, yellow)
    box("trolley-rail", 10, 0.3, 0.3, -5, 0.0, 0, m("crane-dark", "#4a4f58", 0.6, 0.4))


def crane_head():
    """Everything at the top of the mast that doesn't depend on the site: the slewing ring, the
    operator's cab, the apex tower with its ties, and the counter-jib with its concrete weights.
    Its origin is the top of the mast; the jib bays leave it along -x from x = 6."""
    yellow, dark = m("crane", "#e8b923", 0.6, 0.3), m("crane-dark", "#4a4f58", 0.6, 0.4)
    post("slew-ring", 3.4, 1.6, 0, 0.8, 0, dark, vertices=16)
    box("turntable", 8, 2.4, 6, 1, 2.8, 0, yellow)
    # The operator's cab, glazed, hung off the front of the turntable.
    box("cab", 5, 5, 5, 3.5, 1.6, 3.6, m("cab", "#e8e4d8", 0.6))
    box("cab-glass", 5.2, 2.6, 4, 3.5, 2.2, 3.9, glass())
    # The jib's root, from the turntable to where the first bay starts.
    for z in (-1.7, 1.7):
        box("root-chord", 8, 0.6, 0.6, 2, 4.3, z, yellow)
    box("root-top", 8, 0.6, 0.6, 2, 7.7, 0, yellow)
    # The counter-jib, out along +x, with its walkway, rails and weights.
    lattice("counter-jib", 26, 3, 3.6, 19, 5.5, 0, yellow, chord=0.6, brace=0.2, bays=4, along="x")
    box("walkway", 26, 0.3, 4.6, 19, 4.0, 0, dark)
    for z in (-2.3, 2.3):
        box("handrail", 26, 0.3, 0.3, 19, 6.6, z, yellow)
    for i, x in enumerate((24, 27.4, 30.8)):
        box("weight", 3.2, 8, 6, x, 0.8, 0, m("weight", "#a7a59e", 0.95))
    box("winch", 5, 3, 3.6, 14, 7.2, 0, dark)
    # The apex tower, and its ties down to each end.
    lattice("apex", 3, 14, 3, 0, 11, 0, yellow, chord=0.5, brace=0.2, bays=3)
    rod("tie-back", 0.2, (0, 18, 0), (30, 7, 0), dark, vertices=5)
    rod("tie-front", 0.2, (0, 18, 0), (-40, 7.7, 0), dark, vertices=5)
    box("beacon", 0.8, 0.8, 0.8, 0, 18.6, 0, m("beacon", "#000000", 0.4, emission="#ff3020", strength=1.0))


# --- Lakeridge Mall (map/mall.ts: body 340 x 95 x 170, garage 160 x 160, decks of 30) ------------------

SHOPFRONTS = ["#7a2630", "#2f4a6a", "#c9a227", "#3f5a3a", "#3a3f4b", "#8a4a2a"]


def mall():
    w, d, h = 340, 170, 95
    wall, cornice, band = m("mall-wall", "#d9cdb4", 0.85), m("cornice", "#8a7a62", 0.8), m("band", "#a8987e", 0.8)
    frame, gl = m("frame", "#5c6470", 0.4, 0.5), m("atrium-glass", "#9cc4d8", 0.1, 0.2, emission="#3a5a6a", strength=0.6)
    front = -d / 2
    box("base", w + 2, 3, d + 2, 0, 1.5, 0, m("plinth", "#8a8478", 0.95))
    box("walls", w, h - 3, d, 0, 3 + (h - 3) / 2, 0, wall)
    box("cornice", w + 4, 6, d + 4, 0, h + 3, 0, cornice)
    box("band", w + 2, 4, d + 2, 0, h * 0.5, 0, band)
    # Pilasters every 34 units along the front and sides.
    x = -w / 2
    while x <= w / 2:
        box("pilaster", 4, h, 2, x, h / 2, front - 1, band)
        x += 34
    # The glass atrium over the entrance, mullioned, its doors and a canopy.
    box("atrium", 96, h + 22, 22, 0, (h + 22) / 2, front - 8, gl)
    box("atrium-cap", 100, 4, 26, 0, h + 24, front - 8, frame)
    for xx in range(-48, 49, 12):
        box("mullion", 1.6, h + 22, 1.2, xx, (h + 22) / 2, front - 19.4, frame)
    for yy in range(12, h + 22, 14):
        box("transom", 96, 1.2, 1.2, 0, yy, front - 19.4, frame)
    box("doors", 52, 30, 1.2, 0, 15, front - 20, m("door-glass", "#2a2f38", 0.2, 0.3))
    for xx in (-13, 0, 13):
        box("door-frame", 1.2, 30, 1.6, xx, 15, front - 20.4, frame)
    box("canopy", 64, 1.6, 12, 0, 32, front - 25, frame)
    for xx in (-30, 30):
        post("canopy-post", 0.8, 32, xx, 16, front - 30, frame, vertices=8)
    # Lit shopfronts with coloured awnings, three each side of the atrium.
    shop = m("shop-glass", "#f6e3b8", 0.3, emission="#7a6a4a", strength=0.6)
    for i, color in enumerate(SHOPFRONTS):
        side = -1 if i < 3 else 1
        xx = side * (74 + (i % 3) * 32)
        box("shopfront", 26, 26, 1.5, xx, 16, front - 0.8, shop)
        box("shop-frame", 28, 28, 1, xx, 16, front - 0.3, frame)
        awning = m(f"awning-{i}", color, 0.8)
        box("awning", 28, 1.0, 8, xx, 31, front - 4, awning, tilt=-0.35)
        box("awning-valance", 28, 2.4, 0.4, xx, 29.4, front - 7.8, awning)
    # Upper floors: a band of dark glass along the front and down each side.
    upper = m("upper-glass", "#33475a", 0.15, 0.2, emission="#1e2c3a", strength=0.3)
    for s in (-1, 1):
        box("upper-front", (w - 120) / 2 - 4, 18, 1.5, s * (48 + ((w - 120) / 2 - 4) / 2 + 4), h * 0.72, front - 0.8, upper)
        box("upper-side", 1.5, 18, d - 40, s * (w / 2 + 0.8), h * 0.72, 0, upper)
    # Roof: a skylight strip down the middle, plant and its screens.
    box("skylight", w * 0.6, 3, 18, 0, h + 1.5, 0, gl)
    for xx, zz in ((-120, 40), (-90, 40), (110, -40), (130, 50)):
        box("plant", 22, 12, 18, xx, h + 6, zz, m("plant", "#7c8088", 0.6, 0.4))
        for k in range(-8, 9, 4):
            box("plant-grille", 0.4, 10, 18.4, xx + k, h + 6, zz, m("grille", "#5c6068", 0.6, 0.4))


def mall_garage():
    w, d, deck, decks = 160, 160, 30, 3
    concrete, wall_c, col = m("deck", "#a7a59e", 0.95), m("parapet", "#bdbab2", 0.9), m("column", "#9a978f", 0.9)
    box("ground-slab", w, 1, d, 0, 0.5, 0, concrete)
    for level in range(1, decks + 1):
        y = level * deck
        box("deck", w, 4, d, 0, y - 2, 0, concrete)
        box("deck-edge", w + 1, 1.2, d + 1, 0, y - 3.6, 0, wall_c)
        for s in (-1, 1):
            box("parapet", w, 8, 2.4, 0, y + 4, s * (d / 2 - 1.2), wall_c)
            box("parapet", 2.4, 8, d, s * (w / 2 - 1.2), y + 4, 0, wall_c)
            box("rail", w, 0.8, 0.8, 0, y + 9, s * (d / 2 - 1.2), m("rail", "#5c6068", 0.5, 0.5))
        for xx in range(int(-w / 2 + 16), int(w / 2 - 8), 20):
            box("bay-line", 1.2, 0.3, 30, xx, y + 0.2, -d / 2 + 24, m("line", "#f0efe8", 0.6))
            box("bay-line", 1.2, 0.3, 30, xx, y + 0.2, d / 2 - 24, m("line", "#f0efe8", 0.6))
    for i in range(4):
        xx = -w / 2 + 6 + i * (w - 12) / 3
        for zz in (-d / 2 + 6, 0, d / 2 - 6):
            box("column", 5, decks * deck, 5, xx, decks * deck / 2, zz, col)
    # The ramp up the east side, with its side walls; the stair tower and its P sign.
    ramp_len = d * 0.8
    ang = math.atan2(deck, ramp_len)
    box("ramp", 30, 3, ramp_len / math.cos(ang), w / 2 + 15, deck / 2, 0, concrete, tilt=-ang)
    for s in (-1, 1):
        box("ramp-wall", 1.6, 6, ramp_len / math.cos(ang), w / 2 + 15 + s * 15, deck / 2 + 4, 0, wall_c, tilt=-ang)
    box("stair-tower", 22, decks * deck + 14, 22, w / 2 - 11, (decks * deck + 14) / 2, -d / 2 + 11, m("stair", "#6d7a86", 0.7))
    for yy in range(10, decks * deck + 10, 10):
        box("stair-glass", 6, 6, 0.6, w / 2 - 11, yy, -d / 2 - 0.2, glass())
    box("sign-p", 14, 14, 1.5, w / 2 - 11, decks * deck + 2, -d / 2 - 0.8, m("sign-blue", "#2f6bb0", 0.4, emission="#1a3a70", strength=0.5))
    # The P itself, in white strokes on the panel.
    white = m("sign-white", "#ffffff", 0.4, emission="#ffffff", strength=0.8)
    cx, cy, cz = w / 2 - 11, decks * deck + 2, -d / 2 - 1.7
    box("p-stem", 2, 10, 0.4, cx - 2.5, cy, cz, white)
    box("p-top", 6, 2, 0.4, cx, cy + 4, cz, white)
    box("p-mid", 6, 2, 0.4, cx, cy, cz, white)
    box("p-side", 2, 6, 0.4, cx + 3, cy + 2, cz, white)


# --- One-of-a-kind places (map/placeSpecials.ts) ----------------------------------------------------

def flat(name, w, d, x, z, y, mat):
    box(name, w, 0.1, d, x, y, z, mat)


def airfield():
    tarmac, paint, grey = m("tarmac", "#3a3c42", 0.95), m("paint", "#f0efe8", 0.6), m("hangar", "#8f949c", 0.5, 0.5)
    flat("runway", 260, 34, 40, 26, 0.14, tarmac)
    for x in range(-70, 160, 22):
        flat("centre-line", 10, 1.6, x, 26, 0.2, paint)
    for z in (11, 41):
        flat("edge-line", 260, 0.8, 40, z, 0.2, paint)
    for x in range(-80, 170, 20):
        for z in (8.5, 43.5):
            post("runway-light", 0.4, 0.8, x, 0.4, z, lit("runway-light", "#ffe0a0"), vertices=6)
    flat("apron", 70, 40, -30, -10, 0.16, m("apron", "#4a4c52", 0.95))
    # The hangar: a ribbed barrel roof on low walls, open at the front behind sliding doors.
    log("hangar-roof", 20, 52, -30, 0, -18, grey, along="z", vertices=24)
    for zz in range(-42, 7, 4):
        bpy.ops.mesh.primitive_torus_add(major_radius=20.1, minor_radius=0.3, major_segments=24, minor_segments=4, location=(-30, -zz, 0), rotation=(math.pi / 2, 0, 0))
        bpy.context.active_object.data.materials.append(m("hangar-rib", "#6d727a", 0.5, 0.5))
    box("hangar-door", 30, 18, 0.6, -30, 9, 8.2, m("hangar-door", "#3a3d44", 0.6, 0.3))
    for xx in (-44, -16):
        box("door-panel", 8, 15, 0.6, xx, 7.5, 8.6, m("door-panel", "#6d727a", 0.5, 0.5))
    # The windsock on its mast.
    post("sock-mast", 0.6, 26, 30, 13, -18, m("mast", "#d8d8d8", 0.5), vertices=8)
    sock = m("windsock", "#e8742a", 0.8)
    for i in range(4):
        bpy.ops.mesh.primitive_cone_add(radius1=2.6 - i * 0.35, radius2=2.25 - i * 0.35, depth=2.4, vertices=12, location=(31.6 + i * 2.4, 18, 25), rotation=(0, math.pi / 2, 0))
        bpy.context.active_object.data.materials.append(sock if i % 2 == 0 else paint)
    # The crop-duster on the apron: fuselage, cockpit, low wing, struts, tail, wheels and propeller.
    yellow = m("plane", "#d4a017", 0.5, 0.2)
    bpy.ops.mesh.primitive_cone_add(radius1=2.6, radius2=1.0, depth=26, vertices=14, location=(10, 6, 5), rotation=(0, -math.pi / 2, 0))
    bpy.context.active_object.data.materials.append(yellow)
    box("cockpit", 5, 2.4, 3.6, 14, 7.4, -6, glass())
    box("wing", 6, 0.8, 40, 13, 3.4, -6, yellow, bevel=0.3)
    box("tailplane", 4, 0.6, 14, -2, 5.4, -6, yellow)
    box("fin", 4, 6, 0.6, -2, 8, -6, m("fin", "#c0392b", 0.5))
    log("nose", 2.2, 3, 24, 5, -6, m("cowl", "#3a3d44", 0.5, 0.5), along="x", vertices=14)
    box("propeller", 0.6, 10, 1.2, 25.8, 5, -6, m("prop", "#2a2a2a", 0.5))
    for zz in (-10, -2):
        rod("strut", 0.25, (16, 0.8, -6 + (zz + 6) * 0.6), (14, 4, -6 + (zz + 6)), m("strut", "#3a3d44"))
        log("wheel", 1.4, 0.8, 16, 1.4, -6 + (zz + 6) * 0.6, m("tyre", "#1a1a1a", 0.9), along="z", vertices=12)


def docks():
    wood, dark = m("wharf", "#6a5a44", 0.95), m("plank-gap", "#4f4232", 0.95)
    flat("wharf", 118, 86, 0, 0, 0.14, wood)
    for x in range(-54, 55, 6):
        flat("plank", 0.6, 86, x, 0, 0.17, dark)
    box("kerb", 118, 1.4, 1.6, 0, 0.7, 42.6, m("kerb", "#4a3a2a", 0.95))
    for x in range(-50, 51, 20):
        post("bollard", 1.6, 4, x, 2, 38, m("bollard", "#2a2d33", 0.5, 0.5), vertices=12)
        post("bollard-cap", 2.1, 0.8, x, 4.2, 38, m("bollard", "#2a2d33"), vertices=12)
    # Two stacks of containers, three high, each ribbed with doors on its end.
    for i, color in enumerate(["#a83228", "#2f6bb0", "#d4a017", "#2f8f6a", "#7a4a8a", "#c86a2a"]):
        c = m(f"container-{i}", color, 0.7, 0.3)
        y, z = 5 + (i // 2) * 10, -19 + (i % 2) * 10
        box("container", 22, 9.6, 8.6, -34, y, z, c)
        for xx in range(-44, -23, 2):
            box("rib", 0.4, 9, 8.9, xx, y, z, c)
        box("doors", 0.4, 9, 8, -22.9, y, z, c)
        for zz in (-1.6, 1.6):
            box("lock-bar", 0.3, 8.4, 0.3, -22.6, y, z + zz, m("lock", "#2a2a2a", 0.5, 0.5))
    # The dockside gantry crane, its legs and girder in lattice, its spreader and a box on the hook.
    orange = m("gantry", "#d4692a", 0.6, 0.3)
    for x in (14, 46):
        for z in (-28, -12):
            lattice("leg", 2.6, 44, 2.6, x, 22, z, orange, chord=0.6, brace=0.2, bays=6)
        box("bogie", 4, 3, 20, x, 1.5, -20, m("bogie", "#3a3d44", 0.6, 0.4))
    lattice("girder", 40, 3, 24, 30, 46, -20, orange, chord=0.8, brace=0.25, bays=6, along="x")
    box("trolley", 6, 5, 6, 30, 42, -20, m("trolley", "#3a3d44", 0.6, 0.4))
    box("cab", 5, 4, 4, 22, 41, -27, glass())
    for xx in (29, 31):
        box("cable", 0.3, 20, 0.3, xx, 30, -20, m("cable", "#1a1a1a"))
    box("spreader", 22, 1.2, 8, 30, 20.6, -20, orange)
    box("load", 22, 9.6, 8.6, 30, 15, -20, m("container-1", "#2f6bb0"))


def railyard():
    flat("ballast", 118, 86, 0, 0, 0.14, m("ballast", "#5a5248", 0.95))
    sleeper, steel = m("sleeper", "#4a3a2a", 0.95), m("steel", "#8f949c", 0.4, 0.7)
    for z in (-36, -22, -8):
        box("bed", 116, 0.4, 11, 0, 0.3, z, m("bed", "#6a6258", 0.95))
        for x in range(-56, 57, 4):
            box("sleeper", 1.6, 0.6, 9, x, 0.6, z, sleeper)
        for side in (-1, 1):
            box("rail", 116, 0.8, 0.5, 0, 1.2, z + side * 3, steel)
            box("rail-foot", 116, 0.2, 1.2, 0, 0.9, z + side * 3, steel)
    # A rake of freight wagons on the back track: a body on a chassis, bogies with wheels, couplers.
    for i, color in enumerate(["#7a3b2a", "#3e5a6a", "#7a3b2a", "#5a5a3a"]):
        x = -40 + i * 22
        c = m(f"wagon-{i % 3}", color, 0.8, 0.2)
        box("chassis", 20, 1.2, 8, x, 3.6, -22, m("chassis", "#2a2a2a", 0.6, 0.4))
        box("wagon", 20, 10, 8.6, x, 9.2, -22, c)
        for xx in range(-8, 9, 4):
            box("wagon-rib", 0.4, 10, 8.9, x + xx, 9.2, -22, c)
        box("wagon-roof", 20.4, 0.8, 9, x, 14.6, -22, m("chassis", "#2a2a2a"))
        box("wagon-door", 6, 8, 0.3, x, 8.6, -17.6, m("wagon-door", "#5a3a2a", 0.8))
        for dx in (-6, 6):
            box("bogie", 6, 1.6, 7, x + dx, 2.4, -22, m("chassis", "#2a2a2a"))
            for ddx in (-1.8, 1.8):
                log("wheel", 1.6, 9.6, x + dx + ddx, 1.6, -22, m("wheel", "#1a1a1a", 0.6, 0.6), along="z", vertices=12)
        box("coupler", 2, 0.8, 0.8, x + 10.6, 3.6, -22, m("chassis", "#2a2a2a"))
    # The signal hut with its window and a stovepipe, and the signal on its post.
    box("hut", 14, 12, 12, 44, 6, 30, m("hut", "#8a7a62", 0.9))
    box("roof-hut", 16, 1.4, 14, 44, 12.7, 30, m("roof", "#4a4038", 0.9))
    window("hut-window", 5, 4, 44, 7, 36, lit(), m("trim", "#e8e4d8", 0.6), facing="z", sill=True)
    box("hut-door", 4, 9, 0.4, 38.5, 4.5, 36.2, m("hut-door", "#4a3a2a", 0.8))
    post("stovepipe", 0.6, 6, 48, 16, 27, m("chassis", "#2a2a2a"), vertices=8)
    post("signal-post", 0.5, 18, 28, 9, 16, m("chassis", "#2a2a2a"), vertices=8)
    box("signal-head", 2.4, 5, 2, 28, 18, 16, m("chassis", "#2a2a2a"))
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.8, segments=10, ring_count=6, location=(28, -17.1, 19.4))
    bpy.context.active_object.data.materials.append(m("signal-red", "#000000", 0.4, emission="#ff2020", strength=1.0))
    box("signal-hood", 2.0, 0.3, 1.4, 28, 20.4, 17.4, m("chassis", "#2a2a2a"))


def drive_in():
    flat("lot", 130, 100, 0, 0, 0.14, m("lot", "#3a3b40", 0.95))
    frame = m("screen-frame", "#4a4c52", 0.6, 0.4)
    # The screen on its lattice frame, lit, with its back bracing.
    box("screen", 116, 46, 1.2, 0, 30, -42, m("screen", "#000000", 0.6, emission="#cfd8e0", strength=0.9))
    box("screen-surround", 120, 50, 1.0, 0, 30, -43.2, frame)
    for x in (-56, 56):
        lattice("tower", 3, 54, 3, x, 27, -44, frame, chord=0.5, brace=0.2, bays=6)
    for x in (-36, 0, 36):
        rod("back-brace", 0.6, (x, 50, -44), (x, 0, -60), frame)
    box("screen-top", 120, 3, 2, 0, 55.5, -42, frame)
    # Parking humps, each row with its speaker posts.
    for row in range(4):
        z = -20 + row * 16
        box("hump", 110, 1.2, 4, 0, 0.6, z, m("hump", "#4f5157", 0.95))
        for x in range(-48, 49, 16):
            post("speaker-post", 0.4, 6, x, 3, z + 3, m("post", "#3a3d44", 0.6), vertices=6)
            box("speaker", 1.6, 2, 1, x, 6, z + 3.4, m("speaker", "#2a2a2a", 0.6))
    # The projection booth, its window facing the screen; the snack bar with its striped awning.
    box("booth", 16, 12, 14, 0, 6, 28, m("booth", "#8a7a62", 0.9))
    box("roof-booth", 17, 1, 15, 0, 12.5, 28, m("roof", "#4a4038", 0.9))
    box("booth-window", 4, 3, 0.4, 0, 9, 20.8, m("projector", "#000000", 0.4, emission="#fff2c8", strength=1.0))
    box("snack-bar", 18, 11, 14, -50, 5.5, 24, m("snack", "#c0392b", 0.8))
    for i in range(5):
        box("awning-stripe", 3.6, 0.6, 6, -57.2 + i * 3.6, 10.2, 34.0, m("stripe-red" if i % 2 else "stripe-white", "#c0392b" if i % 2 else "#f0efe8", 0.7), tilt=0.35)
    box("roof-snack", 20, 1.2, 16, -50, 11.6, 24, m("snack-roof", "#f0efe8", 0.7))
    box("hatch", 10, 4, 0.4, -50, 6.4, 31.2, lit("hatch", "#ffe0a0"))
    box("counter", 12, 0.8, 2, -50, 4.2, 32, m("counter", "#e8e4d8", 0.6))


def lodge():
    w, d, wall_h = 64, 46, 22
    log_a, log_b = m("log", "#7a5232", 0.95), m("log-end", "#6a4a2c", 0.95)
    box("plinth", w + 4, 1.6, d + 4, 0, 0.8, 0, m("stone", "#8a8478", 0.95))
    y = 2.4
    while y < wall_h:
        for z in (-d / 2, d / 2):
            log("log", 1.6, w + 5, 0, y, z, log_a, along="x", vertices=10)
        for x in (-w / 2, w / 2):
            log("log", 1.6, d + 5, x, y + 1.6, 0, log_b, along="z", vertices=10)
        y += 3.2
    box("core", w - 2, wall_h, d - 2, 0, wall_h / 2, 0, m("chinking", "#5a3e26", 0.95))
    gable_roof("roof", w, d, 18, 0, wall_h, 0, m("roof-shingle", "#3a3430", 0.95), log_a, overhang=4, eave=4, thick=1.6)
    # The fieldstone chimney up the east end.
    stone = m("fieldstone", "#8a8478", 0.95)
    box("chimney", 8, wall_h + 24, 8, w / 2 + 2, (wall_h + 24) / 2, -d / 4, stone)
    box("chimney-cap", 9.4, 1.4, 9.4, w / 2 + 2, wall_h + 24.6, -d / 4, m("stone", "#8a8478"))
    for k in range(0, wall_h + 20, 5):
        box("stone-course", 8.4, 0.6, 8.4, w / 2 + 2, k + 2, -d / 4, m("mortar", "#6a6458", 0.95))
    # The porch along the front, on log posts, under its own roof; the door and lit windows.
    box("porch-deck", w, 1.6, 10, 0, 1.6, d / 2 + 5, log_b)
    for x in (-w / 2 + 3, -w / 6, w / 6, w / 2 - 3):
        post("porch-post", 1.1, 14, x, 8.6, d / 2 + 9, log_b, vertices=8)
    box("roof-porch", w + 2, 1.4, 12, 0, 16.2, d / 2 + 5.4, m("roof-shingle", "#3a3430"), tilt=0.22)
    box("door", 8, 13, 0.6, 0, 8.4, d / 2 + 1.2, m("door", "#3a2a1a", 0.8))
    for x in (-18, 18):
        box("window", 8, 7, 0.6, x, 12, d / 2 + 1.2, lit())
        box("window-frame", 9.4, 8.4, 0.4, x, 12, d / 2 + 0.9, log_b)
        box("window-cross", 0.6, 7, 0.4, x, 12, d / 2 + 1.6, log_b)
    # A woodpile under the porch end, an antler sign over the door.
    for i in range(6):
        log("firewood", 0.8, 8, w / 2 - 6, 1.2 + (i // 3) * 1.5, d / 2 + 3 + (i % 3) * 1.6, log_a, along="x", vertices=7)
    box("sign", 18, 3.4, 0.6, 0, 18.6, d / 2 + 10.8, m("sign-board", "#5a3e26", 0.8))


def motel():
    w, d, h = 72, 40, 18
    walls, roof, trim = m("motel-wall", "#e0c8a0", 0.85), m("roof", "#7a3a2a", 0.85), m("trim", "#f0efe8", 0.6)
    box("walls", w, h, d, 0, h / 2, -4, walls)
    box("roof-motel", w + 4, 1.6, d + 10, 0, h + 0.8, 0, roof)
    box("fascia", w + 4, 2.4, 0.4, 0, h - 0.2, d / 2 + 5, m("fascia", "#c86a2a", 0.7))
    box("walkway", w, 1, 9, 0, 0.5, d / 2 + 0.5, m("walkway", "#b8b0a0", 0.95))
    for i in range(6):
        x = -w / 2 + 8 + i * 11
        box("door", 5, 11, 0.6, x, 6.5, d / 2 - 3.6, m(f"room-door-{i % 3}", ["#2f6b8a", "#8a2f3a", "#2f8a5a"][i % 3], 0.6))
        box("room-number", 1.6, 1.2, 0.3, x, 10.4, d / 2 - 3.1, m("brass", "#c9a227", 0.3, 0.8))
        box("window", 4, 4, 0.6, x + 4.6, 9, d / 2 - 3.6, lit("room-window", "#ffd89a"))
        box("ac-unit", 3, 2, 1.6, x + 4.6, 4.6, d / 2 - 2.8, m("ac", "#c8c8c4", 0.6, 0.3))
    for x in range(int(-w / 2 + 2), int(w / 2 - 1), 11):
        box("column", 1, h, 1, x, h / 2, d / 2 + 4.4, trim)
    # The office at the west end, glazed, with its VACANCY panel.
    box("office", 16, h, 12, -w / 2 - 8, h / 2, d / 2 - 10, walls)
    box("roof-office", 18, 1.6, 14, -w / 2 - 8, h + 0.8, d / 2 - 10, roof)
    box("office-glass", 12, 9, 0.5, -w / 2 - 8, 7, d / 2 - 3.8, lit("office-glass", "#fff0c8"))
    box("vacancy", 10, 2, 0.4, -w / 2 - 8, 14, d / 2 - 3.6, m("vacancy", "#000000", 0.4, emission="#40ff80", strength=1.0))
    # The tall sign out front: a pole, an arrow-shaped neon board and a starburst on top.
    post("sign-pole", 1.2, 46, w / 2 + 12, 23, d / 2 + 8, m("pole", "#3a3d44", 0.6, 0.4), vertices=10)
    box("sign-board", 2, 14, 26, w / 2 + 12, 44, d / 2 + 8, m("neon", "#000000", 0.4, emission="#ff6a3a", strength=1.0))
    box("sign-frame", 2.4, 15.4, 27.4, w / 2 + 12, 44, d / 2 + 8, m("sign-frame", "#2a6a8a", 0.6))
    prism("sign-arrow", [(-6, 0), (6, 0), (0, 8)], 2.6, w / 2 + 12, 51.6, d / 2 + 8, m("neon-yellow", "#000000", 0.4, emission="#ffd23a", strength=1.0), along="x")
    bpy.ops.mesh.primitive_ico_sphere_add(radius=2.4, subdivisions=1, location=(w / 2 + 12, -(d / 2 + 8), 62))
    bpy.context.active_object.data.materials.append(m("neon-yellow", "#000000"))


MODELS = {
    "house": house, "farmhouse": farmhouse, "barn": barn, "silo": silo, "shed": shed, "tank": tank,
    "site-cabin": site_cabin, "site-toilet": site_toilet, "crane-mast": crane_mast, "crane-jib": crane_jib, "crane-head": crane_head,
    "mall": mall, "mall-garage": mall_garage,
    "airfield": airfield, "docks": docks, "railyard": railyard, "drive-in": drive_in, "lodge": lodge, "motel": motel,
}

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
        big = name in ("mall", "mall-garage", "airfield", "docks", "railyard", "drive-in")
        kit.preview(os.path.join(preview_dir, f"place-{name}.png"), target=(0, 0, 12 if not big else 30), distance=110 if not big else 330, height=50 if not big else 160, angle=-60)

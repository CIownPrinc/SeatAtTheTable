"""Modelling in the game's own frame, so a script can use the numbers the game's code uses.

three.js is Y-up with fronts toward +Z; Blender is Z-up. Three's (x, y, z) is Blender's (x, -z, y),
and a size (w, h, d) along three's axes is Blender's (w, d, h). A turn about three's Y is the same
turn about Blender's Z. The glTF export converts back, so the model lands in the game as authored.
"""
import math

import bmesh
import bpy

import kit


def at(x, y, z):
    return (x, -z, y)


def box(name, w, h, d, x, y, z, mat, bevel=0.0, turn=0.0, tilt=0.0, roll=0.0):
    """A box of three-size (w, h, d) centred at three (x, y, z), turned about three's axes: `turn`
    about y, `tilt` about x (positive drops its +z end) and `roll` about z (positive lifts its +x
    end). Three's x is Blender's x and three's z is Blender's -y, hence the signs."""
    # kit.box bakes its location into the mesh, so build it at the origin, turn it, then move it.
    obj = kit.box(name, (w, d, h), (0, 0, 0), mat, bevel=bevel)
    obj.rotation_euler = (tilt, -roll, turn)
    obj.location = at(x, y, z)
    return obj


def post(name, r, h, x, y, z, mat, vertices=10, bevel=0.0):
    """An upright cylinder, h tall, centred at three (x, y, z)."""
    return kit.cylinder(name, r, h, at(x, y, z), mat, axis="Z", vertices=vertices, bevel=bevel)


def rod(name, r, a, b, mat, vertices=8):
    """A cylinder from three point a to three point b."""
    from mathutils import Vector
    pa, pb = Vector(at(*a)), Vector(at(*b))
    obj = kit.cylinder(name, r, (pb - pa).length, tuple((pa + pb) / 2), mat, axis="Z", vertices=vertices)
    obj.rotation_mode = "QUATERNION"
    obj.rotation_quaternion = (pb - pa).to_track_quat("Z", "Y")
    return obj


def log(name, r, length, x, y, z, mat, along="x", vertices=10):
    """A lying cylinder along three's x or z."""
    return kit.cylinder(name, r, length, at(x, y, z), mat, axis="X" if along == "x" else "Y", vertices=vertices)


def prism(name, profile, length, x, y, z, mat, along="x"):
    """A cross-section `profile` of (across, up) points extruded `length` long, centred on its
    length at three (x, y, z). Along x, `across` is three's z; along z, it is three's x."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    rings = []
    for end in (-length / 2, length / 2):
        ring = []
        for across, up in profile:
            if along == "x":
                ring.append(bm.verts.new(at(end, up, across)))
            else:
                ring.append(bm.verts.new(at(across, up, end)))
        rings.append(ring)
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[1])))
    n = len(profile)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new([rings[0][i], rings[0][j], rings[1][j], rings[1][i]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = at(x, y, z)
    bpy.context.collection.objects.link(obj)
    obj.data.materials.append(mat)
    return obj


def gable_roof(name, length, span, rise, x, y, z, roof, wall, overhang=2.0, eave=1.5, thick=1.2, along="x"):
    """A pitched roof on walls `span` deep and `length` long whose tops are at height y: the gable
    ends in the wall's material, two roof slabs with an overhang, and a ridge cap."""
    prism(f"{name}-gable", [(-span / 2, 0), (span / 2, 0), (0, rise)], length, x, y, z, wall, along=along)
    half = span / 2 + eave
    pitch = math.atan2(rise, span / 2)
    slope = half / math.cos(pitch)
    for side in (-1, 1):
        # Each slab runs from the ridge down past the wall by the eave, lifted by half its thickness.
        cx = side * half / 2
        cy = rise - (half / 2) * math.tan(pitch) + thick / 2 / math.cos(pitch)
        if along == "x":
            box(f"{name}-slab{side}", length + overhang * 2, thick, slope, x, y + cy, z + cx, roof, tilt=side * pitch)
        else:
            box(f"{name}-slab{side}", slope, thick, length + overhang * 2, x + cx, y + cy, z, roof, roll=-side * pitch)
    if along == "x":
        box(f"{name}-ridge", length + overhang * 2, thick, 2.0, x, y + rise + thick * 0.6, z, roof)
    else:
        box(f"{name}-ridge", 2.0, thick, length + overhang * 2, x, y + rise + thick * 0.6, z, roof)


def window(name, w, h, x, y, z, glass, trim, facing="z", shutter=None, sill=True):
    """A window on a wall whose face is at three z (facing +z) or x (facing +x / -x by sign of
    `facing`): a trim frame, the glass, a cross mullion, a sill, and optional shutters."""
    sign = -1 if facing.startswith("-") else 1
    axis = facing.lstrip("-")

    def put(n, pw, ph, depth, dx, dy, out, mat):
        if axis == "z":
            box(n, pw, ph, depth, x + dx, y + dy, z + sign * out, mat)
        else:
            box(n, depth, ph, pw, x + sign * out, y + dy, z + dx, mat)

    put(f"{name}-frame", w + 1.4, h + 1.4, 0.5, 0, 0, 0.25, trim)
    put(f"{name}-glass", w, h, 0.4, 0, 0, 0.45, glass)
    put(f"{name}-mullion-v", 0.5, h, 0.3, 0, 0, 0.75, trim)
    put(f"{name}-mullion-h", w, 0.5, 0.3, 0, 0, 0.75, trim)
    if sill:
        put(f"{name}-sill", w + 2.4, 0.7, 1.6, 0, -h / 2 - 0.9, 0.8, trim)
    if shutter is not None:
        for s in (-1, 1):
            put(f"{name}-shutter{s}", w * 0.38, h + 1, 0.4, s * (w / 2 + 0.7 + w * 0.19), 0, 0.3, shutter)


def lattice(name, w, h, d, x, y, z, mat, chord=0.5, brace=0.25, bays=1, along="y"):
    """A lattice frame (a crane's mast or jib): four corner chords and zig-zag bracing on each
    face, `bays` panels along its length. Centred at three (x, y, z)."""
    from itertools import product
    if along == "y":
        for sx, sz in product((-1, 1), (-1, 1)):
            box(f"{name}-chord", chord, h, chord, x + sx * (w / 2 - chord / 2), y, z + sz * (d / 2 - chord / 2), mat)
        step = h / bays
        for i in range(bays):
            y0, y1 = y - h / 2 + i * step, y - h / 2 + (i + 1) * step
            for sz in (-1, 1):
                zz = z + sz * (d / 2 - chord / 2)
                rod(f"{name}-diag", brace, (x - w / 2, y0, zz), (x + w / 2, y1, zz), mat, vertices=5)
                box(f"{name}-strut", w, brace * 2, brace * 2, x, y0, zz, mat)
            for sx in (-1, 1):
                xx = x + sx * (w / 2 - chord / 2)
                rod(f"{name}-diag", brace, (xx, y0, z - d / 2), (xx, y1, z + d / 2), mat, vertices=5)
                box(f"{name}-strut", brace * 2, brace * 2, d, xx, y0, z, mat)
    else:
        for sy, sz in product((-1, 1), (-1, 1)):
            box(f"{name}-chord", w, chord, chord, x, y + sy * (h / 2 - chord / 2), z + sz * (d / 2 - chord / 2), mat)
        step = w / bays
        for i in range(bays):
            x0, x1 = x - w / 2 + i * step, x - w / 2 + (i + 1) * step
            for sz in (-1, 1):
                zz = z + sz * (d / 2 - chord / 2)
                rod(f"{name}-diag", brace, (x0, y - h / 2, zz), (x1, y + h / 2, zz), mat, vertices=5)
                box(f"{name}-strut", brace * 2, h, brace * 2, x0, y, zz, mat)
            for sy in (-1, 1):
                yy = y + sy * (h / 2 - chord / 2)
                rod(f"{name}-diag", brace, (x0, yy, z - d / 2), (x1, yy, z + d / 2), mat, vertices=5)

"""The hats, sculpted: drop-in shapes for the hat geometry keys in src/map/personModel.ts.

Each part is modelled about its own origin, where the code places that key's mesh inside the hat
(the hat sits on the head at 0.72 of the head's radius above its centre), so it replaces the code's
cylinder or half-sphere one for one and keeps its own colour: a crown, a brim, a band. Three's +Y is
Blender's +Z and three's front (+Z) is Blender's -Y. Imported by people.py.
"""
import math

import bmesh
import bpy


def _smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _finish(obj, mat, name):
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    return obj


def _deformed(name, mat, make, move):
    """Build a primitive with `make()`, then move each vertex with `move(x, y, z)` -> (x, y, z)."""
    make()
    obj = bpy.context.active_object
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    for v in bm.verts:
        v.co.x, v.co.y, v.co.z = move(v.co.x, v.co.y, v.co.z)
    bm.to_mesh(obj.data)
    bm.free()
    return _finish(obj, mat, name)


def _solid(obj, thickness):
    mod = obj.modifiers.new("thick", "SOLIDIFY")
    mod.thickness = thickness
    mod.offset = 0
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.modifier_apply(modifier="thick")
    return obj


def fedora_brim(mat):
    # Snap brim: turned up at the sides, dipping a little at the front and back.
    def move(x, y, z):
        r = math.hypot(x, y)
        side = abs(x) / (r or 1)
        lift = 0.8 * _smooth((r - 5.4) / 3.2) * side ** 2
        dip = -0.35 * _smooth((r - 5.4) / 3.2) * (1 - side ** 2)
        return x, y, z + lift + dip
    obj = _deformed("hat:fedora-brim", mat, lambda: bpy.ops.mesh.primitive_circle_add(vertices=48, radius=8.6, fill_type="NGON"), move)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.poke()
    bpy.ops.object.mode_set(mode="OBJECT")
    return _solid(obj, 0.5)


def fedora_band(mat):
    # A grosgrain band with a flat bow on the left side.
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=5.35, depth=1.1, end_fill_type="NOTHING")
    band = bpy.context.active_object
    bpy.ops.mesh.primitive_cube_add(size=1, location=(-5.3, 0.6, 0))
    bow = bpy.context.active_object
    bow.scale = (0.5, 1.8, 1.2)
    bpy.ops.object.transform_apply(location=True, scale=True)
    for obj in (band, bow):
        obj.select_set(True)
    bpy.context.view_layer.objects.active = band
    bpy.ops.object.join()
    return _finish(bpy.context.active_object, mat, "hat:fedora-band")


def flatcap(mat):
    # A newsboy cap: soft and full, the top pulled forward over the peak, a button on top.
    # A squashed dome, its top drawn forward over the peak.
    def move(x, y, z):
        top = _smooth((z + 0.6) / 2.8)
        return x * (1 + 0.05 * top), y - 1.4 * top, z
    def make():
        bpy.ops.mesh.primitive_uv_sphere_add(radius=6.5, segments=40, ring_count=20)
        dome = bpy.context.active_object
        dome.scale = (1, 1, 0.36)
        bpy.ops.object.transform_apply(scale=True)
        bm = bmesh.new()
        bm.from_mesh(dome.data)
        bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.7], context="VERTS")
        bm.to_mesh(dome.data)
        bm.free()
    obj = _solid(_deformed("hat:flatcap", mat, make, move), 0.3)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.45, segments=10, ring_count=6, location=(0, -1.6, 1.25))
    button = bpy.context.active_object
    for o in (obj, button):
        o.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()
    return _finish(bpy.context.active_object, mat, "hat:flatcap")


def flatcap_brim(mat):
    # The short peak, curved down at its edges.
    def move(x, y, z):
        return x, y, z - 0.35 * (x / 3.5) ** 2 - 0.3 * _smooth((-y - 0.6) / 1.2)
    obj = _deformed("hat:flatcap-brim", mat, lambda: bpy.ops.mesh.primitive_grid_add(x_subdivisions=14, y_subdivisions=6, size=1), lambda x, y, z: move(x * 7, y * 3.6, z))
    return _solid(obj, 0.5)


def cap(mat):
    # A six-panel baseball cap: a rounded crown with seams and the button on top.
    def move(x, y, z):
        around = math.atan2(x, y)
        seam = -0.12 * math.exp(-((math.sin(around * 3)) / 0.08) ** 2) * _smooth(z / 4)
        r = math.sqrt(x * x + y * y + z * z) or 1
        k = (r + seam) / r
        return x * k, y * k, z * k * 0.92
    obj = _deformed("hat:cap", mat, lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=6.5, segments=48, ring_count=24), move)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.01], context="VERTS")
    bm.to_mesh(obj.data)
    bm.free()
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.55, segments=10, ring_count=6, location=(0, 0, 6.0))
    button = bpy.context.active_object
    for o in (obj, button):
        o.select_set(True)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.join()
    return _finish(_solid(bpy.context.active_object, 0.3), mat, "hat:cap")


def cap_bill(mat):
    # The bill: a half-disc arched across, and the code tips it down a little.
    def move(x, y, z):
        return x, y, z - 0.9 * (x / 4.6) ** 2
    # A grid bent into the half-disc in front (-Y), so it has faces all the way across.
    def shape(x, y, z):
        a = (x + 0.5) * math.pi  # 0..pi round the front half.
        r = (y + 0.5) * 4.6
        bx, by = math.cos(a) * r, -math.sin(a) * r
        return move(bx, by, z)
    obj = _deformed("hat:cap-bill", mat, lambda: bpy.ops.mesh.primitive_grid_add(x_subdivisions=24, y_subdivisions=6, size=1), shape)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.remove_doubles(threshold=0.01)
    bpy.ops.object.mode_set(mode="OBJECT")
    return _finish(_solid(obj, 0.5), mat, "hat:cap-bill")


def bucket(mat):
    # The crown: tapered, with a soft rounded top.
    # Reaching down past where the brim joins, so no gap shows between them.
    obj = _deformed("hat:bucket", mat, lambda: bpy.ops.mesh.primitive_cone_add(vertices=40, radius1=6.5, radius2=5.2, depth=5.2), lambda x, y, z: (x, y, z - 0.4))
    bevel = obj.modifiers.new("round", "BEVEL")
    bevel.width = 0.9
    bevel.segments = 4
    bpy.ops.object.modifier_apply(modifier="round")
    return _finish(obj, mat, "hat:bucket")


def bucket_brim(mat):
    # The brim slopes down and out all the way round.
    def move(x, y, z):
        r = math.hypot(x, y)
        return x, y, z - 1.6 * _smooth((r - 6.2) / 2.2)
    obj = _deformed("hat:bucket-brim", mat, lambda: bpy.ops.mesh.primitive_circle_add(vertices=48, radius=8.4, fill_type="NGON"), move)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.mesh.poke()
    bpy.ops.object.mode_set(mode="OBJECT")
    return _solid(obj, 0.5)


def beanie(mat):
    # A knitted beanie: ribbed all the way up and a little slouch at the back.
    def move(x, y, z):
        around = math.atan2(x, y)
        rib = 0.12 * math.cos(around * 28)
        r = math.sqrt(x * x + y * y + z * z) or 1
        k = (r + rib) / r
        slouch = 0.8 * _smooth(z / 6.5) * _smooth(y / 6)
        return x * k, y * k + slouch, z * k * 1.04
    obj = _deformed("hat:beanie", mat, lambda: bpy.ops.mesh.primitive_uv_sphere_add(radius=6.55, segments=56, ring_count=24), move)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < -0.01], context="VERTS")
    bm.to_mesh(obj.data)
    bm.free()
    return _finish(_solid(obj, 0.3), mat, "hat:beanie")


def beanie_band(mat):
    # The turned-up cuff, ribbed.
    def move(x, y, z):
        around = math.atan2(x, y)
        r = math.hypot(x, y) or 1
        k = (r + 0.15 * math.cos(around * 28)) / r
        return x * k, y * k, z
    obj = _deformed("hat:beanie-band", mat, lambda: bpy.ops.mesh.primitive_cylinder_add(vertices=56, radius=6.7, depth=1.8, end_fill_type="NOTHING"), move)
    return obj


PARTS = {
    "hat:fedora-brim": fedora_brim, "hat:fedora-band": fedora_band,
    "hat:flatcap": flatcap, "hat:flatcap-brim": flatcap_brim,
    "hat:cap": cap, "hat:cap-bill": cap_bill,
    "hat:bucket": bucket, "hat:bucket-brim": bucket_brim,
    "hat:beanie": beanie, "hat:beanie-band": beanie_band,
}


def build(m):
    for key, make in PARTS.items():
        make(m(key))

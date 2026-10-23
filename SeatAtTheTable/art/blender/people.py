"""The person's parts, sculpted: drop-in shapes for the geometry keys in src/map/personModel.ts.

Each part is modelled in the same place and at the same size as the code's primitive for that key
(centred on the origin, three.js units), so the figure keeps its silhouette and its rig. Three's +Y
is Blender's +Z and three's front (+Z) is Blender's -Y. Every part has its own material, named after
its key with ':' written as '__', so the export keeps the parts apart and the game can find them.
Run with `-- <output dir> <preview dir>`; either may be empty.
"""
import math
import os
import sys

import bmesh
import bpy

sys.path.append(os.path.join(os.path.dirname(__file__), "lib"))
sys.path.append(os.path.dirname(__file__))
import kit  # noqa: E402
import hair  # noqa: E402
import hats  # noqa: E402
import extras  # noqa: E402

FRONT = -1  # Blender Y of the figure's front.


def part_material(key):
    return kit.material(key.replace(":", "__"), "#9a9590", roughness=0.8)


def join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.convert(target="MESH")
    if len(objs) > 1:
        bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    # Smooth over the curves, keep the creases at lapels, cuffs and soles.
    bpy.ops.object.shade_auto_smooth(angle=math.radians(40))
    return obj


def frustum(name, r_top, r_bottom, height, mat, depth_scale=0.9, verts=24, z=0.0):
    """A tapered tube centred on z, flattened front to back like a body."""
    bpy.ops.mesh.primitive_cone_add(radius1=r_bottom, radius2=r_top, depth=height, vertices=verts, location=(0, 0, z))
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = (1, depth_scale, 1)
    obj.data.materials.append(mat)
    bpy.ops.object.transform_apply(scale=True)
    return obj


def front_box(name, size, x, z, mat, depth_at, lean=0.0):
    """A thin panel standing on the front surface at the given height."""
    obj = kit.box(name, size, (x, FRONT * depth_at, z), mat)
    obj.rotation_euler = (lean, 0, 0)
    return obj


def coat(key, r_top, r_bottom, height, m, long=True):
    mat = m(key)
    pieces = [frustum(f"{key}-body", r_top, r_bottom, height, mat, depth_scale=0.92)]
    top = height / 2
    # Collar round the neck, lapels folding back either side of the opening, a seam down the front.
    bpy.ops.mesh.primitive_torus_add(major_radius=r_top * 0.62, minor_radius=0.7, location=(0, 0, top - 0.2))
    collar = bpy.context.active_object
    collar.scale = (1, 0.85, 1)
    collar.data.materials.append(mat)
    pieces.append(collar)
    for side in (-1, 1):
        lapel = kit.box(f"{key}-lapel-{side}", (1.8, 0.5, height * 0.38), (side * 1.9, FRONT * (r_top * 0.92 + 0.15), top - height * 0.22), mat)
        lapel.rotation_euler = (0, side * 0.32, 0)
        pieces.append(lapel)
        pocket_z = -height * 0.16 if long else -height * 0.24
        pieces.append(kit.box(f"{key}-pocket-{side}", (3.0, 0.4, 0.5), (side * 3.0, FRONT * ((r_top + r_bottom) / 2 * 0.92 + 0.1), pocket_z), mat))
    pieces.append(kit.box(f"{key}-seam", (0.35, 0.3, height * 0.6), (0, FRONT * ((r_top + r_bottom) / 2 * 0.92 + 0.05), -height * 0.2), mat))
    if long:
        pieces.append(kit.cylinder(f"{key}-belt", (r_top + r_bottom) / 2 * 0.97, 0.9, (0, 0, -height * 0.05), mat, axis="Z", vertices=24))
    return join(pieces, key)


def build(m):
    coat("top:longcoat", 5.5, 7.6, 18, m, long=True)
    coat("top:jacket", 5.6, 6.6, 13, m, long=False)
    # The hoodie: softer, with the kangaroo pocket across the front.
    hood_mat = m("top:hoodie")
    body = frustum("top:hoodie-body", 5.7, 6.4, 13.5, hood_mat, depth_scale=0.94)
    pocket = kit.box("top:hoodie-pocket", (6.4, 0.6, 3.4), (0, FRONT * 5.85, -3.4), hood_mat, bevel=0.3)
    join([body, pocket], "top:hoodie")

    # Sleeve with a turned-back cuff at the wrist (the arm hangs along -Z from its centre).
    arm_mat = m("arm")
    sleeve = frustum("arm-sleeve", 1.95, 1.7, 12.6, arm_mat, depth_scale=1.0, verts=14)
    cuff = kit.cylinder("arm-cuff", 1.9, 1.2, (0, 0, -6.2), arm_mat, axis="Z", vertices=14)
    shoulder = bpy.ops.mesh.primitive_uv_sphere_add(radius=1.95, segments=14, ring_count=8, location=(0, 0, 6.3))
    shoulder = bpy.context.active_object
    shoulder.data.materials.append(arm_mat)
    join([sleeve, cuff, shoulder], "arm")

    # A hand: a flattened palm with the thumb on the inside.
    hand_mat = m("hand")
    bpy.ops.mesh.primitive_uv_sphere_add(radius=2.0, segments=14, ring_count=10, location=(0, 0, 0))
    palm = bpy.context.active_object
    palm.scale = (0.78, 0.95, 1.12)
    palm.data.materials.append(hand_mat)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=0.8, segments=10, ring_count=6, location=(0, FRONT * 1.4, 0.4))
    thumb = bpy.context.active_object
    thumb.scale = (0.8, 1.3, 0.9)
    thumb.data.materials.append(hand_mat)
    join([palm, thumb], "hand")

    # Trouser leg tapering to the ankle, with a hem.
    leg_mat = m("leg")
    trouser = frustum("leg-trouser", 2.3, 2.0, 9.6, leg_mat, depth_scale=1.0, verts=14)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=2.3, segments=14, ring_count=8, location=(0, 0, 4.8))
    hip = bpy.context.active_object
    hip.data.materials.append(leg_mat)
    hem = kit.cylinder("leg-hem", 2.1, 0.8, (0, 0, -4.9), leg_mat, axis="Z", vertices=14)
    join([trouser, hip, hem], "leg")

    def shoe(key, w, h, l, toe_h, shaft=0.0):
        mat = m(key)
        # Toe at the front (-Y), heel at the back; the sole slightly proud all round.
        heel = kit.box(f"{key}-heel", (w, l * 0.45, h), (0, l * 0.27, 0), mat, bevel=0.5)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=16, ring_count=10, location=(0, FRONT * l * 0.12, -h * 0.5 + toe_h / 2))
        toe = bpy.context.active_object
        toe.scale = (w / 2, l * 0.42, toe_h / 2 + 0.4)
        toe.data.materials.append(mat)
        sole = kit.box(f"{key}-sole", (w + 0.3, l + 0.2, 0.6), (0, 0, -h / 2 + 0.3), mat, bevel=0.2)
        pieces = [heel, toe, sole]
        if shaft:
            pieces.append(kit.box(f"{key}-shaft", (w * 0.86, l * 0.5, shaft), (0, l * 0.16, -h / 2 + shaft / 2), mat, bevel=0.5))
        join(pieces, key)

    shoe("shoe", 4.6, 2.2, 7.6, 1.9)
    shoe("shoe:sneaker", 4.7, 2.2, 7.8, 2.1)
    shoe("shoe:boot", 4.8, 4.6, 7.4, 2.3, shaft=4.6)

    # The fedora's crown: a tapered crown with the pinch and the dent along the top.
    fed_mat = m("hat:fedora-crown")
    crown = frustum("fedora-crown", 4.6, 5.3, 4.8, fed_mat, depth_scale=1.0, verts=24)
    bm = bmesh.new()
    bm.from_mesh(crown.data)
    for v in bm.verts:
        if v.co.z > 2.0:
            v.co.z -= 0.9 * max(0.0, 1 - abs(v.co.x) / 4.6)
            v.co.y *= 0.82 if abs(v.co.y) > 2 and v.co.y < 0 else 1.0
    bm.to_mesh(crown.data)
    bm.free()
    join([crown], "hat:fedora-crown")

    # The hairstyles (hair.py), one sculpted part per style.
    hair.build(m)
    # The hats (hats.py), one sculpted part per hat key.
    hats.build(m)
    # Glasses, the chain and the watch (extras.py).
    extras.build(m)


out_dir, preview_dir = kit.args()
kit.reset()
kit._materials.clear()
build(part_material)
if out_dir:
    kit.export(os.path.join(out_dir, "person-parts.glb"))
if preview_dir:
    kit.preview(os.path.join(preview_dir, "person-parts.png"), target=(0, 0, 0), distance=60, height=30, angle=-70)

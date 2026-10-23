"""The accessories, sculpted: drop-in shapes for the glasses, chain and watch keys in
src/map/personModel.ts, each modelled about the origin the code places it at. Three's +Y is
Blender's +Z and three's front (+Z) is Blender's -Y. Imported by people.py.
"""
import math

import bmesh
import bpy


def _finish(obj, mat, name):
    obj.name = name
    obj.data.materials.clear()
    obj.data.materials.append(mat)
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    return obj


def _join(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    return bpy.context.active_object


def _rounded_rect(w, h, r, segments=6):
    """Points round a rounded rectangle in the x-z plane (the face of the glasses)."""
    pts = []
    for cx, cz, start in ((w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180), (w / 2 - r, -h / 2 + r, 270)):
        for i in range(segments + 1):
            a = math.radians(start + 90 * i / segments)
            pts.append((cx + math.cos(a) * r, cz + math.sin(a) * r))
    return pts


def glasses_frame(mat):
    # A rim round each lens: a rounded rectangle, a little deeper than it is wide at the bottom.
    outer, inner = _rounded_rect(3.6, 2.6, 1.0), _rounded_rect(3.0, 2.0, 0.7)
    mesh = bpy.data.meshes.new("frame")
    bm = bmesh.new()
    n = len(outer)
    for depth in (-0.25, 0.25):
        for x, z in outer + inner:
            bm.verts.new((x, depth, z))
    bm.verts.ensure_lookup_table()
    v = bm.verts
    def ring(i, j, layer):
        return layer * 2 * n + i, layer * 2 * n + j
    for i in range(n):
        j = (i + 1) % n
        o0, o1 = i, j
        i0, i1 = n + i, n + j
        for a, b, c, d in ((o0, o1, i1, i0), (2 * n + o1, 2 * n + o0, 2 * n + i0, 2 * n + i1), (o1, o0, 2 * n + o0, 2 * n + o1), (i0, i1, 2 * n + i1, 2 * n + i0)):
            bm.faces.new((v[a], v[b], v[c], v[d]))
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("frame", mesh)
    bpy.context.collection.objects.link(obj)
    return _finish(obj, mat, "glasses:frame")


def glasses_lens(mat):
    pts = _rounded_rect(3.0, 2.0, 0.7)
    mesh = bpy.data.meshes.new("lens")
    bm = bmesh.new()
    front = [bm.verts.new((x, -0.15, z)) for x, z in pts]
    back = [bm.verts.new((x, 0.15, z)) for x, z in pts]
    bm.faces.new(front)
    bm.faces.new(list(reversed(back)))
    for i in range(len(pts)):
        j = (i + 1) % len(pts)
        bm.faces.new((front[j], front[i], back[i], back[j]))
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new("lens", mesh)
    bpy.context.collection.objects.link(obj)
    return _finish(obj, mat, "glasses:lens")


def chain(mat):
    # A curb chain: forty small oval links round the neck, each turned against its neighbours.
    links = []
    count, radius = 40, 3.5
    for i in range(count):
        a = i / count * math.pi * 2
        bpy.ops.mesh.primitive_torus_add(major_radius=0.42, minor_radius=0.14, major_segments=10, minor_segments=5,
                                         location=(math.cos(a) * radius, math.sin(a) * radius, 0),
                                         rotation=(math.pi / 2 if i % 2 else 0, 0, a + math.pi / 2))
        link = bpy.context.active_object
        link.scale = (1.0, 1.6, 1.0)
        links.append(link)
    obj = _join(links)
    # Bake where the links are first, so the turn below is about the chain's centre and not about
    # the first link. The code's torus lies in three's x-y plane before it tips it onto the chest.
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.rotation_euler = (math.pi / 2, 0, 0)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return _finish(obj, mat, "chain")


def chain_pendant(mat):
    # A coin pendant with a raised rim and a bail at the top.
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=1.0, depth=0.3)
    coin = bpy.context.active_object
    bpy.ops.mesh.primitive_torus_add(major_radius=0.92, minor_radius=0.12, major_segments=28, minor_segments=6, location=(0, 0, 0.15))
    rim = bpy.context.active_object
    bpy.ops.mesh.primitive_torus_add(major_radius=0.3, minor_radius=0.09, major_segments=12, minor_segments=5, location=(0, 1.15, 0), rotation=(0, math.pi / 2, 0))
    bail = bpy.context.active_object
    obj = _join([coin, rim, bail])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return _finish(obj, mat, "chain:pendant")


def watch_face(mat):
    # The dial with a bezel round it and a crown at the side.
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=1.0, depth=0.5)
    face = bpy.context.active_object
    bpy.ops.mesh.primitive_torus_add(major_radius=1.0, minor_radius=0.16, major_segments=28, minor_segments=6, location=(0, 0, 0.25))
    bezel = bpy.context.active_object
    bpy.ops.mesh.primitive_cylinder_add(vertices=10, radius=0.16, depth=0.4, location=(1.15, 0, 0), rotation=(0, math.pi / 2, 0))
    crown = bpy.context.active_object
    obj = _join([face, bezel, crown])
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return _finish(obj, mat, "watch:face")


PARTS = {"glasses:frame": glasses_frame, "glasses:lens": glasses_lens, "chain": chain, "chain:pendant": chain_pendant, "watch:face": watch_face}


def build(m):
    for key, make in PARTS.items():
        make(m(key))

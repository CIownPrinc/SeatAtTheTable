"""Shared helpers for the game's Blender model scripts.

Runs inside Blender's own Python (bpy). Units are game units: one Blender unit is one world unit,
the player is about 38 tall and a sedan about 34 long. Vehicles face +X, matching the game's
existing car models; glTF export converts Blender's Z-up to the game's Y-up.
"""
import math
import os
import sys

import bmesh
import bpy


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


_materials = {}


def material(name, color, roughness=0.6, metallic=0.0, emission=None, strength=1.0):
    """One shared material per name, so exported models stay cheap to draw."""
    if name in _materials:
        return _materials[name]
    mat = bpy.data.materials.new(name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    rgb = tuple(int(color[i:i + 2], 16) / 255 for i in (1, 3, 5))
    # Blender colours are linear; the hex values are authored in sRGB like the rest of the game.
    linear = tuple(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4 for c in rgb)
    bsdf.inputs["Base Color"].default_value = (*linear, 1.0)
    bsdf.inputs["Roughness"].default_value = roughness
    bsdf.inputs["Metallic"].default_value = metallic
    if emission:
        erg = tuple(int(emission[i:i + 2], 16) / 255 for i in (1, 3, 5))
        bsdf.inputs["Emission Color"].default_value = (*erg, 1.0)
        bsdf.inputs["Emission Strength"].default_value = strength
    _materials[name] = mat
    return mat


def _finish(obj, mat, bevel, segments):
    obj.data.materials.append(mat)
    if bevel > 0:
        mod = obj.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = segments
        mod.limit_method = "ANGLE"
        mod.harden_normals = True
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_auto_smooth(angle=math.radians(35))
    obj.select_set(False)
    return obj


def box(name, size, location, mat, bevel=0.0, segments=2):
    """A box of size (x, y, z) centred at location, with optionally rounded edges."""
    bpy.ops.mesh.primitive_cube_add(size=1, location=location)
    obj = bpy.context.active_object
    obj.name = name
    obj.scale = size
    bpy.ops.object.transform_apply(scale=True)
    return _finish(obj, mat, bevel, segments)


def tapered_box(name, bottom, top, height, location, mat, top_offset=(0.0, 0.0), bevel=0.0, segments=2):
    """A box whose top face is (x, y) `top` while its bottom is `bottom`: cabins, roofs, hoods."""
    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()
    bx, by = bottom[0] / 2, bottom[1] / 2
    tx, ty = top[0] / 2, top[1] / 2
    ox, oy = top_offset
    verts = [
        bm.verts.new((-bx, -by, 0)), bm.verts.new((bx, -by, 0)), bm.verts.new((bx, by, 0)), bm.verts.new((-bx, by, 0)),
        bm.verts.new((-tx + ox, -ty + oy, height)), bm.verts.new((tx + ox, -ty + oy, height)),
        bm.verts.new((tx + ox, ty + oy, height)), bm.verts.new((-tx + ox, ty + oy, height)),
    ]
    for face in ((0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)):
        bm.faces.new([verts[i] for i in face])
    bm.normal_update()
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    obj.location = location
    bpy.context.collection.objects.link(obj)
    return _finish(obj, mat, bevel, segments)


def cylinder(name, radius, depth, location, mat, axis="Y", vertices=20, bevel=0.0):
    rotation = {"X": (0, math.pi / 2, 0), "Y": (math.pi / 2, 0, 0), "Z": (0, 0, 0)}[axis]
    bpy.ops.mesh.primitive_cylinder_add(radius=radius, depth=depth, vertices=vertices, location=location, rotation=rotation)
    obj = bpy.context.active_object
    obj.name = name
    return _finish(obj, mat, bevel, 2)


def wheel(name, radius, width, location, tyre, hub):
    """A tyre with a rounded shoulder and an inset hub on the outer face."""
    side = 1 if location[1] > 0 else -1
    cylinder(f"{name}-tyre", radius, width, location, tyre, vertices=24, bevel=radius * 0.18)
    hub_location = (location[0], location[1] + side * width * 0.38, location[2])
    cylinder(f"{name}-hub", radius * 0.58, width * 0.3, hub_location, hub, vertices=16, bevel=0.15)


def export(path):
    """Writes every mesh in the scene to a .glb, with modifiers applied."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=path, export_format="GLB", export_apply=True, export_yup=True, use_selection=True)
    print(f"EXPORTED {path}")


def preview(path, target=(0, 0, 6), distance=70, height=34, angle=-40):
    """A quick render to look at the model before it goes in the game."""
    scene = bpy.context.scene
    world = bpy.data.worlds.new("preview")
    world.use_nodes = True
    world.node_tree.nodes["Background"].inputs[0].default_value = (0.32, 0.36, 0.42, 1)
    world.node_tree.nodes["Background"].inputs[1].default_value = 0.9
    scene.world = world
    sun = bpy.data.objects.new("sun", bpy.data.lights.new("sun", "SUN"))
    sun.data.energy = 3.2
    sun.rotation_euler = (math.radians(50), 0, math.radians(30))
    bpy.context.collection.objects.link(sun)
    rad = math.radians(angle)
    cam = bpy.data.objects.new("camera", bpy.data.cameras.new("camera"))
    cam.location = (target[0] + math.cos(rad) * distance, target[1] + math.sin(rad) * distance, target[2] + height)
    direction = (target[0] - cam.location[0], target[1] - cam.location[1], target[2] - cam.location[2])
    cam.rotation_euler = _look_rotation(direction)
    bpy.context.collection.objects.link(cam)
    scene.camera = cam
    bpy.ops.mesh.primitive_plane_add(size=400, location=(0, 0, 0))
    bpy.context.active_object.data.materials.append(material("preview-ground", "#5d6a4a", 1.0))
    scene.render.engine = "BLENDER_EEVEE"
    scene.render.resolution_x = 900
    scene.render.resolution_y = 600
    scene.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f"PREVIEW {path}")


def _look_rotation(direction):
    x, y, z = direction
    yaw = math.atan2(y, x) - math.pi / 2
    pitch = math.atan2(z, math.hypot(x, y)) + math.pi / 2
    return (pitch, 0, yaw)


def args():
    """Arguments after `--` on the Blender command line: [glb path, preview path or '']."""
    rest = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    return (rest + ["", ""])[:2]

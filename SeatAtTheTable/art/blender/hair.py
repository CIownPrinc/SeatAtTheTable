"""The hairstyles, sculpted: one mesh per style, keyed 'hair:<style>' for src/map/personModel.ts.

Each is a shell grown off the head (a sphere of radius 6, stretched 1.06 tall, centred on the
origin), cut to a real hairline: high over the forehead, down past the temples to the tops of the
ears, low at the nape. Then each style is shaped on top: swept back, lifted at the front, parted,
grown long, curled or tied. Fine grooves run along the way the hair lies, so it reads as hair and
not as a smooth cap. Three's +Y is Blender's +Z and three's front (+Z) is Blender's -Y.
Imported by people.py, which exports them with the other person parts.
"""
import math

import bmesh
import bpy

HEAD_R = 6.0
HEAD_STRETCH = 1.06
STYLES = ("short", "slick", "buzz", "long", "curly", "quiff", "sidepart", "ponytail")


def _smooth(t):
    t = max(0.0, min(1.0, t))
    return t * t * (3 - 2 * t)


def _hairline(front, up, side):
    """How low the hair comes at this compass direction round the head (Blender z, head-relative).

    `front` is 1 facing forward, -1 at the back; `side` is how far round to the side (0 to 1).
    """
    forehead, temple, nape = 3.2, 0.2, -4.6
    if front > 0:
        # The forehead, rounding down to the temples.
        return temple + (forehead - temple) * _smooth((front - 0.35) / 0.65)
    return temple + (nape - temple) * _smooth(-front / 0.9)


def _shell(name, mat, thickness, shape, keep_below=None, res=(48, 30)):
    """A head-hugging shell cut to the hairline; `shape(x, y, z, n)` returns extra outward reach."""
    bpy.ops.mesh.primitive_uv_sphere_add(radius=HEAD_R, segments=res[0], ring_count=res[1], location=(0, 0, 0))
    obj = bpy.context.active_object
    obj.name = name
    obj.data.materials.append(mat)
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    # The cut: the ring of vertices just under the hairline is lifted onto it (so the edge follows the
    # curve instead of stepping along the mesh's rows), and everything further down goes.
    doomed, lines = [], {}
    for v in bm.verts:
        x, y, z = v.co
        horiz = math.hypot(x, y) or 1e-6
        front = -y / horiz  # +1 forward (Blender -Y).
        line = keep_below(front, x / horiz) if keep_below else _hairline(front, z, abs(x) / horiz)
        lines[v.index] = line
        if z < line - 0.9:
            doomed.append(v)
        elif z < line:
            ring = math.sqrt(max(0.0, HEAD_R ** 2 - line ** 2))
            v.co.x, v.co.y, v.co.z = x / horiz * ring, y / horiz * ring, line
    survivors = {v: lines[v.index] for v in bm.verts if v not in doomed}
    bmesh.ops.delete(bm, geom=doomed, context="VERTS")
    for v, line in survivors.items():
        x, y, z = v.co
        n = v.co.normalized()
        # Thinning out to the hairline, so the edge is a soft taper and not a ledge.
        edge = 0.25 + 0.75 * _smooth((z - line) / 1.6)
        reach = (thickness + shape(x, y, z, n)) * edge
        v.co = v.co + n * reach
        v.co.z *= HEAD_STRETCH
    bm.to_mesh(obj.data)
    bm.free()
    # A single skin, smooth-shaded: it's only ever seen from outside, over the head, and every person
    # on the street wears one, so it stays light (a few thousand triangles).
    bpy.context.view_layer.objects.active = obj
    bpy.ops.object.shade_smooth()
    return obj


def _grooves(x, y, z, n, count=34, depth=0.16):
    """Strand clumps running front to back: ridges round the head's girth."""
    around = math.atan2(x, -y)
    return depth * (0.5 + 0.5 * math.sin(around * count))


def _bump(x, y, z, cx, cy, cz, radius, height):
    d = math.sqrt((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2)
    return height * math.exp(-(d / radius) ** 2)


def short(mat):
    # Neat and full on top, close at the sides, a soft fringe.
    def shape(x, y, z, n):
        top = 0.5 * _smooth(z / HEAD_R)
        fringe = _bump(x, y, z, 0, -4.2, 3.6, 2.6, 0.5)
        return top + fringe + _grooves(x, y, z, n, 40, 0.12)
    return _shell("hair:short", mat, 0.55, shape)


def slick(mat):
    # Combed straight back, flat over the crown, gathered at the back of the head.
    def shape(x, y, z, n):
        back = 0.7 * _smooth((y + 1) / 6) * _smooth((z + 2) / 6)
        return back + _grooves(x, y, z, n, 60, 0.08) - 0.15 * _smooth(z / HEAD_R)
    return _shell("hair:slick", mat, 0.45, shape)


def buzz(mat):
    # Clipped close: almost no thickness, and a slightly higher line.
    def line(front, side):
        return _hairline(front, 0, side) + 0.4
    return _shell("hair:buzz", mat, 0.18, lambda x, y, z, n: 0.0, keep_below=line)


def quiff(mat):
    # Short at the sides, swept up and forward at the front.
    def shape(x, y, z, n):
        lift = _bump(x, y, z, 0, -3.6, 4.6, 3.0, 2.6)
        sides = -0.25 * _smooth(abs(x) / HEAD_R)
        return 0.3 * _smooth(z / HEAD_R) + lift + sides + _grooves(x, y, z, n, 48, 0.12)
    return _shell("hair:quiff", mat, 0.45, shape)


def sidepart(mat):
    # A parting on the left, the hair swept across to the right with a bit of height.
    def shape(x, y, z, n):
        part = -0.35 * math.exp(-((x + 2.0) / 0.45) ** 2) * _smooth((z - 2) / 4)
        sweep = 0.9 * _smooth((x + 2.0) / 6) * _smooth(z / HEAD_R)
        fringe = _bump(x, y, z, 1.5, -4.0, 3.8, 2.4, 0.6)
        return part + sweep + fringe + _grooves(x, y, z, n, 44, 0.1)
    return _shell("hair:sidepart", mat, 0.5, shape)


def curly(mat):
    # Full and round, made of tight curls all over.
    def shape(x, y, z, n):
        theta = math.atan2(x, -y)
        phi = math.acos(max(-1.0, min(1.0, z / HEAD_R)))
        curls = 0.55 * (0.5 + 0.5 * math.sin(theta * 9) * math.sin(phi * 9))
        return 1.0 * _smooth((z + 3) / 9) + curls
    return _shell("hair:curly", mat, 0.9, shape, res=(72, 40))


def long(mat):
    # Long: the crown as for the short cut, then a fall of hair down the back past the shoulders.
    def shape(x, y, z, n):
        return 0.35 * _smooth(z / HEAD_R) + _grooves(x, y, z, n, 50, 0.1)
    crown = _shell("hair:long-crown", mat, 0.55, shape)
    # The fall: a curved sheet behind the head, wider at the bottom, ending in a soft taper.
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=14, y_subdivisions=16, size=1, location=(0, 0, 0))
    fall = bpy.context.active_object
    fall.data.materials.append(mat)
    bm = bmesh.new()
    bm.from_mesh(fall.data)
    for v in bm.verts:
        u, t = v.co.x + 0.5, v.co.y + 0.5  # u across, t down (0 at the crown).
        across = (u - 0.5) * 2
        # Wrapped round the back of the head, narrowing a little as it falls, the ends cut in a soft U
        # (shorter at the sides), and strands running down it.
        a = across * math.pi * 0.58
        z = 3.5 - t * 15 * (1 - 0.2 * across * across)
        # Over the skull it follows the head's curve (so it grows out of the crown without a ledge);
        # below the ears it hangs straight, drifting a little back.
        ring = math.sqrt(max(0.0, HEAD_R ** 2 - max(0.0, z) ** 2)) + 0.75
        v.co.x = math.sin(a) * ring * (1 - 0.06 * t)
        v.co.y = math.cos(a) * ring * 0.92 + 0.9 * _smooth(-z / 10) + 0.22 * math.sin(u * math.pi * 18)
        v.co.z = z
    bm.to_mesh(fall.data)
    bm.free()
    # The fall is seen from the sides too, so it has some thickness.
    solid = fall.modifiers.new("thick", "SOLIDIFY")
    solid.thickness = 0.8
    bpy.context.view_layer.objects.active = fall
    bpy.ops.object.modifier_apply(modifier="thick")
    bpy.ops.object.shade_smooth()
    return _join([crown, fall], "hair:long")


def ponytail(mat):
    # Pulled back tight, tied at the back of the head, and the tail hanging from the tie.
    def shape(x, y, z, n):
        return 0.15 * _smooth(z / HEAD_R) + _grooves(x, y, z, n, 70, 0.07)
    cap = _shell("hair:ponytail-cap", mat, 0.35, shape)
    bpy.ops.mesh.primitive_torus_add(major_radius=1.25, minor_radius=0.45, major_segments=16, minor_segments=6, location=(0, HEAD_R + 0.3, 0.8), rotation=(math.pi / 2, 0, 0))
    tie = bpy.context.active_object
    tie.data.materials.append(mat)
    # The tail: a curve from the tie, out and down, thick at the root and tapering to a point.
    curve = bpy.data.curves.new("tail", "CURVE")
    curve.dimensions = "3D"
    spline = curve.splines.new("BEZIER")
    spline.bezier_points.add(2)
    points = [(0, HEAD_R + 0.8, 0.8), (0, HEAD_R + 2.6, -3.4), (0, HEAD_R + 2.0, -9.0)]
    for bp, co in zip(spline.bezier_points, points):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    curve.bevel_depth = 1.5
    curve.bevel_resolution = 2
    curve.resolution_u = 6
    spline.bezier_points[0].radius = 1.0
    spline.bezier_points[1].radius = 0.9
    spline.bezier_points[2].radius = 0.15
    tail = bpy.data.objects.new("tail", curve)
    bpy.context.collection.objects.link(tail)
    tail.data.materials.append(mat)
    bpy.context.view_layer.objects.active = tail
    tail.select_set(True)
    bpy.ops.object.convert(target="MESH")
    bpy.ops.object.shade_smooth()
    return _join([cap, tie, tail], "hair:ponytail")


def _join(objs, name):
    bpy.ops.object.select_all(action="DESELECT")
    for obj in objs:
        obj.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]
    bpy.ops.object.join()
    obj = bpy.context.active_object
    obj.name = name
    return obj


BUILDERS = {"short": short, "slick": slick, "buzz": buzz, "long": long, "curly": curly, "quiff": quiff, "sidepart": sidepart, "ponytail": ponytail}


def build(m):
    """Every style, each its own part with its own material so the export keeps them apart."""
    for style in STYLES:
        BUILDERS[style](m(f"hair:{style}"))

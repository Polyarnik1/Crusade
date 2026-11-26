"""Аватарки героев Crusade, версия 2: крупный план, детали лица, фактуры, объёмный свет.
Геометрия в единицах 0..100 общая; каждый стиль растеризует её в своём разрешении и красит по-своему."""
import colorsys
import math
import random
from collections import deque
from PIL import Image, ImageDraw, ImageFont

SH = [(0, 104), (6, 86), (25, 75), (75, 75), (94, 86), (100, 104)]


def mirror(pts):
    return [(100 - x, y) for x, y in pts]


def spikes(x0, x1, y, hs, mat):
    n = len(hs)
    w = (x1 - x0) / n
    return [(mat, 'poly', [(x0 + i * w, y), (x0 + (i + 0.5) * w, y - h), (x0 + (i + 1) * w, y)]) for i, h in enumerate(hs)]


def rays(cx, cy, rx, ry, a0, a1, step, mat, size):
    out = []
    a = a0
    while a <= a1:
        r = math.radians(a)
        out.append((mat, 'pt', (cx + math.cos(r) * rx, cy + math.sin(r) * ry, size)))
        a += step
    return out


SUBJECTS = {}

SUBJECTS['knight'] = dict(name='Рыцарь', c1='#b23b33', c2='#e8e4dc', hair='#5a3d2a', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('c1', 'poly', [(52, 18), (57, 7), (72, 1), (88, 6), (95, 14), (86, 12), (76, 8), (66, 12), (62, 20), (58, 24)]),
    ('c1:-1', 'line', [(58, 15), (68, 7), (82, 6)], 1.0),
    ('c1:-1', 'line', [(62, 19), (74, 11), (90, 11)], 1.0),
    ('c1', 'poly', SH),
    ('gold', 'rect', (45.5, 82, 54.5, 104)),
    ('gold', 'rect', (37, 88, 63, 93)),
    ('mail', 'poly', [(31, 64), (69, 64), (73, 81), (27, 81)]),
    ('steel', 'ell', (17, 85, 18, 12)),
    ('steel', 'ell', (83, 85, 18, 12)),
    ('steel:-2', 'line', [(3, 90), (17, 83), (31, 90)], 1.0),
    ('steel:-2', 'line', [(97, 90), (83, 83), (69, 90)], 1.0),
    ('steel:2', 'pt', (17, 78, 1.6)), ('steel:2', 'pt', (83, 78, 1.6)),
    ('steel', 'ell', (50, 31, 22.5, 17)),
    ('steel', 'rect', (27.5, 31, 72.5, 68)),
    ('steel', 'poly', [(27.5, 62), (72.5, 62), (76, 72), (24, 72)]),
    ('steel:1', 'rect', (48.5, 14.5, 51.5, 37)),
    ('gold', 'rect', (27.5, 36, 72.5, 39.5)),
    ('dark', 'rect', (31, 43, 69, 48.5)),
    ('gold', 'rect', (47, 48.5, 53, 69)),
    *[('dark', 'pt', (x, y, 1.6)) for x in (59, 63.5, 68) for y in (53, 57.5, 62)],
    *[('dark', 'pt', (x, y, 1.6)) for x in (41, 36.5, 32) for y in (53, 57.5, 62)],
    ('gold', 'rect', (24, 69, 76, 72.5)),
    ('eye', 'pt', (40, 45.7, 2.6)), ('eye', 'pt', (60, 45.7, 2.6)),
])

SUBJECTS['wizard'] = dict(name='Чародей', c1='#3f5fb8', c2='#e3b341', hair='#dcdce4', fur='#8a6a4a', feather='#3f5fb8', shapes=[
    ('wood', 'rect', (9, 30, 13.5, 104)),
    ('wood', 'line', [(7, 33), (5, 24), (8, 15)], 1.6),
    ('wood', 'line', [(15.5, 33), (17.5, 24), (14.5, 15)], 1.6),
    ('crystal', 'poly', [(11.3, 12), (16, 21), (11.3, 31), (6.6, 21)]),
    ('c1', 'poly', SH),
    ('c1:-2', 'poly', [(38, 75), (62, 75), (50, 104)]),
    ('gold', 'line', [(37, 75), (50, 104)], 1.8),
    ('gold', 'line', [(63, 75), (50, 104)], 1.8),
    ('skin', 'ell', (50, 49, 14.5, 16.5)),
    ('skin:-2', 'rect', (35, 38, 65, 44)),
    ('hair', 'poly', [(37.5, 42.5), (47, 41), (47, 44), (39, 45)]),
    ('hair', 'poly', mirror([(37.5, 42.5), (47, 41), (47, 44), (39, 45)])),
    ('eye', 'pt', (43.5, 46.5, 2.2)), ('eye', 'pt', (56.5, 46.5, 2.2)),
    ('skin:1', 'poly', [(50, 45), (53.5, 54), (47.5, 54)]),
    ('skin:-2', 'line', [(53.5, 48), (54.5, 54), (50, 55)], 1.0),
    ('hair', 'poly', [(34, 51), (40, 57), (50, 59), (60, 57), (66, 51), (65, 67), (58, 82), (50, 95), (42, 82), (35, 67)]),
    ('hair:1', 'poly', [(41, 57), (50, 55), (59, 57), (64, 63), (57, 60.5), (50, 59.5), (43, 60.5), (36, 63)]),
    ('dark', 'rect', (46.5, 60.5, 53.5, 62)),
    ('hair:-1', 'line', [(44, 65), (46, 82)], 0.9),
    ('hair:-1', 'line', [(50, 64), (50, 90)], 0.9),
    ('hair:-1', 'line', [(56, 65), (54, 82)], 0.9),
    ('c1', 'ell', (50, 37.5, 38, 7.5)),
    ('c1', 'poly', [(28, 37.5), (72, 37.5), (63, 18), (80, 2), (55, 11), (40, 24)]),
    ('gold', 'poly', [(29, 32), (71, 32), (72, 36.5), (28, 36.5)]),
    ('c1:-2', 'line', [(14, 39), (50, 42.5), (86, 39)], 1.2),
    ('gold', 'pt', (52, 23, 2.2)), ('gold', 'pt', (60, 15, 1.6)), ('gold:1', 'pt', (45, 28, 1.3)),
])

SUBJECTS['merchant'] = dict(name='Торговец', c1='#7f2c40', c2='#2f8a86', hair='#8a5230', fur='#9a7550', feather='#2f8a86', shapes=[
    ('c1', 'poly', SH),
    ('skin:-1', 'rect', (42.5, 60, 57.5, 71)),
    ('fur', 'poly', [(15, 84), (27, 68), (50, 73), (73, 68), (85, 84), (70, 90), (50, 83), (30, 90)]),
    ('gold', 'line', [(35, 89), (50, 95), (65, 89)], 1.3),
    ('gold', 'ell', (50, 96, 3.6, 3.6)),
    ('gold:-2', 'pt', (50, 96, 1.4)),
    ('skin', 'ell', (50, 48, 16, 17.5)),
    ('hair', 'poly', [(34.5, 40), (38, 52), (36.5, 59), (34, 50)]),
    ('hair', 'poly', mirror([(34.5, 40), (38, 52), (36.5, 59), (34, 50)])),
    ('skin:-1', 'rect', (35.5, 37, 64.5, 39.5)),
    ('hair', 'line', [(39.5, 43), (43, 40.5), (47, 41.5)], 1.3),
    ('hair', 'line', [(53, 42), (57, 41.5), (60.5, 42.5)], 1.3),
    ('white', 'rect', (40.5, 44.5, 46.5, 47)),
    ('pupil', 'rect', (43.5, 44.5, 46.5, 47)),
    ('white', 'rect', (53.5, 44.5, 59.5, 47)),
    ('pupil', 'rect', (53.5, 44.5, 56.5, 47)),
    ('skin:-1', 'line', [(51.5, 47), (53, 52.5), (49.5, 53.5)], 1.0),
    ('hair', 'poly', [(41, 57), (46, 55.5), (50, 56.2), (54, 55.5), (59, 57), (63, 55), (61.5, 59), (54, 58.3), (50, 59), (46, 58.3), (38.5, 59), (37, 55)]),
    ('dark', 'line', [(46, 60.2), (52, 60.2), (55.5, 59)], 0.9),
    ('hair', 'poly', [(47.5, 61.5), (52.5, 61.5), (51, 66.5), (49, 66.5)]),
    ('gold', 'ring', (34.5, 54, 2, 2.4)),
    ('leather', 'ell', (50, 33, 32, 7)),
    ('leather', 'poly', [(35, 33), (65, 33), (62, 13), (38, 13)]),
    ('gold', 'rect', (35.5, 27, 64.5, 30.5)),
    ('red', 'pt', (50, 28.7, 2.2)),
    ('leather:-2', 'line', [(18, 35), (50, 38.5), (82, 35)], 1.0),
    ('feather', 'poly', [(62, 30), (72, 11), (86, 0), (81, 11), (70, 27), (66, 32)]),
    ('feather:-2', 'line', [(64, 31), (83, 3)], 0.8),
])

SUBJECTS['rogue'] = dict(name='Следопыт', c1='#3e6e46', c2='#2e2b38', hair='#3e2a20', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('wood', 'line', [(73, 64), (66, 84)], 1.4),
    ('wood', 'line', [(80, 66), (73, 86)], 1.4),
    ('feather', 'poly', [(69, 64), (74, 48), (79, 50), (76, 66)]),
    ('feather', 'poly', [(76, 67), (83, 52), (88, 55), (82, 69)]),
    ('c1', 'poly', SH),
    ('c1', 'poly', [(21, 86), (23, 44), (31, 24), (42, 13), (50, 11), (58, 13), (69, 24), (77, 44), (79, 86)]),
    ('c1:-2', 'line', [(29, 42), (27, 62), (29, 84)], 1.2),
    ('c1:-2', 'line', [(71, 42), (73, 62), (71, 84)], 1.2),
    ('c1:1', 'line', [(42, 15), (35, 30)], 1.0),
    ('dark', 'ell', (50, 49, 16.5, 19.5)),
    ('skin:-1', 'ell', (50, 55, 11.5, 11.5)),
    ('c2', 'poly', [(36.5, 53), (63.5, 53), (62, 63), (56, 69.5), (44, 69.5), (38, 63)]),
    ('c2:-1', 'line', [(41, 58.5), (50, 61), (59, 58.5)], 1.0),
    ('c2:-1', 'line', [(44, 64.5), (50, 66), (56, 64.5)], 1.0),
    ('eye', 'pt', (43.5, 47.5, 2.6)), ('eye', 'pt', (56.5, 47.5, 2.6)),
    ('skin:-2', 'line', [(38, 44), (41, 51)], 0.8),
    ('leather', 'poly', [(25, 83), (31, 79), (79, 104), (69, 104)]),
    ('gold', 'rect', (45, 88.5, 50, 93)),
    ('gold', 'ell', (50, 80.5, 3.6, 3.6)),
    ('gold:-2', 'pt', (50, 80.5, 1.3)),
])

SUBJECTS['plague'] = dict(name='Чумной лекарь', c1='#2e2b38', c2='#6e4a30', hair='#2a2733', fur='#8a6a4a', feather='#2e2b38', shapes=[
    ('c1', 'poly', SH),
    ('c1', 'poly', [(27, 80), (29, 40), (71, 40), (73, 80)]),
    ('c1:1', 'poly', [(15, 88), (27, 71), (73, 71), (85, 88), (67, 81), (50, 85), (33, 81)]),
    ('leather', 'poly', [(43, 76), (57, 76), (53, 104), (47, 104)]),
    ('mask', 'ell', (47, 47, 15.5, 15.5)),
    ('mask', 'poly', [(41, 51), (58, 46), (73, 58), (89, 78), (84, 80), (67, 67), (52, 63)]),
    ('mask:-2', 'line', [(57, 53), (71, 63), (86, 77)], 0.9),
    ('mask:-1', 'line', [(52, 63), (67, 67), (84, 80)], 1.0),
    ('leather', 'rect', (31.5, 38, 63, 41.5)),
    ('gold', 'ell', (40.5, 47, 6.5, 6.5)), ('gold', 'ell', (55, 46, 6.5, 6.5)),
    ('glass', 'ell', (40.5, 47, 4.3, 4.3)), ('glass', 'ell', (55, 46, 4.3, 4.3)),
    ('eye', 'pt', (38.6, 44.9, 4.2)), ('eye', 'pt', (53.2, 44.9, 4.2)),
    ('gold', 'rect', (46.5, 45.5, 49, 47)),
    ('c1', 'ell', (50, 32.5, 37, 7)),
    ('c1', 'rect', (34, 9, 66, 32.5)),
    ('leather', 'rect', (34, 25.5, 66, 30)),
    ('gold', 'rect', (45.5, 25, 52.5, 30.5)),
    ('leather', 'rect', (47.5, 26.8, 50.5, 28.7)),
    ('c1:-2', 'line', [(14, 34), (50, 37.5), (86, 34)], 1.0),
])

SUBJECTS['priestess'] = dict(name='Слепая жрица', c1='#2e2b38', c2='#e2e0e6', hair='#3e2a20', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('gold', 'ring', (50, 37, 31, 25)),
    *rays(50, 37, 37, 30, -165, -15, 15, 'gold:-1', 1.4),
    ('c2', 'poly', SH),
    ('c2', 'poly', [(19, 92), (23, 44), (31, 24), (42, 15), (58, 15), (69, 24), (77, 44), (81, 92)]),
    ('c2:-1', 'line', [(27, 46), (25, 70), (27, 92)], 1.2),
    ('c2:-1', 'line', [(73, 46), (75, 70), (73, 92)], 1.2),
    ('c2:-2', 'line', [(35, 72), (33, 94)], 1.0),
    ('c2:-2', 'line', [(65, 72), (67, 94)], 1.0),
    ('c2:-2', 'ell', (50, 50, 16.5, 20.5)),
    ('skin', 'ell', (50, 50, 13.5, 16.5)),
    ('red', 'poly', [(35.5, 42.5), (64.5, 42.5), (65, 49), (35, 49)]),
    ('red:-1', 'line', [(37, 45.8), (63, 45.8)], 0.8),
    ('red', 'poly', [(62, 44), (70, 50), (75, 66), (70.5, 67), (66, 55), (62, 49)]),
    ('red:-1', 'line', [(43.5, 49), (43, 56)], 1.1),
    ('skin:-1', 'line', [(51, 52), (52, 55), (49.5, 55.8)], 0.9),
    ('lip', 'poly', [(46.5, 59), (53.5, 59), (52, 61), (48, 61)]),
    ('gold', 'rect', (35.5, 36.5, 64.5, 39.5)),
    ('crystal', 'pt', (50, 38, 2.4)),
    ('gold', 'line', [(41, 75), (50, 85), (59, 75)], 1.0),
    ('gold', 'poly', [(50, 83), (54.5, 88.5), (50, 96), (45.5, 88.5)]),
    ('red', 'pt', (50, 89, 1.8)),
])

SUBJECTS['necro'] = dict(name='Костяной король', c1='#6a46ae', c2='#24212e', hair='#2a2733', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('c2', 'poly', SH),
    ('c1', 'poly', [(16, 98), (21, 44), (29, 24), (41, 12), (59, 12), (71, 24), (79, 44), (84, 98), (78, 92), (73, 99), (67, 92), (33, 92), (27, 99), (22, 92)]),
    ('c1:-2', 'line', [(28, 42), (26, 66), (28, 90)], 1.2),
    ('c1:-2', 'line', [(72, 42), (74, 66), (72, 90)], 1.2),
    ('c1:1', 'line', [(41, 14), (33, 28)], 1.0),
    ('dark', 'ell', (50, 50, 19.5, 23.5)),
    ('bone', 'ell', (50, 44.5, 15, 15.5)),
    ('bone', 'poly', [(35.5, 48), (64.5, 48), (61.5, 58.5), (38.5, 58.5)]),
    ('bone', 'poly', [(40, 58.5), (60, 58.5), (58, 67), (42, 67)]),
    ('dark', 'ell', (43.5, 47, 5, 4.6)), ('dark', 'ell', (56.5, 47, 5, 4.6)),
    ('eye', 'pt', (43.5, 47, 2.2)), ('eye', 'pt', (56.5, 47, 2.2)),
    ('dark', 'poly', [(50, 51), (53, 56.5), (47, 56.5)]),
    ('dark', 'rect', (40.5, 59.5, 59.5, 61)),
    *[('bone:-2', 'line', [(x, 58), (x, 59.5)], 0.7) for x in (43.5, 47, 50.5, 54)],
    *[('bone:-2', 'line', [(x, 61), (x, 63.5)], 0.7) for x in (44.5, 48, 51.5, 55)],
    ('bone:-2', 'line', [(55, 32), (57, 37), (54.5, 41)], 0.8),
    ('gold', 'rect', (34.5, 30.5, 65.5, 34.5)),
    *spikes(34.5, 65.5, 31, [7, 11, 16, 11, 7], 'gold'),
    ('crystal', 'pt', (41.5, 32.5, 1.7)), ('red', 'pt', (50, 32.5, 2.2)), ('crystal', 'pt', (58.5, 32.5, 1.7)),
    *[('bone', 'ell', (x, 78 + abs(x - 50) * -0.12 + 3, 2.3, 2.3)) for x in (34, 39, 44, 56, 61, 66)],
    ('bone', 'ell', (50, 87, 4.5, 4.5)),
    ('dark', 'pt', (48.3, 86.5, 1.3)), ('dark', 'pt', (51.7, 86.5, 1.3)),
])

SUBJECTS['queen'] = dict(name='Северная владычица', c1='#5d8fc0', c2='#e8e4dc', hair='#2c3050', fur='#e6e8ee', feather='#5d8fc0', shapes=[
    ('c1', 'poly', SH),
    ('hair', 'poly', [(25, 94), (27, 44), (33, 26), (44, 18), (56, 18), (67, 26), (73, 44), (75, 94)]),
    ('skin:-1', 'rect', (44.5, 60, 55.5, 73)),
    ('fur', 'poly', [(13, 88), (26, 71), (50, 77), (74, 71), (87, 88), (70, 94), (50, 89), (30, 94)]),
    ('silver', 'line', [(40, 77), (50, 84), (60, 77)], 1.0),
    ('ice', 'pt', (50, 84.5, 2.2)),
    ('skin', 'ell', (50, 46.5, 14, 16)),
    ('hair', 'poly', [(36.5, 39), (50, 30), (63.5, 39), (64.5, 46), (58, 36.5), (50, 34), (42, 36.5), (35.5, 46)]),
    ('hair', 'line', [(41, 42.5), (47, 42)], 1.0),
    ('hair', 'line', [(53, 42), (59, 42.5)], 1.0),
    ('white', 'rect', (41, 44.5, 47, 47)),
    ('icepupil', 'rect', (43, 44.5, 45.5, 47)),
    ('white', 'rect', (53, 44.5, 59, 47)),
    ('icepupil', 'rect', (54.5, 44.5, 57, 47)),
    ('dark', 'line', [(40.5, 44.3), (47, 43.8)], 0.8),
    ('dark', 'line', [(53, 43.8), (59.5, 44.3)], 0.8),
    ('skin:-1', 'line', [(51, 48.5), (51.5, 51.5), (49.5, 52.3)], 0.8),
    ('lip', 'poly', [(46.5, 56.5), (53.5, 56.5), (52, 58.5), (48, 58.5)]),
    ('silver', 'rect', (36.5, 30, 63.5, 33)),
    ('ice', 'poly', [(37, 31), (39.5, 21), (42, 31)]),
    ('ice', 'poly', [(42, 31), (45.5, 14), (49, 31)]),
    ('ice', 'poly', [(46, 31), (50, 5), (54, 31)]),
    ('ice', 'poly', [(51, 31), (54.5, 14), (58, 31)]),
    ('ice', 'poly', [(58, 31), (60.5, 21), (63, 31)]),
    ('crystal', 'pt', (50, 31.5, 1.8)),
])


SUBJECTS['dwarf'] = dict(name='Дворф-воин', c1='#4f5f82', c2='#6e4a30', hair='#c4622a', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('wood', 'line', [(70, 104), (87, 26)], 3.0),
    ('steel', 'poly', [(87, 16), (99, 8), (99, 40), (87, 32)]),
    ('steel', 'poly', [(87, 16), (75, 8), (75, 40), (87, 32)]),
    ('steel:2', 'line', [(98.5, 10), (98.5, 38)], 1.0),
    ('steel:2', 'line', [(75.5, 10), (75.5, 38)], 1.0),
    ('c1', 'poly', [(0, 104), (3, 82), (22, 72), (78, 72), (97, 82), (100, 104)]),
    ('steel', 'ell', (14, 84, 16, 11)), ('steel', 'ell', (86, 84, 16, 11)),
    ('steel:-2', 'line', [(2, 89), (14, 82), (27, 89)], 1.0),
    ('skin', 'ell', (50, 51, 18, 15)),
    ('skin:-2', 'rect', (32, 43, 68, 46)),
    ('white', 'rect', (39.5, 46, 46, 48.5)), ('pupil', 'rect', (42, 46, 45, 48.5)),
    ('white', 'rect', (54, 46, 60.5, 48.5)), ('pupil', 'rect', (55, 46, 58, 48.5)),
    ('hair', 'poly', [(37, 42.5), (47, 45), (47, 46.8), (37, 45)]),
    ('hair', 'poly', mirror([(37, 42.5), (47, 45), (47, 46.8), (37, 45)])),
    ('skin:1', 'ell', (50, 53, 5.5, 5.5)),
    ('skin:-1', 'line', [(54.5, 51), (55.5, 56), (50, 58)], 1.0),
    ('hair', 'poly', [(29, 51), (36, 59), (44, 61), (50, 60), (56, 61), (64, 59), (71, 51), (73, 67), (69, 81), (62, 93), (56, 101), (50, 97), (44, 101), (38, 93), (31, 81), (27, 67)]),
    ('hair:1', 'poly', [(37, 59), (50, 57), (63, 59), (67, 65), (58, 62), (50, 61), (42, 62), (33, 65)]),
    ('hair:-1', 'line', [(42, 66), (41, 96)], 0.9), ('hair:-1', 'line', [(50, 64), (50, 94)], 0.9), ('hair:-1', 'line', [(58, 66), (59, 96)], 0.9),
    ('gold', 'rect', (37.5, 84, 45.5, 87.5)), ('gold', 'rect', (54.5, 84, 62.5, 87.5)),
    ('bone', 'poly', [(31, 36), (22, 30), (14, 17), (12, 5), (20, 13), (28, 23), (34, 30)]),
    ('bone', 'poly', mirror([(31, 36), (22, 30), (14, 17), (12, 5), (20, 13), (28, 23), (34, 30)])),
    ('steel', 'ell', (50, 34, 20.5, 12)),
    ('steel', 'rect', (29.5, 34, 70.5, 42)),
    ('steel:1', 'rect', (48.5, 22.5, 51.5, 38)),
    ('gold', 'rect', (29, 39, 71, 43)),
    *[('gold:-2', 'pt', (x, 41, 1.4)) for x in (34, 41, 59, 66)],
    ('steel', 'rect', (47.5, 41, 52.5, 53)),
])

SUBJECTS['dwarfess'] = dict(name='Дворфийка-кузнец', c1='#4a5e3c', c2='#6e4a30', hair='#b4482c', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('wood', 'line', [(19, 104), (27, 40)], 2.6),
    ('steel', 'poly', [(14, 31), (37, 29), (38, 41), (15, 43)]),
    ('steel:2', 'line', [(15, 32), (15, 42)], 1.0),
    ('c1', 'poly', [(0, 104), (4, 82), (24, 73), (76, 73), (96, 82), (100, 104)]),
    ('c2', 'poly', [(33, 76), (67, 76), (71, 104), (29, 104)]),
    ('leather:-1', 'line', [(36, 76), (40, 68)], 1.4), ('leather:-1', 'line', [(64, 76), (60, 68)], 1.4),
    ('gold', 'pt', (50, 90, 2)),
    ('hair', 'ell', (50, 25, 8.5, 6.5)),
    ('hair', 'ell', (50, 46, 22, 22)),
    ('skin:-1', 'rect', (44, 62, 56, 72)),
    ('skin', 'ell', (50, 52, 15.5, 15)),
    ('hair', 'poly', [(27, 50), (36, 50), (38, 90), (29, 92)]),
    ('hair', 'poly', mirror([(27, 50), (36, 50), (38, 90), (29, 92)])),
    *[('hair:-1', 'line', [(28, y), (37, y + 2)], 0.8) for y in (58, 65, 72, 79)],
    *[('hair:-1', 'line', [(72, y), (63, y + 2)], 0.8) for y in (58, 65, 72, 79)],
    ('gold', 'rect', (28.5, 86, 38, 90)), ('gold', 'rect', (62, 86, 71.5, 90)),
    ('hair', 'poly', [(35, 44), (50, 37), (65, 44), (63, 40), (50, 34), (37, 40)]),
    ('leather', 'rect', (28, 38, 72, 41.5)),
    ('gold', 'ell', (42.5, 39.5, 5.2, 4.6)), ('gold', 'ell', (57.5, 39.5, 5.2, 4.6)),
    ('ice', 'ell', (42.5, 39.5, 3.2, 2.8)), ('ice', 'ell', (57.5, 39.5, 3.2, 2.8)),
    ('hair', 'line', [(40, 46), (46.5, 45.5)], 1.1), ('hair', 'line', [(53.5, 45.5), (60, 46)], 1.1),
    ('white', 'rect', (40.5, 48, 46.5, 50.5)), ('pupil', 'rect', (43, 48, 46, 50.5)),
    ('white', 'rect', (53.5, 48, 59.5, 50.5)), ('pupil', 'rect', (54, 48, 57, 50.5)),
    ('blush', 'pt', (40, 55.5, 2.6)), ('blush', 'pt', (60, 55.5, 2.6)),
    ('skin:-1', 'pt', (42, 53, 1.0)), ('skin:-1', 'pt', (58, 52.5, 1.0)), ('skin:-1', 'pt', (44.5, 55, 1.0)),
    ('skin:-1', 'line', [(51, 51.5), (52.5, 55.5), (49.5, 56)], 1.0),
    ('lip', 'line', [(45.5, 59), (50, 60.5), (54.5, 59)], 1.1),
    ('dark', 'pt', (62, 51, 1.6)),
])

SUBJECTS['gnome'] = dict(name='Гном-изобретатель', c1='#b23b33', c2='#3e6e46', hair='#e2e2ea', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('steel', 'line', [(72, 104), (85, 66)], 2.6),
    ('steel', 'poly', [(80, 62), (91, 57), (92, 66), (87, 64), (85, 69)]),
    ('c2', 'poly', SH),
    *[('gold', 'pt', (50, y, 2)) for y in (84, 92, 100)],
    ('skin', 'ell', (26, 51, 5.5, 8)), ('skin', 'ell', (74, 51, 5.5, 8)),
    ('skin:-1', 'pt', (26.5, 51, 2)), ('skin:-1', 'pt', (73.5, 51, 2)),
    ('skin', 'ell', (50, 51, 17, 14.5)),
    ('hair', 'poly', [(33, 57), (41, 61), (50, 62), (59, 61), (67, 57), (65, 69), (57, 79), (50, 86), (43, 79), (35, 69)]),
    ('hair:1', 'poly', [(39, 61), (50, 60), (61, 61), (66, 65), (57, 63), (50, 63), (43, 63), (34, 65)]),
    ('hair:-1', 'line', [(46, 67), (47, 80)], 0.8), ('hair:-1', 'line', [(54, 67), (53, 80)], 0.8),
    ('blush', 'pt', (37, 56, 2.6)), ('blush', 'pt', (63, 56, 2.6)),
    ('skin:1', 'ell', (50, 56, 6.5, 5.5)),
    ('skin:2', 'pt', (48, 54, 1.6)),
    ('leather', 'rect', (28, 45, 72, 48)),
    ('gold', 'ell', (41.5, 47, 7.5, 7)), ('gold', 'ell', (58.5, 47, 7.5, 7)),
    ('white', 'ell', (41.5, 47, 5, 4.6)), ('white', 'ell', (58.5, 47, 5, 4.6)),
    ('pupil', 'ell', (42.5, 47.5, 2, 2)), ('pupil', 'ell', (57.5, 47.5, 2, 2)),
    ('white', 'pt', (41.8, 46.6, 0.9)), ('white', 'pt', (56.8, 46.6, 0.9)),
    ('c1', 'poly', [(27, 41), (73, 41), (61, 14), (40, 0), (31, 4), (44, 12), (37, 30)]),
    ('c1:-1', 'rect', (26, 36.5, 74, 41.5)),
    ('gold', 'ell', (57, 27, 4.5, 4.5)), ('c1', 'pt', (57, 27, 1.8)),
    ('c1:1', 'line', [(42, 10), (38, 26)], 1.0),
])

SUBJECTS['miner'] = dict(name='Рудокоп', c1='#6a5644', c2='#6e4a30', hair='#5c5866', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('wood', 'line', [(14, 104), (29, 44)], 2.6),
    ('steel', 'poly', [(8, 54), (20, 42), (40, 38), (24, 45), (14, 56)]),
    ('c1', 'poly', [(0, 104), (4, 82), (24, 73), (76, 73), (96, 82), (100, 104)]),
    ('leather', 'line', [(30, 76), (36, 104)], 2.0), ('leather', 'line', [(70, 76), (64, 104)], 2.0),
    ('skin', 'ell', (50, 52, 17, 14.5)),
    ('skin:-2', 'pt', (39, 56, 2.4)), ('skin:-2', 'pt', (61, 50.5, 1.8)), ('skin:-2', 'pt', (44, 44.5, 1.6)),
    ('hair', 'poly', [(35, 44.5), (46, 46), (46, 48), (36, 47)]),
    ('hair', 'poly', mirror([(35, 44.5), (46, 46), (46, 48), (36, 47)])),
    ('pupil', 'rect', (40.5, 49, 46, 50.5)), ('pupil', 'rect', (54, 49, 59.5, 50.5)),
    ('skin:1', 'ell', (50, 54.5, 5, 5)),
    ('skin:-1', 'line', [(54, 53), (55, 57), (50, 59)], 1.0),
    ('hair', 'poly', [(31, 54), (38, 60), (50, 62), (62, 60), (69, 54), (70, 68), (64, 80), (56, 88), (50, 85), (44, 88), (36, 80), (30, 68)]),
    ('hair:1', 'poly', [(38, 60), (50, 58.5), (62, 60), (66, 66), (57, 63), (50, 62.5), (43, 63), (34, 66)]),
    ('hair:-1', 'line', [(44, 68), (44, 84)], 0.8), ('hair:-1', 'line', [(56, 68), (56, 84)], 0.8),
    ('wood', 'line', [(57, 63.5), (68, 67)], 1.4),
    ('wood', 'rect', (66, 61.5, 70.5, 67.5)),
    ('flame', 'pt', (68.2, 61, 1.3)),
    ('steel', 'ell', (50, 36, 20, 10)),
    ('steel', 'ell', (50, 43, 25, 3.6)),
    ('steel:-2', 'line', [(26, 43.5), (50, 46), (74, 43.5)], 0.9),
    ('gold', 'rect', (45, 23, 55, 31)),
    ('flame', 'ell', (50, 27, 3, 2.6)),
])

SUBJECTS['elf'] = dict(name='Эльфийка-лучница', c1='#36603e', c2='#c8b070', hair='#d4d9e6', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('wood', 'line', [(80, 16), (89, 40), (89, 66), (82, 92)], 1.8),
    ('silver', 'line', [(80, 16), (82, 92)], 0.6),
    ('hair', 'poly', [(26, 98), (28, 44), (34, 26), (44, 18), (56, 18), (66, 26), (72, 44), (74, 98)]),
    ('c1', 'poly', SH),
    ('c1:1', 'poly', [(16, 90), (28, 74), (50, 80), (72, 74), (84, 90), (66, 84), (50, 88), (34, 84)]),
    ('gold', 'poly', [(50, 80), (54, 84), (50, 89), (46, 84)]),
    ('hair', 'poly', [(28, 70), (31, 76), (34, 96), (27, 98)]),
    ('hair', 'poly', mirror([(28, 70), (31, 76), (34, 96), (27, 98)])),
    ('skin:-1', 'rect', (45, 60, 55, 76)),
    ('skin', 'poly', [(37, 46), (21, 31), (26, 42), (36, 53)]),
    ('skin', 'poly', mirror([(37, 46), (21, 31), (26, 42), (36, 53)])),
    ('skin', 'ell', (50, 47, 13.5, 16)),
    ('hair', 'poly', [(36.5, 41), (44, 32), (56, 32), (63.5, 41), (60, 36.5), (50, 35), (40, 36.5)]),
    ('hair:-1', 'line', [(41, 43), (47, 42)], 0.9), ('hair:-1', 'line', [(53, 42), (59, 43)], 0.9),
    ('white', 'rect', (41, 45, 47, 47.3)), ('icepupil', 'rect', (43, 45, 45.5, 47.3)),
    ('white', 'rect', (53, 45, 59, 47.3)), ('icepupil', 'rect', (54.5, 45, 57, 47.3)),
    ('dark', 'line', [(40.5, 44.8), (47.5, 44.3)], 0.8), ('dark', 'line', [(52.5, 44.3), (59.5, 44.8)], 0.8),
    ('skin:-1', 'line', [(51, 48.5), (51.5, 52), (49.5, 52.8)], 0.8),
    ('lip', 'poly', [(46.5, 56.5), (53.5, 56.5), (52, 58.3), (48, 58.3)]),
    ('silver', 'rect', (36.5, 34, 63.5, 36.5)),
    ('crystal', 'pt', (50, 35, 1.4)),
])

SUBJECTS['orc'] = dict(name='Орк-вождь', c1='#5a3a2a', c2='#6e4a30', hair='#1e1c24', fur='#6e5440', feather='#b23b33',
    over={'skin': '#7d9a58'}, shapes=[
    ('fur', 'poly', [(0, 104), (3, 80), (24, 69), (76, 69), (97, 80), (100, 104)]),
    ('skin', 'poly', [(33, 73), (67, 73), (64, 104), (36, 104)]),
    ('leather', 'line', [(34, 74), (62, 104)], 2.2),
    ('gold', 'ell', (44, 84, 2.5, 2.5)),
    ('bone', 'poly', [(12, 74), (18, 64), (22, 74)]), ('bone', 'poly', [(78, 74), (82, 64), (88, 74)]),
    ('skin', 'poly', [(31, 46), (20, 38), (31, 54)]),
    ('skin', 'poly', mirror([(31, 46), (20, 38), (31, 54)])),
    ('gold', 'ring', (23, 45, 1.8, 2.2)),
    ('skin', 'ell', (50, 42, 17, 14)),
    ('skin', 'poly', [(32, 42), (68, 42), (71, 57), (64, 69), (50, 73), (36, 69), (29, 57)]),
    ('skin:-1', 'rect', (33.5, 42, 66.5, 45.5)),
    ('skin:-2', 'rect', (37, 45.5, 63, 47)),
    ('eye', 'pt', (42.5, 48, 2.3)), ('eye', 'pt', (57.5, 48, 2.3)),
    ('skin:-1', 'poly', [(46, 51), (54, 51), (56.5, 57), (43.5, 57)]),
    ('dark', 'pt', (46.5, 56, 1.3)), ('dark', 'pt', (53.5, 56, 1.3)),
    ('dark', 'line', [(39, 63), (61, 63)], 1.2),
    ('bone', 'poly', [(39.5, 64), (43, 64), (41.5, 55.5)]),
    ('bone', 'poly', [(57, 64), (60.5, 64), (58.5, 55.5)]),
    ('lip', 'line', [(58, 36), (61, 44), (60, 53)], 1.0),
    ('hair', 'ell', (50, 29.5, 6, 5)),
    ('hair', 'poly', [(47, 28), (53, 28), (57, 13), (50, 19)]),
    ('gold', 'rect', (46.5, 31, 53.5, 33)),
])

SUBJECTS['witch'] = dict(name='Ведьма', c1='#2b2836', c2='#44405e', hair='#9a3a2a', fur='#8a6a4a', feather='#b23b33', shapes=[
    ('hair', 'poly', [(28, 96), (30, 40), (70, 40), (72, 96), (66, 90), (62, 97), (38, 97), (34, 90)]),
    ('c1', 'poly', SH),
    ('silver', 'line', [(42, 76), (50, 84), (58, 76)], 0.9),
    ('silver', 'pt', (50, 85, 2.2)),
    ('skin:-1', 'rect', (45, 60, 55, 76)),
    ('skin', 'ell', (50, 49, 13.5, 15.5)),
    ('skin:-2', 'rect', (36.5, 38, 63.5, 42)),
    ('hair', 'line', [(40.5, 44), (47, 45)], 1.0), ('hair', 'line', [(53, 45), (59.5, 44)], 1.0),
    ('eye', 'pt', (44, 47, 2.2)), ('eye', 'pt', (56, 47, 2.2)),
    ('skin:1', 'poly', [(50, 46), (55, 56), (50.5, 56)]),
    ('skin:-1', 'line', [(54, 53), (55, 56), (51, 56.5)], 0.8),
    ('lip', 'line', [(46, 60), (51, 60.5), (55, 58.8)], 1.1),
    ('c2', 'poly', [(26, 74), (38, 88), (30, 86)]),
    ('c2', 'ell', (20, 70, 11, 8)),
    ('c2', 'ell', (14, 58, 6.5, 6)),
    ('c2:1', 'line', [(12, 70), (24, 75)], 1.0),
    ('c2:1', 'line', [(14, 74), (25, 78)], 0.9),
    ('gold', 'poly', [(8, 57), (1, 60), (8, 61)]),
    ('eye', 'pt', (12.5, 56.5, 1.5)),
    ('c1', 'ell', (50, 36, 37, 6.5)),
    ('c1', 'poly', [(32, 36), (68, 36), (62, 22), (71, 8), (82, 4), (66, 2), (56, 12), (44, 26)]),
    ('red', 'rect', (33, 30.5, 67, 34)),
    ('silver', 'rect', (47, 29.5, 53, 35)), ('red', 'rect', (48.8, 31, 51.2, 33.5)),
    ('c1:-1', 'rect', (52, 18, 58, 24)),
    ('c1:-2', 'line', [(14, 37.5), (50, 41), (86, 37.5)], 1.0),
])

SUBJECTS['vampire'] = dict(name='Граф-вампир', c1='#22202c', c2='#8e2a36', hair='#17151e', fur='#8a6a4a', feather='#b23b33',
    over={'skin': '#d6ccd6'}, shapes=[
    ('c1', 'poly', SH),
    ('c1', 'poly', [(18, 86), (22, 40), (36, 58), (38, 82)]),
    ('c1', 'poly', mirror([(18, 86), (22, 40), (36, 58), (38, 82)])),
    ('c2', 'poly', [(23, 84), (25.5, 48), (34.5, 60), (36, 80)]),
    ('c2', 'poly', mirror([(23, 84), (25.5, 48), (34.5, 60), (36, 80)])),
    ('skin:-1', 'rect', (45, 60, 55, 72)),
    ('bone', 'poly', [(41, 71), (59, 71), (55, 92), (45, 92)]),
    ('bone:-1', 'line', [(46, 76), (50, 84), (54, 76)], 0.9),
    ('gold', 'ring', (50, 77, 3, 3)), ('red', 'pt', (50, 77, 2.4)),
    ('skin', 'ell', (50, 48, 13, 17)),
    ('hair', 'poly', [(36, 46), (36.5, 34), (44, 27), (56, 27), (63.5, 34), (64, 46), (60, 37), (50, 41.5), (40, 37)]),
    ('hair', 'line', [(40, 43), (47, 45)], 1.0), ('hair', 'line', [(53, 45), (60, 43)], 1.0),
    ('skin:-1', 'rect', (39, 45.5, 61, 47)),
    ('eye', 'pt', (44, 47.5, 2.2)), ('eye', 'pt', (56, 47.5, 2.2)),
    ('skin:-1', 'line', [(38.5, 52), (42, 57)], 0.8), ('skin:-1', 'line', [(61.5, 52), (58, 57)], 0.8),
    ('skin:-1', 'line', [(51, 49), (51.5, 53.5), (49.5, 54.3)], 0.8),
    ('lip', 'rect', (45, 59, 55, 60.6)),
    ('white', 'pt', (46.5, 61.4, 1.2)), ('white', 'pt', (53.5, 61.4, 1.2)),
])

ORDER = ['knight', 'wizard', 'merchant', 'rogue', 'plague', 'priestess', 'necro', 'queen',
         'dwarf', 'dwarfess', 'gnome', 'miner', 'elf', 'orc', 'witch', 'vampire']

# ---------- материалы ----------
MATS = {
    'skin': ('#e0ad8a', 'soft'), 'bone': ('#e4d9bf', 'soft'), 'mask': ('#c9b48a', 'soft'),
    'steel': ('#9097ad', 'metal'), 'gold': ('#e3b341', 'metal'), 'silver': ('#c4cad8', 'metal'), 'ice': ('#a8daf0', 'metal'),
    'mail': ('#7d8296', 'metal'), 'leather': ('#6e4a30', 'cloth'), 'wood': ('#7a5234', 'cloth'),
    'red': ('#b8433a', 'cloth'), 'lip': ('#8e3a40', 'soft'), 'blush': ('#d98a7a', 'soft'),
    'white': ('#e8e4dc', 'flat'), 'pupil': ('#14121c', 'flat'), 'dark': ('#0c0b12', 'flat'), 'glass': ('#2a1418', 'flat'),
    'eye': (None, 'emit'), 'crystal': (None, 'emit'), 'icepupil': (None, 'emit'), 'flame': (None, 'emit'),
}
TEX = {'mail': 'mail', 'fur': 'fur', 'hair': 'hair', 'feather': 'feather'}


def mat_color(sub, base):
    if base in sub.get('over', {}):
        return sub['over'][base], MATS[base][1]
    if base in ('c1', 'c2', 'hair', 'fur', 'feather'):
        return sub[base], ('cloth' if base != 'fur' else 'soft')
    return MATS[base]


def hx(c):
    c = c.lstrip('#')
    return tuple(int(c[i:i + 2], 16) for i in (0, 2, 4))


def mix(a, b, t):
    t = max(0, min(1, t))
    return tuple(int(a[i] + (b[i] - a[i]) * t) for i in range(3))


def lum(c):
    return (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255


def ramp5(rgb, contrast=1.0, sat=1.0):
    r, g, b = [v / 255 for v in rgb]
    h, s, v = colorsys.rgb_to_hsv(r, g, b)
    out = []
    for dv, ds, dh in [(-0.42, 0.14, 0.06), (-0.22, 0.08, 0.03), (0, 0, 0), (0.14, -0.08, -0.02), (0.26, -0.2, -0.04)]:
        vv = min(1, max(0.03, v + dv * contrast))
        ss = min(1, max(0, (s + ds) * sat))
        out.append(tuple(int(x * 255) for x in colorsys.hsv_to_rgb((h + dh) % 1, ss, vv)))
    return out


BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]]


# ---------- растеризация ----------
def rasterize(shapes, N):
    names = ['bg']
    lab = Image.new('L', (N, N), 0)
    d = ImageDraw.Draw(lab)
    k = N / 100
    for mat, kind, p in shapes:
        if mat not in names:
            names.append(mat)
        i = names.index(mat)
        if kind == 'poly':
            d.polygon([(x * k, y * k) for x, y in p], fill=i)
        elif kind == 'ell':
            cx, cy, rx, ry = p
            d.ellipse([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k - 1, (cy + ry) * k - 1], fill=i)
        elif kind == 'ring':
            cx, cy, rx, ry = p
            d.ellipse([(cx - rx) * k, (cy - ry) * k, (cx + rx) * k - 1, (cy + ry) * k - 1], outline=i, width=max(1, round(N / 32)))
        elif kind == 'rect':
            x0, y0, x1, y1 = p
            X0, Y0 = round(x0 * k), round(y0 * k)
            X1, Y1 = max(X0 + 1, round(x1 * k)), max(Y0 + 1, round(y1 * k))
            d.rectangle([X0, Y0, X1 - 1, Y1 - 1], fill=i)
        elif kind == 'line':
            pts, w = p, None
            pts, w = shapes_line(p)
            d.line([(x * k, y * k) for x, y in pts], fill=i, width=max(1, round(w * k)))
        elif kind == 'pt':
            x, y, s = p
            r = max(1, round(s * k))
            X, Y = int(x * k), int(y * k)
            d.rectangle([X - (r - 1) // 2, Y - (r - 1) // 2, X + r // 2, Y + r // 2], fill=i)
    px = lab.load()
    return [[names[px[x, y]] for x in range(N)] for y in range(N)]


def shapes_line(p):
    return p


def fix_lines(shapes):
    out = []
    for s in shapes:
        if s[1] == 'line':
            out.append((s[0], 'line', (s[2], s[3])))
        else:
            out.append(s)
    return out


def base_of(m):
    return m.split(':')[0]


def off_of(m):
    return int(m.split(':')[1]) if ':' in m else 0


def analyse(grid, N):
    B = [[base_of(m) for m in row] for row in grid]
    # расстояние до края детали
    D = [[0] * N for _ in range(N)]
    q = deque()
    for y in range(N):
        for x in range(N):
            if B[y][x] == 'bg':
                continue
            edge = False
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                X, Y = x + dx, y + dy
                if not (0 <= X < N and 0 <= Y < N) or B[Y][X] != B[y][x]:
                    edge = True
            if edge:
                D[y][x] = 1
                q.append((x, y))
    while q:
        x, y = q.popleft()
        for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            X, Y = x + dx, y + dy
            if 0 <= X < N and 0 <= Y < N and B[Y][X] == B[y][x] and D[Y][X] == 0:
                D[Y][X] = D[y][x] + 1
                q.append((X, Y))
    # компоненты и диагональная проекция
    comp = [[-1] * N for _ in range(N)]
    info = []
    for y in range(N):
        for x in range(N):
            if comp[y][x] >= 0 or B[y][x] == 'bg':
                continue
            st = [(x, y)]
            comp[y][x] = len(info)
            pr = []
            while st:
                a, b = st.pop()
                pr.append(a * 0.7 + b)
                for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                    X, Y = a + dx, b + dy
                    if 0 <= X < N and 0 <= Y < N and comp[Y][X] < 0 and B[Y][X] == B[b][a]:
                        comp[Y][X] = len(info)
                        st.append((X, Y))
            info.append((min(pr), max(pr)))
    C = max(2, round(N / 15))
    H = [[(min(D[y][x], C) / C) ** 0.6 if D[y][x] else 0 for x in range(N)] for y in range(N)]
    return B, D, comp, info, H


def normal(H, B, x, y, N):
    def h(X, Y):
        if 0 <= X < N and 0 <= Y < N and B[Y][X] == B[y][x]:
            return H[Y][X]
        return 0

    gx = h(x + 1, y) - h(x - 1, y)
    gy = h(x, y + 1) - h(x, y - 1)
    nx, ny, nz = -gx * 1.3, -gy * 1.3, 1
    l = math.sqrt(nx * nx + ny * ny + nz * nz)
    return nx / l, ny / l, nz / l


def hsh(*a):
    v = 0
    for i in a:
        v = (v * 73856093) ^ (i * 19349663)
    return (v & 0xffff) / 0xffff


def value(style, B, comp, info, H, x, y, N, kind, L):
    lo, hi = info[comp[y][x]]
    t = (x * 0.7 + y - lo) / max(1.0, hi - lo)
    n = normal(H, B, x, y, N)
    l = math.sqrt(sum(c * c for c in L))
    Lx, Ly, Lz = (c / l for c in L)
    lam = n[0] * Lx + n[1] * Ly + n[2] * Lz
    if kind == 'metal':
        return 0.5 + 1.9 * (lam - Lz) + 0.75 * (0.5 - t)
    if kind == 'soft':
        return 0.6 + 0.7 * (lam - Lz) + 0.16 * (0.5 - t)
    return 0.5 + 1.1 * (lam - Lz) + 0.45 * (0.5 - t)


def level_of(v, x, y, dither):
    v += (BAYER[y % 4][x % 4] / 16 - 0.47) * dither
    for i, th in enumerate((0.16, 0.37, 0.63, 0.84)):
        if v < th:
            return i
    return 4


def tex_off(tex, x, y, sd):
    if tex == 'mail':
        return -1 if (x + (y % 2)) % 2 == 0 else 0
    if tex == 'fur':
        r = hsh(x, y // 2, sd)
        return -1 if r < 0.25 else (1 if r > 0.85 else 0)
    if tex == 'hair':
        return -1 if hsh(x, sd) < 0.3 and hsh(x, y // 4, sd) < 0.7 else 0
    if tex == 'feather':
        return -1 if (x - y) % 3 == 0 else 0
    return 0


def render(key, st, layers=False):
    sub = SUBJECTS[key]
    N = st['N']
    grid = rasterize(fix_lines(sub['shapes']), N)
    B, D, comp, info, H = analyse(grid, N)
    img = Image.new('RGB', (N, N))
    P = img.load()
    rnd = random.Random(sum(map(ord, key)))
    for y in range(N):
        for x in range(N):
            P[x, y] = st['bg'](x, y, N, sub, rnd)
    bgcopy = img.copy()
    ramps = {}
    emit = []
    sd = sum(map(ord, key))
    for y in range(N):
        for x in range(N):
            m = grid[y][x]
            b = B[y][x]
            if b == 'bg':
                continue
            col, kind = mat_color(sub, b)
            if kind == 'emit':
                P[x, y] = st['emit'][b]
                emit.append((x, y, st['emit'][b], st['glow'].get(b, 0.3), b))
                continue
            if kind == 'flat':
                P[x, y] = st['flat'](b, hx(col))
                continue
            if b not in ramps:
                ramps[b] = st['ramp'](b, hx(col), kind)
            v = value(st, B, comp, info, H, x, y, N, kind, st['L'])
            lv = level_of(v, x, y, 0 if kind == 'soft' or (b == 'gold' and st.get('smooth_gold')) else st['dither'])
            if kind == 'soft':
                lv = max(1, lv)  # на лице без глухих теней — иначе на щеке «щетина»
            lv += tex_off(TEX.get(b), x, y, sd) + off_of(m)
            lv = max(0, min(4, lv))
            P[x, y] = st['paint'](ramps[b], lv, x, y, b, kind, D[y][x], grid, N)
    # контур
    outl = []
    for y in range(N):
        for x in range(N):
            b = B[y][x]
            if b == 'bg' or MATS.get(b, (0, ''))[1] == 'emit':
                continue
            for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                X, Y = x + dx, y + dy
                nbm = B[Y][X] if 0 <= X < N and 0 <= Y < N else 'bg'
                if nbm == 'bg':
                    outl.append((x, y, 'out'))
                    break
                if st.get('lead') and nbm != b and (dx, dy) in ((1, 0), (0, 1)) and MATS.get(nbm, (0, ''))[1] not in ('emit',) \
                        and MATS.get(b, (0, ''))[1] not in ('flat',) and MATS.get(nbm, (0, ''))[1] not in ('flat',):
                    outl.append((x, y, 'in'))
                    break
    for x, y, k in outl:
        P[x, y] = st['outline'](P[x, y], B[y][x], k, ramps, x, y, N)
    if st.get('post'):
        st['post'](P, B, N)
    # свечение
    R = max(2.2, N / 17)
    for x, y, c, g, _k in emit:
        ri = int(R) + 1
        for dy in range(-ri, ri + 1):
            for dx in range(-ri, ri + 1):
                X, Y = x + dx, y + dy
                if 0 <= X < N and 0 <= Y < N and MATS.get(B[Y][X], (0, ''))[1] != 'emit':
                    r = math.hypot(dx, dy)
                    if 0 < r <= R:
                        P[X, Y] = mix(P[X, Y], c, g * (1 - r / (R + 0.6)) ** 1.5)
    if not layers:
        return img
    # два слоя: фон (с ореолом свечения) и фигура с прозрачностью — фигура может «дышать» над неподвижным фоном
    fig = Image.new('RGBA', (N, N), (0, 0, 0, 0))
    bgl = img.copy()
    FP, BP = fig.load(), bgl.load()
    BC = bgcopy.load()
    for y in range(N):
        for x in range(N):
            if B[y][x] != 'bg':
                FP[x, y] = P[x, y] + (255,)
                BP[x, y] = BC[x, y]
    em = [(x, y, '#%02x%02x%02x' % tuple(c), {'eye': 'e', 'icepupil': 'e', 'crystal': 'c', 'flame': 'f'}[k]) for x, y, c, g, k in emit]
    return bgl, fig, em
    return img


# ================= стили =================
def std_paint(r, lv, *a):
    return r[lv]


# --- I. Гравюра: монохром «тушь и серебро», штриховка в полутонах ---
def eng_ramp(b, rgb, kind):
    l = lum(rgb)
    if b in ('skin', 'bone', 'mask', 'white', 'fur') or (b == 'c2' and l > 0.75):
        mid = 0.68 + (l - 0.7) * 0.4
    elif kind == 'metal':
        mid = 0.52 + (l - 0.5) * 0.4
    else:
        mid = 0.26 + l * 0.28
    out = []
    for d in (-0.30, -0.15, 0, 0.13, 0.25):
        v = max(0.04, min(0.97, mid + d))
        out.append((int(v * 232), int(v * 240), int(min(255, v * 262))))
    return out


def eng_paint(r, lv, x, y, b, kind, d, grid, N):
    if lv == 1 and (x + y) % 3 == 0:
        return r[0]
    return r[lv]


def eng_bg(x, y, N, sub, rnd):
    r = math.hypot(x - N * 0.5, y - N * 0.45) / N
    base = mix((30, 33, 50), (10, 11, 18), min(1, r / 0.62))
    if 0.43 < r < 0.455:
        base = (44, 48, 70)
    return base


ENGRAVE = dict(
    title='I. Гравюра', sub='тушь и серебро, штрих в полутонах, 48 px', N=48,
    L=(-0.6, -0.7, 0.55), dither=0.0, ramp=eng_ramp, paint=eng_paint, bg=eng_bg,
    flat=lambda b, c: (10, 10, 16) if b in ('dark', 'pupil', 'glass') else (236, 240, 248),
    emit={'eye': (236, 248, 255), 'crystal': (220, 236, 255), 'icepupil': (190, 230, 255), 'flame': (255, 250, 230)},
    glow={'eye': 0.6, 'crystal': 0.45, 'icepupil': 0.2, 'flame': 0.6},
    outline=lambda c, b, k, ramps, *a: (8, 8, 14),
)


# --- II. Витраж: насыщенный цвет, свинцовые швы, крупный пиксель ---
def glass_ramp(b, rgb, kind):
    r = ramp5(rgb, contrast=0.9, sat=1.15)
    return r


def glass_paint(r, lv, *a):
    return r[(1, 1, 2, 3, 3)[lv]]


def glass_bg(x, y, N, sub, rnd):
    seeds = getattr(glass_bg, 'seeds', None)
    key = id(sub)
    if seeds is None or seeds[0] != key:
        rr = random.Random(sum(map(ord, sub['name'])))
        pts = [(rr.random() * N, rr.random() * N) for _ in range(9)]
        cols = []
        base = hx(sub['c1'])
        alt = hx('#e3b341') if lum(base) < 0.5 else hx('#3f5fb8')
        for i in range(9):
            c = mix(base if i % 3 else alt, (12, 10, 18), 0.5 + rr.random() * 0.2)
            cols.append(c)
        glass_bg.seeds = (key, pts, cols)
        seeds = glass_bg.seeds
    _, pts, cols = seeds
    ds = sorted(((x - px) ** 2 + (y - py) ** 2, i) for i, (px, py) in enumerate(pts))
    if math.sqrt(ds[1][0]) - math.sqrt(ds[0][0]) < 0.9:
        return (8, 7, 12)
    c = cols[ds[0][1]]
    if (x + y) % 5 == 0:
        c = mix(c, (255, 255, 255), 0.06)
    return c


GLASS = dict(
    title='II. Витраж', sub='насыщенный цвет и свинцовые швы, 32 px', N=32,
    L=(-0.6, -0.7, 0.55), dither=0.0, ramp=glass_ramp, paint=glass_paint, bg=glass_bg,
    flat=lambda b, c: (8, 7, 12) if b in ('dark', 'pupil') else c,
    emit={'eye': (255, 236, 150), 'crystal': (140, 230, 255), 'icepupil': (160, 230, 255), 'flame': (255, 200, 90)},
    glow={'eye': 0.5, 'crystal': 0.45, 'icepupil': 0.15, 'flame': 0.6},
    outline=lambda c, b, k, ramps, *a: (8, 7, 12), lead=True,
)


# --- III. Пепел и золото: силуэт во тьме, золотой контровой свет справа ---
ASH_DARK = [(8, 7, 11), (13, 12, 18), (19, 17, 26), (28, 25, 36), (40, 35, 48)]
ASH_FACE = [(26, 17, 18), (46, 30, 26), (82, 52, 34), (150, 104, 52), (236, 184, 100)]
ASH_GOLD = [(52, 36, 14), (100, 72, 26), (163, 122, 34), (227, 179, 65), (250, 218, 130)]
ASH_STEEL = [(14, 14, 20), (22, 23, 33), (36, 38, 54), (72, 74, 96), (150, 150, 170)]


def ash_ramp(b, rgb, kind):
    if b in ('skin', 'bone', 'mask', 'lip'):
        return ASH_FACE
    if b == 'gold':
        return ASH_GOLD
    if kind == 'metal':
        return ASH_STEEL
    if b in ('white', 'c2') and lum(rgb) > 0.7 or b == 'fur' and lum(rgb) > 0.7:
        return [(14, 13, 18), (24, 22, 30), (36, 33, 44), (60, 54, 66), (110, 96, 96)]
    return ASH_DARK


def ash_paint(r, lv, x, y, b, kind, d, grid, N):
    # справа — край силуэта ловит золото
    def isbg(X, Y):
        return not (0 <= X < N and 0 <= Y < N) or grid[Y][X] == 'bg'
    if isbg(x + 1, y):
        return (240, 192, 90) if r in (ASH_FACE, ASH_GOLD) else (222, 160, 58)
    if isbg(x + 2, y):
        return (130, 88, 36)
    if isbg(x, y - 1) and x > N * 0.45:
        return (156, 110, 44)
    if r is ASH_DARK or r is ASH_STEEL:
        return r[max(0, min(4, lv - 1))]
    return r[lv]


def ash_bg(x, y, N, sub, rnd):
    t = y / N
    c = mix((8, 7, 11), (58, 22, 14), max(0, t - 0.4) * 1.7)
    r = math.hypot(x - N * 0.62, y - N * 0.38) / N
    c = mix(c, (40, 26, 18), max(0, 0.32 - r))
    if rnd.random() < 0.02 and y > N * 0.25:
        c = (230, 130, 50) if rnd.random() < 0.4 else (120, 56, 24)
    return c


ASH = dict(
    title='III. Пепел и золото', sub='силуэт и контровой свет, 48 px', N=48,
    L=(0.75, -0.35, 0.55), dither=0.06, ramp=ash_ramp, paint=ash_paint, bg=ash_bg,
    flat=lambda b, c: (5, 4, 8) if b in ('dark', 'pupil') else ((34, 12, 8) if b == 'glass' else (90, 70, 50)), smooth_gold=True,
    emit={'eye': (255, 168, 56), 'crystal': (255, 200, 110), 'icepupil': (255, 190, 100), 'flame': (255, 196, 90)},
    glow={'eye': 0.65, 'crystal': 0.5, 'icepupil': 0.25, 'flame': 0.6},
    outline=lambda c, b, k, ramps, *a: c if c[0] > 150 else (4, 3, 6),
)


# --- IV. Кровавая луна: холодный цвет, дизеринг, красный контровой от луны ---
def moon_ramp(b, rgb, kind):
    k = 0.2 if b in ('skin', 'bone', 'mask', 'lip', 'red', 'gold') else (0.28 if b == 'hair' else 0.42)
    return ramp5(mix(rgb, (60, 64, 118), k), contrast=1.05)


def moon_post(P, B, N):
    for y in range(N):
        for x in range(N):
            if B[y][x] == 'bg' or MATS.get(B[y][x], (0, ''))[1] == 'emit':
                continue
            if x > N * 0.45 and y < N * 0.8:
                r = x + 1 < N and B[y][x + 1] == 'bg'
                u = y > 0 and B[y - 1][x] == 'bg'
                if r or u:
                    P[x, y] = mix(P[x, y], (240, 112, 92), 0.75)
                elif (x + 2 < N and B[y][x + 2] == 'bg'):
                    P[x, y] = mix(P[x, y], (200, 80, 80), 0.35)


def moon_outline(c, b, k, ramps, x, y, N):
    if k == 'out':
        return (16, 9, 28)
    return c


def moon_bg(x, y, N, sub, rnd):
    t = y / N
    sky = mix((16, 11, 30), (54, 18, 40), t)
    if hsh(x, y, 7) < 0.02 and y < N * 0.65:
        sky = mix(sky, (220, 210, 235), 0.6)
    mx, my, mr = N * 0.72, N * 0.27, N * 0.25
    r = math.hypot(x - mx, y - my)
    if r < mr:
        c = (190, 74, 64)
        for cx, cy, cr in ((-0.07, 0.06, 0.06), (0.09, -0.08, 0.045), (0.02, 0.12, 0.03)):
            if math.hypot(x - mx - cx * N, y - my - cy * N) < cr * N:
                c = (156, 54, 52)
        if r > mr - 1.3:
            c = (232, 132, 108)
        return c
    if r < mr + 3:
        return mix(sky, (190, 74, 64), 0.4 * (1 - (r - mr) / 3) if (x + y) % 2 == 0 else 0.15)
    return sky


MOON = dict(
    title='IV. Кровавая луна', sub='холодный цвет, дизеринг, свет луны, 48 px', N=48,
    L=(-0.55, -0.7, 0.55), dither=0.12, ramp=moon_ramp, paint=std_paint, bg=moon_bg,
    flat=lambda b, c: (14, 8, 24) if b in ('dark', 'pupil') else ((50, 12, 18) if b == 'glass' else mix(c, (200, 205, 230), 0.3)),
    emit={'eye': (255, 70, 54), 'crystal': (150, 232, 255), 'icepupil': (170, 236, 255), 'flame': (255, 196, 110)},
    glow={'eye': 0.6, 'crystal': 0.45, 'icepupil': 0.2, 'flame': 0.6},
    outline=moon_outline, post=moon_post,
)


# --- V. Зимняя гравюра: синий штрих, снегопад, снег на шляпах и плечах ---
def win_ramp(b, rgb, kind):
    l = lum(rgb)
    if b in ('skin', 'bone', 'mask', 'white', 'fur', 'lip', 'blush') or (b == 'c2' and l > 0.75):
        mid = 0.66 + (l - 0.7) * 0.35
    elif kind == 'metal':
        mid = 0.52 + (l - 0.5) * 0.4
    else:
        mid = 0.22 + l * 0.25
    ink, paper = (10, 16, 36), (236, 244, 255)
    out = []
    for d in (-0.30, -0.15, 0, 0.13, 0.25):
        v = max(0.03, min(0.98, mid + d))
        c = mix(ink, paper, v)
        out.append(mix(c, (70, 110, 170), 0.18 * (1 - abs(v - 0.5) * 2)))
    return out


def win_bg(x, y, N, sub, rnd):
    c = mix((16, 26, 52), (6, 9, 20), y / N)
    r = math.hypot(x - N * 0.5, y - N * 0.42) / N
    c = mix(c, (34, 50, 86), max(0, 0.34 - r) * 1.3)
    h = hsh(x, y, 11)
    if h < 0.035:
        c = (226, 236, 252) if h < 0.015 else mix(c, (200, 216, 240), 0.55)
    return c


def win_post(P, B, N):
    def isbg(X, Y):
        return not (0 <= X < N and 0 <= Y < N) or B[Y][X] == 'bg'

    def top(X, Y):
        return not isbg(X, Y) and isbg(X, Y - 1) and MATS.get(B[Y][X], (0, ''))[1] != 'emit'
    for y in range(3, N):
        x = 0
        while x < N:
            if not top(x, y):
                x += 1
                continue
            x0 = x
            while x < N and top(x, y):
                x += 1
            if x - x0 >= 4:  # снег держится только на ровном
                for xx in range(x0, x):
                    P[xx, y] = (244, 248, 255)
                    if y + 1 < N and not isbg(xx, y + 1) and hsh(xx, y, 5) < 0.6 and x0 < xx < x - 1:
                        P[xx, y + 1] = (206, 222, 244)


WINTER = dict(
    title='V. Зимняя гравюра', sub='синий штрих, снегопад и снег на плечах, 48 px', N=48,
    L=(-0.6, -0.7, 0.55), dither=0.0, ramp=win_ramp, paint=eng_paint, bg=win_bg,
    flat=lambda b, c: (6, 10, 24) if b in ('dark', 'pupil') else ((30, 40, 70) if b == 'glass' else (240, 246, 255)),
    emit={'eye': (170, 236, 255), 'crystal': (190, 240, 255), 'icepupil': (170, 236, 255), 'flame': (255, 226, 170)},
    glow={'eye': 0.6, 'crystal': 0.5, 'icepupil': 0.25, 'flame': 0.6},
    outline=lambda c, b, k, ramps, *a: (5, 8, 20) if k == 'out' else c, post=win_post,
)

STYLES = [ENGRAVE, GLASS, ASH, MOON, WINTER]

# ================= лист =================
FONT = ImageFont.truetype('/home/claude/avatars/tiny5-cyrillic.ttf', 26)
FONT_L = ImageFont.truetype('/home/claude/avatars/tiny5-latin.ttf', 26)
SANS = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
CARD, GAP, COLS, PAD = 192, 16, 4, 24
W = PAD * 2 + COLS * CARD + (COLS - 1) * GAP


def title(d, xy, s, fill):
    x, y = xy
    for ch in s:
        f = FONT if ('а' <= ch.lower() <= 'я' or ch == 'ё') else FONT_L
        d.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch)


def sheet(styles, path, keys=ORDER):
    rows = (len(keys) + COLS - 1) // COLS
    block = 70 + rows * (CARD + 40) + 20
    S = Image.new('RGB', (W, PAD + len(styles) * block), (11, 10, 16))
    d = ImageDraw.Draw(S)
    y = PAD
    for st in styles:
        title(d, (PAD, y), st['title'], (227, 179, 65))
        d.text((PAD, y + 34), st['sub'], font=SANS, fill=(167, 159, 138))
        y += 70
        for i, k in enumerate(keys):
            cx = PAD + (i % COLS) * (CARD + GAP)
            cy = y + (i // COLS) * (CARD + 40)
            im = render(k, st)
            sc = CARD // st['N']
            big = im.resize((st['N'] * sc, st['N'] * sc), Image.NEAREST)
            d.rectangle([cx - 6, cy - 6, cx + CARD + 5, cy + CARD + 9], fill=(8, 7, 12))
            d.rectangle([cx - 4, cy - 4, cx + CARD + 3, cy + CARD + 3], fill=(58, 56, 80))
            S.paste(big, (cx + (CARD - big.width) // 2, cy + (CARD - big.height) // 2))
            d.text((cx + CARD // 2, cy + CARD + 14), SUBJECTS[k]['name'], font=SANS, fill=(232, 223, 200), anchor='mt')
        y += rows * (CARD + 40) + 20
    S.save(path)


if __name__ == '__main__':
    import sys
    which = sys.argv[1] if len(sys.argv) > 1 else 'all'
    if which == 'all':
        sheet(STYLES, '/home/claude/avatars/v2-all.png')
        for i, st in enumerate(STYLES, 1):
            sheet([st], f'/home/claude/avatars/v2-set{i}.png')
    else:
        sheet([STYLES[int(which) - 1]], f'/home/claude/avatars/v2-set{which}.png')
    print('ok')

"""Bygger en fristående index.html av Design-skissen (Main.dc.html).

Körs: python3 bygg.py <sökväg till Main.dc.html> <mapp med nedladdade bilder>
Mallen renderas i webbläsaren av en liten egen renderare (render.js) + morphdom.
"""
import os, re, shutil, sys

HIT = os.path.dirname(os.path.abspath(__file__))
src, blobdir = sys.argv[1], sys.argv[2]
s = open(src, encoding='utf-8').read()

helmet = s[s.index('<helmet>') + len('<helmet>'):s.index('</helmet>')]
mall = s[s.index('</helmet>') + len('</helmet>'):s.index('<script type="text/x-dc"')]
a = s.index('data-dc-script')
a = s.index('>', a) + 1
logik = s[a:s.index('</script>', a)]

# bilder
os.makedirs(os.path.join(HIT, 'bilder'), exist_ok=True)
filer = {f.split('.')[0]: f for f in os.listdir(blobdir)}
def byt(m):
    bid = m.group(1)
    f = filer[bid]
    shutil.copy(os.path.join(blobdir, f), os.path.join(HIT, 'bilder', f))
    return 'bilder/' + f
helmet = re.sub(r'/_blob/([0-9a-f]{32})', byt, helmet)
mall = re.sub(r'/_blob/([0-9a-f]{32})', byt, mall)
logik = re.sub(r'/_blob/([0-9a-f]{32})', byt, logik)
assert '/_blob/' not in mall + logik + helmet

html = f"""<!doctype html>
<html lang="sv">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<title>Spanien Magasinet – förslag på ny startsida</title>
{helmet.strip()}
</head>
<body>
<div id="app"></div>
<template id="mall">{mall.strip()}</template>
<script src="https://cdn.jsdelivr.net/npm/morphdom@2.7.4/dist/morphdom-umd.min.js"></script>
<script src="render.js"></script>
<script>
{logik.strip()}
</script>
<script>starta(Component);</script>
</body>
</html>
"""
open(os.path.join(HIT, 'index.html'), 'w', encoding='utf-8').write(html)
print('index.html', len(html), 'tecken,', len(os.listdir(os.path.join(HIT, 'bilder'))), 'bilder')

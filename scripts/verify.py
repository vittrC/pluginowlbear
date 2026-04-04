content = open('METALG/main.js', encoding='utf-8').read()
html = open('METALG/index.html', encoding='utf-8').read()
css = open('METALG/style.css', encoding='utf-8').read()

checks = [
    ("BOSS marco",      "titulo: 'BOSS'",                               content),
    ("unlock call",     "showPatenteUnlockAnim(newPatente",              content),
    ("unlock func",     "function showPatenteUnlockAnim",               content),
    ("pName hide",      "nextMarco.patente === 4 && currentPatente < 4", content),
    ("p4 name toggle",  "name4el.textContent = (p >= 4)",               content),
    ("8th bar",         'data-index="7"',                               html),
    ("p4 name ???",     'patente-name">???',                            html),
    ("CSS overlay",     ".pu-overlay",                                  css),
    ("CSS nameIn",      "pu-nameIn",                                    css),
]
for lbl, needle, src in checks:
    print(("OK  " if needle in src else "FAIL") + f"  {lbl}")

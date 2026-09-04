import re
from pathlib import Path
html = Path('/home/ubuntu/browser_html/docs_google_com_edit_1788531371651.html').read_text()
pattern = re.compile(r'21350203,"\[\d+,0,\\"([^\\"]*)\\".*?\[0,0,\\"([^\\"]+)\\"', re.S)
seen = []
for gid, name in pattern.findall(html):
    if (gid, name) not in seen and re.search(r'20(22|23|24|25|26)', name):
        seen.append((gid, name))
print(f'total={len(seen)}')
for gid, name in seen:
    print(f'{name}\t{gid}')

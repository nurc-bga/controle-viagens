from pathlib import Path
p = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t = p.read_text()
t = t.replace('{<SortHeader', '<SortHeader')
t = t.replace('sort={recordSort} onSort={key => setRecordSort(current => nextSort(current, key))} />}</tr>', 'sort={recordSort} onSort={key => setRecordSort(current => nextSort(current, key))} /></tr>')
t = t.replace('sort={tripSort} onSort={key => setTripSort(current => nextSort(current, key))} />}</tr>', 'sort={tripSort} onSort={key => setTripSort(current => nextSort(current, key))} /></tr>')
p.write_text(t)

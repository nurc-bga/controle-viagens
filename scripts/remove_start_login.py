from pathlib import Path
p = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t = p.read_text()
old = 'onClick={() => startLogin()}'
if t.count(old) != 1:
    raise SystemExit(f'expected one OAuth reference, found {t.count(old)}')
t = t.replace(old, 'onClick={() => setVisitorMode(false)}')
p.write_text(t)

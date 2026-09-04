from pathlib import Path
p=Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t=p.read_text()
if t.count('ArrowDownUp') != 2:
    raise SystemExit(f'expected 2 references, found {t.count("ArrowDownUp")}')
t=t.replace('<ArrowDownUp className="h-6 w-6 rotate-45" />','<VehicleMark className="h-7 w-7 text-white" />')
t=t.replace('<ArrowDownUp className="h-5 w-5 rotate-45" />','<VehicleMark className="h-6 w-6 text-white" />')
p.write_text(t)

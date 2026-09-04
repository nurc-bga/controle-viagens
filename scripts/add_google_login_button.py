from pathlib import Path
p = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t = p.read_text()
needle = '<p className="text-white/65 mt-6 max-w-sm leading-relaxed">Acompanhe 52 meses de deslocamentos, frota e equipe em um só lugar.</p><form className="grid gap-3 mt-8"'
replacement = '<p className="text-white/65 mt-6 max-w-sm leading-relaxed">Acompanhe 52 meses de deslocamentos, frota e equipe em um só lugar.</p><Button type="button" onClick={() => startLogin()} size="lg" className="w-full mt-8 bg-white text-[#14283f] hover:bg-[#edf3ef] gap-2">Entrar com Google <ChevronDown className="h-4 w-4 -rotate-90" /></Button><div className="flex items-center gap-3 my-5 text-white/35 text-xs"><div className="h-px flex-1 bg-white/15" />ou senha<div className="h-px flex-1 bg-white/15" /></div><form className="grid gap-3"'
if t.count(needle) != 1:
    raise SystemExit(f'login form anchor count={t.count(needle)}')
t = t.replace(needle, replacement)
p.write_text(t)

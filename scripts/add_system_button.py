from pathlib import Path
p = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t = p.read_text()
needle = '</div>{user ? <Button variant="ghost" size="icon" onClick={logout}'
replacement = '</div>{user?.role === "admin" && <Button variant="outline" size="sm" disabled={systemMutation.isPending} onClick={() => systemMutation.mutate({ enabled: systemAccessQuery.data !== true })} className={`no-print hidden md:inline-flex gap-1.5 ${systemAccessQuery.data ? "border-[#b9d8c4] bg-[#e8f3ec] text-[#317154]" : "border-[#f0c7bd] bg-[#fff0eb] text-[#b54e3c]"}`}><Power className="h-3.5 w-3.5" />Sistema {systemAccessQuery.data ? "Ativo" : "Inativo"}</Button>}{user ? <Button variant="ghost" size="icon" onClick={logout}'
if t.count(needle) != 1:
    raise SystemExit(f'header anchor count={t.count(needle)}')
p.write_text(t.replace(needle, replacement))

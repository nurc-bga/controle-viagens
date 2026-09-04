from pathlib import Path
p = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t = p.read_text()
needle = '<td className="px-5 py-4"><div className="flex items-center gap-1"><Button type="button" variant="ghost" size="icon" title="Editar membro"'
replacement = '<td className="px-5 py-4"><div className="flex items-center gap-1"><Button type="button" variant="outline" size="sm" title={member.active !== 0 ? "Inativar usuário" : "Ativar usuário"} className={`no-print h-8 px-2 text-[11px] gap-1 ${member.active !== 0 ? "border-[#b9d8c4] bg-[#e8f3ec] text-[#317154]" : "border-[#f0c7bd] bg-[#fff0eb] text-[#b54e3c]"}`} disabled={member.id === user?.id || setActiveMutation.isPending} onClick={() => setActiveMutation.mutate({ id: member.id, active: member.active === 0 })}><span className={`h-1.5 w-1.5 rounded-full ${member.active !== 0 ? "bg-[#4f8f77]" : "bg-[#e4684d]"}`} />{member.active !== 0 ? "Ativo" : "Inativo"}</Button><Button type="button" variant="ghost" size="icon" title="Editar membro"'
if t.count(needle) != 1:
    raise SystemExit(f'actions anchor count={t.count(needle)}')
p.write_text(t.replace(needle, replacement))

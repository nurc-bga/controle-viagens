from pathlib import Path

path = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
text = path.read_text()
old = '<PrintButton label="Imprimir equipe" />'
new = '<div className="flex gap-2"><Button onClick={() => setMemberDialog(true)} className="no-print bg-[#e4684d] hover:bg-[#c9533b] text-white gap-2"><UserPlus className="h-4 w-4" />Adicionar Membro</Button><PrintButton label="Imprimir equipe" /></div>'
if old not in text:
    raise SystemExit('target not found')
path.write_text(text.replace(old, new, 1))

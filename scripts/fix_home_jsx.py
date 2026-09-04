from pathlib import Path
path = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
text = path.read_text()
needle = '</div></Card></div></div><Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardHeader className="pb-1"><CardTitle className="font-display text-lg">Destinos mais frequentes</CardTitle>'
replacement = '</div></Card></div><Card className="print-card border-0 shadow-[0_8px_24px_rgba(20,40,63,0.06)]"><CardHeader className="pb-1"><CardTitle className="font-display text-lg">Destinos mais frequentes</CardTitle>'
if text.count(needle) != 1:
    raise SystemExit(f'expected one graphics needle, found {text.count(needle)}')
path.write_text(text.replace(needle, replacement))

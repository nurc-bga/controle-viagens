from pathlib import Path
import re
p = Path('/home/ubuntu/controle-viagens/client/src/pages/Home.tsx')
t = p.read_text()
t = t.replace('  const passwordLoginMutation = trpc.auth.passwordLogin.useMutation({ onSuccess: () => { toast.success("Login realizado."); }, onError: error => toast.error(error.message) });\n', '')
t = t.replace('  const [visitorMode, setVisitorMode] = useState(false); const [loginEmail, setLoginEmail] = useState(""); const [loginPassword, setLoginPassword] = useState("");', '  const [visitorMode, setVisitorMode] = useState(false);')
pattern = re.compile(r'<div className="flex items-center gap-3 my-5 text-white/35 text-xs"><div className="h-px flex-1 bg-white/15" />ou senha<div className="h-px flex-1 bg-white/15" /></div><form className="grid gap-3".*?</form>', re.S)
t, count = pattern.subn('', t, count=1)
if count != 1:
    raise SystemExit(f'password form not found: {count}')
t = t.replace('Use o e-mail e a senha fornecidos pelo administrador.', 'Use a conta Google cadastrada pelo administrador.')
p.write_text(t)

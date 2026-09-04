const email = process.env.TEST_LOGIN_EMAIL;
const password = process.env.TEST_LOGIN_PASSWORD;
if (!email || !password) throw new Error("Informe TEST_LOGIN_EMAIL e TEST_LOGIN_PASSWORD");
const response = await fetch("http://localhost:3000/api/trpc/auth.passwordLogin?batch=1", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ "0": { json: { email, password } } }),
});
const body = await response.text();
if (!response.ok || !body.includes('"success":true')) {
  throw new Error(`Login falhou (${response.status}): ${body}`);
}
console.log(`${email}=login-ok`);
console.log(`set-cookie=${Boolean(response.headers.get("set-cookie"))}`);

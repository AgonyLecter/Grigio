// Controlla che ogni testo italiano visibile abbia una traduzione inglese.
import fs from 'node:fs';
import * as acorn from 'acorn';
const html = fs.readFileSync(new URL('../src/index.html', import.meta.url), 'utf8');
const js = html.slice(html.indexOf('<script type="module">') + 22, html.lastIndexOf('</script>'));
const ast = acorn.parse(js, { ecmaVersion: 'latest', sourceType: 'module', locations: true });
let EN = null; const skip = new Set();
const walk = (n, f, parent) => { if (!n || typeof n.type !== 'string') return; f(n, parent); for (const k in n) { const v = n[k]; if (Array.isArray(v)) v.forEach(c => walk(c, f, n)); else if (v && typeof v.type === 'string') walk(v, f, n); } };
walk(ast, (n) => {
  if (n.type === 'VariableDeclarator' && n.id.name === 'EN') { EN = new Map(n.init.properties.map(p => [p.key.value, p.value.value])); walk(n.init, m => skip.add(m)); }
  if (n.type === 'CallExpression' && n.callee.name === 'L') walk({ type: 'X', a: n.arguments }, m => skip.add(m));
});
const ignore = /^(#|rgba|\d|[a-z]+$|M5|600 |400 |\s*$)/;
const bad = [];
walk(ast, (n) => {
  if (skip.has(n)) return;
  let s = null;
  if (n.type === 'Literal' && typeof n.value === 'string') s = n.value;
  if (n.type === 'TemplateLiteral' && n.expressions.length === 0) s = n.quasis[0].value.cooked;
  if (s === null || ignore.test(s) || EN.has(s)) return;
  if (/[a-zàèéìòù]{3,}[ .!?,]|[ÀÈÉÌÒÙàèéìòù]|^[A-ZÈ' ]{4,}[.?!]?$/.test(s)) bad.push(`${n.loc.start.line}: ${s.slice(0, 110)}`);
});
// template con espressioni
walk(ast, (n) => { if (n.type === 'TemplateLiteral' && n.expressions.length && !skip.has(n)) { const t = n.quasis.map(q => q.value.cooked).join('${}'); if (/[a-zàèìòù]{4,} [a-z]/i.test(t)) bad.push(`${n.loc.start.line}: TPL ${t.slice(0, 110)}`); } });
// chiavi del dizionario che non compaiono nel sorgente (refusi)
const lits = new Set(); walk(ast, n => { if (!skip.has(n) && n.type === 'Literal' && typeof n.value === 'string') lits.add(n.value); if (!skip.has(n) && n.type === 'TemplateLiteral' && !n.expressions.length) lits.add(n.quasis[0].value.cooked); });
const unused = [...EN.keys()].filter(k => !lits.has(k));
console.log('EN entries:', EN.size, '\nUNTRANSLATED candidates:\n' + bad.join('\n') + '\n\nUNUSED keys:\n' + unused.join('\n'));

'use strict';
// 净式引擎测试 — 24 用例（移植自 Python 验证版 jingshi_v2.py，17/17 全绿 + 扩展）
import { MarkdownConverter } from './jingshi.js';

const conv = new MarkdownConverter();

const cases = [
  // [name, input, expected]
  ['inline formula', '\u516c\u5f0f $E = mc^2$ \u771f\u7f8e', '\u516c\u5f0f E = mc\u00b2 \u771f\u7f8e'],
  ['block formula', '$$\\alpha + \\beta = \\gamma$$', '\u03b1 + \u03b2 = \u03b3'],
  ['greek letters', '\\alpha \\Sigma \\omega \\Omega', '\u03b1 \u03a3 \u03c9 \u03a9'],
  ['fraction', '$\\frac{a}{b}$ \u548c $\\dfrac{x+1}{y-1}$', 'a/b \u548c x+1/y-1'],
  ['sqrt', '$\\sqrt{x}$ \u548c $\\sqrt[3]{8}$', '\u221a(x) \u548c \u221a\u00b3(8)'],
  ['sum', '$\\sum_{i=1}^{n} i^2$', '\u03a3(i=1, n) i\u00b2'],
  ['integral', '$\\int_{0}^{1} x dx$', '\u222b(0..1) x dx'],
  ['script', '$x^{12} + a_i + b^{n}$', 'x\u00b9\u00b2 + a\u1d62 + b\u207f'],
  ['script fallback', '$x^{abc}$ \u548c $y_{ij}$', 'x^{abc} \u548c y_{ij}'],
  ['symbols', '$a \\times b \\leq c$\u3001$x \\in \\mathbb{R}$', 'a \u00d7 b \u2264 c\u3001x \u2208 R'],
  ['matrix', '$\\begin{matrix}1 & 2 \\\\ 3 & 4\\end{matrix}$', '1  2\n3  4'],
  ['pmatrix', '$\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}$', 'a  b\nc  d'],
  ['bmatrix', '$\\begin{bmatrix} 1 & 2 \\\\ 3 & 4 \\end{bmatrix}$', '1  2\n3  4'],
  ['vmatrix', '$\\begin{vmatrix} x & y \\\\ z & w \\end{vmatrix}$', 'x  y\nz  w'],
  ['cases', '$\\begin{cases} x & x>0 \\\\ -x & x\\leq 0 \\end{cases}$', 'x  x>0\n-x  x≤0'],
  ['chem sub', '$H_2O$ \u548c $CO_2$', 'H\u2082O \u548c CO\u2082'],
  ['funcs', '$\\sin x + \\log y$', 'sin x + log y'],
  ['text wrap', '$\\text{\u5f53 } x \\to 0$', '\u5f53  x \u2192 0'],
  ['md mixed', '**\u91cd\u70b9**\uff1a$\\frac{1}{2}$ \u548c $\\sqrt{2}$', '\u91cd\u70b9\uff1a1/2 \u548c \u221a(2)'],
  ['code block protect', '```\n$x = 1$ \u539f\u6837\n```\n\u540e\u9762 $y=2$', '```\n$x = 1$ \u539f\u6837\n```\n\u540e\u9762 y=2'],
  ['plain no harm', '\u53d8\u91cf my_file \u548c x^2 \u6df7\u5408', '\u53d8\u91cf my_file \u548c x\u00b2 \u6df7\u5408'],
  ['cases', '$$\\begin{cases} x & x>0 \\\\ 0 & x\\leq 0 \\end{cases}$$', 'x  x>0\n0  x\u22640'],
  ['aligned', '$$\\begin{aligned} a &= b \\\\ c &= d \\end{aligned}$$', 'a = b\nc = d'],
  ['accents', '$\\bar{x} \\hat{y} \\vec{v} \\dot{x} \\tilde{z}$', 'x\u0304 y\u0302 v\u20d7 x\u0307 z\u0303'],
  ['limit', '$\\lim_{x \\to 0} \\frac{\\sin x}{x} = 1$', 'lim(x\u21920) sin x/x = 1'],
  ['binom', '$\\binom{n}{k}$', 'C(n, k)'],
  ['mhchem', '$\\ce{H2O}$ \u548c $\\ce{SO4^2-}$ \u548c $\\ce{CH3COOH}$', 'H\u2082O \u548c SO\u2084\u00b2\u207b \u548c CH\u2083COOH'],
  ['pure text', '\u4eca\u5929\u5929\u6c14\u4e0d\u9519\uff0c\u53d8\u91cf my_file \u548c\u5730\u5740 \\\\nas\\shared\\docs \u6b63\u5e38', '\u4eca\u5929\u5929\u6c14\u4e0d\u9519\uff0c\u53d8\u91cf my_file \u548c\u5730\u5740 \\\\nas\\shared\\docs \u6b63\u5e38'],
];

let ok = true;
let pass = 0;
for (let k = 0; k < cases.length; k++) {
  const name = cases[k][0];
  const inp = cases[k][1];
  const exp = cases[k][2];
  const got = conv.convert(inp);
  if (got !== exp) {
    ok = false;
    console.log('[FAIL] ' + name);
    console.log('  expected: ' + JSON.stringify(exp));
    console.log('  actual:   ' + JSON.stringify(got));
  } else {
    pass++;
    console.log('[PASS] ' + name);
  }
}
console.log('');
console.log('pass: ' + pass + '/' + cases.length);
console.log(ok ? 'ALL PASSED' : 'SOME FAILED');
process.exit(ok ? 0 : 1);

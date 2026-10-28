'use strict';

/**
 * 净式引擎 v2 — 专业符号(LaTeX/Markdown) → 聊天可读纯文本
 * 平台无关：Node / 浏览器 / HarmonyOS ArkTS 均可运行。零依赖。
 * 管线：代码块保护 → 公式定界符解析 → 公式外轻量转换 → markdown 清理 → 还原代码块
 * 移植来源：鸿蒙版 MarkdownConverter.ets（2026-08-04 v2 引擎，17/17 测试通过）
 */

class MarkdownConverter {
  constructor() {
    this.greek = new Map();
    this.symbols = new Map();
    this.funcs = new Set();
    this.sup = new Map();
    this.sub = new Map();
    this.accents = new Map();
    this.custom = new Map();
    this._initTables();
  }

  /** 设置用户自定义符号映射（\命令 -> 符号），优先于内置表 */
  setCustom(pairs) {
    this.custom.clear();
    for (let i = 0; i < pairs.length; i++) {
      this.custom.set(pairs[i][0], pairs[i][1]);
    }
  }

  _initTables() {
    const greekPairs = [
      ['\\alpha', '\u03b1'], ['\\beta', '\u03b2'], ['\\gamma', '\u03b3'], ['\\delta', '\u03b4'],
      ['\\epsilon', '\u03b5'], ['\\varepsilon', '\u03f5'], ['\\zeta', '\u03b6'], ['\\eta', '\u03b7'],
      ['\\theta', '\u03b8'], ['\\vartheta', '\u03d1'], ['\\iota', '\u03b9'], ['\\kappa', '\u03ba'],
      ['\\lambda', '\u03bb'], ['\\mu', '\u03bc'], ['\\nu', '\u03bd'], ['\\xi', '\u03be'], ['\\pi', '\u03c0'],
      ['\\rho', '\u03c1'], ['\\sigma', '\u03c3'], ['\\varsigma', '\u03c2'], ['\\tau', '\u03c4'], ['\\upsilon', '\u03c5'],
      ['\\phi', '\u03c6'], ['\\varphi', '\u03d5'], ['\\chi', '\u03c7'], ['\\psi', '\u03c8'], ['\\omega', '\u03c9'],
      ['\\Gamma', '\u0393'], ['\\Delta', '\u0394'], ['\\Theta', '\u0398'], ['\\Lambda', '\u039b'],
      ['\\Xi', '\u039e'], ['\\Pi', '\u03a0'], ['\\Sigma', '\u03a3'], ['\\Upsilon', '\u03a5'],
      ['\\Phi', '\u03a6'], ['\\Psi', '\u03a8'], ['\\Omega', '\u03a9']
    ];
    for (let i = 0; i < greekPairs.length; i++) {
      this.greek.set(greekPairs[i][0], greekPairs[i][1]);
    }

    const symbolPairs = [
      ['\\times', '\u00d7'], ['\\cdot', '\u00b7'], ['\\div', '\u00f7'], ['\\pm', '\u00b1'], ['\\mp', '\u2213'],
      ['\\ast', '*'], ['\\circ', '\u2218'], ['\\bullet', '\u2022'], ['\\oplus', '\u2295'], ['\\otimes', '\u2297'],
      ['\\leq', '\u2264'], ['\\geq', '\u2265'], ['\\neq', '\u2260'], ['\\approx', '\u2248'], ['\\equiv', '\u2261'],
      ['\\propto', '\u221d'], ['\\infty', '\u221e'], ['\\partial', '\u2202'], ['\\nabla', '\u2207'],
      ['\\forall', '\u2200'], ['\\exists', '\u2203'], ['\\in', '\u2208'], ['\\notin', '\u2209'],
      ['\\subset', '\u2282'], ['\\subseteq', '\u2286'], ['\\supset', '\u2283'], ['\\supseteq', '\u2287'],
      ['\\cup', '\u222a'], ['\\cap', '\u2229'], ['\\land', '\u2227'], ['\\lor', '\u2228'], ['\\neg', '\u00ac'],
      ['\\rightarrow', '\u2192'], ['\\Rightarrow', '\u21d2'], ['\\leftarrow', '\u2190'],
      ['\\Leftarrow', '\u21d0'], ['\\leftrightarrow', '\u2194'], ['\\mapsto', '\u21a6'], ['\\to', '\u2192'],
      ['\\therefore', '\u2234'], ['\\because', '\u2235'], ['\\sim', '~'], ['\\simeq', '\u2243'],
      ['\\cong', '\u2245'], ['\\angle', '\u2220'], ['\\perp', '\u22a5'], ['\\parallel', '\u2225'],
      ['\\Leftrightarrow', '\u21d4'], ['\\iff', '\u21d4'], ['\\implies', '\u21d2'], ['\\gets', '\u2190'],
      ['\\uparrow', '\u2191'], ['\\downarrow', '\u2193'], ['\\nearrow', '\u2197'], ['\\searrow', '\u2198'],
      ['\\emptyset', '\u2205'], ['\\varnothing', '\u2205'],
      ['\\mid', '|'], ['\\nmid', '\u2224'], ['\\vert', '|'], ['\\Vert', '\u2016'], ['\\lvert', '|'],
      ['\\rvert', '|'], ['\\lVert', '\u2016'], ['\\rVert', '\u2016'],
      ['\\ll', '\u226a'], ['\\gg', '\u226b'], ['\\leqslant', '\u2264'], ['\\geqslant', '\u2265'],
      ['\\subsetneq', '\u228a'], ['\\supsetneq', '\u228b'], ['\\setminus', '\\'], ['\\backslash', '\\'],
      ['\\oplus', '\u2295'], ['\\ominus', '\u2296'], ['\\odot', '\u2299'], ['\\infty', '\u221e'],
      ['\\aleph', '\u2135'], ['\\Re', '\u211c'], ['\\Im', '\u2111'], ['\\ell', '\u2113'],
      ['\\degree', '\u00b0'], ['\\prime', '\u2032'], ['\\hbar', '\u210f'], ['\\ldots', '\u2026'],
      ['\\cdots', '\u2026'], ['\\dots', '\u2026'], ['\\vdots', '\u22ee'], ['\\ddots', '\u22f1'],
      ['\\quad', ' '], ['\\qquad', '  '],
      ['\\;', ' '], ['\\:', ' '], ['\\ ', ' '],
      ['\\%', '%'], ['\\$', '$'], ['\\&', '&'], ['\\_', '_'], ['\\{', '{'], ['\\}', '}'],
      ['\\#', '#'], ['\\left', ''], ['\\right', '']
    ];
    for (let i = 0; i < symbolPairs.length; i++) {
      this.symbols.set(symbolPairs[i][0], symbolPairs[i][1]);
    }

    const funcList = ['\\sin', '\\cos', '\\tan', '\\cot', '\\sec', '\\csc',
      '\\log', '\\ln', '\\exp', '\\max', '\\min', '\\det', '\\arg', '\\lim',
      '\\sinh', '\\cosh', '\\tanh', '\\arcsin', '\\arccos', '\\arctan'];
    for (let i = 0; i < funcList.length; i++) {
      this.funcs.add(funcList[i]);
    }

    const supSrc = '0123456789+-=()ni';
    const supDst = '\u2070\u00b9\u00b2\u00b3\u2074\u2075\u2076\u2077\u2078\u2079\u207a\u207b\u207c\u207d\u207e\u207f\u2071';
    for (let i = 0; i < supSrc.length; i++) {
      this.sup.set(supSrc.charAt(i), supDst.charAt(i));
    }
    const supSrc2 = 'abcdefghijklmnoprstuvwxyz';
    const supDst2 = '\u1d43\u1d47\u1d9c\u1d48\u1d49\u1da0\u1d4d\u02b0\u2071\u02b2\u1d4f\u02e1\u1d50\u207f\u1d52\u1d56\u02b3\u02e2\u1d57\u1d58\u1d5b\u02b7\u02e3\u02b8\u1dbb';
    for (let i = 0; i < supSrc2.length; i++) {
      this.sup.set(supSrc2.charAt(i), supDst2.charAt(i));
    }
    const subSrc = '0123456789+-=()aeoxhklmnpstijruv';
    const subDst = '\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u208a\u208b\u208c\u208d\u208e\u2090\u2091\u2092\u2093\u2095\u2096\u2097\u2098\u2099\u209a\u209b\u209c\u1d62\u2c7c\u1d63\u1d64\u1d65';
    for (let i = 0; i < subSrc.length; i++) {
      this.sub.set(subSrc.charAt(i), subDst.charAt(i));
    }

    const accentPairs = [
      ['\\bar', '\u0304'], ['\\hat', '\u0302'], ['\\vec', '\u20d7'],
      ['\\dot', '\u0307'], ['\\ddot', '\u0308'], ['\\tilde', '\u0303'],
      ['\\overline', '\u0305'], ['\\underline', '\u0332']
    ];
    for (let i = 0; i < accentPairs.length; i++) {
      this.accents.set(accentPairs[i][0], accentPairs[i][1]);
    }
  }

  _toSup(s) {
    if (s.length === 0) {
      return null;
    }
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const u = this.sup.get(s.charAt(i));
      if (u === undefined) {
        return null;
      }
      out += u;
    }
    return out;
  }

  _toSub(s) {
    if (s.length === 0) {
      return null;
    }
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const u = this.sub.get(s.charAt(i));
      if (u === undefined) {
        return null;
      }
      out += u;
    }
    return out;
  }

  /** 上下标转换：纯数字/单字符转 Unicode，多字符字母降级保留 */
  _convertScript(body, isSup) {
    if (!body) {
      return null;
    }
    if (body.length === 1) {
      return isSup ? this._toSup(body) : this._toSub(body);
    }
    if (/^\d+$/.test(body)) {
      return isSup ? this._toSup(body) : this._toSub(body);
    }
    return null;
  }

  /** 读取 {..} 分组，返回 [内容, 结束下标] */
  _readGroup(src, i) {
    let depth = 0;
    let j = i;
    while (j < src.length) {
      const ch = src.charAt(j);
      if (ch === '{') {
        depth++;
      } else if (ch === '}') {
        depth--;
        if (depth === 0) {
          return [src.substring(i + 1, j), j + 1];
        }
      }
      j++;
    }
    return [src.substring(i + 1), src.length];
  }

  /** 读取 \sum/\int 后的 _{} / ^{} 上下限（顺序任意），返回 [sub, sup, 结束下标] */
  _readLimits(src, i) {
    let sub = null;
    let sup = null;
    let j = i;
    for (;;) {
      while (j < src.length && /\s/.test(src.charAt(j))) {
        j++;
      }
      if (j < src.length && (src.charAt(j) === '_' || src.charAt(j) === '^')) {
        const isSup = src.charAt(j) === '^';
        j++;
        let body = '';
        if (j < src.length && src.charAt(j) === '{') {
          const r = this._readGroup(src, j);
          body = r[0];
          j = r[1];
        } else {
          body = j < src.length ? src.charAt(j) : '';
          j++;
        }
        if (isSup) {
          sup = body;
        } else {
          sub = body;
        }
      } else {
        break;
      }
    }
    return [sub, sup, j];
  }

  /** 读取 \sqrt 后的 [opt] */
  _readOpt(src, i) {
    let j = i;
    while (j < src.length && /\s/.test(src.charAt(j))) {
      j++;
    }
    if (j < src.length && src.charAt(j) === '[') {
      const k = src.indexOf(']', j);
      if (k !== -1) {
        return [src.substring(j + 1, k), k + 1];
      }
    }
    return [null, i];
  }

  /** 完整 LaTeX 片段解析（公式定界符内使用） */
  latexToText(src) {
    let i = 0;
    const n = src.length;
    const out = [];
    while (i < n) {
      const ch = src.charAt(i);
      if (ch === '\\') {
        let j = i + 1;
        while (j < n && /[A-Za-z]/.test(src.charAt(j))) {
          j++;
        }
        const cmd = src.substring(i, j);
        if (cmd === '\\') {
          out.push('\n');
          i = j;
          continue;
        }
        if (cmd === '\\begin' || cmd === '\\end') {
          const rest = src.substring(j);
          const stripped = rest.replace(/^\s+/, '');
          const k = j + (rest.length - stripped.length);
          if (cmd === '\\begin') {
            const envM = /\{([a-zA-Z*]+)\}/.exec(stripped);
            const env = envM === null ? null : this._normalizeEnv(envM[1]);
            if (env !== null) {
              return this._latexEnv(src, k + envM[0].length, n, env);
            }
          }
          out.push(cmd);
          i = k;
          continue;
        }
        if (cmd === '\\frac' || cmd === '\\dfrac') {
          const a = this._readGroup(src, j);
          const b = this._readGroup(src, a[1]);
          out.push(this.latexToText(a[0]) + '/' + this.latexToText(b[0]));
          i = b[1];
          continue;
        }
        if (cmd === '\\sqrt') {
          const opt = this._readOpt(src, j);
          const body = this._readGroup(src, opt[1]);
          if (opt[0] !== null) {
            const u = this._toSup(opt[0]);
            out.push('\u221a' + (u !== null ? u : '^' + opt[0]) + '(' + this.latexToText(body[0]) + ')');
          } else {
            out.push('\u221a(' + this.latexToText(body[0]) + ')');
          }
          i = body[1];
          continue;
        }
        if (cmd === '\\sum' || cmd === '\\prod') {
          const lim = this._readLimits(src, j);
          const name = cmd === '\\sum' ? '\u03a3' : '\u03a0';
          const parts = [];
          if (lim[0] !== null) {
            parts.push(this._compactLimits(this.latexToText(lim[0])));
          }
          if (lim[1] !== null) {
            parts.push(this._compactLimits(this.latexToText(lim[1])));
          }
          out.push(name + (parts.length > 0 ? '(' + parts.join(', ') + ')' : '') + ' ');
          i = lim[2];
          continue;
        }
        if (cmd === '\\int') {
          const lim = this._readLimits(src, j);
          if (lim[0] !== null) {
            out.push('\u222b(' + this._compactLimits(this.latexToText(lim[0])) + '..' + (lim[1] !== null ? this._compactLimits(this.latexToText(lim[1])) : '') + ') ');
          } else {
            out.push('\u222b ');
          }
          i = lim[2];
          continue;
        }
        const ac = this.accents.get(cmd);
        if (ac !== undefined) {
          let i2 = j;
          while (i2 < n && /\s/.test(src.charAt(i2))) {
            i2++;
          }
          if (i2 < n && src.charAt(i2) === '{') {
            const body = this._readGroup(src, i2);
            out.push(this.latexToText(body[0]) + ac);
            i = body[1];
          } else if (i2 < n) {
            out.push(this.latexToText(src.charAt(i2)) + ac);
            i = i2 + 1;
          } else {
            i = i2;
          }
          continue;
        }
        if (cmd === '\\lim') {
          const lim = this._readLimits(src, j);
          if (lim[0] !== null) {
            out.push('lim(' + this._compactLimits(this.latexToText(lim[0])) + ') ');
          } else {
            out.push('lim ');
          }
          i = lim[2];
          continue;
        }
        if (cmd === '\\binom') {
          const a = this._readGroup(src, j);
          const b = this._readGroup(src, a[1]);
          out.push('C(' + this.latexToText(a[0]) + ', ' + this.latexToText(b[0]) + ')');
          i = b[1];
          continue;
        }
        if (cmd === '\\ce') {
          const body = this._readGroup(src, j);
          out.push(this._ceToText(body[0]));
          i = body[1];
          continue;
        }
        if (cmd === '\\text' || cmd === '\\mathrm' || cmd === '\\mathbf' || cmd === '\\mathbb' ||
          cmd === '\\boldsymbol' || cmd === '\\operatorname') {
          const body = this._readGroup(src, j);
          out.push(this.latexToText(body[0]));
          i = body[1];
          continue;
        }
        const cu = this.custom.get(cmd);
        if (cu !== undefined) {
          out.push(cu);
          i = j;
          continue;
        }
        const g = this.greek.get(cmd);
        if (g !== undefined) {
          out.push(g);
          i = j;
          continue;
        }
        const s = this.symbols.get(cmd);
        if (s !== undefined) {
          out.push(s);
          i = j;
          continue;
        }
        if (this.funcs.has(cmd)) {
          out.push(cmd.substring(1));
          i = j;
          continue;
        }
        out.push(cmd);
        i = j;
        continue;
      }
      if (ch === '^' || ch === '_') {
        const isSup = ch === '^';
        let j = i + 1;
        let body = '';
        let i2 = 0;
        if (j < n && src.charAt(j) === '{') {
          const r = this._readGroup(src, j);
          body = r[0];
          i2 = r[1];
        } else {
          body = j < n ? src.charAt(j) : '';
          i2 = j + 1;
        }
        const conv = this._convertScript(body, isSup);
        if (conv !== null) {
          out.push(conv);
        } else {
          out.push((isSup ? '^' : '_') + '{' + this.latexToText(body) + '}');
        }
        i = i2;
        continue;
      }
      if (ch === '{') {
        const r = this._readGroup(src, i);
        out.push(this.latexToText(r[0]));
        i = r[1];
        continue;
      }
      if (ch === '}') {
        i++;
        continue;
      }
      if (ch === '&') {
        out.push(' ');
        i++;
        continue;
      }
      out.push(ch);
      i++;
    }
    return out.join('');
  }

  /** 化学式 mhchem 风格：\ce{H2O} -> H2O，\ce{SO4^2-} -> SO4 2- */
  _ceToText(s) {
    const out = [];
    let i = 0;
    const n = s.length;
    while (i < n) {
      const ch = s.charAt(i);
      if (ch === '^') {
        i++;
        let body = '';
        if (i < n && s.charAt(i) === '{') {
          const r = this._readGroup(s, i);
          body = r[0];
          i = r[1];
        } else {
          body = i < n ? s.charAt(i) : '';
          i++;
        }
        const u = this._toSup(body);
        out.push(u !== null ? u : '^' + body);
        continue;
      }
      if (/[0-9]/.test(ch)) {
        let j = i;
        while (j < n && /[0-9]/.test(s.charAt(j))) {
          j++;
        }
        const num = s.substring(i, j);
        const u = this._toSub(num);
        out.push(u !== null ? u : num);
        i = j;
        continue;
      }
      if (ch === '-') {
        if (i + 1 < n && s.charAt(i + 1) === '>') {
          out.push('\u2192');
          i += 2;
        } else {
          out.push('\u207b');
          i++;
        }
        continue;
      }
      if (ch === '+') {
        out.push('\u207a');
        i++;
        continue;
      }
      out.push(ch);
      i++;
    }
    return out.join('');
  }

  /** 上下限/条件里的紧凑化：x \to 0 -> x→0；i = 1 -> i=1 */
  _compactLimits(s) {
    return s.replace(/\s*([^\w\s])\s*/g, '$1');
  }

  /**
   * 环境名归一化。返回规范名，不认识的返回 null。
   * pmatrix/bmatrix/Bmatrix/vmatrix/Vmatrix 都是 matrix 的边框变体，
   * 纯文本里边框没法表达，一律按 matrix 处理。
   */
  _normalizeEnv(name) {
    if (name === 'cases') return 'cases';
    if (name === 'aligned' || name === 'align' || name === 'align*' ||
        name === 'alignedat' || name === 'split' || name === 'gathered') {
      return 'aligned';
    }
    // matrix 家族：matrix / pmatrix / bmatrix / Bmatrix / vmatrix / Vmatrix / smallmatrix
    if (/^(small)?[pbBvV]?matrix$/.test(name)) return 'matrix';
    return null;
  }

  /** 环境解析：matrix/cases 分列，aligned/align 去对齐标记 */
  _latexEnv(src, i, n, envName) {
    const endMarker = '\\end{' + envName + '}';
    // 源文里的结束标记可能是 pmatrix/bmatrix 等变体名，逐个试
    const endCandidates = [endMarker];
    for (const v of ['pmatrix', 'bmatrix', 'Bmatrix', 'vmatrix', 'Vmatrix',
      'smallmatrix', 'align*', 'alignedat', 'split', 'gathered']) {
      endCandidates.push('\\end{' + v + '}');
    }
    let e = -1;
    let hitLen = 0;
    for (const cand of endCandidates) {
      const at = src.indexOf(cand, i);
      if (at !== -1 && (e === -1 || at < e)) {
        e = at;
        hitLen = cand.length;
      }
    }
    let body = '';
    let rest = '';
    if (e === -1) {
      body = src.substring(i);
      rest = '';
    } else {
      body = src.substring(i, e);
      rest = src.substring(e + hitLen);
    }
    const rows = [];
    const rowParts = body.split('\\\\');
    for (let r = 0; r < rowParts.length; r++) {
      if (envName === 'aligned' || envName === 'align') {
        rows.push(this.latexToText(rowParts[r].replace(/&/g, '').trim()));
      } else {
        const cells = [];
        const cellParts = rowParts[r].split('&');
        for (let c = 0; c < cellParts.length; c++) {
          let t = this.latexToText(cellParts[c].trim());
          if (envName === 'cases') {
            t = this._compactLimits(t);
          }
          cells.push(t);
        }
        rows.push(cells.join('  '));
      }
    }
    return rows.join('\n') + this.latexToText(rest);
  }

  /** markdown 行内清理 */
  cleanInline(s) {
    const esc = [];
    let t = s.replace(/\\([`*_\[\]()#+\-.!|>])/g, function (m, p1) {
      esc.push(p1);
      return String.fromCharCode(0xE000 + esc.length);
    });
    t = t.replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, function (m, alt, url) {
      return '[图片] ' + (alt.length > 0 ? alt : url);
    });
    t = t.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '$1（$2）');
    t = t.replace(/`([^`]+)`/g, '$1');
    t = t.replace(/\*\*\*([^*]+)\*\*\*/g, '$1');
    t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
    t = t.replace(/\*([^*]+)\*/g, '$1');
    t = t.replace(/~~([^~]+)~~/g, '$1');
    t = t.replace(/__([^_]+)__/g, '$1');
    t = t.replace(/[\uE000-\uE010]/g, function (m) {
      const idx = m.charCodeAt(0) - 0xE000 - 1;
      return (idx >= 0 && idx < esc.length) ? esc[idx] : m;
    });
    return t.trim();
  }

  /** 净式主入口 */
  convert(md) {
    if (!md) {
      return '';
    }
    let src = md.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    // 纯文本检测：无任何转换特征 -> 原样返回（不误伤）
    if (!/[\\$#*`\[\]|>~]/.test(src) && !/_\d/.test(src) && !/\^\d/.test(src)) {
      return src.replace(/\n{3,}/g, '\n\n').trim();
    }
    // 1) 代码块提取保护
    const codeBlocks = [];
    let text = src.replace(/```[\s\S]*?```/g, function (m) {
      codeBlocks.push(m);
      return '@@CB' + (codeBlocks.length - 1) + '@@';
    });
    // 2) 公式定界符：块级 -> 行内
    text = text.replace(/\$\$([\s\S]+?)\$\$/g, function (m, p1) {
      return this.latexToText(p1);
    }.bind(this));
    text = text.replace(/\\\[([\s\S]+?)\\\]/g, function (m, p1) {
      return this.latexToText(p1);
    }.bind(this));
    text = text.replace(/\$([\s\S]+?)\$/g, function (m, p1) {
      return this.latexToText(p1);
    }.bind(this));
    text = text.replace(/\\\(([\s\S]+?)\\\)/g, function (m, p1) {
      return this.latexToText(p1);
    }.bind(this));
    // 3) 公式外轻量转换：裸命令 + _数字/^数字
    text = text.replace(/\\[a-zA-Z]+/g, function (cmd) {
      const g = this.greek.get(cmd);
      if (g !== undefined) {
        return g;
      }
      const s = this.symbols.get(cmd);
      if (s !== undefined) {
        return s;
      }
      if (this.funcs.has(cmd)) {
        return cmd.substring(1);
      }
      return cmd;
    }.bind(this));
    text = text.replace(/_(\d+)/g, function (m, d) {
      const c = this._toSub(d);
      return c !== null ? c : '_' + d;
    }.bind(this));
    text = text.replace(/\^(\d+)/g, function (m, d) {
      const c = this._toSup(d);
      return c !== null ? c : '^' + d;
    }.bind(this));
    // 4) markdown 逐行处理
    const out = [];
    const lines = text.split('\n');
    for (let li = 0; li < lines.length; li++) {
      const line = lines[li];
      const stripped = line.trim();
      const cb = /^@@CB(\d+)@@$/.exec(stripped);
      if (cb !== null) {
        const idx = parseInt(cb[1], 10);
        out.push(idx >= 0 && idx < codeBlocks.length ? codeBlocks[idx] : stripped);
        continue;
      }
      const head = /^#{1,6}\s+(.*)$/.exec(stripped);
      if (head !== null) {
        out.push('【' + this.cleanInline(head[1]) + '】');
        continue;
      }
      if (/^(-{3,}|\*{3,}|_{3,})$/.test(stripped)) {
        continue;
      }
      if (stripped.startsWith('>')) {
        out.push(this.cleanInline(stripped.replace(/^>+\s*/, '')));
        continue;
      }
      if (stripped.startsWith('|') && stripped.endsWith('|')) {
        const rawCells = stripped.substring(1, stripped.length - 1).split('|');
        const cells = [];
        for (let c = 0; c < rawCells.length; c++) {
          const cc = rawCells[c].trim();
          if (cc.length > 0) {
            cells.push(cc);
          }
        }
        let allSep = true;
        for (let c = 0; c < cells.length; c++) {
          if (!/^:?-{1,}:?$/.test(cells[c])) {
            allSep = false;
            break;
          }
        }
        if (allSep) {
          continue;
        }
        const cleaned = [];
        for (let c = 0; c < cells.length; c++) {
          cleaned.push(this.cleanInline(cells[c]));
        }
        out.push(cleaned.join(' / '));
        continue;
      }
      const task = /^[-*+]\s+\[( |x|X)\]\s+(.*)$/.exec(stripped);
      if (task !== null) {
        const mark = task[1].toLowerCase() === 'x' ? '\u2705' : '\u2b1c';
        out.push(mark + ' ' + this.cleanInline(task[2]));
        continue;
      }
      const ul = /^[-*+]\s+(.*)$/.exec(stripped);
      if (ul !== null) {
        out.push('\u00b7 ' + this.cleanInline(ul[1]));
        continue;
      }
      const ol = /^\d+[.)]\s+(.*)$/.exec(stripped);
      if (ol !== null) {
        out.push(this.cleanInline(ol[1]));
        continue;
      }
      out.push(stripped.length > 0 ? this.cleanInline(stripped) : '');
    }
    let result = out.join('\n');
    result = result.replace(/\n{3,}/g, '\n\n');
    return result.trim();
  }
}

export { MarkdownConverter };
export default MarkdownConverter;

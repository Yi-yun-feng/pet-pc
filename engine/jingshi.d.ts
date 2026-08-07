/**
 * 净式引擎 v2 类型声明
 * 平台无关：Node / 浏览器 / HarmonyOS ArkTS 均可使用。
 */
export interface ConvertResult {
  text: string;
}

export declare class MarkdownConverter {
  constructor();
  /** 设置用户自定义符号映射（\命令 -> 符号），优先于内置表 */
  setCustom(pairs: [string, string][]): void;
  /** 完整 LaTeX 片段解析（公式定界符内使用） */
  latexToText(src: string): string;
  /** markdown 行内清理 */
  cleanInline(s: string): string;
  /** 净式主入口：专业符号(Markdown/LaTeX) → 聊天可读纯文本 */
  convert(md: string): string;
}

export default MarkdownConverter;
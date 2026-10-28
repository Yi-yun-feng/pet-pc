# 引擎同步说明

`engine/` 目录在**两个仓库**里各有一份副本：

| 仓库 | 用途 | engine 角色 |
|---|---|---|
| `jingshi-pc` | 净式 PC 端 | **主副本**（改动从这里发起） |
| `pet-pc` | AI 桌宠（已归档） | 跟随副本 |

## 为什么是复制而不是共享包

`pet-pc` 是 `private: true` 的个人项目，已停止开发。
为它做 npm 发布或 git submodule 的维护成本高于收益。

## 改动流程

**引擎只能在 `jingshi-pc/engine/` 改**，改完同步到 `pet-pc`：

```bash
cp jingshi-pc/engine/jingshi.js jingshi-pc/engine/test.js pet-pc/engine/
cd pet-pc && node engine/test.js   # 必须 28/28 通过
```

## 一致性检查

两个文件应完全相同：

```bash
md5sum jingshi-pc/engine/jingshi.js pet-pc/engine/jingshi.js | awk '{print $1}' | uniq | wc -l
# 输出 1 表示一致
```

## 历史

2026-10-28：`pet-pc` 的引擎停留在 649 行旧版，缺 41 行修复
（`\Leftrightarrow` `\emptyset` `\mid` `\leqslant` 等符号、矩阵环境变体识别、希腊字母变体）。
当日同步至 690 行版本，双端 28/28 测试通过。

# 开源前检查清单（Push 到 GitHub 前必过）

> 原则：仓库是公开的，任何被 commit 的内容都可能被全世界看到。
> 本清单在每次 push 前、以及新增敏感文件类型后执行。

## 1. 敏感信息扫描
- [ ] 无用户名/昵称（代码、路径、注释）
- [ ] 无本地路径痕迹（如 C:\Users\<name>\ 等绝对路径）
- [ ] 无邮箱、电话、身份证、学号
- [ ] 无 IP / 服务器地址 / 域名（除非是示例占位）
- [ ] 无 API key / token / 密钥 / 密码（含 base64/hex 编码）
- [ ] 无内网地址 / 代理端口（示例用 localhost:8080 占位）

## 2. 文件类型防线（.gitignore 已覆盖）
- [ ] .env / .env.*
- [ ] *.pem / *.key / *.p12 / *.p7b / *.cer / *.keystore / *.jks
- [ ] credentials* / secrets* / config.local.* / local.properties
- [ ] 鸿蒙签名相关（build-profile.json5 含密码，禁止提交）

## 3. Git 历史
- [ ] git log 检查：历史提交中无敏感信息（首次推送前必须干净）
- [ ] 若历史有敏感信息：重写历史后再推送（尚未推送远程时 amend/重建）

## 4. 依赖与许可
- [ ] package.json 无私有 registry / 内部依赖
- [ ] 许可证文件（MIT/Apache-2.0）与 README 声明一致
- [ ] 无来自私人/公司仓库的子模块

## 5. 发布物
- [ ] README 用示例数据，不用真实数据
- [ ] 截图不包含真实聊天记录/个人信息
- [ ] CI 配置（GitHub Actions）无明文密钥（用 Secrets）

## 扫描命令（Windows PowerShell）
```powershell
$patterns = @('YourName','C:\\Users\\','192\.168\.','user@example\.com','password','api[_-]?key','secret','BEGIN [A-Z ]*PRIVATE KEY','sk-[A-Za-z0-9]{8,}')
Get-ChildItem -Path . -Recurse -File | Where-Object { $_.FullName -notmatch '\\\.git\\' } |
  ForEach-Object { $c = [System.IO.File]::ReadAllText($_.FullName); foreach ($p in $patterns) { if ($c -match $p) { Write-Output ("HIT: " + $_) } } }
```
---
title: Git 工作流最佳实践
date: 2024-04-20
---

# Git 工作流最佳实践

## Git Flow

### 分支结构

```
┌─────────────────────────────────────────────────────────────┐
│                        main                                │
├─────────────────────────────────────────────────────────────┤
│                        develop                             │
├───────────────┬───────────────┬────────────────────────────┤
│     feature   │    release    │         hotfix             │
│   /feature-1  │  /release-1.0 │       /hotfix-1.0.1        │
│   /feature-2  │               │                            │
└───────────────┴───────────────┴────────────────────────────┘
```

### 分支职责

| 分支类型 | 职责 | 生命周期 |
|----------|------|----------|
| main | 生产环境代码 | 永久存在 |
| develop | 开发集成分支 | 永久存在 |
| feature | 开发新功能 | 功能完成后合并到 develop |
| release | 准备发布 | 发布后合并到 main 和 develop |
| hotfix | 紧急修复 | 修复后合并到 main 和 develop |

### 工作流程

```bash
# 1. 从 develop 创建 feature 分支
git checkout -b feature/user-auth develop

# 2. 开发完成后合并到 develop
git checkout develop
git merge --no-ff feature/user-auth
git branch -d feature/user-auth

# 3. 创建 release 分支
git checkout -b release/1.0.0 develop

# 4. 发布后合并到 main 和 develop
git checkout main
git merge --no-ff release/1.0.0
git tag -a 1.0.0 -m "Release 1.0.0"

git checkout develop
git merge --no-ff release/1.0.0
git branch -d release/1.0.0

# 5. 紧急修复
git checkout -b hotfix/1.0.1 main

# 修复完成后
git checkout main
git merge --no-ff hotfix/1.0.1
git tag -a 1.0.1 -m "Hotfix 1.0.1"

git checkout develop
git merge --no-ff hotfix/1.0.1
git branch -d hotfix/1.0.1
```

## GitHub Flow

### 核心原则

1. **main 分支永远可部署**
2. **新功能从 main 创建分支**
3. **提交频繁**
4. **创建 Pull Request**
5. **代码审查**
6. **合并到 main**

### 工作流程

```bash
# 1. 创建功能分支
git checkout -b feature/user-auth

# 2. 开发并提交
git add .
git commit -m "feat: add user authentication"

# 3. 推送到远程
git push origin feature/user-auth

# 4. 创建 Pull Request
# 在 GitHub 上创建 PR

# 5. 代码审查和讨论
# 修改代码直到通过审查

# 6. 合并到 main
# 使用 GitHub 的合并功能

# 7. 删除分支
git branch -d feature/user-auth
git push origin --delete feature/user-auth
```

## GitLab Flow

### 环境分支

```
main → pre-production → production
```

### 工作流程

```bash
# 创建功能分支
git checkout -b feature/user-auth main

# 开发完成后合并到 pre-production
git checkout pre-production
git merge --no-ff feature/user-auth

# 测试通过后合并到 production
git checkout production
git merge --no-ff pre-production
```

## Commit 规范

### Conventional Commits

```
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

### 类型说明

| 类型 | 说明 |
|------|------|
| feat | 新功能 |
| fix | 修复 bug |
| docs | 文档更新 |
| style | 代码格式（不影响代码运行） |
| refactor | 重构（既不新增功能也不修复 bug） |
| test | 测试相关 |
| chore | 构建/工具相关 |

### 示例

```bash
# 新功能
git commit -m "feat(auth): add login page"

# 修复 bug
git commit -m "fix(api): handle null response"

# 文档更新
git commit -m "docs(readme): update installation guide"

# 重构
git commit -m "refactor(utils): simplify date formatting"
```

## 代码审查

### PR 模板

```markdown
## 变更类型

- [ ] 新功能
- [ ] Bug 修复
- [ ] 文档更新
- [ ] 代码重构
- [ ] 测试添加

## 描述

简要描述本次变更的内容。

## 测试

如何验证本次变更？

## 相关 Issue

Closes #123
```

### 审查要点

1. **代码正确性**：功能是否按预期工作
2. **代码质量**：是否符合代码规范
3. **性能**：是否有性能问题
4. **安全性**：是否有安全隐患
5. **可维护性**：代码是否易于理解和维护

## 冲突解决

### 常见场景

```bash
# 场景1：合并时冲突
git checkout develop
git merge feature/user-auth

# 手动解决冲突后
git add .
git commit

# 场景2：rebase 时冲突
git checkout feature/user-auth
git rebase develop

# 解决冲突
git add .
git rebase --continue
```

### 冲突解决策略

1. **提前沟通**：避免多人同时修改同一文件
2. **频繁合并**：定期将 develop 合并到 feature 分支
3. **使用工具**：利用 VS Code、GitKraken 等工具解决冲突

## 标签管理

### 创建标签

```bash
# 轻量标签
git tag 1.0.0

# 附注标签（推荐）
git tag -a 1.0.0 -m "Version 1.0.0"

# 打标签到指定提交
git tag -a 1.0.0 <commit-hash>
```

### 推送标签

```bash
# 推送单个标签
git push origin 1.0.0

# 推送所有标签
git push origin --tags
```

### 删除标签

```bash
# 删除本地标签
git tag -d 1.0.0

# 删除远程标签
git push origin :1.0.0
```

## 最佳实践总结

1. **选择合适的工作流**：根据团队规模和项目需求选择 Git Flow、GitHub Flow 或 GitLab Flow
2. **保持提交粒度小**：每个提交只做一件事
3. **写清晰的提交信息**：使用 Conventional Commits
4. **代码审查**：所有代码变更都需要经过审查
5. **定期清理分支**：删除已完成的 feature 分支
6. **使用标签管理版本**：便于追溯和回滚

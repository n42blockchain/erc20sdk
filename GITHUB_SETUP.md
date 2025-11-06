# GitHub 上传指南

## 步骤 1: 在 GitHub 上创建新仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `erc20sdk` 或 `n42-erc20-sdk`
   - **Description**: `N42 Mobile SDK for ERC-20 token operations on iOS and Android`
   - **Visibility**: 选择 Public 或 Private
   - **不要**勾选 "Initialize this repository with a README"（因为本地已有代码）
3. 点击 "Create repository"

## 步骤 2: 连接本地仓库到 GitHub

复制 GitHub 提供的仓库 URL（例如：`https://github.com/yourusername/erc20sdk.git`），然后运行：

```bash
# 添加远程仓库（替换为你的 GitHub 仓库 URL）
git remote add origin https://github.com/yourusername/erc20sdk.git

# 或者使用 SSH（如果你配置了 SSH key）
# git remote add origin git@github.com:yourusername/erc20sdk.git

# 重命名分支为 main（如果 GitHub 使用 main 作为默认分支）
git branch -M main

# 推送代码到 GitHub
git push -u origin main
```

## 步骤 3: 验证

访问你的 GitHub 仓库页面，应该能看到所有代码文件。

## 可选：设置仓库信息

在 GitHub 仓库页面：
1. 点击 **Settings** → **General**
2. 可以添加 Topics（标签）：`erc20`, `ethereum`, `blockchain`, `sdk`, `typescript`, `n42`
3. 可以设置网站（如果有）：例如 `https://n42.world/sdk`

## 可选：添加 GitHub Actions（CI/CD）

可以创建 `.github/workflows/ci.yml` 来自动化测试和构建。

## 可选：发布到 npm

如果想让其他人通过 npm 安装：

```bash
# 登录 npm（如果还没有）
npm login

# 发布（确保 package.json 中的版本号正确）
npm publish
```

注意：如果使用 scoped package (`@n42/erc20-sdk`)，需要：
```bash
npm publish --access public
```

## 常用 Git 命令

```bash
# 查看状态
git status

# 查看远程仓库
git remote -v

# 添加更改
git add .

# 提交更改
git commit -m "描述你的更改"

# 推送到 GitHub
git push

# 创建新分支
git checkout -b feature/new-feature

# 查看提交历史
git log
```


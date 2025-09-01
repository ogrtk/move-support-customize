FROM "mcr.microsoft.com/devcontainers/base:bullseye"
SHELL ["/bin/bash", "-c"]

RUN apt update
RUN apt install curl gnupg2 -y

# Node.js 公式のDebian用セットアップ（LTS版: v20系をインストール）
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
  && apt install -y nodejs

# バージョン確認 (オプション)
RUN node -v && npm -v

USER vscode

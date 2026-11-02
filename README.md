# 1. Gitの初期化（まだの場合）

git init

# 2. すべての変更ファイルをステージング

git add .

# 3. コミットを作成

git commit -m "feat: 更新"

# 4. リモートリポジトリ（GitHub）のURLを登録

git remote add origin https://github.com/miu-miura-dev/household-account-book.git

# 5. ブランチをmainに変更してプッシュ

git branch -M main
git push -u origin main


＃ 最新取得

git pull origin main
npm install
npm run dev
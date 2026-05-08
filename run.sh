lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9
npm run dev

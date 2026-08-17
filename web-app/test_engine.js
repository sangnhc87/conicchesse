const { exec } = require('child_process');
const enginePath = './src-tauri/bin/pikafish-mac-arm64';
const p = exec(enginePath);
p.stdout.on('data', data => console.log(data.toString()));
p.stdin.write("uci\n");
p.stdin.write("position fen 3ak4/9/4a4/9/9/9/9/9/9/3AK4 w - - 0 1\n"); // Basic mate in 1
p.stdin.write("go depth 40 movetime 2000\n");
setTimeout(() => { p.stdin.write("quit\n"); process.exit(0); }, 2500);

import { spawn } from 'child_process';
const p = spawn('./src-tauri/bin/pikafish-mac-arm64', [], { stdio: 'pipe' });
p.stdout.on('data', d => console.log(d.toString()));
p.stdin.write('uci\nposition startpos\ngo depth 20\n');
setTimeout(() => process.exit(), 3000);

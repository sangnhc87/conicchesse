import { spawn } from 'child_process';
const p = spawn('./src-tauri/resources/pikafish/pikafish', [], { stdio: ['pipe', 'pipe', 'inherit'] });
p.stdout.on('data', d => console.log(d.toString()));
p.stdin.write('isready\nposition startpos\ngo depth 10\n');
setTimeout(() => { p.stdin.write('quit\n'); process.exit(0); }, 3000);

import { spawn } from 'child_process';
const p = spawn('./src-tauri/resources/pikafish/pikafish', [], { stdio: ['pipe', 'pipe', 'inherit'] });
p.stdout.on('data', d => console.log(d.toString()));
p.stdin.write('isready\nposition fen 3ak4/9/4a4/9/9/9/9/9/4R4/4K4 w - - 0 1\ngo mate 10\n');
setTimeout(() => { p.stdin.write('quit\n'); process.exit(0); }, 3000);

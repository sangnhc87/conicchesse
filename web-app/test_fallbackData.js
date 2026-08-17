import { spawn } from 'child_process';
const proc = spawn('./src-tauri/resources/pikafish/pikafish', { stdio: ['pipe', 'pipe', 'inherit'] });
proc.stdout.on('data', data => {
  const output = data.toString();
  console.log(output);
  if (output.includes('bestmove')) {
    proc.kill();
  }
});
proc.stdin.write("position fen 4k4/4a4/4P4/9/9/9/9/4B4/9/4K4 w - - 0 1\n");
proc.stdin.write("setoption name MultiPV value 1\n");
proc.stdin.write("go depth 20\n");

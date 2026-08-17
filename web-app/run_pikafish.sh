#!/bin/bash
./src-tauri/resources/pikafish/pikafish << 'INNER_EOF'
position fen 9/1N7/5k3/9/6b2/9/9/9/9/4K4 w - - 0 1
go depth 20
INNER_EOF

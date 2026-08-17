1. **Fix `EngineManager.js` (`findMate`)**:
If `is_mate` is false, but we requested `findMate`, we can check if the score is overwhelmingly high (e.g., `cp > 90000`). But wait, `is_mate` is determined by `engine.rs`!
Let's fix `engine.rs` instead!
In `engine.rs` `find_mate`:
If Pikafish outputs `bestmove` but no `mate`, how do we know it's a mate?
If `bestmove` is output, AND `last_info_score > 90000`?
Actually, `engine.rs` `run_search` converts mate scores to `99900` or so.
But in `find_mate`, Pikafish might output `score cp 918`.
`918` is NOT a mate score.
Wait! If it's a mate in 1, why does Pikafish evaluate it as `cp 918`?
Because Pikafish evaluates checkmate as `mate 1` or `mate 2` etc., but SOMETIMES for depth 1, it just returns the evaluation of the current position without realizing it's mate?
No, it's because there is NO mate!
Wait. Let's think. If there is NO mate, then `fallbackTree` is correct!
If `fallbackTree` is correct, the ONLY bug is that `fallbackTree` is corrupt!
Wait! "Dò sát cục ko được dù 1 thế cờ siêu cơ bản"
Could it be that the user provided a position that IS a mate, but Pikafish didn't find it within 15 seconds?
For a "siêu cơ bản" (super basic) position, Pikafish will find the mate in 0.01 seconds!
But Pikafish will return `mate 3` or something.
And `find_mate` in `engine.rs` DOES parse `mate 3`!
```rust
                        "mate" => {
                            found_mate = parts.get(i + 1).and_then(|s| s.parse().ok());
                        }
```
If `found_mate` is `3`, it sets `mate_in = Some(3)`.
And `is_mate` becomes `true`.
And `moves` are parsed from `pv`.
And `findMate` in `EngineManager.js` returns `mateRes` with `mate: true`, `moves: [...]`.
Then `CheckmateSolverModal` uses `mateRes.move` (which is `bestmove`).
Wait! `mateRes` from `find_mate` returns:
```json
        json!({
            "mate": is_mate,
            "mateIn": mate_in,
            "bestmove": bm,
            "pv": pv,
            "moves": moves,
            ...
        })
```
BUT wait! In `CheckmateSolverModal.jsx`:
```javascript
      let bestMove = mateRes?.move || null;
```
Look at that line!
`mateRes?.move`!
But `engine.rs` returns `"bestmove": bm`, `"moves": moves`, `"pv": pv`!
It DOES NOT return `"move": bm`!!!
Ahhhh!!!!
`mateRes.move` is ALWAYS UNDEFINED!!!
So `bestMove` is ALWAYS NULL!
And `if (!bestMove) { onProgress("Tìm nước tốt nhất bằng Alpha-Beta...") }`
So it ALWAYS FALLS BACK TO ALPHA-BETA!!!
Even if Pikafish successfully finds a mate in 0.01 seconds and returns `mate: true, bestmove: "e1e7"`!
`CheckmateSolverModal` looks for `mateRes.move`, finds it undefined, and FALLS BACK!
THIS IS THE ROOT CAUSE!

Let's verify this!

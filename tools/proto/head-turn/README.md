# Head turn prototype (step 4 study, 2026-11-06)

Turns a drawn face in 3D from its front and side drawings only. Raster
output, for judging the in-between looks; not used by the renderer.

- Paired elements (front ↔ side, same kind, best overlap in height) become
  volumes: at each height an ellipse filling the front drawing's width and
  the side drawing's depth, so the two drawn views come out exact and the
  in-between angles round.
- Other elements (eyes, mouth, ears, marks) are flat cards on the head's
  front surface (front ones) or its near side (side ones), switching front
  ↔ side at 45°.
- Drawn layering wins over depth near the front (under behind skin, over in
  front); depth wins toward the back of the head.

    node tools/proto/head-turn/dump.mjs male rama /tmp/rama.json      # run from the repo root
    python3 tools/proto/head-turn/turn.py /tmp/rama.json '#916f6f' /tmp/rama-turn.png

Needs numpy, Pillow and rsvg-convert. Grid: turn 0…180°, up 40 … down 40.

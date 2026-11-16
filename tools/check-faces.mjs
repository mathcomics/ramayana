// Check the face drawings: what each character's face is composed of, and
// every problem the artist should fix in the drawings (data/faces/README.md).
// The faces are composed from the drawings whenever they are loaded
// (tools/faces-lib.mjs composeFaces, tools/lib.mjs loadFaces); there is no
// generated file.
//
//   node tools/check-faces.mjs     exits 1 if a character has no face

import { join } from 'node:path';
import { root, json } from './lib.mjs';
import { composeFaces } from './faces-lib.mjs';

const { faces, bases, errors, warnings } = composeFaces(join(root, 'data/faces'), json('data/characters.json').characters, json('data/characters.json').colors);
for (const [species, views] of Object.entries(bases)) console.log(`base ${species}: ${views.join(', ')}`);
for (const [id, F] of Object.entries(faces)) console.log(`${id}: ${Object.keys(F).join(', ')}`);
for (const m of warnings) console.error(`  ! ${m}`);
for (const m of errors) console.error(`  ! ${m}`);
console.log(`${Object.keys(faces).length} character(s), ${errors.length} error(s), ${warnings.length} warning(s)`);
if (errors.length) process.exitCode = 1;

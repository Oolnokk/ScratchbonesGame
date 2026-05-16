// Scratchbones English word list for Engh-sho first names.
//
// Names can be multi-word: any modifiers + a final noun.
// The final word must be from HANDHELD (physical objects that fit in one hand).
// If a word in TINY_TRIGGERS appears before the final word, SIZEABLE nouns
// are also valid as the final word (e.g. "Tiny Anvil", "Pocket Cauldron").
//
// All words 3-8 characters, lowercase, sorted.
(function(global){
  'use strict';

  // Words that unlock size-expanded nouns as the final word
  global.SCRATCHBONES_TINY_TRIGGERS = [
    'tiny','small','little','wee','mini','petite','pocket','minute','micro'
  ];

  // Final-word pool: physical objects naturally graspable in one hand
  global.SCRATCHBONES_ENGLISH_WORDS = [
    // tools and implements
    "awl","bit","hoe","key","saw","adze","bore","pick","rasp","shim",
    "tang","vise","whet","anvil","auger","bevel","brace","brush","burin",
    "clamp","drill","gauge","gouge","graver","lathe","level","mallet",
    "maul","plane","plumb","probe","punch","razor","scoop","screw",
    "shovel","sickle","sieve","socket","spatula","spike","stamp","stave",
    "stylus","tongs","trowel","wrench","bodkin","chisel","gimlet","grater",
    "inkpot","lancet","pliers","ratchet","syringe",
    // weapons
    "axe","bow","mace","barb","bolt","dart","dirk","flail","hilt",
    "lance","saber","shaft","shiv","sword","arrow","dagger","rapier",
    "quiver","sling","cutlass","stiletto",
    // small containers
    "cup","jar","jug","keg","pan","pot","tin","tub","urn","vat",
    "bowl","case","crock","dish","ewer","pail","phial","vase","vial",
    "canteen","flagon","flask","goblet","ladle","mortar","pitcher",
    "pouch","purse","satchel","vessel","wallet","capsule",
    // hardware and fasteners
    "bar","cog","lid","peg","pin","rod","clip","hook","knob","lace",
    "link","lock","loop","mesh","nail","plug","ring","snap","stud",
    "tack","tube","wick","wire","brad","fuse","prong","rivet","buckle",
    "clasp","cleat","collar","cotter","cramp","dowel","eyelet","ferrule",
    "grommet","hasp","hinge","latch","shackle","spring","staple","toggle",
    "washer",
    // fiber and textile
    "coil","knot","rope","sash","bead","skein","spool","strand","string",
    "thread","twine","bobbin","sinew","thong",
    // natural handheld objects
    "nut","orb","pod","bud","pip","acorn","amber","bark","bone","burr",
    "chip","clay","clod","coal","cone","coral","flax","flint","frond",
    "grain","husk","jade","leaf","lump","opal","ore","peel","pebble",
    "rind","rock","root","reed","seed","shard","shell","sliver","spore",
    "stem","stone","thorn","twig","wood","feather","kernel","nugget",
    "walnut","cobble","chestnut",
    // gems and minerals
    "gem","opal","ruby","agate","beryl","flint","garnet","pearl","quartz",
    "topaz","crystal","diamond","emerald","granite","jasper","obsidian",
    "sapphire","spinel","lignite","pyrite",
    // coins, tokens, seals
    "die","disc","coin","slug","flan","obol","rune","seal","tab","badge",
    "medal","pawn","token","tally","sigil","wafer","pellet","counter",
    "medallion",
    // jewelry and adornments
    "torc","cameo","charm","locket","amulet","anklet","bangle","brooch",
    "earring","pendant","signet","trinket","talisman","circlet",
    // small instruments
    "bell","drum","fife","horn","lute","pipe","reed","flute","rattle",
    "whistle","kazoo","ocarina",
    // lights and fire tools
    "lamp","wick","candle","lantern","tinder","striker",
    // domestic small objects
    "comb","cube","fork","gavel","mold","mug","spoon","thimble","tile",
    "wand","bottle","button","sponge","dipper",
    // materials as handled pieces
    "blob","disk","drop","flake","foil","grit","hull","ingot","plank",
    "plaque","slab","tablet","wedge","whorl",
    // craft objects
    "blank","block","mandrel","pestle","shuttle","spindle",
    // small optics
    "lens","prism","monocle","compass",
    // writing
    "quill","scroll",
    // military small kit
    "buckler","gorget","rondel",
    // games and toys
    "ball","marble","puppet","top",
    // hunting and fishing
    "lure","snare","sinker","bobber","decoy",
    // weights
    "weight"
  ]
  .filter((w,i,a) => w.length>=3 && w.length<=8 && a.indexOf(w)===i)
  .sort();

  // Final-word pool when a TINY_TRIGGER precedes the noun:
  // larger physical objects that become handheld as "tiny" versions.
  // Combined with SCRATCHBONES_ENGLISH_WORDS at runtime.
  global.SCRATCHBONES_SIZEABLE_NOUNS = [
    // vessels and furniture
    "barrel","basket","bucket","canteen","cauldron","cask","chest",
    "cistern","churn","kettle","trough","vat",
    // structures (as miniatures)
    "arch","boat","bridge","cart","crane","door","forge","gate","loom",
    "oven","plow","press","sled","stool","table","tower","trough",
    "wagon","wall","wheel","winch",
    // large tools
    "anvil","bellows","furnace",
    // instruments (larger)
    "harp","lute",
    // armor pieces
    "hauberk","helmet","shield","cuirass","greaves","gorget","pauldron",
    "vambrace",
    // other large objects
    "banner","beacon","cannon","coffin","column","ladder","mirror",
    "saddle","throne","trebuchet"
  ]
  .filter((w,i,a) => w.length>=3 && w.length<=8 && a.indexOf(w)===i)
  .sort();

})(typeof window !== 'undefined' ? window : this);

/**
 * Pocket Grand Line: the story (01-concept §2, §3, §5, §7). Eight delivery
 * jobs, every line of dialogue, and the scripted moments (intro fling, Luffy's
 * neck, the Log Pose spin, Laboon's song, the hat gust, the Golden Bell, the
 * KANPAI and your flag on the Sunny).
 *
 * Lines are written compactly as "who.gesture!cue: text" ('~' = narrator).
 * A cue fires the moment its line appears on screen (see CUES), so sounds and
 * gestures land on the right beat without the engine knowing about them.
 */
import { CanvasTexture, CatmullRomCurve3, DoubleSide, Group, Mesh, MeshToonMaterial, PlaneGeometry, SRGBColorSpace, TubeGeometry, Vector3, type BufferGeometry } from 'three';
import type { Gesture } from '../chars/anim';
import { arc, dirFromLatLon, frameQuat, headingTo } from '../core/math';
import type { Game } from '../game/game';
import type { NPC } from '../game/npcs';
import type { JobDef, Line, StepDef, Story } from '../game/types';
import { outlineChar, toonChar, toonColor, toonRamp } from '../render/materials';
import { addOutlineNormals, ball } from '../render/shapes';
import { CREDITS, TEAM } from './copy';
import { items, strawHat } from './items';

const J1 = 'j1-meat-urgent';
const J2 = 'j2-too-salty';
const J3 = 'j3-cant-climb';
const J4 = 'j4-friend-price';
const J5 = 'j5-not-crying';
const J6 = 'j6-long-way-round';
const J7 = 'j7-laughter-tree';
const J8 = 'j8-hold-my-hat';
const AFTER_J1 = [J1];

// ---------------------------------------------------------------------------
// line helpers
// ---------------------------------------------------------------------------
type Cued = Line & { cue?: string };
/** "who.gesture!cue: text" -> Line. '~' is the narrator. */
const L = (s: string): Cued => {
  const i = s.indexOf(': ');
  const [head, cue] = s.slice(0, i).split('!');
  const [who, gesture] = head.split('.');
  return { who: who === '~' ? 'narrator' : who, text: s.slice(i + 2), gesture: gesture as Gesture | undefined, cue };
};
const C = (...s: string[]) => s.map(L);
const S = (to: string, text: string, lines: Line[], o: Partial<StepDef> = {}): StepDef => ({ to, text, lines, ...o });

// ---------------------------------------------------------------------------
// the jobs (§7)
// ---------------------------------------------------------------------------
const jobs: JobDef[] = [
  {
    id: J1,
    title: 'Meat, Urgent',
    giver: 'luffy',
    gets: 'meat-napkin',
    intro: C(
      'luffy.cheer: First job: MEAT!',
      'luffy.point: Take my order to Sanji at the Baratie. The fish-shaped restaurant, past the sand spit.',
      'luffy: I drew it myself, so he knows exactly what I want. Shishishi!',
      "nami: The needle on your wrist points at whoever's waiting for you. Follow it, not him.",
    ),
    steps: [
      S('sanji', "TAKE LUFFY'S ORDER (A DRAWING OF MEAT ON A NAPKIN) TO SANJI AT THE BARATIE", C(
        'sanji: A delivery from the Sunny? Let me guess.',
        "sanji.facepalm: A napkin drawing. He's getting better. That one has a bone.",
        'sanji.kick: One meat on the bone, coming right up.',
        "sanji: Carry it close, and don't let him smell it early. He can smell meat through a wall.",
      ), { gets: 'meat-on-bone' }),
      S('luffy', "BRING THE MEAT ON THE BONE TO LUFFY ON THE SUNNY. DON'T LET HIM SMELL IT EARLY.", C(
        '~!boing: (SHLOOORP. The meat is gone. So is the bone.)',
        'luffy.cheer: MEEEAT! Thanks, messenger!',
        "luffy: Sanji put a rice ball in your bag. The note says NOT LUFFY. I can read that much.",
        'nami: Good work. Now the real deliveries start. The whole planet is waiting.',
      ), { stamp: 'AND EATEN' }),
    ],
    reward: { emote: 'meat', outfit: 'red-vest' },
  },
  {
    id: J2,
    title: 'Too Salty',
    giver: 'sanji',
    requires: AFTER_J1,
    gets: 'bento',
    intro: C(
      "sanji: You. Courier. You've got honest hands.",
      'sanji: Leftovers. Nobody wanted them. Take them to the moss-head.',
      'sanji: He says he\'s in the crow\'s nest. He is never in the crow\'s nest.',
      'zeff: Leftovers, he says. He was up before dawn making them.',
      'sanji.kick: Shut it, old man!',
    ),
    steps: [
      S('zoro', 'TAKE THE BENTO MARKED "LEFTOVERS. NOT FOR ZORO." TO ZORO. HE SAYS HE\'S IN THE CROW\'S NEST.', C(
        "zoro: Hm? It's tall. So it's the crow's nest.",
        'zoro: How did I cross the red wall? There were stairs. I took them. Twice.',
        'zoro: Leftovers? From the curly-brow?',
        "zoro.shake: ...Fine. I'll get rid of them.",
        '~: (Thirty seconds later the box is spotless. Garnish included.)',
        'zoro.doze: Tell him: too salty.',
      ), { gets: 'empty-bento' }),
      S('sanji', 'RETURN THE BENTO BOX TO SANJI AT THE BARATIE. ZORO\'S REVIEW: "TOO SALTY."', C(
        "sanji: Back already? Let's see the damage.",
        '~: (Not a grain of rice left. Even the garnish is gone.)',
        "sanji.facepalm: 'Too salty,' says the moss-head.",
        'zeff: An empty box is the only review worth reading. You got the same one from me, eggplant.',
        '~: (Sanji turns away. You can still see the grin.)',
      ), { stamp: 'REVIEW: TOO SALTY' }),
    ],
    reward: { emote: 'zzz', outfit: 'black-suit' },
  },
  {
    id: J3,
    title: "Can't-Climb-Mountains Disease",
    giver: 'usopp',
    requires: AFTER_J1,
    gets: 'sick-note',
    intro: C(
      'usopp.shiver: Courier! Thank goodness. I have a terrible, rare and extremely real illness.',
      "usopp: Can't-Climb-Snowy-Mountains disease. Look, my knees are knocking.",
      'usopp.point: Take this note to Doctor Chopper at Drum. Walk over the sleeping Sea King. It\'s faster.',
      "usopp: Don't wake it. I didn't. Probably.",
    ),
    steps: [
      S('chopper', 'TAKE USOPP\'S NOTE TO CHOPPER AT DRUM: "URGENT. I HAVE CAN\'T-CLIMB-SNOWY-MOUNTAINS DISEASE."', C(
        'chopper: A note? For me?',
        'chopper.hop: URGENT?! A patient! Somebody get a doctor!',
        'chopper: ...Oh. Me.',
        'chopper.wave: Bravery pills! One a day, with meals. Take them to him, quick!',
        "~: (Under the label, in Kureha's handwriting: SUGAR.)",
        'kureha: Hee-hee! Best medicine I ever prescribed.',
      ), { gets: 'bravery-pills' }),
      S('usopp', 'BRING CHOPPER\'S BRAVERY PILLS TO USOPP. (KUREHA\'S LABEL UNDERNEATH: "SUGAR.")', C(
        'usopp: Pills! From a real doctor!',
        '~: (Crunch. Crunch.)',
        "usopp.flex: I feel brave. Braver than a mountain. Don't make me climb one.",
        'usopp: A doctor this good needs a certificate. Captain Usopp will write one!',
        'usopp.point: Signed by me and my eight thousand followers. Run it back to him!',
      ), { gets: 'certificate' }),
      S('chopper', 'TAKE USOPP\'S CERTIFICATE TO CHOPPER: "GREATEST DOCTOR ON ALL SEAS."', C(
        "chopper: 'Greatest doctor on all seas'?",
        "chopper.wiggle: Compliments don't make me happy, you jerk!",
        '~: (It is the happiest wiggle on the planet.)',
        "kureha: Hee-hee! He'll frame that. Don't tell him I said so.",
      ), { stamp: 'PATIENT CURED. MOSTLY.' }),
    ],
    reward: { emote: 'wiggle', outfit: 'goggles' },
  },
  {
    id: J4,
    title: 'Friend Price',
    giver: 'nami',
    requires: AFTER_J1,
    gets: 'tangerine-crate',
    intro: C(
      'nami: There you are. I have a job, and you have legs.',
      'nami: Tangerines from my grove, for a friend in Alabasta. Princess Vivi.',
      "nami: The invoice says FRIEND PRICE: 0 BERRIES. Don't get used to it.",
      'nami.point: Hold the crate over your head in the Calm Belt. Wet tangerines cost extra.',
    ),
    steps: [
      S('vivi', 'TAKE NAMI\'S TANGERINES TO VIVI IN ALABASTA. INVOICE ATTACHED: "FRIEND PRICE: 0 BERRIES."', C(
        'vivi: Tangerines? From Nami-san?',
        '~: (Karoo tries to eat the invoice.)',
        "vivi.shake: Karoo, no! That's mail, not lunch!",
        'vivi.laugh: Zero Berries? She has never charged me less.',
        "vivi: Wait here. I'm writing back.",
        '~: (She seals a letter and draws a big X on the front.)',
      ), { gets: 'x-letter' }),
      S('nami', "BRING VIVI'S SEALED LETTER (A BIG X ON THE FRONT) TO NAMI AT COCOYASI.", C(
        'nami: From Vivi? Let me see.',
        '~: (Inside: one Berry coin, and a note. I INSIST ON PAYING. —V.)',
        'nami.xmark: ...',
        "nami: One Berry. I'm framing it.",
      ), { stamp: '1 BERRY, FRAMED' }),
    ],
    reward: { emote: 'x-mark', outfit: 'desert-wrap' },
  },
  {
    id: J5,
    title: 'Not Crying',
    giver: 'kaya',
    requires: AFTER_J1,
    gets: 'merry-sketch',
    intro: C(
      "kaya: Oh! You're the courier everyone's talking about.",
      "kaya: Merry, our butler, drew this long ago. A little ship with a sheep's head. Usopp-san's first ship.",
      "kaya: The shipwright at Water 7 will know what to do with it.",
      "kaya: Please don't tell Usopp-san. Not yet.",
    ),
    steps: [
      S('franky', "TAKE MERRY THE BUTLER'S OLD SKETCH OF THE GOING MERRY TO FRANKY AT WATER 7. DON'T TELL USOPP.", C(
        'franky: A sketch? Lemme see that.',
        'franky: Whoever drew this loved that ship. ...Gimme ten seconds.',
        '~!hammer: (Franky ducks under a sheet. BANG. CLANG. BANG-BANG.)',
        "franky.super: Ship in a bottle! Tell him it's from a secret admirer.",
        'franky: Not me. Definitely not Franky. SUPER not Franky.',
      ), { gets: 'ship-in-bottle' }),
      S('usopp', 'DELIVER THE SHIP IN A BOTTLE TO USOPP. FROM "A SECRET ADMIRER (NOT FRANKY)."', C(
        'usopp: For me? From a secret admirer?',
        "usopp: It's... it's the...",
        "usopp.shake: I'm not crying! It's... Can't-Stop-Looking-At-Boats disease!",
        'franky.super: ME NEITHER!',
        '~: (Two grown men hug behind the sapling. Neither of them is crying. Officially.)',
      ), { stamp: 'TWO GROWN MEN NOT CRYING' }),
    ],
    reward: { emote: 'super', outfit: 'flower-shirt' },
  },
  {
    id: J6,
    title: 'The Long Way Round',
    giver: 'brook',
    requires: AFTER_J1,
    gets: 'brook-dial',
    receivedStamp: 'DIAL: MADE IN SKYPIEA',
    intro: C(
      'brook.bow: Yohoho! A courier! May I borrow your legs? I seem to have only bones.',
      'brook: Long ago my crew promised a whale we would come back after sailing around the world.',
      'brook: This Tone Dial holds my message for him. Laboon, at Twin Capes.',
      "brook: We promised to come back after sailing around the world. Even a small one. I won't cheat, so neither will you. Eastward, please.",
      'brook: Jinbe at Fish-Man Island knows the way under the wall.',
    ),
    steps: [
      S('jinbe', "TAKE BROOK'S TONE DIAL TO JINBE AT FISH-MAN ISLAND. IT'S A MESSAGE FOR LABOON.", C(
        'jinbe: A Tone Dial, bound for Twin Capes. The long way, I take it.',
        'jinbe: Going on is as short as going back. Round worlds are kind that way.',
        'jinbe.point: Ride my current. It runs the whole New World, all the way to the mountain.',
        'jinbe: Keep the dial dry. And no turning back.',
      )),
      S('crocus', 'CARRY THE DIAL ON THROUGH THE NEW WORLD TO CROCUS AT TWIN CAPES. NO TURNING BACK.', C(
        'crocus: Hm. A Tone Dial, carried the long way round.',
        "crocus: Go on, then. Play it for him.",
        '~: (Click. A cheerful voice, a violin, a laugh that rattles like bones, and an old, old promise roll out over the bay.)',
      ), { via: 'reverse-mountain', gets: 'laboon-dial' }),
      S('brook', "CARRY LABOON'S ANSWER BACK TO BROOK AT SABAODY.", C(
        'brook: Is that... his answer?',
        '~!song: (Click. One long, enormous note fills the stage.)',
        'brook: Fifty years I waited to keep that promise, and you walked it before my tea went cold.',
        'brook.jawdrop: I could cry, if I had tear ducts! Yohohoho!',
        "brook: Binks' Sake I'm saving for when we meet.",
      ), { stamp: 'PROMISE KEPT, BY PROXY' }),
    ],
    reward: { emote: 'yohoho', outfit: 'afro' },
  },
  {
    id: J7,
    title: 'Grows Better with Laughter',
    giver: 'robin',
    requires: AFTER_J1,
    gets: 'baby-snail',
    intro: C(
      'robin: Trees grow better with laughter. This one has had a long winter.',
      'robin: This baby Den Den Mushi copies whatever it hears. Would you collect a few laughs for me?',
      'robin: Jinbe first. Then Brook.',
      'robin: If this fails, we bury the snail. Fufu. Joking.',
    ),
    steps: [
      S('jinbe', 'TAKE THE BABY TRANSPONDER SNAIL TO JINBE. IT COPIES WHAT IT HEARS. ROBIN WANTS LAUGHS.', C(
        'jinbe: A laugh? For a tree?',
        "jinbe.shake: I don't laugh on command.",
        '~: (You pull your very best face. The snail pulls it too.)',
        'jinbe.laugh: ...Your face. HA! HA HA HA HA!',
        '~: (Puru. The snail copies his laugh, and his face. Tusks and all.)',
        'jinbe: Take it to Brook. He laughs for free.',
      )),
      S('brook', 'TAKE THE SNAIL TO BROOK AT SABAODY FOR ONE MORE LAUGH.', C(
        "brook: A laugh for Robin-san's tree? With pleasure!",
        'brook.jawdrop: Yohohohoho!',
        '~: (The snail wears a tiny afro for one second. Then it is gone.)',
        "brook: It copied my hair! I'm flattered to the bone!",
      )),
      S('robin', 'BRING THE SNAIL BACK TO ROBIN AT OHARA.', C(
        "robin: Let's hear them.",
        '~: (HA HA HA! Yohohoho! A new leaf for every laugh.)',
        "~: (Then the snail plays one nobody asked for. A small, soft 'Fufu.')",
        'robin: ...It overheard me when I handed it over.',
        '~: (The sapling bursts into bloom.)',
        'robin.laugh: Fufu. Apparently I count.',
      ), { stamp: 'SAPLING IN BLOOM' }),
    ],
    reward: { emote: 'laugh', outfit: 'explorer-boots' },
  },
  {
    id: J8,
    title: 'Hold My Hat',
    giver: 'luffy',
    requires: [J2, J3, J4, J5, J6, J7],
    gets: '',
    // played as a Den Den Mushi call when J8 opens (see hooks.tick)
    intro: C(
      '~!ring: Purupurupuru... purupurupuru... gacha!',
      'luffy.cheer: FEAST! EVERYBODY TO THE SUNNY!',
      "luffy: Messenger, you too! Sanji's cooking everything!",
      '~: (The sun is sinking. Head back to the Sunny.)',
    ),
    steps: [
      S('luffy', 'COME BACK TO THE SUNNY. FEAST AT SUNSET.', C(
        "luffy.point: My hat! Messenger! Bring it back. It's my treasure.",
        'sanji: The captain stays at the table.',
        'nami.point: Cloud over Jaya. Trust your navigator.',
        "usopp: Ride the Knock-Up Stream. It's perfectly safe. I've heard.",
      )),
      S('golden-bell', "FETCH LUFFY'S STRAW HAT FROM THE GOLDEN BELL ON THE CLOUD OVER JAYA. RIDE THE KNOCK-UP STREAM.", C(
        "~: (The straw hat hangs on the Golden Bell's frame, rocking in the sky wind.)",
        '~: (You lift it off with both hands. The frame tips. The bell swings...)',
      )),
      S('luffy', 'CARRY THE STRAW HAT BACK TO LUFFY. BOTH HANDS. NO TRYING IT ON.', C(
        'luffy.cheer: My hat!',
        'luffy: You carried it with both hands. Shishishi! Hold still...',
      ), { item: 'straw-hat', stamp: 'HAT RETURNED. KANPAI!' }),
    ],
  },
];

// ---------------------------------------------------------------------------
// moment helpers
// ---------------------------------------------------------------------------
const st = { open: 0, neck: 0, eaten: false, call: 0, gust: false, gone: false, flying: false, beat: false, tale: false, flagT: 0, shot: false };
const tweens: { t: number; d: number; f: (k: number) => void; done: () => void }[] = [];
/** A tween driven by the story tick (pauses with the game loop). */
const tween = (d: number, f: (k: number) => void) => new Promise<void>((done) => tweens.push({ t: 0, d, f, done }));
const until = async (g: Game, test: () => boolean) => {
  while (!test()) await g.wait(100);
};
const near = (g: Game, n: NPC | undefined, m: number): n is NPC => !!n && g.npcs.distance(n, g.player.dir) < m;
const ease = (k: number) => 1 - (1 - k) * (1 - k);

/** Great-circle blend of two unit directions. */
function slerp(a: Vector3, b: Vector3, u: number, out = new Vector3()) {
  const th = arc(a, b);
  if (th < 1e-5) return out.copy(a);
  const s = Math.sin(th);
  return out.copy(a).multiplyScalar(Math.sin((1 - u) * th) / s).addScaledVector(b, Math.sin(u * th) / s).normalize();
}

/** World point h metres above sea at zone-local (x, z); it follows the zone if it is relocated. */
function zonePoint(g: Game, zone: string, x: number, z: number, h: number): Vector3 {
  if (!g.world.zone(zone)) return g.point(0, 0, h);
  return g.world.localDir(zone, x, z).multiplyScalar(g.world.R + h);
}

/** World point of a named zone spot (abs heights are above sea, others above the ground). */
function spot(g: Game, zone: string, name: string): Vector3 | null {
  const s = g.world.zone(zone)?.spots?.[name];
  if (!s) return null;
  const d = g.world.localDir(zone, s.x, s.z);
  return d.multiplyScalar(g.world.R + (s.abs ? (s.y ?? 0) : g.world.ground(d).h + (s.y ?? 0)));
}

/** Outlined toon mesh from a kit geometry. */
function solid(geo: BufferGeometry): Mesh {
  addOutlineNormals(geo);
  const m = new Mesh(geo, toonChar);
  m.add(new Mesh(geo, outlineChar));
  return m;
}

let hat: Mesh | null = null;
const theHat = () => (hat ??= solid(strawHat()));

// ---- the opening: a rubber arm over the northern horizon ------------------
async function fling(g: Game) {
  const R = g.world.R;
  const end = spot(g, 'sunny-dock', 'arrival') ?? zonePoint(g, 'sunny-dock', 1.38, -1.73, 2.2);
  const lu = g.npc('luffy');
  const shoulder = lu ? lu.rig.group.position.clone().addScaledVector(lu.dir, 0.9) : end.clone().addScaledVector(end.clone().normalize(), 1);
  const mat = toonColor(0xf5c99a);
  const arm = new Mesh(undefined, mat);
  const fist = new Mesh(ball(0.24, 0xffffff, {}, 10), mat);
  g.scene.add(arm, fist);
  const hand = new Vector3();
  const pts = Array.from({ length: 25 }, () => new Vector3());
  const a = new Vector3();
  const b = new Vector3();
  const draw = (e: number) => {
    hand.copy(g.player.position).addScaledVector(g.player.dir, 0.9);
    a.copy(shoulder).normalize();
    b.copy(hand).normalize();
    const ra = shoulder.length();
    const rb = hand.length();
    const lift = arc(a, b) * R * 0.3 + 1.5;
    pts.forEach((p, i) => {
      const u = (i / 24) * e;
      slerp(a, b, u, p).multiplyScalar(ra + (rb - ra) * u + lift * Math.sin(Math.PI * u));
    });
    arm.geometry.dispose();
    arm.geometry = new TubeGeometry(new CatmullRomCurve3(pts), 40, 0.13, 6);
    fist.position.copy(pts[24]);
  };
  g.sound.sfx('boing');
  await tween(0.8, (k) => draw(ease(k)));
  const ride = g.ride('ride-intro-fling', [slerp(g.player.dir, end.clone().normalize(), 0.5).multiplyScalar(R + 26), end], 3);
  let live = true;
  void ride.then(() => (live = false));
  // establishing shot: at the top of the arc look down at the Red Line crossing the Grand Line
  const cross = dirFromLatLon(0, 4);
  const cam = g.cam;
  const [d0, h0] = [cam.dist, cam.height];
  await tween(3, (k) => {
    if (!live) return;
    draw(1);
    const e = Math.sin(Math.PI * Math.min(1, k * 1.15));
    cam.dist = d0 + 4 * e;
    cam.height = h0 + 7 * e;
    cam.fwd.lerp(headingTo(g.player.dir, cross, a), 0.07);
  });
  await ride;
  [cam.dist, cam.height] = [d0, h0];
  g.scene.remove(arm, fist);
  arm.geometry.dispose();
  if (lu) g.player.place(g.player.dir, headingTo(g.player.dir, lu.dir));
}

// ---- J1: the rubber neck ----------------------------------------------------
function neck(g: Game, lu: NPC) {
  const d = g.npcs.distance(lu, g.player.dir);
  st.neck = 1;
  lu.attend = g.player.position.clone();
  lu.attendT = 2.6;
  lu.anim.neckReach = Math.max(3, d - 0.6);
  lu.anim.play('neck');
  g.sound.sfx('boing');
  g.player.locked = true;
  g.cam.mode = 'talk';
  g.cam.talkTarget.copy(lu.rig.group.position);
  setTimeout(() => (st.eaten = true), 900);
  setTimeout(() => {
    g.player.locked = false;
    g.cam.mode = 'follow';
    void g.talk(lu);
  }, 2250);
}

// ---- J8: the gust takes the hat over the eastern horizon --------------------
async function hatGust(g: Game) {
  const lu = g.npc('luffy');
  if (!lu || st.gust) return;
  st.gust = true;
  const h = theHat();
  const start = lu.rig.bones.get('hat')!.getWorldPosition(new Vector3());
  const up = start.clone().normalize();
  const to = (spot(g, 'jaya-skypiea', 'golden-bell') ?? zonePoint(g, 'jaya-skypiea', 0, 0, 9)).normalize();
  const east = headingTo(up, to);
  const r0 = start.length();
  const pUp = new Vector3();
  g.scene.add(h);
  st.gone = st.flying = true;
  g.busy = true;
  g.player.locked = true;
  g.cam.mode = 'talk';
  g.attention(start.clone().addScaledVector(up, 2), 3);
  g.sound.whoosh(true);
  lu.anim.play('stretch');
  await tween(3, (k) => {
    if (k < 0.4) {
      const t = (k / 0.4) * Math.PI * 2;
      h.position.copy(start).addScaledVector(up, 1.6 * (1 - Math.cos(t))).addScaledVector(east, 1.6 * Math.sin(t));
    } else {
      const u = (k - 0.4) / 0.6;
      slerp(up, to, u * 0.7, h.position).multiplyScalar(r0 + 11 * u * u);
      h.scale.setScalar(1 + u);
    }
    pUp.copy(h.position).normalize();
    frameQuat(pUp, east, h.quaternion);
    h.rotateY(k * 18);
    h.rotateX(Math.sin(k * 20) * 0.4);
    g.cam.talkTarget.copy(h.position).addScaledVector(pUp, -2.2);
  });
  g.scene.remove(h);
  h.scale.setScalar(1);
  st.flying = false;
  g.cam.mode = 'follow';
  g.busy = false;
  g.player.locked = false;
}

// ---- J8 finale: your flag on the Sunny's aft pole --------------------------
const HATS: Record<string, (c: CanvasRenderingContext2D, x: number, y: number, s: number) => void> = {
  goggles(c, x, y, s) {
    c.fillStyle = '#7a4a2b';
    c.fillRect(x - 22 * s, y - 2 * s, 44 * s, 7 * s);
    for (const e of [-1, 1]) disc(c, x + e * 9 * s, y + 1 * s, 7 * s, '#9fd6ee', true);
  },
  afro(c, x, y, s) {
    for (const [dx, dy, r] of [[0, -10, 24], [-17, -2, 15], [17, -2, 15]]) disc(c, x + dx * s, y + dy * s, r * s, '#1d1a24');
  },
  'pink-top-hat'(c, x, y, s) {
    c.fillStyle = '#f27ba6';
    c.fillRect(x - 24 * s, y - 1 * s, 48 * s, 6 * s);
    c.fillRect(x - 14 * s, y - 26 * s, 28 * s, 26 * s);
    c.strokeStyle = '#ffffff';
    c.lineWidth = 3 * s;
    c.beginPath();
    c.moveTo(x - 6 * s, y - 20 * s);
    c.lineTo(x + 6 * s, y - 8 * s);
    c.moveTo(x + 6 * s, y - 20 * s);
    c.lineTo(x - 6 * s, y - 8 * s);
    c.stroke();
  },
  'coo-cap'(c, x, y, s) {
    c.fillStyle = '#3a6ea5';
    c.beginPath();
    c.ellipse(x, y + 2 * s, 19 * s, 15 * s, 0, Math.PI, 0);
    c.fill();
    c.fillRect(x - 2 * s, y, 30 * s, 5 * s);
    c.fillStyle = '#ffffff';
    c.fillRect(x - 19 * s, y - 2 * s, 38 * s, 3 * s);
  },
};

function disc(c: CanvasRenderingContext2D, x: number, y: number, r: number, fill: string, ring = false) {
  c.fillStyle = fill;
  c.beginPath();
  c.arc(x, y, r, 0, Math.PI * 2);
  c.fill();
  if (ring) c.stroke();
}

/** The player's own flag (original design): a skull wearing your hat, over two crossed envelopes. */
function drawFlag(c: CanvasRenderingContext2D, w: number, h: number, head: string) {
  const INK = '#2b2235';
  const CREAM = '#f3e9d2';
  c.fillStyle = '#2e8c8a';
  c.fillRect(0, 0, w, h);
  c.strokeStyle = CREAM;
  c.lineWidth = 3;
  c.strokeRect(5, 5, w - 10, h - 10);
  const s = h / 100;
  const x = w / 2;
  const y = h * 0.47;
  c.lineWidth = 2.5 * s;
  c.strokeStyle = INK;
  for (const a of [-0.45, 0.45]) {
    c.save();
    c.translate(x, y + 22 * s);
    c.rotate(a);
    c.fillStyle = CREAM;
    c.fillRect(-36 * s, -12 * s, 72 * s, 24 * s);
    c.strokeRect(-36 * s, -12 * s, 72 * s, 24 * s);
    c.beginPath();
    c.moveTo(-36 * s, -12 * s);
    c.lineTo(0, 3 * s);
    c.lineTo(36 * s, -12 * s);
    c.stroke();
    c.restore();
  }
  const drawHat = HATS[head] ?? HATS['coo-cap'];
  if (head === 'afro') drawHat(c, x, y - 12 * s, s);
  disc(c, x, y, 20 * s, CREAM);
  c.fillRect(x - 11 * s, y + 10 * s, 22 * s, 13 * s);
  c.fillStyle = INK;
  for (const e of [-1, 1]) {
    c.beginPath();
    c.ellipse(x + e * 8 * s, y + 1 * s, 5 * s, 6 * s, 0, 0, Math.PI * 2);
    c.fill();
  }
  c.beginPath();
  c.moveTo(x, y + 8 * s);
  c.lineTo(x - 3 * s, y + 13 * s);
  c.lineTo(x + 3 * s, y + 13 * s);
  c.fill();
  for (let i = -1; i <= 1; i++) c.fillRect(x + i * 5 * s - 0.8 * s, y + 16 * s, 1.6 * s, 7 * s);
  if (head !== 'afro') drawHat(c, x, y - 14 * s, s);
}

interface Flag {
  root: Group;
  cloth: Mesh<PlaneGeometry, MeshToonMaterial>;
  ctx: CanvasRenderingContext2D;
  tex: CanvasTexture;
  head: string;
  base: Float32Array;
  /** Camera spot for the raise: off the port quarter, looking forward over the flag at the crew. */
  eye: Vector3;
  look: Vector3;
}
let flag: Flag | null = null;
const FW = 1.4;
const FLAG_LOW = -2.5;
const FLAG_HIGH = -0.6;
type PoleTop = { zone: string; x: number; z: number; h: number; rot: number };
/** The Sunny's aft flagpole top, exported by the sunny-dock zone (looked up softly so a rename never breaks the build). */
const POLE = Object.values(import.meta.glob<{ SUNNY_FLAG?: PoleTop }>('./zones/sunny-dock.ts', { eager: true }))[0]?.SUNNY_FLAG;

/** Your flag on the Sunny's aft pole, streaming back and to starboard. */
function buildFlag(g: Game): Flag | null {
  if (!POLE || !g.world.zone(POLE.zone)) return null;
  // zone-local, so it follows the zone; rot is measured from the zone's (carried) north
  const d = g.world.localDir(POLE.zone, POLE.x, POLE.z);
  const { east, north } = g.world.northAt(POLE.zone, d);
  const H = (POLE.rot * Math.PI) / 180;
  const bow = north.clone().multiplyScalar(Math.cos(H)).addScaledVector(east, Math.sin(H));
  const star = east.clone().multiplyScalar(Math.cos(H)).addScaledVector(north, -Math.sin(H));
  const stream = star.clone().sub(bow).normalize();
  const root = new Group();
  root.position.copy(d).multiplyScalar(g.world.R + POLE.h);
  const eye = root.position.clone().addScaledVector(stream.clone().cross(d), 6.8).addScaledVector(bow, -1).addScaledVector(d, 1.2);
  const look = root.position.clone().addScaledVector(stream, FW / 2).addScaledVector(bow, 1.6).addScaledVector(d, -1.5);
  frameQuat(d, new Vector3().crossVectors(stream, d), root.quaternion);
  const cv = document.createElement('canvas');
  cv.width = 160;
  cv.height = 108;
  const ctx = cv.getContext('2d')!;
  const tex = new CanvasTexture(cv);
  tex.colorSpace = SRGBColorSpace;
  const geo = new PlaneGeometry(FW, 0.95, 10, 1);
  geo.translate(FW / 2 + 0.05, 0, 0);
  const cloth = new Mesh(geo, new MeshToonMaterial({ map: tex, gradientMap: toonRamp, side: DoubleSide }));
  cloth.position.y = FLAG_LOW;
  root.add(cloth);
  g.scene.add(root);
  const f: Flag = { root, cloth, ctx, tex, head: '', base: Float32Array.from(geo.attributes.position.array), eye, look };
  paintFlag(g, f);
  return f;
}

function paintFlag(g: Game, f: Flag) {
  const head = g.save.outfit.head ?? 'coo-cap';
  if (head === f.head) return;
  f.head = head;
  drawFlag(f.ctx, 160, 108, head);
  f.tex.needsUpdate = true;
}

/** Usopp raises your flag (3 s) in its own shot, held until the wanted-poster capture. */
async function raiseFlag(g: Game) {
  flag ??= buildFlag(g);
  g.flag('flag-raised');
  if (!flag) return;
  const f = flag;
  const c = g.cam.cam;
  g.attention(f.root.position, 3);
  g.cam.frozen = st.shot = true;
  await tween(3, (k) => {
    f.cloth.position.y = FLAG_LOW + (FLAG_HIGH - FLAG_LOW) * ease(k);
    c.position.copy(f.eye).addScaledVector(f.root.position.clone().normalize(), 0.6 * (1 - k));
    c.up.copy(f.root.position).normalize();
    c.lookAt(f.look);
  });
}

// ---------------------------------------------------------------------------
// cues: fire when a line appears
// ---------------------------------------------------------------------------
const CUES: Record<string, (g: Game) => void> = {
  boing: (g) => g.sound.sfx('boing'),
  ring: (g) => g.sound.ring(),
  song: (g) => g.sound.sfx('laboon-song'),
  hammer: (g) => {
    for (let i = 0; i < 4; i++) setTimeout(() => g.sound.sfx('hammer'), i * 420);
  },
  kanpai: (g) => {
    g.sound.sfx('kanpai');
    for (const n of g.npcs.list)
      if (n.rig.group.visible && near(g, n, 18) && !n.def.object) {
        n.anim.play('cheer');
        g.spawnEmote('🥤', n.rig.group);
      }
    g.player.anim.play('cheer');
    g.spawnEmote('🥤', g.player.rig.group);
  },
  flag: (g) => void raiseFlag(g),
};
let lastLine: Line | null = null;
let TALE: Vector3 | null = null;
/** Laugh Tale's centre: the fog zone's centre (looked up once the world exists). */
const taleDir = (g: Game) => {
  const z = g.world.zone('laugh-tale-fog');
  return (TALE ??= z ? dirFromLatLon(z.lat, z.lon) : dirFromLatLon(0, 340));
};

// ---------------------------------------------------------------------------
// the story
// ---------------------------------------------------------------------------
export const story: Story = {
  maxOpen: 3,
  firstContact: 'luffy',
  finaleJob: J8,
  items,
  jobs,
  opening: C(
    "luffy.cheer: You're our messenger now!",
    'nami.facepalm: He didn\'t ask. He never asks. We\'ll pay you. Well, HE will.',
    'nami: Here, wear my Log Pose. I retuned it to people instead of islands.',
    'nami.point: Rule of this world: the red wall runs top to bottom, the Grand Line runs round the middle, and every sea flows up the mountain where they cross.',
    "luffy.wave: Oi, messenger! C'mere, c'mere! I've got a job!",
  ),
  finale: C(
    'luffy.cheer: Looks good! Nope, mine.',
    'luffy.cheer!kanpai: KANPAI!',
    "nami: He walked straight. On this planet that's technically correct. Never tell him.",
    'zoro: Told you. Walk straight.',
    "usopp.raise!flag: Every crew needs a flag. I drew yours. You're welcome.",
    '~: (Your flag climbs the aft pole and catches the last of the sun.)',
  ),
  end: {
    title: 'CONGRATULATIONS!',
    poster: 'WANTED · FOR SERVICES TO THE CREW',
    name: 'THE MESSENGER',
    bounty: 'BOUNTY: 8 DELIVERIES · 1 HAT RETURNED · 0 PROMISES BROKEN',
    footer: 'Every parcel home. KANPAI!',
    button: 'CONTINUE',
    credits: `${CREDITS} ${TEAM}`,
  },
  hooks: {
    async opening(g) {
      const coo = g.npc('news-coo');
      await g.converse(C('news-coo.salute: Coo. (Translation: you look like a courier.)'), near(g, coo, 12) ? coo : null);
      const touch = matchMedia('(pointer: coarse)').matches;
      g.ui.toast('👣', touch ? 'HOLD TO MOVE' : 'WASD / HOLD MOUSE', 'TAKE A FEW STEPS', 3000);
      const m0 = g.player.metres;
      const t0 = g.time;
      await until(g, () => g.time - t0 > 4 || g.player.metres - m0 > 3);
      await until(g, () => !g.busy && !g.ui.panelOpen && !g.player.riding);
      await g.say(C("luffy: OIIIII! MESSENGEEEER!"));
      await fling(g);
      st.open = 1;
    },
    start(job, g) {
      if (job.id === J2) {
        g.spinLogPose(1.5);
        g.ui.toast('🧭', 'LOG POSE', "EVEN I CAN'T FIND HIM");
      }
    },
    async beforeStep(job, i, g) {
      if (job.id === J8 && i === 0) await hatGust(g);
    },
    async afterStep(job, i, g) {
      if (job.id === J1 && i === 1) {
        st.eaten = false;
        g.ui.toast('🍙', 'IN YOUR SATCHEL', 'A RICE BALL: "FOR THE MESSENGER. NOT LUFFY."', 3000);
      }
      if (job.id === J6 && i === 1) {
        // Laboon sings back: one long note heard across the planet
        g.sound.sfx('laboon-song');
        const lab = g.npc('laboon');
        g.attention(lab ? lab.rig.group.position : zonePoint(g, 'twin-capes', 7.29, -1.72, 4), 4);
        lab?.anim.play('spout');
        await g.wait(4000);
        await until(g, () => !g.busy);
        const short = g.jobs.progress.flag('j6-short-way');
        await g.converse(
          C(
            "crocus: Fifty years, and he's never sung like that.",
            ...(short ? ["crocus: Came the short way? The dial won't tell. I might."] : []),
            "crocus.point: Light the lamp. Someone's keeping a promise.",
            'crocus: His answer is in the dial now. Take it to whoever sent it. I can guess who.',
          ),
          g.npc('crocus') ?? null,
        );
      }
      if (job.id === J8 && i === 1) {
        g.sound.sfx('golden-bell');
        g.ui.toast('🔔', 'PACKAGE RECEIVED (EVERYONE HEARD THAT)', "Luffy's Straw Hat", 3000);
        const bell = g.npc('golden-bell');
        bell?.anim.play('wave');
        if (bell) g.attention(bell.rig.group.position, 3);
        await g.wait(1400);
        await until(g, () => !g.busy);
        await g.say(C('~: (Far below, a tiny green deck cheers: "THE FEAST BELL!" Slide home on the Milky Road.)'));
      }
    },
    async finale(g) {
      // the hat sits on your head for exactly one heartbeat
      g.npc('luffy')?.anim.play('stretch');
      const h = theHat();
      h.removeFromParent();
      g.player.rig.bones.get('hat')?.add(h);
      h.position.set(0, -0.1, 0);
      h.quaternion.identity();
      h.rotateX(-0.15);
      st.beat = true;
      g.sound.pop();
      setTimeout(() => {
        h.removeFromParent();
        st.beat = false;
      }, 850);
      await g.wait(420);
    },
    tick(g, dt) {
      for (let i = tweens.length - 1; i >= 0; i--) {
        const tw = tweens[i];
        tw.t += dt;
        const k = Math.min(1, tw.t / tw.d);
        tw.f(k);
        if (k >= 1) {
          tweens.splice(i, 1);
          tw.done();
        }
      }
      const line = g.ui.currentLine() as Cued | null;
      if (line !== lastLine) {
        lastLine = line;
        if (line?.cue) CUES[line.cue]?.(g);
      }
      // the flag shot holds until night falls (the end-screen poster is captured from it)
      if (st.shot && g.jobs.night) {
        st.shot = false;
        setTimeout(() => (g.cam.frozen = false), 400);
      }
      if (g.cam.mode === 'title' || g.cam.diving) return;
      const p = g.jobs.progress;
      const idle = !g.busy && !g.ui.panelOpen && !g.player.riding;
      const lu = g.npc('luffy');

      // the opening chains straight into Luffy's first job
      if (st.open === 1 && g.busy) st.open = 2;
      else if (st.open === 2 && idle) {
        st.open = 3;
        if (p.step(J1) === -1 && near(g, lu, 12)) void g.talk(lu);
      }
      // J1: Luffy smells the meat from 10 m and his neck does the rest
      if (p.active(J1, 1)) {
        if (!st.neck && idle && near(g, lu, 10)) neck(g, lu);
        if (st.eaten) g.player.rig.bones.get('hand')?.scale.setScalar(1e-3);
      }
      // J6: crossing back west through the tunnel is the short way
      const d = g.player.dir;
      if (p.active(J6, 1) && d.x > 0 && d.z < -0.85 && Math.abs(d.y) < 0.25 && !p.flag('j6-short-way')) g.flag('j6-short-way');
      // J8 opens as a Den Den Mushi call from Luffy, a few seconds after the last job
      if (p.step(J8) === -1 && jobs[7].requires!.every((r) => p.done(r))) {
        if (idle) st.call += dt;
        if (st.call > 3.5) {
          st.call = -1e9;
          void g.say(jobs[7].intro).then(() => {
            if (p.step(J8) !== -1) return;
            g.jobs.start(jobs[7]);
            g.sound.jingle('job');
            g.ui.logDot(true);
          });
        }
      }
      // J8: the gust takes the hat as you arrive
      if (p.active(J8, 0) && !st.gust && idle && near(g, lu, 7)) void g.talk(lu);
      const k = p.step(J8);
      if (lu && ((k >= 0 && k < 3 && (st.gone || k > 0)) || st.beat)) lu.rig.bones.get('hat')?.scale.setScalar(1e-3);
      // the hat waits on the Golden Bell's frame
      const bell = k === 1 && !st.beat ? g.npc('golden-bell') : undefined;
      if (bell) {
        const h = theHat();
        if (h.parent !== g.scene) g.scene.add(h);
        const up = bell.rig.group.position.clone().normalize();
        h.position.copy(bell.rig.group.position).addScaledVector(up, 2.66);
        frameQuat(up, bell.face, h.quaternion);
        h.translateX(0.5);
        h.rotateZ(-0.3 + Math.sin(g.time * 1.3) * 0.1);
      } else if (!st.flying && hat?.parent === g.scene) g.scene.remove(hat);
      // Laugh Tale stays fogged
      if (!st.tale && arc(d, taleDir(g)) * g.world.R < 7) {
        st.tale = true;
        g.ui.toast('🌫️', "LUFFY'S RULE", "DON'T TELL HIM WHAT'S IN THERE.", 3200);
      }
      // your flag flies on the Sunny for good (and wears whatever hat you wear)
      if (!flag && p.flag('flag-raised')) {
        flag = buildFlag(g);
        if (flag) flag.cloth.position.y = FLAG_HIGH;
      }
      if (flag && flag.root.position.distanceToSquared(g.player.position) < 1600) {
        st.flagT -= dt;
        if (st.flagT <= 0) {
          st.flagT = 1;
          paintFlag(g, flag);
        }
        const pos = flag.cloth.geometry.attributes.position;
        const a = pos.array as Float32Array;
        for (let i = 0; i < pos.count; i++) {
          const x = flag.base[i * 3] - 0.05;
          a[i * 3 + 2] = Math.sin(x * 4.5 - g.time * 5) * 0.09 * (x / FW);
        }
        pos.needsUpdate = true;
      }
    },
  },
};

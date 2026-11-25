export type Category = 'basics' | 'help' | 'game' | 'callout' | 'react' | 'friend' | 'slang';

export interface Phrase {
  /** English text — also the stable id for spaced repetition. */
  e: string;
  /** Thai meaning. */
  t: string;
  c: Category;
  /** Usage note in Thai. */
  n: string;
  /** What the voice should read (expands chat abbreviations). */
  s: string;
  /** Difficulty, from the sentence length: 1–3 words easy, 4–5 medium, 6+ hard. */
  l: Level;
}

export type Level = 'easy' | 'medium' | 'hard';
export const LEVELS: { k: Level; th: string }[] = [
  { k: 'easy', th: 'ง่าย' }, { k: 'medium', th: 'กลาง' }, { k: 'hard', th: 'ยาก' },
];
const levelOf = (e: string): Level => {
  const n = e.trim().split(/\s+/).length;
  return n <= 3 ? 'easy' : n <= 5 ? 'medium' : 'hard';
};

type Raw = [string, string, Category, string?, string?];

const RAW: Raw[] = [
  // basics
  ['Hi! How are you?', 'สวัสดี สบายดีไหม', 'basics'],
  ["I'm good, thanks. And you?", 'สบายดี ขอบคุณ แล้วคุณล่ะ', 'basics', 'ตอบกลับแบบสุภาพและถามกลับด้วย'],
  ["What's your name?", 'คุณชื่ออะไร', 'basics'],
  ['My name is Ken.', 'ฉันชื่อเคน', 'basics', 'เปลี่ยน Ken เป็นชื่อของคุณเองได้'],
  ['Nice to meet you.', 'ยินดีที่ได้รู้จัก', 'basics'],
  ['Where are you from?', 'คุณมาจากไหน', 'basics'],
  ["I'm from Thailand.", 'ฉันมาจากประเทศไทย', 'basics'],
  ['How old are you?', 'คุณอายุเท่าไหร่', 'basics', 'บางคนไม่ชอบให้ถามอายุ ถามเมื่อสนิทกันแล้ว'],
  ['What time is it there?', 'ที่นั่นกี่โมงแล้ว', 'basics'],
  ["It's late here.", 'ที่นี่ดึกแล้ว', 'basics'],
  ["I'm a student.", 'ฉันเป็นนักเรียน/นักศึกษา', 'basics'],
  ['See you later!', 'ไว้เจอกันนะ', 'basics'],
  ['Good night!', 'ราตรีสวัสดิ์ / ฝันดี', 'basics'],
  ['Have a nice day!', 'ขอให้เป็นวันที่ดี', 'basics'],
  ["It's really late here, so I need to sleep.", 'ที่นี่ดึกมากแล้ว ฉันต้องไปนอนแล้ว', 'basics'],
  // help
  ['Sorry, can you say that again?', 'ขอโทษ พูดอีกทีได้ไหม', 'help', 'ประโยคสำคัญที่สุดเวลาฟังไม่ทัน'],
  ['Can you speak slowly, please?', 'ช่วยพูดช้า ๆ หน่อยได้ไหม', 'help'],
  ['My English is not very good.', 'ภาษาอังกฤษของฉันยังไม่ค่อยเก่ง', 'help'],
  ["I'm still learning English.", 'ฉันยังเรียนภาษาอังกฤษอยู่', 'help'],
  ['What does that mean?', 'นั่นหมายความว่าอะไร', 'help'],
  ["I don't understand.", 'ฉันไม่เข้าใจ', 'help'],
  ['Can you type it in the chat?', 'พิมพ์ในแชตให้หน่อยได้ไหม', 'help', 'ใช้เวลาฟังในวอยซ์ไม่ออก ให้เขาพิมพ์แทน'],
  ['How do you say this in English?', 'อันนี้ภาษาอังกฤษพูดว่ายังไง', 'help'],
  ['Can you hear me?', 'ได้ยินฉันไหม', 'help'],
  ["I can't hear you.", 'ฉันไม่ได้ยินเสียงคุณ', 'help'],
  ['Your mic is not working.', 'ไมค์ของคุณใช้ไม่ได้', 'help'],
  ['Give me a second.', 'ขอเวลาแป๊บนึง', 'help'],
  ['Wait for me!', 'รอฉันด้วย', 'help'],
  ["I'll be right back.", 'เดี๋ยวกลับมา', 'help', 'ในแชตมักย่อเป็น brb'],
  ['My internet is lagging.', 'เน็ตฉันแลค', 'help'],
  ["Sorry, I didn't catch what you said.", 'ขอโทษ ฉันฟังที่คุณพูดไม่ทัน', 'help', 'catch ในที่นี้แปลว่าฟังทัน / ได้ยินชัด'],
  ["I'm still learning, so please be patient with me.", 'ฉันยังฝึกอยู่ ใจเย็นกับฉันหน่อยนะ', 'help'],
  ['Could you explain the rules of this game?', 'ช่วยอธิบายกติกาของเกมนี้หน่อยได้ไหม', 'help', 'Could you สุภาพกว่า Can you'],
  // game
  ['Do you want to play together?', 'อยากเล่นด้วยกันไหม', 'game'],
  ["Let's team up!", 'มาจับทีมกัน', 'game'],
  ['Can you add me?', 'แอดฉันเป็นเพื่อนหน่อยได้ไหม', 'game'],
  ['I sent you a friend request.', 'ฉันส่งคำขอเป็นเพื่อนไปแล้ว', 'game'],
  ['Invite me to the party.', 'ชวนฉันเข้าปาร์ตี้หน่อย', 'game'],
  ['One more game?', 'อีกเกมไหม', 'game'],
  ['I have to go now.', 'ฉันต้องไปแล้ว', 'game'],
  ["What's your rank?", 'แรงก์คุณอยู่ระดับไหน', 'game'],
  ['What role do you play?', 'คุณเล่นตำแหน่งอะไร', 'game'],
  ["I'm new to this game.", 'ฉันเพิ่งเริ่มเล่นเกมนี้', 'game'],
  ['How do I do this?', 'อันนี้ทำยังไง', 'game'],
  ['Which character do you play?', 'คุณเล่นตัวละครไหน', 'game'],
  ["I'm ready.", 'ฉันพร้อมแล้ว', 'game'],
  ["Let's go!", 'ลุยกันเลย', 'game'],
  ['Good game, well played.', 'เกมดี เล่นได้ดีมาก', 'game', 'พูดตอนจบเกม ทั้งตอนชนะและแพ้'],
  ['We almost won.', 'เราเกือบชนะแล้ว', 'game'],
  ["Don't worry, we'll win next time.", 'ไม่เป็นไร ตาหน้าชนะแน่', 'game'],
  ['Thanks for the carry!', 'ขอบคุณที่แบกทีมนะ', 'game'],
  ['That was so much fun.', 'สนุกมากเลย', 'game'],
  ['Do you want to play one more round?', 'อยากเล่นอีกตาไหม', 'game'],
  ["Let's wait until everyone is ready.", 'รอให้ทุกคนพร้อมก่อนนะ', 'game'],
  ['I think we should change our plan.', 'ฉันว่าเราควรเปลี่ยนแผนกัน', 'game'],
  ['I have to go, my mom is calling me.', 'ฉันต้องไปแล้ว แม่เรียก', 'game'],
  // callout
  ['Enemy behind you!', 'ศัตรูอยู่ข้างหลังคุณ', 'callout'],
  ['Help me!', 'ช่วยด้วย', 'callout'],
  ['I need help over here.', 'ตรงนี้ต้องการคนช่วย', 'callout'],
  ['Follow me.', 'ตามฉันมา', 'callout'],
  ['Stay together.', 'อยู่รวมกันไว้ อย่าแยกกัน', 'callout'],
  ['Go left.', 'ไปทางซ้าย', 'callout'],
  ['Go right.', 'ไปทางขวา', 'callout'],
  ['Fall back!', 'ถอยก่อน', 'callout'],
  ['Push now!', 'บุกเลย ตอนนี้', 'callout'],
  ["Wait, don't go yet.", 'เดี๋ยว อย่าเพิ่งไป', 'callout'],
  ["I'm low on health.", 'เลือดฉันเหลือน้อย', 'callout', "พูดสั้น ๆ ว่า I'm low ก็เข้าใจ"],
  ['I need ammo.', 'ฉันต้องการกระสุน', 'callout'],
  ['Heal me, please.', 'ช่วยฮีลให้หน่อย', 'callout'],
  ["I'm down!", 'ฉันโดนล้มแล้ว', 'callout'],
  ['Revive me!', 'ชุบฉันหน่อย', 'callout'],
  ['Two enemies on the left.', 'ศัตรูสองคนทางซ้าย', 'callout'],
  ['Watch out!', 'ระวัง!', 'callout'],
  ['Nice shot!', 'ยิงสวย!', 'callout'],
  ['On my way.', 'กำลังไป', 'callout'],
  ['Cover me.', 'คุ้มกันฉันที', 'callout'],
  ['The enemy team is coming from the middle.', 'ทีมศัตรูกำลังมาจากตรงกลาง', 'callout'],
  ["I'll go first, you stay behind me.", 'ฉันไปก่อน คุณอยู่ข้างหลังฉันนะ', 'callout'],
  ["Don't fight alone, wait for the team.", 'อย่าสู้คนเดียว รอทีมก่อน', 'callout'],
  // react
  ['That was close!', 'เกือบไปแล้ว!', 'react'],
  ["That's awesome!", 'สุดยอดไปเลย', 'react'],
  ['No way!', 'ไม่จริงน่า!', 'react'],
  ['Oh no!', 'แย่แล้ว!', 'react'],
  ["I'm so tired.", 'ฉันเหนื่อยมาก', 'react'],
  ["I'm hungry.", 'ฉันหิว', 'react'],
  ["That's so funny.", 'ตลกมาก', 'react'],
  ['Are you serious?', 'พูดจริงเหรอ', 'react'],
  ['My bad.', 'ความผิดฉันเอง', 'react', 'ใช้ตอนทำพลาดเล็ก ๆ ฟังดูเป็นกันเอง'],
  ['Sorry, my fault.', 'ขอโทษ ฉันผิดเอง', 'react'],
  ['No problem.', 'ไม่มีปัญหา', 'react'],
  ["You're right.", 'คุณพูดถูก', 'react'],
  ['I agree.', 'ฉันเห็นด้วย', 'react'],
  ['Calm down.', 'ใจเย็น ๆ', 'react'],
  ['Good job!', 'ทำได้ดีมาก!', 'react'],
  ['So lucky!', 'ดวงดีจัง / เฮงมาก', 'react'],
  ["I don't know.", 'ไม่รู้สิ', 'react'],
  ['Maybe later.', 'ไว้ทีหลังนะ', 'react'],
  ["I didn't know you could do that!", 'ไม่รู้เลยว่าทำแบบนั้นได้ด้วย!', 'react'],
  ["That was the best game I've played today.", 'ตานี้สนุกที่สุดที่เล่นมาวันนี้เลย', 'react'],
  // friend
  ['What games do you like?', 'คุณชอบเกมอะไร', 'friend'],
  ['Do you have Discord?', 'มีดิสคอร์ดไหม', 'friend'],
  ['How long have you played this game?', 'เล่นเกมนี้มานานแค่ไหนแล้ว', 'friend'],
  ["You're really good at this.", 'คุณเก่งเกมนี้มาก', 'friend'],
  ['Can you teach me?', 'สอนฉันหน่อยได้ไหม', 'friend'],
  ['What do you do for fun?', 'ปกติชอบทำอะไรสนุก ๆ', 'friend'],
  ['I like playing games on weekends.', 'ฉันชอบเล่นเกมช่วงวันหยุด', 'friend'],
  ['Are you free tomorrow?', 'พรุ่งนี้ว่างไหม', 'friend'],
  ["Let's play again tomorrow.", 'พรุ่งนี้มาเล่นกันอีกนะ', 'friend'],
  ['Thanks for playing with me.', 'ขอบคุณที่เล่นด้วยกันนะ', 'friend'],
  ['It was nice talking to you.', 'ดีใจที่ได้คุยกัน', 'friend'],
  ['Have you been to Thailand?', 'เคยมาประเทศไทยไหม', 'friend'],
  ["What's the weather like there?", 'ที่นั่นอากาศเป็นยังไง', 'friend'],
  ["It's very hot here.", 'ที่นี่ร้อนมาก', 'friend'],
  ['Your English is good, where did you learn it?', 'ภาษาอังกฤษคุณดีมาก เรียนมาจากไหน', 'friend'],
  ['I usually play in the evening after school.', 'ปกติฉันเล่นตอนเย็นหลังเลิกเรียน', 'friend'],
  ['Can you send me the link to your server?', 'ส่งลิงก์เซิร์ฟเวอร์ของคุณให้หน่อยได้ไหม', 'friend', 'server ในที่นี้คือเซิร์ฟเวอร์ Discord'],
  ['Add me as a friend so we can play again.', 'แอดฉันเป็นเพื่อนสิ จะได้เล่นด้วยกันอีก', 'friend'],
  // slang
  ['gg', 'good game = เกมดี (พิมพ์ตอนจบเกม)', 'slang', '', 'G G. Good game.'],
  ['brb', 'be right back = เดี๋ยวกลับมา', 'slang', '', 'B R B. Be right back.'],
  ['afk', 'away from keyboard = ไม่อยู่หน้าจอ', 'slang', '', 'A F K. Away from keyboard.'],
  ['lol', 'laughing out loud = ขำมาก (เหมือน 555)', 'slang', '', 'L O L. Laughing out loud.'],
  ['np', 'no problem = ไม่เป็นไร', 'slang', '', 'N P. No problem.'],
  ['ty', 'thank you = ขอบคุณ', 'slang', '', 'T Y. Thank you.'],
  ['idk', "I don't know = ไม่รู้", 'slang', '', "I D K. I don't know."],
  ['btw', 'by the way = ว่าแต่ / อีกอย่าง', 'slang', '', 'B T W. By the way.'],
  ['wp', 'well played = เล่นดีมาก', 'slang', '', 'W P. Well played.'],
  ['glhf', 'good luck, have fun = ขอให้โชคดี เล่นให้สนุก', 'slang', 'พิมพ์ตอนเริ่มเกม ตอบกลับว่า you too ได้', 'G L H F. Good luck, have fun.'],
  ['nvm', 'never mind = ช่างมันเถอะ', 'slang', '', 'N V M. Never mind.'],
  ['ez', 'easy = ง่าย', 'slang', 'ถ้าพิมพ์ใส่คู่แข่งหลังชนะ ถือว่าไม่สุภาพ', 'E Z. Easy.'],
  ['noob', 'มือใหม่', 'slang', 'บางครั้งใช้เป็นคำดูถูก ระวังการใช้'],
  ['OP', 'overpowered = เก่ง/แรงเกินไป', 'slang', '', 'O P. Overpowered.'],
  ['nerf', 'ทำให้อ่อนลง (เกมปรับลดความแรง)', 'slang'],
  ['buff', 'ทำให้แรงขึ้น', 'slang'],
  ['toxic', 'คนพูดจาแย่ / นิสัยเสียในเกม', 'slang'],
  ['carry', 'แบกทีม', 'slang'],
];

export const PHRASES: Phrase[] = RAW.map(([e, t, c, n, s]) => ({ e, t, c, n: n || '', s: s || e, l: levelOf(e) }));
export const SENTENCES: Phrase[] = PHRASES.filter((p) => p.c !== 'slang');

export const CATS: Record<Category, string> = {
  basics: 'ทักทาย & แนะนำตัว',
  help: 'ฟังไม่ทัน & ขอความช่วยเหลือ',
  game: 'ชวนเล่น & ระหว่างเกม',
  callout: 'คอลในเกม',
  react: 'รีแอคชัน & ความรู้สึก',
  friend: 'คุยทำความรู้จัก',
  slang: 'ศัพท์แชตเกม',
};

export interface Situation { q: string; a: string; o: string[]; say?: string; why?: string }

export const SITUATIONS: Situation[] = [
  { q: 'เพื่อนร่วมทีมพูดเร็วมากจนฟังไม่ทัน ควรพูดว่าอะไร', a: 'Can you speak slowly, please?', o: ['Speak faster, please.', "I'm ready.", 'Nice shot!'] },
  { q: 'จบเกมแล้ว อยากชมทีมตรงข้ามแบบสุภาพ', a: 'Good game, well played.', o: ['ez', 'You are noob.', 'I have to go now.'], why: 'ez กับ noob ฟังดูดูถูกอีกฝ่าย' },
  { q: 'เห็นศัตรูอยู่ข้างหลังเพื่อน ต้องรีบเตือน', a: 'Watch out! Enemy behind you!', o: ['Follow me.', 'Good job!', "I'm hungry."] },
  { q: 'จะลุกไปเข้าห้องน้ำแป๊บเดียว ควรพิมพ์ว่าอะไร', a: 'brb', o: ['gg', 'glhf', 'np'], say: 'B R B. Be right back.', why: 'brb ย่อมาจาก be right back = เดี๋ยวกลับมา' },
  { q: 'สนุกมาก อยากชวนเล่นต่ออีกตา', a: 'One more game?', o: ['I have to go now.', 'Good night!', 'Fall back!'] },
  { q: 'คุณทำพลาดจนทีมแพ้ไฟต์ อยากยอมรับผิด', a: 'My bad.', o: ['Good job!', 'So lucky!', 'Calm down.'] },
  { q: 'เพื่อนพิมพ์ว่า "afk 5 min" หมายความว่าอะไร', a: 'ไม่อยู่หน้าจอ 5 นาที', o: ['อีก 5 นาทีจะออกจากเกม', 'แพ้มา 5 ตาแล้ว', 'รอเริ่มเกมอีก 5 นาที'], why: 'afk = away from keyboard' },
  { q: 'ตอนเริ่มเกม มีคนพิมพ์ว่า "glhf" ควรตอบอย่างไร', a: 'You too!', o: ['Me too!', 'No problem.', 'I agree.'], why: 'glhf = good luck, have fun ตอบกลับว่า You too! (คุณก็เหมือนกัน)' },
  { q: 'คุยในวอยซ์แต่ไม่ได้ยินเสียงเพื่อนเลย', a: "I can't hear you.", o: ["I don't know.", 'Can you add me?', "I'm ready."] },
  { q: 'เลือดเหลือน้อย อยากให้เพื่อนช่วยฮีล', a: "I'm low on health. Heal me, please.", o: ['I need ammo.', 'Push now!', 'Go left.'] },
  { q: 'อยากรู้ว่าเพื่อนใหม่มาจากประเทศไหน', a: 'Where are you from?', o: ['How old are you?', 'What time is it?', 'Where are you going?'] },
  { q: 'อยากได้ช่องทางคุยกันนอกเกม', a: 'Do you have Discord?', o: ['Do you have a game?', 'Can you hear me?', "What's your rank?"] },
  { q: 'เพื่อนพิมพ์ "ty" มาหาคุณ ควรตอบว่าอะไร', a: 'np', o: ['ty', 'brb', 'idk'], say: 'N P. No problem.', why: 'ty = thank you ตอบด้วย np = no problem' },
  { q: 'ทีมแยกกันวิ่งคนละทาง อยากให้รวมกลุ่ม', a: 'Stay together.', o: ['Go right.', 'Cover me.', 'One more game?'] },
  { q: 'มีคนพิมพ์ "ez noob" ใส่คุณหลังจบเกม ควรทำอย่างไรดี', a: 'ไม่ต้องสนใจ หรือพิมพ์ gg แล้วไปเล่นต่อ', o: ['ด่ากลับให้แรงกว่า', 'พิมพ์ว่า ez กลับไป', 'ออกจากเกมทันทีและเลิกเล่น'], why: 'คนแบบนี้เรียกว่า toxic ไม่ต้องเสียเวลาด้วย' },
  { q: 'เพื่อนพูดคำที่คุณไม่รู้ความหมาย', a: 'What does that mean?', o: ['What is your name?', "That's awesome!", 'See you later!'] },
];

export interface Scenario { id: string; label: string; blurb: string; role: string; starters: [string, string][] }

export const SCENARIOS: Scenario[] = [
  {
    id: 'team', label: 'เพื่อนร่วมทีมในเกมยิง', blurb: 'Alex จากแคนาดา กำลังรอเริ่มรอบถัดไปกับคุณ',
    role: 'Alex, a friendly teammate from Canada in an online shooter game. You two are in the same squad, waiting for the next round to start',
    starters: [['Hi! Are you ready?', 'สวัสดี พร้อมยัง'], ['Where should we go?', 'เราควรไปทางไหนดี'], ["Let's go!", 'ลุยกันเลย']],
  },
  {
    id: 'discord', label: 'เพื่อนใหม่ใน Discord', blurb: 'Mia จากออสเตรเลีย เพิ่งเจอกันในเซิร์ฟเวอร์เกม',
    role: 'Mia, a friendly gamer from Australia who just met the learner on a Discord server for game fans',
    starters: [['Hi! Nice to meet you.', 'สวัสดี ยินดีที่ได้รู้จัก'], ['What games do you play?', 'คุณเล่นเกมอะไรบ้าง'], ["I'm from Thailand.", 'ฉันมาจากประเทศไทย']],
  },
  {
    id: 'coach', label: 'ผู้เล่นเก่งช่วยสอนเกม', blurb: 'Leo จากอเมริกา ใจเย็นและชอบสอนมือใหม่',
    role: 'Leo, an experienced, patient player from the USA who is happy to help a new player learn the game',
    starters: [["I'm new to this game.", 'ฉันเพิ่งเริ่มเล่นเกมนี้'], ['How do I do this?', 'อันนี้ทำยังไง'], ['Can you teach me?', 'สอนฉันหน่อยได้ไหม']],
  },
  {
    id: 'free', label: 'คุยเรื่องทั่วไป', blurb: 'Sam ชวนคุยได้ทุกเรื่อง ทั้งเกม อาหาร และชีวิตประจำวัน',
    role: 'Sam, a friendly English-speaking gamer who likes to chat about games, food, music, daily life and Thailand',
    starters: [['Hi! How are you?', 'สวัสดี สบายดีไหม'], ['What do you do for fun?', 'ปกติชอบทำอะไรสนุก ๆ'], ['Have you been to Thailand?', 'เคยมาประเทศไทยไหม']],
  },
];

export function chatPrompt(sc: Scenario): string {
  return 'ช่วยเล่นบทบาทสมมติเพื่อฝึกภาษาอังกฤษให้หน่อย\n\n' +
    'You are ' + sc.role + '. Chat with me in very simple English (I am a Thai beginner, CEFR A1-A2). ' +
    'Keep each reply to 1-2 short sentences and ask me one easy question each time. ' +
    'After each of my messages, if my English has mistakes, first show the corrected sentence and explain the mistake briefly in Thai, then continue the chat in character. ' +
    'If I write in Thai, show me how to say it in English. Start now with a short greeting.';
}

export type Kind = 'listen' | 'speak' | 'read' | 'write' | 'chat';

export interface Mission { k: Kind; label: string; unit: string; goal: number }

export const MISSIONS: Mission[] = [
  { k: 'listen', label: 'ฟังแล้วพิมพ์ตาม', unit: 'ประโยค', goal: 10 },
  { k: 'speak', label: 'ฝึกพูดออกเสียง', unit: 'ประโยค', goal: 10 },
  { k: 'read', label: 'อ่านแล้วเลือกคำตอบ', unit: 'ข้อ', goal: 10 },
  { k: 'write', label: 'เขียนประโยคจากภาษาไทย', unit: 'ประโยค', goal: 10 },
  { k: 'chat', label: 'คุยภาษาอังกฤษกับ AI', unit: 'ข้อความ', goal: 6 },
];

/** Days until a sentence comes back for review, by how many times in a row it was right. */
export const INTERVALS = [0, 1, 2, 4, 7, 15, 30];

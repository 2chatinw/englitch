import { CATS, PHRASES, type Category, type Phrase } from '../data/content';
import { GLOSS, MULTI } from '../data/glossary';

/**
 * "Explain this sentence" after an answer (owner's request): what it means, when to use it, how it is built
 * (sentence patterns and grammar, in Thai), the meaning of each word, and similar sentences from the app.
 * Built from rules + the glossary, so it works for every phrase without writing 1,220 explanations by hand.
 */
export interface Explanation {
  meaning: string;
  when: string;
  tone: string | null;
  note: string | null;
  patterns: { title: string; body: string }[];
  words: { w: string; th: string }[];
  more: Similar[];
}

/** When each kind of sentence is used. */
const USAGE: Record<Category, string> = {
  basics: 'ใช้ตอนเริ่มคุยหรือทักทายคนที่เพิ่งรู้จัก ทั้งเจอตัวจริงและคุยออนไลน์',
  help: 'ใช้ตอนฟังไม่ทันหรือไม่เข้าใจ ช่วยให้คุยต่อได้ ไม่ต้องอาย เจ้าของภาษาก็ใช้บ่อย',
  game: 'ใช้ชวนเพื่อนเล่นเกม หรือคุยกันระหว่างเล่นด้วยกัน',
  callout: 'ใช้คอลบอกทีมระหว่างเกม เน้นสั้น เร็ว ชัด',
  react: 'ใช้แสดงความรู้สึกหรือรีแอคกับสิ่งที่เพิ่งเกิดขึ้น',
  friend: 'ใช้คุยทำความรู้จัก ถามเรื่องชีวิต งานอดิเรก และความชอบ',
  slang: 'ศัพท์ย่อในแชต ใช้กับเพื่อนแบบไม่เป็นทางการ ไม่ใช้ในงานหรืออีเมล',
  daily: 'ใช้ในชีวิตประจำวัน เช่น ซื้อของ สั่งอาหาร นัดเพื่อน',
  airport: 'ใช้ที่สนามบิน ตั้งแต่เช็กอิน ผ่าน ตม. จนถึงบนเครื่อง',
  hotel: 'ใช้ที่โรงแรม ตั้งแต่เช็กอิน ขอของ แจ้งปัญหา จนเช็กเอาต์',
  directions: 'ใช้ถามทางและเดินทางในเมือง ทั้งเดินเท้า รถไฟ รถบัส แท็กซี่',
  emergency: 'ใช้ตอนฉุกเฉิน ขอความช่วยเหลือ ไปโรงพยาบาล หรือแจ้งตำรวจ',
  meeting: 'ใช้ในการประชุมหรือการนำเสนองาน ควรพูดสุภาพและชัดเจน',
  email: 'ใช้เขียนอีเมลงาน ภาษาสุภาพและเป็นทางการกว่าตอนพูด',
  interview: 'ใช้ตอนสัมภาษณ์งาน ทั้งตอบคำถามและถามกลับผู้สัมภาษณ์',
  office: 'ใช้คุยกับเพื่อนร่วมงาน ขอความช่วยเหลือ และต่อรองเรื่องงาน',
  class: 'ใช้ในห้องเรียน คุยกับอาจารย์และเพื่อนร่วมชั้น',
  essay: 'ใช้ในเรียงความหรือรายงานวิชาการ เป็นภาษาเขียนแบบทางการ',
  exam: 'ใช้เกี่ยวกับการสอบ และในการพูด/เขียนข้อสอบอย่าง IELTS',
  idiom: 'เป็นสำนวน ความหมายจริงไม่ได้ตรงตามคำ ต้องจำทั้งวลี ใช้ในการพูดแบบเป็นกันเอง',
  media: 'ใช้คุยเรื่องหนัง เพลง ซีรีส์ และศิลปินที่ชอบ',
  social: 'ใช้บนโซเชียลมีเดีย เช่น คอมเมนต์ แชร์ โพสต์',
  medical: 'ศัพท์และประโยคที่หมอ พยาบาล และคนไข้ใช้ในโรงพยาบาล',
  it: 'ศัพท์ที่โปรแกรมเมอร์และคนทำงานไอทีใช้คุยกันในทีม',
  aviation: 'ศัพท์การบินที่นักบิน ลูกเรือ และหอบังคับการบินใช้',
};

/** Sentence patterns, most specific first; each explains the structure in Thai with a short formula. */
const PATTERNS: { re: RegExp; title: string; body: string }[] = [
  { re: /\bwould you mind\b|\bdo you mind\b/i, title: 'Would/Do you mind + V-ing …?', body: 'ขอร้องแบบสุภาพมาก แปลตรง ๆ ว่า "คุณจะรังเกียจไหมถ้า…" ถ้ายินดีช่วยให้ตอบ "No, not at all." (ไม่รังเกียจเลย)' },
  { re: /\b(i'd|i would) like\b/i, title: "I'd like (to) …", body: "บอกว่าต้องการอะไรแบบสุภาพ (I'd = I would) สุภาพกว่า I want ใช้สั่งอาหาร ขอบริการ หรือขอสิ่งของ เช่น I'd like a coffee. / I'd like to book a room." },
  { re: /^(could|can) you\b/i, title: 'Can / Could you + กริยา …?', body: 'ขอให้อีกฝ่ายช่วยทำอะไรให้ Could สุภาพกว่า Can เติม please ท้ายประโยคให้สุภาพขึ้นอีก' },
  { re: /^(can|could|may) i\b/i, title: 'Can / Could / May I + กริยา …?', body: 'ขออนุญาตหรือขอสิ่งของ May I สุภาพที่สุด Could I สุภาพ Can I ใช้ทั่วไป' },
  { re: /^(do|does|did) (you|we|they|he|she|it|i)\b/i, title: 'Do / Does / Did + ประธาน + กริยา …?', body: 'คำถามที่ตอบ yes หรือ no ได้ Do ใช้กับปัจจุบัน Does ใช้กับ he/she/it Did ใช้ถามเรื่องที่ผ่านไปแล้ว กริยาหลังจากนี้ใช้รูปปกติเสมอ' },
  { re: /^(have|has) (you|we|they|he|she|it)( ever)?\b/i, title: 'Have you (ever) + V3 …?', body: 'ถามว่า "เคย…ไหม" หรือ "…แล้วหรือยัง" (Present Perfect) กริยาเป็นช่องที่ 3 เช่น Have you ever been to Japan?' },
  { re: /^(is|are) there\b/i, title: 'Is / Are there … ?', body: 'ถามว่า "มี…ไหม" ใช้ Is there กับของชิ้นเดียว Are there กับหลายชิ้น' },
  { re: /\bthere (is|are|'s)\b/i, title: 'There is / There are …', body: 'บอกว่า "มี…อยู่" There is ใช้กับสิ่งเดียว There are ใช้กับหลายสิ่ง' },
  { re: /^where (is|are|'s|can|do)\b|^where's\b/i, title: 'Where …?', body: 'ถามสถานที่ "…อยู่ที่ไหน" ตอบด้วยบุพบทบอกตำแหน่ง เช่น It\'s next to… / on the left / across from…' },
  { re: /^how much\b/i, title: 'How much …?', body: 'ถามราคา ("How much is it?") หรือปริมาณของที่นับไม่ได้ ถ้านับได้ใช้ How many' },
  { re: /^how many\b/i, title: 'How many + นามพหูพจน์ …?', body: 'ถามจำนวนของที่นับได้ เช่น How many people? คำนามหลัง How many ต้องเติม s' },
  { re: /^how long\b/i, title: 'How long …?', body: 'ถามระยะเวลา "นานเท่าไหร่" ตอบด้วย for + เวลา หรือ about + เวลา' },
  { re: /^how (do|can|should) (i|we|you)\b/i, title: 'How do / can I …?', body: 'ถามวิธีการ "ทำ…ยังไง" เป็นคำถามที่ใช้ได้แทบทุกสถานการณ์' },
  { re: /^how about\b|^what about\b/i, title: 'How about / What about …?', body: 'เสนอความคิดหรือชวน "…ดีไหม" ตามด้วยคำนามหรือกริยาเติม -ing เช่น How about going tomorrow?' },
  { re: /^why don't (we|you)\b/i, title: "Why don't we …?", body: 'ชวนหรือแนะนำแบบเป็นกันเอง ความหมายคือ "…กันไหม" ไม่ได้ถามเหตุผลจริง ๆ' },
  { re: /^what time\b/i, title: 'What time …?', body: 'ถามเวลา "กี่โมง" ตอบด้วย at + เวลา เช่น at 7 p.m.' },
  { re: /^what (does|do) .* mean\b/i, title: 'What does … mean?', body: 'ถามความหมายของคำหรือประโยคที่ไม่เข้าใจ ประโยคสำคัญสำหรับผู้เรียน' },
  { re: /^what'?s your\b|^what is your\b/i, title: "What's your …?", body: 'ถามข้อมูลของอีกฝ่าย เช่น ชื่อ อาชีพ ของที่ชอบ (What\'s = What is)' },
  { re: /^(what|who|which|when|why|how)\b/i, title: 'คำถามขึ้นต้นด้วย Wh-', body: 'ถามข้อมูล ไม่ได้ตอบแค่ yes/no: what = อะไร, who = ใคร, which = อันไหน, when = เมื่อไหร่, why = ทำไม, how = อย่างไร น้ำเสียงจะลงท้ายต่ำ' },
  { re: /^let's\b|^let us\b/i, title: "Let's + กริยา", body: 'ชวนทำอะไรด้วยกัน "…กันเถอะ" (Let\'s = Let us) กริยาหลัง Let\'s ใช้รูปปกติ' },
  { re: /^let me\b/i, title: 'Let me + กริยา', body: 'บอกว่า "ขอฉัน…นะ / เดี๋ยวฉัน…" ใช้เสนอตัวทำอะไรหรือขอเวลา เช่น Let me check.' },
  { re: /\bthank(s| you) for\b/i, title: 'Thank you / Thanks for + คำนาม / V-ing', body: 'ขอบคุณที่… ถ้าตามด้วยการกระทำให้เติม -ing เช่น Thanks for helping me. Thanks สั้นและเป็นกันเองกว่า' },
  { re: /\b(i'm|i am) going to\b|\bgonna\b/i, title: 'be going to + กริยา', body: 'พูดถึงสิ่งที่ตั้งใจหรือวางแผนจะทำ เป็นอนาคตที่คิดไว้แล้ว (gonna เป็นภาษาพูด)' },
  { re: /\b(i'll|we'll|you'll|it'll|will)\b/i, title: 'will + กริยา', body: 'อนาคต หรือการตัดสินใจ/สัญญาตอนที่พูด เช่น I\'ll call you. (I\'ll = I will)' },
  { re: /\b(have|has|need) to\b|\bmust\b/i, title: 'have to / need to / must + กริยา', body: 'บอกว่า "ต้อง…" must หนักแน่นที่สุด (มักเป็นกฎ) have to = จำเป็นต้องทำ need to = ควรต้องทำ' },
  { re: /\bneed\b/i, title: 'need + คำนาม', body: 'บอกว่า "ต้องการ/จำเป็นต้องมี" สิ่งนั้น ตรงกว่า want ใช้ตอนจำเป็นจริง ๆ' },
  { re: /\b(want to|wanna)\b/i, title: 'want to + กริยา', body: 'บอกว่า "อยาก…" (wanna เป็นภาษาพูด) ถ้าอยากสุภาพขึ้นใช้ would like to' },
  { re: /\bshould\b/i, title: 'should + กริยา', body: 'แนะนำหรือบอกสิ่งที่ "ควร" ทำ ใช้ให้คำแนะนำแบบนุ่มนวล' },
  { re: /\bused to\b/i, title: 'used to + กริยา', body: 'บอกสิ่งที่ "เคยทำเป็นประจำในอดีต แต่ตอนนี้ไม่ทำแล้ว"' },
  { re: /\bif\b/i, title: 'ประโยคเงื่อนไข If …', body: 'บอกว่า "ถ้า… ก็…" ส่วนหลัง if คือเงื่อนไข ใช้ปัจจุบันกับเรื่องที่เป็นไปได้ ใช้ would กับเรื่องสมมติ' },
  { re: /\bwould\b/i, title: 'would + กริยา', body: 'ใช้พูดสุภาพ หรือพูดถึงเรื่องสมมติ "จะ…(ถ้า…)"' },
  { re: /\b(have|has|'ve|’ve)\s+(been|\w+ed|seen|done|gone|heard|had|got|made|known|taken|written|won|lost|found|sent|left)\b/i, title: 'Present Perfect: have/has + V3', body: 'เรื่องที่เกิดขึ้นแล้วและยังเกี่ยวกับตอนนี้ หรือประสบการณ์ที่ "เคย" เช่น I\'ve finished. = ทำเสร็จแล้ว (ตอนนี้เสร็จอยู่)' },
  { re: /\b(is|are|was|were|be|been|being|get|got)\s+\w+(ed|en)\b/i, title: 'Passive: be + V3', body: 'ประโยคแบบ "ถูก…" เน้นสิ่งที่ถูกกระทำมากกว่าคนทำ พบบ่อยในภาษาทางการ ประกาศ และงานวิชาการ' },
  { re: /\b(am|is|are|'m|'re|'s)\s+\w+ing\b/i, title: 'กำลัง…: be + V-ing', body: 'บอกสิ่งที่กำลังเกิดขึ้นตอนนี้ หรือแผนที่นัดไว้แล้วในอนาคตอันใกล้' },
  { re: /\b(was|were)\b/i, title: 'อดีต: was / were', body: 'พูดถึงสภาพหรือเหตุการณ์ในอดีต was ใช้กับ I/he/she/it were ใช้กับ you/we/they' },
  { re: /\b(because|since|so that)\b/i, title: 'บอกเหตุผล: because / since', body: 'เชื่อมประโยคเพื่อบอกเหตุผล "เพราะ…" ส่วนผลลัพธ์ใช้ so (ดังนั้น)' },
  { re: /\b(but|although|though|however|whereas)\b/i, title: 'แย้งหรือเปรียบเทียบ: but / although / however', body: 'เชื่อมสองความคิดที่ขัดกัน but ใช้ทั่วไป although/though = ถึงแม้ว่า however เป็นทางการ ใช้ต้นประโยคตามด้วย ,' },
  { re: /\b(firstly|secondly|finally|in addition|furthermore|moreover|therefore|in conclusion)\b/i, title: 'คำเชื่อมแบบทางการ', body: 'ใช้เรียงลำดับความคิดในงานเขียนหรือการนำเสนอ เช่น Firstly (ประการแรก) In addition (นอกจากนี้) Therefore (ดังนั้น)' },
  { re: /\b(i think|in my opinion|i believe)\b/i, title: 'บอกความเห็น: I think …', body: 'ใส่หน้าความเห็นของตัวเองให้นุ่มนวลขึ้น ไม่ฟังดูฟันธงเกินไป' },
  { re: /^(sorry|i'm sorry|excuse me)\b/i, title: 'Sorry / Excuse me', body: 'Sorry = ขอโทษเมื่อทำผิดหรือขอให้พูดซ้ำ ส่วน Excuse me ใช้เรียกความสนใจหรือขอทางก่อนเริ่มพูด' },
  { re: /^(don't|do not|never)\b/i, title: "Don't + กริยา", body: 'ประโยคห้าม "อย่า…" ใช้เตือนหรือห้าม ถ้าอยากนุ่มนวลขึ้นเติม please ข้างหน้า' },
  { re: /\b(can't|cannot|couldn't)\b/i, title: "can't + กริยา", body: 'บอกว่า "ทำไม่ได้" (can\'t = cannot) couldn\'t ใช้กับอดีต' },
  { re: /^(is|are|am) (it|this|that|there|you|he|she|they|we|i)\b/i, title: 'Is / Are + ประธาน …?', body: 'คำถาม yes/no ที่ใช้ verb to be ย้าย is/are ขึ้นหน้าประโยค เช่น It is open. → Is it open? น้ำเสียงขึ้นท้ายประโยค' },
  { re: /^(can|will|should|shall) (we|i|you|it|they|he|she)\b/i, title: 'Can / Will / Should + ประธาน + กริยา …?', body: 'คำถาม yes/no โดยยกคำช่วยขึ้นหน้าประโยค กริยาหลังจากนี้ใช้รูปปกติเสมอ' },
  { re: /\b(i|we|you|they) (like|love|enjoy|hate)\b/i, title: 'like / love / enjoy + คำนาม / V-ing', body: 'บอกความชอบ like = ชอบ, love = ชอบมาก, enjoy = สนุกกับ ถ้าตามด้วยกิจกรรมให้เติม -ing เช่น I love cooking.' },
  { re: /^(i'm|i am|we're|we are|you're|you are|they're|he's|she's)\b/i, title: 'ประธาน + be + คำคุณศัพท์ / คำนาม', body: "บอกว่าเป็นอะไร อยู่ในสภาพไหน หรือรู้สึกยังไง ใช้ am กับ I, is กับ he/she/it, are กับ you/we/they (I'm = I am)" },
  { re: /^(it's|it is|this is|that's|that is|these are|those are)\b/i, title: "It's / This is / That's …", body: "บอกลักษณะหรือแนะนำสิ่งของ/สถานการณ์ It's ใช้พูดถึงสิ่งที่รู้กันอยู่ This is = นี่คือ (ใกล้ตัว) That's = นั่นคือ (ไกลออกไปหรือเพิ่งพูดถึง)" },
  { re: /^(i|we|you|they) (have|has|got)\b/i, title: 'have + คำนาม', body: 'บอกว่า "มี" สิ่งนั้น ใช้ have กับ I/you/we/they และ has กับ he/she/it' },
  { re: /^(please )?(keep|take|turn|go|wait|check|follow|stay|hold|press|fasten|put|bring|call|send|open|close|come|look|watch|try|give|tell|make|use|stop|cover|push|fall|grab|drop|pass|return|remain|fill|read|write|listen|repeat|cite|define|compare|describe|explain|discuss|summarize|switch|restart|mute|enable|update|deploy|merge|reset|save|hurry|focus|move|let|leave|meet|enjoy|have|be|kill|heal|revive|throw|plant|defuse|rotate|retreat|clear|share|subscribe|join|vote|sign|pick|show|ask|talk|sit|stand|breathe|relax|rest|drink|eat|avoid|remember|forget)\b/i, title: 'ประโยคคำสั่ง / ขอร้อง: ขึ้นต้นด้วยกริยา', body: 'ไม่มีประธาน ขึ้นต้นด้วยกริยาเลย ใช้บอกให้ทำ ขอร้อง หรือแนะนำ เติม please ให้สุภาพขึ้น' },
  { re: /\b(i|we|you|they|he|she|it) \w+ed\b/i, title: 'อดีต: กริยาเติม -ed', body: 'เล่าเรื่องที่เกิดขึ้นแล้ว กริยาปกติเติม -ed (play → played) กริยาบางตัวเปลี่ยนรูปเอง เช่น go → went, see → saw' },
  { re: /\bplease\b/i, title: 'please', body: 'คำที่ทำให้ประโยคขอร้องสุภาพขึ้น วางได้ทั้งต้นและท้ายประโยค' },
];

const STOP = new Set(("a an the i you he she it we they me him her us them my your his its our their mine yours is am are was were be been being do does did done to of in on at for with from by as and or but so if not no yes this that these those there here what who whom whose which when where why how can could will would shall should may might must have has had i'm you're he's she's it's we're they're i've you've we've they've i'll you'll we'll it'll i'd you'd don't doesn't didn't can't won't isn't aren't wasn't weren't haven't hasn't couldn't wouldn't shouldn't let's that's what's there's here's who's where's how's up down out off just very too also all any some one two get got go going").split(' '));

/** dictionary lookup, trying the word as it is and then without -s / -es / -ed / -ing */
function gloss(w: string): string | null {
  const tries = [w];
  if (w.endsWith('ies')) tries.push(w.slice(0, -3) + 'y');
  if (w.endsWith('ied')) tries.push(w.slice(0, -3) + 'y');
  if (w.endsWith('es')) tries.push(w.slice(0, -2));
  if (w.endsWith('s')) tries.push(w.slice(0, -1));
  if (w.endsWith('ed')) tries.push(w.slice(0, -2), w.slice(0, -1), w.slice(0, -3));
  if (w.endsWith('ing')) tries.push(w.slice(0, -3), w.slice(0, -3) + 'e', w.slice(0, -4));
  for (const t of tries) { const g = GLOSS.get(t); if (g) return g; }
  return null;
}

function tone(p: Phrase): string | null {
  const e = p.e;
  if (p.c === 'slang' || /\b(gonna|wanna|bro|lol|gg|sus|lit|low-key|stan|haha|oops)\b/i.test(e)) return 'กันเอง (ใช้กับเพื่อน)';
  if (p.c === 'essay' || p.c === 'email' || /\b(however|therefore|furthermore|moreover|regarding|apologies|inconvenience|kind regards)\b/i.test(e)) return 'ทางการ';
  if (/\b(please|could you|would you|may i|i'd like|excuse me)\b/i.test(e)) return 'สุภาพ';
  return null;
}

/**
 * "Similar sentences" (owner: they must really be alike, not just any two from the same topic). Each candidate is
 * scored by how close the Thai meaning is (shared Thai letter pairs), shared English content words and the same
 * sentence pattern. Only ones that pass get shown, each with the reason; none pass → the section is hidden.
 */
export interface Similar extends Phrase { why: string }
/** Common words that don't make two sentences alike. */
const WEAK = new Set('about please thanks thank ok okay yeah really like know think want need now well good great nice right sure lot much more time way thing things today'.split(' '));
const enWords = (s: string) => {
  const out = new Set<string>();
  for (const raw of s.toLowerCase().replace(/’/g, "'").replace(/[^a-z' -]/g, ' ').split(/[\s-]+/)) {
    const w = raw.replace(/^'+|'+$/g, '');
    if (w.length < 2 || STOP.has(w) || WEAK.has(w)) continue;
    out.add(w.length > 3 && w.endsWith('s') && !w.endsWith('ss') ? w.slice(0, -1) : w);
  }
  return out;
};
/** Thai little words (you, I, question endings, "is at" …) that make unrelated sentences look close. */
const TH_FILLER = /คุณ|ฉัน|เรา|ไหม|มั้ย|หรือเปล่า|อยู่|ที่ไหน|อะไร|ยังไง|อย่างไร|หน่อย|ได้|ครับ|ค่ะ|เลย|แล้ว|จะ|ให้|กับ|เป็น|ไม่|นี้|นั้น/g;
const thPairs = (s: string) => {
  const t = s.replace(/\(.*?\)/g, '').replace(TH_FILLER, ' ').replace(/[^฀-๿ ]/g, '');
  const out = new Set<string>();
  for (let i = 0; i < t.length - 1; i++) if (t[i] !== ' ' && t[i + 1] !== ' ') out.add(t.slice(i, i + 2));
  return out;
};
type Keys = { en: Set<string>; th: Set<string>; pat: number };
const keyCache = new Map<string, Keys>();
const keysOf = (x: Phrase): Keys => {
  let k = keyCache.get(x.e);
  if (!k) {
    const e = x.e.replace(/’/g, "'");
    // only patterns specific enough to mean "built the same way" (not the generic Wh-/statement/past ones)
    const pat = PATTERNS.findIndex((y) => y.re.test(e));
    k = { en: enWords(x.e), th: thPairs(x.t), pat: pat >= 0 && !GENERIC.test(PATTERNS[pat].title) ? pat : -1 };
    keyCache.set(x.e, k);
  }
  return k;
};
/** Patterns too general to count as "built the same way" (tense, linking words, plain statements …). */
const GENERIC = /^(คำถามขึ้นต้นด้วย Wh-|will|need \+|should|ประโยคเงื่อนไข|would \+|Present Perfect|Passive|กำลัง|อดีต|บอกเหตุผล|แย้ง|คำเชื่อม|บอกความเห็น|can't|Is \/ Are \+ ประธาน|Can \/ Will|like \/ love|ประธาน \+ be|It's|have \+|ประโยคคำสั่ง|please)/;

function similar(p: Phrase): Similar[] {
  const a = keysOf(p);
  const scored: { x: Phrase; s: number; why: string }[] = [];
  for (const x of PHRASES) {
    // chat slang only goes with chat slang (an abbreviation isn't a good model for a normal sentence)
    if (x.e === p.e || (x.c === 'slang') !== (p.c === 'slang')) continue;
    const b = keysOf(x);
    let inTh = 0;
    for (const g of a.th) if (b.th.has(g)) inTh++;
    const dice = a.th.size && b.th.size ? (2 * inTh) / (a.th.size + b.th.size) : 0;
    const shared = [...a.en].filter((w) => b.en.has(w));
    const samePat = a.pat >= 0 && a.pat === b.pat;
    const near = dice >= 0.45;
    if (!near && !shared.length && !samePat) continue;
    // a shared word or pattern alone is weak: also need some closeness in meaning or the same topic
    if (!near && !(shared.length >= 2) && !(dice >= 0.2 || x.c === p.c)) continue;
    const s = dice * 6 + shared.length * 2 + (samePat ? 1.5 : 0) + (x.c === p.c ? 1 : 0) + (x.g === p.g ? 0.5 : 0);
    const why = near ? 'ความหมายใกล้กัน'
      : shared.length ? `ใช้คำว่า ${shared.slice(0, 2).join(', ')} เหมือนกัน`
      : 'รูปประโยคเดียวกัน: ' + PATTERNS[a.pat].title;
    scored.push({ x, s, why });
  }
  scored.sort((m, n) => n.s - m.s);
  return scored.slice(0, 2).map(({ x, why }) => ({ ...x, why }));
}

export function explain(p: Phrase): Explanation {
  const e = p.e.replace(/’/g, "'");
  const patterns: Explanation['patterns'] = [];
  for (const x of PATTERNS) {
    if (patterns.length >= 3) break;
    if (x.re.test(e) && !patterns.some((y) => y.title === x.title)) patterns.push({ title: x.title, body: x.body });
  }
  if (!patterns.length) {
    if (p.c === 'slang') patterns.push({ title: 'คำย่อในแชต', body: 'ย่อจากคำเต็มเพื่อพิมพ์ให้เร็ว ใช้ในแชตกับเพื่อนหรือในเกม ไม่ใช้ในงานเขียนจริงจัง' });
    else if (p.c === 'idiom') patterns.push({ title: 'สำนวน: จำทั้งวลี', body: 'แปลทีละคำแล้วไม่ได้ความหมายจริง ให้จำทั้งก้อนและสถานการณ์ที่ใช้ เปลี่ยนคำในสำนวนไม่ได้' });
    else if (/\?\s*$/.test(e)) patterns.push({ title: 'ประโยคคำถาม', body: 'ลงท้ายด้วยเครื่องหมาย ? ถ้าตอบ yes/no ได้ น้ำเสียงจะขึ้นท้าย ถ้าเป็นคำถาม Wh- น้ำเสียงจะลง' });
    else if (e.split(/\s+/).length <= 3) patterns.push({ title: 'วลีสั้น ๆ ใช้พูดได้เลย', body: 'ไม่ต้องเป็นประโยคเต็ม เจ้าของภาษาใช้แบบนี้บ่อยในการพูด จำทั้งวลีไว้ใช้ได้ทันที' });
    else patterns.push({ title: 'ประโยคบอกเล่า: ประธาน + กริยา + ส่วนขยาย', body: 'โครงสร้างพื้นฐานของภาษาอังกฤษ เริ่มด้วยใคร/อะไร (ประธาน) ตามด้วยทำอะไร (กริยา) แล้วตามด้วยรายละเอียด' });
  }
  const seen = new Set<string>();
  const words: Explanation['words'] = [];
  const low = ' ' + e.toLowerCase().replace(/[^a-z' -]/g, ' ').replace(/\s+/g, ' ') + ' ';
  if (p.c !== 'slang') {
    // phrases first ("check in", "take a photo"), so their words aren't explained one by one
    for (const [m, th] of MULTI) {
      if (words.length >= 4) break;
      if (low.includes(' ' + m + ' ')) { words.push({ w: m, th }); m.split(' ').forEach((x) => seen.add(x)); }
    }
    // "I'd like" / "would like" is a polite "want", not "like"
    if (/\b(i'd|would|you'd|we'd) like\b/.test(low)) seen.add('like');
    for (const raw of low.split(' ')) {
      const w = raw.replace(/^'+|'+$/g, '');
      if (!w || STOP.has(w) || seen.has(w)) continue;
      seen.add(w);
      const th = gloss(w);
      if (th) words.push({ w, th });
      if (words.length >= 8) break;
    }
  }
  const more = similar(p);
  return {
    meaning: p.t,
    when: CATS[p.c] + ' · ' + USAGE[p.c],
    tone: tone(p),
    note: p.n || null,
    patterns,
    words,
    more,
  };
}

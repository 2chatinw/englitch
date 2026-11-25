import { useState } from 'react';
import { SCENARIOS, chatPrompt } from '../data/content';
import { Icon } from '../components/Icon';
import { PageHead, SpeakButton } from '../components/ui';
import { useProgress } from '../state/progress';
import { useToast } from '../state/toast';
import { useSession } from '../state/session';
import { copyText } from '../lib/util';

export default function Chat() {
  const { day, gain } = useProgress();
  const toast = useToast();
  const [id, setId] = useSession<string>('chat-scenario', () => SCENARIOS[0].id);
  const [copied, setCopied] = useState(false);
  const sc = SCENARIOS.find((x) => x.id === id) ?? SCENARIOS[0];
  const prompt = chatPrompt(sc);

  const copy = async () => {
    if (await copyText(prompt)) { setCopied(true); toast('คัดลอกแล้ว เปิด Claude หรือ ChatGPT แล้ววางได้เลย'); }
    else {
      const ta = document.getElementById('prompt-box') as HTMLTextAreaElement | null;
      ta?.focus(); ta?.select();
      toast('เลือกข้อความให้แล้ว กดคัดลอกเอง');
    }
  };

  return (
    <div className="page">
      <PageHead route="chat" aside={<span className="pill num">วันนี้ {day.chat} ข้อความ</span>}>
        ฝึกคุยจริงกับ AI ฟรี ผ่าน Claude หรือ ChatGPT AI จะเล่นเป็นเพื่อนต่างชาติ และช่วยแก้ประโยคให้เป็นภาษาไทย
      </PageHead>

      <section className="card" data-reveal>
        <div className="section-head"><h2><span className="step-n num">1</span> เลือกคนที่จะคุยด้วย</h2></div>
        <div className="scenarios" role="radiogroup" aria-label="สถานการณ์">
          {SCENARIOS.map((x) => (
            <button key={x.id} type="button" role="radio" aria-checked={x.id === sc.id} className="scenario"
              onClick={() => { setId(x.id); setCopied(false); }}>
              <b>{x.label}</b>
              <span className="muted small">{x.blurb}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card" data-reveal>
        <div className="section-head"><h2><span className="step-n num">2</span> คัดลอกคำสั่ง แล้วเปิดแชต AI</h2></div>
        <textarea id="prompt-box" className="prompt-box" readOnly value={prompt} rows={6} aria-label="คำสั่งสำหรับคัดลอก" />
        <div className="row">
          <button type="button" className="btn btn-primary" onClick={copy}><Icon name={copied ? 'check' : 'copy'} /> {copied ? 'คัดลอกแล้ว' : 'คัดลอกคำสั่ง'}</button>
          <a className="btn btn-ghost" href="https://claude.ai/new" target="_blank" rel="noopener noreferrer">เปิด Claude <Icon name="external" /></a>
          <a className="btn btn-ghost" href="https://chatgpt.com/" target="_blank" rel="noopener noreferrer">เปิด ChatGPT <Icon name="external" /></a>
        </div>
      </section>

      <section className="card" data-reveal>
        <div className="section-head"><h2><span className="step-n num">3</span> ประโยคเปิดบทสนทนา</h2></div>
        <p className="muted small">ไม่รู้จะเริ่มยังไง ลองพิมพ์ประโยคเหล่านี้ในแชต</p>
        <ul className="starters">
          {sc.starters.map(([en, th]) => (
            <li key={en}>
              <div><b>{en}</b><span className="muted small">{th}</span></div>
              <div className="row">
                <SpeakButton text={en} quiet label="" />
                <button type="button" className="btn-text" aria-label={'คัดลอก ' + en}
                  onClick={async () => toast((await copyText(en)) ? 'คัดลอก "' + en + '" แล้ว' : 'คัดลอกไม่สำเร็จ')}><Icon name="copy" /></button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card" data-reveal>
        <div className="section-head"><h2><span className="step-n num">4</span> นับข้อความที่ส่ง</h2></div>
        <div className="row between">
          <span className="muted small">ส่งข้อความภาษาอังกฤษไปแล้ว กดนับทีละข้อความ นับเป็นวันที่ฝึกต่อเนื่องด้วย</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => gain('chat', 4)}>+1 ข้อความ</button>
        </div>
      </section>
    </div>
  );
}

# Englitch

เว็บฝึกภาษาอังกฤษฟรี สำหรับมือใหม่ที่อยากคุยกับเพื่อนต่างชาติในเกม

- **การ์ดคำศัพท์** 118 คำและวลี 7 หมวด ทบทวนแบบเว้นระยะ (spaced repetition) วันละ 10 คำใหม่
- **ฝึกฟัง** ฟังแล้วพิมพ์ตาม มีคำใบ้ และยอมรับการสะกดพลาดเล็กน้อย
- **ฝึกพูด** พูดผ่านไมค์ ระบบบอกคำที่ยังไม่ชัด (บน iPhone ใช้ไมค์บนคีย์บอร์ดได้)
- **ควิซสถานการณ์** รอบละ 10 ข้อ พร้อมสรุปข้อที่พลาด
- **คุยกับ AI** คัดลอกคำสั่งไปฝึกแชตกับ Claude หรือ ChatGPT ได้ฟรี
- ภารกิจรายวัน, XP, เลเวล, วันต่อเนื่อง, โหมดมืด, ติดตั้งลงหน้าจอโฮมได้

ความคืบหน้าเก็บในเบราว์เซอร์ของแต่ละเครื่อง (สำรอง/ย้ายเครื่องได้ด้วยรหัสสำรองในหน้าตั้งค่า)

## พัฒนา

```bash
npm install
npm run dev      # เปิดที่ http://localhost:5173
npm run build    # สร้างไฟล์เว็บใน dist/
```

สร้างด้วย React + Vite + TypeScript และ GSAP (page transitions)

## Deploy (Cloudflare Pages)

เว็บโฮสต์บน Cloudflare Pages ที่เชื่อมกับ repo นี้ ทุกครั้งที่ push ไปที่ `main` Cloudflare จะ build และ deploy ให้อัตโนมัติ

- Build command: `npm run build`
- Build output directory: `dist`
- Environment variable: `NODE_VERSION` = `22`

## ระบบบัญชี (Firebase)

เว็บใช้ Firebase Authentication (Google, อีเมล) และ Cloud Firestore เก็บความคืบหน้ากับกระดานอันดับ
ถ้ายังไม่ใส่ค่าใน `src/firebase.config.ts` เว็บจะทำงานแบบไม่มีบัญชี (เก็บในเครื่อง) ตามปกติ

ตั้งค่าครั้งแรก:

1. ไปที่ https://console.firebase.google.com → **Create a project** (ปิด Google Analytics ได้)
2. **Build → Authentication → Get started** → แท็บ Sign-in method → เปิด **Google** และ **Email/Password**
3. Authentication → **Settings → Authorized domains** → Add domain → โดเมนของเว็บบน Cloudflare (เช่น `englitch.pages.dev`)
4. **Build → Firestore Database → Create database** → เลือก location `asia-southeast1 (Singapore)` → Production mode
5. Firestore → แท็บ **Rules** → วางเนื้อหาจากไฟล์ `firestore.rules` แล้วกด Publish
6. **Project settings (รูปเฟือง) → Your apps → Web (`</>`)** → ตั้งชื่อแอป → คัดลอกค่า `firebaseConfig` มาใส่ใน `src/firebase.config.ts`
7. push ขึ้น `main` Cloudflare จะ build และอัปเดตเว็บเอง

ค่าใน `firebaseConfig` ไม่ใช่ความลับ (ใช้ระบุโปรเจกต์) ความปลอดภัยของข้อมูลมาจาก `firestore.rules`:
แต่ละคนอ่าน/เขียนได้เฉพาะความคืบหน้าของตัวเอง ส่วนกระดานอันดับทุกคนที่ล็อกอินอ่านได้ แต่แก้ได้เฉพาะแถวของตัวเอง

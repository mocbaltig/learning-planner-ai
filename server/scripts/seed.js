const bcrypt = require('bcryptjs');
const db = require('../src/utils/db');
const {
  getCurrentWeekStart,
  getCurrentWeek,
  getWeekEnd,
  getWeekString,
} = require('../src/utils/week');

const SEED_EMAIL = 'budi@mail.com';
const SEED_PASSWORD = 'budi1234';
const ADMIN_EMAIL = 'admin@mail.com';
const ADMIN_PASSWORD = 'admin1234';

async function cleanupUser(email) {
  const res = await db.query('SELECT id FROM users WHERE email = $1', [email]);
  if (res.rows.length === 0) return;
  const userId = res.rows[0].id;
  console.log('  Cleaning existing data for:', email);
  await db.query('DELETE FROM audit_logs WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM progress_snapshots WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM ai_recommendations WHERE user_id = $1', [userId]);
  await db.query(
    'DELETE FROM tasks WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)',
    [userId],
  );
  await db.query('DELETE FROM goals WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM profiles WHERE user_id = $1', [userId]);
  await db.query('DELETE FROM users WHERE id = $1', [userId]);
}

async function seed() {
  console.log('Seeding database...\n');

  // Cleanup existing seed users
  await cleanupUser(SEED_EMAIL);
  await cleanupUser(ADMIN_EMAIL);

  // Date helpers
  const weekStart = getCurrentWeekStart();
  const weekEnd = getWeekEnd(new Date(weekStart));
  const weekStr = getCurrentWeek();
  const addDays = (dateStr, n) => {
    const d = new Date(dateStr);
    d.setDate(d.getDate() + n);
    return d.toISOString().split('T')[0];
  };

  // This week
  const mon = weekStart;
  const tue = addDays(mon, 1);
  const wed = addDays(mon, 2);
  const thu = addDays(mon, 3);
  const fri = addDays(mon, 4);
  const sat = addDays(mon, 5);
  const sun = addDays(mon, 6);

  // Two weeks ago
  const last2Mon = addDays(mon, -14);
  const last2Tue = addDays(mon, -13);
  const last2Wed = addDays(mon, -12);
  const last2Thu = addDays(mon, -11);
  const last2Fri = addDays(mon, -10);
  const last2Sat = addDays(mon, -9);
  const last2Sun = addDays(mon, -8);

  // Last week
  const lastMon = addDays(mon, -7);
  const lastTue = addDays(mon, -6);
  const lastWed = addDays(mon, -5);
  const lastThu = addDays(mon, -4);
  const lastFri = addDays(mon, -3);
  const lastSat = addDays(mon, -2);
  const lastSun = addDays(mon, -1);

  // Next week
  const nextMon = addDays(mon, 7);
  const nextTue = addDays(mon, 8);
  const nextWed = addDays(mon, 9);
  const nextThu = addDays(mon, 10);
  const nextFri = addDays(mon, 11);
  const nextSat = addDays(mon, 12);
  const nextSun = addDays(mon, 13);

  // Two weeks from now
  const next2Mon = addDays(mon, 14);
  const next2Tue = addDays(mon, 15);
  const next2Wed = addDays(mon, 16);
  const next2Thu = addDays(mon, 17);
  const next2Fri = addDays(mon, 18);
  const next2Sat = addDays(mon, 19);
  const next2Sun = addDays(mon, 20);

  const last2WeekStr = getWeekString(new Date(last2Mon));
  const lastWeekStr = getWeekString(new Date(lastMon));
  const nextWeekStr = getWeekString(new Date(nextMon));
  const next2WeekStr = getWeekString(new Date(next2Mon));

  // 1. Create user
  const passwordHash = await bcrypt.hash(SEED_PASSWORD, 10);
  const userRes = await db.query(
    'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id',
    [SEED_EMAIL, passwordHash],
  );
  const userId = userRes.rows[0].id;
  console.log('1. User created:', SEED_EMAIL);

  // 2. Create profile
  await db.query(
    `INSERT INTO profiles (user_id, timezone, preferred_time, weekly_target_hours, availability, llm_token_count)
     VALUES ($1, 'Asia/Jakarta', 'morning', 8.0, $2, 0)`,
    [
      userId,
      JSON.stringify({
        monday: ['morning', 'afternoon', 'evening'],
        tuesday: ['morning', 'afternoon'],
        wednesday: ['morning', 'afternoon', 'evening'],
        thursday: ['morning', 'afternoon'],
        friday: ['morning'],
        saturday: ['morning'],
        sunday: [],
      }),
    ],
  );
  console.log('2. Profile created');

  // 2b. Create admin user
  const adminPasswordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  const adminRes = await db.query(
    'INSERT INTO users (email, password_hash, is_admin) VALUES ($1, $2, true) RETURNING id',
    [ADMIN_EMAIL, adminPasswordHash],
  );
  const adminId = adminRes.rows[0].id;
  await db.query('INSERT INTO profiles (user_id) VALUES ($1)', [adminId]);
  console.log('2b. Admin user created:', ADMIN_EMAIL);

  // 3. Create goals
  const goal1Res = await db.query(
    "INSERT INTO goals (user_id, title, description, deadline) VALUES ($1, 'Belajar React Dasar', 'Memahami fundamental React: komponen, props, state, dan hooks', $2) RETURNING id",
    [userId, addDays(mon, 21)],
  );
  const goal1Id = goal1Res.rows[0].id;

  const goal2Res = await db.query(
    "INSERT INTO goals (user_id, title, description, deadline) VALUES ($1, 'Latihan Calisthenics', 'Rutin calisthenics: push-up, pull-up, squat, plank, L-sit, dan handstand', $2) RETURNING id",
    [userId, addDays(mon, 28)],
  );
  const goal2Id = goal2Res.rows[0].id;

  const goal3Res = await db.query(
    "INSERT INTO goals (user_id, title, description, deadline) VALUES ($1, 'Belajar Main Gitar', 'Belajar chord dasar, strumming, melodi sederhana, dan lagu pop', $2) RETURNING id",
    [userId, addDays(mon, 28)],
  );
  const goal3Id = goal3Res.rows[0].id;
  console.log('3. Goals created');

  // 4. Create AI recommendations

  const profileAvail = {
    monday: ['morning', 'afternoon', 'evening'],
    tuesday: ['morning', 'afternoon'],
    wednesday: ['morning', 'afternoon', 'evening'],
    thursday: ['morning', 'afternoon'],
    friday: ['morning'],
    saturday: ['morning'],
    sunday: [],
  };

  // --- Recommendation 1: suggest for week -2 (Goal 1 + Goal 2) ---
  const suggestWk2Output = {
    tasks: [
      {
        title: 'Pengenalan Web Development',
        description: 'Pelajari dasar-dasar web: HTML, CSS, dan cara browser bekerja',
        duration_estimate: 30,
        planned_date: last2Mon,
        planned_slot: 'morning',
        rationale: 'Fundamental sebelum belajar React',
      },
      {
        title: 'Setup VS Code & Tools',
        description: 'Install dan konfigurasi VS Code, Node.js, dan Git',
        duration_estimate: 30,
        planned_date: last2Tue,
        planned_slot: 'morning',
        rationale: 'Persiapan environment development',
      },
      {
        title: 'Latihan Push-Up Dasar 3x10',
        description: 'Latihan push-up 3 set x 10 repetisi dengan form yang benar',
        duration_estimate: 30,
        planned_date: last2Wed,
        planned_slot: 'morning',
        rationale: 'Gerakan calisthenics dasar untuk kekuatan dada dan lengan',
      },
      {
        title: 'Mengenal Bagian & Stem Gitar',
        description: 'Pelajari bagian-bagian gitar dan cara menyetem senar',
        duration_estimate: 30,
        planned_date: last2Thu,
        planned_slot: 'afternoon',
        rationale: 'Pengenalan alat musik sebelum belajar chord',
      },
      {
        title: 'Latihan Pull-Up Gantung 3x5',
        description: 'Latihan pull-up bantuan karet 3 set x 5 repetisi',
        duration_estimate: 25,
        planned_date: last2Fri,
        planned_slot: 'morning',
        rationale: 'Melatih kekuatan punggung dan lengan',
      },
    ],
    summary:
      'Fokus minggu pertama: pengenalan web, calisthenics dasar, dan pengenalan gitar',
  };

  const suggestWk2Ctx = {
    week_start: last2Mon,
    week_end: last2Sun,
    goals: [
      {
        title: 'Belajar React Dasar',
        description: 'Memahami fundamental React: komponen, props, state, dan hooks',
        deadline: addDays(mon, 21),
      },
      {
        title: 'Latihan Calisthenics',
        description:
          'Rutin calisthenics: push-up, pull-up, squat, plank, L-sit, dan handstand',
        deadline: addDays(mon, 28),
      },
    ],
    weekly_target_hours: 6,
    preferred_time: 'morning',
    existing_tasks: [],
  };

  const recWk2 = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'accepted', 0) RETURNING id`,
    [userId, JSON.stringify(suggestWk2Ctx), JSON.stringify(suggestWk2Output)],
  );
  const recWk2Id = recWk2.rows[0].id;

  // --- Recommendation 2: suggest for week -1 (Goal 1 + Goal 2 + Goal 3) ---
  const suggestWk1Output = {
    tasks: [
      {
        title: 'Pengenalan React & Virtual DOM',
        description: 'Pelajari konsep Virtual DOM dan cara React bekerja',
        duration_estimate: 45,
        planned_date: lastMon,
        planned_slot: 'morning',
        rationale: 'Fundamental React, cocok dikerjakan pagi hari',
      },
      {
        title: 'Setup Environment React (Vite)',
        description: 'Inisialisasi projekt React menggunakan Vite',
        duration_estimate: 30,
        planned_date: lastTue,
        planned_slot: 'morning',
        rationale: 'Persiapan environment, cukup 30 menit',
      },
      {
        title: 'Membuat Komponen Fungsional Pertama',
        description: 'Buat komponen sederhana Hello World dengan JSX',
        duration_estimate: 45,
        planned_date: lastWed,
        planned_slot: 'morning',
        rationale: 'Praktik langsung membuat komponen',
      },
      {
        title: 'Latihan Props & Children',
        description: 'Latihan melempar data antar komponen menggunakan props',
        duration_estimate: 60,
        planned_date: lastThu,
        planned_slot: 'afternoon',
        rationale: 'Konsep penting setelah paham komponen',
      },
      {
        title: 'Membaca Dokumentasi Resmi React',
        description: 'Pelajari best practices dari dokumentasi resmi',
        duration_estimate: 30,
        planned_date: lastFri,
        planned_slot: 'morning',
        rationale: 'Memperkuat teori dengan sumber resmi',
      },
      {
        title: 'Latihan Squat Dasar 3x15',
        description: 'Latihan squat bodyweight 3 set x 15 repetisi',
        duration_estimate: 30,
        planned_date: lastMon,
        planned_slot: 'afternoon',
        rationale: 'Gerakan calisthenics untuk kekuatan kaki',
      },
      {
        title: 'Latihan Plank 30 Detik 3x',
        description: 'Tahan plank selama 30 detik, 3 set dengan istirahat 30 detik',
        duration_estimate: 25,
        planned_date: lastWed,
        planned_slot: 'afternoon',
        rationale: 'Perkuat core dan stabilitas tubuh',
      },
      {
        title: 'Belajar Chord A, D, E',
        description: 'Pelajari posisi jari untuk chord A, D, dan E mayor',
        duration_estimate: 30,
        planned_date: lastTue,
        planned_slot: 'afternoon',
        rationale: 'Chord dasar yang paling sering digunakan',
      },
      {
        title: 'Latihan Perpindahan Chord A-D-E',
        description: 'Latihan berpindah antar chord A, D, E secara cepat',
        duration_estimate: 30,
        planned_date: lastThu,
        planned_slot: 'morning',
        rationale: 'Melatih muscle memory perpindahan chord',
      },
    ],
    summary:
      'Fokus pada React dasar, calisthenics kekuatan kaki & core, serta chord dasar gitar',
  };

  const suggestWk1Ctx = {
    week_start: lastMon,
    week_end: lastSun,
    goals: [
      {
        title: 'Belajar React Dasar',
        description: 'Memahami fundamental React: komponen, props, state, dan hooks',
        deadline: addDays(mon, 21),
      },
      {
        title: 'Latihan Calisthenics',
        description:
          'Rutin calisthenics: push-up, pull-up, squat, plank, L-sit, dan handstand',
        deadline: addDays(mon, 28),
      },
      {
        title: 'Belajar Main Gitar',
        description: 'Belajar chord dasar, strumming, melodi sederhana, dan lagu pop',
        deadline: addDays(mon, 28),
      },
    ],
    weekly_target_hours: 8,
    preferred_time: 'morning',
    existing_tasks: suggestWk2Output.tasks.slice(0, 2).map((t) => ({
      title: t.title,
      planned_date: t.planned_date,
      planned_slot: t.planned_slot,
    })),
  };

  const recWk1 = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'accepted', 0) RETURNING id`,
    [userId, JSON.stringify(suggestWk1Ctx), JSON.stringify(suggestWk1Output)],
  );
  const recWk1Id = recWk1.rows[0].id;

  // --- Recommendation 3: suggest for week 0 (Goal 1 + Goal 3) ---
  const suggestWk0Output = {
    tasks: [
      {
        title: 'Memahami JSX dan Component',
        description: 'Pelajari sintaks JSX dan buat komponen fungsional sederhana',
        duration_estimate: 45,
        planned_date: mon,
        planned_slot: 'morning',
        rationale: 'Fundamental React, cocok dikerjakan pagi hari',
      },
      {
        title: 'Belajar useState Hook',
        description: 'Praktik useState dengan studi kasus form dan counter',
        duration_estimate: 60,
        planned_date: tue,
        planned_slot: 'morning',
        rationale: 'State management dasar, pagi hari untuk fokus maksimal',
      },
      {
        title: 'Praktik Props dan State',
        description: 'Latihan props drilling dan state lifting',
        duration_estimate: 45,
        planned_date: wed,
        planned_slot: 'afternoon',
        rationale: 'Konsep penting setelah paham state',
      },
      {
        title: 'Membuat Component List',
        description: 'Buat komponen daftar tugas dengan map dan key',
        duration_estimate: 60,
        planned_date: thu,
        planned_slot: 'morning',
        rationale: 'Praktik rendering list, pagi hari efektif untuk koding',
      },
      {
        title: 'Belajar useEffect',
        description: 'Pelajari lifecycle dan side effect dengan useEffect',
        duration_estimate: 45,
        planned_date: fri,
        planned_slot: 'morning',
        rationale: 'Hook penting berikutnya setelah state',
      },
      {
        title: 'Latihan Fetch API',
        description: 'Integrasi fetch API dengan useEffect untuk mengambil data',
        duration_estimate: 60,
        planned_date: sat,
        planned_slot: 'afternoon',
        rationale: 'Kasus nyata penggunaan useEffect',
      },
      {
        title: 'Belajar Chord C, G, F',
        description: 'Pelajari posisi jari untuk chord C, G, dan F mayor',
        duration_estimate: 30,
        planned_date: wed,
        planned_slot: 'morning',
        rationale: 'Chord penting setelah A, D, E',
      },
      {
        title: 'Latihan Strumming Dasar',
        description: 'Latihan pola strumming down-up dengan tempo lambat',
        duration_estimate: 30,
        planned_date: sat,
        planned_slot: 'morning',
        rationale: 'Teknik strumming fundamental untuk iringan lagu',
      },
    ],
    summary:
      'Minggu ini fokus pada React state & lifecycle, dan lanjutan chord gitar C-G-F',
  };

  const suggestWk0Ctx = {
    week_start: weekStart,
    week_end: weekEnd,
    goals: [
      {
        title: 'Belajar React Dasar',
        description: 'Memahami fundamental React: komponen, props, state, dan hooks',
        deadline: addDays(mon, 21),
      },
      {
        title: 'Belajar Main Gitar',
        description: 'Belajar chord dasar, strumming, melodi sederhana, dan lagu pop',
        deadline: addDays(mon, 28),
      },
    ],
    weekly_target_hours: 8,
    preferred_time: 'morning',
    existing_tasks: suggestWk1Output.tasks.slice(0, 3).map((t) => ({
      title: t.title,
      planned_date: t.planned_date,
      planned_slot: t.planned_slot,
    })),
  };

  const recWk0 = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'accepted', 0) RETURNING id`,
    [userId, JSON.stringify(suggestWk0Ctx), JSON.stringify(suggestWk0Output)],
  );
  const recWk0Id = recWk0.rows[0].id;

  // --- Recommendation 4: suggest for week +1 (Goal 1 + Goal 2) ---
  const suggestWkPlus1Output = {
    tasks: [
      {
        title: 'Belajar React Router Dasar',
        description: 'Pelajari routing antar halaman dengan react-router-dom',
        duration_estimate: 60,
        planned_date: nextMon,
        planned_slot: 'morning',
        rationale: 'Navigasi adalah fitur penting aplikasi React',
      },
      {
        title: 'Praktik React Router & Navigation',
        description: 'Buat navigasi multi-halaman dengan Route dan Link',
        duration_estimate: 45,
        planned_date: nextWed,
        planned_slot: 'afternoon',
        rationale: 'Praktik langsung setelah paham konsep routing',
      },
      {
        title: 'Latihan Dips Kursi 3x8',
        description: 'Latihan dips menggunakan kursi 3 set x 8 repetisi',
        duration_estimate: 30,
        planned_date: nextTue,
        planned_slot: 'morning',
        rationale: 'Melatih triceps dan dada bagian bawah',
      },
      {
        title: 'Latihan Handstand Wall Hold',
        description: 'Latihan handstand dengan bantuan tembok, tahan 20 detik',
        duration_estimate: 25,
        planned_date: nextThu,
        planned_slot: 'morning',
        rationale: 'Keseimbangan dan kekuatan bahu',
      },
      {
        title: 'Belajar Chord Minor Am, Dm, Em',
        description: 'Pelajari chord minor dasar: Am, Dm, dan Em',
        duration_estimate: 30,
        planned_date: nextFri,
        planned_slot: 'morning',
        rationale: 'Chord minor untuk variasi lagu',
      },
      {
        title: 'Latihan Perpindahan Mayor-Minor',
        description: 'Latihan perpindahan chord mayor ke minor dan sebaliknya',
        duration_estimate: 30,
        planned_date: nextSat,
        planned_slot: 'morning',
        rationale: 'Memperlancar transisi chord',
      },
    ],
    summary:
      'Minggu depan fokus pada React Router, calisthenics upper body, dan chord minor',
  };

  const suggestWkPlus1Ctx = {
    week_start: nextMon,
    week_end: nextSun,
    goals: [
      {
        title: 'Belajar React Dasar',
        description: 'Memahami fundamental React: komponen, props, state, dan hooks',
        deadline: addDays(mon, 21),
      },
      {
        title: 'Latihan Calisthenics',
        description:
          'Rutin calisthenics: push-up, pull-up, squat, plank, L-sit, dan handstand',
        deadline: addDays(mon, 28),
      },
    ],
    weekly_target_hours: 8,
    preferred_time: 'morning',
    existing_tasks: [],
  };

  const recWkPlus1 = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'pending', 0) RETURNING id`,
    [userId, JSON.stringify(suggestWkPlus1Ctx), JSON.stringify(suggestWkPlus1Output)],
  );
  const recWkPlus1Id = recWkPlus1.rows[0].id;

  // --- Recommendation 5: suggest for week +2 (Goal 2 + Goal 3) ---
  const suggestWkPlus2Output = {
    tasks: [
      {
        title: 'Full Body Routine: Push-Pull-Legs',
        description: 'Rangkaian calisthenics push (dips), pull (pull-up), legs (squat)',
        duration_estimate: 30,
        planned_date: next2Mon,
        planned_slot: 'morning',
        rationale: 'Rutinitas full body untuk kekuatan menyeluruh',
      },
      {
        title: 'Latihan L-Sit di Lantai',
        description: 'Latihan L-sit tahan 10 detik, 3 set',
        duration_estimate: 30,
        planned_date: next2Wed,
        planned_slot: 'afternoon',
        rationale: 'Melatih core dan kompresi perut',
      },
      {
        title: 'Tes Kemampuan Push-Up Max',
        description: 'Tes push-up maksimal dalam 1 set tanpa berhenti',
        duration_estimate: 25,
        planned_date: next2Fri,
        planned_slot: 'morning',
        rationale: 'Mengukur progres kekuatan',
      },
      {
        title: 'Belajar Melodi Dasar',
        description: 'Pelajari tangga nada C mayor dan melodi sederhana',
        duration_estimate: 30,
        planned_date: next2Tue,
        planned_slot: 'afternoon',
        rationale: 'Dasar melodi sebelum fingerstyle',
      },
      {
        title: 'Latihan Fingerstyle Sederhana',
        description: 'Latihan pola fingerstyle dasar dengan chord C-G-F',
        duration_estimate: 30,
        planned_date: next2Thu,
        planned_slot: 'morning',
        rationale: 'Teknik fingerstyle untuk iringan lagu yang lebih variatif',
      },
      {
        title: 'Main Lagu Sederhana',
        description: 'Mainkan lagu pop sederhana menggunakan chord dan strumming',
        duration_estimate: 30,
        planned_date: next2Sat,
        planned_slot: 'morning',
        rationale: 'Praktik langsung dengan lagu nyata',
      },
    ],
    summary: 'Dua minggu lagi fokus pada full body calisthenics dan melodi gitar',
  };

  const suggestWkPlus2Ctx = {
    week_start: next2Mon,
    week_end: next2Sun,
    goals: [
      {
        title: 'Latihan Calisthenics',
        description:
          'Rutin calisthenics: push-up, pull-up, squat, plank, L-sit, dan handstand',
        deadline: addDays(mon, 28),
      },
      {
        title: 'Belajar Main Gitar',
        description: 'Belajar chord dasar, strumming, melodi sederhana, dan lagu pop',
        deadline: addDays(mon, 28),
      },
    ],
    weekly_target_hours: 6,
    preferred_time: 'morning',
    existing_tasks: [],
  };

  const recWkPlus2 = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'pending', 0) RETURNING id`,
    [userId, JSON.stringify(suggestWkPlus2Ctx), JSON.stringify(suggestWkPlus2Output)],
  );
  const recWkPlus2Id = recWkPlus2.rows[0].id;
  console.log('4. AI recommendations created');

  // 5. Create tasks
  const tasksData = [
    // ── WEEK -2: tasks (Goal 1 + Goal 2) ──
    {
      goal_id: goal1Id,
      title: 'Pengenalan Web Development',
      description: 'Pelajari dasar-dasar web: HTML, CSS, dan cara browser bekerja',
      duration_estimate: 30,
      planned_date: last2Mon,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 35,
      completed_at: `${last2Mon}T10:00:00+07:00`,
      rationale: 'Paham konsep dasar web development',
    },
    {
      goal_id: goal1Id,
      title: 'Setup VS Code & Tools',
      description: 'Install dan konfigurasi VS Code, Node.js, dan Git',
      duration_estimate: 30,
      planned_date: last2Tue,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 25,
      completed_at: `${last2Tue}T09:30:00+07:00`,
      rationale: 'Environment siap digunakan',
    },
    {
      goal_id: goal2Id,
      title: 'Latihan Push-Up Dasar 3x10',
      description: 'Latihan push-up 3 set x 10 repetisi dengan form yang benar',
      duration_estimate: 30,
      planned_date: last2Wed,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 30,
      completed_at: `${last2Wed}T07:00:00+07:00`,
      rationale: 'Form push-up sudah mulai benar',
    },
    {
      goal_id: goal3Id,
      title: 'Mengenal Bagian & Stem Gitar',
      description: 'Pelajari bagian-bagian gitar dan cara menyetem senar',
      duration_estimate: 30,
      planned_date: last2Thu,
      planned_slot: 'afternoon',
      status: 'done',
      source: 'ai',
      actual_duration: 35,
      completed_at: `${last2Thu}T16:00:00+07:00`,
      rationale: 'Sudah bisa menyetem gitar sendiri',
    },
    {
      goal_id: goal2Id,
      title: 'Latihan Pull-Up Gantung 3x5',
      description: 'Latihan pull-up bantuan karet 3 set x 5 repetisi',
      duration_estimate: 25,
      planned_date: last2Fri,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 25,
      completed_at: `${last2Fri}T07:15:00+07:00`,
      rationale: 'Mulai terbiasa dengan gerakan pull-up',
    },

    // ── WEEK -1: tasks (Goal 1 + Goal 2 + Goal 3) ──
    {
      goal_id: goal1Id,
      title: 'Pengenalan React & Virtual DOM',
      description: 'Pelajari konsep Virtual DOM dan cara React bekerja',
      duration_estimate: 45,
      planned_date: lastMon,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 50,
      completed_at: `${lastMon}T10:30:00+07:00`,
      rationale: 'Memahami konsep Virtual DOM dengan baik',
    },
    {
      goal_id: goal1Id,
      title: 'Setup Environment React (Vite)',
      description: 'Inisialisasi projekt React menggunakan Vite',
      duration_estimate: 30,
      planned_date: lastTue,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 25,
      completed_at: `${lastTue}T09:30:00+07:00`,
      rationale: 'Berhasil setup Vite + React',
    },
    {
      goal_id: goal1Id,
      title: 'Membuat Komponen Fungsional Pertama',
      description: 'Buat komponen sederhana Hello World dengan JSX',
      duration_estimate: 45,
      planned_date: lastWed,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Tertunda karena ada keperluan mendadak',
    },
    {
      goal_id: goal1Id,
      title: 'Latihan Props & Children',
      description: 'Latihan melempar data antar komponen menggunakan props',
      duration_estimate: 60,
      planned_date: lastThu,
      planned_slot: 'afternoon',
      status: 'todo',
      source: 'ai',
      rationale: 'Belum sempat dikerjakan, butuh jadwal ulang',
    },
    {
      goal_id: goal1Id,
      title: 'Membaca Dokumentasi Resmi React',
      description: 'Pelajari best practices dari dokumentasi resmi',
      duration_estimate: 30,
      planned_date: lastFri,
      planned_slot: 'morning',
      status: 'todo',
      source: 'manual',
      rationale: 'Membaca dokumentasi, bisa dilakukan kapan saja',
    },
    {
      goal_id: goal2Id,
      title: 'Latihan Squat Dasar 3x15',
      description: 'Latihan squat bodyweight 3 set x 15 repetisi',
      duration_estimate: 30,
      planned_date: lastMon,
      planned_slot: 'afternoon',
      status: 'done',
      source: 'ai',
      actual_duration: 30,
      completed_at: `${lastMon}T17:00:00+07:00`,
      rationale: 'Form squat sudah baik',
    },
    {
      goal_id: goal2Id,
      title: 'Latihan Plank 30 Detik 3x',
      description: 'Tahan plank selama 30 detik, 3 set dengan istirahat 30 detik',
      duration_estimate: 25,
      planned_date: lastWed,
      planned_slot: 'afternoon',
      status: 'done',
      source: 'ai',
      actual_duration: 25,
      completed_at: `${lastWed}T16:30:00+07:00`,
      rationale: 'Core mulai terasa lebih kuat',
    },
    {
      goal_id: goal3Id,
      title: 'Belajar Chord A, D, E',
      description: 'Pelajari posisi jari untuk chord A, D, dan E mayor',
      duration_estimate: 30,
      planned_date: lastTue,
      planned_slot: 'afternoon',
      status: 'done',
      source: 'ai',
      actual_duration: 35,
      completed_at: `${lastTue}T16:30:00+07:00`,
      rationale: 'Chord A D E sudah bisa dibunyikan bersih',
    },
    {
      goal_id: goal3Id,
      title: 'Latihan Perpindahan Chord A-D-E',
      description: 'Latihan berpindah antar chord A, D, E secara cepat',
      duration_estimate: 30,
      planned_date: lastThu,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Perpindahan masih lambat, perlu latihan lagi',
    },

    // ── WEEK 0: tasks (Goal 1 + Goal 2 + Goal 3) ──
    {
      goal_id: goal1Id,
      title: 'Memahami JSX dan Component',
      description: 'Pelajari sintaks JSX dan buat komponen fungsional sederhana',
      duration_estimate: 45,
      planned_date: mon,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 50,
      completed_at: `${mon}T10:30:00+07:00`,
      rationale: 'Selesai dengan pemahaman dasar JSX',
    },
    {
      goal_id: goal1Id,
      title: 'Belajar useState Hook',
      description: 'Praktik useState dengan studi kasus form dan counter',
      duration_estimate: 60,
      planned_date: tue,
      planned_slot: 'morning',
      status: 'done',
      source: 'ai',
      actual_duration: 55,
      completed_at: `${tue}T11:00:00+07:00`,
      rationale: 'Berhasil membuat counter dan form sederhana',
    },
    {
      goal_id: goal1Id,
      title: 'Praktik Props dan State',
      description: 'Latihan props drilling dan state lifting',
      duration_estimate: 45,
      planned_date: wed,
      planned_slot: 'afternoon',
      status: 'done',
      source: 'ai',
      actual_duration: 45,
      completed_at: `${wed}T15:30:00+07:00`,
      rationale: 'Memahami konsep lifting state up',
    },
    {
      goal_id: goal1Id,
      title: 'Membuat Component List',
      description: 'Buat komponen daftar tugas dengan map dan key',
      duration_estimate: 60,
      planned_date: thu,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Belum dikerjakan, masih sesuai jadwal',
    },
    {
      goal_id: goal1Id,
      title: 'Belajar useEffect',
      description: 'Pelajari lifecycle dan side effect dengan useEffect',
      duration_estimate: 45,
      planned_date: fri,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Masih on track sesuai jadwal',
    },
    {
      goal_id: goal1Id,
      title: 'Latihan Fetch API',
      description: 'Integrasi fetch API dengan useEffect untuk mengambil data',
      duration_estimate: 60,
      planned_date: sat,
      planned_slot: 'afternoon',
      status: 'todo',
      source: 'ai',
      rationale: 'Materi lanjutan setelah paham useEffect',
    },
    {
      goal_id: goal1Id,
      title: 'Review Materi Mingguan',
      description: 'Review ulang semua materi React yang sudah dipelajari minggu ini',
      duration_estimate: 30,
      planned_date: mon,
      planned_slot: 'evening',
      status: 'done',
      source: 'manual',
      actual_duration: 35,
      completed_at: `${mon}T20:00:00+07:00`,
    },
    {
      goal_id: goal2Id,
      title: 'Push-Up Variasi Wide & Diamond',
      description: 'Latihan push-up wide grip dan diamond grip 3x8 masing-masing',
      duration_estimate: 30,
      planned_date: tue,
      planned_slot: 'afternoon',
      status: 'todo',
      source: 'ai',
      rationale: 'Variasi push-up untuk melatih otot berbeda',
    },
    {
      goal_id: goal3Id,
      title: 'Belajar Chord C, G, F',
      description: 'Pelajari posisi jari untuk chord C, G, dan F mayor',
      duration_estimate: 30,
      planned_date: wed,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Chord penting setelah A, D, E',
    },
    {
      goal_id: goal3Id,
      title: 'Latihan Strumming Dasar',
      description: 'Latihan pola strumming down-up dengan tempo lambat',
      duration_estimate: 30,
      planned_date: sat,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Teknik strumming fundamental untuk iringan lagu',
    },

    // ── WEEK +1: tasks (Goal 1 + Goal 2 + Goal 3) ──
    {
      goal_id: goal1Id,
      title: 'Belajar React Router Dasar',
      description: 'Pelajari routing antar halaman dengan react-router-dom',
      duration_estimate: 60,
      planned_date: nextMon,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Lanjutan materi setelah paham dasar React',
    },
    {
      goal_id: goal1Id,
      title: 'Praktik React Router & Navigation',
      description: 'Buat navigasi multi-halaman dengan Route dan Link',
      duration_estimate: 45,
      planned_date: nextWed,
      planned_slot: 'afternoon',
      status: 'todo',
      source: 'ai',
      rationale: 'Praktik langsung setelah paham konsep routing',
    },
    {
      goal_id: goal2Id,
      title: 'Latihan Dips Kursi 3x8',
      description: 'Latihan dips menggunakan kursi 3 set x 8 repetisi',
      duration_estimate: 30,
      planned_date: nextTue,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Melatih triceps dan dada bagian bawah',
    },
    {
      goal_id: goal2Id,
      title: 'Latihan Handstand Wall Hold',
      description: 'Latihan handstand dengan bantuan tembok, tahan 20 detik',
      duration_estimate: 25,
      planned_date: nextThu,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Keseimbangan dan kekuatan bahu',
    },
    {
      goal_id: goal3Id,
      title: 'Belajar Chord Minor Am, Dm, Em',
      description: 'Pelajari chord minor dasar: Am, Dm, dan Em',
      duration_estimate: 30,
      planned_date: nextFri,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Chord minor untuk variasi lagu',
    },
    {
      goal_id: goal3Id,
      title: 'Latihan Perpindahan Mayor-Minor',
      description: 'Latihan perpindahan chord mayor ke minor dan sebaliknya',
      duration_estimate: 30,
      planned_date: nextSat,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Memperlancar transisi chord',
    },

    // ── WEEK +2: tasks (Goal 2 + Goal 3) ──
    {
      goal_id: goal2Id,
      title: 'Full Body Routine: Push-Pull-Legs',
      description: 'Rangkaian calisthenics push (dips), pull (pull-up), legs (squat)',
      duration_estimate: 30,
      planned_date: next2Mon,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Rutinitas full body untuk kekuatan menyeluruh',
    },
    {
      goal_id: goal2Id,
      title: 'Latihan L-Sit di Lantai',
      description: 'Latihan L-sit tahan 10 detik, 3 set',
      duration_estimate: 30,
      planned_date: next2Wed,
      planned_slot: 'afternoon',
      status: 'todo',
      source: 'ai',
      rationale: 'Melatih core dan kompresi perut',
    },
    {
      goal_id: goal2Id,
      title: 'Tes Kemampuan Push-Up Max',
      description: 'Tes push-up maksimal dalam 1 set tanpa berhenti',
      duration_estimate: 25,
      planned_date: next2Fri,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Mengukur progres kekuatan',
    },
    {
      goal_id: goal3Id,
      title: 'Belajar Melodi Dasar',
      description: 'Pelajari tangga nada C mayor dan melodi sederhana',
      duration_estimate: 30,
      planned_date: next2Tue,
      planned_slot: 'afternoon',
      status: 'todo',
      source: 'ai',
      rationale: 'Dasar melodi sebelum fingerstyle',
    },
    {
      goal_id: goal3Id,
      title: 'Latihan Fingerstyle Sederhana',
      description: 'Latihan pola fingerstyle dasar dengan chord C-G-F',
      duration_estimate: 30,
      planned_date: next2Thu,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Teknik fingerstyle untuk iringan lagu yang lebih variatif',
    },
    {
      goal_id: goal3Id,
      title: 'Main Lagu Sederhana',
      description: 'Mainkan lagu pop sederhana menggunakan chord dan strumming',
      duration_estimate: 30,
      planned_date: next2Sat,
      planned_slot: 'morning',
      status: 'todo',
      source: 'ai',
      rationale: 'Praktik langsung dengan lagu nyata',
    },
  ];

  for (const task of tasksData) {
    const {
      goal_id,
      title,
      description,
      duration_estimate,
      planned_date,
      planned_slot,
      status,
      source,
      actual_duration,
      completed_at,
      rationale,
    } = task;
    await db.query(
      `INSERT INTO tasks (goal_id, title, description, duration_estimate, planned_date, planned_slot, status, source, actual_duration, completed_at, rationale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [
        goal_id,
        title,
        description,
        duration_estimate,
        planned_date,
        planned_slot,
        status,
        source,
        actual_duration || null,
        completed_at || null,
        rationale ? JSON.stringify(rationale) : null,
      ],
    );
  }
  console.log('5. Tasks created');

  // 6. Create progress snapshots
  await db.query(
    `INSERT INTO progress_snapshots (user_id, week, planned_hours, completed_hours, completion_rate)
     VALUES ($1, $2, 5.0, 4.5, 0.90)`,
    [userId, last2WeekStr],
  );

  await db.query(
    `INSERT INTO progress_snapshots (user_id, week, planned_hours, completed_hours, completion_rate)
     VALUES ($1, $2, 7.0, 3.5, 0.50)`,
    [userId, lastWeekStr],
  );

  await db.query(
    `INSERT INTO progress_snapshots (user_id, week, planned_hours, completed_hours, completion_rate)
     VALUES ($1, $2, 8.0, 3.75, 0.47)`,
    [userId, weekStr],
  );

  await db.query(
    `INSERT INTO progress_snapshots (user_id, week, planned_hours, completed_hours, completion_rate)
     VALUES ($1, $2, 6.0, 0, 0)`,
    [userId, nextWeekStr],
  );
  console.log('6. Progress snapshots created');

  // 7. Create audit logs
  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_suggest_accepted', $2, $3)`,
    [
      userId,
      recWk2Id,
      JSON.stringify({ type: 'suggest', summary: suggestWk2Output.summary }),
    ],
  );

  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_suggest_accepted', $2, $3)`,
    [
      userId,
      recWk1Id,
      JSON.stringify({ type: 'suggest', summary: suggestWk1Output.summary }),
    ],
  );

  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_suggest_accepted', $2, $3)`,
    [
      userId,
      recWk0Id,
      JSON.stringify({ type: 'suggest', summary: suggestWk0Output.summary }),
    ],
  );
  console.log('7. Audit logs created');

  console.log('\n✅ Seed complete!');
  console.log(`   User:  ${SEED_EMAIL} / ${SEED_PASSWORD}`);
  console.log(`   Admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log(`   Week -2:      ${last2WeekStr} (${last2Mon} — ${last2Sun})`);
  console.log(`   Week -1:      ${lastWeekStr} (${lastMon} — ${lastSun})`);
  console.log(`   Week 0:       ${weekStr} (${weekStart} — ${weekEnd})`);
  console.log(`   Week +1:      ${nextWeekStr} (${nextMon} — ${nextSun})`);
  console.log(`   Week +2:      ${next2WeekStr} (${next2Mon} — ${next2Sun})`);
  console.log('   Overdue tasks: 4 (3 React, 1 Guitar)');

  await db.pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

const bcrypt = require('bcryptjs');
const db = require('../src/utils/db');
const {
  getCurrentWeekStart,
  getCurrentWeek,
  getWeekEnd,
  getWeekString,
} = require('../src/utils/week');

const SEED_EMAIL = 'user_seed@mail.com';
const SEED_PASSWORD = 'seed1234';

async function seed() {
  console.log('Seeding database...\n');

  // Cleanup existing seed user
  const existing = await db.query('SELECT id FROM users WHERE email = $1', [SEED_EMAIL]);
  if (existing.rows.length > 0) {
    const userId = existing.rows[0].id;
    console.log('Cleaning existing seed data for user:', userId);
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
    console.log('Done cleaning.\n');
  }

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

  const lastWeekStr = getWeekString(new Date(lastMon));
  const nextWeekStr = getWeekString(new Date(nextMon));

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

  // 3. Create goals
  const goal1Res = await db.query(
    "INSERT INTO goals (user_id, title, description, deadline) VALUES ($1, 'Belajar React Dasar', 'Memahami fundamental React: komponen, props, state, dan hooks', $2) RETURNING id",
    [userId, sun],
  );
  const goal1Id = goal1Res.rows[0].id;

  const goal2Res = await db.query(
    "INSERT INTO goals (user_id, title, description, deadline) VALUES ($1, 'Menyelesaikan Proyek Capstone', 'Membangun aplikasi web perencanaan belajar berbasis AI', $2) RETURNING id",
    [userId, addDays(mon, 14)],
  );
  const goal2Id = goal2Res.rows[0].id;
  console.log('3. Goals created');

  // 4. Create AI recommendations

  // --- Recommendation: suggest for last week (Goal 1) ---
  const suggestLastOutput = {
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
    ],
    summary:
      'Fokus pada dasar React: Virtual DOM, komponen, props, dan environment setup',
  };

  const suggestLastCtx = {
    week_start: lastMon,
    week_end: lastSun,
    goal: {
      title: 'Belajar React Dasar',
      description: 'Memahami fundamental React: komponen, props, state, dan hooks',
      deadline: sun,
    },
    weekly_target_hours: 8,
    preferred_time: 'morning',
    existing_tasks: [],
  };

  const recSuggestLast = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'accepted', 421) RETURNING id`,
    [userId, JSON.stringify(suggestLastCtx), JSON.stringify(suggestLastOutput)],
  );
  const recSuggestLastId = recSuggestLast.rows[0].id;

  // --- Recommendation: suggest for this week (Goal 1) ---
  const suggestThisOutput = {
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
    ],
    summary:
      'Fokus minggu ini pada penguasaan dasar React: JSX, component, props, state, dan efek samping',
  };

  const suggestThisCtx = {
    week_start: weekStart,
    week_end: weekEnd,
    goal: {
      title: 'Belajar React Dasar',
      description: 'Memahami fundamental React: komponen, props, state, dan hooks',
      deadline: sun,
    },
    weekly_target_hours: 8,
    preferred_time: 'morning',
    existing_tasks: suggestLastOutput.tasks.slice(0, 2).map((t) => ({
      title: t.title,
      planned_date: t.planned_date,
      planned_slot: t.planned_slot,
    })),
  };

  const recSuggestThis = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'accepted', 452) RETURNING id`,
    [userId, JSON.stringify(suggestThisCtx), JSON.stringify(suggestThisOutput)],
  );
  const recSuggestThisId = recSuggestThis.rows[0].id;

  // --- Recommendation: suggest for next week (Goal 1 + Goal 2) ---
  const suggestNextOutput = {
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
    ],
    summary: 'Minggu depan fokus pada React Router untuk navigasi aplikasi',
  };

  const suggestNextCtx = {
    week_start: nextMon,
    week_end: nextSun,
    goal: {
      title: 'Belajar React Dasar',
      description: 'Memahami fundamental React: komponen, props, state, dan hooks',
      deadline: sun,
    },
    weekly_target_hours: 8,
    preferred_time: 'morning',
    existing_tasks: [],
  };

  const recSuggestNext = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'pending', 315) RETURNING id`,
    [userId, JSON.stringify(suggestNextCtx), JSON.stringify(suggestNextOutput)],
  );
  const recSuggestNextId = recSuggestNext.rows[0].id;

  // --- Recommendation: reschedule (for last week's overdue tasks) ---
  const rescheduleOutput = {
    tasks: [
      {
        title: 'Membuat Komponen Fungsional Pertama',
        duration_estimate: 45,
        planned_date: wed,
        planned_slot: 'afternoon',
        rationale:
          'Materi dasar yang terlewat, pindah ke Rabu sore karena slot masih kosong',
      },
      {
        title: 'Latihan Props & Children',
        duration_estimate: 60,
        planned_date: thu,
        planned_slot: 'morning',
        rationale:
          'Latihan props bisa digabung dengan praktik component list hari Kamis pagi',
      },
      {
        title: 'Membaca Dokumentasi Resmi React',
        duration_estimate: 30,
        planned_date: fri,
        planned_slot: 'morning',
        rationale: 'Dokumentasi bisa dibaca sambil istirahat, durasi singkat 30 menit',
      },
    ],
    summary:
      '3 task overdue dari minggu lalu dijadwalkan ulang ke slot kosong minggu ini',
  };

  const rescheduleCtx = {
    overdue_tasks: [
      {
        title: 'Membuat Komponen Fungsional Pertama',
        duration_estimate: 45,
        original_date: lastWed,
      },
      {
        title: 'Latihan Props & Children',
        duration_estimate: 60,
        original_date: lastThu,
      },
      {
        title: 'Membaca Dokumentasi Resmi React',
        duration_estimate: 30,
        original_date: lastFri,
      },
    ],
    current_week_tasks: suggestThisOutput.tasks.slice(0, 3).map((t) => ({
      planned_date: t.planned_date,
      planned_slot: t.planned_slot,
      duration_estimate: t.duration_estimate,
    })),
    availability: {
      monday: ['morning', 'afternoon', 'evening'],
      tuesday: ['morning', 'afternoon'],
      wednesday: ['morning', 'afternoon', 'evening'],
      thursday: ['morning', 'afternoon'],
      friday: ['morning'],
      saturday: ['morning'],
      sunday: [],
    },
    remaining_capacity: 3.75,
  };

  const recReschedule = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'reschedule', $2, $3, 'accepted', 387) RETURNING id`,
    [userId, JSON.stringify(rescheduleCtx), JSON.stringify(rescheduleOutput)],
  );
  const recRescheduleId = recReschedule.rows[0].id;
  console.log('4. AI recommendations created');

  // 5. Create tasks
  const tasksData = [
    // ── LAST WEEK tasks (Goal 1) ──
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

    // ── LAST WEEK overdue tasks (Goal 1) — status: todo, planned_date IN THE PAST ──
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

    // ── LAST WEEK overdue task (Goal 2) ──
    {
      goal_id: goal2Id,
      title: 'Analisis Kebutuhan Capstone',
      description: 'Identifikasi fitur dan kebutuhan aplikasi capstone',
      duration_estimate: 60,
      planned_date: lastWed,
      planned_slot: 'afternoon',
      status: 'todo',
      source: 'manual',
      rationale: 'Analisis kebutuhan untuk proyek capstone',
    },

    // ── THIS WEEK tasks (Goal 1) ──
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

    // ── THIS WEEK manual tasks ──
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
      title: 'Diskusi dengan Mentor',
      description: 'Konsultasi progres proyek capstone dengan mentor',
      duration_estimate: 45,
      planned_date: wed,
      planned_slot: 'morning',
      status: 'todo',
      source: 'manual',
    },

    // ── NEXT WEEK planned tasks (Goal 1) ──
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

    // ── NEXT WEEK planned tasks (Goal 2) ──
    {
      goal_id: goal2Id,
      title: 'Implementasi Fitur Dashboard',
      description: 'Membangun halaman dashboard untuk aplikasi capstone',
      duration_estimate: 60,
      planned_date: nextTue,
      planned_slot: 'morning',
      status: 'todo',
      source: 'manual',
    },
    {
      goal_id: goal2Id,
      title: 'Integrasi CRUD API Backend',
      description: 'Menghubungkan frontend dengan backend API untuk CRUD goals',
      duration_estimate: 90,
      planned_date: nextThu,
      planned_slot: 'morning',
      status: 'todo',
      source: 'manual',
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
        rationale || null,
      ],
    );
  }
  console.log('5. Tasks created');

  // 6. Create progress snapshots
  await db.query(
    `INSERT INTO progress_snapshots (user_id, week, planned_hours, completed_hours, completion_rate)
     VALUES ($1, $2, 7.0, 2.25, 0.32)`,
    [userId, lastWeekStr],
  );

  await db.query(
    `INSERT INTO progress_snapshots (user_id, week, planned_hours, completed_hours, completion_rate)
     VALUES ($1, $2, 8.0, 3.75, 0.47)`,
    [userId, weekStr],
  );
  console.log('6. Progress snapshots created');

  // 7. Create audit logs
  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_suggest_accepted', $2, $3)`,
    [
      userId,
      recSuggestLastId,
      JSON.stringify({ type: 'suggest', summary: suggestLastOutput.summary }),
    ],
  );

  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_suggest_accepted', $2, $3)`,
    [
      userId,
      recSuggestThisId,
      JSON.stringify({ type: 'suggest', summary: suggestThisOutput.summary }),
    ],
  );

  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_reschedule_accepted', $2, $3)`,
    [
      userId,
      recRescheduleId,
      JSON.stringify({ type: 'reschedule', summary: rescheduleOutput.summary }),
    ],
  );
  console.log('7. Audit logs created');

  console.log('\n✅ Seed complete!');
  console.log(`   Email:    ${SEED_EMAIL}`);
  console.log(`   Password: ${SEED_PASSWORD}`);
  console.log(`   This week:     ${weekStr} (${weekStart} — ${weekEnd})`);
  console.log(`   Last week:     ${lastWeekStr} (${lastMon} — ${lastSun})`);
  console.log(`   Next week:     ${nextWeekStr} (${nextMon} — ${nextSun})`);
  console.log('   Overdue tasks for reschedule: 4 (3 Goal 1, 1 Goal 2)');

  await db.pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

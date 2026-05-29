const bcrypt = require('bcryptjs');
const db = require('../src/utils/db');
const { getCurrentWeekStart, getCurrentWeek, getWeekEnd } = require('../src/utils/week');

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
    await db.query('DELETE FROM tasks WHERE goal_id IN (SELECT id FROM goals WHERE user_id = $1)', [userId]);
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

  const mon = weekStart;
  const tue = addDays(mon, 1);
  const wed = addDays(mon, 2);
  const thu = addDays(mon, 3);
  const fri = addDays(mon, 4);
  const sat = addDays(mon, 5);
  const sun = addDays(mon, 6);

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
    [userId, JSON.stringify({
      monday: ['morning', 'afternoon', 'evening'],
      tuesday: ['morning', 'afternoon'],
      wednesday: ['morning', 'afternoon', 'evening'],
      thursday: ['morning', 'afternoon'],
      friday: ['morning'],
      saturday: ['morning'],
      sunday: [],
    })],
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

  // 4. Create AI recommendation — suggest
  const suggestOutput = {
    tasks: [
      { title: 'Memahami JSX dan Component', description: 'Pelajari sintaks JSX dan buat komponen fungsional sederhana', duration_estimate: 45, planned_date: mon, planned_slot: 'morning', rationale: 'Fundamental React, cocok dikerjakan pagi hari' },
      { title: 'Belajar useState Hook', description: 'Praktik useState dengan studi kasus form dan counter', duration_estimate: 60, planned_date: tue, planned_slot: 'morning', rationale: 'State management dasar, pagi hari untuk fokus maksimal' },
      { title: 'Praktik Props dan State', description: 'Latihan props drilling dan state lifting', duration_estimate: 45, planned_date: wed, planned_slot: 'afternoon', rationale: 'Konsep penting setelah paham state' },
      { title: 'Membuat Component List', description: 'Buat komponen daftar tugas dengan map dan key', duration_estimate: 60, planned_date: thu, planned_slot: 'morning', rationale: 'Praktik rendering list, pagi hari efektif untuk koding' },
      { title: 'Belajar useEffect', description: 'Pelajari lifecycle dan side effect dengan useEffect', duration_estimate: 45, planned_date: fri, planned_slot: 'morning', rationale: 'Hook penting berikutnya setelah state' },
      { title: 'Latihan Fetch API', description: 'Integrasi fetch API dengan useEffect untuk mengambil data', duration_estimate: 60, planned_date: sat, planned_slot: 'afternoon', rationale: 'Kasus nyata penggunaan useEffect' },
    ],
    summary: 'Fokus minggu ini pada penguasaan dasar React: JSX, component, props, state, dan efek samping',
  };

  const suggestCtx = {
    week_start: weekStart,
    week_end: weekEnd,
    goal: { title: 'Belajar React Dasar', description: 'Memahami fundamental React: komponen, props, state, dan hooks', deadline: sun },
    weekly_target_hours: 8,
    preferred_time: 'morning',
    existing_tasks: [],
  };

  const rec1Res = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'suggest', $2, $3, 'accepted', 452) RETURNING id`,
    [userId, JSON.stringify(suggestCtx), JSON.stringify(suggestOutput)],
  );
  const rec1Id = rec1Res.rows[0].id;

  // 5. Create AI recommendation — reschedule
  const rescheduleOutput = {
    tasks: [
      { title: 'Belajar useEffect', description: 'Pelajari lifecycle dan side effect dengan useEffect', duration_estimate: 45, planned_date: fri, planned_slot: 'morning', rationale: 'Tetap di jadwal pagi Jumat' },
      { title: 'Latihan Fetch API', description: 'Integrasi fetch API dengan useEffect', duration_estimate: 60, planned_date: sat, planned_slot: 'afternoon', rationale: 'Pindah ke sore karena pagi dipakai meeting' },
    ],
    summary: 'Reschedule menjaga task tetap on-track tanpa bertabrakan',
  };

  const rescheduleCtx = {
    overdue_tasks: [],
    current_week_tasks: suggestOutput.tasks.slice(0, 4).map(t => ({ planned_date: t.planned_date, planned_slot: t.planned_slot, duration_estimate: t.duration_estimate })),
    availability: { monday: ['morning', 'afternoon', 'evening'], tuesday: ['morning', 'afternoon'], wednesday: ['morning', 'afternoon', 'evening'], thursday: ['morning', 'afternoon'], friday: ['morning'], saturday: ['morning'], sunday: [] },
    remaining_capacity: 3.5,
  };

  const rec2Res = await db.query(
    `INSERT INTO ai_recommendations (user_id, type, input_context, output, status, token_count)
     VALUES ($1, 'reschedule', $2, $3, 'pending', 387) RETURNING id`,
    [userId, JSON.stringify(rescheduleCtx), JSON.stringify(rescheduleOutput)],
  );
  const rec2Id = rec2Res.rows[0].id;
  console.log('4. AI recommendations created');

  // 6. Create tasks
  const tasksData = [
    // AI-suggested tasks (from suggest recommendation)
    { goal_id: goal1Id, title: 'Memahami JSX dan Component', description: 'Pelajari sintaks JSX dan buat komponen fungsional sederhana', duration_estimate: 45, planned_date: mon, planned_slot: 'morning', status: 'done', source: 'ai', actual_duration: 50, completed_at: `${mon}T10:30:00+07:00`, rationale: 'Selesai dengan pemahaman dasar JSX' },
    { goal_id: goal1Id, title: 'Belajar useState Hook', description: 'Praktik useState dengan studi kasus form dan counter', duration_estimate: 60, planned_date: tue, planned_slot: 'morning', status: 'done', source: 'ai', actual_duration: 55, completed_at: `${tue}T11:00:00+07:00`, rationale: 'Berhasil membuat counter dan form sederhana' },
    { goal_id: goal1Id, title: 'Praktik Props dan State', description: 'Latihan props drilling dan state lifting', duration_estimate: 45, planned_date: wed, planned_slot: 'afternoon', status: 'done', source: 'ai', actual_duration: 45, completed_at: `${wed}T15:30:00+07:00`, rationale: 'Memahami konsep lifting state up' },
    { goal_id: goal1Id, title: 'Membuat Component List', description: 'Buat komponen daftar tugas dengan map dan key', duration_estimate: 60, planned_date: thu, planned_slot: 'morning', status: 'done', source: 'ai', actual_duration: 60, completed_at: `${thu}T10:00:00+07:00`, rationale: 'Berhasil render list dinamis' },
    { goal_id: goal1Id, title: 'Belajar useEffect', description: 'Pelajari lifecycle dan side effect dengan useEffect', duration_estimate: 45, planned_date: fri, planned_slot: 'morning', status: 'todo', source: 'ai', rationale: 'Masih on track sesuai jadwal' },
    { goal_id: goal1Id, title: 'Latihan Fetch API', description: 'Integrasi fetch API dengan useEffect', duration_estimate: 60, planned_date: sat, planned_slot: 'afternoon', status: 'todo', source: 'ai', rationale: 'Materi lanjutan setelah paham useEffect' },

    // Manual tasks
    { goal_id: goal1Id, title: 'Review Materi Mingguan', description: 'Review ulang semua materi React yang sudah dipelajari minggu ini', duration_estimate: 30, planned_date: mon, planned_slot: 'evening', status: 'done', source: 'manual', actual_duration: 35, completed_at: `${mon}T20:00:00+07:00` },
    { goal_id: goal2Id, title: 'Diskusi dengan Mentor', description: 'Konsultasi progres proyek capstone dengan mentor', duration_estimate: 45, planned_date: wed, planned_slot: 'morning', status: 'todo', source: 'manual' },
  ];

  for (const task of tasksData) {
    const { goal_id, title, description, duration_estimate, planned_date, planned_slot, status, source, actual_duration, completed_at, rationale } = task;
    await db.query(
      `INSERT INTO tasks (goal_id, title, description, duration_estimate, planned_date, planned_slot, status, source, actual_duration, completed_at, rationale)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
      [goal_id, title, description, duration_estimate, planned_date, planned_slot, status, source, actual_duration || null, completed_at || null, rationale || null],
    );
  }
  console.log('5. Tasks created');

  // 7. Create progress snapshot
  await db.query(
    `INSERT INTO progress_snapshots (user_id, week, planned_hours, completed_hours, completion_rate)
     VALUES ($1, $2, 8.0, 3.75, 0.47)`,
    [userId, weekStr],
  );
  console.log('6. Progress snapshot created');

  // 8. Create audit log
  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_suggest_accepted', $2, $3)`,
    [userId, rec1Id, JSON.stringify({ type: 'suggest', summary: suggestOutput.summary })],
  );

  await db.query(
    `INSERT INTO audit_logs (user_id, action, recommendation_id, metadata)
     VALUES ($1, 'ai_reschedule_created', $2, $3)`,
    [userId, rec2Id, JSON.stringify({ type: 'reschedule', summary: rescheduleOutput.summary })],
  );
  console.log('7. Audit logs created');

  console.log('\n✅ Seed complete!');
  console.log(`   Email:    ${SEED_EMAIL}`);
  console.log(`   Password: ${SEED_PASSWORD}`);
  console.log(`   Week:     ${weekStr} (${weekStart} — ${weekEnd})`);

  await db.pool.end();
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});

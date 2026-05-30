exports.up = (pgm) => {
  //   pgm.addColumn('profiles', {
  //   llm_token_count: { type: 'integer', default: 0, notNull: true },
  // });
  // IF NOT EXISTS memastikan migration aman dijalankan ulang
  pgm.sql(`
    ALTER TABLE profiles
      ADD COLUMN IF NOT EXISTS llm_token_count INTEGER NOT NULL DEFAULT 0;
  `);
};

exports.down = (pgm) => {
  pgm.dropColumn('profiles', 'llm_token_count');
};

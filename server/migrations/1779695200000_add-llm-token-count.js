exports.up = (pgm) => {
  pgm.addColumn('profiles', {
    llm_token_count: { type: 'integer', default: 0, notNull: true },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('profiles', 'llm_token_count');
};

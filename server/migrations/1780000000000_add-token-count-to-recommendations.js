exports.up = (pgm) => {
  pgm.addColumn('ai_recommendations', {
    token_count: { type: 'integer', notNull: true, default: 0 },
  });
};

exports.down = (pgm) => {
  pgm.dropColumn('ai_recommendations', 'token_count');
};

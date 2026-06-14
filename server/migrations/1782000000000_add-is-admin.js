exports.up = (pgm) => {
  pgm.addColumns('users', {
    is_admin: { type: 'boolean', notNull: true, default: false },
  });
};

exports.down = (pgm) => {
  pgm.dropColumns('users', ['is_admin']);
};

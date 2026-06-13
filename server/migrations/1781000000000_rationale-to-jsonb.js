exports.up = (pgm) => {
  pgm.sql(`
    ALTER TABLE tasks
      ALTER COLUMN rationale TYPE jsonb
      USING CASE
        WHEN rationale IS NULL OR rationale = '' THEN '[]'::jsonb
        ELSE to_jsonb(rationale)
      END;
  `);
  pgm.sql("ALTER TABLE tasks ALTER COLUMN rationale SET DEFAULT '[]'::jsonb;");
};

exports.down = (pgm) => {
  pgm.sql("ALTER TABLE tasks ALTER COLUMN rationale TYPE text USING rationale::text;");
  pgm.sql("ALTER TABLE tasks ALTER COLUMN rationale DROP DEFAULT;");
};

import AppDataSource from '../data-source';

async function seed() {
  await AppDataSource.initialize();

  const updates = [
    {
      id: 1,
      image_url:
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 2,
      image_url:
        'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 3,
      image_url:
        'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=800&q=80',
    },
    {
      id: 4,
      image_url:
        'https://images.unsplash.com/photo-1541888946425-d0fbb186156f?auto=format&fit=crop&w=800&q=80',
    },
  ];

  for (const u of updates) {
    await AppDataSource.query(
      `UPDATE "why_choose_us" SET "image_url" = $1 WHERE "id" = $2 AND "image_url" IS NULL`,
      [u.image_url, u.id],
    );
  }

  console.log('Seed Why Choose Us images updated successfully.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});

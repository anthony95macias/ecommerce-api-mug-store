// db/seed.ts

// Load .env variables first
import 'dotenv/config';

import { v4 as uuidv4 } from 'uuid';
import { loremIpsum } from 'lorem-ipsum';
import { db } from './migrate';
import { categories, mugs } from './schema';

// Debug output: ensure env variables are loaded
console.log('TURSO_URL:', process.env.TURSO_URL);
console.log('TURSO_AUTH_TOKEN:', process.env.TURSO_AUTH_TOKEN);

async function seed() {
  // Optional: Clear existing data to avoid UNIQUE constraint issues
  await db.delete(mugs).execute();
  await db.delete(categories).execute();
  console.log('Cleared existing mugs and categories.');

  // Seed categories
  const categoryData = [
    { name: 'Cool Mugs', id: uuidv4() },
    { name: 'Lame Mugs', id: uuidv4() },
  ];

  const storedCategories = await db
    .insert(categories)
    .values(categoryData)
    .returning()
    .all();

  console.log(`Inserted ${storedCategories.length} categories!`);

  // For consistency, choose one category randomly for all mugs
  const getIndex = Math.random() > 0.5 ? 1 : 0;

  // Generate 500 mug entries
  const mugsData = Array.from({ length: 500 }, (_, i) => {
    const adjectives = [
      'Lazy',
      'Bright',
      'Happy',
      'Bold',
      'Smooth',
      'Fierce',
      'Elegant',
      'Wild',
      'Creative',
      'Mysterious',
    ];
    const randomAdj =
      adjectives[Math.floor(Math.random() * adjectives.length)];
    const mugName = `${randomAdj} Mug #${i + 1}`;

    // Generate a one-sentence description and random price between 20 and 99
    const description = loremIpsum({ count: 1, units: 'sentences' });
    const price = Math.floor(Math.random() * 80) + 20;

    return {
      id: uuidv4(),
      name: mugName,
      description,
      price,
      categoryId: storedCategories[getIndex].id,
      image: `https://via.placeholder.com/150?text=Mug+${i + 1}`,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
  });

  const storedMugs = await db
    .insert(mugs)
    .values(mugsData)
    .returning()
    .all();

  console.log(`Inserted ${storedMugs.length} mugs!`);
}

seed()
  .then(() => {
    console.log('Seeding completed!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  });

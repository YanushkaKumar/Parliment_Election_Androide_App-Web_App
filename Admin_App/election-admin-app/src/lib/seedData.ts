import type { Firestore } from 'firebase/firestore';
// @ts-ignore: '../firebase' has no type declarations
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const typedDb = db as unknown as Firestore;

const districts = [
  'Colombo', 'Gampaha', 'Kalutara', 'Kandy', 'Matale', 
  'Nuwara Eliya', 'Galle', 'Matara', 'Hambantota', 'Jaffna',
  'Kilinochchi', 'Mannar', 'Vavuniya', 'Mullaitivu', 'Batticaloa',
  'Ampara', 'Trincomalee', 'Kurunegala', 'Puttalam', 'Anuradhapura',
  'Polonnaruwa', 'Badulla', 'Monaragala', 'Ratnapura', 'Kegalle'
];

const parties = [
  'United National Party (UNP)',
  'Sri Lanka Podujana Peramuna (SLPP)',
  'Samagi Jana Balawegaya (SJB)',
  'Janatha Vimukthi Peramuna (JVP)',
  'Tamil National Alliance (TNA)',
  'Independent'
];

export const seedDatabase = async () => {
  try {
    console.log('🌱 Starting database seeding...');

    // Seed Districts
    console.log('📍 Seeding districts...');
    for (const districtName of districts) {
      await addDoc(collection(typedDb, 'districts'), {
        name: districtName,
        totalVotes: 0,
        registeredVoters: Math.floor(Math.random() * 500000) + 100000,
        createdAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${districts.length} districts`);

    // Seed Sample Candidates
    console.log('👥 Seeding sample candidates...');
    const sampleCandidates = [
      { name: 'Ranil Wickremesinghe', party: 'United National Party (UNP)', district: 'Colombo' },
      { name: 'Mahinda Rajapaksa', party: 'Sri Lanka Podujana Peramuna (SLPP)', district: 'Hambantota' },
      { name: 'Sajith Premadasa', party: 'Samagi Jana Balawegaya (SJB)', district: 'Colombo' },
      { name: 'Anura Kumara Dissanayake', party: 'Janatha Vimukthi Peramuna (JVP)', district: 'Colombo' },
      { name: 'R. Sampanthan', party: 'Tamil National Alliance (TNA)', district: 'Jaffna' },
    ];

    for (const candidate of sampleCandidates) {
      await addDoc(collection(typedDb, 'candidates'), {
        ...candidate,
        votes: 0,
        createdAt: new Date().toISOString(),
      });
    }
    console.log(`✅ Created ${sampleCandidates.length} sample candidates`);

    console.log('✨ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
};

export const clearDatabase = async () => {
  try {
    console.log('🗑️ Clearing database...');

    // Clear districts
    const districtsSnapshot = await getDocs(collection(typedDb, 'districts'));
    for (const docSnapshot of districtsSnapshot.docs) {
      await deleteDoc(doc(typedDb, 'districts', docSnapshot.id));
    }

    // Clear candidates
    const candidatesSnapshot = await getDocs(collection(typedDb, 'candidates'));
    for (const docSnapshot of candidatesSnapshot.docs) {
      await deleteDoc(doc(typedDb, 'candidates', docSnapshot.id));
    }

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

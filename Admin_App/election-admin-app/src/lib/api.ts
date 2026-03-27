// @ts-ignore: no type declarations for '../firebase'
import { db } from '../firebase';
import { 
  collection, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc,
  query,
  orderBy 
} from 'firebase/firestore';

export interface Candidate {
  id: string;
  name: string;
  party: string;
  district: string;
  votes: number;
}

export interface District {
  id: string;
  name: string;
  totalVotes: number;
  registeredVoters: number;
}

export interface DashboardStats {
  totalVotes: number;
  totalCandidates: number;
  totalDistricts: number;
  turnoutPercentage: number;
}

export const api = {
  // Dashboard
  getDashboardStats: async (): Promise<DashboardStats> => {
    try {
      const candidatesSnapshot = await getDocs(collection(db, 'candidates'));
      const districtsSnapshot = await getDocs(collection(db, 'districts'));
      
      const candidates = candidatesSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Candidate[];
      
      const districts = districtsSnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as District[];
      
      const totalVotes = candidates.reduce((sum, c) => sum + (c.votes || 0), 0);
      const totalRegistered = districts.reduce((sum, d) => sum + (d.registeredVoters || 0), 0);
      const turnoutPercentage = totalRegistered > 0 ? (totalVotes / totalRegistered) * 100 : 0;
      
      return {
        totalVotes,
        totalCandidates: candidates.length,
        totalDistricts: districts.length,
        turnoutPercentage,
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      throw error;
    }
  },

  // Candidates
  getCandidates: async (): Promise<Candidate[]> => {
    try {
      const q = query(collection(db, 'candidates'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Candidate[];
    } catch (error) {
      console.error('Error getting candidates:', error);
      throw error;
    }
  },
  
  getCandidate: async (id: string): Promise<Candidate> => {
    try {
      const docRef = doc(db, 'candidates', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Candidate;
      }
      throw new Error('Candidate not found');
    } catch (error) {
      console.error('Error getting candidate:', error);
      throw error;
    }
  },
  
  createCandidate: async (data: Omit<Candidate, 'id' | 'votes'>): Promise<Candidate> => {
    try {
      const docRef = await addDoc(collection(db, 'candidates'), {
        ...data,
        votes: 0,
        createdAt: new Date().toISOString(),
      });
      return { id: docRef.id, ...data, votes: 0 };
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  },
  
  updateCandidate: async (id: string, data: Partial<Candidate>): Promise<Candidate> => {
    try {
      const docRef = doc(db, 'candidates', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      const updated = await getDoc(docRef);
      return { id: updated.id, ...updated.data() } as Candidate;
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  },
  
  deleteCandidate: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'candidates', id));
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  },

  // Districts
  getDistricts: async (): Promise<District[]> => {
    try {
      const q = query(collection(db, 'districts'), orderBy('name'));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as District[];
    } catch (error) {
      console.error('Error getting districts:', error);
      throw error;
    }
  },
  
  getDistrict: async (id: string): Promise<District> => {
    try {
      const docRef = doc(db, 'districts', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as District;
      }
      throw new Error('District not found');
    } catch (error) {
      console.error('Error getting district:', error);
      throw error;
    }
  },
  
  createDistrict: async (data: Omit<District, 'id' | 'totalVotes'>): Promise<District> => {
    try {
      const docRef = await addDoc(collection(db, 'districts'), {
        ...data,
        totalVotes: 0,
        createdAt: new Date().toISOString(),
      });
      return { id: docRef.id, ...data, totalVotes: 0 };
    } catch (error) {
      console.error('Error creating district:', error);
      throw error;
    }
  },
  
  updateDistrict: async (id: string, data: Partial<District>): Promise<District> => {
    try {
      const docRef = doc(db, 'districts', id);
      await updateDoc(docRef, {
        ...data,
        updatedAt: new Date().toISOString(),
      });
      const updated = await getDoc(docRef);
      return { id: updated.id, ...updated.data() } as District;
    } catch (error) {
      console.error('Error updating district:', error);
      throw error;
    }
  },
  
  deleteDistrict: async (id: string): Promise<void> => {
    try {
      await deleteDoc(doc(db, 'districts', id));
    } catch (error) {
      console.error('Error deleting district:', error);
      throw error;
    }
  },
};

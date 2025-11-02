import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  serverTimestamp,
  onSnapshot,
  enableIndexedDbPersistence
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { Document } from '../types';

// Enable offline persistence for Firestore
try {
  enableIndexedDbPersistence(db).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.warn('The current browser does not support persistence.');
    }
  });
} catch (error) {
  console.warn('Could not enable Firestore persistence:', error);
}

export const saveDocument = async (docData: Omit<Document, 'id'> & { userId: string }): Promise<string> => {
  const docRef = await addDoc(collection(db, 'documents'), {
    ...docData,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return docRef.id;
};

export const getUserDocuments = async (userId: string): Promise<Document[]> => {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId)
  );
  const querySnapshot = await getDocs(q);
  const documents = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Document));
  // Sort client-side to avoid needing composite index
  return documents.sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();
    return dateB - dateA;
  });
};

export const subscribeToUserDocuments = (
  userId: string,
  callback: (documents: Document[]) => void
): (() => void) => {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId)
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const documents = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Document));
    // Sort client-side to avoid needing composite index
    const sortedDocs = documents.sort((a, b) => {
      const dateA = new Date(a.uploadedAt).getTime();
      const dateB = new Date(b.uploadedAt).getTime();
      return dateB - dateA;
    });
    callback(sortedDocs);
  }, (error) => {
    console.error('Error subscribing to documents:', error);
    callback([]);
  });

  return unsubscribe;
};

export const updateDocument = async (docId: string, updates: Partial<Document>) => {
  const docRef = doc(db, 'documents', docId);
  await updateDoc(docRef, {
    ...updates,
    updatedAt: serverTimestamp()
  });
};

export const deleteDocument = async (docId: string) => {
  const docRef = doc(db, 'documents', docId);
  await deleteDoc(docRef);
};

export const getDocumentById = async (docId: string): Promise<Document | null> => {
  const docSnap = await getDocs(query(collection(db, 'documents'), where('__name__', '==', docId)));
  
  if (!docSnap.empty) {
    const docData = docSnap.docs[0].data();
    return {
      id: docSnap.docs[0].id,
      ...docData
    } as Document;
  }
  return null;
};


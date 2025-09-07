import {
  CollectionReference,
  QueryConstraint,
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  LinkingCode,
  LinkingCodeDocument,
  Partnership,
  PartnershipDocument,
  Task,
  TaskDocument,
  TaskStatus,
  User,
  UserDocument,
  documentToLinkingCode,
  documentToPartnership,
  documentToTask,
  documentToUser,
  linkingCodeToDocument,
  partnershipToDocument,
  taskToDocument,
  userToDocument,
} from '../types';

// ============================================================================
// COLLECTION REFERENCES
// ============================================================================

export const COLLECTIONS = {
  USERS: 'users',
  TASKS: 'tasks',
  PARTNERSHIPS: 'partnerships',
  LINKING_CODES: 'linkingCodes',
} as const;

// Collection references
export const usersCollection = collection(
  db,
  COLLECTIONS.USERS,
) as CollectionReference<UserDocument>;
export const tasksCollection = collection(
  db,
  COLLECTIONS.TASKS,
) as CollectionReference<TaskDocument>;
export const partnershipsCollection = collection(
  db,
  COLLECTIONS.PARTNERSHIPS,
) as CollectionReference<PartnershipDocument>;
export const linkingCodesCollection = collection(
  db,
  COLLECTIONS.LINKING_CODES,
) as CollectionReference<LinkingCodeDocument>;

// ============================================================================
// USER OPERATIONS
// ============================================================================

export const createUser = async (user: User): Promise<void> => {
  const userDoc = userToDocument(user);
  const userRef = doc(usersCollection, user.id);
  await setDoc(userRef, userDoc);
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(usersCollection, userId);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    return null;
  }

  return documentToUser({ ...userSnap.data(), id: userSnap.id });
};

export const updateUser = async (
  userId: string,
  updates: Partial<User>,
): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  const updateData: Partial<UserDocument> = {};

  // Convert Date fields to Timestamps and ensure proper typing
  Object.entries(updates).forEach(([key, value]) => {
    if (value instanceof Date) {
      (updateData as Record<string, unknown>)[key] = Timestamp.fromDate(value);
    } else if (value === null) {
      (updateData as Record<string, unknown>)[key] = null;
    } else {
      (updateData as Record<string, unknown>)[key] = value;
    }
  });

  // Always update lastActive
  (updateData as Record<string, unknown>).lastActive = serverTimestamp();

  await updateDoc(userRef, updateData);
};

export const deleteUser = async (userId: string): Promise<void> => {
  const userRef = doc(usersCollection, userId);
  await deleteDoc(userRef);
};

// ============================================================================
// TASK OPERATIONS
// ============================================================================

export const createTask = async (task: Task): Promise<void> => {
  const taskDoc = taskToDocument(task);
  const taskRef = doc(tasksCollection, task.id);
  await setDoc(taskRef, taskDoc);
};

export const getTask = async (taskId: string): Promise<Task | null> => {
  const taskRef = doc(tasksCollection, taskId);
  const taskSnap = await getDoc(taskRef);

  if (!taskSnap.exists()) {
    return null;
  }

  return documentToTask({ ...taskSnap.data(), id: taskSnap.id });
};

export const updateTask = async (
  taskId: string,
  updates: Partial<Task>,
): Promise<void> => {
  const taskRef = doc(tasksCollection, taskId);
  const updateData: Partial<TaskDocument> = {};

  // Convert Date fields to Timestamps and ensure proper typing
  Object.entries(updates).forEach(([key, value]) => {
    if (value instanceof Date) {
      (updateData as Record<string, unknown>)[key] = Timestamp.fromDate(value);
    } else if (value === null) {
      (updateData as Record<string, unknown>)[key] = null;
    } else {
      (updateData as Record<string, unknown>)[key] = value;
    }
  });

  // Always update updatedAt
  (updateData as Record<string, unknown>).updatedAt = serverTimestamp();

  await updateDoc(taskRef, updateData);
};

export const deleteTask = async (taskId: string): Promise<void> => {
  const taskRef = doc(tasksCollection, taskId);
  await deleteDoc(taskRef);
};

export const getTasksByPartnership = async (
  partnershipId: string,
  status?: TaskStatus,
  limitCount?: number,
): Promise<Task[]> => {
  const constraints: QueryConstraint[] = [
    where('partnershipId', '==', partnershipId),
    orderBy('createdAt', 'desc'),
  ];

  if (status) {
    constraints.push(where('status', '==', status));
  }

  if (limitCount) {
    constraints.push(limit(limitCount));
  }

  const q = query(tasksCollection, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) =>
    documentToTask({ ...doc.data(), id: doc.id }),
  );
};

export const getTasksByAssignee = async (
  partnershipId: string,
  assigneeId: string,
  status?: TaskStatus,
): Promise<Task[]> => {
  const constraints: QueryConstraint[] = [
    where('partnershipId', '==', partnershipId),
    where('assignedTo', '==', assigneeId),
    orderBy('createdAt', 'desc'),
  ];

  if (status) {
    constraints.push(where('status', '==', status));
  }

  const q = query(tasksCollection, ...constraints);
  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) =>
    documentToTask({ ...doc.data(), id: doc.id }),
  );
};

export const getUnassignedTasks = async (
  partnershipId: string,
): Promise<Task[]> => {
  const q = query(
    tasksCollection,
    where('partnershipId', '==', partnershipId),
    where('assignedTo', '==', null),
    orderBy('createdAt', 'desc'),
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) =>
    documentToTask({ ...doc.data(), id: doc.id }),
  );
};

// ============================================================================
// PARTNERSHIP OPERATIONS
// ============================================================================

export const createPartnership = async (
  partnership: Partnership,
): Promise<void> => {
  const partnershipDoc = partnershipToDocument(partnership);
  const partnershipRef = doc(partnershipsCollection, partnership.id);
  await setDoc(partnershipRef, partnershipDoc);
};

export const getPartnership = async (
  partnershipId: string,
): Promise<Partnership | null> => {
  const partnershipRef = doc(partnershipsCollection, partnershipId);
  const partnershipSnap = await getDoc(partnershipRef);

  if (!partnershipSnap.exists()) {
    return null;
  }

  return documentToPartnership({
    ...partnershipSnap.data(),
    id: partnershipSnap.id,
  });
};

export const getPartnershipByUserId = async (
  userId: string,
): Promise<Partnership | null> => {
  // Check if user is user1
  let q = query(
    partnershipsCollection,
    where('user1Id', '==', userId),
    where('isActive', '==', true),
    limit(1),
  );

  let querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return documentToPartnership({ ...doc.data(), id: doc.id });
  }

  // Check if user is user2
  q = query(
    partnershipsCollection,
    where('user2Id', '==', userId),
    where('isActive', '==', true),
    limit(1),
  );

  querySnapshot = await getDocs(q);

  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return documentToPartnership({ ...doc.data(), id: doc.id });
  }

  return null;
};

export const updatePartnership = async (
  partnershipId: string,
  updates: Partial<Partnership>,
): Promise<void> => {
  const partnershipRef = doc(partnershipsCollection, partnershipId);
  const updateData: Partial<PartnershipDocument> = {};

  // Convert Date fields to Timestamps and ensure proper typing
  Object.entries(updates).forEach(([key, value]) => {
    if (value instanceof Date) {
      (updateData as Record<string, unknown>)[key] = Timestamp.fromDate(value);
    } else if (value === null) {
      (updateData as Record<string, unknown>)[key] = null;
    } else {
      (updateData as Record<string, unknown>)[key] = value;
    }
  });

  await updateDoc(partnershipRef, updateData);
};

// ============================================================================
// LINKING CODE OPERATIONS
// ============================================================================

export const createLinkingCode = async (
  linkingCode: LinkingCode,
): Promise<void> => {
  const linkingCodeDoc = linkingCodeToDocument(linkingCode);
  const linkingCodeRef = doc(linkingCodesCollection, linkingCode.code);
  await setDoc(linkingCodeRef, linkingCodeDoc);
};

export const getLinkingCode = async (
  code: string,
): Promise<LinkingCode | null> => {
  const linkingCodeRef = doc(linkingCodesCollection, code);
  const linkingCodeSnap = await getDoc(linkingCodeRef);

  if (!linkingCodeSnap.exists()) {
    return null;
  }

  return documentToLinkingCode({
    ...linkingCodeSnap.data(),
    code: linkingCodeSnap.id,
  });
};

export const updateLinkingCode = async (
  code: string,
  updates: Partial<LinkingCode>,
): Promise<void> => {
  const linkingCodeRef = doc(linkingCodesCollection, code);
  const updateData: Partial<LinkingCodeDocument> = {};

  // Convert Date fields to Timestamps and ensure proper typing
  Object.entries(updates).forEach(([key, value]) => {
    if (value instanceof Date) {
      (updateData as Record<string, unknown>)[key] = Timestamp.fromDate(value);
    } else if (value === null) {
      (updateData as Record<string, unknown>)[key] = null;
    } else {
      (updateData as Record<string, unknown>)[key] = value;
    }
  });

  await updateDoc(linkingCodeRef, updateData);
};

export const deleteLinkingCode = async (code: string): Promise<void> => {
  const linkingCodeRef = doc(linkingCodesCollection, code);
  await deleteDoc(linkingCodeRef);
};

export const getActiveLinkingCodesByUser = async (
  userId: string,
): Promise<LinkingCode[]> => {
  const now = Timestamp.now();
  const q = query(
    linkingCodesCollection,
    where('createdBy', '==', userId),
    where('isUsed', '==', false),
    where('expiresAt', '>', now),
    orderBy('expiresAt', 'desc'),
  );

  const querySnapshot = await getDocs(q);

  return querySnapshot.docs.map((doc) =>
    documentToLinkingCode({ ...doc.data(), code: doc.id }),
  );
};

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================

export const subscribeToTasks = (
  partnershipId: string,
  callback: (tasks: Task[]) => void,
  status?: TaskStatus,
): (() => void) => {
  const constraints: QueryConstraint[] = [
    where('partnershipId', '==', partnershipId),
    orderBy('createdAt', 'desc'),
  ];

  if (status) {
    constraints.push(where('status', '==', status));
  }

  const q = query(tasksCollection, ...constraints);

  return onSnapshot(q, (querySnapshot) => {
    const tasks = querySnapshot.docs.map((doc) =>
      documentToTask({ ...doc.data(), id: doc.id }),
    );
    callback(tasks);
  });
};

export const subscribeToPartnership = (
  partnershipId: string,
  callback: (partnership: Partnership | null) => void,
): (() => void) => {
  const partnershipRef = doc(partnershipsCollection, partnershipId);

  return onSnapshot(partnershipRef, (doc) => {
    if (doc.exists()) {
      const partnership = documentToPartnership({ ...doc.data(), id: doc.id });
      callback(partnership);
    } else {
      callback(null);
    }
  });
};

export const subscribeToUser = (
  userId: string,
  callback: (user: User | null) => void,
): (() => void) => {
  const userRef = doc(usersCollection, userId);

  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      const user = documentToUser({ ...doc.data(), id: doc.id });
      callback(user);
    } else {
      callback(null);
    }
  });
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const linkUsers = async (
  user1Id: string,
  user2Id: string,
  partnershipId: string,
): Promise<void> => {
  const batch = writeBatch(db);

  // Update both users with partnership info
  const user1Ref = doc(usersCollection, user1Id);
  const user2Ref = doc(usersCollection, user2Id);

  batch.update(user1Ref, {
    partnerId: user2Id,
    partnershipId,
    lastActive: serverTimestamp(),
  });

  batch.update(user2Ref, {
    partnerId: user1Id,
    partnershipId,
    lastActive: serverTimestamp(),
  });

  // Create partnership document
  const partnershipRef = doc(partnershipsCollection, partnershipId);
  const partnershipData: Partial<PartnershipDocument> = {
    id: partnershipId,
    user1Id,
    user2Id,
    createdAt: serverTimestamp() as Timestamp,
    sharedPoints: 0,
    isActive: true,
  };

  batch.set(partnershipRef, partnershipData);

  await batch.commit();
};

export const completeTask = async (
  taskId: string,
  completedBy: string,
  pointsToAdd: number = 10,
): Promise<void> => {
  const batch = writeBatch(db);

  // Update task status
  const taskRef = doc(tasksCollection, taskId);
  batch.update(taskRef, {
    status: 'done' as TaskStatus,
    completedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Update user points
  const userRef = doc(usersCollection, completedBy);
  batch.update(userRef, {
    totalPoints: (await getUser(completedBy))?.totalPoints || 0 + pointsToAdd,
    lastActive: serverTimestamp(),
  });

  // Get task to find partnership and update shared points
  const task = await getTask(taskId);
  if (task?.partnershipId) {
    const partnershipRef = doc(partnershipsCollection, task.partnershipId);
    const partnership = await getPartnership(task.partnershipId);
    if (partnership) {
      batch.update(partnershipRef, {
        sharedPoints: partnership.sharedPoints + pointsToAdd,
      });
    }
  }

  await batch.commit();
};

// ============================================================================
// DATA EXPORT OPERATIONS
// ============================================================================

export interface UserDataExport {
  version: string;
  exportDate: string;
  user: User;
  tasks: Task[];
  partnership?: Partnership;
  metadata: {
    totalTasks: number;
    completedTasks: number;
    totalPoints: number;
    partnershipActive: boolean;
  };
}

export const exportUserData = async (userId: string): Promise<UserDataExport> => {
  // Get user data
  const user = await getUser(userId);
  if (!user) {
    throw new Error('User not found');
  }

  // Get partnership data if user has a partnership
  let partnership: Partnership | undefined;
  if (user.partnershipId) {
    const partnershipData = await getPartnership(user.partnershipId);
    partnership = partnershipData || undefined;
  }

  // Get all tasks for the user's partnership
  let tasks: Task[] = [];
  if (user.partnershipId) {
    tasks = await getTasksByPartnership(user.partnershipId);
  }

  // Calculate metadata
  const completedTasks = tasks.filter(task => task.status === 'done').length;
  
  const exportData: UserDataExport = {
    version: '1.0.0',
    exportDate: new Date().toISOString(),
    user,
    tasks,
    partnership,
    metadata: {
      totalTasks: tasks.length,
      completedTasks,
      totalPoints: user.totalPoints,
      partnershipActive: partnership?.isActive || false,
    },
  };

  return exportData;
};

// ============================================================================
// CLEANUP OPERATIONS
// ============================================================================

export const cleanupExpiredLinkingCodes = async (): Promise<void> => {
  const now = Timestamp.now();
  const q = query(linkingCodesCollection, where('expiresAt', '<=', now));

  const querySnapshot = await getDocs(q);
  const batch = writeBatch(db);

  querySnapshot.docs.forEach((doc) => {
    batch.delete(doc.ref);
  });

  if (!querySnapshot.empty) {
    await batch.commit();
  }
};

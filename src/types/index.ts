import { Timestamp } from 'firebase/firestore';

// Export theme types
export * from './theme';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type TaskCategory = 'Household' | 'Errands' | 'Financial' | 'Planning' | 'Wellness' | 'Misc';

export type TaskStatus = 'todo' | 'in_progress' | 'done';

// ============================================================================
// DATA MODELS
// ============================================================================

export interface User {
  id: string;
  email: string;
  displayName?: string;
  partnerId?: string;
  partnershipId?: string;
  createdAt: Date;
  lastActive: Date;
  totalPoints: number;
  hasCompletedOnboarding?: boolean;
  expoPushToken?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  assignedTo?: string; // User ID
  createdBy: string; // User ID
  status: TaskStatus;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  partnershipId: string;
}

export interface Partnership {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Date;
  sharedPoints: number;
  isActive: boolean;
}

export interface LinkingCode {
  code: string;
  createdBy: string;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
}

// ============================================================================
// FIRESTORE DOCUMENT TYPES (for serialization)
// ============================================================================

export interface UserDocument {
  id: string;
  email: string;
  displayName?: string;
  partnerId?: string;
  partnershipId?: string;
  createdAt: Timestamp;
  lastActive: Timestamp;
  totalPoints: number;
  hasCompletedOnboarding?: boolean;
  expoPushToken?: string;
  lastTokenUpdate?: Timestamp;
}

export interface TaskDocument {
  id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  assignedTo?: string;
  createdBy: string;
  status: TaskStatus;
  dueDate?: Timestamp;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  completedAt?: Timestamp;
  partnershipId: string;
}

export interface PartnershipDocument {
  id: string;
  user1Id: string;
  user2Id: string;
  createdAt: Timestamp;
  sharedPoints: number;
  isActive: boolean;
}

export interface LinkingCodeDocument {
  code: string;
  createdBy: string;
  expiresAt: Timestamp;
  isUsed: boolean;
  createdAt: Timestamp;
}

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Onboarding: undefined;
  PartnerLinking: undefined;
};

export type PartnerLinkingStackParamList = {
  LinkingScreen: undefined;
  LinkSuccessScreen: { partnerName?: string };
};

export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Profile: undefined;
};

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const validateUser = (user: Partial<User>): string[] => {
  const errors: string[] = [];
  
  if (!user.id || typeof user.id !== 'string' || user.id.trim().length === 0) {
    errors.push('User ID is required and must be a non-empty string');
  }
  
  if (!user.email || typeof user.email !== 'string') {
    errors.push('Email is required and must be a string');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(user.email)) {
    errors.push('Email must be a valid email address');
  }
  
  if (user.displayName !== undefined && (typeof user.displayName !== 'string' || user.displayName.trim().length === 0)) {
    errors.push('Display name must be a non-empty string if provided');
  }
  
  if (user.partnerId !== undefined && (typeof user.partnerId !== 'string' || user.partnerId.trim().length === 0)) {
    errors.push('Partner ID must be a non-empty string if provided');
  }
  
  if (user.partnershipId !== undefined && (typeof user.partnershipId !== 'string' || user.partnershipId.trim().length === 0)) {
    errors.push('Partnership ID must be a non-empty string if provided');
  }
  
  if (user.totalPoints !== undefined && (typeof user.totalPoints !== 'number' || user.totalPoints < 0)) {
    errors.push('Total points must be a non-negative number');
  }
  
  return errors;
};

export const validateTask = (task: Partial<Task>): string[] => {
  const errors: string[] = [];
  const validCategories: TaskCategory[] = ['Household', 'Errands', 'Financial', 'Planning', 'Wellness', 'Misc'];
  const validStatuses: TaskStatus[] = ['todo', 'in_progress', 'done'];
  
  if (!task.id || typeof task.id !== 'string' || task.id.trim().length === 0) {
    errors.push('Task ID is required and must be a non-empty string');
  }
  
  if (!task.title || typeof task.title !== 'string' || task.title.trim().length === 0) {
    errors.push('Task title is required and must be a non-empty string');
  } else if (task.title.length > 100) {
    errors.push('Task title must be 100 characters or less');
  }
  
  if (task.description !== undefined && typeof task.description !== 'string') {
    errors.push('Task description must be a string if provided');
  } else if (task.description && task.description.length > 500) {
    errors.push('Task description must be 500 characters or less');
  }
  
  if (!task.category || !validCategories.includes(task.category)) {
    errors.push(`Task category is required and must be one of: ${  validCategories.join(', ')}`);
  }
  
  if (task.assignedTo !== undefined && (typeof task.assignedTo !== 'string' || task.assignedTo.trim().length === 0)) {
    errors.push('Assigned to must be a non-empty string if provided');
  }
  
  if (!task.createdBy || typeof task.createdBy !== 'string' || task.createdBy.trim().length === 0) {
    errors.push('Created by is required and must be a non-empty string');
  }
  
  if (!task.status || !validStatuses.includes(task.status)) {
    errors.push(`Task status is required and must be one of: ${  validStatuses.join(', ')}`);
  }
  
  if (!task.partnershipId || typeof task.partnershipId !== 'string' || task.partnershipId.trim().length === 0) {
    errors.push('Partnership ID is required and must be a non-empty string');
  }
  
  return errors;
};

export const validatePartnership = (partnership: Partial<Partnership>): string[] => {
  const errors: string[] = [];
  
  if (!partnership.id || typeof partnership.id !== 'string' || partnership.id.trim().length === 0) {
    errors.push('Partnership ID is required and must be a non-empty string');
  }
  
  if (!partnership.user1Id || typeof partnership.user1Id !== 'string' || partnership.user1Id.trim().length === 0) {
    errors.push('User1 ID is required and must be a non-empty string');
  }
  
  if (!partnership.user2Id || typeof partnership.user2Id !== 'string' || partnership.user2Id.trim().length === 0) {
    errors.push('User2 ID is required and must be a non-empty string');
  }
  
  if (partnership.user1Id === partnership.user2Id) {
    errors.push('User1 ID and User2 ID cannot be the same');
  }
  
  if (partnership.sharedPoints !== undefined && (typeof partnership.sharedPoints !== 'number' || partnership.sharedPoints < 0)) {
    errors.push('Shared points must be a non-negative number');
  }
  
  if (partnership.isActive !== undefined && typeof partnership.isActive !== 'boolean') {
    errors.push('Is active must be a boolean if provided');
  }
  
  return errors;
};

export const validateLinkingCode = (linkingCode: Partial<LinkingCode>): string[] => {
  const errors: string[] = [];
  
  if (!linkingCode.code || typeof linkingCode.code !== 'string') {
    errors.push('Linking code is required and must be a string');
  } else if (!/^[A-Z0-9]{3}-[A-Z0-9]{3}$/.test(linkingCode.code)) {
    errors.push('Linking code must be in format XXX-XXX with alphanumeric characters');
  }
  
  if (!linkingCode.createdBy || typeof linkingCode.createdBy !== 'string' || linkingCode.createdBy.trim().length === 0) {
    errors.push('Created by is required and must be a non-empty string');
  }
  
  if (!linkingCode.expiresAt || !(linkingCode.expiresAt instanceof Date)) {
    errors.push('Expires at is required and must be a Date');
  } else if (linkingCode.expiresAt <= new Date()) {
    errors.push('Expires at must be in the future');
  }
  
  if (linkingCode.isUsed !== undefined && typeof linkingCode.isUsed !== 'boolean') {
    errors.push('Is used must be a boolean if provided');
  }
  
  return errors;
};

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

export const userToDocument = (user: User): UserDocument => ({
  ...user,
  createdAt: Timestamp.fromDate(user.createdAt),
  lastActive: Timestamp.fromDate(user.lastActive),
});

export const documentToUser = (doc: UserDocument): User => ({
  ...doc,
  createdAt: doc.createdAt.toDate(),
  lastActive: doc.lastActive.toDate(),
});

export const taskToDocument = (task: Task): TaskDocument => ({
  ...task,
  createdAt: Timestamp.fromDate(task.createdAt),
  updatedAt: Timestamp.fromDate(task.updatedAt),
  dueDate: task.dueDate ? Timestamp.fromDate(task.dueDate) : undefined,
  completedAt: task.completedAt ? Timestamp.fromDate(task.completedAt) : undefined,
});

export const documentToTask = (doc: TaskDocument): Task => ({
  ...doc,
  createdAt: doc.createdAt.toDate(),
  updatedAt: doc.updatedAt.toDate(),
  dueDate: doc.dueDate?.toDate(),
  completedAt: doc.completedAt?.toDate(),
});

export const partnershipToDocument = (partnership: Partnership): PartnershipDocument => ({
  ...partnership,
  createdAt: Timestamp.fromDate(partnership.createdAt),
});

export const documentToPartnership = (doc: PartnershipDocument): Partnership => ({
  ...doc,
  createdAt: doc.createdAt.toDate(),
});

export const linkingCodeToDocument = (linkingCode: LinkingCode): LinkingCodeDocument => ({
  ...linkingCode,
  expiresAt: Timestamp.fromDate(linkingCode.expiresAt),
  createdAt: Timestamp.fromDate(linkingCode.createdAt),
});

export const documentToLinkingCode = (doc: LinkingCodeDocument): LinkingCode => ({
  ...doc,
  expiresAt: doc.expiresAt.toDate(),
  createdAt: doc.createdAt.toDate(),
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const createUser = (
  id: string,
  email: string,
  displayName?: string,
): User => {
  const now = new Date();
  return {
    id,
    email,
    displayName,
    createdAt: now,
    lastActive: now,
    totalPoints: 0,
    hasCompletedOnboarding: false,
  };
};

export const createTask = (
  title: string,
  category: TaskCategory,
  createdBy: string,
  partnershipId: string,
  description?: string,
  assignedTo?: string,
  dueDate?: Date,
): Omit<Task, 'id'> => {
  const now = new Date();
  return {
    title: title.trim(),
    description: description?.trim(),
    category,
    assignedTo,
    createdBy,
    status: 'todo',
    dueDate,
    createdAt: now,
    updatedAt: now,
    partnershipId,
  };
};

export const createPartnership = (user1Id: string, user2Id: string): Omit<Partnership, 'id'> => ({
  user1Id,
  user2Id,
  createdAt: new Date(),
  sharedPoints: 0,
  isActive: true,
});

export const createLinkingCode = (createdBy: string): Omit<LinkingCode, 'code'> => {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 15 * 60 * 1000); // 15 minutes from now
  
  return {
    createdBy,
    expiresAt,
    isUsed: false,
    createdAt: now,
  };
};

export const generateLinkingCode = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
  return `${part1}-${part2}`;
};

export const isTaskOverdue = (task: Task): boolean => {
  if (!task.dueDate || task.status === 'done') return false;
  return task.dueDate < new Date();
};

export const getTasksByStatus = (tasks: Task[], status: TaskStatus): Task[] => {
  return tasks.filter(task => task.status === status);
};

export const getTasksByCategory = (tasks: Task[], category: TaskCategory): Task[] => {
  return tasks.filter(task => task.category === category);
};

export const getTasksAssignedToUser = (tasks: Task[], userId: string): Task[] => {
  return tasks.filter(task => task.assignedTo === userId);
};

export const getUnassignedTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => !task.assignedTo);
};

export const sortTasksByCreatedDate = (tasks: Task[], ascending = false): Task[] => {
  return [...tasks].sort((a, b) => {
    const comparison = a.createdAt.getTime() - b.createdAt.getTime();
    return ascending ? comparison : -comparison;
  });
};

export const sortTasksByDueDate = (tasks: Task[], ascending = true): Task[] => {
  return [...tasks].sort((a, b) => {
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    
    const comparison = a.dueDate.getTime() - b.dueDate.getTime();
    return ascending ? comparison : -comparison;
  });
};
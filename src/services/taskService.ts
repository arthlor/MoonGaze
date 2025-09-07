import {
  QueryConstraint,
  Unsubscribe,
  type UpdateData,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Task,
  TaskCategory,
  TaskStatus,
  createTask as createTaskModel,
  documentToTask,
  taskToDocument,
  validateTask,
} from '../types';
import { 
  getPartnership, 
  getUser, 
  tasksCollection, 
} from './firestoreService';
import { logger } from '../utils/logger';

// ============================================================================
// TASK CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new task in Firestore
 */
export const createTask = async (
  title: string,
  category: TaskCategory,
  createdBy: string,
  partnershipId: string,
  description?: string,
  assignedTo?: string,
  dueDate?: Date,
): Promise<Task> => {
  // Create task model
  const taskData = createTaskModel(
    title,
    category,
    createdBy,
    partnershipId,
    description,
    assignedTo,
    dueDate,
  );

  // Validate task data
  const validationErrors = validateTask({ ...taskData, id: 'temp' });
  if (validationErrors.length > 0) {
    throw new Error(`Task validation failed: ${validationErrors.join(', ')}`);
  }

  try {
    // Add task to Firestore (auto-generates ID)
    const docRef = await addDoc(tasksCollection, taskToDocument({ ...taskData, id: '' }));
    
    // Return the created task with the generated ID
    const createdTask: Task = {
      ...taskData,
      id: docRef.id,
    };

    return createdTask;
  } catch (error) {
    logger.error('Error creating task', error, { 
      function: 'createTask',
      title,
      category,
      createdBy,
      partnershipId, 
    });
    throw new Error('Failed to create task');
  }
};

/**
 * Retrieves a task by ID
 */
export const getTaskById = async (taskId: string): Promise<Task | null> => {
  try {
    const taskRef = doc(tasksCollection, taskId);
    const taskSnap = await getDoc(taskRef);

    if (!taskSnap.exists()) {
      return null;
    }

    return documentToTask({ ...taskSnap.data(), id: taskSnap.id });
  } catch (error) {
    logger.error('Error getting task', error, { 
      function: 'getTaskById',
      taskId, 
    });
    throw new Error('Failed to retrieve task');
  }
};

/**
 * Updates a task with the provided data
 */
export const updateTask = async (
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'createdAt' | 'createdBy' | 'partnershipId'>>,
): Promise<void> => {
  try {
    const taskRef = doc(tasksCollection, taskId);
    const updateData: UpdateData<Task> = { ...updates };

    // Convert Date fields to server timestamps
    if (updates.dueDate) {
      updateData.dueDate = updates.dueDate;
    }
    if (updates.completedAt) {
      updateData.completedAt = updates.completedAt;
    }

    // Always update the updatedAt timestamp
    updateData.updatedAt = serverTimestamp();

    await updateDoc(taskRef, updateData);
  } catch (error) {
    logger.error('Error updating task', error, { 
      function: 'updateTask',
      taskId,
      updates: Object.keys(updates), 
    });
    throw new Error('Failed to update task');
  }
};

/**
 * Deletes a task by ID
 */
export const deleteTask = async (taskId: string, userId: string): Promise<void> => {
  try {
    // First check if user has permission to delete (must be creator)
    const task = await getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.createdBy !== userId) {
      throw new Error('Only the task creator can delete this task');
    }

    const taskRef = doc(tasksCollection, taskId);
    await deleteDoc(taskRef);
  } catch (error) {
    logger.error('Error deleting task', error, { 
      function: 'deleteTask',
      taskId, 
    });
    throw new Error('Failed to delete task');
  }
};

// ============================================================================
// TASK QUERY OPERATIONS
// ============================================================================

/**
 * Gets all tasks for a partnership with optional filtering
 */
export const getTasksByPartnership = async (
  partnershipId: string,
  options?: {
    status?: TaskStatus;
    assignedTo?: string;
    category?: TaskCategory;
    limitCount?: number;
    includeCompleted?: boolean;
  },
): Promise<Task[]> => {
  try {
    const constraints: QueryConstraint[] = [
      where('partnershipId', '==', partnershipId),
    ];

    // Add status filter
    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    } else if (options?.includeCompleted === false) {
      constraints.push(where('status', '!=', 'done'));
    }

    // Add assignee filter
    if (options?.assignedTo) {
      constraints.push(where('assignedTo', '==', options.assignedTo));
    }

    // Add category filter
    if (options?.category) {
      constraints.push(where('category', '==', options.category));
    }

    // Add ordering and limit
    constraints.push(orderBy('createdAt', 'desc'));
    if (options?.limitCount) {
      constraints.push(limit(options.limitCount));
    }

    const q = query(tasksCollection, ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) =>
      documentToTask({ ...doc.data(), id: doc.id }),
    );
  } catch (error) {
    logger.error('Error getting tasks by partnership', error, { 
      function: 'getTasksByPartnership',
      partnershipId, 
    });
    throw new Error('Failed to retrieve tasks');
  }
};

/**
 * Gets unassigned tasks for a partnership
 */
export const getUnassignedTasks = async (partnershipId: string): Promise<Task[]> => {
  try {
    const q = query(
      tasksCollection,
      where('partnershipId', '==', partnershipId),
      where('assignedTo', '==', null),
      where('status', '!=', 'done'),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map((doc) =>
      documentToTask({ ...doc.data(), id: doc.id }),
    );
  } catch (error) {
    logger.error('Error getting unassigned tasks', error, { 
      function: 'getUnassignedTasks',
      partnershipId, 
    });
    throw new Error('Failed to retrieve unassigned tasks');
  }
};

// ============================================================================
// TASK STATUS MANAGEMENT
// ============================================================================

/**
 * Claims an unassigned task for a user
 */
export const claimTask = async (taskId: string, userId: string): Promise<void> => {
  try {
    const task = await getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.assignedTo) {
      throw new Error('Task is already assigned');
    }

    if (task.status === 'done') {
      throw new Error('Cannot claim a completed task');
    }

    await updateTask(taskId, {
      assignedTo: userId,
      status: 'in_progress',
    });
  } catch (error) {
    logger.error('Error claiming task', error, { 
      function: 'claimTask',
      taskId,
      userId, 
    });
    throw new Error('Failed to claim task');
  }
};

/**
 * Assigns a task to a specific user
 */
export const assignTask = async (
  taskId: string,
  assignedTo: string,
  assignedBy: string,
): Promise<void> => {
  try {
    const task = await getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    // Check if the user has permission to assign (creator or current assignee)
    if (task.createdBy !== assignedBy && task.assignedTo !== assignedBy) {
      throw new Error('Only the task creator or current assignee can reassign this task');
    }

    if (task.status === 'done') {
      throw new Error('Cannot reassign a completed task');
    }

    const newStatus = assignedTo ? 'in_progress' : 'todo';
    
    await updateTask(taskId, {
      assignedTo: assignedTo || undefined,
      status: newStatus,
    });
  } catch (error) {
    logger.error('Error assigning task', error, { 
      function: 'assignTask',
      taskId,
      assignedTo, 
    });
    throw new Error('Failed to assign task');
  }
};

/**
 * Marks a task as complete and awards points
 */
export const completeTask = async (
  taskId: string,
  completedBy: string,
  pointsToAward: number = 10,
): Promise<void> => {
  try {
    const task = await getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status === 'done') {
      throw new Error('Task is already completed');
    }

    // Check if user has permission to complete (must be assigned to them or unassigned)
    if (task.assignedTo && task.assignedTo !== completedBy) {
      throw new Error('Only the assigned user can complete this task');
    }

    // Use batch operation for atomic updates
    const batch = writeBatch(db);

    // Update task status
    const taskRef = doc(tasksCollection, taskId);
    batch.update(taskRef, {
      status: 'done' as TaskStatus,
      assignedTo: completedBy, // Ensure the completer is recorded
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Get current user data to update points
    const user = await getUser(completedBy);
    if (user) {
      const userRef = doc(db, 'users', completedBy);
      batch.update(userRef, {
        totalPoints: user.totalPoints + pointsToAward,
        lastActive: serverTimestamp(),
      });
    }

    // Update partnership shared points
    if (task.partnershipId) {
      const partnership = await getPartnership(task.partnershipId);
      if (partnership) {
        const partnershipRef = doc(db, 'partnerships', task.partnershipId);
        batch.update(partnershipRef, {
          sharedPoints: partnership.sharedPoints + pointsToAward,
        });
      }
    }

    await batch.commit();
  } catch (error) {
    logger.error('Error completing task', error, { 
      function: 'completeTask',
      taskId,
      completedBy, 
    });
    throw new Error('Failed to complete task');
  }
};

/**
 * Reopens a completed task
 */
export const reopenTask = async (taskId: string, userId: string): Promise<void> => {
  try {
    const task = await getTaskById(taskId);
    if (!task) {
      throw new Error('Task not found');
    }

    if (task.status !== 'done') {
      throw new Error('Task is not completed');
    }

    // Check if user has permission (creator or the one who completed it)
    if (task.createdBy !== userId && task.assignedTo !== userId) {
      throw new Error('Only the task creator or completer can reopen this task');
    }

    await updateTask(taskId, {
      status: 'in_progress',
      completedAt: undefined,
    });
  } catch (error) {
    logger.error('Error reopening task', error, { 
      function: 'reopenTask',
      taskId, 
    });
    throw new Error('Failed to reopen task');
  }
};

// ============================================================================
// REAL-TIME LISTENERS
// ============================================================================

/**
 * Subscribes to real-time updates for tasks in a partnership
 */
export const subscribeToPartnershipTasks = (
  partnershipId: string,
  callback: (tasks: Task[]) => void,
  options?: {
    status?: TaskStatus;
    includeCompleted?: boolean;
  },
): Unsubscribe => {
  try {
    const constraints: QueryConstraint[] = [
      where('partnershipId', '==', partnershipId),
    ];

    // Add status filter
    if (options?.status) {
      constraints.push(where('status', '==', options.status));
    } else if (options?.includeCompleted === false) {
      constraints.push(where('status', '!=', 'done'));
    }

    constraints.push(orderBy('createdAt', 'desc'));

    const q = query(tasksCollection, ...constraints);

    return onSnapshot(
      q,
      (querySnapshot) => {
        const tasks = querySnapshot.docs.map((doc) =>
          documentToTask({ ...doc.data(), id: doc.id }),
        );
        callback(tasks);
      },
      (error) => {
        logger.error('Error in task subscription', error, { 
          function: 'subscribeToTasks',
          partnershipId, 
        });
        // Call callback with empty array on error to prevent app crashes
        callback([]);
      },
    );
  } catch (error) {
    logger.error('Error setting up task subscription', error, { 
      function: 'subscribeToTasks',
      partnershipId, 
    });
    // Return a no-op unsubscribe function
    return () => {};
  }
};

/**
 * Subscribes to real-time updates for a specific task
 */
export const subscribeToTask = (
  taskId: string,
  callback: (task: Task | null) => void,
): Unsubscribe => {
  try {
    const taskRef = doc(tasksCollection, taskId);

    return onSnapshot(
      taskRef,
      (doc) => {
        if (doc.exists()) {
          const task = documentToTask({ ...doc.data(), id: doc.id });
          callback(task);
        } else {
          callback(null);
        }
      },
      (error) => {
        logger.error('Error in single task subscription', error, { 
          function: 'subscribeToTask',
          taskId, 
        });
        callback(null);
      },
    );
  } catch (error) {
    logger.error('Error setting up single task subscription', error, { 
      function: 'subscribeToTask',
      taskId, 
    });
    return () => {};
  }
};

/**
 * Subscribes to unassigned tasks for a partnership
 */
export const subscribeToUnassignedTasks = (
  partnershipId: string,
  callback: (tasks: Task[]) => void,
): Unsubscribe => {
  try {
    const q = query(
      tasksCollection,
      where('partnershipId', '==', partnershipId),
      where('assignedTo', '==', null),
      where('status', '!=', 'done'),
      orderBy('status'),
      orderBy('createdAt', 'desc'),
    );

    return onSnapshot(
      q,
      (querySnapshot) => {
        const tasks = querySnapshot.docs.map((doc) =>
          documentToTask({ ...doc.data(), id: doc.id }),
        );
        callback(tasks);
      },
      (error) => {
        logger.error('Error in unassigned tasks subscription', error, { 
          function: 'subscribeToUnassignedTasks',
          partnershipId, 
        });
        callback([]);
      },
    );
  } catch (error) {
    logger.error('Error setting up unassigned tasks subscription', error, { 
      function: 'subscribeToUnassignedTasks',
      partnershipId, 
    });
    return () => {};
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Checks if a user can edit a task
 */
export const canEditTask = (task: Task, userId: string): boolean => {
  return task.createdBy === userId;
};

/**
 * Checks if a user can delete a task
 */
export const canDeleteTask = (task: Task, userId: string): boolean => {
  return task.createdBy === userId && task.status !== 'done';
};

/**
 * Checks if a user can complete a task
 */
export const canCompleteTask = (task: Task, userId: string): boolean => {
  if (task.status === 'done') return false;
  return !task.assignedTo || task.assignedTo === userId;
};

/**
 * Checks if a user can claim a task
 */
export const canClaimTask = (task: Task, _userId: string): boolean => {
  return !task.assignedTo && task.status !== 'done';
};

/**
 * Gets task statistics for a partnership
 */
export const getTaskStats = async (partnershipId: string): Promise<{
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  unassigned: number;
}> => {
  try {
    const allTasks = await getTasksByPartnership(partnershipId, { includeCompleted: true });
    
    return {
      total: allTasks.length,
      todo: allTasks.filter(t => t.status === 'todo').length,
      inProgress: allTasks.filter(t => t.status === 'in_progress').length,
      done: allTasks.filter(t => t.status === 'done').length,
      unassigned: allTasks.filter(t => !t.assignedTo && t.status !== 'done').length,
    };
  } catch (error) {
    
    return { total: 0, todo: 0, inProgress: 0, done: 0, unassigned: 0 };
  }
};
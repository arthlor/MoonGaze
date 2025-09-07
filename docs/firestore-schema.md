# Firestore Database Schema

This document describes the Firestore database structure for the MoonGaze application.

## Collections Overview

The MoonGaze app uses four main Firestore collections:

1. **users** - User profile and authentication data
2. **partnerships** - Links between two users
3. **tasks** - Shared tasks and to-dos
4. **linkingCodes** - Temporary codes for partner linking

## Collection Structures

### Users Collection (`/users/{userId}`)

Stores user profile information and app state.

```typescript
interface UserDocument {
  id: string;                    // Firebase Auth UID
  email: string;                 // User's email address
  displayName?: string;          // Optional display name
  partnerId?: string;            // ID of linked partner (if any)
  partnershipId?: string;        // ID of active partnership (if any)
  createdAt: Timestamp;          // Account creation date
  lastActive: Timestamp;         // Last app activity
  totalPoints: number;           // Points earned from completed tasks
  hasCompletedOnboarding?: boolean; // Onboarding completion status
}
```

**Security Rules:**
- Users can only read/write their own document
- Requires authentication

**Indexes:**
- Single field indexes on `partnerId` and `partnershipId` (automatic)

### Partnerships Collection (`/partnerships/{partnershipId}`)

Represents the link between two users and shared statistics.

```typescript
interface PartnershipDocument {
  id: string;           // Unique partnership ID
  user1Id: string;      // First user's ID
  user2Id: string;      // Second user's ID
  createdAt: Timestamp; // Partnership creation date
  sharedPoints: number; // Combined points from both users
  isActive: boolean;    // Whether partnership is active
}
```

**Security Rules:**
- Readable/writable by both linked users only
- Requires authentication

**Indexes:**
- Composite indexes on `user1Id` and `user2Id` for efficient lookups
- Single field index on `isActive`

### Tasks Collection (`/tasks/{taskId}`)

Stores shared tasks and to-dos between partners.

```typescript
interface TaskDocument {
  id: string;                    // Unique task ID
  title: string;                 // Task title (max 100 chars)
  description?: string;          // Optional description (max 500 chars)
  category: TaskCategory;        // Task category
  assignedTo?: string;           // User ID of assignee (optional)
  createdBy: string;             // User ID of creator
  status: TaskStatus;            // 'todo' | 'in_progress' | 'done'
  dueDate?: Timestamp;           // Optional due date
  createdAt: Timestamp;          // Task creation date
  updatedAt: Timestamp;          // Last modification date
  completedAt?: Timestamp;       // Task completion date (if done)
  partnershipId: string;         // Associated partnership ID
}
```

**Security Rules:**
- Readable/writable by both partners in the associated partnership
- Requires authentication and partnership verification

**Indexes:**
- Composite index on `partnershipId + status + createdAt` for efficient filtering
- Single field indexes on `assignedTo`, `createdBy`, and `category`

### Linking Codes Collection (`/linkingCodes/{code}`)

Temporary codes used for partner linking (15-minute TTL).

```typescript
interface LinkingCodeDocument {
  code: string;         // The linking code (format: XXX-XXX)
  createdBy: string;    // User ID who generated the code
  expiresAt: Timestamp; // Code expiration time (15 minutes)
  isUsed: boolean;      // Whether code has been used
  createdAt: Timestamp; // Code generation time
}
```

**Security Rules:**
- Readable by any authenticated user
- Writable only by the creator
- Auto-cleanup of expired codes

**Indexes:**
- Composite index on `createdBy + isUsed + expiresAt` for cleanup queries
- Single field index on `expiresAt` for expiration queries

## Query Patterns

### Common Task Queries

```typescript
// Get all tasks for a partnership
const tasks = await getTasksByPartnership(partnershipId);

// Get tasks by status
const todoTasks = await getTasksByPartnership(partnershipId, 'todo');

// Get tasks assigned to a user
const myTasks = await getTasksByAssignee(partnershipId, userId);

// Get unassigned tasks
const unassignedTasks = await getUnassignedTasks(partnershipId);
```

### Real-time Subscriptions

```typescript
// Listen to task changes
const unsubscribe = subscribeToTasks(partnershipId, (tasks) => {
  // Handle task updates
});

// Listen to partnership changes
const unsubscribe = subscribeToPartnership(partnershipId, (partnership) => {
  // Handle partnership updates
});
```

## Free Tier Optimizations

The schema is optimized for Firebase's free tier limits:

### Read/Write Optimization
- **Denormalized Data**: User points stored in user document to avoid separate reads
- **Efficient Queries**: Composite indexes minimize document reads
- **Batch Operations**: Multiple updates combined into single transactions
- **Listener Management**: Real-time listeners properly attached/detached

### Storage Optimization
- **Minimal Data**: Only essential fields stored
- **Auto-cleanup**: Expired linking codes automatically removed
- **Compact IDs**: Short, efficient document IDs

### Index Optimization
- **Minimal Indexes**: Only necessary composite indexes created
- **Query Limits**: Pagination and limits used to reduce reads
- **Single Collection Queries**: Avoid cross-collection queries

## Security Considerations

### Authentication
- All operations require Firebase Authentication
- User identity verified through `request.auth.uid`

### Authorization
- Users can only access their own data
- Partnership data accessible to both linked users
- Tasks accessible through partnership verification

### Data Validation
- Client-side validation with TypeScript interfaces
- Server-side validation through security rules
- Input sanitization and length limits

## Backup and Maintenance

### Automated Cleanup
- Expired linking codes removed automatically
- Inactive partnerships can be archived
- Old completed tasks can be archived after 90 days

### Data Export
- User data exportable through Firebase Admin SDK
- Partnership data includes both users' information
- Task history maintained for analytics

## Migration Considerations

### Schema Evolution
- New fields added as optional to maintain compatibility
- Deprecated fields marked but not removed immediately
- Version tracking for data model changes

### Performance Monitoring
- Query performance tracked through Firebase Console
- Read/write usage monitored to stay within free tier
- Index usage optimized based on actual query patterns
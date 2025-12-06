import '@testing-library/jest-dom';
import 'fake-indexeddb/auto';

// Reset the database before each test
beforeEach(async () => {
    const { db } = await import('../db/db');
    // Clear all tables
    await db.centers.clear();
    await db.students.clear();
    await db.attendance.clear();
    await db.settings.clear();
});

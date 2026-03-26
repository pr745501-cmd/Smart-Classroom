/**
 * Pure utility functions for the admin dashboard.
 * No Angular dependencies.
 */

export function computeRoleChartData(users: any[]): number[] {
  const studentCount = users.filter(u => u.role === 'student').length;
  const facultyCount = users.filter(u => u.role === 'faculty').length;
  const adminCount = users.filter(u => u.role === 'admin').length;
  return [studentCount, facultyCount, adminCount];
}

export function computeAttendanceChartData(sessions: any[]): number[] {
  let totalPresent = 0;
  let totalAbsent = 0;
  for (const session of sessions) {
    if (Array.isArray(session.records)) {
      for (const record of session.records) {
        if (record.status === 'present') totalPresent++;
        else totalAbsent++;
      }
    }
  }
  return [totalPresent, totalAbsent];
}

export function filterPendingApprovals(users: any[]): any[] {
  return users.filter(u => u.role === 'student' && u.isApproved === false);
}

export function filterByFaculty(announcements: any[], filter: string): any[] {
  if (!filter || filter.trim() === '') return announcements;
  const lower = filter.toLowerCase();
  return announcements.filter(a =>
    (a.faculty || '').toLowerCase().includes(lower)
  );
}

export function filterAssignments(assignments: any[], search: string): any[] {
  if (!search || search.trim() === '') return assignments;
  const lower = search.toLowerCase();
  return assignments.filter(a =>
    (a.title || '').toLowerCase().includes(lower) ||
    (a.faculty || '').toLowerCase().includes(lower) ||
    (a.course || '').toLowerCase().includes(lower)
  );
}

export function computeAssignmentSummary(
  assignments: any[],
  now: Date
): { total: number; dueSoonCount: number; overdueCount: number } {
  let dueSoonCount = 0;
  let overdueCount = 0;
  for (const a of assignments) {
    const due = new Date(a.dueDate);
    const diffMs = due.getTime() - now.getTime();
    const daysUntilDue = diffMs / (1000 * 60 * 60 * 24);
    if (daysUntilDue < 0) {
      overdueCount++;
    } else if (daysUntilDue <= 7) {
      dueSoonCount++;
    }
  }
  return { total: assignments.length, dueSoonCount, overdueCount };
}

export function computeSessionRow(
  session: any
): { total: number; present: number; absent: number; rate: number } {
  const records: any[] = Array.isArray(session.records) ? session.records : [];
  const total = records.length;
  const present = records.filter(r => r.status === 'present').length;
  const absent = total - present;
  const rate = total > 0 ? Math.round((present / total) * 100) : 0;
  return { total, present, absent, rate };
}

export function computeAttendanceSummary(
  sessions: any[]
): { totalSessions: number; overallPresentPct: number; uniqueStudentCount: number } {
  const totalSessions = sessions.length;
  let totalRecords = 0;
  let totalPresent = 0;
  const studentIds = new Set<string>();

  for (const session of sessions) {
    if (Array.isArray(session.records)) {
      for (const record of session.records) {
        totalRecords++;
        if (record.status === 'present') totalPresent++;
        if (record.studentId) studentIds.add(record.studentId.toString());
      }
    }
  }

  const overallPresentPct = totalRecords > 0
    ? Math.round((totalPresent / totalRecords) * 100)
    : 0;

  return {
    totalSessions,
    overallPresentPct,
    uniqueStudentCount: studentIds.size
  };
}

export function computeBarChartData(
  assignments: any[]
): { labels: string[]; data: number[] } {
  const courseMap = new Map<string, number>();
  for (const a of assignments) {
    const course = a.course || 'Unknown';
    courseMap.set(course, (courseMap.get(course) || 0) + 1);
  }
  const labels = Array.from(courseMap.keys());
  const data = labels.map(l => courseMap.get(l)!);
  return { labels, data };
}

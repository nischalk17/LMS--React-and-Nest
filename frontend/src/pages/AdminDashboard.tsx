import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  adminService,
  AdminCourse,
  AdminStats,
  AdminUser,
  Page,
  Role,
} from '../services/adminService';
import { getErrorMessage } from '../utils/errors';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

const StatCard = ({ label, value }: { label: string; value: number }) => (
  <Card className="shadow-sm">
    <CardContent className="p-5">
      <div className="text-3xl font-semibold">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </CardContent>
  </Card>
);

const Pager = ({
  page,
  limit,
  total,
  onChange,
}: {
  page: number;
  limit: number;
  total: number;
  onChange: (page: number) => void;
}) => {
  const pages = Math.max(1, Math.ceil(total / limit));
  return (
    <div className="flex items-center justify-between pt-3 text-sm text-muted-foreground">
      <span>
        Page {page} of {pages} ({total} total)
      </span>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          disabled={page <= 1}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={page >= pages}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');

  const [users, setUsers] = useState<Page<AdminUser> | null>(null);
  const [userPage, setUserPage] = useState(1);
  const [userSearch, setUserSearch] = useState('');

  const [courses, setCourses] = useState<Page<AdminCourse> | null>(null);
  const [coursePage, setCoursePage] = useState(1);
  const [courseSearch, setCourseSearch] = useState('');

  const run = async (action: () => Promise<unknown>, fallback: string) => {
    try {
      await action();
      setError('');
    } catch (err) {
      setError(getErrorMessage(err, fallback));
    }
  };

  const loadStats = useCallback(
    () => run(async () => setStats(await adminService.stats()), 'Failed to load stats'),
    []
  );
  const loadUsers = useCallback(
    () =>
      run(
        async () => setUsers(await adminService.users(userPage, userSearch)),
        'Failed to load users'
      ),
    [userPage, userSearch]
  );
  const loadCourses = useCallback(
    () =>
      run(
        async () =>
          setCourses(await adminService.courses(coursePage, courseSearch)),
        'Failed to load courses'
      ),
    [coursePage, courseSearch]
  );

  useEffect(() => {
    void loadStats();
  }, [loadStats]);
  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);
  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const changeRole = (id: string, role: Role) =>
    run(async () => {
      await adminService.setRole(id, role);
      await Promise.all([loadUsers(), loadStats()]);
    }, 'Failed to change role');

  const removeUser = (u: AdminUser) => {
    if (!window.confirm(`Delete ${u.email}? Their courses are deleted too.`)) return;
    return run(async () => {
      await adminService.deleteUser(u.id);
      await Promise.all([loadUsers(), loadCourses(), loadStats()]);
    }, 'Failed to delete user');
  };

  const togglePublished = (c: AdminCourse) =>
    run(async () => {
      await adminService.setPublished(c.id, !c.isPublished);
      await Promise.all([loadCourses(), loadStats()]);
    }, 'Failed to update course');

  const removeCourse = (c: AdminCourse) => {
    if (!window.confirm(`Delete course "${c.title}"?`)) return;
    return run(async () => {
      await adminService.deleteCourse(c.id);
      await Promise.all([loadCourses(), loadStats()]);
    }, 'Failed to delete course');
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Admin</h1>
        <p className="text-sm text-muted-foreground">
          Manage users and moderate courses.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
          <StatCard label="Students" value={stats.users.students} />
          <StatCard label="Instructors" value={stats.users.instructors} />
          <StatCard label="Admins" value={stats.users.admins} />
          <StatCard label="Published courses" value={stats.courses.published} />
          <StatCard label="Draft courses" value={stats.courses.drafts} />
          <StatCard label="Enrollments" value={stats.enrollments} />
        </div>
      )}

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by name or email..."
            value={userSearch}
            onChange={(e) => {
              setUserSearch(e.target.value);
              setUserPage(1);
            }}
            className="mb-4 max-w-sm"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Name</th>
                  <th className="py-2 pr-4">Email</th>
                  <th className="py-2 pr-4">Role</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {users?.items.map((u) => {
                  const isSelf = u.id === user?.id;
                  return (
                    <tr key={u.id} className="border-t border-border">
                      <td className="py-2 pr-4">
                        {u.firstName} {u.lastName}
                        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
                      </td>
                      <td className="py-2 pr-4">{u.email}</td>
                      <td className="py-2 pr-4">
                        <Select
                          value={u.role}
                          disabled={isSelf}
                          onChange={(e) => void changeRole(u.id, e.target.value as Role)}
                          className="h-9 w-36"
                        >
                          <option value="student">student</option>
                          <option value="instructor">instructor</option>
                          <option value="admin">admin</option>
                        </Select>
                      </td>
                      <td className="py-2 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={isSelf}
                          onClick={() => void removeUser(u)}
                        >
                          Delete
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {users && (
            <Pager page={users.page} limit={users.limit} total={users.total} onChange={setUserPage} />
          )}
        </CardContent>
      </Card>

      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle className="text-xl">Courses</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="Search by title..."
            value={courseSearch}
            onChange={(e) => {
              setCourseSearch(e.target.value);
              setCoursePage(1);
            }}
            className="mb-4 max-w-sm"
          />
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-muted-foreground">
                <tr>
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">Instructor</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {courses?.items.map((c) => (
                  <tr key={c.id} className="border-t border-border">
                    <td className="py-2 pr-4">{c.title}</td>
                    <td className="py-2 pr-4">
                      {c.instructor.firstName} {c.instructor.lastName}
                    </td>
                    <td className="py-2 pr-4">
                      <Badge variant={c.isPublished ? 'success' : 'secondary'}>
                        {c.isPublished ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="space-x-2 py-2 text-right">
                      <Button size="sm" variant="outline" onClick={() => void togglePublished(c)}>
                        {c.isPublished ? 'Unpublish' : 'Publish'}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => void removeCourse(c)}>
                        Delete
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {courses && (
            <Pager page={courses.page} limit={courses.limit} total={courses.total} onChange={setCoursePage} />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;

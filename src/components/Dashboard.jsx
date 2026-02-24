import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const API_BASE_STUDENT = "/students";
const API_BASE_COURSE = "/courses";
const API_BASE_ENROLLMENT = "/enrollments";

const Dashboard = () => {
    const { user, logout, hasRole } = useAuth();
    const navigate = useNavigate();

    // Initial persona based on user roles
    const [persona, setPersona] = useState(() => {
        if (user?.roles?.includes('ROLE_ADMIN')) return 'admin';
        if (user?.roles?.includes('ROLE_FACULTY')) return 'faculty';
        return 'student';
    });

    const [activeTab, setActiveTab] = useState('browse');
    const [students, setStudents] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [enrollments, setEnrollments] = useState([]);
    const [reports, setReports] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchType, setSearchType] = useState('keyword'); // keyword, department, instructor
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    useEffect(() => {
        if (user) {
            fetchInitialData();
        }
    }, [user, persona]);

    useEffect(() => {
        if (selectedStudent) {
            fetchStudentData(selectedStudent.studentId);
        }
    }, [selectedStudent]);

    const fetchInitialData = async () => {
        setLoading(true);
        const tasks = [fetchCourses()];

        if (persona === 'admin' || persona === 'student') {
            tasks.push(fetchStudents());
        }

        if (persona === 'admin') {
            tasks.push(fetchReports());
            setActiveTab('reports');
        }

        await Promise.all(tasks);
        setLoading(false);
    };

    const fetchStudents = async () => {
        try {
            const res = await api.get(API_BASE_STUDENT);
            setStudents(res.data);
            if (persona === 'student' && res.data.length > 0) {
                if (!selectedStudent) setSelectedStudent(res.data[0]);
            } else if (res.data.length > 0 && !selectedStudent) {
                setSelectedStudent(res.data[0]);
            }
        } catch (e) { console.error(e); }
    };

    const fetchCourses = async () => {
        try {
            const res = await api.get(API_BASE_COURSE);
            setCourses(res.data);
        } catch (e) { console.error(e); }
    };

    const fetchStudentData = async (studentId) => {
        try {
            const [enrollRes, progressRes] = await Promise.all([
                api.get(`${API_BASE_ENROLLMENT}/student/${studentId}`),
                api.get(`${API_BASE_STUDENT}/${studentId}/progress`)
            ]);
            setEnrollments(enrollRes.data);
            setSelectedStudent(prev => ({ ...prev, ...progressRes.data }));
        } catch (e) { console.error(e); }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        try {
            let endpoint = `${API_BASE_COURSE}/search/keyword?keyword=${searchQuery}`;
            if (searchType === 'department') endpoint = `${API_BASE_COURSE}/search/department?department=${searchQuery}`;
            if (searchType === 'instructor') endpoint = `${API_BASE_COURSE}/search/instructor?instructor=${searchQuery}`;

            const res = await api.get(endpoint);
            setCourses(res.data);
        } catch (e) { console.error(e); }
    };

    const handleEnroll = async (courseCode) => {
        try {
            await api.post(`${API_BASE_ENROLLMENT}/${selectedStudent.studentId}/${courseCode}`);
            setMessage({ type: 'success', text: `Enrollment successful (or waitlisted if full)` });
            fetchStudentData(selectedStudent.studentId);
            fetchCourses();
        } catch (e) {
            setMessage({ type: 'error', text: e.response?.data?.message || 'Enrollment failed' });
        }
    };

    const handleDrop = async (courseCode) => {
        try {
            await api.delete(`${API_BASE_ENROLLMENT}/${selectedStudent.studentId}/${courseCode}`);
            setMessage({ type: 'success', text: `Dropped ${courseCode}` });
            fetchStudentData(selectedStudent.studentId);
            fetchCourses();
        } catch (e) { console.error(e); }
    };

    const fetchReports = async () => {
        try {
            const [overRes, statsRes, workloadRes] = await Promise.all([
                api.get(`${API_BASE_COURSE}/reports/over-capacity`),
                api.get(`${API_BASE_COURSE}/reports/stats/department`),
                api.get(`${API_BASE_COURSE}/reports/stats/workload`)
            ]);
            setReports({
                overCapacity: overRes.data,
                departmentStats: statsRes.data,
                facultyWorkload: workloadRes.data
            });
        } catch (e) { console.error(e); }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const Sidebar = () => (
        <div className="w-64 glass h-screen fixed left-0 top-0 p-6 flex flex-col gap-8 shadow-2xl border-r border-slate-200/50">
            <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">NexusEnroll</h2>
            <div className="flex flex-col gap-2">
                {hasRole('ROLE_STUDENT') && (
                    <button onClick={() => setPersona('student')} className={`p-3 rounded-xl flex items-center gap-2 transition-all font-medium ${persona === 'student' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100 text-slate-600'}`}>🎓 Student Portal</button>
                )}
                {hasRole('ROLE_FACULTY') && (
                    <button onClick={() => setPersona('faculty')} className={`p-3 rounded-xl flex items-center gap-2 transition-all font-medium ${persona === 'faculty' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100 text-slate-600'}`}>🧑‍🏫 Faculty Portal</button>
                )}
                {hasRole('ROLE_ADMIN') && (
                    <button onClick={() => { setPersona('admin'); fetchReports(); }} className={`p-3 rounded-xl flex items-center gap-2 transition-all font-medium ${persona === 'admin' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'hover:bg-slate-100 text-slate-600'}`}>⚙️ Admin Panel</button>
                )}
            </div>
            <div className="mt-auto border-t border-slate-100 pt-6 space-y-4">
                <div className="px-2">
                    <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Connected as</p>
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">{user?.username?.[0].toUpperCase()}</div>
                        <div className="overflow-hidden">
                            <p className="text-sm font-bold text-slate-900 truncate">{user?.username}</p>
                            <p className="text-[10px] text-slate-500 truncate">{user?.roles?.join(', ')}</p>
                        </div>
                    </div>
                </div>
                {persona === 'student' && students.length > 0 && hasRole('ROLE_ADMIN') && (
                    <div className="px-2">
                        <p className="text-[10px] uppercase tracking-widest font-black text-slate-400 mb-2">Emulate Student</p>
                        <select className="w-full text-xs p-2 border border-slate-200 rounded-lg bg-slate-50 outline-none focus:ring-2 focus:ring-blue-500" value={selectedStudent?.studentId} onChange={(e) => setSelectedStudent(students.find(x => x.studentId === e.target.value))}>
                            {students.map(s => <option key={s.studentId} value={s.studentId}>{s.firstName} {s.lastName}</option>)}
                        </select>
                    </div>
                )}
                <button onClick={handleLogout} className="w-full p-3 rounded-xl flex items-center gap-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-all text-sm font-medium">🚪 Sign Out</button>
            </div>
        </div>
    );

    const Notification = () => message && (
        <div className={`fixed top-4 right-4 z-[100] p-4 rounded-xl shadow-2xl animate-in fade-in slide-in-from-right-4 border ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
            <div className="flex items-center gap-3">
                <span>{message.text}</span>
                <button onClick={() => setMessage(null)} className="opacity-50 hover:opacity-100 text-lg">×</button>
            </div>
        </div>
    );

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 pl-64 font-['Inter']">
            <Sidebar />
            <Notification />
            <main className="p-10 max-w-7xl mx-auto">
                <div className="mb-12 flex justify-between items-end">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="bg-blue-100 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">{persona} portal</span>
                        </div>
                        <h1 className="text-5xl font-black text-slate-900 tracking-tight">
                            {persona === 'student' ? `Hello, ${selectedStudent?.firstName || 'Student'}!` : persona === 'faculty' ? 'Faculty Central' : 'Administration'}
                        </h1>
                        <p className="text-slate-500 mt-3 text-lg">
                            {persona === 'student' ? 'Track your courses and academic progress.' : persona === 'faculty' ? 'Manage rosters and performance.' : 'High-level system oversight.'}
                        </p>
                    </div>
                    {persona === 'student' && (
                        <div className="bg-white border border-slate-200 px-6 py-4 rounded-3xl shadow-sm text-center">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total Credits</p>
                            <p className="text-3xl font-black text-blue-600">{selectedStudent?.totalCredits || 0}</p>
                        </div>
                    )}
                </div>

                {persona === 'student' && (
                    <div className="space-y-12">
                        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                            <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                                <h2 className="text-3xl font-black text-slate-900">Course Catalogue</h2>
                                <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
                                    <select className="px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 font-bold text-sm" value={searchType} onChange={(e) => setSearchType(e.target.value)}>
                                        <option value="keyword">Keyword</option>
                                        <option value="department">Department</option>
                                        <option value="instructor">Instructor</option>
                                    </select>
                                    <input type="text" placeholder={`Search by ${searchType}...`} className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                                    <button type="submit" className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg">Search</button>
                                </form>
                            </div>
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {courses.map(course => (
                                    <div key={course.courseCode} className="group p-8 border border-slate-100 rounded-[2rem] hover:border-blue-200 hover:bg-blue-50/30 transition-all flex justify-between items-center relative overflow-hidden">
                                        <div className="relative z-10 w-full">
                                            <div className="flex items-center gap-3 mb-3">
                                                <span className="text-xs font-black text-blue-600 bg-blue-100 px-3 py-1 rounded-full">{course.courseCode}</span>
                                                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{course.department}</span>
                                            </div>
                                            <h3 className="font-black text-xl text-slate-900 mb-1 uppercase">{course.courseName}</h3>
                                            <p className="text-sm text-slate-500 mb-2">Prof. {course.instructorName}</p>
                                            <div className="flex items-center gap-2 mb-4 text-xs font-bold text-slate-600">
                                                <span className="p-1 px-2 bg-slate-100 rounded-md">🕒 {course.dayOfWeek} {course.startTime}-{course.endTime}</span>
                                            </div>
                                            <div className="flex items-center justify-between mt-4 border-t border-slate-100 pt-4">
                                                <div className="flex flex-col">
                                                    <span className={`text-sm font-bold ${course.currentEnrollment >= course.capacity ? 'text-rose-500' : 'text-emerald-600'}`}>{course.currentEnrollment} / {course.capacity} seats taken</span>
                                                </div>
                                                <button onClick={() => handleEnroll(course.courseCode)} className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-md ${course.currentEnrollment >= course.capacity ? 'bg-amber-500 text-white' : 'bg-blue-600 text-white'}`}>{course.currentEnrollment >= course.capacity ? 'Waitlist' : 'Enroll Now'}</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                                <h2 className="text-3xl font-black mb-10 text-slate-900">Current Schedule</h2>
                                <div className="space-y-6">
                                    {enrollments.filter(e => e.status !== 'CANCELLED').map(e => (
                                        <div key={e.courseCode} className="flex justify-between items-center p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-3 h-3 rounded-full ${e.status === 'WAITLISTED' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                <div>
                                                    <p className="font-black text-lg text-slate-900">{e.courseCode} <span className="text-xs text-slate-400">({e.status})</span></p>
                                                </div>
                                            </div>
                                            <button onClick={() => handleDrop(e.courseCode)} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold">Drop</button>
                                        </div>
                                    ))}
                                </div>
                            </section>
                            <section className="bg-indigo-900 rounded-[2.5rem] p-10 text-white shadow-xl">
                                <h2 className="text-3xl font-black mb-4">Acedemic Map</h2>
                                <div className="p-6 bg-white/10 rounded-3xl border border-white/10">
                                    <p className="text-[10px] uppercase font-black text-indigo-200 mb-4">Completed & Grades</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent?.courseGrades && Object.entries(selectedStudent.courseGrades).map(([code, grade]) => (
                                            <div key={code} className="bg-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2 text-xs font-black">{code} <span className="bg-emerald-500 px-2 py-0.5 rounded-md">{grade}</span></div>
                                        ))}
                                    </div>
                                    <p className="text-[10px] uppercase font-black text-indigo-400 mt-6 mb-2">Remaining Requirements</p>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedStudent?.requiredCourses?.map(c => !selectedStudent?.courseGrades?.[c] && <span key={c} className="bg-white/10 px-4 py-2 rounded-xl text-xs font-bold border border-white/10">{c}</span>)}
                                    </div>
                                </div>
                            </section>
                        </div>
                    </div>
                )}

                {persona === 'faculty' && (
                    <div className="space-y-10">
                        <section className="bg-white border border-slate-200 rounded-[2.5rem] p-10 shadow-sm">
                            <h2 className="text-3xl font-black mb-10 text-slate-900 uppercase">Module Management</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                {courses.map(c => (
                                    <div key={c.courseCode} className="bg-slate-50 border border-slate-100 rounded-[2rem] p-8">
                                        <h3 className="text-2xl font-black text-slate-900">{c.courseName}</h3>
                                        <div className="flex gap-2 mt-4">
                                            <button onClick={async () => { const res = await api.get(`${API_BASE_ENROLLMENT}/course/${c.courseCode}`); setEnrollments(res.data); setActiveTab(`roster-${c.courseCode}`); }} className="flex-grow bg-slate-900 text-white py-3 rounded-xl font-bold">Roster & Grading</button>
                                            <button onClick={() => setMessage({ type: 'success', text: `Update request submitted.` })} className="px-4 bg-white border border-slate-200 rounded-xl font-black text-[10px] uppercase">Request Update</button>
                                        </div>
                                        {activeTab === `roster-${c.courseCode}` && (
                                            <div className="mt-8 pt-8 border-t border-slate-200">
                                                <table className="w-full text-sm">
                                                    <thead><tr className="text-slate-400 text-left"><th className="py-4">Student ID</th><th className="py-4">Grade</th></tr></thead>
                                                    <tbody>{enrollments.map(e => <tr key={e.studentId} className="border-b border-slate-100"><td className="py-4">{e.studentId}</td><td className="py-4"><input type="text" className="w-16 p-2 border rounded text-center" defaultValue={e.grade} onBlur={async (evt) => { await api.post(`${API_BASE_ENROLLMENT}/grades`, [{ studentId: e.studentId, courseCode: c.courseCode, grade: evt.target.value }]); setMessage({ type: 'success', text: `Grade saved.` }); }} /></td></tr>)}</tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                )}

                {persona === 'admin' && (
                    <div className="space-y-12">
                        <div className="flex gap-4">
                            <button onClick={() => setActiveTab('reports')} className={`px-6 py-2 rounded-full font-bold text-sm ${activeTab === 'reports' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Reports</button>
                            <button onClick={() => setActiveTab('course-mgmt')} className={`px-6 py-2 rounded-full font-bold text-sm ${activeTab === 'course-mgmt' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Courses</button>
                            <button onClick={() => setActiveTab('user-mgmt')} className={`px-6 py-2 rounded-full font-bold text-sm ${activeTab === 'user-mgmt' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Users</button>
                        </div>
                        {activeTab === 'reports' && reports && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white"><h3>{reports.overCapacity.length}</h3><p>Alerts</p></div>
                                <div className="bg-indigo-700 p-8 rounded-[2.5rem] text-white"><h3>{Object.keys(reports.facultyWorkload).length}</h3><p>Faculty</p></div>
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white"><h3>{Object.keys(reports.departmentStats).length}</h3><p>Depts</p></div>
                            </div>
                        )}
                        {activeTab === 'course-mgmt' && (
                            <section className="bg-white border p-10 rounded-[2.5rem]">
                                <h2 className="text-3xl font-black mb-10">Course Editor</h2>
                                {courses.map(c => <div key={c.courseCode} className="p-6 bg-slate-50 mb-2 rounded-3xl flex justify-between">{c.courseName} <button className="text-rose-600 font-bold">Delete</button></div>)}
                            </section>
                        )}
                        {activeTab === 'user-mgmt' && (
                            <section className="bg-white border p-10 rounded-[2.5rem]">
                                <h2 className="text-3xl font-black mb-10">Students</h2>
                                {students.map(s => <div key={s.studentId} className="p-6 bg-slate-50 mb-2 rounded-3xl flex justify-between">{s.firstName} {s.lastName} <button className="text-rose-600 font-bold">Deactivate</button></div>)}
                            </section>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default Dashboard;

import React, { useState, useEffect, useCallback } from 'react';
import api from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Notification from './Notification';

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
    const [faculty, setFaculty] = useState([]);
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
            tasks.push(fetchFaculty());
            setActiveTab('reports');
        }

        await Promise.all(tasks);
        setLoading(false);
    };

    const fetchStudents = async () => {
        try {
            if (persona === 'student') {
                const res = await api.get(`${API_BASE_STUDENT}/${user.username}`);
                setSelectedStudent(res.data);
            } else {
                const res = await api.get(API_BASE_STUDENT);
                setStudents(res.data);
                if (res.data.length > 0 && !selectedStudent) {
                    setSelectedStudent(res.data[0]);
                }
            }
        } catch (e) {
            console.error(e);
            if (persona === 'student') {
                setMessage({ type: 'error', text: 'Failed to load your student profile.' });
            }
        }
    };

    const fetchCourses = async () => {
        try {
            const endpoint = persona === 'faculty' ? `${API_BASE_COURSE}/my` : API_BASE_COURSE;
            const res = await api.get(endpoint);
            setCourses(res.data);
        } catch (e) {
            console.error(e);
            if (persona === 'faculty') {
                setMessage({ type: 'error', text: 'Failed to load your courses.' });
            }
        }
    };

    const fetchFaculty = async () => {
        try {
            const res = await api.get("/users/faculty");
            setFaculty(res.data);
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

    const isEnrolled = (courseCode) => {
        return enrollments.some(e => e.courseCode === courseCode && e.status !== 'CANCELLED');
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
            const errorMsg = e.response?.data?.message || 'Enrollment failed';
            setMessage({ type: 'error', text: errorMsg });
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

    const [showCourseForm, setShowCourseForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [courseForm, setCourseForm] = useState({
        courseCode: '',
        courseName: '',
        description: '',
        department: '',
        instructorName: '',
        instructorUsername: '',
        capacity: 30,
        currentEnrollment: 0,
        dayOfWeek: 'MONDAY',
        startTime: '09:00',
        endTime: '11:00'
    });

    const [showFacultyForm, setShowFacultyForm] = useState(false);
    const [editingFaculty, setEditingFaculty] = useState(null);
    const [facultyForm, setFacultyForm] = useState({ username: '' });
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignTarget, setAssignTarget] = useState(null);

    const handleCourseFormChange = (e) => {
        const { name, value } = e.target;
        setCourseForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSaveCourse = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await api.put(`${API_BASE_COURSE}/${editingCourse.id}`, courseForm);
                setMessage({ type: 'success', text: `Updated ${courseForm.courseCode}` });
            } else {
                await api.post(API_BASE_COURSE, courseForm);
                setMessage({ type: 'success', text: `Created ${courseForm.courseCode}` });
            }
            setShowCourseForm(false);
            setEditingCourse(null);
            resetCourseForm();
            fetchCourses();
        } catch (error) {
            setMessage({ type: 'error', text: error.response?.data?.message || 'Action failed' });
        }
    };

    const resetCourseForm = () => {
        setCourseForm({
            courseCode: '',
            courseName: '',
            description: '',
            department: '',
            instructorName: '',
            capacity: 30,
            currentEnrollment: 0,
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '11:00'
        });
    };

    const openEditCourse = (course) => {
        setEditingCourse(course);
        setCourseForm({ ...course });
        setShowCourseForm(true);
    };

    const handleDeleteCourse = async (id) => {
        if (window.confirm('Are you sure you want to delete this course?')) {
            try {
                await api.delete(`${API_BASE_COURSE}/${id}`);
                setMessage({ type: 'success', text: 'Course deleted successfully' });
                fetchCourses();
            } catch (error) {
                setMessage({ type: 'error', text: 'Failed to delete course' });
            }
        }
    };

    const handleSaveFaculty = async (e) => {
        e.preventDefault();
        try {
            if (editingFaculty) {
                await api.put(`/users/faculty/${editingFaculty.id}`, facultyForm);
                setMessage({ type: 'success', text: 'Faculty updated' });
            } else {
                await api.post("/users/faculty", facultyForm);
                setMessage({ type: 'success', text: 'Faculty created (Default password: faculty123)' });
            }
            setShowFacultyForm(false);
            setEditingFaculty(null);
            setFacultyForm({ username: '' });
            fetchFaculty();
        } catch (error) {
            setMessage({ type: 'error', text: 'Action failed' });
        }
    };

    const handleToggleFacultyStatus = async (id) => {
        try {
            await api.patch(`/users/faculty/${id}/status`);
            setMessage({ type: 'success', text: 'Status updated' });
            fetchFaculty();
        } catch (error) { console.error(error); }
    };

    const handleAssignCourse = async (courseId, facultyMember) => {
        try {
            const course = courses.find(c => c.id === courseId);
            const update = { ...course, instructorUsername: facultyMember.username, instructorName: facultyMember.username }; // Using username as name for simplicity if name not available
            await api.put(`${API_BASE_COURSE}/${courseId}`, update);
            setMessage({ type: 'success', text: 'Course assigned' });
            fetchCourses();
        } catch (error) { console.error(error); }
    };

    const [showStudentForm, setShowStudentForm] = useState(false);
    const [studentForm, setStudentForm] = useState({
            studentId: '',
            password: 'student123',
            firstName: '',
            lastName: '',
            email: '',
            degreeProgram: 'Computer Science',
            totalCredits: 0
    });

        const handleStudentFormChange = (e) => {
            const { name, value } = e.target;
            setStudentForm(prev => ({ ...prev, [name]: value }));
        };

        const handleSaveStudent = async (e) => {
            e.preventDefault();
            try {
                // 1. Create Login Credentials
                await api.post('/auth/register', {
                    username: studentForm.studentId,
                    password: studentForm.password,
                    roles: ['ROLE_STUDENT']
                });

                // 2. Create Student Profile
                await api.post(API_BASE_STUDENT, {
                    studentId: studentForm.studentId,
                    firstName: studentForm.firstName,
                    lastName: studentForm.lastName,
                    email: studentForm.email,
                    degreeProgram: studentForm.degreeProgram,
                    totalCredits: studentForm.totalCredits,
                    courseGrades: {}
                });

                setMessage({ type: 'success', text: `Created student ${studentForm.studentId}` });
                setShowStudentForm(false);
                resetStudentForm();
                fetchStudents();
            } catch (error) {
                setMessage({ type: 'error', text: error.response?.data?.message || 'Failed to create student' });
            }
        };

        const resetStudentForm = () => {
            setStudentForm({
                studentId: '',
                password: 'student123',
                firstName: '',
                lastName: '',
                email: '',
                degreeProgram: 'Computer Science',
                totalCredits: 0
            });
        };

   

    if (!user) return null;

    return (
        <div className="min-h-screen bg-slate-50 pl-64 font-['Inter']">
            <Sidebar />
            <Notification message={message} />
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
                                                <button
                                                    onClick={() => handleEnroll(course.courseCode)}
                                                    disabled={isEnrolled(course.courseCode)}
                                                    className={`px-6 py-4 rounded-2xl font-bold transition-all shadow-md ${isEnrolled(course.courseCode)
                                                        ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                                                        : course.currentEnrollment >= course.capacity
                                                            ? 'bg-amber-500 text-white'
                                                            : 'bg-blue-600 text-white'
                                                        }`}
                                                >
                                                    {isEnrolled(course.courseCode) ? 'Enrolled' : course.currentEnrollment >= course.capacity ? 'Waitlist' : 'Enroll Now'}
                                                </button>
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
                                    {enrollments.filter(e => e.status !== 'CANCELLED').map(e => {
                                        const details = courses.find(c => c.courseCode === e.courseCode);
                                        return (
                                            <div key={e.courseCode} className="flex justify-between items-center p-6 bg-slate-50 border border-slate-100 rounded-3xl">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-3 h-3 rounded-full ${e.status === 'WAITLISTED' ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                                                    <div>
                                                        <p className="font-black text-lg text-slate-900">{e.courseCode} <span className="text-xs text-slate-400">({e.status})</span></p>
                                                        {details && (
                                                            <p className="text-xs font-bold text-slate-500 mt-1">
                                                                🗓️ {details.dayOfWeek} • 🕒 {details.startTime} - {details.endTime}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                                <button onClick={() => handleDrop(e.courseCode)} className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold">Drop</button>
                                            </div>
                                        );
                                    })}
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
                            <button onClick={() => setActiveTab('faculty-mgmt')} className={`px-6 py-2 rounded-full font-bold text-sm ${activeTab === 'faculty-mgmt' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Faculty</button>
                            <button onClick={() => setActiveTab('user-mgmt')} className={`px-6 py-2 rounded-full font-bold text-sm ${activeTab === 'user-mgmt' ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>Students</button>
                        </div>
                        {activeTab === 'reports' && reports && (
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="bg-rose-600 p-8 rounded-[2.5rem] text-white"><h3>{reports.overCapacity.length}</h3><p>Alerts</p></div>
                                <div className="bg-indigo-700 p-8 rounded-[2.5rem] text-white"><h3>{Object.keys(reports.facultyWorkload).length}</h3><p>Faculty</p></div>
                                <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white"><h3>{Object.keys(reports.departmentStats).length}</h3><p>Depts</p></div>
                            </div>
                        )}
                        {activeTab === 'course-mgmt' && (
                            <section className="bg-white border p-10 rounded-[2.5rem] shadow-sm">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-3xl font-black">Course Management</h2>
                                    <button
                                        onClick={() => { resetCourseForm(); setShowCourseForm(true); setEditingCourse(null); }}
                                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
                                    >
                                        + Add New Course
                                    </button>
                                </div>

                                {showCourseForm && (
                                    <form onSubmit={handleSaveCourse} className="mb-12 p-8 bg-slate-50 border border-slate-200 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                        <button type="button" onClick={() => setShowCourseForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl px-2">×</button>
                                        <h3 className="col-span-full font-black text-xl mb-4">{editingCourse ? 'Edit Course' : 'Create New Course'}</h3>

                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Course Code</label>
                                            <input required name="courseCode" value={courseForm.courseCode} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="CS101" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Course Name</label>
                                            <input required name="courseName" value={courseForm.courseName} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Intro to Computer Science" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Department</label>
                                            <input required name="department" value={courseForm.department} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Computer Science" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Instructor</label>
                                            <input required name="instructorName" value={courseForm.instructorName} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Dr. Smith" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Capacity</label>
                                            <input required type="number" name="capacity" value={courseForm.capacity} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Day of Week</label>
                                            <select name="dayOfWeek" value={courseForm.dayOfWeek} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500">
                                                {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'].map(d => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Start Time</label>
                                            <input type="time" name="startTime" value={courseForm.startTime} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">End Time</label>
                                            <input type="time" name="endTime" value={courseForm.endTime} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                                        </div>
                                        <div className="col-span-full flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Description</label>
                                            <textarea name="description" value={courseForm.description} onChange={handleCourseFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]" placeholder="Course details..." />
                                        </div>
                                        <div className="col-span-full pt-4">
                                            <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-sm shadow-xl">
                                                {editingCourse ? 'Save Changes' : 'Create Course'}
                                            </button>
                                        </div>
                                    </form>
                                )}

                                <div className="space-y-4">
                                    {courses.map(c => (
                                        <div key={c.courseCode} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center group hover:border-blue-200 transition-all">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-[10px] font-black bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{c.courseCode}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{c.department}</span>
                                                </div>
                                                <p className="font-black text-slate-900">{c.courseName}</p>
                                                <p className="text-xs text-slate-500">Instructor: {c.instructorName} • Cap: {c.capacity}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => openEditCourse(c)} className="p-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold text-xs hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all">Edit</button>
                                                <button onClick={() => handleDeleteCourse(c.id)} className="p-3 bg-white border border-slate-200 text-rose-500 rounded-xl font-bold text-xs hover:bg-rose-50 hover:border-rose-200 transition-all">Delete</button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {activeTab === 'faculty-mgmt' && (
                            <section className="bg-white border p-10 rounded-[2.5rem] shadow-sm">
                                <div className="flex justify-between items-center mb-10">
                                    <h2 className="text-3xl font-black">Faculty Management</h2>
                                    <button
                                        onClick={() => { setEditingFaculty(null); setFacultyForm({ username: '' }); setShowFacultyForm(true); }}
                                        className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
                                    >
                                        + Add Faculty
                                    </button>
                                </div>

                                {showFacultyForm && (
                                    <form onSubmit={handleSaveFaculty} className="mb-12 p-8 bg-slate-50 border border-slate-200 rounded-[2rem] grid grid-cols-1 gap-6 relative">
                                        <button type="button" onClick={() => setShowFacultyForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl font-bold">×</button>
                                        <h3 className="font-black text-xl mb-4">{editingFaculty ? 'Edit Faculty' : 'Register Faculty'}</h3>
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-black text-slate-500 uppercase">Username</label>
                                            <input required value={facultyForm.username} onChange={e => setFacultyForm({ username: e.target.value })} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. john.d" />
                                        </div>
                                        <button type="submit" className="bg-slate-900 text-white py-4 rounded-xl font-bold uppercase tracking-widest text-sm">{editingFaculty ? 'Save Changes' : 'Create Account'}</button>
                                    </form>
                                )}

                                <div className="space-y-4">
                                    {faculty.map(f => (
                                        <div key={f.id} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center">
                                            <div>
                                                <p className="font-black text-slate-900 text-lg">{f.username}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${f.active ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                                        {f.active ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => { setAssignTarget(f); setShowAssignModal(true); }} className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-xs">Assign Courses</button>
                                                <button onClick={() => { setEditingFaculty(f); setFacultyForm({ username: f.username }); setShowFacultyForm(true); }} className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-xs">Edit</button>
                                                <button onClick={() => handleToggleFacultyStatus(f.id)} className={`px-4 py-2 rounded-xl font-bold text-xs ${f.active ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                    {f.active ? 'Deactivate' : 'Activate'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}
                        {activeTab === 'user-mgmt' && (
                                                    <section className="bg-white border p-10 rounded-[2.5rem] shadow-sm">
                                                        <div className="flex justify-between items-center mb-10">
                                                            <h2 className="text-3xl font-black">Registered Students</h2>
                                                            <button
                                                                onClick={() => { resetStudentForm(); setShowStudentForm(true); }}
                                                                className="bg-emerald-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg"
                                                            >
                                                                + Add New Student
                                                            </button>
                                                        </div>

                                                        {showStudentForm && (
                                                            <form onSubmit={handleSaveStudent} className="mb-12 p-8 bg-slate-50 border border-slate-200 rounded-[2rem] grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                                                                <button type="button" onClick={() => setShowStudentForm(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-2xl px-2">×</button>
                                                                <h3 className="col-span-full font-black text-xl mb-4">Create New Student</h3>

                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">Student ID (Username)</label>
                                                                    <input required name="studentId" value={studentForm.studentId} onChange={handleStudentFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="udara.k" />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">Temp Password</label>
                                                                    <input required type="password" name="password" value={studentForm.password} onChange={handleStudentFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">First Name</label>
                                                                    <input required name="firstName" value={studentForm.firstName} onChange={handleStudentFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Udara" />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">Last Name</label>
                                                                    <input required name="lastName" value={studentForm.lastName} onChange={handleStudentFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Kulathunga" />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">Email</label>
                                                                    <input required type="email" name="email" value={studentForm.email} onChange={handleStudentFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="udara@gmail.com" />
                                                                </div>
                                                                <div className="flex flex-col gap-2">
                                                                    <label className="text-xs font-black text-slate-500 uppercase">Degree Program</label>
                                                                    <input required name="degreeProgram" value={studentForm.degreeProgram} onChange={handleStudentFormChange} className="p-4 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-blue-500" placeholder="Software Engineering" />
                                                                </div>
                                                                <div className="col-span-full pt-4">
                                                                    <button type="submit" className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition-all font-black uppercase tracking-widest text-sm shadow-xl">
                                                                        Create Student Account
                                                                    </button>
                                                                </div>
                                                            </form>
                                                        )}

                                                        <div className="space-y-4">
                                                            {students.map(s => (
                                                                <div key={s.studentId} className="p-6 bg-slate-50 border border-slate-100 rounded-3xl flex justify-between items-center">
                                                                    <div>
                                                                        <p className="font-black text-slate-900 text-lg">{s.firstName} {s.lastName}</p>
                                                                        <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">ID: {s.studentId} • Major: {s.degreeProgram}</p>
                                                                    </div>
                                                                    <button className="bg-white border border-slate-200 text-rose-600 px-4 py-2 rounded-xl font-bold text-xs hover:bg-rose-50 transition-all">Deactivate</button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </section>
                                                )}
                    </div>
                )}
            </main>

            {showAssignModal && assignTarget && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-white w-full max-w-xl rounded-[3rem] p-10 shadow-2xl relative">
                        <button onClick={() => setShowAssignModal(false)} className="absolute top-8 right-8 text-slate-400 hover:text-slate-900 text-3xl px-2">×</button>
                        <h2 className="text-3xl font-black text-slate-900 mb-2">Assign Courses</h2>
                        <p className="text-slate-500 mb-8">Assign courses to <span className="text-blue-600 font-bold">{assignTarget.username}</span></p>

                        <div className="max-h-[400px] overflow-y-auto pr-4 space-y-3 custom-scrollbar">
                            {courses.map(course => (
                                <div key={course.courseCode} className="flex justify-between items-center p-5 bg-slate-50 border border-slate-100 rounded-2xl group hover:border-blue-200 transition-all">
                                    <div>
                                        <p className="font-black text-slate-900 uppercase">{course.courseCode}</p>
                                        <p className="text-sm text-slate-500">{course.courseName}</p>
                                        {course.instructorUsername === assignTarget.username && <span className="text-[10px] font-black text-emerald-600 mt-1 block">✓ Currently Assigned</span>}
                                    </div>
                                    <button
                                        disabled={course.instructorUsername === assignTarget.username}
                                        onClick={() => handleAssignCourse(course.id, assignTarget)}
                                        className={`px-5 py-2.5 rounded-xl font-bold text-xs transition-all ${course.instructorUsername === assignTarget.username
                                            ? 'bg-emerald-100 text-emerald-600 cursor-default'
                                            : 'bg-slate-900 text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        {course.instructorUsername === assignTarget.username ? 'Assigned' : 'Assign'}
                                    </button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowAssignModal(false)} className="w-full mt-8 bg-slate-100 text-slate-900 py-4 rounded-2xl font-black text-sm uppercase tracking-widest">Done</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;

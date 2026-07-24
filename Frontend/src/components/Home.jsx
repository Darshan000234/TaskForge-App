import React, { useEffect, useState } from 'react'
import team from '../assets/img/team.jpg'
import group from '../assets/img/group.png'
import kanban from '../assets/img/kanban.png'
import comment from '../assets/img/comments.png'
import filter from '../assets/img/filter.png'
import assignment from '../assets/img/assignment.png'
import bell from '../assets/img/bell.png'
import { Link } from 'react-router-dom'


const LinkedIn = import.meta.env.VITE_LinkedInURL;
const Github = import.meta.env.VITE_GithubURL;
const Email = import.meta.env.VITE_Email;
const App = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const features = [
    { icon: group, title: 'Projects & Teams', desc: 'Invite members, manage roles, control access' },
    { icon: kanban, title: 'Grid & List Views', desc: 'Organize tasks with powerful filters, sorting and multiple viewing options.' },
    { icon: assignment, title: 'Task Assignments', desc: 'Multi-assignee tasks with due dates and priorities' },
    { icon: comment, title: 'Comments & Attachments', desc: 'Task discussion threads and file support' },
    { icon: filter, title: 'Powerful Filters', desc: 'Search, sort, paginate like real production apps' },
    { icon: bell, title: 'Realtime Notifications', desc: 'Instant updates for task changes and mentions' }
  ]

  return (
    <div className='min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 overflow-x-hidden'>

      <nav className={`fixed top-0 left-0 right-0 ${scrolled ? 'bg-slate-900/95 shadow-lg' : 'bg-slate-900/80'} backdrop-blur-md border-b border-slate-700/50 z-50 transition-all duration-300`}>
        <div className='max-w-7xl mx-auto px-4 sm:px-6 py-4 flex justify-between items-center'>
          <div className='text-xl sm:text-2xl font-bold text-white cursor-pointer'>
            Task<span className='text-blue-500'>Forge</span>
          </div>
          <div className='flex items-center gap-3 sm:gap-8 text-base'>
            <a href='#features' className='hidden sm:inline text-slate-300 hover:text-white transition-all duration-300 cursor-pointer'>
              Features
            </a>
            <a href='#demo' className='hidden sm:inline text-slate-300 hover:text-white transition-all duration-300 cursor-pointer'>
              Demo
            </a>
            <a href='#tech' className='hidden sm:inline text-slate-300 hover:text-white transition-all duration-300 cursor-pointer'>
              Tech Stack
            </a>
            <Link to='/Signup_login' className='bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2 rounded-lg transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 cursor-pointer text-sm sm:text-base whitespace-nowrap'>
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <section className='pt-28 sm:pt-32 pb-16 sm:pb-20 px-4 sm:px-6'>
        <div className='max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-10 lg:gap-12'>
          <div className='flex-1 space-y-6 text-center lg:text-left'>
            <h1 className='text-3xl sm:text-4xl md:text-5xl font-bold text-white leading-tight'>
              Manage Projects.<br />
              Track Work.<br />
              <span className='text-blue-500'>Ship Faster.</span>
            </h1>
            <p className='text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed'>
              TaskForge helps you organize projects, assign tasks, and track progress in one place.
              Manage teams with roles, deadlines, comments, and real-time updates without any mess.
              Built as a production-grade full-stack system to improve workflow and execution speed.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center lg:justify-start'>
              <Link to='/Signup_login' className='bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50 hover:-translate-y-1 cursor-pointer text-center'>
                Get Started
              </Link>
              <button className='bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-lg font-semibold transition-all duration-300 border border-slate-600 hover:border-blue-500'>
                View Demo
              </button>
            </div>
          </div>
          <div className='flex-1 w-full max-w-md lg:max-w-none'>
            <div
              className='bg-linear-to-br from-slate-800 to-slate-900 p-2 rounded-2xl shadow-2xl
                        border border-slate-700/50
                        animate-float
                        hover:scale-[1.02]
                        hover:shadow-blue-500/30
                        transition-all duration-500'
            >
              <img
                src={team}
                alt="TaskForge Dashboard"
                className='rounded-xl w-full h-auto'
              />
            </div>
          </div>

        </div>
      </section>

      <section id='features' className='py-16 sm:py-20 px-4 sm:px-6 bg-slate-800/30'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl sm:text-4xl font-bold text-white text-center mb-12 sm:mb-16'>
            Everything You Need to <span className='text-blue-500'>Execute</span>
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'>
            {features.map((feature, i) => (
              <div
                key={i}
                className='bg-slate-900/50 backdrop-blur p-6 rounded-xl border border-slate-700/50 hover:border-blue-500/50 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-blue-500/20 group'
              >
                <div className='flex items-center gap-3 mb-4'>
                  <img src={feature.icon} alt={feature.title} className='w-8 h-8 shrink-0 transition-transform duration-300 group-hover:scale-110' />
                  <h3 className='text-xl font-semibold text-white'>{feature.title}</h3>
                </div>
                <p className='text-slate-400 group-hover:text-slate-300 transition-colors duration-300'>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id='demo' className='py-16 sm:py-20 px-4 sm:px-6 bg-slate-800/30'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl sm:text-4xl font-bold text-white text-center mb-12'>
            Built for <span className='text-blue-500'>Real Collaboration</span>
          </h2>

          <div className='grid grid-cols-1 md:grid-cols-2 gap-8'>

            <div className='bg-slate-900/50 rounded-xl border border-slate-700 p-8 hover:border-blue-500 transition-all duration-300'>
              <h3 className='text-2xl font-semibold text-white mb-4'>
                Project & Team Management
              </h3>

              <ul className='space-y-4 text-slate-300'>
                <li>✅ Create organizations and multiple projects</li>
                <li>✅ Invite members with secure email invitations</li>
                <li>✅ Role-Based Access Control (Admin, Manager, Member)</li>
                <li>✅ Assign multiple members to tasks</li>
                <li>✅ Due dates, priorities and task status</li>
              </ul>
            </div>

            <div className='bg-slate-900/50 rounded-xl border border-slate-700 p-8 hover:border-blue-500 transition-all duration-300'>
              <h3 className='text-2xl font-semibold text-white mb-4'>
                Production Grade Backend
              </h3>

              <ul className='space-y-4 text-slate-300'>
                <li>⚡ JWT Authentication with Refresh Tokens</li>
                <li>⚡ Google Sign-In</li>
                <li>⚡ Redis + BullMQ Background Jobs</li>
                <li>⚡ Socket.IO Real-time Notifications</li>
                <li>⚡ Cloudinary File Uploads</li>
                <li>⚡ Audit Logs & Activity Tracking</li>
              </ul>
            </div>

          </div>
        </div>
      </section>

      <section id='tech' className='py-16 sm:py-20 px-4 sm:px-6'>
        <div className='max-w-7xl mx-auto'>
          <h2 className='text-3xl sm:text-4xl font-bold text-white text-center mb-12 sm:mb-16'>
            Built With <span className='text-blue-500'>Modern Tech</span>
          </h2>
          <div className='flex flex-wrap justify-center gap-3 sm:gap-4'>
            {['React', 'Tailwind CSS', 'React Query', 'Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Redis', 'BullMQ', 'Socket.IO'].map((tech, i) => (
              <div
                key={i}
                className='bg-slate-800 px-4 sm:px-6 py-2 sm:py-3 rounded-full border border-slate-700 text-slate-200 font-medium hover:border-blue-500 hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 hover:scale-110 text-sm sm:text-base'
              >
                {tech}
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className='py-12 px-4 sm:px-6 border-t border-slate-800 bg-slate-900/50'>
        <div className='max-w-7xl mx-auto text-center'>
          <p className='text-slate-400 mb-4'>
            Built by <span className='text-white font-semibold'>Darshan Desale</span>
          </p>
          <div className='flex flex-wrap justify-center gap-4 sm:gap-6'>
            <a
              href={Github}
              target="_blank"
              rel="noopener noreferrer"
              className='text-slate-400 hover:text-white transition-all duration-300'
            >
              GitHub
            </a>
            <a
              href={LinkedIn}
              target="_blank"
              rel="noopener noreferrer"
              className='text-slate-400 hover:text-white transition-all duration-300'
            >
              LinkedIn
            </a>
            <a
              href={`https://mail.google.com/mail/?view=cm&fs=1&to=${Email}`}
              target="_blank"
              rel="noopener noreferrer"
              className='text-slate-400 hover:text-white transition-all duration-300'
            >
              Email
            </a>          
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App;
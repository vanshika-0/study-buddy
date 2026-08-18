'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Card from '@/Component/Card'

const DAYS_TO_SHOW = 365

const toLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const activityColor = (count, maximum) => {
  if (count === 0) return '#e5e7eb'
  const level = count / maximum
  if (level <= 0.25) return '#bbf7d0'
  if (level <= 0.5) return '#86efac'
  if (level <= 0.75) return '#4ade80'
  return '#15803d'
}

const formatStudyTime = (totalSeconds) => {
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

const Page = () => {
  const [dashboard, setDashboard] = useState(null)
  const [error, setError] = useState('')
  const [hoveredDay, setHoveredDay] = useState(null)
  const [todayTasks, setTodayTasks] = useState([])
  const [revisionTasks, setRevisionTasks] = useState([])
  const [scheduleDate, setScheduleDate] = useState('')
  const [refreshVersion, setRefreshVersion] = useState(0)

  useEffect(() => {
    const email = localStorage.getItem('email')
    if (!email) {
      const errorTimer = window.setTimeout(() => {
        setError('Please log in to view your activity.')
      }, 0)
      return () => window.clearTimeout(errorTimer)
    }

    const loadDashboard = async () => {
      try {
        const [activityResponse, scheduleResponse, revisionResponse] = await Promise.all([
          fetch(`http://localhost:8000/api/dashboard/activity?email=${encodeURIComponent(email)}`),
          fetch(`http://localhost:8000/api/dashboard/today-schedule?email=${encodeURIComponent(email)}`),
          fetch(`http://localhost:8000/api/dashboard/revision-tasks?email=${encodeURIComponent(email)}`),
        ])
        if (!activityResponse.ok || !scheduleResponse.ok || !revisionResponse.ok) throw new Error('Could not load dashboard data')

        const [activityData, scheduleData, revisionData] = await Promise.all([
          activityResponse.json(),
          scheduleResponse.json(),
          revisionResponse.json(),
        ])
        setDashboard(activityData)
        setTodayTasks(scheduleData.tasks)
        setScheduleDate(scheduleData.date)
        setRevisionTasks(revisionData.tasks)
        console.log("todayseconds",activityData.studyTime.todaySeconds);
      } catch (fetchError) {
        console.error(fetchError)
        setError('Could not load your activity. Please try again.')
      }
    }

    loadDashboard()
    
    const refreshInterval = window.setInterval(loadDashboard, 30000)
    return () => window.clearInterval(refreshInterval)
  }, [refreshVersion])

  const toggleTodayTask = async (taskToUpdate) => {
    const nextDone = !taskToUpdate.done
    setTodayTasks((tasks) => tasks.map((task) => (
      task.docId === taskToUpdate.docId && task.taskIndex === taskToUpdate.taskIndex
        ? { ...task, done: nextDone }
        : task
    )))

    try {
      const response = await fetch('http://localhost:8000/updateTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: taskToUpdate.docId,
          taskIndex: taskToUpdate.taskIndex,
          updates: { done: nextDone },
        }),
      })
      if (!response.ok) throw new Error('Could not update task')

      // The backend rebuilds activity/streak data during /updateTask.
      setRefreshVersion((version) => version + 1)
    } catch (updateError) {
      console.error(updateError)
      setTodayTasks((tasks) => tasks.map((task) => (
        task.docId === taskToUpdate.docId && task.taskIndex === taskToUpdate.taskIndex
          ? { ...task, done: taskToUpdate.done }
          : task
      )))
      setError('Could not update the task. Please try again.')
    }
  }
 

  const toggleRevisionTask = async (taskToUpdate) => {
    const nextRevisionRequired = !taskToUpdate.revisionRequired
    setTodayTasks((tasks) => tasks.map((task) => (
      task.docId === taskToUpdate.docId && task.taskIndex === taskToUpdate.taskIndex
        ? { ...task, revisionRequired: nextRevisionRequired }
        : task
    )))
    setRevisionTasks((tasks) => nextRevisionRequired
      ? (tasks.some((task) => task.docId === taskToUpdate.docId && task.taskIndex === taskToUpdate.taskIndex)
        ? tasks.map((task) => task.docId === taskToUpdate.docId && task.taskIndex === taskToUpdate.taskIndex
          ? { ...task, revisionRequired: true }
          : task)
        : [...tasks, { ...taskToUpdate, revisionRequired: true }])
      : tasks.filter((task) => task.docId !== taskToUpdate.docId || task.taskIndex !== taskToUpdate.taskIndex)
    )

    try {
      const response = await fetch('http://localhost:8000/updateTask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          docId: taskToUpdate.docId,
          taskIndex: taskToUpdate.taskIndex,
          updates: { revisionRequired: nextRevisionRequired },
        }),
      })
      if (!response.ok) throw new Error('Could not update revision status')
      setRefreshVersion((version) => version + 1)
    } catch (updateError) {
      console.error(updateError)
      setError('Could not update the revision status. Please try again.')
      setRefreshVersion((version) => version + 1)
    }
  }

 const { weeks, activityByDate, maxActivity, completedTasks, today } = useMemo(() => {
  const records = dashboard?.dailyActivity || []
  const byDate = new Map(records.map((record) => [record.date, record.completedTasks]))
  const maximum = Math.max(...records.map((record) => record.completedTasks), 1)

  const startDate = new Date()
  startDate.setHours(0, 0, 0, 0)
  startDate.setDate(startDate.getDate() - (DAYS_TO_SHOW - 1))

  const dates = Array.from({ length: DAYS_TO_SHOW }, (_, index) => {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + index)
    return date
  })

  const todayString = toLocalDateString(new Date())
//kuchhu puchu
  return {
    weeks: Array.from(
      { length: Math.ceil(dates.length / 7) },
      (_, index) => dates.slice(index * 7, index * 7 + 7)
    ),
    activityByDate: byDate,
    maxActivity: maximum,
    today: todayString,
    completedTasks: byDate.get(todayString) || 0,
  }
}, [dashboard])

  const weeklyStudyTime = dashboard?.studyTime?.weeklyStudyTime || []
  const maxWeeklySeconds = Math.max(...weeklyStudyTime.map((day) => day.totalSeconds), 1)
  const pendingTasks = todayTasks.filter((task) => !task.done)
  //aaj wale tasks print hrhre hai
  const completedTodayTasks = todayTasks.filter((task) => task.done)
  
  

  return (
    <div className="min-h-screen bg-pink-50 p-6 sm:p-10 text-gray-800">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="flex flex-wrap gap-3 mb-8">
       
        <Card title="Total Study Hours" value={formatStudyTime(dashboard?.studyTime?.todaySeconds || 0)} icon="⏱" />
        <Card title="Completed Tasks" value={completedTasks} icon="✓" />
        <Card title="Current Streak" value={`${dashboard?.currentStreak || 0} days`} icon="🔥" />
        <Card title="Longest Streak" value={`${dashboard?.longestStreak || 0} days`} icon="🏆" />
      </div>
      
      <div className='flex gap-7'>
      <section className="bg-white rounded-3xl shadow-lg shadow-pink-200 border border-pink-100 p-5 sm:p-7 w-[50%] mb-8">
        <div className="flex items-end justify-between gap-3 mb-5">
          <div>
            <h2 className="text-xl font-bold">Today&apos;s Schedule</h2>
            <p className="text-sm text-gray-500">{scheduleDate || 'Today'} · {pendingTasks.length} pending</p>
          </div>
          <span className="text-sm font-semibold text-purple-500">{completedTodayTasks.length}/{todayTasks.length} done</span>
        </div>

        {!dashboard ? (
          <p className="text-sm text-gray-500">Loading today&apos;s topics...</p>
        ) : todayTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No topics are scheduled for today.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {pendingTasks.map((task) => (
              <div
                key={`${task.docId}-${task.taskIndex}`}
                className="w-full flex items-center gap-3 p-3 text-left rounded-2xl border border-pink-100 bg-pink-50 hover:bg-pink-100 transition-colors"
              >
                <button type="button" onClick={() => toggleTodayTask(task)} aria-label={`Mark ${task.task} as complete`} className="w-5 h-5 shrink-0 rounded-full border-2 border-purple-300 bg-white" />
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-800">{task.task}</span>
                  {(task.start_time || task.end_time || task.description) && (
                    <span className="block text-sm text-gray-500 mt-0.5">
                      {[task.start_time, task.end_time].filter(Boolean).join(' – ')}{task.description ? ` · ${task.description}` : ''}
                    </span>
                  )}
                </span>
                <button type="button" onClick={() => toggleRevisionTask(task)} className={`shrink-0 rounded-lg px-2 py-1 text-xs font-semibold ${task.revisionRequired ? 'bg-amber-200 text-amber-800' : 'bg-white text-purple-600 border border-purple-100'}`}>
                  {task.revisionRequired ? 'Marked for Revision' : 'Mark for Revision'}
                </button>
              </div>
            ))}

            {completedTodayTasks.length > 0 && (
              <div className="pt-3 mt-1 border-t border-pink-100">
                <p className="text-xs font-semibold uppercase tracking-wide text-green-600 mb-2">Completed</p>
                {completedTodayTasks.map((task) => (
                  <button
                    key={`${task.docId}-${task.taskIndex}`}
                    type="button"
                    onClick={() => toggleTodayTask(task)}
                    className="w-full flex items-center gap-3 p-3 text-left rounded-2xl hover:bg-green-50 transition-colors"
                    aria-label={`Mark ${task.task} as not complete`}
                  >
                    <span className="w-5 h-5 shrink-0 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">✓</span>
                    <span className="flex-1 min-w-0">
                      <span className="block font-semibold text-gray-500 line-through">{task.task}</span>
                      {(task.start_time || task.end_time || task.description) && (
                        <span className="block text-sm text-gray-400 mt-0.5">
                          {[task.start_time, task.end_time].filter(Boolean).join(' – ')}{task.description ? ` · ${task.description}` : ''}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl shadow-lg shadow-amber-100 border border-amber-100 p-5 sm:p-7 w-[50%] mb-8">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Revision Section</h2>
          <p className="text-sm text-gray-500">Topics you marked to revisit.</p>
        </div>
        {revisionTasks.length === 0 ? (
          <p className="text-sm text-gray-500">No topics are marked for revision yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {revisionTasks.map((task) => (
              <div key={`${task.docId}-${task.taskIndex}`} className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 border border-amber-100">
                <span className="text-lg">🔁</span>
                <span className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-800">{task.task}</span>
                  <span className="block text-sm text-gray-500 mt-0.5">{[task.date, task.start_time, task.end_time].filter(Boolean).join(' · ')}{task.description ? ` · ${task.description}` : ''}</span>
                </span>
                <button type="button" onClick={() => toggleRevisionTask(task)} className="shrink-0 rounded-lg bg-amber-200 px-2 py-1 text-xs font-semibold text-amber-800 hover:bg-amber-300">
                  Marked for Revision
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      </div>

      <section className="bg-white rounded-2xl shadow-md shadow-pink-100 border border-pink-50 p-5 w-full max-w-sm mb-8">
        <div className="mb-5">
          <h2 className="text-sm font-bold text-purple-950">Weekly Progress</h2>
          <p className="text-xs text-purple-300 mt-1">Study time</p>
        </div>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : !dashboard ? (
          <p className="text-sm text-gray-500">Loading study time...</p>
        ) : (
          <div className="h-40 flex items-end gap-2 px-1" aria-label="Weekly study time from Monday to Sunday">
            {weeklyStudyTime.map((day) => {
              const height = day.totalSeconds === 0 ? 0 : Math.max((day.totalSeconds / maxWeeklySeconds) * 100, 10)
              const label = `${day.day}, ${day.date}: ${formatStudyTime(day.totalSeconds)}`

              return (
                <div key={day.date} className="flex-1 h-full flex flex-col justify-end items-center gap-2 min-w-0">
                  <button
                    type="button"
                    title={label}
                    aria-label={label}
                    className="w-full h-28 flex items-end justify-center focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-md"
                  >
                    <span
                      className="w-3 sm:w-4 rounded-t-md bg-gradient-to-t from-purple-300 to-purple-200 transition-all hover:from-purple-400 hover:to-purple-300"
                      style={{ height: `${height}%` }}
                    />
                  </button>
                  <span className={`text-[10px] font-medium ${day.day === 'Mon' || day.day === 'Tue'|| day.day === 'Wed' || day.day === 'Thur'|| day.day === 'Fri' || day.day === 'Sat'|| day.day === 'Sun' ? 'text-purple-400' : 'text-purple-400'}`}>
                    {day.day}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="bg-white rounded-3xl shadow-lg shadow-pink-200 border border-pink-100 p-5 sm:p-7 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-6">
          <div>
            <h2 className="text-xl font-bold">Activity</h2>
            <p className="text-sm text-gray-500">Completed scheduled tasks during the last year</p>
          </div>
          <p className="text-sm text-gray-600">
            Current streak: <span className="font-semibold text-green-700">{dashboard?.currentStreak || 0} days</span>
          </p>
        </div>

        {error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : !dashboard ? (
          <p className="text-sm text-gray-500">Loading activity...</p>
        ) : (
          <>
            <div className="overflow-x-auto pb-2">
              <div className="flex gap-1 min-w-max" aria-label="365-day activity heatmap">
                {weeks.map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col gap-1">
                    {week.map((date) => {
                      const dateString = toLocalDateString(date)
                      const completedCount = activityByDate.get(dateString) || 0
                      const tooltip = `${dateString}: ${completedCount} completed task${completedCount === 1 ? '' : 's'}`

                      return (
                        <button
                          key={dateString}
                          type="button"
                          title={tooltip}
                          aria-label={tooltip}
                          onMouseEnter={() => setHoveredDay({ date: dateString, completedCount })}
                          onFocus={() => setHoveredDay({ date: dateString, completedCount })}
                          className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-sm transition-transform hover:scale-125 focus:scale-125 focus:outline-none focus:ring-2 focus:ring-green-600"
                          style={{ backgroundColor: activityColor(completedCount, maxActivity) }}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 mt-5 text-sm text-gray-600">
              <p>
                {hoveredDay
                  ? `${hoveredDay.date}: ${hoveredDay.completedCount} completed task${hoveredDay.completedCount === 1 ? '' : 's'}`
                  : 'Hover over a day to see its completed-task count.'}
              </p>
              <div className="flex items-center gap-1.5" aria-label="Activity intensity legend">
                <span>Less</span>
                {[0, 0.25, 0.5, 0.75, 1].map((level) => (
                  <span
                    key={level}
                    className="w-3 h-3 rounded-sm"
                    style={{ backgroundColor: level === 0 ? '#e5e7eb' : activityColor(Math.ceil(maxActivity * level), maxActivity) }}
                  />
                ))}
                <span>More</span>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  )
}

export default Page

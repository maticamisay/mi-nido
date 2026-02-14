'use client'

import { cn } from '@/lib/utils'

interface Classroom {
  id: string
  name: string
}

interface ClassroomDateFilterProps {
  classrooms: Classroom[]
  selectedClassroom: string
  onClassroomChange: (id: string) => void
  selectedDate?: string
  onDateChange?: (date: string) => void
  showDate?: boolean
}

export default function ClassroomDateFilter({
  classrooms,
  selectedClassroom,
  onClassroomChange,
  selectedDate,
  onDateChange,
  showDate = false,
}: ClassroomDateFilterProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {/* Classroom pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onClassroomChange('')}
          className={cn(
            'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
            !selectedClassroom
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          )}
        >
          Todas
        </button>
        {classrooms.map((c) => (
          <button
            key={c.id}
            onClick={() => onClassroomChange(c.id)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded-full transition-colors',
              selectedClassroom === c.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* Date picker */}
      {showDate && onDateChange && (
        <input
          type="date"
          value={selectedDate || ''}
          onChange={(e) => onDateChange(e.target.value)}
          className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        />
      )}
    </div>
  )
}

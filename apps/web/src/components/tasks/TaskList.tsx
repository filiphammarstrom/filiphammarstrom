import { useState } from 'react'
import type { Task } from '@todo/core'
import TaskRow from './TaskRow'
import TaskDetailPanel from './TaskDetailPanel'
import styles from './TaskList.module.css'

interface Props {
  tasks: Task[]
  onComplete: (id: string) => void
  showAssignee?: boolean
  emptyText?: string
}

export default function TaskList({ tasks, onComplete, showAssignee, emptyText = 'Inga uppgifter' }: Props) {
  const [selected, setSelected] = useState<Task | null>(null)

  if (tasks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>{emptyText}</p>
      </div>
    )
  }

  return (
    <>
      <div className={styles.list}>
        {tasks.map((task) => {
          const blocked =
            !!task.blocked_by_task_id &&
            task.blocked_by?.status !== 'completed'
          return (
            <TaskRow
              key={task.id}
              task={task}
              onComplete={onComplete}
              onSelect={setSelected}
              showAssignee={showAssignee}
              blocked={blocked}
            />
          )
        })}
      </div>
      {selected && (
        <TaskDetailPanel task={selected} onClose={() => setSelected(null)} />
      )}
    </>
  )
}

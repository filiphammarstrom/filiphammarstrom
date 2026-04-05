import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSupabase } from '../context/SupabaseContext'
import { useAuthStore, useSomedayTasks, useTaskMutations } from '@todo/store'
import type { Task } from '@todo/core'
import TaskDetailPanel from '../components/tasks/TaskDetailPanel'
import styles from './SomedayPage.module.css'
import pageStyles from './Page.module.css'

const PRIORITY_LABELS: Record<number, string> = {
  1: 'P1 – Urgent',
  2: 'P2 – Hög',
  3: 'P3 – Medium',
  4: 'P4 – Låg',
}
const PRIORITY_COLORS: Record<number, string> = {
  1: 'var(--red)',
  2: 'var(--orange)',
  3: 'var(--yellow)',
  4: 'var(--text-placeholder)',
}

function SortableTask({ task, onSelect }: { task: Task; onSelect: (t: Task) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`${styles.taskRow} ${isDragging ? styles.dragging : ''}`}
      onClick={() => onSelect(task)}
    >
      <span className={styles.handle} {...attributes} {...listeners} title="Drag för att sortera">
        ⠿
      </span>
      <span
        className={styles.priorityDot}
        style={{ background: PRIORITY_COLORS[task.priority] }}
      />
      <span className={styles.taskTitle}>{task.title}</span>
    </div>
  )
}

export default function SomedayPage() {
  const supabase = useSupabase()
  const user = useAuthStore((s) => s.user)
  const { data: tasks = [], isLoading } = useSomedayTasks(supabase, user?.id ?? '')
  const { complete, update, reorder } = useTaskMutations(supabase)
  const [selected, setSelected] = useState<Task | null>(null)

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Group by priority, within each group maintain sort_order
  const groups: Record<number, Task[]> = { 1: [], 2: [], 3: [], 4: [] }
  for (const t of tasks) {
    groups[t.priority].push(t)
  }

  function handleDragEnd(event: DragEndEvent, priorityGroup: Task[]) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = priorityGroup.findIndex((t) => t.id === active.id)
    const newIdx = priorityGroup.findIndex((t) => t.id === over.id)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = [...priorityGroup]
    const [moved] = reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, moved)

    reorder.mutate(reordered.map((t, i) => ({ id: t.id, sort_order: i })))
  }

  if (isLoading) return <div className={pageStyles.loading}>Laddar...</div>

  return (
    <div className={pageStyles.page}>
      <h1 className={pageStyles.title}>Someday</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: 13 }}>
        Uppgifter sorterade efter prioritet. Dra för att ändra ordning inom samma prioritetsnivå.
      </p>

      {([1, 2, 3, 4] as const).map((p) => {
        const group = groups[p]
        if (group.length === 0) return null
        return (
          <section key={p} className={pageStyles.section}>
            <h2
              className={pageStyles.sectionTitle}
              style={{ color: PRIORITY_COLORS[p] }}
            >
              {PRIORITY_LABELS[p]}
              <span style={{ color: 'var(--text-placeholder)', fontWeight: 400, textTransform: 'none', letterSpacing: 0, fontSize: 12, marginLeft: 6 }}>
                {group.length} uppgift{group.length !== 1 ? 'er' : ''}
              </span>
            </h2>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={(e) => handleDragEnd(e, group)}
            >
              <SortableContext
                items={group.map((t) => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {group.map((task) => (
                  <SortableTask key={task.id} task={task} onSelect={setSelected} />
                ))}
              </SortableContext>
            </DndContext>
          </section>
        )
      })}

      {tasks.length === 0 && (
        <p style={{ color: 'var(--text-muted)' }}>Inga someday-uppgifter.</p>
      )}

      {selected && (
        <TaskDetailPanel task={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  )
}

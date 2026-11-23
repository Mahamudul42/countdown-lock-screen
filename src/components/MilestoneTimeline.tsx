import { useId, type CSSProperties } from 'react'
import { milestones, palettes, type PaletteId } from '../data'
import './milestones.css'

type MilestoneTimelineProps = {
  selected: string
  onSelect: (id: string) => void
  completed: string[]
  onToggle: (id: string) => void
  palette: PaletteId
}

const dateFormat = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: '2-digit',
  year: 'numeric',
  timeZone: 'UTC',
})

function Checkmark() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="m3.4 8.2 3.1 3.1 6-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function MilestoneTimeline({
  selected, onSelect, completed, onToggle, palette,
}: MilestoneTimelineProps) {
  const baseId = useId()
  const completeCount = milestones.filter((milestone) => completed.includes(milestone.id)).length
  const style = { '--timeline-accent': palettes[palette].accent } as CSSProperties

  return (
    <section id="milestones" className="research-timeline" style={style} aria-labelledby={`${baseId}-title`}>
      <div className="research-timeline__inner">
        <p className="research-timeline__eyebrow"><span aria-hidden="true" />Flight plan</p>
        <div className="research-timeline__heading">
          <h2 id={`${baseId}-title`}>Mission milestones</h2>
          <div className="research-timeline__progress">
            <span aria-live="polite" aria-atomic="true">{completeCount} of {milestones.length} complete</span>
            <div className="research-timeline__meter" aria-hidden="true">
              {milestones.map((milestone) => <i key={milestone.id} data-done={completed.includes(milestone.id)} />)}
            </div>
          </div>
        </div>
        <ol className="research-timeline__list">
          {milestones.map((milestone, index) => {
            const isSelected = selected === milestone.id
            const isComplete = completed.includes(milestone.id)
            const date = new Date(milestone.date.length === 10 ? milestone.date + 'T00:00:00Z' : milestone.date)
            const panelId = `${baseId}-panel-${milestone.id}`
            const triggerId = `${baseId}-trigger-${milestone.id}`
            return (
              <li key={milestone.id} className="research-timeline__item" data-selected={isSelected} data-complete={isComplete}>
                <h3>
                  <button
                    type="button"
                    id={triggerId}
                    className="research-timeline__trigger"
                    aria-controls={panelId}
                    aria-expanded={isSelected}
                    aria-disabled={isSelected || undefined}
                    onClick={() => onSelect(milestone.id)}
                  >
                    <span className="research-timeline__marker" aria-hidden="true">
                      {isComplete ? <Checkmark /> : String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="research-timeline__name">{milestone.title}</span>
                    <time dateTime={milestone.date}>{dateFormat.format(date)}</time>
                    {isComplete && <span className="research-timeline__sr">Completed</span>}
                    <svg className="research-timeline__chevron" width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                      <path d="m4.5 6.5 3.5 3.6 3.5-3.6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </h3>
                <div id={panelId} aria-labelledby={triggerId} role="region" className="research-timeline__panel" hidden={!isSelected}>
                  <p>{milestone.description}</p>
                  <button
                    type="button"
                    className="research-timeline__toggle"
                    aria-pressed={isComplete}
                    aria-label={`Mark ${milestone.title} complete`}
                    onClick={() => onToggle(milestone.id)}
                  >
                    <span className="research-timeline__checkbox" aria-hidden="true">{isComplete && <Checkmark />}</span>
                    {isComplete ? 'Completed' : 'Mark complete'}
                  </button>
                </div>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}

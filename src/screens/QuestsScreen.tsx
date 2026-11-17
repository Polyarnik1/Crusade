import { useState } from 'react';
import { Bar, Icon } from '../components/ui';
import { dayKey, streak } from '../game/achievements';
import { formatKm } from '../game/geo';
import { DAILY_GOAL_REWARD, WEEKLY_GOAL, WEEKLY_REWARD, useGame, weekKey, weeklyCaptures } from '../game/store';

const WEEKDAYS = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];

export function QuestsScreen() {
  const { s, act } = useGame();
  const [title, setTitle] = useState('');
  const [glory, setGlory] = useState(20);
  const [editing, setEditing] = useState(false);
  const now = new Date();
  const k = dayKey();
  const day = s.days[k];
  const walked = day?.walkedM ?? 0;
  const goal = s.settings.dailyGoalKm * 1000;
  const walkDone = walked >= goal;
  const doneHabits = s.habits.filter((h) => h.doneDates.includes(k)).length;
  const total = s.habits.length + 1;
  const done = doneHabits + (walkDone ? 1 : 0);
  const todayGlory = s.habits.filter((h) => h.doneDates.includes(k)).reduce((a, h) => a + h.glory, 0) + (day?.goalRewarded ? DAILY_GOAL_REWARD : 0);
  const wc = weeklyCaptures(s);
  const weekDone = s.weeklyClaimed.includes(weekKey());
  const ring = 2 * Math.PI * 28;

  return (
    <div className="screen">
      <h1 className="screen-title">Задания</h1>
      <div className="muted" style={{ marginTop: 6 }}>
        {WEEKDAYS[now.getDay()]}, {now.getDate()} {MONTHS[now.getMonth()]}
      </div>

      <div className="panel row" style={{ marginTop: 16, gap: 16 }}>
        <div style={{ position: 'relative', width: 72, height: 72, flex: 'none' }}>
          <svg width="72" height="72" viewBox="0 0 72 72" aria-hidden="true">
            <circle cx="36" cy="36" r="28" fill="none" stroke="#2a2940" strokeWidth="9" />
            <circle
              cx="36"
              cy="36"
              r="28"
              fill="none"
              stroke="#E3B341"
              strokeWidth="9"
              strokeDasharray={`${(ring * done) / total} ${ring}`}
              transform="rotate(-90 36 36)"
            />
          </svg>
          <div className="pf" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 600 }}>
            {done}/{total}
          </div>
        </div>
        <div>
          <div className="h2">{done === total ? 'День завоёван' : done === 0 ? 'Поход ждёт' : 'Неплохое начало'}</div>
          <div className="muted" style={{ marginTop: 4, fontSize: 13 }}>
            +{todayGlory} славы сегодня · серия {streak(s)} дн.
          </div>
        </div>
      </div>

      <div className="panel gold" style={{ marginTop: 12 }}>
        <div className="row between">
          <div className="label" style={{ color: 'var(--gold)' }}>Недельный вызов</div>
          <div className="muted" style={{ fontSize: 12 }}>{weekDone ? 'выполнен' : `до понедельника`}</div>
        </div>
        <div className="h2" style={{ marginTop: 6 }}>Захвати {WEEKLY_GOAL} удела</div>
        <div style={{ margin: '10px 0 6px' }}>
          <Bar value={wc / WEEKLY_GOAL} />
        </div>
        <div className="row between muted" style={{ fontSize: 12 }}>
          <span>
            {Math.min(wc, WEEKLY_GOAL)} из {WEEKLY_GOAL}
          </span>
          <span>+{WEEKLY_REWARD} славы</span>
        </div>
      </div>

      <div className="row between" style={{ marginTop: 22 }}>
        <div className="label">Привычки</div>
        <button type="button" className="btn btn-sm" onClick={() => setEditing((e) => !e)}>
          {editing ? 'Готово' : 'Изменить'}
        </button>
      </div>

      <div className="stack" style={{ marginTop: 10 }}>
        <div className="panel habit">
          <div className="check" aria-hidden="true" data-on={walkDone}>
            <span>{walkDone && <Icon name="check" size={16} />}</span>
          </div>
          <div style={{ flex: 1 }}>
            <div className={walkDone ? 'done-text' : ''} style={{ fontWeight: 600 }}>Пройти {s.settings.dailyGoalKm} км</div>
            <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 2 }}>
              засчитается само, по карте · {formatKm(walked)} км
            </div>
            {!walkDone && (
              <div style={{ marginTop: 8 }}>
                <Bar value={walked / goal} />
              </div>
            )}
          </div>
          <div className="pf" style={{ fontSize: 16, color: walkDone ? 'var(--muted)' : 'var(--gold)' }}>+{DAILY_GOAL_REWARD}</div>
        </div>

        {s.habits.map((h) => {
          const on = h.doneDates.includes(k);
          return (
            <div key={h.id} className="panel habit">
              <button type="button" className="check" aria-pressed={on} aria-label={`${on ? 'Снять отметку' : 'Отметить'}: ${h.title}`} onClick={() => act.toggleHabit(h.id)}>
                <span>{on && <Icon name="check" size={16} />}</span>
              </button>
              <div className={on ? 'done-text' : ''} style={{ flex: 1, fontWeight: 600 }}>
                {h.title}
              </div>
              {editing ? (
                <button type="button" className="btn btn-icon btn-sm btn-red" aria-label={`Удалить: ${h.title}`} onClick={() => act.removeHabit(h.id)}>
                  <Icon name="close" size={14} />
                </button>
              ) : (
                <div className="pf" style={{ fontSize: 16, color: on ? 'var(--muted)' : 'var(--gold)' }}>+{h.glory}</div>
              )}
            </div>
          );
        })}
      </div>

      <form
        className="panel dim"
        style={{ marginTop: 12 }}
        onSubmit={(e) => {
          e.preventDefault();
          act.addHabit(title, glory);
          setTitle('');
        }}
      >
        <label htmlFor="new-habit" className="label">
          Новая привычка
        </label>
        <input id="new-habit" className="input" style={{ marginTop: 8 }} placeholder="Например: лечь спать до полуночи" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} />
        <div className="row" style={{ marginTop: 10, flexWrap: 'wrap' }}>
          <span className="muted" style={{ fontSize: 13 }}>Награда:</span>
          {[10, 20, 30].map((g) => (
            <button key={g} type="button" className={'chip' + (glory === g ? ' on' : '')} onClick={() => setGlory(g)}>
              +{g}
            </button>
          ))}
          <div style={{ flex: 1 }} />
          <button type="submit" className="btn btn-gold btn-sm" disabled={!title.trim()}>
            <Icon name="plus" size={12} />
            Добавить
          </button>
        </div>
      </form>
    </div>
  );
}

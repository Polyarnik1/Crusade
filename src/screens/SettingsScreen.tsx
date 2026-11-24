import { sfx } from '../audio/sfx';
import { useRef, useState } from 'react';
import { Tower } from '../art/heraldry';
import { Pixel } from '../art/Pixel';
import { REGALIA_ART } from '../art/arts';
import { SOURCE_LABEL, type MapSource } from '../art/tiles';
import { Icon, Sheet, Switch } from '../components/ui';
import { regaliaCount } from '../game/achievements';
import { TOWERS } from '../game/cosmetics';
import { useGame } from '../game/store';
import { Picks } from './KingdomEditor';

export function SettingsScreen({ onBack }: { onBack: () => void }) {
  const { s, act } = useGame();
  const reg = regaliaCount(s);
  const st = s.settings;
  const file = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [donate, setDonate] = useState(false);
  const [msg, setMsg] = useState('');

  const exportData = () => {
    const blob = new Blob([JSON.stringify({ ...s, ui: { ...s.ui, toasts: [] } })], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `crusade-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="screen">
      <div className="row">
        <button type="button" className="btn btn-icon" onClick={onBack} aria-label="Назад">
          <Icon name="back" size={14} />
        </button>
        <h1 className="screen-title" style={{ fontSize: 28 }}>Настройки</h1>
      </div>

      <Group title="Облик башен">
        {s.kingdom ? (
          <Picks items={TOWERS} value={s.kingdom.tower} reg={reg} onPick={act.setTower} render={(i) => <Tower tower={i.id} color={s.kingdom!.banner.color} size={32} />} />
        ) : (
          <p className="muted" style={{ fontSize: 14, margin: 0 }}>Сначала основай королевство — тогда появятся башни.</p>
        )}
        {s.kingdom && (
          <button type="button" className="btn btn-block btn-sm" style={{ marginTop: 10 }} onClick={act.openFounding}>
            Знамя, цвет и название
          </button>
        )}
      </Group>

      <Group title="Карта">
        <Row title="Красный контур у соседей" hint="Земли соседей всегда подсвечены их цветом, контур — по желанию">
          <Switch on={st.redBorders} onChange={(v) => act.setSettings({ redBorders: v })} label="Красный контур у соседей" />
        </Row>
        <Row title="Звуки" hint="Колокола, рог и барабаны на захватах, регалиях и походах">
          <Switch on={st.sound} onChange={(v) => act.setSettings({ sound: v })} label="Звуки" />
        </Row>
        {st.sound && (
          <Row title="Громкость" stack>
            <div className="chips" style={{ marginTop: 8 }}>
              {(
                [
                  [0.35, 'Тихо'],
                  [0.7, 'Средне'],
                  [1, 'Громко'],
                ] as const
              ).map(([v, name]) => (
                <button
                  key={v}
                  type="button"
                  className={'chip' + (Math.abs(st.volume - v) < 0.01 ? ' on' : '')}
                  onClick={() => {
                    act.setSettings({ volume: v });
                    sfx.setVolume(v);
                    sfx.play('quest');
                  }}
                >
                  {name}
                </button>
              ))}
            </div>
          </Row>
        )}
        <Row stack title="Подложка карты" hint="«Авто» сама находит рабочий источник. Если карта не грузится — выбери другой">
          <div className="chips" style={{ marginTop: 8 }}>
            {(Object.keys(SOURCE_LABEL) as MapSource[]).map((m) => (
              <button key={m} type="button" className={'chip' + (st.mapSource === m ? ' on' : '')} onClick={() => act.setSettings({ mapSource: m })}>
                {SOURCE_LABEL[m]}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Демо-соседи" hint="Пока нет сервера, рядом живут три выдуманных королевства">
          <Switch on={st.demoNeighbors} onChange={(v) => act.setSettings({ demoNeighbors: v })} label="Демо-соседи" />
        </Row>
        <div style={{ marginTop: 12 }}>
          <div style={{ fontWeight: 600 }}>Поход дня</div>
          <div className="chips" style={{ marginTop: 8 }}>
            {[1, 2, 3, 5, 8].map((km) => (
              <button key={km} type="button" className={'chip' + (st.dailyGoalKm === km ? ' on' : '')} onClick={() => act.setSettings({ dailyGoalKm: km })}>
                {km} км
              </button>
            ))}
          </div>
        </div>
      </Group>

      <Group title="Приватность">
        <Row title="Скрывать зону вокруг дома" hint="Другие игроки не увидят твои земли рядом с домом (заработает вместе с сервером)">
          <Switch on={st.hideHome} onChange={(v) => act.setSettings({ hideHome: v })} label="Скрывать зону вокруг дома" />
        </Row>
        {st.hideHome && (
          <div style={{ marginTop: 10 }}>
            <div className="chips">
              {[200, 300, 500].map((r) => (
                <button key={r} type="button" className={'chip' + (st.homeRadius === r ? ' on' : '')} onClick={() => act.setSettings({ homeRadius: r })}>
                  {r} м
                </button>
              ))}
            </div>
            <button type="button" className="btn btn-block btn-sm" style={{ marginTop: 10 }} onClick={act.markHome} disabled={!s.lastPos}>
              {st.home ? 'Дом отмечен — обновить по текущему месту' : 'Отметить дом здесь'}
            </button>
          </div>
        )}
      </Group>

      <Group title="Для разработки">
        <Row title="Тестовый поход" hint="Кнопка «В поход» запустит симуляцию: две петли рядом с тобой, без реальной ходьбы">
          <Switch on={st.simulate} onChange={(v) => act.setSettings({ simulate: v })} label="Тестовый поход" />
        </Row>
        <Row title="Потеря земель" hint="Отобрать все земли и посмотреть, как выглядит изгнание. Вернуть их можно любым захватом">
          <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={act.loseLand} disabled={!s.land}>
            Отобрать земли
          </button>
        </Row>
        <Row title="Бенедикт" hint="Показать знакомство с Бенедиктом ещё раз — он придёт на карте">
          <button type="button" className="btn btn-sm" style={{ marginTop: 8 }} onClick={() => act.meetBenedict(false)} disabled={!s.kingdom || !s.flags.metBenedict}>
            Позвать снова
          </button>
        </Row>
      </Group>

      <Group title="Данные">
        <p className="muted" style={{ fontSize: 13, lineHeight: 1.45, margin: '0 0 10px' }}>
          Пока прогресс хранится только в этом браузере. Сохрани копию, чтобы перенести на другое устройство.
        </p>
        <div className="row">
          <button type="button" className="btn btn-sm" style={{ flex: 1 }} onClick={exportData}>
            Сохранить копию
          </button>
          <button type="button" className="btn btn-sm" style={{ flex: 1 }} onClick={() => file.current?.click()}>
            Загрузить
          </button>
        </div>
        <input
          ref={file}
          type="file"
          accept="application/json"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setMsg(act.importState(await f.text()) ? 'Прогресс загружен.' : 'Не получилось прочитать файл.');
            e.target.value = '';
          }}
        />
        {msg && <div className="muted" style={{ fontSize: 13, marginTop: 8 }}>{msg}</div>}
        <button type="button" className="btn btn-red btn-block btn-sm" style={{ marginTop: 10 }} onClick={() => setConfirmReset(true)}>
          Начать заново
        </button>
      </Group>

      <div className="panel" style={{ marginTop: 16, borderColor: 'var(--gold)', borderWidth: 3, borderBottomWidth: 6 }}>
        <div className="row" style={{ gap: 12 }}>
          <div style={{ padding: 4, background: 'var(--bg)', border: '3px dashed var(--gold)' }}>
            <Pixel grid={REGALIA_ART.patron} size={40} />
          </div>
          <div className="h2">Поддержать проект</div>
        </div>
        <p style={{ fontSize: 14, lineHeight: 1.5, margin: '12px 0', color: '#d5dae2' }}>
          Здесь нет рекламы и платных функций. Донат ничего не открывает, кроме регалии «Меценат» в профиле.
        </p>
        <button type="button" className="btn btn-gold btn-block" onClick={() => setDonate(true)}>
          Поддержать
        </button>
      </div>

      <div className="muted" style={{ textAlign: 'center', fontSize: 12, marginTop: 18 }}>
        Crusade 0.1 · карта © OpenStreetMap, CARTO
      </div>

      {confirmReset && (
        <Sheet onClose={() => setConfirmReset(false)} label="Начать заново" center>
          <div className="h2" style={{ fontSize: 24 }}>Сжечь летопись?</div>
          <p style={{ lineHeight: 1.5, fontSize: 14 }}>Земли, слава, регалии и королевство исчезнут из этого браузера. Отменить это нельзя.</p>
          <div className="row">
            <button type="button" className="btn" style={{ flex: 1 }} onClick={() => setConfirmReset(false)}>
              Отмена
            </button>
            <button
              type="button"
              className="btn btn-red"
              style={{ flex: 1 }}
              onClick={() => {
                act.resetAll();
                setConfirmReset(false);
                onBack();
              }}
            >
              Сжечь
            </button>
          </div>
        </Sheet>
      )}

      {donate && (
        <Sheet onClose={() => setDonate(false)} label="Поддержать проект" center>
          <div className="h2" style={{ fontSize: 24 }}>Казна скоро откроется</div>
          <p style={{ lineHeight: 1.5, fontSize: 14 }}>
            Приём донатов подключим вместе с сервером. Спасибо, что хочешь поддержать — регалия «Меценат» уже ждёт тебя.
          </p>
          <button type="button" className="btn btn-gold btn-block" onClick={() => setDonate(false)}>
            Буду ждать
          </button>
        </Sheet>
      )}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="panel" style={{ marginTop: 14 }}>
      <div className="label" style={{ marginBottom: 10 }}>
        {title}
      </div>
      {children}
    </section>
  );
}

function Row({ title, hint, children, stack }: { title: string; hint?: string; children: React.ReactNode; stack?: boolean }) {
  return (
    <div className={stack ? '' : 'row'} style={{ padding: '6px 0', alignItems: 'center' }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600 }}>{title}</div>
        {hint && (
          <div className="muted" style={{ fontSize: 12, lineHeight: 1.4, marginTop: 2 }}>
            {hint}
          </div>
        )}
      </div>
      {children}
    </div>
  );
}

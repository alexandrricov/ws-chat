import React from 'react';
import s from './s.module.css';

function Time({date}) {
  const dtf = Intl.DateTimeFormat
    ? new Intl.DateTimeFormat(
      navigator.language,
      {
        hour: 'numeric',
        minute: 'numeric',
      }
    )
    : null;

  const text = dtf ? dtf.format(new Date(date)) : date;

  return <time className={s.time} dateTime={date}>{text}</time>
}

/**
 *
 * @param {RicovUser=} user
 * @param {RicovMessage} message
 * @return {*}
 * @constructor
 */
export const Message = ({ user, message, onEdit, onRemove }) => {

  return (
    <>
      <div className={s.nameRow}>
        <strong>{message.type === 'message' ? user?.name : 'Meetingbot'}</strong>  <Time date={message.date} />
        {message.type === 'message' && message.userId === user?.id
          ? <div className={s.actions}>
              <button type="button" onClick={() => onEdit(message.id)}>✏️</button>
              <button type="button" onClick={() => onRemove(message.id)}>🚮</button>
            </div>
          : null
        }
      </div>
      {message.type === 'message'
        ? <div>{message.deleted ? 'deleted' : message.message}</div>
        : <div className={s.systemMessageText}>{`${user?.name ?? ''} ${message.message === 'join' ? 'joined' : 'left'}.`}</div>
      }
    </>
  )
};

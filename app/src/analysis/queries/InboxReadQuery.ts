import log from 'electron-log';
import * as sqlite3 from 'sqlite3';

import { isDateInThisWeek } from '../../main/util';
import { allP } from '../../utils/sqliteWrapper';
// import { getLastMainTableRefreshDate } from '../../utils/store';
import { CoreTableNames } from '../tables/types';

export type InboxReadQueryResult = {
  message_id: number;
  message: string;
  is_from_me: number;
  human_readable_date: string;
  contact_name: string;
  cache_roomnames: string;
  phone_number: string;
  chat_id: string;
};

export async function queryInboxRead(
  db: sqlite3.Database,
  chatId: string
): Promise<InboxReadQueryResult[]> {
  // TODO(Danilowicz): read off messages directly dont bother with reactions right now
  const q = `
        SELECT DISTINCT
            message_id,
            text AS message,
            is_from_me,
            human_readable_date,
            COALESCE(contact_name, id) as contact_name,
            cache_roomnames,
            id AS phone_number,
            chat_id
        FROM ${CoreTableNames.CORE_MAIN_TABLE}
        WHERE message_id IS NOT NULL AND chat_id = ${chatId}
        -- sort by chat and by date
        ORDER BY human_readable_date DESC
        LIMIT 10
    `;

  return allP(db, q);
}

export type TGetChatIdsResult = {
  chat_id: string;
  contact_name: string;
  category: TInboxCategory;
}[];

// Order here matters, it's what we sort by
export enum TInboxCategory {
  'POSSIBLE_FOLLOW_UP' = 'POSSIBLE_FOLLOW_UP',
  'AWAITING_YOUR_RESPONSE' = 'AWAITING_YOUR_RESPONSE',
  'RECENT' = 'RECENT',
  'MANUAL_REVIEW' = 'MANUAL_REVIEW',
}

export async function queryGetInboxChatIds(
  db: sqlite3.Database
): Promise<TGetChatIdsResult> {
  const lastMainTableRefreshDate = '2022-09-29T07:25:36.180Z'; // getLastMainTableRefreshDate();
  console.log('r', lastMainTableRefreshDate);
  let dateClause = '';
  if (lastMainTableRefreshDate) {
    dateClause = `WHERE human_readable_date > DATE("${lastMainTableRefreshDate}")`;
  }
  const q = `
    WITH TB AS (
    SELECT DISTINCT chat_id, COALESCE(contact_name, id) as contact_name, text as message, MAX(human_readable_date) as human_readable_date, is_from_me
    FROM ${CoreTableNames.CORE_MAIN_TABLE}
    WHERE chat_id IS NOT NULL
    AND (service_center != chat_id OR service_center is NULL)
    -- do not do group chats for now
    AND cache_roomnames IS NULL
    GROUP BY chat_id)
    SELECT * FROM TB ${dateClause}
  `;
  const data = await allP(db, q);

  if (data && Array.isArray(data) && data.length > 0) {
    const dataMapped = data.map((m) => {
      const includesQ = m.message.includes('?');
      const lastWeek = isDateInThisWeek(new Date(m.human_readable_date));
      const isFromMeBool = m.is_from_me.toString() === '1';

      let category = TInboxCategory.MANUAL_REVIEW;
      if (isFromMeBool && includesQ) {
        category = TInboxCategory.POSSIBLE_FOLLOW_UP;
      }

      if (includesQ && !isFromMeBool) {
        category = TInboxCategory.AWAITING_YOUR_RESPONSE;
      }

      if (lastWeek && includesQ) {
        category = TInboxCategory.RECENT;
      }

      return {
        chat_id: m.chat_id,
        contact_name: m.contact_name,
        category,
      };
    });
    const ordered = Object.values(TInboxCategory);

    return dataMapped.sort(
      (a, b) => ordered.indexOf(a.category) - ordered.indexOf(b.category)
    );
  }
  return [];
}

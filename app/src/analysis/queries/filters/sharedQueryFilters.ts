import {
  filterOutReactions,
  GroupChatFilters,
} from '../../../constants/filters';
import { objReplacementUnicode } from '../../../constants/objReplacementUnicode';

export interface SharedQueryFilters {
  limit?: number;
  contact?: string;
  word?: string;
  groupChat?: string;
}

function wordFilter(filters: SharedQueryFilters): string | undefined {
  if (!filters.word || filters.word.length === 0) {
    return undefined;
  }
  // NOTE: using LIKE because CORE_MAIN_TABLE table is not split word by word
  return `LOWER(text) LIKE "%${filters.word?.toLowerCase()}%"`;
}

function contactFilter(filters: SharedQueryFilters): string | undefined {
  if (!filters.contact || filters.contact.length === 0) {
    return undefined;
  }
  return `friend = "${filters.contact}"`;
}

function groupChatFilter(filters: SharedQueryFilters): string | undefined {
  if (filters.groupChat === GroupChatFilters.ONLY_INDIVIDUAL) {
    return `cache_roomnames IS NULL`;
  }
  return undefined; // would query for both individual and groupchats
}

function fluffFilter(): string {
  return `
    ${filterOutReactions()} AND unicode(TRIM(text)) != ${objReplacementUnicode}
    AND text IS NOT NULL
    AND LENGTH(text) >= 1`;
}

export function getAllFilters(
  filters: SharedQueryFilters,
  defaultFilterStatement?: string
): string {
  const contact = contactFilter(filters);
  const groupChats = groupChatFilter(filters);
  const word = wordFilter(filters);
  const fluff = fluffFilter();

  const filtersArray = [
    contact,
    groupChats,
    word,
    fluff,
    defaultFilterStatement,
  ].filter((filter) => !!filter);

  return filtersArray.length > 0 ? `WHERE ${filtersArray.join(' AND ')}` : '';
}
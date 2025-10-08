import { isSupabaseConfigured, waitForInitialSession, getCurrentUser, getSupabaseClient } from '/scripts/supabase-client.js';

const globalConfig = (typeof window !== 'undefined' && window.__SUPABASE_COMMUNITY__) || {};
const TABLE_NAME = globalConfig.table || 'templates';
const NAME_COLUMN = globalConfig.nameColumn || 'name';
const DESCRIPTION_COLUMN = globalConfig.descriptionColumn || 'description';
const USER_ID_COLUMN = globalConfig.userIdColumn || 'user_id';
const CONTENT_COLUMN = globalConfig.contentColumn || 'content';

function mapRecord(record) {
  if (!record || typeof record !== 'object') {
    return null;
  }

  const rawContent = record[CONTENT_COLUMN] ?? null;
  let parsedContent = rawContent;

  if (typeof rawContent === 'string') {
    try {
      parsedContent = JSON.parse(rawContent);
    } catch (error) {
      parsedContent = null;
    }
  }

  return {
    id: record.id,
    created_at: record.created_at,
    name: record[NAME_COLUMN] ?? record.name ?? 'Untitled template',
    description: record[DESCRIPTION_COLUMN] ?? record.description ?? '',
    user_id: record[USER_ID_COLUMN] ?? record.user_id ?? null,
    content: rawContent,
    template: parsedContent,
    raw: record
  };
}

export async function requireAuthenticatedUser() {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  await waitForInitialSession();
  const user = getCurrentUser();
  if (!user) {
    const error = new Error('You must be logged in to continue.');
    error.code = 'auth-required';
    throw error;
  }
  return user;
}

export async function shareTemplateToCommunity(sharePayload) {
  if (!sharePayload || typeof sharePayload !== 'object') {
    throw new Error('Template data is required.');
  }

  await waitForInitialSession();
  const client = getSupabaseClient();
  const user = (await client.auth.getUser()).data?.user || null;
  const entry = {
    [NAME_COLUMN]: sharePayload.name || 'Untitled template',
    [DESCRIPTION_COLUMN]: sharePayload.description ?? '',
    [CONTENT_COLUMN]: sharePayload.content,
    [USER_ID_COLUMN]: user?.id || null
  };

  if (entry[CONTENT_COLUMN] == null) {
    throw new Error('Template content is required to share templates.');
  }

  const { error } = await client
    .from(TABLE_NAME)
    .insert([entry]);

  if (error) {
    throw error;
  }

  return true;
}

export async function fetchCommunityTemplates({ limit } = {}) {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase is not configured.');
  }

  const client = getSupabaseClient();
  const selectColumns = ['id', NAME_COLUMN, DESCRIPTION_COLUMN, USER_ID_COLUMN, 'created_at', CONTENT_COLUMN];
  let query = client
    .from(TABLE_NAME)
    .select(selectColumns.join(', '))
    .order('created_at', { ascending: false });

  if (typeof limit === 'number') {
    query = query.limit(limit);
  }

  const { data, error } = await query;
  if (error) {
    throw error;
  }

  return Array.isArray(data) ? data.map(mapRecord).filter(Boolean) : [];
}

export { mapRecord as normaliseCommunityTemplate };

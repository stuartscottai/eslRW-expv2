import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';
import { ENV } from '/scripts/env.js';

const STORAGE_KEY = 'esl-report-writer-supabase-auth';

function resolveConfig() {
  const globalConfig = (typeof window !== 'undefined' && window.__SUPABASE_CONFIG__) || {};
  const envConfig = (typeof ENV !== 'undefined' && ENV) || {};
  const url = globalConfig.url
    || envConfig.SUPABASE_URL
    || (typeof window !== 'undefined' && window.__SUPABASE_URL__)
    || (typeof document !== 'undefined' && document.querySelector('meta[name="supabase-url"]')?.content)
    || '';
  const anonKey = globalConfig.anonKey
    || envConfig.SUPABASE_ANON_KEY
    || (typeof window !== 'undefined' && window.__SUPABASE_ANON_KEY__)
    || (typeof document !== 'undefined' && document.querySelector('meta[name="supabase-anon-key"]')?.content)
    || '';

  return {
    url: url.trim(),
    anonKey: anonKey.trim()
  };
}

const authCallbacks = new Set();
let supabaseClient = null;
let sessionPromise = null;
let currentUser = null;
let hasInitialised = false;

function ensureClient() {
  if (supabaseClient) {
    return supabaseClient;
  }

  const { url, anonKey } = resolveConfig();
  if (!url || !anonKey) {
    throw new Error('Supabase credentials are missing. Define window.__SUPABASE_URL__ and window.__SUPABASE_ANON_KEY__ or matching <meta> tags.');
  }

  supabaseClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      storageKey: STORAGE_KEY,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });

  sessionPromise = supabaseClient.auth.getSession()
    .then(({ data }) => {
      currentUser = data.session?.user ?? null;
      hasInitialised = true;
      return currentUser;
    })
    .catch((error) => {
      console.warn('Failed to load Supabase session', error);
      hasInitialised = true;
      currentUser = null;
      return null;
    });

  supabaseClient.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    hasInitialised = true;
    authCallbacks.forEach((callback) => {
      try {
        callback(currentUser);
      } catch (error) {
        console.error('Auth callback failed', error);
      }
    });
  });

  return supabaseClient;
}

export function isSupabaseConfigured() {
  const { url, anonKey } = resolveConfig();
  return Boolean(url && anonKey);
}

export function getSupabaseClient() {
  return ensureClient();
}

export function onAuthStateChange(callback) {
  if (typeof callback !== 'function') return () => {};
  authCallbacks.add(callback);
  if (hasInitialised) {
    try {
      callback(currentUser);
    } catch (error) {
      console.error('Auth callback failed', error);
    }
  } else if (sessionPromise) {
    sessionPromise.finally(() => {
      try {
        callback(currentUser);
      } catch (error) {
        console.error('Auth callback failed', error);
      }
    });
  }
  return () => authCallbacks.delete(callback);
}

export function getCurrentUser() {
  return currentUser;
}

export async function refreshSession() {
  const client = ensureClient();
  const { data, error } = await client.auth.getUser();
  if (error) throw error;
  currentUser = data.user ?? null;
  return currentUser;
}

export async function waitForInitialSession() {
  ensureClient();
  return sessionPromise ?? Promise.resolve(currentUser);
}

export async function signUp({ email, password }) {
  const client = ensureClient();
  const { data, error } = await client.auth.signUp({ email, password });
  if (error) throw error;
  return data.user ?? null;
}

export async function signIn({ email, password }) {
  const client = ensureClient();
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user ?? null;
}

export async function signOut() {
  const client = ensureClient();
  const { error } = await client.auth.signOut();
  if (error) throw error;
  currentUser = null;
  return true;
}

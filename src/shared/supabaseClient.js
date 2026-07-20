const { createClient } = require('@supabase/supabase-js');
const config = require('./config');

let client = null;

function getClient() {
  if (!client) {
    client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      realtime: { params: { eventsPerSecond: 10 } },
    });
  }
  return client;
}

module.exports = { getClient };

sap.ui.define([], function () {
  'use strict';

  return {
    getInboxSummary: async function () {
      // Placeholder — Fase 3 conectara con backend/IA
      return { unread: 0, total: 0, lastSync: null };
    },

    healthCheck: async function (baseUrl) {
      var url = (baseUrl || '') + '/health';
      try {
        var res = await fetch(url);
        return res.ok;
      } catch {
        return false;
      }
    },
  };
});

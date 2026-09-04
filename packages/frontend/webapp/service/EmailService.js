sap.ui.define([], function () {
  'use strict';

  return {
    getInboxSummary: async function () {
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

    searchRag: async function (baseUrl, query, opts) {
      var url = (baseUrl || '') + '/rag/search?q=' + encodeURIComponent(query);
      if (opts && opts.limit) url += '&limit=' + encodeURIComponent(String(opts.limit));
      if (opts && opts.accountId) url += '&accountId=' + encodeURIComponent(opts.accountId);
      var res = await fetch(url);
      if (!res.ok) throw new Error('RAG search failed: ' + res.status);
      var data = await res.json();
      return data.results || [];
    },

    listPrompts: async function (baseUrl) {
      var url = (baseUrl || '') + '/prompts';
      var res = await fetch(url);
      if (!res.ok) throw new Error('listPrompts failed: ' + res.status);
      var data = await res.json();
      return data.templates || [];
    },

    getPrompt: async function (baseUrl, name, version) {
      var url = (baseUrl || '') + '/prompts/' + encodeURIComponent(name);
      if (version) url += '?version=' + encodeURIComponent(version);
      var res = await fetch(url);
      if (!res.ok) throw new Error('getPrompt failed: ' + res.status);
      var data = await res.json();
      return data.template;
    },

    renderPrompt: async function (baseUrl, name, variables, version) {
      var url = (baseUrl || '') + '/prompts/render';
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, variables: variables, version: version }),
      });
      if (!res.ok) throw new Error('renderPrompt failed: ' + res.status);
      var data = await res.json();
      return data.messages || [];
    },

    evaluatePrompts: async function (baseUrl, cases) {
      var url = (baseUrl || '') + '/prompts/evaluate';
      var res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cases: cases }),
      });
      if (!res.ok) throw new Error('evaluatePrompts failed: ' + res.status);
      var data = await res.json();
      return data.result;
    },
  };
});

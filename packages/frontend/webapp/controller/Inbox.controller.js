sap.ui.define(
  ['sap/ui/core/mvc/Controller', 'sap/m/MessageToast', 'com/emailia/frontend/service/EmailService'],
  function (Controller, MessageToast, EmailService) {
    'use strict';

    return Controller.extend('com.emailia.frontend.controller.Inbox', {
      onInit: async function () {
        var oModel = this.getView().getModel('app');
        var summary = await EmailService.getInboxSummary();
        if (oModel) {
          oModel.setProperty('/inboxSummary', summary);
          if (!oModel.getProperty('/ragResults')) oModel.setProperty('/ragResults', []);
        }
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo('home');
      },

      onSearchRag: async function () {
        var oView = this.getView();
        var oModel = oView.getModel('app');
        var oField = oView.byId('ragSearchField');
        var sQuery = oField ? oField.getValue() : '';
        if (!sQuery) return;
        try {
          var results = await EmailService.searchRag('', sQuery, { limit: 5 });
          if (oModel) oModel.setProperty('/ragResults', results);
        } catch (e) {
          if (oModel) oModel.setProperty('/ragResults', []);
          MessageToast.show(e.message || 'RAG search failed');
        }
      },
    });
  },
);

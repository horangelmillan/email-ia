sap.ui.define(
  ['sap/ui/core/mvc/Controller', 'com/emailia/frontend/service/EmailService'],
  function (Controller, EmailService) {
    'use strict';

    return Controller.extend('com.emailia.frontend.controller.Inbox', {
      onInit: async function () {
        var oModel = this.getView().getModel('app');
        var summary = await EmailService.getInboxSummary();
        if (oModel) {
          oModel.setProperty('/inboxSummary', summary);
        }
      },

      onNavBack: function () {
        this.getOwnerComponent().getRouter().navTo('home');
      },
    });
  },
);

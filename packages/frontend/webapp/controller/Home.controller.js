sap.ui.define(
  ['sap/ui/core/mvc/Controller', 'sap/m/MessageToast', 'com/emailia/frontend/service/EmailService'],
  function (Controller, MessageToast, EmailService) {
    'use strict';

    return Controller.extend('com.emailia.frontend.controller.Home', {
      onInit: async function () {
        await this.onRefreshPrompts();
      },

      onNavToInbox: function () {
        this.getOwnerComponent().getRouter().navTo('inbox');
      },

      onRefreshPrompts: async function () {
        try {
          var prompts = await EmailService.listPrompts('');
          var oModel = this.getView().getModel('app');
          if (oModel) oModel.setProperty('/prompts', prompts);
        } catch (e) {
          MessageToast.show(e.message || 'Failed to load prompts');
        }
      },
    });
  },
);

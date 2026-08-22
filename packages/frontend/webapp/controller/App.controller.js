sap.ui.define(
  ['sap/ui/core/mvc/Controller', 'sap/m/MessageToast', 'com/emailia/frontend/service/EmailService'],
  function (Controller, MessageToast, EmailService) {
    'use strict';

    return Controller.extend('com.emailia.frontend.controller.App', {
      onInit: function () {},

      onPressInbox: function () {
        var oRouter = this.getOwnerComponent().getRouter();
        oRouter.navTo('inbox');
      },

      onPressHealth: async function () {
        var ok = await EmailService.healthCheck('');
        MessageToast.show(ok ? 'Backend OK' : 'Backend no disponible');
      },
    });
  },
);

sap.ui.define(['sap/ui/core/mvc/Controller'], function (Controller) {
  'use strict';

  return Controller.extend('com.emailia.frontend.controller.Home', {
    onNavToInbox: function () {
      this.getOwnerComponent().getRouter().navTo('inbox');
    },
  });
});

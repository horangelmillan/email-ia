sap.ui.define(
  ['sap/ui/core/UIComponent', 'com/emailia/frontend/model/models'],
  function (UIComponent, models) {
    'use strict';

    return UIComponent.extend('com.emailia.frontend.Component', {
      metadata: { manifest: 'json' },

      init: function () {
        UIComponent.prototype.init.apply(this, arguments);
        this.setModel(models.createAppModel(), 'app');
        this.setModel(models.createDeviceModel(), 'device');
        this.getRouter().initialize();
      },
    });
  },
);

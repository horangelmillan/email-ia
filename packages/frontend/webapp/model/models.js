sap.ui.define(['sap/ui/model/json/JSONModel', 'sap/ui/Device'], function (JSONModel, Device) {
  'use strict';

  return {
    createAppModel: function () {
      return new JSONModel({
        appTitle: 'Email IA',
        appVersion: '0.0.0',
        status: 'ready',
      });
    },

    createDeviceModel: function () {
      var oModel = new JSONModel(Device);
      oModel.setDefaultBindingMode('OneWay');
      return oModel;
    },
  };
});

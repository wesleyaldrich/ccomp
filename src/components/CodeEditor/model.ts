import { Model } from 'flexlayout-react';

const defaultLayoutJson = {
  global: {
    tabEnableClose: true,
    tabSetEnableDrop: true,
  },
  borders: [],
  layout: {
    type: 'row',
    weight: 100,
    children: [
      {
        type: 'tabset',
        weight: 100,
        id: 'main_tabset',
        enableDeleteWhenEmpty: false,
        children: [],
      },
    ],
  },
};

export const flexlayoutModel = Model.fromJson(defaultLayoutJson);
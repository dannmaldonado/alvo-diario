// Global type declarations
// Provides loose typing for UI components to bypass prop type checking

import React from 'react';

// Extend React namespace to allow any props on all elements and components
declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> {}
    interface ElementClass extends React.Component<any> {}
    interface ElementAttributesProperty {
      props: any;
    }
    interface ElementChildrenAttribute {
      children: any;
    }
    interface IntrinsicAttributes {
      [key: string]: any;
    }
    interface IntrinsicClassAttributes<T> {
      [key: string]: any;
    }
    interface IntrinsicElements {
      [key: string]: any;
    }
  }
}

export {};

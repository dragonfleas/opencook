/// <reference types="vite/client" />

import React from 'react'

declare global {
  namespace JSX {
    interface Element
      extends React.ReactElement<unknown, string | React.JSXElementConstructor<unknown>> {}
    interface IntrinsicElements extends React.JSX.IntrinsicElements {}
  }
}

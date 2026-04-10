import type { ResolvedComponent } from "@inertiajs/react"
import { createInertiaApp } from "@inertiajs/react"
import createServer from "@inertiajs/react/server"
import { createElement } from "react"
import ReactDOMServer from "react-dom/server"

import PersistentLayout from "@/layouts/persistent-layout"

const appName = import.meta.env.VITE_APP_NAME ?? "Flow"

createServer((page) =>
  createInertiaApp({
    page,
    render: ReactDOMServer.renderToString,
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) => {
      const pages = import.meta.glob<{ default: ResolvedComponent }>(
        "../pages/**/*.tsx",
        {
          eager: true,
        },
      )
      const page = pages[`../pages/${name}.tsx`]
      if (!page) {
        console.error(`Missing Inertia page component: '${name}.tsx'`)
      }

      page.default.layout ??= [PersistentLayout]

      return page
    },

    defaults: {
      form: {
        forceIndicesArrayFormatInFormData: false,
        withAllErrors: true,
      },
    },

    setup: ({ App, props }) => createElement(App, props),
  }),
)

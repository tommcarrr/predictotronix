# shadcn stylesheet

`shadcn-tailwind.css` is an unchanged copy of `dist/tailwind.css` from
`shadcn@4.22.1`, distributed under the accompanying MIT license.

The app uses the stylesheet but not the CLI. Keeping this static asset here
avoids installing the CLI's registry/network dependencies, including the
unpatched `deepmerge` dependency (GHSA-gcqx-w48m-w2h4).

When refreshing it, copy the stylesheet and license from a reviewed shadcn
release and run `npm run verify`. Existing UI components remain in
`src/components/ui`; their styles and APIs are unchanged by this extraction.

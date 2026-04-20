This will be a set of instructions to write clean, maintainable code, according to my preferences

## Avoid large files
I don't want files that are too large. They are hard to read and they are not maintainable. Focus on the SRP (Single Responsibility Principle), where a method (or file) should do one thing.

Especially for the UI parts of the application, I don't want huge .tsx files with the following:

```ts
// User pill
<div>
// ui here
</div>

// bottom actions
<div>
// ui here
</div>
```

This is a clear indication that each one should be its own component.

## Have a lot of small components is key
I would much rather have a set of small UI components that are exported with proper naming and then used in the page.tsx or equivalent. Even if they are to be used only once, readability for me is having small - isolated pieces of code.

## Each component should have its own CSS file
Having a global.css with 1000+ lines of code is impossible to maintain. I want each component to have its own scoped css file

## Prefer named exports over default
This - of course - should not be a hard rule in Next.js, as I know that sometimes default functions are necessary. Also use arrow methods when possible.

## Avoid duplication at all costs
Scan the repository before adding new UI. Does this already exists? If yes, turn the existing code into a reusable component. The goal is to have a nice design system, that every page is using. No free floating <div> or <button> unless necessary.

## Good naming, even in loops
Sometimes, when looping through arrays, naming the variables "x" or "o" or equivalent is convenient, but I don't want it. Readability over saving a few lines of code.

## Avoid nested ternaries
Ternaries in general should be avoided except if they are super explicit. But for the love of God avoid nested ternaries at all costs. Nothing wrong with classic "if statements". The following should be avoided at all costs.

```ts
 const [openGroup, setOpenGroup] = useState<number | null>(
    hasOptions
      ? firstUnfilledRequiredIdx >= 0
        ? firstUnfilledRequiredIdx
        : firstRequiredIdx >= 0
          ? firstRequiredIdx
          : 0
      : null
  );
```

## Top files should be a collection of components
I don't want to see a page.tsx with custom UI - that is an indication that something is off. I want the reusable / one-time components to be well defined, so in the page.tsx, I simply call them. I can allow logic in the page.tsx, because that might be necessary sometimes, but not divs with classnames, etc.
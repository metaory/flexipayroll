# Style Overhaul v4

we have failed again,

lets do another full reset,

## Goals

- Absolute minimum dom layering and nesting or wrappers

- Flat html structure

the minimum dom nesting should be. not more that 2 levels deep.

- Absolute minimum css

- Shared styles

- Styles and Classes shouldnt be tied to feature entities, they should be generic, 
example: instead of having class payment-header we just want header or subheader, in fact for headers we dont want any classes at all, h1, h2 should be enough

remove all styles,

remove all classes that are not absolutely required,

dont inline any styles,

lets be completely unstyled.

remove all classes, for cases that we need class to identify a functionality, we can separate into separate components and target them from the component top level

use more semantic html element tags,

dont worry about styles for now,

just keep the functionality intact without any styles


REMOVE ALL CLASSES

REMOVE ALL STYLES

DONT INLINE ANY STYLE

USE SEMANTIC HTML TAGS

DONT HAVE DEEPLY NESTED HTML

IF NEED CLASSES FOR IDENTIFYING AND FUNCTION THEN BREAK THREM INTO SEPARATE COMPONENTS AND IDENTIFY THEM WITH SEMANTIC HTML TAGS

UPDATE ALL svelte FILES

we want to use sass for styles later, 

keep the sass plugin and pipeline, but dont add any styles for now



## Phase 2

we will do a short style reset


reactive-coffee-debugger
========================

A library for [reactive-coffee] that provides some debugging utilities
for understanding and debugging UI rendered with reactive-coffee.

You can see an example of this in action here: **[debugger example]**

[reactive-coffee]: http://yang.github.io/reactive-coffee/
[debugger example]: http://chungwu.github.io/reactive-coffee-debugger/

Highlights
----------

- Highlights DOM elements that are being re-rendered by _reacting_ to
  cell value changes.
- Debug panel UI to control the highlighting.

Usage
-----

You can install / show the debug panel by:

```coffeescript
rxd.installDebugger()
```

This gives the user interactive control over how the highlights should 
be shown. If you want to programmatically control highlighting, you can 
call these:

```coffeescript
# Toggles highlighting on and off
rxd.setEnabled(true)

# Toggles auto-clearing on and off; when on, highlights will fade after 
# 1 second
rxt.setAutoClear(true)

# Forcibly clear all highlights
rxt.clearHighlights()
```

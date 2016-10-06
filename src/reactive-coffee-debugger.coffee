rxdFactory = (rx, _, $) ->
  rxd = {}

  rxt = rx.rxt
  R = rxt.tags

  enabledCell = rx.cell(false)
  autoClearCell = rx.cell(true)

  nextUid = 0
  mkuid = -> nextUid += 1

  rxd.flashedElements = flashedElements = {}

  AUTO_CLEAR_MS = 1000

  delayed = (ms, fn) -> setTimeout(fn, ms)

  clearFlash = (timestamp) ->
    for uid, info of flashedElements
      if not timestamp? or info.lastAccessed <= timestamp
        info.$cover.remove()
        delete flashedElements[uid]

  makeCover = ($elt) ->
    {left, top} = $elt.offset()
    $cover = R.div {
      class: "rxd-cover"
      style: {
        position: "absolute", zIndex: 1000, textAlign: "right", color: "#444", fontWeight: "strong", fontFamily: "monospace"
        fontSize: "10px", lineHeight: "1em", whiteSpace: "nowrap", pointerEvents: "none"
      }
    }
    $cover.data("$elt", $elt)
    $cover.css("border", "4px solid transparent")
    return $cover

  updateCover = (info) ->
    {$elt, $cover} = info
    {left, top} = $elt.offset()
    $cover.width($elt.outerWidth())
    $cover.height($elt.outerHeight())
    $cover.offset({left: left-4, top: top-4})

    contents = []
    if info.count > 0
      contents.push "#{info.count}x"
    if info.attrs.length > 0
      counts = _.countBy(info.attrs)
      for attr, count of counts
        contents.push "#{attr}" + if count > 1 then "-#{count}x" else ""
    $cover.text(contents.join("; "))

    if info.isBody
      $cover.css("backgroundColor", "rgba(255, 56, 56, #{Math.min(0.8, 0.2 + (info.count/10) * 0.1)}")
    else if info.isArrayChild
      $cover.css("backgroundColor", "rgba(255, 152, 0, #{Math.min(0.8, 0.2 + (info.count/10) * 0.1)}")

    if info.attrs.length > 0
      $cover.css("borderColor", "rgba(63, 81, 181, #{Math.min(0.8, 0.5 + (info.attrs.length / 10) * 0.1)})")      

    if $elt.is(":visible")
      $cover.show()
    else
      $cover.hide()

    info.lastAccessed = new Date().getTime()
      
  lookupFlashInfo = ($elt) ->
    uid = $elt.data("rxdUid")
    if not uid?
      $elt.data("rxdUid", mkuid())
      uid = $elt.data("rxdUid")
    info = flashedElements[uid]
    if not info?
      $cover = makeCover($elt).appendTo($("body"))
      info = {$cover, $elt: $elt, count: 0, attrs: [], isArrayChild: false, isBody: false}
      flashedElements[uid] = info
    return info

  flashChildren = ($elt, isArrayChild) ->
    info = lookupFlashInfo($elt)
    info.count += 1
    info.isBody = info.isBody or not isArrayChild
    info.isArrayChild = info.isArrayChild or isArrayChild
    updateCover(info)

  flashAttrs = ($elt, attr) ->
    info = lookupFlashInfo($elt, "attrs")
    info.attrs.push(attr)
    updateCover(info)

  attrsSubId = null
  childrenSubId = null
  subscribeHandlers = ->
    attrsSubId = rx.autoSub rxt.events.onElementAttrsChanged, ({$element, attr}) ->
      delayed 0, -> flashAttrs($element, attr)

    childrenSubId = rx.autoSub rxt.events.onElementChildrenChanged, ({$element, type, added, removed, updated}) ->
      delayed 0, ->
        if type == "rerendered"
          flashChildren($element, false)
        else if type == "childrenUpdated"
          for e in added ? []
            if e instanceof Element
              flashChildren($(e), true)
          for e in updated ? []
            if e instanceof Element
              flashChildren($(e), false)              

  unsubscribeHandlers = ->
    if attrsSubId?
      rxt.events.onElementAttrsChanged.unsub(attrsSubId)
      attrsSubId = null
    if childrenSubId?
      rxt.events.onElementChildrenChanged.unsub(childrenSubId)
      childrenSubId = null

  rxd.installDebugger = ({}) ->
    rxt.events.enabled = true
    
    $("body").append R.div {
      class: "rxd-debug-panel"
      style: {
        padding: "5px", position: "fixed",
        right: 0, bottom: 0, backgroundColor: "rgba(0, 0, 0, 0.5)", color: "#fff"
        borderTopLeftRadius: "5px", fontSize: "10px"
      }
    }, [
      R.div [
       R.label [
         R.input {
           type: "checkbox"
           checked: enabledCell
           click: ->
             checked = $(@).prop("checked")
             setEnabled(checked)
             $(@).prop("checked", checked)
         }
         " Enable?"
       ]
      ]
      R.div [
       R.label [
         R.input {
           type: "checkbox"
           checked: autoClearCell
           click: ->
             checked = $(@).prop("checked")
             setAutoClear(checked)
             $(@).prop("checked", checked)
         }
         " Auto-clear?"
       ]
      ]      
      R.div [
        R.a {
          href: "#"
          style: {color: "#fff"}
          click: ->
            clearFlash()
            false
        }, "Clear all"
      ]
    ]

  rxd.setEnabled = setEnabled = (enabled) ->
    enabledCell.set(enabled)

  rxd.setAutoClear = setAutoClear = (enabled) ->
    autoClearCell.set(enabled)

  rx.autoSub enabledCell.onSet, ([o, n]) ->
    if n
      subscribeHandlers()
    else
      clearFlash()
      unsubscribeHandlers()    

  autoClearId = null
  rx.autoSub autoClearCell.onSet, ([o, n]) ->
    clearFlash()
    if n
      autoClearId = setInterval(
        (-> clearFlash(new Date().getTime() - AUTO_CLEAR_MS))
        AUTO_CLEAR_MS/2
      )
    else
      clearInterval(autoClearId)
      autoClearId = null
      
  return rxd

do(root = this, factory = rxdFactory) ->
  deps = ['rx', 'underscore']
  if is_browser = typeof(window) != 'undefined'
    deps.push 'jquery'

  if define?.amd?
    define deps, factory
  else if module?.exports?
    $ = if is_browser then require('jquery')
    _ = require 'underscore'
    rx = require 'rx'
    rxd = factory(rx, _, $)
    module.exports = rxd
  else if root._? and root.$? and root.rx?
    root.rxd = factory(root.rx, root._, root.$)
  else
    throw "Dependencies are not met for reactive-coffee-debugger: rx and _ and $ not found"

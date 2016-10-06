(function() {
  var rxdFactory;

  rxdFactory = function(rx, _, $) {
    var AUTO_CLEAR_MS, R, attrsSubId, autoClearCell, childrenSubId, clearFlash, delayed, enabledCell, flashAttrs, flashChildren, flashedElements, lookupFlashInfo, makeCover, mkuid, nextUid, rxd, rxt, setAutoClear, setEnabled, subscribeHandlers, unsubscribeHandlers, updateCover;
    rxd = {};
    rxt = rx.rxt;
    R = rxt.tags;
    enabledCell = rx.cell(false);
    autoClearCell = rx.cell(true);
    nextUid = 0;
    mkuid = function() {
      return nextUid += 1;
    };
    rxd.flashedElements = flashedElements = {};
    AUTO_CLEAR_MS = 1000;
    delayed = function(ms, fn) {
      return setTimeout(fn, ms);
    };
    clearFlash = function() {
      var $cover, x;
      for (x in flashedElements) {
        $cover = flashedElements[x].$cover;
        $cover.remove();
      }
      return flashedElements = {};
    };
    makeCover = function($elt) {
      var $cover, left, top, _ref;
      _ref = $elt.offset(), left = _ref.left, top = _ref.top;
      $cover = R.div({
        "class": "rxd-cover",
        style: {
          position: "absolute",
          zIndex: 1000,
          textAlign: "right",
          color: "#444",
          fontWeight: "strong",
          fontFamily: "monospace",
          fontSize: "10px",
          lineHeight: "1em",
          whiteSpace: "nowrap",
          pointerEvents: "none"
        }
      });
      $cover.data("$elt", $elt);
      $cover.css("border", "4px solid transparent");
      return $cover;
    };
    updateCover = function(info) {
      var $cover, $elt, attr, contents, count, counts, left, top, _ref;
      $elt = info.$elt, $cover = info.$cover;
      _ref = $elt.offset(), left = _ref.left, top = _ref.top;
      $cover.width($elt.outerWidth());
      $cover.height($elt.outerHeight());
      $cover.offset({
        left: left - 4,
        top: top - 4
      });
      contents = [];
      if (info.count > 0) {
        contents.push("" + info.count + "x");
      }
      if (info.attrs.length > 0) {
        counts = _.countBy(info.attrs);
        for (attr in counts) {
          count = counts[attr];
          contents.push(("" + attr) + (count > 1 ? "-" + count + "x" : ""));
        }
      }
      $cover.text(contents.join("; "));
      if (info.isBody) {
        $cover.css("backgroundColor", "rgba(255, 56, 56, " + (Math.min(0.8, 0.2 + (info.count / 10) * 0.1)));
      } else if (info.isArrayChild) {
        $cover.css("backgroundColor", "rgba(255, 152, 0, " + (Math.min(0.8, 0.2 + (info.count / 10) * 0.1)));
      }
      if (info.attrs.length > 0) {
        $cover.css("borderColor", "rgba(63, 81, 181, " + (Math.min(0.8, 0.5 + (info.attrs.length / 10) * 0.1)) + ")");
      }
      if ($elt.is(":visible")) {
        $cover.show();
      } else {
        $cover.hide();
      }
      info.lastAccessed = new Date().getTime();
      return delayed(AUTO_CLEAR_MS, function() {
        if (rx.snap(function() {
          return autoClearCell.get();
        }) && info.lastAccessed <= new Date().getTime() - AUTO_CLEAR_MS) {
          $cover.remove();
          return delete flashedElements[$elt.data("rxdUid")];
        }
      });
    };
    lookupFlashInfo = function($elt) {
      var $cover, info, uid;
      uid = $elt.data("rxdUid");
      if (uid == null) {
        $elt.data("rxdUid", mkuid());
        uid = $elt.data("rxdUid");
      }
      info = flashedElements[uid];
      if (info == null) {
        $cover = makeCover($elt).appendTo($("body"));
        info = {
          $cover: $cover,
          $elt: $elt,
          count: 0,
          attrs: [],
          isArrayChild: false,
          isBody: false
        };
        flashedElements[uid] = info;
      }
      return info;
    };
    flashChildren = function($elt, isArrayChild) {
      var info;
      info = lookupFlashInfo($elt);
      info.count += 1;
      info.isBody = info.isBody || !isArrayChild;
      info.isArrayChild = info.isArrayChild || isArrayChild;
      return updateCover(info);
    };
    flashAttrs = function($elt, attr) {
      var info;
      info = lookupFlashInfo($elt, "attrs");
      info.attrs.push(attr);
      return updateCover(info);
    };
    attrsSubId = null;
    childrenSubId = null;
    subscribeHandlers = function() {
      attrsSubId = rx.autoSub(rxt.events.onElementAttrsChanged, function(_arg) {
        var $element, attr;
        $element = _arg.$element, attr = _arg.attr;
        return delayed(0, function() {
          return flashAttrs($element, attr);
        });
      });
      return childrenSubId = rx.autoSub(rxt.events.onElementChildrenChanged, function(_arg) {
        var $element, added, removed, type, updated;
        $element = _arg.$element, type = _arg.type, added = _arg.added, removed = _arg.removed, updated = _arg.updated;
        return delayed(0, function() {
          var e, _i, _j, _len, _len1, _ref, _ref1, _results;
          if (type === "rerendered") {
            return flashChildren($element, false);
          } else if (type === "childrenUpdated") {
            _ref = added != null ? added : [];
            for (_i = 0, _len = _ref.length; _i < _len; _i++) {
              e = _ref[_i];
              if (e instanceof Element) {
                flashChildren($(e), true);
              }
            }
            _ref1 = updated != null ? updated : [];
            _results = [];
            for (_j = 0, _len1 = _ref1.length; _j < _len1; _j++) {
              e = _ref1[_j];
              if (e instanceof Element) {
                _results.push(flashChildren($(e), false));
              } else {
                _results.push(void 0);
              }
            }
            return _results;
          }
        });
      });
    };
    unsubscribeHandlers = function() {
      if (attrsSubId != null) {
        rxt.events.onElementAttrsChanged.unsub(attrsSubId);
        attrsSubId = null;
      }
      if (childrenSubId != null) {
        rxt.events.onElementChildrenChanged.unsub(childrenSubId);
        return childrenSubId = null;
      }
    };
    rxd.installDebugger = function(_arg) {
      _arg;
      rxt.events.enabled = true;
      return $("body").append(R.div({
        "class": "rxd-debug-panel",
        style: {
          padding: "5px",
          position: "fixed",
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          color: "#fff",
          borderTopLeftRadius: "5px",
          fontSize: "10px"
        }
      }, [
        R.div([
          R.label([
            R.input({
              type: "checkbox",
              checked: enabledCell,
              click: function() {
                var checked;
                checked = $(this).prop("checked");
                setEnabled(checked);
                return $(this).prop("checked", checked);
              }
            }), " Enable?"
          ])
        ]), R.div([
          R.label([
            R.input({
              type: "checkbox",
              checked: autoClearCell,
              click: function() {
                var checked;
                checked = $(this).prop("checked");
                setAutoClear(checked);
                return $(this).prop("checked", checked);
              }
            }), " Auto-clear?"
          ])
        ]), R.div([
          R.a({
            href: "#",
            style: {
              color: "#fff"
            },
            click: function() {
              clearFlash();
              return false;
            }
          }, "Clear all")
        ])
      ]));
    };
    rxd.setEnabled = setEnabled = function(enabled) {
      return enabledCell.set(enabled);
    };
    rxd.setAutoClear = setAutoClear = function(enabled) {
      return autoClearCell.set(enabled);
    };
    rx.autoSub(enabledCell.onSet, function(_arg) {
      var n, o;
      o = _arg[0], n = _arg[1];
      if (n) {
        return subscribeHandlers();
      } else {
        clearFlash();
        return unsubscribeHandlers();
      }
    });
    rx.autoSub(autoClearCell.onSet, function(_arg) {
      var n, o;
      o = _arg[0], n = _arg[1];
      return clearFlash();
    });
    return rxd;
  };

  (function(root, factory) {
    var $, deps, is_browser, rx, rxd, _;
    deps = ['rx', 'underscore'];
    if (is_browser = typeof window !== 'undefined') {
      deps.push('jquery');
    }
    if ((typeof define !== "undefined" && define !== null ? define.amd : void 0) != null) {
      return define(deps, factory);
    } else if ((typeof module !== "undefined" && module !== null ? module.exports : void 0) != null) {
      $ = is_browser ? require('jquery') : void 0;
      _ = require('underscore');
      rx = require('rx');
      rxd = factory(rx, _, $);
      return module.exports = rxd;
    } else if ((root._ != null) && (root.$ != null) && (root.rx != null)) {
      return root.rxd = factory(root.rx, root._, root.$);
    } else {
      throw "Dependencies are not met for reactive-coffee-debugger: rx and _ and $ not found";
    }
  })(this, rxdFactory);

}).call(this);

//# sourceMappingURL=reactive-coffee-debugger.js.map

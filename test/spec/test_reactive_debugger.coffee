{bind, Ev, rxt} = rx

describe 'rxd', ->
  it 'should be loaded', ->
    expect(window.rxd).not.toBe(undefined)
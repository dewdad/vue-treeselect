import Vue from 'vue'
import { mount } from 'avoriaz'
import Treeselect from '@riophae/vue-treeselect/components/Treeselect'
import TreeselectOption from '@riophae/vue-treeselect/components/Option'
import SearchInput from '@riophae/vue-treeselect/components/SearchInput'
import { UNCHECKED, INDETERMINATE, CHECKED } from '@riophae/vue-treeselect/constants'

const BUTTON_LEFT = { button: 0 }
const KEY_BACKSPACE = { which: 8, keyCode: 8 }
const KEY_DELETE = { which: 46, keyCode: 46 }
const KEY_ESCAPE = { which: 27, keyCode: 27 }
const KEY_A = { which: 65, keyCode: 65 }

function sleep(duration) {
  return new Promise(resolve => setTimeout(resolve, duration))
}

// currently avoriaz has a bad support for keyboard event testing
// so here we implement it ourself
function customTrigger(wrapper, eventType, eventData) {
  const event = document.createEvent('Event')
  event.initEvent(eventType, true, true)
  Object.assign(event, eventData)
  wrapper.element.dispatchEvent(event)
  wrapper.update()
}

async function typeSearchText(wrapper, text) {
  // eslint-disable-next-line newline-per-chained-call
  wrapper.first(SearchInput).instance().onInput({
    target: {
      value: text,
    },
  })
  await sleep(300)
  expect(wrapper.vm.searchQuery).toBe(text)
}

describe('Basic', () => {
  describe('nodeMap', () => {
    it('should be able to obtain normalized node by id', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'id',
            label: 'label',
          } ],
        },
      })
      const { vm } = wrapper

      expect(vm.nodeMap).toBeObject()
      expect(Object.getPrototypeOf(vm.nodeMap)).toBe(null)
      expect(vm.nodeMap.id).toBeObject()
    })
  })

  describe('normalized', () => {
    it('shape', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            // branch node
            id: 'a',
            label: 'a',
            children: [ {
              // leaf node
              id: 'aa',
              label: 'aa',
            } ],
          } ],
        },
      })
      const { vm } = wrapper
      const { a, aa } = vm.nodeMap

      expect(vm.nodeMap).toEqual({
        a: jasmine.any(Object),
        aa: jasmine.any(Object),
      })

      expect(a).toEqual({
        id: jasmine.any(String),
        label: jasmine.any(String),
        isLeaf: jasmine.any(Boolean),
        isBranch: jasmine.any(Boolean),
        isRootNode: jasmine.any(Boolean),
        isExpanded: jasmine.any(Boolean),
        isMatched: jasmine.any(Boolean),
        isDisabled: jasmine.any(Boolean),
        isLoaded: jasmine.any(Boolean),
        isPending: jasmine.any(Boolean),
        hasMatchedChild: jasmine.any(Boolean),
        expandsOnSearch: jasmine.any(Boolean),
        parentNode: jasmine.any(Object),
        ancestors: jasmine.any(Array),
        index: jasmine.any(Array),
        children: jasmine.any(Array),
        level: jasmine.any(Number),
        loadingChildrenError: jasmine.any(String),
        count: {
          ALL_CHILDREN: jasmine.any(Number),
          ALL_DESCENDANTS: jasmine.any(Number),
          LEAF_CHILDREN: jasmine.any(Number),
          LEAF_DESCENDANTS: jasmine.any(Number),
        },
        raw: jasmine.any(Object),
      })

      expect(aa).toEqual({
        id: jasmine.any(String),
        label: jasmine.any(String),
        isLeaf: jasmine.any(Boolean),
        isBranch: jasmine.any(Boolean),
        isRootNode: jasmine.any(Boolean),
        isMatched: jasmine.any(Boolean),
        isDisabled: jasmine.any(Boolean),
        parentNode: jasmine.any(Object),
        ancestors: jasmine.any(Array),
        index: jasmine.any(Array),
        level: jasmine.any(Number),
        raw: jasmine.any(Object),
      })
    })

    it('id & label', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
          } ],
        },
      })
      const { vm } = wrapper

      expect(vm.nodeMap.a.id).toBe('a')
      expect(vm.nodeMap.a.label).toBe('a')
    })

    it('isLeaf & isBranch & isLoaded', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            // leaf node
            id: 'a',
            label: 'a',
          }, {
            // branch node with no children
            id: 'b',
            label: 'b',
            children: [],
          }, {
            // unloaded branch node
            id: 'c',
            label: 'c',
            children: null,
          }, {
            // unloaded branch node
            id: 'd',
            label: 'd',
            isBranch: true,
          } ],
          loadChildrenOptions() { /* empty */ },
        },
      })
      const { vm } = wrapper
      const { a, b, c, d } = vm.nodeMap

      expect(a).toEqual(jasmine.objectContaining({
        isLeaf: true,
        isBranch: false,
      }))

      expect(b).toEqual(jasmine.objectContaining({
        isLeaf: false,
        isBranch: true,
        children: [],
        isLoaded: true,
      }))

      expect(c).toEqual(jasmine.objectContaining({
        isLeaf: false,
        isBranch: true,
        children: [],
        isLoaded: false,
      }))

      expect(d).toEqual(jasmine.objectContaining({
        isLeaf: false,
        isBranch: true,
        children: [],
        isLoaded: false,
      }))
    })

    it('isRootNode', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
            } ],
          } ],
        },
      })
      const { vm } = wrapper
      const { a, aa } = vm.nodeMap

      expect(a.isRootNode).toBe(true)
      expect(aa.isRootNode).toBe(false)
    })

    it('parentNode & ancestors & level', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
              children: [ {
                id: 'aaa',
                label: 'aaa',
              } ],
            } ],
          } ],
        },
      })
      const { vm } = wrapper
      const { a, aa, aaa } = vm.nodeMap

      expect(a.parentNode).toBe(null)
      expect(aa.parentNode).toBe(a)
      expect(aaa.parentNode).toBe(aa)

      expect(a.ancestors).toEqual([])
      expect(aa.ancestors).toEqual([ a ])
      expect(aaa.ancestors).toEqual([ a, aa ])

      expect(a.level).toBe(0)
      expect(aa.level).toBe(1)
      expect(aaa.level).toBe(2)
    })

    it('index', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
              children: [ {
                id: 'aaa',
                label: 'aaa',
              } ],
            }, {
              id: 'ab',
              label: 'ab',
            } ],
          }, {
            id: 'b',
            label: 'b',
            children: [ {
              id: 'ba',
              label: 'ba',
            }, {
              id: 'bb',
              label: 'bb',
              children: [ {
                id: 'bba',
                label: 'bba',
              } ],
            } ],
          } ],
        },
      })
      const { vm } = wrapper
      const { a, aa, aaa, ab, b, ba, bb, bba } = vm.nodeMap

      expect(a.index).toEqual([ 0 ])
      expect(aa.index).toEqual([ 0, 0 ])
      expect(aaa.index).toEqual([ 0, 0, 0 ])
      expect(ab.index).toEqual([ 0, 1 ])
      expect(b.index).toEqual([ 1 ])
      expect(ba.index).toEqual([ 1, 0 ])
      expect(bb.index).toEqual([ 1, 1 ])
      expect(bba.index).toEqual([ 1, 1, 0 ])
    })

    it('count', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
              children: [ {
                id: 'aaa',
                label: 'aaa',
              }, {
                id: 'aab',
                label: 'aab',
              } ],
            }, {
              id: 'ab',
              label: 'ab',
            } ],
          }, {
            id: 'b',
            label: 'b',
          } ],
        },
      })
      const { vm } = wrapper
      const { a, b, aa, ab } = vm.nodeMap

      expect(a.count).toEqual({
        ALL_CHILDREN: 2,
        ALL_DESCENDANTS: 4,
        LEAF_CHILDREN: 1,
        LEAF_DESCENDANTS: 3,
      })

      expect(b).not.toHaveMember('count')

      expect(aa.count).toEqual({
        ALL_CHILDREN: 2,
        ALL_DESCENDANTS: 2,
        LEAF_CHILDREN: 2,
        LEAF_DESCENDANTS: 2,
      })

      expect(ab).not.toHaveMember('count')
    })

    it('raw', () => {
      const rawAa = {
        id: 'aa',
        label: 'aa',
      }
      const rawA = {
        id: 'a',
        label: 'a',
        children: [ rawAa ],
      }
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ rawA ],
        },
      })
      const { vm } = wrapper
      const { a, aa } = vm.nodeMap

      expect(a.raw).toBe(rawA)
      expect(aa.raw).toBe(rawAa)
    })
  })

  it('rootOptions', () => {
    const wrapper = mount(Treeselect, {
      propsData: {
        options: [ {
          id: 'a',
          label: 'a',
          children: [ {
            id: 'aa',
            label: 'aa',
          } ],
        }, {
          id: 'b',
          label: 'b',
        } ],
      },
    })
    const { vm } = wrapper
    const { a, b } = vm.nodeMap

    expect(vm.normalizedOptions).toEqual([ a, b ])
    vm.normalizedOptions.forEach(normalized => {
      expect(normalized.isRootNode).toBe(true)
    })
  })

  it('should accept undefined/null', () => {
    [ true, false ].forEach(multiple => {
      [ undefined, null ].forEach(value => {
        const wrapper = mount(Treeselect, {
          propsData: {
            multiple,
            value,
            options: [ {
              id: 'a',
              label: 'a',
              children: [ {
                id: 'aa',
                label: 'aa',
              } ],
            }, {
              id: 'b',
              label: 'b',
            } ],
          },
        })
        const { vm } = wrapper

        expect(vm.internalValue).toBeEmptyArray()
      })
    })
  })

  it('should warn about duplicate node ids', () => {
    spyOn(console, 'error')

    mount(Treeselect, {
      propsData: {
        options: [ {
          id: 'same_id',
          label: 'a',
        }, {
          id: 'same_id',
          label: 'b',
        } ],
      },
    })

    expect(console.error).toHaveBeenCalledWith(
      '[Vue-Treeselect Warning]',
      'Detected duplicate presence of node id "same_id". ' +
        'Their labels are "a" and "b" respectively.'
    )
  })

  it('should rebuild state after swithching from single to multiple', () => {
    const wrapper = mount(Treeselect, {
      propsData: {
        options: [ {
          id: 'a',
          label: 'a',
          children: [ {
            id: 'aa',
            label: 'aa',
          } ],
        } ],
        multiple: false,
        value: [ 'a' ],
      },
    })

    expect(wrapper.data().nodeCheckedStateMap).toBeEmptyObject()
    wrapper.setProps({ multiple: true })
    expect(wrapper.data().nodeCheckedStateMap).toBeNonEmptyObject()
  })

  it('should rebuild state after value changed externally when multiple=true', () => {
    const wrapper = mount(Treeselect, {
      propsData: {
        options: [ {
          id: 'a',
          label: 'a',
          children: [ {
            id: 'aa',
            label: 'aa',
          } ],
        } ],
        multiple: true,
        value: [],
      },
    })

    expect(wrapper.data().nodeCheckedStateMap).toEqual({
      a: 0,
      aa: 0,
    })
    wrapper.setProps({ value: [ 'a' ] })
    expect(wrapper.data().nodeCheckedStateMap).toEqual({
      a: 2,
      aa: 2,
    })
  })

  it('v-model support', async done => {
    // avoriaz doesn't support testing v-model
    // so here we write vanila vue code
    const vm = new Vue({
      components: { Treeselect },
      template: `
        <div>
          <treeselect
            v-model="value"
            :options="options"
            :multiple="true"
          />
        </div>
      `,
      data: {
        value: [],
        options: [ {
          id: 'a',
          label: 'a',
        }, {
          id: 'b',
          label: 'b',
        } ],
      },
    }).$mount()
    const comp = vm.$children[0]

    comp.select(comp.nodeMap.a)
    await comp.$nextTick()
    expect(vm.value).toEqual([ 'a' ])
    comp.select(comp.nodeMap.a)
    await comp.$nextTick()
    expect(vm.value).toEqual([])
    done()
  })
})

describe('Single Select', () => {
  it('basic', () => {
    const wrapper = mount(Treeselect, {
      propsData: {
        multiple: false,
        options: [ {
          id: 'a',
          label: 'a',
          children: [ {
            id: 'aa',
            label: 'aa',
          }, {
            id: 'ab',
            label: 'ab',
          }, {
            id: 'ac',
            label: 'ac',
          } ],
        }, {
          id: 'b',
          label: 'b',
        } ],
      },
    })
    const { vm } = wrapper
    const { a, aa } = vm.nodeMap

    expect(vm.internalValue).toBeEmptyArray()
    vm.select(a) // select one
    expect(vm.internalValue).toEqual([ 'a' ])
    expect(vm.selectedNodeMap).toEqual({ a: true })
    vm.select(aa) // select another
    expect(vm.internalValue).toEqual([ 'aa' ])
    expect(vm.selectedNodeMap).toEqual({ aa: true })
    vm.select(aa) // select again
    expect(vm.internalValue).toEqual([ 'aa' ])
    expect(vm.selectedNodeMap).toEqual({ aa: true })
  })

  it('should blur the input after selecting an option when closeOnSelect=true & searchable=true', () => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        options: [ {
          id: 'a',
          label: 'a',
        } ],
        multiple: false,
        searchable: true,
        closeOnSelect: true,
      },
      data: {
        isOpen: true,
      },
    })
    const labelWrapper = wrapper.first(TreeselectOption).first('.vue-treeselect__label-wrapper')

    customTrigger(labelWrapper, 'mousedown', BUTTON_LEFT)
    expect(wrapper.data()).toEqual(jasmine.objectContaining({
      internalValue: [ 'a' ],
      isFocused: false,
      isOpen: false,
    }))
  })
})

describe('Multi-select', () => {
  let wrapper, vm

  beforeEach(() => {
    wrapper = mount(Treeselect, {
      propsData: {
        multiple: true,
        sortValueBy: 'ORDER_SELECTED',
        options: [ {
          id: 'a',
          label: 'a',
          children: [ {
            id: 'aa',
            label: 'aa',
            children: [ {
              id: 'aaa',
              label: 'aaa',
            }, {
              id: 'aab',
              label: 'aab',
            } ],
          }, {
            id: 'ab',
            label: 'ab',
          } ],
        }, {
          id: 'b',
          label: 'b',
        } ],
      },
    })
    vm = wrapper.vm
  })

  it('case #1', () => {
    // current:
    //   [ ] a <- select
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [ ] b
    // expected result:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [ ] b
    vm.select(vm.nodeMap.a)
    expect(vm.internalValue).toEqual([ 'a' ])
    expect(vm.selectedNodeMap).toEqual({ a: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: CHECKED,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: UNCHECKED,
    })

    // current:
    //   [v] a
    //    |--[v] aa <- deselect
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [ ] b
    // expected result:
    //   [-] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [ ] b
    vm.select(vm.nodeMap.aa)
    expect(vm.internalValue).toEqual([ 'ab' ])
    expect(vm.selectedNodeMap).toEqual({ ab: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: UNCHECKED,
      aaa: UNCHECKED,
      aab: UNCHECKED,
      ab: CHECKED,
      b: UNCHECKED,
    })

    // current:
    //   [-] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [ ] b <- select
    // expected result:
    //   [-] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.b)
    expect(vm.internalValue).toEqual([ 'ab', 'b' ])
    expect(vm.selectedNodeMap).toEqual({ ab: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: UNCHECKED,
      aaa: UNCHECKED,
      aab: UNCHECKED,
      ab: CHECKED,
      b: CHECKED,
    })

    // current:
    //   [-] a
    //    |--[ ] aa <- select again
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [v] b
    // expected result:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.aa)
    expect(vm.internalValue).toEqual([ 'b', 'a' ]) // a should be after b
    expect(vm.selectedNodeMap).toEqual({ a: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: CHECKED,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: CHECKED,
    })

    // current:
    //   [v] a <- deselect
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    // expected result:
    //   [ ] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [v] b
    vm.select(vm.nodeMap.a)
    expect(vm.internalValue).toEqual([ 'b' ])
    expect(vm.selectedNodeMap).toEqual({ b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: UNCHECKED,
      aa: UNCHECKED,
      aaa: UNCHECKED,
      aab: UNCHECKED,
      ab: UNCHECKED,
      b: CHECKED,
    })

    // current:
    //   [ ] a
    //    |--[ ] aa <- select
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [v] b
    // expected result:
    //   [-] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[ ] ab
    //   [v] b
    vm.select(vm.nodeMap.aa)
    expect(vm.internalValue).toEqual([ 'b', 'aa' ])
    expect(vm.selectedNodeMap).toEqual({ aa: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: UNCHECKED,
      b: CHECKED,
    })

    // current:
    //   [ ] a
    //    |--[v] aa <- deselect
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[ ] ab
    //   [v] b
    // expected result:
    //   [ ] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [v] b
    vm.select(vm.nodeMap.aa)
    expect(vm.internalValue).toEqual([ 'b' ])
    expect(vm.selectedNodeMap).toEqual({ b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: UNCHECKED,
      aa: UNCHECKED,
      aaa: UNCHECKED,
      aab: UNCHECKED,
      ab: UNCHECKED,
      b: CHECKED,
    })
  })

  it('case #2', () => {
    // current:
    //   [ ] a <- select
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [ ] b
    // expected result:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [ ] b
    vm.select(vm.nodeMap.a)
    expect(vm.internalValue).toEqual([ 'a' ])
    expect(vm.selectedNodeMap).toEqual({ a: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: CHECKED,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: UNCHECKED,
    })

    // current:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [ ] b <- select
    // expected result:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.b)
    expect(vm.internalValue).toEqual([ 'a', 'b' ])
    expect(vm.selectedNodeMap).toEqual({ a: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: CHECKED,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: CHECKED,
    })

    // current:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa <- deselect
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    // expected result:
    //   [-] a
    //    |--[-] aa
    //    |   |--[ ] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.aaa)
    expect(vm.internalValue).toEqual([ 'b', 'aab', 'ab' ]) // keep order
    expect(vm.selectedNodeMap).toEqual({ aab: true, ab: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: INDETERMINATE,
      aaa: UNCHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: CHECKED,
    })

    // current:
    //   [-] a
    //    |--[-] aa
    //    |   |--[ ] aaa <- select again
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    // expected result:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.aaa)
    expect(vm.internalValue).toEqual([ 'b', 'a' ]) // keep order
    expect(vm.selectedNodeMap).toEqual({ a: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: CHECKED,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: CHECKED,
    })
  })

  it('case #3', () => {
    // current:
    //   [ ] a
    //    |--[ ] aa
    //    |   |--[ ] aaa <- select
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [ ] b
    // expected result:
    //   [-] a
    //    |--[-] aa
    //    |   |--[v] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [ ] b
    vm.select(vm.nodeMap.aaa)
    expect(vm.internalValue).toEqual([ 'aaa' ])
    expect(vm.selectedNodeMap).toEqual({ aaa: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: INDETERMINATE,
      aaa: CHECKED,
      aab: UNCHECKED,
      ab: UNCHECKED,
      b: UNCHECKED,
    })

    // current:
    //   [-] a
    //    |--[-] aa
    //    |   |--[v] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab <- select
    //   [ ] b
    // expected result:
    //   [-] a
    //    |--[-] aa
    //    |   |--[v] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [ ] b
    vm.select(vm.nodeMap.ab)
    expect(vm.internalValue).toEqual([ 'aaa', 'ab' ])
    expect(vm.selectedNodeMap).toEqual({ aaa: true, ab: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: INDETERMINATE,
      aaa: CHECKED,
      aab: UNCHECKED,
      ab: CHECKED,
      b: UNCHECKED,
    })

    // current:
    //   [-] a
    //    |--[-] aa
    //    |   |--[v] aaa
    //    |   |--[ ] aab <- select
    //    |--[v] ab
    //   [ ] b
    // expected result:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [ ] b
    vm.select(vm.nodeMap.aab)
    expect(vm.internalValue).toEqual([ 'a' ])
    expect(vm.selectedNodeMap).toEqual({ a: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: CHECKED,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: UNCHECKED,
    })
  })

  it('case #4', () => {
    // current:
    //   [ ] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab <- select
    //   [ ] b
    // expected result:
    //   [-] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [ ] b
    vm.select(vm.nodeMap.ab)
    expect(vm.internalValue).toEqual([ 'ab' ])
    expect(vm.selectedNodeMap).toEqual({ ab: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: UNCHECKED,
      aaa: UNCHECKED,
      aab: UNCHECKED,
      ab: CHECKED,
      b: UNCHECKED,
    })

    // current:
    //   [-] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [ ] b <- select
    // expected result:
    //   [-] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.b)
    expect(vm.internalValue).toEqual([ 'ab', 'b' ])
    expect(vm.selectedNodeMap).toEqual({ ab: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: UNCHECKED,
      aaa: UNCHECKED,
      aab: UNCHECKED,
      ab: CHECKED,
      b: CHECKED,
    })

    // current:
    //   [-] a
    //    |--[ ] aa
    //    |   |--[ ] aaa
    //    |   |--[ ] aab <- select
    //    |--[v] ab
    //   [v] b
    // expected result:
    //   [-] a
    //    |--[-] aa
    //    |   |--[ ] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.aab)
    expect(vm.internalValue).toEqual([ 'ab', 'b', 'aab' ])
    expect(vm.selectedNodeMap).toEqual({ aab: true, ab: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: INDETERMINATE,
      aaa: UNCHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: CHECKED,
    })

    // current:
    //   [-] a
    //    |--[-] aa
    //    |   |--[ ] aaa <- select
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    // expected result:
    //   [v] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[v] ab
    //   [v] b
    vm.select(vm.nodeMap.aaa)
    expect(vm.internalValue).toEqual([ 'b', 'a' ]) // keep order
    expect(vm.selectedNodeMap).toEqual({ a: true, b: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: CHECKED,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: CHECKED,
      b: CHECKED,
    })
  })

  it('case #5', () => {
    // current:
    //   [ ] a
    //    |--[ ] aa <- select
    //    |   |--[ ] aaa
    //    |   |--[ ] aab
    //    |--[ ] ab
    //   [ ] b
    // expected result:
    //   [-] a
    //    |--[v] aa
    //    |   |--[v] aaa
    //    |   |--[v] aab
    //    |--[ ] ab
    //   [ ] b
    vm.select(vm.nodeMap.aa)
    expect(vm.internalValue).toEqual([ 'aa' ])
    expect(vm.selectedNodeMap).toEqual({ aa: true })
    expect(vm.nodeCheckedStateMap).toEqual({
      a: INDETERMINATE,
      aa: CHECKED,
      aaa: CHECKED,
      aab: CHECKED,
      ab: UNCHECKED,
      b: UNCHECKED,
    })

    vm.select(vm.nodeMap.a)
    expect(vm.internalValue).toEqual([])
    expect(vm.selectedNodeMap).toEqual({})
    expect(vm.nodeCheckedStateMap).toEqual({
      a: UNCHECKED,
      aa: UNCHECKED,
      aaa: UNCHECKED,
      aab: UNCHECKED,
      ab: UNCHECKED,
      b: UNCHECKED,
    })
  })
})

describe('SearchInput', () => {
  it('should disable auto complete', () => {
    const wrapper = mount(Treeselect, {
      propsData: {
        options: [],
      },
    })
    const input = wrapper.first('.vue-treeselect__input')
    expect(input.element.getAttribute('autocomplete')).toBe('off')
  })

  it('should be unable to focus when disabled=true', () => {
    const wrapper = mount(Treeselect, {
      propsData: {
        options: [],
        autofocus: false,
        searchable: true,
        disabled: true,
      },
    })

    expect(wrapper.vm.isFocused).toBe(false)
    wrapper.vm.focusInput()
    expect(wrapper.vm.isFocused).toBe(false)
  })
})

describe('Control', () => {
  it('should toggle the menu when arrow is clicked', () => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        options: [],
      },
    })
    const arrow = wrapper.first('.vue-treeselect__arrow-wrapper')

    customTrigger(arrow, 'mousedown', BUTTON_LEFT)
    expect(wrapper.vm.isOpen).toBe(true)
    customTrigger(arrow, 'mousedown', BUTTON_LEFT)
    expect(wrapper.vm.isOpen).toBe(false)
  })
})

describe('Menu', () => {
  it('should blur the input & close the menu after clicking anywhere outside the component', async done => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        options: [],
      },
    })

    wrapper.vm.openMenu()
    await sleep(100) // wait for the event binding to take effect
    const event = document.createEvent('event')
    event.initEvent('mousedown', true, true)
    document.body.dispatchEvent(event)
    expect(wrapper.data()).toEqual(jasmine.objectContaining({
      isFocused: false,
      isOpen: false,
    }))
    done()
  })

  it('should open the menu after clicking the control when focused', () => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        options: [],
      },
      data: {
        isFocused: true,
      },
    })
    const valueWrapper = wrapper.first('.vue-treeselect__value-wrapper')

    customTrigger(valueWrapper, 'mousedown', BUTTON_LEFT)
    expect(wrapper.vm.isOpen).toBe(true)
  })

  it('should close the menu after clicking inside the value wrapper when isOpen=true and searchable=false', () => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        options: [ {
          id: 'a',
          label: 'a',
        } ],
        multiple: false,
        searchable: false,
      },
      data: {
        isOpen: true,
        isFocused: true,
      },
    })

    wrapper.vm.openMenu()
    const value = wrapper.first('.vue-treeselect__value-wrapper')
    customTrigger(value, 'mousedown', BUTTON_LEFT)
    expect(wrapper.vm.isOpen).toBe(false)
  })

  it('should not close the menu after clicking a value remove button when multiple=true & searchable=false', () => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        multiple: true,
        options: [ {
          id: 'a',
          label: 'a',
        }, {
          id: 'b',
          label: 'b',
        } ],
        value: [ 'a', 'b' ],
      },
      data: {
        isOpen: true,
      },
    })

    const [ firstRemove, secondRemove ] = wrapper.find('.vue-treeselect__value-remove')

    customTrigger(firstRemove, 'mousedown', BUTTON_LEFT)
    expect(wrapper.data()).toEqual(jasmine.objectContaining({
      isOpen: true,
      internalValue: [ 'b' ],
    }))

    customTrigger(secondRemove, 'mousedown', BUTTON_LEFT)
    expect(wrapper.data()).toEqual(jasmine.objectContaining({
      isOpen: true,
      internalValue: [],
    }))
  })

  it('click on option arrow should toggle expanded', () => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        options: [ {
          id: 'a',
          label: 'a',
          children: [],
        } ],
      },
      data: {
        isOpen: true,
      },
    })
    const { a } = wrapper.vm.nodeMap

    expect(a.isExpanded).toBe(false)
    const option = wrapper.first(TreeselectOption)
    const optionArrow = option.first('.vue-treeselect__option-arrow-wrapper')
    customTrigger(optionArrow, 'mousedown', BUTTON_LEFT)
    expect(a.isExpanded).toBe(true)
    customTrigger(optionArrow, 'mousedown', BUTTON_LEFT)
    expect(a.isExpanded).toBe(false)
  })
})

describe('Keyboard Support', () => {
  function queryInput(wrapper) {
    return wrapper.first('input[type="text"]')
  }

  describe('backspace key', () => {
    let wrapper, input

    beforeEach(() => {
      wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
          }, {
            id: 'b',
            label: 'b',
          } ],
          multiple: true,
          backspaceRemoves: true,
          value: [ 'a', 'b' ],
        },
      })
      input = queryInput(wrapper)

      expect(wrapper.vm.searchQuery).toBe('')
      expect(wrapper.vm.internalValue).toEqual([ 'a', 'b' ])
    })

    it('should remove the last value if search input is empty', () => {
      customTrigger(input, 'keydown', KEY_BACKSPACE)
      expect(wrapper.vm.internalValue).toEqual([ 'a' ])
      customTrigger(input, 'keydown', KEY_BACKSPACE)
      expect(wrapper.vm.internalValue).toEqual([])
    })

    it('should do nothing if search input has value', async done => {
      await typeSearchText(wrapper, 'test')
      expect(wrapper.vm.searchQuery).toBe('test')
      customTrigger(input, 'keydown', KEY_BACKSPACE)
      expect(wrapper.vm.internalValue).toEqual([ 'a', 'b' ])
      done()
    })

    it('should do nothing when backspaceRemoves=false', () => {
      wrapper.setProps({ backspaceRemoves: false })
      customTrigger(input, 'keydown', KEY_BACKSPACE)
      expect(wrapper.vm.internalValue).toEqual([ 'a', 'b' ])
    })
  })

  describe('delete key', () => {
    let wrapper, input

    beforeEach(() => {
      wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
          }, {
            id: 'b',
            label: 'b',
          } ],
          multiple: true,
          deleteRemoves: true,
          value: [ 'a', 'b' ],
        },
      })
      input = queryInput(wrapper)

      expect(wrapper.vm.searchQuery).toBe('')
      expect(wrapper.vm.internalValue).toEqual([ 'a', 'b' ])
    })

    it('should remove the last value if search input is empty', () => {
      customTrigger(input, 'keydown', KEY_DELETE)
      expect(wrapper.vm.internalValue).toEqual([ 'a' ])
      customTrigger(input, 'keydown', KEY_DELETE)
      expect(wrapper.vm.internalValue).toEqual([])
    })

    it('should do nothing if search input has value', async done => {
      await typeSearchText(wrapper, 'test')
      expect(wrapper.vm.searchQuery).toBe('test')
      customTrigger(input, 'keydown', KEY_DELETE)
      expect(wrapper.vm.internalValue).toEqual([ 'a', 'b' ])
      done()
    })

    it('should do nothing when backspaceRemoves=false', () => {
      wrapper.setProps({ deleteRemoves: false })
      customTrigger(input, 'keydown', KEY_DELETE)
      expect(wrapper.vm.internalValue).toEqual([ 'a', 'b' ])
    })
  })

  describe('escape key', () => {
    let wrapper, input

    beforeEach(() => {
      wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
          }, {
            id: 'b',
            label: 'b',
          } ],
          multiple: true,
          escapeClearsValue: true,
          value: [ 'a', 'b' ],
        },
      })
      input = queryInput(wrapper)
    })

    it('should reset search query if input has value', async done => {
      await typeSearchText(wrapper, 'test')
      customTrigger(input, 'keydown', KEY_ESCAPE)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        searchQuery: '',
        internalValue: [ 'a', 'b' ],
      }))
      done()
    })

    it('should close the menu if input is empty', () => {
      wrapper.vm.openMenu()
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        searchQuery: '',
        internalValue: [ 'a', 'b' ],
      }))
      customTrigger(input, 'keydown', KEY_ESCAPE)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        searchQuery: '',
        internalValue: [ 'a', 'b' ],
        isOpen: false,
      }))
    })

    it('should reset value if menu is closed', () => {
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        searchQuery: '',
        internalValue: [ 'a', 'b' ],
        isOpen: false,
      }))
      customTrigger(input, 'keydown', KEY_ESCAPE)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        searchQuery: '',
        internalValue: [],
        isOpen: false,
      }))
    })

    it('should not reset value when escapeClearsValue=false', () => {
      wrapper.setProps({ escapeClearsValue: false })
      customTrigger(input, 'keydown', KEY_ESCAPE)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        searchQuery: '',
        internalValue: [ 'a', 'b' ],
        isOpen: false,
      }))
    })
  })

  it('should ignore any key press combined with modifier key', () => {
    [ 'ctrlKey', 'shiftKey', 'metaKey', 'altKey' ].forEach(modifierKey => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
          } ],
          multiple: true,
          escapeClearsValue: true,
          value: [ 'a' ],
        },
      })
      const input = queryInput(wrapper)

      customTrigger(input, 'keydown', { ...KEY_ESCAPE, [modifierKey]: true })
      expect(wrapper.vm.internalValue).toEqual([ 'a' ])
    })
  })

  it('any other key press should activate menu', () => {
    const wrapper = mount(Treeselect, {
      propsData: {
        options: [],
      },
    })
    const input = queryInput(wrapper)

    expect(wrapper.vm.isOpen).toBe(false)
    customTrigger(input, 'keydown', KEY_A)
    expect(wrapper.vm.isOpen).toBe(true)
  })
})

describe('Props', () => {
  describe('autofocus', () => {
    it('should focus the search input on mount', () => {
      const wrapper = mount(Treeselect, {
        attachToDocument: true,
        propsData: {
          options: [],
          autofocus: true,
          searchable: true,
        },
      })
      const input = wrapper.first('.vue-treeselect__input').element
      expect(document.activeElement).toBe(input)
    })
  })

  describe('branchNodesFirst', () => {
    it('should place branch nodes ahead of leaf nodes when branchNodesFirst = true', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          branchNodesFirst: true,
          options: [ {
            id: 'a',
            label: 'a',
          }, {
            id: 'b',
            label: 'b',
            children: [ {
              id: 'ba',
              label: 'ba',
            }, {
              id: 'bb',
              label: 'bb',
              children: [ {
                id: 'bba',
                label: 'bba',
              } ],
            }, {
              id: 'bc',
              label: 'bc',
            } ],
          }, {
            id: 'c',
            label: 'c',
          } ],
        },
      })
      const { vm } = wrapper

      expect(vm.normalizedOptions.map(node => node.id)).toEqual([ 'b', 'a', 'c' ])
      expect(vm.nodeMap.b.children.map(node => node.id)).toEqual([ 'bb', 'ba', 'bc' ])
    })
  })

  describe('clearable', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(Treeselect, {
        propsData: {
          multiple: false,
          clearable: true,
          options: [ { id: 'a', label: 'a' } ],
          value: 'a',
        },
      })
    })

    it('should show "×" icon', () => {
      expect(wrapper.contains('.vue-treeselect__clear')).toBe(true)
    })

    it('should reset value on mousedown', () => {
      expect(wrapper.vm.internalValue).toEqual([ 'a' ])
      customTrigger(wrapper.first('.vue-treeselect__clear'), 'mousedown', BUTTON_LEFT)
      expect(wrapper.vm.internalValue).toEqual([])
    })

    it('should hide when no options selected', () => {
      wrapper.vm.clear()
      wrapper.update()
      expect(wrapper.contains('.vue-treeselect__clear')).toBe(false)
    })

    it('should hide when disabled=true', () => {
      wrapper.setProps({ disabled: true })
      expect(wrapper.contains('.vue-treeselect__clear')).toBe(false)
    })

    it('should hide when clearable=false', () => {
      wrapper.setProps({ clearable: false })
      expect(wrapper.contains('.vue-treeselect__clear')).toBe(false)
    })
  })

  describe('clearAllText', () => {
    it('should be the title of "×" icon when multiple=true', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          clearable: true,
          multiple: true,
          clearAllText: '$MULTI_TITLE$',
          options: [ { id: 'a', label: 'a' } ],
          value: [ 'a' ],
        },
      })

      expect(wrapper.first('.vue-treeselect__clear').getAttribute('title')).toBe('$MULTI_TITLE$')
    })
  })

  describe('clearOnSelect', () => {
    describe('when multiple=false', () => {
      it('clears the input after selecting when clearOnSelect=true', () => {
        const wrapper = mount(Treeselect, {
          propsData: {
            clearOnSelect: true,
            multiple: false,
            options: [ { id: 'a', label: 'a' } ],
          },
          data: {
            searching: true,
            searchQuery: '$SEARCH_QUERY$',
          },
        })
        const { vm } = wrapper

        vm.select(vm.nodeMap.a)
        wrapper.update()
        expect(vm.searchQuery).toBe('')
      })

      it('still clears the input after selecting even if clearOnSelect!=true', () => {
        const wrapper = mount(Treeselect, {
          propsData: {
            clearOnSelect: false,
            multiple: false,
            options: [ { id: 'a', label: 'a' } ],
          },
          data: {
            searching: true,
            searchQuery: '$SEARCH_QUERY$',
          },
        })
        const { vm } = wrapper

        vm.select(vm.nodeMap.a)
        wrapper.update()
        expect(vm.searchQuery).toBe('')
      })
    })

    describe('when multiple=true', () => {
      it('clears the input after selecting when clearOnSelect=true', () => {
        const wrapper = mount(Treeselect, {
          propsData: {
            clearOnSelect: true,
            multiple: true,
            options: [ { id: 'a', label: 'a' } ],
          },
          data: {
            searching: true,
            searchQuery: '$SEARCH_QUERY$',
          },
        })
        const { vm } = wrapper

        vm.select(vm.nodeMap.a)
        wrapper.update()
        expect(vm.searchQuery).toBe('')
      })

      it("won't clear the input after selecting when clearOnSelect!=true", () => {
        const wrapper = mount(Treeselect, {
          propsData: {
            clearOnSelect: false,
            multiple: true,
            options: [ { id: 'a', label: 'a' } ],
          },
          data: {
            searching: true,
            searchQuery: '$SEARCH_QUERY$',
          },
        })
        const { vm } = wrapper

        vm.select(vm.nodeMap.a)
        wrapper.update()
        expect(vm.searchQuery).toBe('$SEARCH_QUERY$')
      })
    })
  })

  describe('clearValueText', () => {
    it('should be the title of "×" icon when multiple=false', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          clearable: true,
          multiple: false,
          clearValueText: '$SINGLE_TITLE$',
          options: [ { id: 'a', label: 'a' } ],
          value: 'a',
        },
      })

      expect(wrapper.first('.vue-treeselect__clear').getAttribute('title')).toBe('$SINGLE_TITLE$')
    })
  })

  describe('closeOnSelect', () => {
    it('closes the menu after selecting when closeOnSelect=true', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          closeOnSelect: true,
          multiple: false,
          options: [ { id: 'a', label: 'a' } ],
        },
        data: {
          isOpen: true,
        },
      })
      const labelWrapper = wrapper.first('.vue-treeselect__label-wrapper')

      customTrigger(labelWrapper, 'mousedown', BUTTON_LEFT)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        internalValue: [ 'a' ],
        isOpen: false,
      }))
    })

    it('keeps the menu open after selecting when closeOnSelect=false', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          closeOnSelect: false,
          multiple: false,
          searchable: true,
          options: [ { id: 'a', label: 'a' } ],
        },
        data: {
          isOpen: true,
        },
      })
      const labelWrapper = wrapper.first('.vue-treeselect__label-wrapper')

      customTrigger(labelWrapper, 'mousedown', BUTTON_LEFT)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        internalValue: [ 'a' ],
        isOpen: true,
        isFocused: false, // auto blur
      }))
    })
  })

  describe('disableBranchNodes', () => {
    it('when multiple=false & disableBranchNodes=false', () => {
      const wrapper = mount(Treeselect, {
        attachToDocument: true,
        propsData: {
          disableBranchNodes: false,
          closeOnSelect: true,
          multiple: false,
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
            } ],
          } ],
        },
        data: {
          isOpen: true,
        },
      })
      const { vm } = wrapper
      const optionA = wrapper.first(TreeselectOption)
      const labelWrapperOfOptionA = optionA.first('.vue-treeselect__label-wrapper')

      expect(optionA.vm.node.id).toBe('a')
      expect(vm.nodeMap.a.isExpanded).toBe(false)
      expect(vm.isSelected(vm.nodeMap.a)).toBe(false)

      customTrigger(labelWrapperOfOptionA, 'mousedown', BUTTON_LEFT)
      expect(vm.isOpen).toBe(false)
      expect(vm.nodeMap.a.isExpanded).toBe(false)
      expect(vm.isSelected(vm.nodeMap.a)).toBe(true)
    })

    it('when multiple=false & disableBranchNodes=true', () => {
      const wrapper = mount(Treeselect, {
        attachToDocument: true,
        propsData: {
          disableBranchNodes: true,
          closeOnSelect: true,
          multiple: false,
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
            } ],
          } ],
        },
        data: {
          isOpen: true,
        },
      })
      const { vm } = wrapper
      const optionA = wrapper.first(TreeselectOption)
      const labelWrapperOfOptionA = optionA.first('.vue-treeselect__label-wrapper')

      expect(optionA.vm.node.id).toBe('a')
      expect(vm.nodeMap.a.isExpanded).toBe(false)
      expect(vm.isSelected(vm.nodeMap.a)).toBe(false)

      customTrigger(labelWrapperOfOptionA, 'mousedown', BUTTON_LEFT)
      expect(vm.isOpen).toBe(true)
      expect(vm.nodeMap.a.isExpanded).toBe(true)
      expect(vm.isSelected(vm.nodeMap.a)).toBe(false)

      customTrigger(labelWrapperOfOptionA, 'mousedown', BUTTON_LEFT)
      expect(vm.isOpen).toBe(true)
      expect(vm.nodeMap.a.isExpanded).toBe(false)
      expect(vm.isSelected(vm.nodeMap.a)).toBe(false)
    })

    it('when multiple=true & disableBranchNodes=false', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          disableBranchNodes: false,
          multiple: true,
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
            } ],
          } ],
        },
        data: {
          isOpen: true,
        },
      })
      const optionA = wrapper.first(TreeselectOption)
      const labelWrapperOfOptionA = optionA.first('.vue-treeselect__label-wrapper')

      expect(labelWrapperOfOptionA.contains('.vue-treeselect__checkbox')).toBe(true)
    })

    it('when multiple=true & disableBranchNodes=true', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          disableBranchNodes: true,
          multiple: true,
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
            } ],
          } ],
        },
        data: {
          isOpen: true,
        },
      })
      const optionA = wrapper.first(TreeselectOption)
      const labelWrapperOfOptionA = optionA.first('.vue-treeselect__label-wrapper')

      expect(labelWrapperOfOptionA.contains('.vue-treeselect__checkbox')).toBe(false)
    })
  })

  describe('openOnClick', () => {
    it('when openOnClick=false', () => {
      const wrapper = mount(Treeselect, {
        attachToDocument: true,
        propsData: {
          options: [],
          openOnClick: false,
        },
      })
      const valueWrapper = wrapper.first('.vue-treeselect__value-wrapper')

      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: false,
        isOpen: false,
      }))

      customTrigger(valueWrapper, 'mousedown', BUTTON_LEFT)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: true,
        isOpen: false,
      }))

      customTrigger(valueWrapper, 'mousedown', BUTTON_LEFT)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: true,
        isOpen: true,
      }))
    })

    it('when openOnClick=true', () => {
      const wrapper = mount(Treeselect, {
        attachToDocument: true,
        propsData: {
          options: [],
          openOnClick: true,
        },
      })
      const valueWrapper = wrapper.first('.vue-treeselect__value-wrapper')

      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: false,
        isOpen: false,
      }))

      customTrigger(valueWrapper, 'mousedown', BUTTON_LEFT)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: true,
        isOpen: true,
      }))
    })
  })

  describe('openOnFocus', () => {
    it('when openOnFocus=false', () => {
      const wrapper = mount(Treeselect, {
        attachToDocument: true,
        propsData: {
          options: [],
          openOnFocus: false,
        },
      })
      const valueWrapper = wrapper.first('.vue-treeselect__value-wrapper')

      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: false,
        isOpen: false,
      }))

      wrapper.vm.focusInput()
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: true,
        isOpen: false,
      }))

      customTrigger(valueWrapper, 'mousedown', BUTTON_LEFT)
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: true,
        isOpen: true,
      }))
    })

    it('when openOnFocus=true', () => {
      const wrapper = mount(Treeselect, {
        attachToDocument: true,
        propsData: {
          options: [],
          openOnFocus: true,
        },
      })

      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: false,
        isOpen: false,
      }))

      wrapper.vm.focusInput()
      expect(wrapper.data()).toEqual(jasmine.objectContaining({
        isFocused: true,
        isOpen: true,
      }))
    })

    describe('combined with autofocus', () => {
      it('when openOnFocus=false', () => {
        const wrapper = mount(Treeselect, {
          attachToDocument: true,
          propsData: {
            options: [],
            autofocus: true,
            openOnFocus: false,
          },
        })

        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          isFocused: true,
          isOpen: false,
        }))
      })

      it('when openOnFocus=true', () => {
        const wrapper = mount(Treeselect, {
          attachToDocument: true,
          propsData: {
            options: [],
            autofocus: true,
            openOnFocus: true,
          },
        })

        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          isFocused: true,
          isOpen: true,
        }))
      })
    })
  })

  describe('options', () => {
    it('show tip when `options` is an empty array', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [],
        },
        data: {
          isOpen: true,
        },
      })

      const menu = wrapper.first('.vue-treeselect__menu')
      const noOptionsTip = menu.first('.vue-treeselect__no-options-tip')
      expect(noOptionsTip.text().trim()).toBe('No options available.')
    })
  })

  describe('defaultExpandLevel', () => {
    it('when defaultExpandLevel=0', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [],
          } ],
          defaultExpandLevel: 0,
        },
      })
      const { vm } = wrapper
      const { a } = vm.nodeMap

      expect(a.isExpanded).toBe(false)
    })

    it('when defaultExpandLevel=1', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
              children: [],
            } ],
          } ],
          defaultExpandLevel: 1,
        },
      })
      const { vm } = wrapper
      const { a, aa } = vm.nodeMap

      expect(a.isExpanded).toBe(true)
      expect(aa.isExpanded).toBe(false)
    })

    it('when defaultExpandLevel=Infinity', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
              children: [],
            } ],
          } ],
          defaultExpandLevel: Infinity,
        },
      })
      const { vm } = wrapper
      const { a, aa } = vm.nodeMap

      expect(a.isExpanded).toBe(true)
      expect(aa.isExpanded).toBe(true)
    })
  })

  it('should request children options loading when expanded', () => {
    // TODO: 需要考虑服务端渲染的情况
    const loadChildrenOptions = jasmine.createSpy('loadChildrenOptions')
    const wrapper = mount(Treeselect, {
      propsData: {
        options: [ {
          id: 'a',
          label: 'a',
          children: null,
        }, {
          id: 'b',
          label: 'b',
          children: [ {
            id: 'bb',
            label: 'bb',
            children: null,
          } ],
        } ],
        defaultExpandLevel: 1,
        loadChildrenOptions,
      },
    })
    const { vm } = wrapper
    const { a } = vm.nodeMap

    expect(loadChildrenOptions.calls.count()).toBe(1)
    expect(loadChildrenOptions.calls.first().args[0]).toBe(a.raw)
    expect(loadChildrenOptions.calls.first().args[1]).toEqual(jasmine.any(Function))
  })

  describe('disabled', () => {
    it('when disabled=false', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [],
          searchable: true,
          disabled: false,
        },
      })

      expect(wrapper.contains('.vue-treeselect__input-wrapper')).toBe(true)
      expect(wrapper.contains('.vue-treeselect__input')).toBe(true)
    })

    describe('when disabled=true', () => {
      it('should hide the input but keep the input wrapper', () => {
        const wrapper = mount(Treeselect, {
          propsData: {
            options: [],
            searchable: true,
            disabled: true,
          },
        })

        expect(wrapper.contains('.vue-treeselect__input-wrapper')).toBe(true)
        expect(wrapper.contains('.vue-treeselect__input')).toBe(false)
      })

      it('should close the menu when setting disabled from false to true', () => {
        const wrapper = mount(Treeselect, {
          propsData: {
            options: [],
            disabled: false,
          },
        })

        wrapper.vm.openMenu()
        expect(wrapper.vm.isOpen).toBe(true)
        wrapper.setProps({ disabled: true })
        expect(wrapper.vm.isOpen).toBe(false)
      })

      it('the control should reject all clicks', () => {
        const wrapper = mount(Treeselect, {
          attachToDocument: true,
          propsData: {
            options: [],
            disabled: true,
          },
        })
        const valueWrapper = wrapper.first('.vue-treeselect__value-wrapper')

        customTrigger(valueWrapper, 'mousedown', BUTTON_LEFT)
        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          isFocused: false,
          isOpen: false,
        }))
      })

      it('the control should be non-focusable', () => {
        const wrapper = mount(Treeselect, {
          attachToDocument: true,
          propsData: {
            options: [],
            disabled: true,
          },
        })

        wrapper.vm.focusInput()
        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          isFocused: false,
        }))
      })

      it('should be uanble to open the menu', () => {
        const wrapper = mount(Treeselect, {
          propsData: {
            options: [],
            disabled: true,
          },
        })

        wrapper.vm.openMenu()
        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          isOpen: false,
        }))
      })
    })
  })

  describe('tabIndex', () => {
    it('when disabled=false & searchable=true', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [],
          searchable: true,
          disabled: false,
        },
      })

      const $inputWrapper = wrapper.first('.vue-treeselect__input-wrapper')
      const $input = wrapper.first('.vue-treeselect__input')
      expect($inputWrapper.hasAttribute('tabindex')).toBe(false)
      expect($input.hasAttribute('tabindex')).toBe(true)
    })

    it('when disabled=false & searchable=false', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [],
          searchable: false,
          disabled: false,
        },
      })

      const $inputWrapper = wrapper.first('.vue-treeselect__input-wrapper')
      expect($inputWrapper.hasAttribute('tabindex')).toBe(true)
    })

    it('when disabled=true', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [],
          disabled: true,
        },
      })

      const $inputWrapper = wrapper.first('.vue-treeselect__input-wrapper')
      expect($inputWrapper.hasAttribute('tabindex')).toBe(false)
    })

    it('customized value', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [],
          searchable: true,
          disabled: false,
          tabIndex: 1,
        },
      })

      const $input = wrapper.first('.vue-treeselect__input')
      expect($input.getAttribute('tabindex')).toBe('1')
    })
  })

  describe('limit', () => {
    it('when limit=Infinity', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          multiple: true,
          limit: Infinity,
          value: [ 'a', 'b', 'c', 'd' ],
          options: [ {
            id: 'a',
            label: 'a',
          }, {
            id: 'b',
            label: 'b',
          }, {
            id: 'c',
            label: 'c',
          }, {
            id: 'd',
            label: 'd',
          } ],
        },
      })
      const { vm } = wrapper
      const { a, b, c, d } = vm.nodeMap

      expect(vm.internalValue).toEqual([ 'a', 'b', 'c', 'd' ])
      expect(vm.visibleValue).toEqual([ a, b, c, d ])
      expect(wrapper.find('.vue-treeselect__multi-value-item').length).toBe(4)
      expect(wrapper.contains('.vue-treeselect__limit-tip')).toBe(false)
    })

    it('when limit=1', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          multiple: true,
          limit: 1,
          value: [ 'a', 'b', 'c', 'd' ],
          options: [ {
            id: 'a',
            label: 'a',
          }, {
            id: 'b',
            label: 'b',
          }, {
            id: 'c',
            label: 'c',
          }, {
            id: 'd',
            label: 'd',
          } ],
        },
      })
      const { vm } = wrapper
      const { a } = vm.nodeMap

      expect(vm.internalValue).toEqual([ 'a', 'b', 'c', 'd' ])
      expect(vm.visibleValue).toEqual([ a ])
      expect(wrapper.find('.vue-treeselect__multi-value-item').length).toBe(1)
      expect(wrapper.contains('.vue-treeselect__limit-tip')).toBe(true)
      expect(wrapper.first('.vue-treeselect__limit-tip').text()).toBe('and 3 more')
    })
  })

  describe('loadChildrenOptions', () => {
    it('should call loadChildrenOptions() to load children options when expanding an unloaded branch node', async done => {
      const loadChildrenOptions = jasmine.createSpy('loadChildrenOptions').and.callFake((parentNode, callback) => {
        expect(parentNode).toBe(a.raw)
        expect(callback).toBeFunction()
        expect(a.isPending).toBe(true)
        expect(a.isLoaded).toBe(false)
        const children = [ {
          id: 'aa',
          label: 'aa',
        } ]
        callback(null, children)
        expect(a.isPending).toBe(false)
        expect(a.isLoaded).toBe(true)
        expect(a.children.map(child => child.raw)).toEqual(children)
      })
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: null, // declare an unloaded branch node
          } ],
          loadChildrenOptions,
        },
        data: {
          // it only auto loads children options when the option has been rendered to the DOM
          // so the menu must be open
          isOpen: true,
        },
      })
      const { vm } = wrapper
      const { a } = vm.nodeMap

      vm.toggleExpanded(a)
      await sleep(100)
      expect(loadChildrenOptions).toHaveBeenCalled()
      done()
    })

    it('should accept empty results', async done => {
      const loadChildrenOptions = jasmine.createSpy('loadChildrenOptions').and.callFake((parentNode, callback) => {
        expect(a.isPending).toBe(true)
        expect(a.isLoaded).toBe(false)
        callback(null, [])
        expect(a.isPending).toBe(false)
        expect(a.isLoaded).toBe(true)
      })
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: null,
          } ],
          loadChildrenOptions,
        },
        data: {
          isOpen: true,
        },
      })
      const { vm } = wrapper
      const { a } = vm.nodeMap

      vm.toggleExpanded(a)
      await sleep(100)
      expect(loadChildrenOptions).toHaveBeenCalled()
      done()
    })

    it('should be able to handle loading error', async done => {
      const loadChildrenOptions = jasmine.createSpy('loadChildrenOptions').and.callFake((parentNode, callback) => {
        expect(a.isPending).toBe(true)
        expect(a.isLoaded).toBe(false)
        const error = new Error('$ERROR$')
        callback(error)
        expect(a.isPending).toBe(false)
        expect(a.isLoaded).toBe(false)
        expect(a.loadingChildrenError).toBe(`Failed to load children options: ${error.message}.`)
      })
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: null,
          } ],
          loadChildrenOptions,
        },
        data: {
          isOpen: true,
        },
      })
      const { vm } = wrapper
      const { a } = vm.nodeMap

      vm.toggleExpanded(a)
      await sleep(100)
      expect(loadChildrenOptions).toHaveBeenCalled()
      done()
    })

    it('should be able to recover from loading error', async done => {
      let c = 0
      const loadChildrenOptions = jasmine.createSpy('loadChildrenOptions').and.callFake((parentNode, callback) => {
        if (c === 0) {
          const error = new Error('$ERROR$')
          callback(error)
          expect(a.loadingChildrenError).toBe(`Failed to load children options: ${error.message}.`)
        } else if (c === 1) {
          expect(a.isPending).toBe(true)
          expect(a.isLoaded).toBe(false)
          callback(null, [ {
            id: 'aa',
            label: 'aa',
          } ])
          expect(a.isPending).toBe(false)
          expect(a.isLoaded).toBe(true)
          expect(a.children).toBeNonEmptyArray()
          expect(a.loadingChildrenError).toBe('')
        } else {
          throw new Error('unknown error')
        }

        c++
      })
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: null,
          } ],
          loadChildrenOptions,
        },
        data: {
          isOpen: true,
        },
      })
      const { vm } = wrapper
      const { a } = vm.nodeMap

      // expand
      vm.toggleExpanded(a)
      await sleep(100)
      expect(loadChildrenOptions.calls.count()).toBe(1)

      // collapse
      vm.toggleExpanded(a)
      await sleep(100)

      // expand again
      vm.toggleExpanded(a)
      await sleep(100)
      expect(loadChildrenOptions.calls.count()).toBe(2)

      done()
    })

    it('should warn about the absent of `loadChildrenOptions` prop when unloaded branch node detected', () => {
      spyOn(console, 'error')

      mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'id',
            label: 'label',
            children: null,
          } ],
        },
      })

      expect(console.error).toHaveBeenCalledWith(
        '[Vue-Treeselect Warning]',
        'Unloaded branch node detected. `loadChildrenOptions` prop is required to load its children.',
      )
    })

    it('shoud error if data is not array', async done => {
      spyOn(console, 'error')

      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: null,
          } ],
          loadChildrenOptions(parentNode, callback) {
            callback(null, /* non-arry */ null)
          },
        },
        data: {
          isOpen: true,
        },
      })
      const { vm } = wrapper

      vm.toggleExpanded(vm.nodeMap.a)
      await vm.$nextTick()
      expect(vm.nodeMap.a.loadingChildrenError).toBe('Received unrecognizable data')
      expect(console.error).toHaveBeenCalledWith(
        '[Vue-Treeselect Warning]',
        'Received unrecognizable data null while loading children options of node a'
      )
      done()
    })
  })

  describe('searchable', () => {
    describe('when searchable=true', () => {
      describe('when multiple=true', () => {
        it('should show input', () => {
          const wrapper = mount(Treeselect, {
            propsData: {
              multiple: true,
              searchable: true,
              options: [],
            },
          })

          expect(wrapper.contains('.vue-treeselect__input-wrapper .vue-treeselect__input')).toBe(true)
        })

        it('should auto resize when length of input value changes', () => {
          // This is currently impossible since both PhantomJS and Headless Chrome
          // always return 0 for `clientWidth`, `offsetWidth` and etc.
        })
      })

      describe('when multiple=false', () => {
        it('should show input', () => {
          const wrapper = mount(Treeselect, {
            propsData: {
              multiple: false,
              searchable: true,
              options: [],
            },
          })

          expect(wrapper.contains('.vue-treeselect__input-wrapper .vue-treeselect__input')).toBe(true)
        })
      })

      it('entering search query', async done => {
        const wrapper = mount(Treeselect, {
          propsData: {
            searchable: true,
            options: [],
          },
        })

        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          searching: false,
          searchQuery: '',
        }))

        await typeSearchText(wrapper, '$SEARCH_QUERY$')
        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          searching: true,
          searchQuery: '$SEARCH_QUERY$',
        }))

        await typeSearchText(wrapper, '')
        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          searching: false,
          searchQuery: '',
        }))

        done()
      })

      it('filtering', async done => {
        const wrapper = mount(Treeselect, {
          propsData: {
            multiple: true,
            searchable: true,
            options: [ {
              id: 'a',
              label: 'a',
              children: [ {
                id: 'aa',
                label: 'aa',
              }, {
                id: 'ab',
                label: 'ab',
              } ],
            }, {
              id: 'b',
              label: 'b',
            } ],
          },
          data: {
            isOpen: true,
          },
        })

        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          noSearchResults: true,
        }))

        await typeSearchText(wrapper, 'b')
        expect(wrapper.data()).toEqual(jasmine.objectContaining({
          noSearchResults: false,
        }))

        const expectedMatchedNodeIds = [ 'ab', 'b' ]
        const optionWrappers = wrapper.find(TreeselectOption)
        expect(optionWrappers.length).toBe(4)
        optionWrappers.forEach(optionWrapper => {
          const { node } = optionWrapper.instance()
          expect(node.isMatched).toBe(expectedMatchedNodeIds.indexOf(node.id) !== -1)
        })

        done()
      })
    })

    describe('when searchable=false', () => {
      describe('when multiple=true', () => {
        it('should not show input but a placeholder', () => {
          const wrapper = mount(Treeselect, {
            propsData: {
              multiple: true,
              searchable: false,
              options: [],
            },
          })

          expect(wrapper.contains('.vue-treeselect__input-wrapper')).toBe(true)
          expect(wrapper.first('.vue-treeselect__input-wrapper').isEmpty()).toBe(true)
        })
      })

      describe('when multiple=false', () => {
        it('should not show input but a placeholder', () => {
          const wrapper = mount(Treeselect, {
            propsData: {
              multiple: false,
              searchable: false,
              options: [],
            },
          })

          expect(wrapper.contains('.vue-treeselect__input-wrapper')).toBe(true)
          expect(wrapper.first('.vue-treeselect__input-wrapper').isEmpty()).toBe(true)
        })
      })
    })
  })

  describe('sortValueBy', () => {
    function createArray(len, fn) {
      const arr = []
      let i = 0
      while (i < len) arr.push(fn(i++))
      return arr
    }

    function generateOptions(max) {
      return (function generate(parent) {
        return createArray(max, i => {
          const id = parent + String.fromCharCode(97 + i)
          const curr = { id, label: id }
          if (id.length < max) curr.children = generate(id)
          return curr
        })
      })('')
    }

    it('when sortValueBy="ORDER_SELECTED"', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          multiple: true,
          options: generateOptions(4),
          sortValueBy: 'ORDER_SELECTED',
        },
      })
      const { vm } = wrapper
      const { a, bb, ccc, dddd } = vm.nodeMap

      expect(vm.internalValue).toEqual([])
      vm.select(bb)
      expect(vm.internalValue).toEqual([ 'bb' ])
      vm.select(a)
      expect(vm.internalValue).toEqual([ 'bb', 'a' ])
      vm.select(dddd)
      expect(vm.internalValue).toEqual([ 'bb', 'a', 'dddd' ])
      vm.select(ccc)
      expect(vm.internalValue).toEqual([ 'bb', 'a', 'dddd', 'ccc' ])
    })

    it('when sortValueBy="LEVEL"', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          multiple: true,
          options: generateOptions(4),
          sortValueBy: 'LEVEL',
        },
      })
      const { vm } = wrapper
      const { aaa, ab, bb, c, dddd } = vm.nodeMap

      expect(vm.internalValue).toEqual([])
      vm.select(bb)
      expect(vm.internalValue).toEqual([ 'bb' ])
      vm.select(aaa)
      expect(vm.internalValue).toEqual([ 'bb', 'aaa' ])
      vm.select(dddd)
      expect(vm.internalValue).toEqual([ 'bb', 'aaa', 'dddd' ])
      vm.select(c)
      expect(vm.internalValue).toEqual([ 'c', 'bb', 'aaa', 'dddd' ])
      vm.select(ab)
      expect(vm.internalValue).toEqual([ 'c', 'ab', 'bb', 'aaa', 'dddd' ])
    })

    it('when sortValueBy="INDEX"', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          multiple: true,
          options: generateOptions(4),
          sortValueBy: 'INDEX',
        },
      })
      const { vm } = wrapper
      const { aaaa, bbb, cc, d } = vm.nodeMap

      expect(vm.internalValue).toEqual([])
      vm.select(d)
      expect(vm.internalValue).toEqual([ 'd' ])
      vm.select(bbb)
      expect(vm.internalValue).toEqual([ 'bbb', 'd' ])
      vm.select(aaaa)
      expect(vm.internalValue).toEqual([ 'aaaa', 'bbb', 'd' ])
      vm.select(cc)
      expect(vm.internalValue).toEqual([ 'aaaa', 'bbb', 'cc', 'd' ])
    })

    it('should re-sort value immediately after component gets initialized', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          multiple: true,
          options: generateOptions(4),
          sortValueBy: 'LEVEL',
          value: [ 'aaa', 'bb', 'c' ],
        },
      })
      const { vm } = wrapper

      expect(vm.internalValue).toEqual([ 'c', 'bb', 'aaa' ])
    })

    it('should re-sort value after prop value changes', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          multiple: true,
          options: generateOptions(4),
          sortValueBy: 'LEVEL',
          value: [ 'aaa', 'bb', 'c' ],
        },
      })

      expect(wrapper.vm.internalValue).toEqual([ 'c', 'bb', 'aaa' ])
      wrapper.setProps({ sortValueBy: 'INDEX' })
      expect(wrapper.vm.internalValue).toEqual([ 'aaa', 'bb', 'c' ])
      wrapper.setProps({ sortValueBy: 'LEVEL' })
      expect(wrapper.vm.internalValue).toEqual([ 'c', 'bb', 'aaa' ])
    })
  })
})

describe('Methods', () => {
  describe('toggleExpanded()', () => {
    it('basic', () => {
      const wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
            children: [ {
              id: 'aa',
              label: 'aa',
            } ],
          } ],
        },
      })
      const { vm } = wrapper
      const { a } = vm.nodeMap

      expect(a.isExpanded).toBe(false)
      wrapper.vm.toggleExpanded(a)
      expect(a.isExpanded).toBe(true)
    })
  })

  it('focusInput() & blurInput()', () => {
    const wrapper = mount(Treeselect, {
      attachToDocument: true,
      propsData: {
        options: [],
        disabled: false,
        searchable: true,
        autofocus: false,
      },
    })

    expect(wrapper.data().isFocused).toBe(false)
    wrapper.vm.focusInput()
    expect(wrapper.data().isFocused).toBe(true)
    wrapper.vm.blurInput()
    expect(wrapper.data().isFocused).toBe(false)
  })

  describe('openMenu()', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(Treeselect, {
        propsData: {
          options: [],
        },
      })
      expect(wrapper.vm.isOpen).toBe(false)
    })

    it('should activate the menu', () => {
      wrapper.vm.openMenu()
      expect(wrapper.vm.isOpen).toBe(true)
    })

    it('should ignore when disabled=true', () => {
      wrapper.setProps({ disabled: true })
      wrapper.vm.openMenu()
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('closeMenu()', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(Treeselect, {
        propsData: {
          options: [],
        },
        data: {
          isOpen: true,
        },
      })
    })

    it('should close the menu', () => {
      wrapper.vm.closeMenu()
      expect(wrapper.vm.isOpen).toBe(false)
    })
  })

  describe('getNode()', () => {
    let wrapper

    beforeEach(() => {
      wrapper = mount(Treeselect, {
        propsData: {
          options: [ {
            id: 'a',
            label: 'a',
          } ],
        },
      })
    })

    it('should be able to obtain normalized node by id', () => {
      expect(wrapper.vm.getNode('a')).toEqual(jasmine.objectContaining({
        id: 'a',
        label: 'a',
      }))
    })

    it('should warn about invalid node id', () => {
      spyOn(console, 'error')
      wrapper.vm.getNode(null)
      expect(console.error).toHaveBeenCalledWith(
        '[Vue-Treeselect Warning]',
        'Invalid node id: null'
      )
    })
  })
})

describe('Events', () => {
  // TODO
})

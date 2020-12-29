import { h } from 'vue'
import { Options, Vue, setup, prop } from 'vue-class-component'
import { mount, config } from '@vue/test-utils'

import withConfigTransport from './withConfigTransport'
import GlobalConfigPlugin, { GlobalConfig, useGlobalConfig } from '../GlobalConfigPlugin'
import VaConfig from '../../components/vuestic-components/va-config/VaConfig'

const initialConfig = {
  all: { value: 'valueFromContext' },
  ExampleComponent: { propValue: 'propValueFromContext' },
}

config.global.plugins.push([GlobalConfigPlugin, initialConfig])

class Props {
  value = prop<string>({
    default: 'value',
  })

  propValue = prop<string>({
    default: 'propValue',
  })
}

@Options<ExampleComponent>({
  name: 'ExampleComponent',
  methods: {
    optionsMethod: function () {
      return this.value
    },
  },
  emits: ['update'],
})
class ExampleComponent extends Vue.with(Props) {
  globalConfig = setup(() => {
    return useGlobalConfig()
  })

  testMethod () {
    return `${this.value} ${this.propValue}`
  }

  handleClick () {
    this.$emit('update', this.value)
  }

  render () {
    return h(
      'div',
      {
        class: 'example-component',
        onClick: this.handleClick,
      },
    )
  }
}

describe('withConfigTransport', () => {
  it('should pass the context props to the child', (done) => {
    const wrapper = mount(
      {
        render: () => h(
          withConfigTransport(ExampleComponent),
        ),
      })

    const instance = wrapper.findComponent({ name: 'ExampleComponent' }).vm

    expect((instance as any).propValue).toBe('propValueFromContext')

    expect((instance as any).value).toBe('valueFromContext')

    ;(instance as any).globalConfig.setGlobalConfig((config: GlobalConfig) => ({
      ...config,
      all: { value: 'updateValueFromContext' },
    }))

    instance.$nextTick(() => {
      expect((instance as any).value).toBe('updateValueFromContext')
      done()
    })

    ;(instance as any).globalConfig.setGlobalConfig((config: GlobalConfig) => ({
      ...config,
      ExampleComponent: { propValue: 'updatePropValueFromContext' },
    }))

    expect((instance as any).propValue).toBe('propValueFromContext')

    instance.$nextTick(() => {
      expect((instance as any).propValue).toBe('updatePropValueFromContext')
      done()
    })
  })

  it('should take a local prop', async () => {
    const wrapper = mount(
      {
        render: () => h(
          withConfigTransport(ExampleComponent),
          {
            value: 'local value',
          },
        ),
      })

    let instance = wrapper.findComponent({ name: 'ExampleComponent' }).vm

    expect((instance as any).value).toBe('local value')

    await wrapper.setProps({ value: undefined })

    instance = wrapper.findComponent({ name: 'ExampleComponent' }).vm

    expect((instance as any).value).toBe('valueFromContext')
  })

  it('should take a local context prop', async () => {
    const WithConfigTransportExampleComponent = withConfigTransport(ExampleComponent)

    const root = mount(
      {
        render () {
          return h(
            VaConfig,
            {
              config: {
                ExampleComponent: {
                  value: 'local context value',
                  propValue: 'local context propValue',
                },
              },
            },
            [h(WithConfigTransportExampleComponent)],
          )
        },
      })

    const wrapper = root.findComponent({ name: 'ExampleComponent' })

    const instance = wrapper.vm

    expect((instance as any).value).toBe('local context value')
    expect((instance as any).propValue).toBe('local context propValue')
  })

  it("should work with child's methods", () => {
    const wrapper = mount(
      {
        render: () => h(
          withConfigTransport(ExampleComponent),
          {
            ref: 'example',
          },
        ),
      })

    const instance = wrapper.findComponent({ ref: 'example' }).vm

    expect((instance as any).testMethod()).toBe('valueFromContext propValueFromContext')
    expect((instance as any).optionsMethod()).toBe('valueFromContext')
  })

  it("should work with child's emits", () => {
    const handleClick = jest.fn()

    const wrapper = mount(
      {
        render: () => h(
          withConfigTransport(ExampleComponent),
          {
            ref: 'example',
            onUpdate: handleClick,
          },
        ),
      })

    wrapper.find('.example-component').trigger('click')

    expect(handleClick).toHaveBeenCalledWith('valueFromContext')
  })
})
